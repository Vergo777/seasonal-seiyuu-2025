package com.seasonalseiyuu.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.seasonalseiyuu.model.Anime;
import com.seasonalseiyuu.model.Role;
import com.seasonalseiyuu.service.JikanApiService.CharacterVoiceActor;
import com.seasonalseiyuu.service.JikanApiService.SeasonAnimeResult;
import okhttp3.mockwebserver.MockResponse;
import okhttp3.mockwebserver.MockWebServer;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for JikanApiService.
 * Uses MockWebServer to simulate Jikan API responses.
 */
class JikanApiServiceTest {

    private MockWebServer mockWebServer;
    private JikanApiService jikanApiService;

    @BeforeEach
    void setUp() throws IOException {
        mockWebServer = new MockWebServer();
        mockWebServer.start();

        String baseUrl = mockWebServer.url("/").toString();
        jikanApiService = new JikanApiService(baseUrl, 10, new ObjectMapper()); // 10ms rate limit for fast tests
    }

    @AfterEach
    void tearDown() throws IOException {
        mockWebServer.shutdown();
    }

    @Test
    void getCurrentSeasonAnime_parsesResponseCorrectly() throws IOException {
        // Given
        String jsonResponse = loadFixture("season-anime-response.json");
        mockWebServer.enqueue(new MockResponse()
                .setBody(jsonResponse)
                .setHeader("Content-Type", "application/json"));

        // When
        SeasonAnimeResult result = jikanApiService.getCurrentSeasonAnime();

        // Then
        assertEquals(3, result.anime().size());
        assertEquals(3, result.expectedTotal());
        assertTrue(result.isComplete());

        Anime first = result.anime().get(0);
        assertEquals(12345, first.malId());
        assertEquals("Test Anime 1", first.title());
        assertEquals("Test Anime 1 English", first.titleEnglish());
        assertEquals("fall", first.season());
        assertEquals(2025, first.year());
    }

    @Test
    void getCurrentSeasonAnime_handlesPagination() throws IOException {
        // Given - Page 1 with has_next_page: true
        String page1 = loadFixture("season-anime-page1.json");
        String page2 = loadFixture("season-anime-page2.json");

        mockWebServer.enqueue(new MockResponse().setBody(page1).setHeader("Content-Type", "application/json"));
        mockWebServer.enqueue(new MockResponse().setBody(page2).setHeader("Content-Type", "application/json"));

        // When
        SeasonAnimeResult result = jikanApiService.getCurrentSeasonAnime();

        // Then
        assertEquals(2, result.anime().size());
        assertEquals("Anime 1", result.anime().get(0).title());
        assertEquals("Anime 2", result.anime().get(1).title());
    }

    @Test
    void getCurrentSeasonAnime_returnsExpectedTotal() throws IOException {
        // Given - Response where count != total (simulating incomplete fetch)
        String response = loadFixture("season-anime-incomplete.json");

        mockWebServer.enqueue(new MockResponse().setBody(response).setHeader("Content-Type", "application/json"));

        // When
        SeasonAnimeResult result = jikanApiService.getCurrentSeasonAnime();

        // Then
        assertEquals(2, result.anime().size());
        assertEquals(5, result.expectedTotal());
        assertFalse(result.isComplete(), "Should be incomplete when count != total");
    }

    @Test
    void getAnimeCharacters_parsesVoiceActors() throws IOException {
        // Given
        String jsonResponse = loadFixture("anime-characters-response.json");
        mockWebServer.enqueue(new MockResponse()
                .setBody(jsonResponse)
                .setHeader("Content-Type", "application/json"));

        // When
        List<CharacterVoiceActor> results = jikanApiService.getAnimeCharacters(12345);

        // Then
        assertEquals(2, results.size(), "Should have 2 Japanese VAs (English VA filtered out)");

        CharacterVoiceActor first = results.get(0);
        assertEquals(1001, first.character().malId());
        assertEquals("Test Character 1", first.character().name());
        assertEquals("Main", first.character().role());
        assertEquals(2001, first.voiceActorMalId());
        assertEquals("Suzuki, Taro", first.voiceActorName());
    }

    @Test
    void getAnimeCharacters_filtersJapaneseVAsOnly() throws IOException {
        // Given
        String jsonResponse = loadFixture("anime-characters-response.json");
        mockWebServer.enqueue(new MockResponse()
                .setBody(jsonResponse)
                .setHeader("Content-Type", "application/json"));

        // When
        List<CharacterVoiceActor> results = jikanApiService.getAnimeCharacters(12345);

        // Then - fixture has 1 English VA per character, should be filtered
        for (CharacterVoiceActor cva : results) {
            // All returned results should be Japanese VAs
            assertTrue(cva.voiceActorMalId() == 2001 || cva.voiceActorMalId() == 2002,
                    "Should only include Japanese VAs");
        }
    }

    @Test
    void getAnimeCharacters_returnsEmptyListOnError() {
        // Given - Server returns error
        mockWebServer.enqueue(new MockResponse().setResponseCode(500));

        // When
        List<CharacterVoiceActor> results = jikanApiService.getAnimeCharacters(12345);

        // Then
        assertTrue(results.isEmpty());
    }

    @Test
    void getPersonVoiceRoles_parsesRoles() throws IOException {
        // Given
        String jsonResponse = loadFixture("person-voices-response.json");
        mockWebServer.enqueue(new MockResponse()
                .setBody(jsonResponse)
                .setHeader("Content-Type", "application/json"));

        // When
        List<Role> roles = jikanApiService.getPersonVoiceRoles(2001);

        // Then
        assertEquals(3, roles.size());

        Role first = roles.get(0);
        assertEquals(12345, first.anime().malId());
        assertEquals("Test Anime 1", first.anime().title());
        assertEquals(1001, first.character().malId());
        assertEquals("Test Character 1", first.character().name());
    }

    @Test
    void getPersonVoiceRoles_returnsEmptyListOnError() {
        // Given
        mockWebServer.enqueue(new MockResponse().setResponseCode(404));

        // When
        List<Role> roles = jikanApiService.getPersonVoiceRoles(9999);

        // Then
        assertTrue(roles.isEmpty());
    }

    @Test
    void fetchWithRetry_retriesOn429() throws IOException {
        // Given - First request returns 429, second succeeds
        mockWebServer.enqueue(new MockResponse().setResponseCode(429));
        mockWebServer.enqueue(new MockResponse()
                .setBody(loadFixture("person-voices-response.json"))
                .setHeader("Content-Type", "application/json"));

        // When
        List<Role> roles = jikanApiService.getPersonVoiceRoles(2001);

        // Then
        assertEquals(3, roles.size(), "Should succeed after retry");
        assertEquals(2, mockWebServer.getRequestCount(), "Should have made 2 requests");
    }

    // Helper methods

    private String loadFixture(String filename) throws IOException {
        Path path = Path.of("src/test/resources/fixtures", filename);
        return Files.readString(path);
    }
}
