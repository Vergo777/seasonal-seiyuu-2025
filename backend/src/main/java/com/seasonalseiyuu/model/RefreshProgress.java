package com.seasonalseiyuu.model;

import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Versioned, season-scoped checkpoint for a refresh run.
 *
 * <p>The complete accumulator is stored at each checkpoint. This is
 * intentional: a checkpoint must contain enough information to rebuild the
 * candidate without relying on mutable state from the interrupted JVM.</p>
 */
public record RefreshProgress(
        int formatVersion,
        String season,
        int year,
        Set<Integer> fetchedAnimeIds,
        Set<Integer> fetchedVoiceActorIds,
        Map<Integer, List<Role>> seasonalRoles,
        Map<Integer, VoiceActorInput> voiceActorInputs,
        Map<Integer, VoiceActor> partialVoiceActors,
        Set<Integer> incompleteAnimeIds,
        RefreshPhase currentPhase,
        int totalAnime,
        int totalVoiceActors) {

    public static final int CURRENT_FORMAT_VERSION = 2;

    public RefreshProgress {
        season = season == null ? "" : season;
        fetchedAnimeIds = fetchedAnimeIds == null ? Set.of() : Set.copyOf(fetchedAnimeIds);
        fetchedVoiceActorIds = fetchedVoiceActorIds == null ? Set.of() : Set.copyOf(fetchedVoiceActorIds);
        seasonalRoles = seasonalRoles == null ? Map.of() : Map.copyOf(seasonalRoles);
        voiceActorInputs = voiceActorInputs == null ? Map.of() : Map.copyOf(voiceActorInputs);
        partialVoiceActors = partialVoiceActors == null ? Map.of() : Map.copyOf(partialVoiceActors);
        incompleteAnimeIds = incompleteAnimeIds == null ? Set.of() : Set.copyOf(incompleteAnimeIds);
        currentPhase = currentPhase == null ? RefreshPhase.FETCHING_ANIME : currentPhase;
    }

    /** Compatibility constructor for the original eight-field JSON model. */
    public RefreshProgress(
            String season,
            int year,
            Set<Integer> fetchedAnimeIds,
            Set<Integer> fetchedVoiceActorIds,
            Map<Integer, VoiceActor> partialVoiceActors,
            RefreshPhase currentPhase,
            int totalAnime,
            int totalVoiceActors) {
        this(CURRENT_FORMAT_VERSION, season, year, fetchedAnimeIds, fetchedVoiceActorIds,
                Map.of(), Map.of(), partialVoiceActors, Set.of(), currentPhase, totalAnime, totalVoiceActors);
    }

    public enum RefreshPhase {
        FETCHING_ANIME,
        FETCHING_CHARACTERS,
        FETCHING_VA_ROLES,
        COMPLETE
    }

    public static RefreshProgress start(String season, int year) {
        return new RefreshProgress(
                CURRENT_FORMAT_VERSION, season, year,
                Set.of(), Set.of(), Map.of(), Map.of(), Map.of(), Set.of(),
                RefreshPhase.FETCHING_ANIME, 0, 0);
    }

    public boolean isCompatibleWith(String detectedSeason, int detectedYear) {
        return formatVersion == CURRENT_FORMAT_VERSION
                && season.equalsIgnoreCase(detectedSeason)
                && year == detectedYear;
    }
}
