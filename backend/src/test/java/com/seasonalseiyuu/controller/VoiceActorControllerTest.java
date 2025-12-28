package com.seasonalseiyuu.controller;

import com.seasonalseiyuu.model.*;
import com.seasonalseiyuu.service.CompareService;
import com.seasonalseiyuu.service.SeasonDataService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.hamcrest.Matchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Integration tests for VoiceActorController.
 * Uses @WebMvcTest with mocked services.
 */
@WebMvcTest(VoiceActorController.class)
class VoiceActorControllerTest {

        @Autowired
        private MockMvc mockMvc;

        @MockitoBean
        private SeasonDataService seasonDataService;

        @MockitoBean
        private CompareService compareService;

        @Test
        void getAllVoiceActors_returnsListSortedByShowCount() throws Exception {
                // Given
                VoiceActor va1 = createVoiceActor(1, "VA One", 5);
                VoiceActor va2 = createVoiceActor(2, "VA Two", 10);
                VoiceActor va3 = createVoiceActor(3, "VA Three", 3);

                SeasonCache cache = new SeasonCache("fall", 2025, Instant.now(),
                                Map.of(1, va1, 2, va2, 3, va3));

                when(seasonDataService.getSeasonData()).thenReturn(Optional.of(cache));

                // When & Then
                mockMvc.perform(get("/api/voice-actors"))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$", hasSize(3)))
                                .andExpect(jsonPath("$[0].name", is("VA Two"))) // 10 shows - first
                                .andExpect(jsonPath("$[1].name", is("VA One"))) // 5 shows - second
                                .andExpect(jsonPath("$[2].name", is("VA Three"))); // 3 shows - third
        }

        @Test
        void getAllVoiceActors_returnsEmptyListWhenNoCache() throws Exception {
                // Given
                when(seasonDataService.getSeasonData()).thenReturn(Optional.empty());

                // When & Then
                mockMvc.perform(get("/api/voice-actors"))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$", hasSize(0)));
        }

        @Test
        void getVoiceActor_returnsVaById() throws Exception {
                // Given
                VoiceActor va = createVoiceActor(123, "Specific VA", 7);
                when(seasonDataService.getVoiceActor(123)).thenReturn(Optional.of(va));

                // When & Then
                mockMvc.perform(get("/api/voice-actors/123"))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.malId", is(123)))
                                .andExpect(jsonPath("$.name", is("Specific VA")))
                                .andExpect(jsonPath("$.totalSeasonalShows", is(7)));
        }

        @Test
        void getVoiceActor_returns404WhenNotFound() throws Exception {
                // Given
                when(seasonDataService.getVoiceActor(999)).thenReturn(Optional.empty());

                // When & Then
                mockMvc.perform(get("/api/voice-actors/999"))
                                .andExpect(status().isNotFound());
        }

        @Test
        void compareVoiceActors_returnsSharedAnime() throws Exception {
                // Given
                VoiceActorSummary va1 = new VoiceActorSummary(1, "VA 1", "img1.jpg", 5, 100);
                VoiceActorSummary va2 = new VoiceActorSummary(2, "VA 2", "img2.jpg", 3, 50);
                CompareResult.SharedAnime shared = new CompareResult.SharedAnime(
                                12345, "Shared Anime", "anime.jpg",
                                List.of(new CompareResult.CharacterRef(101, "Char A")),
                                List.of(new CompareResult.CharacterRef(201, "Char B")));
                CompareResult result = new CompareResult(va1, va2, List.of(shared));

                when(compareService.compare(1, 2)).thenReturn(result);

                // When & Then
                mockMvc.perform(get("/api/compare/1/2"))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.va1.name", is("VA 1")))
                                .andExpect(jsonPath("$.va2.name", is("VA 2")))
                                .andExpect(jsonPath("$.sharedAnime", hasSize(1)))
                                .andExpect(jsonPath("$.sharedAnime[0].title", is("Shared Anime")));
        }

        @Test
        void compareVoiceActors_returns404WhenVaNotFound() throws Exception {
                // Given
                when(compareService.compare(1, 999)).thenReturn(null);

                // When & Then
                mockMvc.perform(get("/api/compare/1/999"))
                                .andExpect(status().isNotFound());
        }

        @Test
        void getSeasonInfo_returnsSeasonMetadata() throws Exception {
                // Given
                VoiceActor va = createVoiceActor(1, "Test VA", 1);
                SeasonCache cache = new SeasonCache("fall", 2025,
                                Instant.parse("2025-01-15T10:30:00Z"), Map.of(1, va));

                when(seasonDataService.getSeasonData()).thenReturn(Optional.of(cache));

                // When & Then
                mockMvc.perform(get("/api/season-info"))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.season", is("fall")))
                                .andExpect(jsonPath("$.year", is(2025)))
                                .andExpect(jsonPath("$.voiceActorCount", is(1)))
                                .andExpect(jsonPath("$.lastRefreshed", containsString("2025-01-15")));
        }

        @Test
        void getSeasonInfo_returnsEmptyWhenNoCache() throws Exception {
                // Given
                when(seasonDataService.getSeasonData()).thenReturn(Optional.empty());

                // When & Then
                mockMvc.perform(get("/api/season-info"))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.season", nullValue()))
                                .andExpect(jsonPath("$.voiceActorCount", is(0)));
        }

        // Helper methods

        private VoiceActor createVoiceActor(int id, String name, int seasonalShows) {
                // Create seasonal roles with unique anime for each
                com.seasonalseiyuu.model.Character character = new com.seasonalseiyuu.model.Character(id * 10, "Char",
                                "char.jpg", "Main");

                List<Role> seasonalRoles = java.util.stream.IntStream.range(0, seasonalShows)
                                .mapToObj(i -> new Role(
                                                new Anime(id * 100 + i, "Anime " + i, null, "img.jpg", "", "fall",
                                                                2025),
                                                character))
                                .toList();

                return VoiceActor.create(id, name, "https://example.com/va" + id + ".jpg",
                                seasonalRoles, List.of());
        }
}
