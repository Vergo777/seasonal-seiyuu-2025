package com.seasonalseiyuu.model;

/**
 * Summary of a voice actor for grid views and lists - excludes career role
 * lists for performance.
 */
public record VoiceActorSummary(
        int malId,
        String name,
        String imageUrl,
        int totalSeasonalShows,
        int totalCareerRoles) {

    public static VoiceActorSummary from(VoiceActor va) {
        return new VoiceActorSummary(
                va.malId(),
                va.name(),
                va.imageUrl(),
                va.totalSeasonalShows(),
                va.allTimeRoles() != null ? va.allTimeRoles().size() : 0);
    }
}
