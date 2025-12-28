package com.seasonalseiyuu.model;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for VoiceActorSummary DTO.
 */
class VoiceActorSummaryTest {

    @Test
    void from_mapsFieldsCorrectly() {
        // Given
        Anime anime = new Anime(12345, "Test Anime", "Test EN", "img.jpg", "Synopsis", "fall", 2025);
        Character character = new Character(1001, "Test Char", "char.jpg", "Main");
        Role role = new Role(anime, character);
        VoiceActor va = VoiceActor.create(2001, "Test VA", "va.jpg", List.of(role), List.of(role));

        // When
        VoiceActorSummary summary = VoiceActorSummary.from(va);

        // Then
        assertEquals(2001, summary.malId());
        assertEquals("Test VA", summary.name());
        assertEquals("va.jpg", summary.imageUrl());
        assertEquals(1, summary.totalSeasonalShows());
    }

    @Test
    void from_calculatesSeasonalShowsFromRoles() {
        // Given - VA with 3 roles across 2 unique shows
        Anime anime1 = new Anime(1, "Anime 1", null, "", "", "", 0);
        Anime anime2 = new Anime(2, "Anime 2", null, "", "", "", 0);
        Character char1 = new Character(101, "C1", "", "");
        Character char2 = new Character(102, "C2", "", "");
        Character char3 = new Character(103, "C3", "", "");

        List<Role> seasonalRoles = List.of(
                new Role(anime1, char1),
                new Role(anime1, char2), // Same anime, different character
                new Role(anime2, char3));

        VoiceActor va = VoiceActor.create(2001, "Multi-Role VA", "va.jpg", seasonalRoles, List.of());

        // When
        VoiceActorSummary summary = VoiceActorSummary.from(va);

        // Then
        assertEquals(2, summary.totalSeasonalShows(), "Should count 2 unique anime, not 3 roles");
    }

    @Test
    void from_handlesEmptySeasonalRoles() {
        // Given
        VoiceActor va = VoiceActor.create(2001, "No Shows VA", "va.jpg", List.of(), List.of());

        // When
        VoiceActorSummary summary = VoiceActorSummary.from(va);

        // Then
        assertEquals(0, summary.totalSeasonalShows());
    }
}
