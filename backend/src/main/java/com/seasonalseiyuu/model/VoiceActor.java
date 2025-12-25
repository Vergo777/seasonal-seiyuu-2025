package com.seasonalseiyuu.model;

import java.util.List;

/**
 * Represents a voice actor (seiyuu).
 */
public record VoiceActor(
        int malId,
        String name,
        String imageUrl,
        List<Role> seasonalRoles,
        List<Role> allTimeRoles,
        int totalSeasonalShows) {
    /**
     * Creates a VoiceActor with computed totalSeasonalShows.
     */
    public static VoiceActor create(int malId, String name, String imageUrl,
            List<Role> seasonalRoles, List<Role> allTimeRoles) {
        int uniqueShows = (int) seasonalRoles.stream()
                .map(role -> role.anime().malId())
                .distinct()
                .count();
        return new VoiceActor(malId, name, imageUrl, seasonalRoles, allTimeRoles, uniqueShows);
    }
}
