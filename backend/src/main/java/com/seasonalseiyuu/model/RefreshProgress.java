package com.seasonalseiyuu.model;

import java.util.Map;
import java.util.Set;

/**
 * Tracks refresh progress for resumable operations.
 */
public record RefreshProgress(
        String season,
        int year,
        Set<Integer> fetchedAnimeIds,
        Set<Integer> fetchedVoiceActorIds,
        Map<Integer, VoiceActor> partialVoiceActors,
        RefreshPhase currentPhase,
        int totalAnime,
        int totalVoiceActors) {
    public enum RefreshPhase {
        FETCHING_ANIME,
        FETCHING_CHARACTERS,
        FETCHING_VA_ROLES,
        COMPLETE
    }

    public static RefreshProgress start(String season, int year) {
        return new RefreshProgress(
                season, year,
                Set.of(), Set.of(), Map.of(),
                RefreshPhase.FETCHING_ANIME,
                0, 0);
    }
}
