package com.seasonalseiyuu.service;

import com.seasonalseiyuu.config.RefreshProperties;
import com.seasonalseiyuu.model.*;
import com.seasonalseiyuu.service.AnimeDataApiService.CharacterVoiceActor;
import com.seasonalseiyuu.service.AnimeDataApiService.SeasonAnimeResult;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicReference;

/** Coordinates one-flight, resumable refreshes and publication of snapshots. */
@Service
public class SeasonDataService {
    private static final Logger log = LoggerFactory.getLogger(SeasonDataService.class);

    private final AnimeDataApiService animeDataApi;
    private final CacheService cacheService;
    private final RefreshProperties refreshProperties;
    private final AtomicBoolean refreshInProgress = new AtomicBoolean(false);
    private final AtomicReference<RefreshStatus> currentStatus = new AtomicReference<>(RefreshStatus.idle());
    private final AtomicReference<RefreshHealth> currentHealth = new AtomicReference<>(RefreshHealth.empty());

    @Autowired
    public SeasonDataService(AnimeDataApiService animeDataApi, CacheService cacheService,
                             RefreshProperties refreshProperties) {
        this.animeDataApi = animeDataApi;
        this.cacheService = cacheService;
        this.refreshProperties = refreshProperties;
    }

    /** Compatibility constructor for focused unit tests. */
    public SeasonDataService(AnimeDataApiService animeDataApi, CacheService cacheService) {
        this(animeDataApi, cacheService, new RefreshProperties());
    }

    public Optional<SeasonCache> getSeasonData() { return cacheService.loadCache(); }

    public Optional<VoiceActor> getVoiceActor(int malId) {
        return cacheService.loadCache().map(cache -> cache.voiceActors().get(malId));
    }

    public RefreshStatus getRefreshStatus() {
        RefreshStatus status = currentStatus.get();
        RefreshHealth health = currentHealth();
        return status.withHealth(health);
    }

    public RefreshHealth getRefreshHealth() { return currentHealth(); }

    public boolean startRefresh() {
        if (!refreshInProgress.compareAndSet(false, true)) {
            log.warn("Refresh already in progress; trigger skipped");
            return false;
        }
        Thread.startVirtualThread(this::executeRefresh);
        return true;
    }

    /** Synchronous entry point useful to scheduler tests and operational tooling. */
    public boolean refreshNow() {
        if (!refreshInProgress.compareAndSet(false, true)) return false;
        executeRefresh();
        return true;
    }

    public boolean isCacheStale() {
        return cacheService.loadCache()
                .map(cache -> cache.lastRefreshed() == null
                        || cache.lastRefreshed().plus(refreshProperties.getFreshnessThreshold()).isBefore(Instant.now()))
                .orElse(true);
    }

    private void executeRefresh() {
        Instant attempt = Instant.now();
        Optional<SeasonCache> activeBefore = cacheService.loadCache();
        String activeSeason = activeBefore.map(SeasonCache::season).orElse(null);
        Integer activeYear = activeBefore.map(SeasonCache::year).orElse(null);
        String candidateSeason = null;
        Integer candidateYear = null;
        Accumulator accumulator = null;

        setHealth(new RefreshHealth(attempt, currentHealth().lastSuccess(), "running", "Refresh started",
                activeSeason, activeYear, null, null, currentHealth().incompleteAnimeCount()));
        updateStatus("Fetching seasonal anime...", 0, 0, null);
        try {
            SeasonAnimeResult animeResult = animeDataApi.getCurrentSeasonAnime();
            if (!animeResult.isComplete() || animeResult.anime().isEmpty()) {
                throw new RefreshFailure("Season pagination was incomplete");
            }

            List<Anime> seasonalAnime = deduplicate(animeResult.anime());
            Anime first = seasonalAnime.get(0);
            candidateSeason = first.season();
            candidateYear = first.year();
            validateSeasonIdentity(seasonalAnime, candidateSeason, candidateYear);
            setHealth(new RefreshHealth(attempt, currentHealth().lastSuccess(), "running", "Processing candidate season",
                    activeSeason, activeYear, candidateSeason, candidateYear, 0));

            Optional<RefreshProgress> saved = cacheService.loadProgress();
            if (saved.isPresent() && saved.get().isCompatibleWith(candidateSeason, candidateYear)) {
                accumulator = Accumulator.resume(saved.get(), seasonalAnime, candidateSeason, candidateYear);
                log.info("Resuming compatible refresh progress for {} {}", candidateSeason, candidateYear);
            } else {
                if (saved.isPresent()) cacheService.deleteProgress();
                accumulator = Accumulator.start(seasonalAnime, candidateSeason, candidateYear);
            }
            accumulator.totalAnime = seasonalAnime.size();
            checkpoint(accumulator, RefreshProgress.RefreshPhase.FETCHING_CHARACTERS);

            Map<Integer, Anime> animeById = new LinkedHashMap<>();
            seasonalAnime.forEach(anime -> animeById.put(anime.malId(), anime));
            for (Anime anime : seasonalAnime) {
                boolean previouslyIncomplete = accumulator.incompleteAnimeIds.contains(anime.malId());
                if (accumulator.fetchedAnimeIds.contains(anime.malId()) && !previouslyIncomplete) continue;

                updateStatus("Fetching characters: " + safeTitle(anime.title()),
                        accumulator.fetchedAnimeIds.size(), seasonalAnime.size(), accumulator);
                List<CharacterVoiceActor> characters = animeDataApi.getAnimeCharacters(anime.malId());
                removeRolesForAnime(accumulator.seasonalRoles, anime.malId());
                if (characters.isEmpty()) {
                    accumulator.incompleteAnimeIds.add(anime.malId());
                } else {
                    accumulator.incompleteAnimeIds.remove(anime.malId());
                    for (CharacterVoiceActor cva : characters) {
                        if (cva.voiceActorMalId() <= 0) continue;
                        accumulator.voiceActorInputs.putIfAbsent(cva.voiceActorMalId(),
                                new VoiceActorInput(cva.voiceActorName(), cva.voiceActorImageUrl()));
                        accumulator.seasonalRoles.computeIfAbsent(cva.voiceActorMalId(), ignored -> new ArrayList<>())
                                .add(new Role(anime, cva.character()));
                    }
                }
                accumulator.fetchedAnimeIds.add(anime.malId());
                // New/rechecked roles can change a VA's seasonal data; require its career request again.
                for (CharacterVoiceActor cva : characters) {
                    accumulator.fetchedVoiceActorIds.remove(cva.voiceActorMalId());
                    accumulator.partialVoiceActors.remove(cva.voiceActorMalId());
                }
                checkpoint(accumulator, RefreshProgress.RefreshPhase.FETCHING_CHARACTERS);
            }

            Set<Integer> requiredVoiceActors = new TreeSet<>(accumulator.seasonalRoles.keySet());
            accumulator.totalVoiceActors = requiredVoiceActors.size();
            checkpoint(accumulator, RefreshProgress.RefreshPhase.FETCHING_VA_ROLES);
            int vaIndex = 0;
            for (int vaId : requiredVoiceActors) {
                vaIndex++;
                if (accumulator.fetchedVoiceActorIds.contains(vaId)
                        && accumulator.partialVoiceActors.containsKey(vaId)) continue;
                VoiceActorInput input = accumulator.voiceActorInputs.getOrDefault(vaId, new VoiceActorInput("Unknown", ""));
                updateStatus("Fetching VA roles: " + safeTitle(input.name()), vaIndex, requiredVoiceActors.size(), accumulator);
                List<Role> allTimeRoles = animeDataApi.getPersonVoiceRoles(vaId);
                VoiceActor actor = VoiceActor.create(vaId, input.name(), input.imageUrl(),
                        List.copyOf(accumulator.seasonalRoles.getOrDefault(vaId, List.of())), allTimeRoles);
                accumulator.partialVoiceActors.put(vaId, actor);
                accumulator.fetchedVoiceActorIds.add(vaId);
                checkpoint(accumulator, RefreshProgress.RefreshPhase.FETCHING_VA_ROLES);
            }

            SeasonCache candidate = new SeasonCache(candidateSeason, candidateYear, Instant.now(),
                    completeActorMap(accumulator, requiredVoiceActors));
            validateCandidate(candidate, seasonalAnime, accumulator, requiredVoiceActors);
            cacheService.saveCache(candidate);
            cacheService.deleteProgress();

            Instant success = Instant.now();
            setHealth(new RefreshHealth(attempt, success, "success",
                    "Published " + candidate.voiceActors().size() + " voice actors",
                    candidate.season(), candidate.year(), candidate.season(), candidate.year(),
                    accumulator.incompleteAnimeIds.size()));
            updateStatus("Complete", 100, 100, accumulator);
            log.info("Refresh complete: {} voice actors cached; {} incomplete anime",
                    candidate.voiceActors().size(), accumulator.incompleteAnimeIds.size());
        } catch (Exception e) {
            String summary = sanitizeSummary(e);
            log.warn("Refresh failed: {}", summary);
            setHealth(new RefreshHealth(attempt, currentHealth().lastSuccess(), "failed", summary,
                    activeSeason, activeYear, candidateSeason, candidateYear,
                    accumulator == null ? currentHealth().incompleteAnimeCount() : accumulator.incompleteAnimeIds.size()));
            updateStatus("Error: " + summary, 0, 0, accumulator);
        } finally {
            refreshInProgress.set(false);
            currentStatus.updateAndGet(status -> status.withInProgress(false));
        }
    }

    private Map<Integer, VoiceActor> completeActorMap(Accumulator accumulator, Set<Integer> required) {
        Map<Integer, VoiceActor> result = new LinkedHashMap<>();
        required.forEach(id -> {
            VoiceActor actor = accumulator.partialVoiceActors.get(id);
            if (actor != null) result.put(id, actor);
        });
        return result;
    }

    private void checkpoint(Accumulator accumulator, RefreshProgress.RefreshPhase phase) {
        accumulator.phase = phase;
        if (!cacheService.saveProgress(accumulator.toProgress())) {
            throw new RefreshFailure("Unable to checkpoint refresh progress");
        }
    }

    private void validateCandidate(SeasonCache candidate, List<Anime> seasonalAnime,
                                   Accumulator accumulator, Set<Integer> requiredVoiceActors) {
        Set<Integer> animeIds = seasonalAnime.stream().map(Anime::malId).collect(java.util.stream.Collectors.toSet());
        if (!accumulator.fetchedAnimeIds.containsAll(animeIds)) {
            throw new RefreshFailure("Candidate is missing seasonal anime responses");
        }
        if (!accumulator.fetchedVoiceActorIds.containsAll(requiredVoiceActors)
                || candidate.voiceActors().size() != requiredVoiceActors.size()) {
            throw new RefreshFailure("Candidate is missing voice-actor role responses");
        }
        for (Map.Entry<Integer, List<Role>> entry : accumulator.seasonalRoles.entrySet()) {
            VoiceActor actor = candidate.voiceActors().get(entry.getKey());
            if (actor == null || actor.seasonalRoles().size() != entry.getValue().size()
                    || actor.totalSeasonalShows() != (int) entry.getValue().stream()
                    .map(role -> role.anime().malId()).distinct().count()) {
                throw new RefreshFailure("Candidate voice-actor records are inconsistent");
            }
            for (Role role : entry.getValue()) {
                if (!animeIds.contains(role.anime().malId())
                        || !candidate.season().equalsIgnoreCase(role.anime().season())
                        || candidate.year() != role.anime().year()) {
                    throw new RefreshFailure("Candidate contains a role outside the season");
                }
            }
        }
    }

    private void validateSeasonIdentity(List<Anime> anime, String season, int year) {
        if (season == null || season.isBlank() || year <= 0) {
            throw new RefreshFailure("Season response has no usable season identity");
        }
        if (anime.stream().anyMatch(item -> !season.equalsIgnoreCase(item.season()) || year != item.year())) {
            throw new RefreshFailure("Season response contains inconsistent season metadata");
        }
    }

    private List<Anime> deduplicate(List<Anime> anime) {
        Map<Integer, Anime> unique = new LinkedHashMap<>();
        anime.forEach(item -> unique.putIfAbsent(item.malId(), item));
        return List.copyOf(unique.values());
    }

    private void removeRolesForAnime(Map<Integer, List<Role>> roles, int animeId) {
        roles.values().forEach(list -> list.removeIf(role -> role.anime().malId() == animeId));
        roles.values().removeIf(List::isEmpty);
    }

    private void updateStatus(String message, int current, int total, Accumulator accumulator) {
        RefreshHealth health = currentHealth();
        currentStatus.set(new RefreshStatus(true, message, current, total,
                health.lastAttempt(), health.lastSuccess(), health.outcome(),
                health.activeSeason(), health.activeYear(), health.candidateSeason(), health.candidateYear(),
                health.incompleteAnimeCount(), accumulator == null ? null : accumulator.phase.name(),
                accumulator == null ? 0 : accumulator.fetchedAnimeIds.size(),
                accumulator == null ? 0 : accumulator.totalAnime,
                accumulator == null ? 0 : accumulator.fetchedVoiceActorIds.size(),
                accumulator == null ? 0 : accumulator.totalVoiceActors));
    }

    private void setHealth(RefreshHealth health) {
        currentHealth.set(health);
        cacheService.saveRefreshHealth(health);
    }

    private RefreshHealth currentHealth() {
        RefreshHealth memory = currentHealth.get();
        if (memory.outcome().equals("never_run")) {
            return cacheService.loadRefreshHealth().orElse(memory);
        }
        return memory;
    }

    private String sanitizeSummary(Throwable throwable) {
        String message = throwable.getMessage();
        if (message == null || message.isBlank()) message = throwable.getClass().getSimpleName();
        String sanitized = message.replaceAll("[\\r\\n\\t]", " ")
                .replaceAll("(?i)(x-api-key|authorization|cookie)\\s*[:=]\\s*\\S+", "$1=[redacted]");
        return sanitized.substring(0, Math.min(240, sanitized.length()));
    }

    private String safeTitle(String value) { return value == null ? "unknown" : value.replaceAll("[\\r\\n]", " "); }

    private static class Accumulator {
        String season;
        int year;
        int totalAnime;
        int totalVoiceActors;
        RefreshProgress.RefreshPhase phase;
        final Set<Integer> fetchedAnimeIds = new LinkedHashSet<>();
        final Set<Integer> fetchedVoiceActorIds = new LinkedHashSet<>();
        final Map<Integer, List<Role>> seasonalRoles = new LinkedHashMap<>();
        final Map<Integer, VoiceActorInput> voiceActorInputs = new LinkedHashMap<>();
        final Map<Integer, VoiceActor> partialVoiceActors = new LinkedHashMap<>();
        final Set<Integer> incompleteAnimeIds = new LinkedHashSet<>();

        static Accumulator start(List<Anime> anime, String season, int year) {
            Accumulator result = new Accumulator();
            result.season = season; result.year = year; result.totalAnime = anime.size();
            result.phase = RefreshProgress.RefreshPhase.FETCHING_ANIME;
            return result;
        }

        static Accumulator resume(RefreshProgress progress, List<Anime> anime, String season, int year) {
            Accumulator result = start(anime, season, year);
            result.fetchedAnimeIds.addAll(progress.fetchedAnimeIds());
            result.fetchedVoiceActorIds.addAll(progress.fetchedVoiceActorIds());
            progress.seasonalRoles().forEach((id, roles) -> result.seasonalRoles.put(id, new ArrayList<>(roles)));
            result.voiceActorInputs.putAll(progress.voiceActorInputs());
            result.partialVoiceActors.putAll(progress.partialVoiceActors());
            result.incompleteAnimeIds.addAll(progress.incompleteAnimeIds());
            result.phase = progress.currentPhase();
            result.totalAnime = progress.totalAnime() > 0 ? progress.totalAnime() : anime.size();
            result.totalVoiceActors = progress.totalVoiceActors();
            return result;
        }

        RefreshProgress toProgress() {
            Map<Integer, List<Role>> roleCopy = new LinkedHashMap<>();
            seasonalRoles.forEach((id, roles) -> roleCopy.put(id, List.copyOf(roles)));
            return new RefreshProgress(RefreshProgress.CURRENT_FORMAT_VERSION, season, year,
                    fetchedAnimeIds, fetchedVoiceActorIds, roleCopy, voiceActorInputs,
                    partialVoiceActors, incompleteAnimeIds, phase, totalAnime, totalVoiceActors);
        }
    }

    private static class RefreshFailure extends RuntimeException {
        RefreshFailure(String message) { super(message); }
    }

    public record RefreshStatus(
            boolean inProgress, String message, int current, int total,
            Instant lastAttempt, Instant lastSuccess, String outcome,
            String activeSeason, Integer activeYear, String candidateSeason, Integer candidateYear,
            int incompleteAnimeCount, String phase,
            int completedAnime, int totalAnime, int completedVoiceActors, int totalVoiceActors) {
        public RefreshStatus(boolean inProgress, String message, int current, int total) {
            this(inProgress, message, current, total, null, null, "never_run",
                    null, null, null, null, 0, null, 0, 0, 0, 0);
        }

        static RefreshStatus idle() { return new RefreshStatus(false, "Idle", 0, 0); }

        RefreshStatus withHealth(RefreshHealth health) {
            return new RefreshStatus(inProgress, message, current, total,
                    health.lastAttempt(), health.lastSuccess(), health.outcome(), health.activeSeason(),
                    health.activeYear(), health.candidateSeason(), health.candidateYear(),
                    health.incompleteAnimeCount(), phase, completedAnime, totalAnime,
                    completedVoiceActors, totalVoiceActors);
        }

        RefreshStatus withInProgress(boolean value) {
            return new RefreshStatus(value, message, current, total, lastAttempt, lastSuccess, outcome,
                    activeSeason, activeYear, candidateSeason, candidateYear, incompleteAnimeCount, phase,
                    completedAnime, totalAnime, completedVoiceActors, totalVoiceActors);
        }
    }
}
