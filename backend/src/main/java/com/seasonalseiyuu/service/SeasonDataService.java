package com.seasonalseiyuu.service;

import com.seasonalseiyuu.model.*;
import com.seasonalseiyuu.service.JikanApiService.CharacterVoiceActor;
import com.seasonalseiyuu.service.JikanApiService.SeasonAnimeResult;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicReference;

/**
 * Service for managing season data - coordinates fetching, caching, and
 * refresh.
 */
@Service
public class SeasonDataService {

    private static final Logger log = LoggerFactory.getLogger(SeasonDataService.class);

    private final JikanApiService jikanApi;
    private final CacheService cacheService;

    private final AtomicBoolean refreshInProgress = new AtomicBoolean(false);
    private final AtomicReference<RefreshStatus> currentStatus = new AtomicReference<>(
            new RefreshStatus(false, "", 0, 0));

    public SeasonDataService(JikanApiService jikanApi, CacheService cacheService) {
        this.jikanApi = jikanApi;
        this.cacheService = cacheService;
    }

    /**
     * Gets all voice actors from cache.
     */
    public Optional<SeasonCache> getSeasonData() {
        return cacheService.loadCache();
    }

    /**
     * Gets a specific voice actor by ID.
     */
    public Optional<VoiceActor> getVoiceActor(int malId) {
        return cacheService.loadCache()
                .map(cache -> cache.voiceActors().get(malId));
    }

    /**
     * Gets current refresh status.
     */
    public RefreshStatus getRefreshStatus() {
        return currentStatus.get();
    }

    /**
     * Starts or resumes a data refresh.
     * 
     * @return true if refresh started, false if already in progress
     */
    public boolean startRefresh() {
        if (!refreshInProgress.compareAndSet(false, true)) {
            log.warn("Refresh already in progress");
            return false;
        }

        Thread.startVirtualThread(this::executeRefresh);
        return true;
    }

    private void executeRefresh() {
        try {
            log.info("Starting data refresh");
            updateStatus("Fetching seasonal anime...", 0, 100);

            // Check for existing progress
            Optional<RefreshProgress> existingProgress = cacheService.loadProgress();

            // Step 1: Fetch all seasonal anime
            SeasonAnimeResult animeResult = jikanApi.getCurrentSeasonAnime();
            List<Anime> seasonalAnime = animeResult.anime();

            // Deduplicate anime by MAL ID (Jikan API sometimes returns duplicates)
            int originalCount = seasonalAnime.size();
            Map<Integer, Anime> uniqueAnimeMap = new LinkedHashMap<>();
            for (Anime anime : seasonalAnime) {
                uniqueAnimeMap.putIfAbsent(anime.malId(), anime);
            }
            seasonalAnime = new ArrayList<>(uniqueAnimeMap.values());
            if (seasonalAnime.size() < originalCount) {
                log.warn("Removed {} duplicate anime entries from API response",
                        originalCount - seasonalAnime.size());
            }

            if (seasonalAnime.isEmpty()) {
                log.error("No anime found for current season");
                updateStatus("Error: No anime found", 0, 0);
                return;
            }

            // Validation check #1: Anime count matches expected
            if (!animeResult.isComplete()) {
                log.warn("VALIDATION WARNING: Fetched {} anime but API reports {} expected",
                        seasonalAnime.size(), animeResult.expectedTotal());
            } else {
                log.info("VALIDATION PASSED: Anime count matches expected ({})", animeResult.expectedTotal());
            }

            String season = seasonalAnime.get(0).season();
            int year = seasonalAnime.get(0).year();
            log.info("Processing {} {} season with {} anime", season, year, seasonalAnime.size());

            // Determine which anime to process (skip already processed if resuming)
            Set<Integer> processedAnimeIds = existingProgress
                    .map(RefreshProgress::fetchedAnimeIds)
                    .orElse(Set.of());
            Set<Integer> processedVaIds = existingProgress
                    .map(RefreshProgress::fetchedVoiceActorIds)
                    .orElse(Set.of());
            Map<Integer, VoiceActor> voiceActorMap = new HashMap<>(existingProgress
                    .map(RefreshProgress::partialVoiceActors)
                    .orElse(Map.of()));

            // Build a map of anime by ID for easy lookup
            Map<Integer, Anime> animeById = new HashMap<>();
            for (Anime anime : seasonalAnime) {
                animeById.put(anime.malId(), anime);
            }

            // Step 2: Fetch characters for each anime
            int processed = processedAnimeIds.size();
            int total = seasonalAnime.size();

            // Collect VA seasonal roles
            Map<Integer, List<Role>> vaSeasonalRoles = new HashMap<>();
            Map<Integer, String> vaNames = new HashMap<>();
            Map<Integer, String> vaImages = new HashMap<>();

            for (Anime anime : seasonalAnime) {
                if (processedAnimeIds.contains(anime.malId())) {
                    continue; // Skip already processed
                }

                processed++;
                updateStatus("Fetching characters: " + anime.title(),
                        (int) ((processed / (double) total) * 50), 100);

                List<CharacterVoiceActor> characters = jikanApi.getAnimeCharacters(anime.malId());

                // Validation check #2: Track anime with zero characters
                if (characters.isEmpty()) {
                    log.warn("VALIDATION WARNING: Anime '{}' (ID: {}) returned 0 characters",
                            anime.title(), anime.malId());
                }

                for (CharacterVoiceActor cva : characters) {
                    int vaId = cva.voiceActorMalId();
                    vaNames.putIfAbsent(vaId, cva.voiceActorName());
                    vaImages.putIfAbsent(vaId, cva.voiceActorImageUrl());

                    vaSeasonalRoles.computeIfAbsent(vaId, k -> new ArrayList<>())
                            .add(new Role(anime, cva.character()));
                }

                // Save progress after each anime
                Set<Integer> newProcessedAnime = new HashSet<>(processedAnimeIds);
                newProcessedAnime.add(anime.malId());

                cacheService.saveProgress(new RefreshProgress(
                        season, year,
                        newProcessedAnime, processedVaIds,
                        voiceActorMap,
                        RefreshProgress.RefreshPhase.FETCHING_CHARACTERS,
                        total, vaSeasonalRoles.size()));
            }

            // Step 3: Fetch all-time roles for each voice actor
            List<Integer> vaIds = new ArrayList<>(vaSeasonalRoles.keySet());
            int vaProcessed = 0;
            int vaTotal = vaIds.size();

            for (int vaId : vaIds) {
                if (processedVaIds.contains(vaId)) {
                    vaProcessed++;
                    continue;
                }

                vaProcessed++;
                String vaName = vaNames.getOrDefault(vaId, "Unknown");
                updateStatus("Fetching VA roles: " + vaName,
                        50 + (int) ((vaProcessed / (double) vaTotal) * 50), 100);

                List<Role> allTimeRoles = jikanApi.getPersonVoiceRoles(vaId);
                List<Role> seasonalRoles = vaSeasonalRoles.get(vaId);

                VoiceActor va = VoiceActor.create(
                        vaId,
                        vaName,
                        vaImages.getOrDefault(vaId, ""),
                        seasonalRoles,
                        allTimeRoles);
                voiceActorMap.put(vaId, va);

                // Save progress after each VA
                Set<Integer> newProcessedVaIds = new HashSet<>(processedVaIds);
                newProcessedVaIds.add(vaId);

                cacheService.saveProgress(new RefreshProgress(
                        season, year,
                        Set.copyOf(animeById.keySet()), newProcessedVaIds,
                        voiceActorMap,
                        RefreshProgress.RefreshPhase.FETCHING_VA_ROLES,
                        total, vaTotal));
            }

            // Step 4: Save final cache
            SeasonCache cache = new SeasonCache(season, year, Instant.now(), voiceActorMap);
            cacheService.saveCache(cache);
            cacheService.deleteProgress();

            updateStatus("Complete", 100, 100);
            log.info("Refresh complete: {} voice actors cached", voiceActorMap.size());

        } catch (Exception e) {
            log.error("Refresh failed", e);
            updateStatus("Error: " + e.getMessage(), 0, 0);
        } finally {
            refreshInProgress.set(false);
        }
    }

    private void updateStatus(String message, int current, int total) {
        currentStatus.set(new RefreshStatus(refreshInProgress.get(), message, current, total));
    }

    public record RefreshStatus(boolean inProgress, String message, int current, int total) {
    }
}
