package com.seasonalseiyuu.service;

import com.seasonalseiyuu.model.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

/**
 * Unit tests for CompareService.
 * Uses Mockito to mock SeasonDataService dependency.
 */
@ExtendWith(MockitoExtension.class)
class CompareServiceTest {

    @Mock
    private SeasonDataService seasonDataService;

    private CompareService compareService;

    @BeforeEach
    void setUp() {
        compareService = new CompareService(seasonDataService);
    }

    @Test
    void compare_findsSharedAnime() {
        // Given - Two VAs who both appear in anime 12345
        VoiceActor va1 = createVoiceActor(1, "VA 1", List.of(
                createRole(12345, "Shared Anime", 1001, "Character A"),
                createRole(99999, "Only VA1 Anime", 1002, "Character B")));
        VoiceActor va2 = createVoiceActor(2, "VA 2", List.of(
                createRole(12345, "Shared Anime", 2001, "Character X"),
                createRole(88888, "Only VA2 Anime", 2002, "Character Y")));

        when(seasonDataService.getVoiceActor(1)).thenReturn(Optional.of(va1));
        when(seasonDataService.getVoiceActor(2)).thenReturn(Optional.of(va2));

        // When
        CompareResult result = compareService.compare(1, 2);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.sharedAnime()).hasSize(1);

        CompareResult.SharedAnime shared = result.sharedAnime().get(0);
        assertThat(shared.malId()).isEqualTo(12345);
        assertThat(shared.title()).isEqualTo("Shared Anime");
        assertThat(shared.characters1()).hasSize(1);
        assertThat(shared.characters2()).hasSize(1);
        assertThat(shared.characters1().get(0).name()).isEqualTo("Character A");
        assertThat(shared.characters2().get(0).name()).isEqualTo("Character X");
    }

    @Test
    void compare_returnsEmptyListWhenNoShared() {
        // Given - Two VAs with no common anime
        VoiceActor va1 = createVoiceActor(1, "VA 1", List.of(
                createRole(11111, "Anime A", 1001, "Char A")));
        VoiceActor va2 = createVoiceActor(2, "VA 2", List.of(
                createRole(22222, "Anime B", 2001, "Char B")));

        when(seasonDataService.getVoiceActor(1)).thenReturn(Optional.of(va1));
        when(seasonDataService.getVoiceActor(2)).thenReturn(Optional.of(va2));

        // When
        CompareResult result = compareService.compare(1, 2);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.sharedAnime()).isEmpty();
    }

    @Test
    void compare_aggregatesMultipleCharactersPerAnime() {
        // Given - VA1 plays 2 characters in the same anime
        VoiceActor va1 = createVoiceActor(1, "VA 1", List.of(
                createRole(12345, "Multi-Char Anime", 1001, "Character A"),
                createRole(12345, "Multi-Char Anime", 1002, "Character B")));
        VoiceActor va2 = createVoiceActor(2, "VA 2", List.of(
                createRole(12345, "Multi-Char Anime", 2001, "Character X")));

        when(seasonDataService.getVoiceActor(1)).thenReturn(Optional.of(va1));
        when(seasonDataService.getVoiceActor(2)).thenReturn(Optional.of(va2));

        // When
        CompareResult result = compareService.compare(1, 2);

        // Then
        assertThat(result.sharedAnime()).hasSize(1);
        CompareResult.SharedAnime shared = result.sharedAnime().get(0);
        assertThat(shared.characters1()).hasSize(2)
                .as("VA1 should have 2 characters in this anime");
        assertThat(shared.characters2()).hasSize(1)
                .as("VA2 should have 1 character in this anime");
    }

    @Test
    void compare_returnsNullWhenVa1NotFound() {
        // Given
        when(seasonDataService.getVoiceActor(1)).thenReturn(Optional.empty());
        when(seasonDataService.getVoiceActor(2)).thenReturn(Optional.of(createVoiceActor(2, "VA 2", List.of())));

        // When
        CompareResult result = compareService.compare(1, 2);

        // Then
        assertThat(result).isNull();
    }

    @Test
    void compare_returnsNullWhenVa2NotFound() {
        // Given
        when(seasonDataService.getVoiceActor(1)).thenReturn(Optional.of(createVoiceActor(1, "VA 1", List.of())));
        when(seasonDataService.getVoiceActor(2)).thenReturn(Optional.empty());

        // When
        CompareResult result = compareService.compare(1, 2);

        // Then
        assertThat(result).isNull();
    }

    @Test
    void compare_handlesNullAllTimeRoles() {
        // Given - VAs with null allTimeRoles (edge case)
        VoiceActor va1 = new VoiceActor(1, "VA 1", "img1.jpg", List.of(), null, 0);
        VoiceActor va2 = new VoiceActor(2, "VA 2", "img2.jpg", List.of(), null, 0);

        when(seasonDataService.getVoiceActor(1)).thenReturn(Optional.of(va1));
        when(seasonDataService.getVoiceActor(2)).thenReturn(Optional.of(va2));

        // When
        CompareResult result = compareService.compare(1, 2);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.sharedAnime()).isEmpty();
    }

    @Test
    void compare_returnsSummariesInResult() {
        // Given
        VoiceActor va1 = createVoiceActor(1, "Voice Actor One", List.of());
        VoiceActor va2 = createVoiceActor(2, "Voice Actor Two", List.of());

        when(seasonDataService.getVoiceActor(1)).thenReturn(Optional.of(va1));
        when(seasonDataService.getVoiceActor(2)).thenReturn(Optional.of(va2));

        // When
        CompareResult result = compareService.compare(1, 2);

        // Then
        assertThat(result.va1()).isNotNull();
        assertThat(result.va2()).isNotNull();
        assertThat(result.va1().name()).isEqualTo("Voice Actor One");
        assertThat(result.va2().name()).isEqualTo("Voice Actor Two");
    }

    // Helper methods

    private VoiceActor createVoiceActor(int id, String name, List<Role> allTimeRoles) {
        return new VoiceActor(id, name, "https://example.com/va" + id + ".jpg",
                List.of(), allTimeRoles, 0);
    }

    private Role createRole(int animeId, String animeTitle, int charId, String charName) {
        Anime anime = new Anime(animeId, animeTitle, null,
                "https://example.com/anime" + animeId + ".jpg", "", "", 0);
        com.seasonalseiyuu.model.Character character = new com.seasonalseiyuu.model.Character(charId, charName,
                "https://example.com/char" + charId + ".jpg", "Main");
        return new Role(anime, character);
    }
}
