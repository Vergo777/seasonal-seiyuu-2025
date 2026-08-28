package com.seasonalseiyuu.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.seasonalseiyuu.model.Anime;
import com.seasonalseiyuu.model.Role;
import com.seasonalseiyuu.service.AnimeDataApiService.AnimeDataApiException;
import com.seasonalseiyuu.service.AnimeDataApiService.CharacterVoiceActor;
import com.seasonalseiyuu.service.AnimeDataApiService.SeasonAnimeResult;
import okhttp3.mockwebserver.MockResponse;
import okhttp3.mockwebserver.MockWebServer;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for AnimeDataApiService.
 * Uses MockWebServer to simulate anime-data provider responses.
 */
class AnimeDataApiServiceTest {

    private MockWebServer mockWebServer;
    private AnimeDataApiService animeDataApiService;

    @BeforeEach
    void setUp() throws IOException {
        mockWebServer = new MockWebServer();
        mockWebServer.start();

        String baseUrl = mockWebServer.url("/").toString();
        animeDataApiService = new AnimeDataApiService(baseUrl, 10, new ObjectMapper()); // 10ms rate limit for fast tests
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
        SeasonAnimeResult result = animeDataApiService.getCurrentSeasonAnime();

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
        SeasonAnimeResult result = animeDataApiService.getCurrentSeasonAnime();

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
        SeasonAnimeResult result = animeDataApiService.getCurrentSeasonAnime();

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
        List<CharacterVoiceActor> results = animeDataApiService.getAnimeCharacters(12345);

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
        List<CharacterVoiceActor> results = animeDataApiService.getAnimeCharacters(12345);

        // Then - fixture has 1 English VA per character, should be filtered
        for (CharacterVoiceActor cva : results) {
            // All returned results should be Japanese VAs
            assertTrue(cva.voiceActorMalId() == 2001 || cva.voiceActorMalId() == 2002,
                    "Should only include Japanese VAs");
        }
    }

    @Test
    void getAnimeCharacters_throwsOnErrorInsteadOfReturningSuccessfulEmptyData() {
        // Given - Server returns error
        mockWebServer.enqueue(new MockResponse().setResponseCode(500));

        assertThrows(AnimeDataApiException.class,
                () -> animeDataApiService.getAnimeCharacters(12345));
    }

    @Test
    void getPersonVoiceRoles_parsesRoles() throws IOException {
        // Given
        String jsonResponse = loadFixture("person-voices-response.json");
        mockWebServer.enqueue(new MockResponse()
                .setBody(jsonResponse)
                .setHeader("Content-Type", "application/json"));

        // When
        List<Role> roles = animeDataApiService.getPersonVoiceRoles(2001);

        // Then
        assertEquals(3, roles.size());

        Role first = roles.get(0);
        assertEquals(12345, first.anime().malId());
        assertEquals("Test Anime 1", first.anime().title());
        assertEquals(1001, first.character().malId());
        assertEquals("Test Character 1", first.character().name());
    }

    @Test
    void getPersonVoiceRoles_throwsOnErrorInsteadOfReturningSuccessfulEmptyData() {
        // Given
        mockWebServer.enqueue(new MockResponse().setResponseCode(404));

        assertThrows(AnimeDataApiException.class,
                () -> animeDataApiService.getPersonVoiceRoles(9999));
    }

    @Test
    void getPersonVoiceRoles_acceptsSuccessfulEmptyData() {
        mockWebServer.enqueue(new MockResponse().setBody("{\"data\":[]}")
                .setHeader("Content-Type", "application/json"));

        assertTrue(animeDataApiService.getPersonVoiceRoles(2001).isEmpty());
    }

    @Test
    void getPersonVoiceRoles_rejectsMalformedPayload() {
        mockWebServer.enqueue(new MockResponse().setBody("{\"meta\":{}}")
                .setHeader("Content-Type", "application/json"));

        assertThrows(AnimeDataApiException.class,
                () -> animeDataApiService.getPersonVoiceRoles(2001));
    }

    @Test
    void fetchWithRetry_retriesOn429() throws IOException {
        // Given - First request returns 429, second succeeds
        mockWebServer.enqueue(new MockResponse().setResponseCode(429));
        mockWebServer.enqueue(new MockResponse()
                .setBody(loadFixture("person-voices-response.json"))
                .setHeader("Content-Type", "application/json"));

        // When
        List<Role> roles = animeDataApiService.getPersonVoiceRoles(2001);

        // Then
        assertEquals(3, roles.size(), "Should succeed after retry");
        assertEquals(2, mockWebServer.getRequestCount(), "Should have made 2 requests");
    }

    @Test
    void fetchWithRetry_honorsRetryAfterSeconds() throws IOException {
        List<Long> delays = new ArrayList<>();
        mockWebServer.enqueue(new MockResponse().setResponseCode(429).setHeader("Retry-After", "2"));
        mockWebServer.enqueue(new MockResponse()
                .setBody(loadFixture("person-voices-response.json"))
                .setHeader("Content-Type", "application/json"));
        AnimeDataApiService client = newClientWithSleeper(delays, 37);

        assertEquals(3, client.getPersonVoiceRoles(2001).size());
        assertEquals(List.of(2_000L), delays);
    }

    @Test
    void fetchWithRetry_honorsRetryAfterHttpDate() throws IOException {
        Instant now = Instant.parse("2026-01-01T00:00:00Z");
        String retryAt = DateTimeFormatter.RFC_1123_DATE_TIME.format(
                ZonedDateTime.ofInstant(now.plusSeconds(3), ZoneOffset.UTC));
        List<Long> delays = new ArrayList<>();
        mockWebServer.enqueue(new MockResponse().setResponseCode(429).setHeader("Retry-After", retryAt));
        mockWebServer.enqueue(new MockResponse()
                .setBody(loadFixture("person-voices-response.json"))
                .setHeader("Content-Type", "application/json"));
        AnimeDataApiService client = newClientWithSleeper(
                delays, 37, 60_000, Clock.fixed(now, ZoneOffset.UTC));

        assertEquals(3, client.getPersonVoiceRoles(2001).size());
        assertEquals(List.of(3_000L), delays);
    }

    @Test
    void fetchWithRetry_defersExcessiveRetryAfterWithoutSleeping() {
        List<Long> delays = new ArrayList<>();
        mockWebServer.enqueue(new MockResponse().setResponseCode(429).setHeader("Retry-After", "86400"));
        AnimeDataApiService client = newClientWithSleeper(
                delays, 37, 60_000, Clock.fixed(Instant.parse("2026-01-01T00:00:00Z"), ZoneOffset.UTC));

        AnimeDataApiException failure = assertThrows(AnimeDataApiException.class,
                () -> client.getPersonVoiceRoles(2001));

        assertTrue(failure.getMessage().contains("operation deferred until"));
        assertTrue(delays.isEmpty(), "an excessive Retry-After must not be slept inline");
        assertEquals(1, mockWebServer.getRequestCount());
    }

    @Test
    void fetchWithRetry_defersVeryLargeValidIntegerRetryAfterWithoutOverflow() {
        List<Long> delays = new ArrayList<>();
        mockWebServer.enqueue(new MockResponse().setResponseCode(429)
                .setHeader("Retry-After", "9223372036854775808"));
        AnimeDataApiService client = newClientWithSleeper(
                delays, 37, 60_000, Clock.fixed(Instant.parse("2026-01-01T00:00:00Z"), ZoneOffset.UTC));

        AnimeDataApiException failure = assertThrows(AnimeDataApiException.class,
                () -> client.getPersonVoiceRoles(2001));

        assertTrue(failure.getMessage().contains("operation deferred until"));
        assertTrue(delays.isEmpty(), "a very large valid Retry-After must not be slept inline");
        assertEquals(1, mockWebServer.getRequestCount());
    }

    @Test
    void fetchWithRetry_doesNotBypassActiveProviderCooldown() {
        MutableClock clock = new MutableClock(Instant.parse("2026-01-01T00:00:00Z"));
        mockWebServer.enqueue(new MockResponse().setResponseCode(429).setHeader("Retry-After", "120"));
        AnimeDataApiService client = newClientWithSleeper(new ArrayList<>(), 37, 10_000, clock);

        assertThrows(AnimeDataApiException.class, () -> client.getPersonVoiceRoles(2001));
        AnimeDataApiException failure = assertThrows(AnimeDataApiException.class,
                () -> client.getPersonVoiceRoles(2001));

        assertTrue(failure.getMessage().contains("cooldown is active"));
        assertEquals(1, mockWebServer.getRequestCount(), "active cooldown must prevent another upstream request");
    }

    @Test
    void fetchWithRetry_recoversAfterProviderCooldownExpires() throws IOException {
        MutableClock clock = new MutableClock(Instant.parse("2026-01-01T00:00:00Z"));
        mockWebServer.enqueue(new MockResponse().setResponseCode(429).setHeader("Retry-After", "120"));
        mockWebServer.enqueue(new MockResponse()
                .setBody(loadFixture("person-voices-response.json"))
                .setHeader("Content-Type", "application/json"));
        AnimeDataApiService client = newClientWithSleeper(new ArrayList<>(), 37, 10_000, clock);

        assertThrows(AnimeDataApiException.class, () -> client.getPersonVoiceRoles(2001));
        clock.advance(Duration.ofSeconds(120));

        assertEquals(3, client.getPersonVoiceRoles(2001).size());
        assertEquals(2, mockWebServer.getRequestCount());
    }

    @Test
    void fetchWithRetry_fallsBackForInvalidRetryAfter() throws IOException {
        List<Long> delays = new ArrayList<>();
        mockWebServer.enqueue(new MockResponse().setResponseCode(429).setHeader("Retry-After", "later"));
        mockWebServer.enqueue(new MockResponse()
                .setBody(loadFixture("person-voices-response.json"))
                .setHeader("Content-Type", "application/json"));
        AnimeDataApiService client = newClientWithSleeper(delays, 37);

        assertEquals(3, client.getPersonVoiceRoles(2001).size());
        assertEquals(List.of(37L), delays);
    }

    @Test
    void fetchWithRetry_fallsBackWhenRetryAfterIsMissing() throws IOException {
        List<Long> delays = new ArrayList<>();
        mockWebServer.enqueue(new MockResponse().setResponseCode(429));
        mockWebServer.enqueue(new MockResponse()
                .setBody(loadFixture("person-voices-response.json"))
                .setHeader("Content-Type", "application/json"));
        AnimeDataApiService client = newClientWithSleeper(delays, 37);

        assertEquals(3, client.getPersonVoiceRoles(2001).size());
        assertEquals(List.of(37L), delays);
    }

    @Test
    void fetchWithRetry_retriesOnServerError() throws IOException {
        mockWebServer.enqueue(new MockResponse().setResponseCode(503));
        mockWebServer.enqueue(new MockResponse().setBody(loadFixture("person-voices-response.json"))
                .setHeader("Content-Type", "application/json"));

        assertEquals(3, animeDataApiService.getPersonVoiceRoles(2001).size());
        assertEquals(2, mockWebServer.getRequestCount());
    }

    @Test
    void fetchWithRetry_stopsAfterBoundedAttempts() {
        mockWebServer.enqueue(new MockResponse().setResponseCode(500));
        mockWebServer.enqueue(new MockResponse().setResponseCode(500));
        mockWebServer.enqueue(new MockResponse().setResponseCode(500));

        assertThrows(AnimeDataApiException.class,
                () -> animeDataApiService.getPersonVoiceRoles(2001));
        assertEquals(3, mockWebServer.getRequestCount());
    }

    @Test
    void nonRetryableClientErrorIsExplicitAndNotRetried() {
        mockWebServer.enqueue(new MockResponse().setResponseCode(404));

        assertThrows(AnimeDataApiException.class,
                () -> animeDataApiService.getPersonVoiceRoles(2001));
        assertEquals(1, mockWebServer.getRequestCount());
    }

    @Test
    void successfulEmptyDataRemainsAValidEmptyResult() {
        mockWebServer.enqueue(new MockResponse().setBody("{\"data\":[]}")
                .setHeader("Content-Type", "application/json"));

        assertTrue(animeDataApiService.getAnimeCharacters(12345).isEmpty());
    }

    @Test
    void malformedPayloadIsExplicitlyRejected() {
        mockWebServer.enqueue(new MockResponse().setBody("not-json")
                .setHeader("Content-Type", "application/json"));

        assertThrows(AnimeDataApiException.class,
                () -> animeDataApiService.getAnimeCharacters(12345));
    }

    @Test
    void incompletePaginationPageIsExplicitlyRejected() {
        mockWebServer.enqueue(new MockResponse().setBody(
                "{\"data\":[],\"pagination\":{\"items\":{\"total\":1},\"has_next_page\":true}}")
                .setHeader("Content-Type", "application/json"));
        mockWebServer.enqueue(new MockResponse().setBody("{\"data\":[]}")
                .setHeader("Content-Type", "application/json"));

        assertThrows(AnimeDataApiException.class,
                () -> animeDataApiService.getCurrentSeasonAnime());
    }

    @Test
    void missingPaginationContinuationIsExplicitlyRejected() {
        mockWebServer.enqueue(new MockResponse().setBody(
                "{\"data\":[],\"pagination\":{\"items\":{\"total\":0}}}")
                .setHeader("Content-Type", "application/json"));

        assertThrows(AnimeDataApiException.class,
                () -> animeDataApiService.getCurrentSeasonAnime());
    }

    @Test
    void timeoutIsExplicitlyRejected() {
        mockWebServer.enqueue(new MockResponse().setBody("{\"data\":[]}")
                .setBodyDelay(100, TimeUnit.MILLISECONDS));
        AnimeDataApiService shortTimeoutClient = new AnimeDataApiService(mockWebServer.url("/").toString(), 0,
                new ObjectMapper(), 100, 20, 1, 0, 0, 0);

        assertThrows(AnimeDataApiException.class,
                () -> shortTimeoutClient.getAnimeCharacters(12345));
    }

    @Test
    void connectionFailureIsExplicitlyRejected() {
        AnimeDataApiService unavailableClient = new AnimeDataApiService("http://127.0.0.1:1", 0,
                new ObjectMapper(), 100, 100, 1, 0, 0, 0);

        assertThrows(AnimeDataApiException.class,
                () -> unavailableClient.getAnimeCharacters(12345));
    }

    @Test
    void interruptedRetrySleepRestoresInterruptFlagAndFailsCleanly() {
        mockWebServer.enqueue(new MockResponse().setResponseCode(503));
        AnimeDataApiService interruptedClient = new AnimeDataApiService(
                mockWebServer.url("/").toString(), 0, new ObjectMapper(),
                1_000, 1_000, 2, 37, 100, 0, 60_000,
                millis -> { throw new InterruptedException("test interruption"); },
                Clock.fixed(Instant.parse("2026-01-01T00:00:00Z"), ZoneOffset.UTC));

        try {
            AnimeDataApiException failure = assertThrows(AnimeDataApiException.class,
                    () -> interruptedClient.getPersonVoiceRoles(2001));
            assertEquals("Anime-data request interrupted", failure.getMessage());
            assertTrue(Thread.currentThread().isInterrupted());
        } finally {
            Thread.interrupted();
        }
    }

    @Test
    void consecutiveRequestsRemainPaced() {
        mockWebServer.enqueue(new MockResponse().setBody("{\"data\":[]}"));
        mockWebServer.enqueue(new MockResponse().setBody("{\"data\":[]}"));
        long started = System.nanoTime();

        animeDataApiService.getAnimeCharacters(12345);
        animeDataApiService.getAnimeCharacters(12345);

        long elapsedMillis = TimeUnit.NANOSECONDS.toMillis(System.nanoTime() - started);
        assertTrue(elapsedMillis >= 8, "requests should remain behind the pacing gate");
    }

    // Helper methods

    private String loadFixture(String filename) throws IOException {
        Path path = Path.of("src/test/resources/fixtures", filename);
        return Files.readString(path);
    }

    private AnimeDataApiService newClientWithSleeper(List<Long> delays, long initialBackoffMs) {
        return newClientWithSleeper(delays, initialBackoffMs, 60_000, Clock.systemUTC());
    }

    private AnimeDataApiService newClientWithSleeper(List<Long> delays, long initialBackoffMs,
                                                     long maxInlineRetryAfterMs, Clock clock) {
        return new AnimeDataApiService(mockWebServer.url("/").toString(), 0, new ObjectMapper(),
                1_000, 1_000, 2, initialBackoffMs, 100, 0, maxInlineRetryAfterMs,
                millis -> delays.add(millis), clock);
    }

    private static final class MutableClock extends Clock {
        private Instant current;

        private MutableClock(Instant current) { this.current = current; }

        @Override
        public ZoneId getZone() { return ZoneOffset.UTC; }

        @Override
        public Clock withZone(ZoneId zone) { return this; }

        @Override
        public Instant instant() { return current; }

        private void advance(Duration amount) { current = current.plus(amount); }
    }
}
