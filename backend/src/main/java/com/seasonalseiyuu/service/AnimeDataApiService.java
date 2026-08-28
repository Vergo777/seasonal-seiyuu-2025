package com.seasonalseiyuu.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.seasonalseiyuu.config.AnimeDataProperties;
import com.seasonalseiyuu.config.RefreshProperties;
import com.seasonalseiyuu.model.Anime;
import com.seasonalseiyuu.model.Character;
import com.seasonalseiyuu.model.Role;
import org.springframework.http.HttpHeaders;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.http.client.SimpleClientHttpRequestFactory;

import java.time.Duration;
import java.time.Instant;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.concurrent.ThreadLocalRandom;
import java.util.concurrent.atomic.AtomicLong;

/** Reliable, paced client for the configured anime-data provider. */
@Service
public class AnimeDataApiService {

    private static final Logger log = LoggerFactory.getLogger(AnimeDataApiService.class);
    private static final long NO_RETRY_AFTER = -1;

    private final RestClient restClient;
    private final ObjectMapper objectMapper;
    private final long rateLimitMs;
    private final int maxAttempts;
    private final long initialBackoffMs;
    private final long maxBackoffMs;
    private final long jitterMs;
    private final Sleeper sleeper;
    private final AtomicLong nextRequestAtNanos = new AtomicLong();

    @Autowired
    public AnimeDataApiService(AnimeDataProperties animeDataProperties, RefreshProperties refreshProperties,
                               ObjectMapper objectMapper) {
        this(animeDataProperties.getBaseUrl(), animeDataProperties.getRateLimitMs(), objectMapper,
                animeDataProperties.getConnectTimeoutMs(), animeDataProperties.getReadTimeoutMs(),
                refreshProperties.getRetryMaxAttempts(),
                refreshProperties.getRetryInitialBackoff().toMillis(),
                refreshProperties.getRetryMaxBackoff().toMillis(),
                refreshProperties.getRetryJitter().toMillis());
    }

    /** Compatibility constructor used by focused tests and small integrations. */
    public AnimeDataApiService(String baseUrl, long rateLimitMs, ObjectMapper objectMapper) {
        this(baseUrl, rateLimitMs, objectMapper, 10_000, 30_000, 3, 20, 250, 0);
    }

    public AnimeDataApiService(String baseUrl, long rateLimitMs, ObjectMapper objectMapper,
                               int connectTimeoutMs, int readTimeoutMs, int maxAttempts,
                               long initialBackoffMs, long maxBackoffMs, long jitterMs) {
        this(baseUrl, rateLimitMs, objectMapper, connectTimeoutMs, readTimeoutMs, maxAttempts,
                initialBackoffMs, maxBackoffMs, jitterMs, Thread::sleep);
    }

    AnimeDataApiService(String baseUrl, long rateLimitMs, ObjectMapper objectMapper,
                        int connectTimeoutMs, int readTimeoutMs, int maxAttempts,
                        long initialBackoffMs, long maxBackoffMs, long jitterMs,
                        Sleeper sleeper) {
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(Duration.ofMillis(Math.max(1, connectTimeoutMs)));
        requestFactory.setReadTimeout(Duration.ofMillis(Math.max(1, readTimeoutMs)));
        this.restClient = RestClient.builder()
                .baseUrl(baseUrl)
                .requestFactory(requestFactory)
                .build();
        this.objectMapper = objectMapper;
        this.rateLimitMs = Math.max(0, rateLimitMs);
        this.maxAttempts = Math.max(1, maxAttempts);
        this.initialBackoffMs = Math.max(0, initialBackoffMs);
        this.maxBackoffMs = Math.max(this.initialBackoffMs, maxBackoffMs);
        this.jitterMs = Math.max(0, jitterMs);
        this.sleeper = Objects.requireNonNull(sleeper, "sleeper");
    }

    public SeasonAnimeResult getCurrentSeasonAnime() {
        List<Anime> allAnime = new ArrayList<>();
        int page = 1;
        boolean hasNextPage;
        int expectedTotal = -1;

        do {
            final int currentPage = page;
            log.info("Fetching season anime page {}", currentPage);
            String response = fetchWithRetry(() -> restClient.get()
                    .uri("/seasons/now?page={page}", currentPage)
                    .retrieve()
                    .body(String.class), "season page " + currentPage);
            try {
                JsonNode root = objectMapper.readTree(response);
                JsonNode data = root.get("data");
                JsonNode pagination = root.get("pagination");
                if (data == null || !data.isArray() || pagination == null || !pagination.isObject()) {
                    throw new AnimeDataApiException("Anime-data season response missing required fields");
                }
                JsonNode total = pagination.path("items").path("total");
                JsonNode hasNext = pagination.get("has_next_page");
                if (!total.isIntegralNumber() || total.asInt() < 0) {
                    throw new AnimeDataApiException("Anime-data season response missing pagination total");
                }
                if (hasNext == null || !hasNext.isBoolean()) {
                    throw new AnimeDataApiException("Anime-data season response missing pagination continuation");
                }
                if (page == 1) {
                    expectedTotal = total.asInt();
                }
                for (JsonNode animeNode : data) {
                    allAnime.add(parseAnime(animeNode));
                }
                hasNextPage = hasNext.asBoolean();
                page++;
            } catch (AnimeDataApiException e) {
                throw e;
            } catch (Exception e) {
                throw new AnimeDataApiException("Anime-data season response parse failure", e);
            }
        } while (hasNextPage);

        if (expectedTotal < 0) {
            throw new AnimeDataApiException("Anime-data season response contained no pages");
        }
        log.info("Fetched {} anime from current season (expected: {})", allAnime.size(), expectedTotal);
        return new SeasonAnimeResult(List.copyOf(allAnime), expectedTotal);
    }

    public record SeasonAnimeResult(List<Anime> anime, int expectedTotal) {
        public boolean isComplete() {
            return anime != null && expectedTotal > 0 && anime.size() == expectedTotal;
        }
    }

    /** A valid empty data array is returned as an empty list; request failures throw. */
    public List<CharacterVoiceActor> getAnimeCharacters(int animeId) {
        log.debug("Fetching characters for anime {}", animeId);
        String response = fetchWithRetry(() -> restClient.get()
                .uri("/anime/{id}/characters", animeId)
                .retrieve()
                .body(String.class), "anime characters " + animeId);
        try {
            JsonNode root = objectMapper.readTree(response);
            JsonNode data = root.get("data");
            if (data == null || !data.isArray()) {
                throw new AnimeDataApiException("Anime-data characters response missing data");
            }
            List<CharacterVoiceActor> results = new ArrayList<>();
            for (JsonNode charNode : data) {
                Character character = parseCharacter(charNode);
                for (JsonNode vaNode : charNode.path("voice_actors")) {
                    if ("Japanese".equals(vaNode.path("language").asText())) {
                        results.add(new CharacterVoiceActor(
                                character,
                                vaNode.path("person").path("mal_id").asInt(),
                                vaNode.path("person").path("name").asText(),
                                vaNode.path("person").path("images").path("jpg").path("image_url").asText()));
                    }
                }
            }
            return List.copyOf(results);
        } catch (AnimeDataApiException e) {
            throw e;
        } catch (Exception e) {
            throw new AnimeDataApiException("Anime-data characters response parse failure", e);
        }
    }

    /** A valid empty data array is returned as an empty list; request failures throw. */
    public List<Role> getPersonVoiceRoles(int personId) {
        log.debug("Fetching voice roles for person {}", personId);
        String response = fetchWithRetry(() -> restClient.get()
                .uri("/people/{id}/voices", personId)
                .retrieve()
                .body(String.class), "person voices " + personId);
        try {
            JsonNode root = objectMapper.readTree(response);
            JsonNode data = root.get("data");
            if (data == null || !data.isArray()) {
                throw new AnimeDataApiException("Anime-data voice roles response missing data");
            }
            List<Role> roles = new ArrayList<>();
            for (JsonNode roleNode : data) {
                roles.add(new Role(parseAnimeFromRole(roleNode.path("anime")),
                        parseCharacterFromRole(roleNode.path("character"))));
            }
            return List.copyOf(roles);
        } catch (AnimeDataApiException e) {
            throw e;
        } catch (Exception e) {
            throw new AnimeDataApiException("Anime-data voice roles response parse failure", e);
        }
    }

    private Anime parseAnime(JsonNode node) {
        return new Anime(node.path("mal_id").asInt(), node.path("title").asText(),
                node.path("title_english").asText(null),
                node.path("images").path("jpg").path("large_image_url").asText(),
                node.path("synopsis").asText(""), node.path("season").asText(), node.path("year").asInt());
    }

    private Anime parseAnimeFromRole(JsonNode node) {
        return new Anime(node.path("mal_id").asInt(), node.path("title").asText(), null,
                node.path("images").path("jpg").path("large_image_url").asText(), "", "", 0);
    }

    private Character parseCharacter(JsonNode node) {
        JsonNode charData = node.path("character");
        return new Character(charData.path("mal_id").asInt(), charData.path("name").asText(),
                charData.path("images").path("jpg").path("image_url").asText(), node.path("role").asText());
    }

    private Character parseCharacterFromRole(JsonNode node) {
        return new Character(node.path("mal_id").asInt(), node.path("name").asText(),
                node.path("images").path("jpg").path("image_url").asText(), "");
    }

    private String fetchWithRetry(ThrowingSupplier<String> fetcher, String operation) {
        long backoff = initialBackoffMs;
        AnimeDataApiException lastFailure = null;
        for (int attempt = 1; attempt <= maxAttempts; attempt++) {
            long retryAfterMs = NO_RETRY_AFTER;
            try {
                rateLimit();
                String response = fetcher.get();
                if (response == null) throw new AnimeDataApiException("Anime-data provider returned an empty response");
                return response;
            } catch (HttpStatusCodeException e) {
                int status = e.getStatusCode().value();
                lastFailure = new AnimeDataApiException("Anime-data HTTP request failed with status " + status);
                if (!isRetryableStatus(status)) throw lastFailure;
                retryAfterMs = status == 429 ? parseRetryAfterMs(e) : NO_RETRY_AFTER;
                log.warn("Transient anime-data HTTP failure for {} (attempt {}/{}, status {})",
                        operation, attempt, maxAttempts, status);
            } catch (RestClientException e) {
                lastFailure = new AnimeDataApiException("Anime-data transport request failed");
                log.warn("Transient anime-data transport failure for {} (attempt {}/{})",
                        operation, attempt, maxAttempts);
            } catch (AnimeDataApiException e) {
                throw e;
            } catch (Exception e) {
                lastFailure = new AnimeDataApiException("Anime-data request failed");
                log.warn("Transient anime-data request failure for {} (attempt {}/{})",
                        operation, attempt, maxAttempts);
            }

            if (attempt < maxAttempts) {
                long delay = retryAfterMs >= 0 ? retryAfterMs : backoff + randomJitter();
                if (retryAfterMs >= 0) {
                    log.debug("Honoring anime-data Retry-After delay of {} ms for {}", delay, operation);
                }
                sleep(delay);
                backoff = Math.min(maxBackoffMs, Math.max(backoff, backoff * 2));
            }
        }
        throw lastFailure == null ? new AnimeDataApiException("Anime-data request failed") : lastFailure;
    }

    private long parseRetryAfterMs(HttpStatusCodeException exception) {
        HttpHeaders headers = exception.getResponseHeaders();
        if (headers == null) return NO_RETRY_AFTER;

        String value = headers.getFirst(HttpHeaders.RETRY_AFTER);
        if (value == null || value.isBlank()) return NO_RETRY_AFTER;
        value = value.trim();

        try {
            long seconds = Long.parseLong(value);
            if (seconds < 0) return NO_RETRY_AFTER;
            return Math.multiplyExact(seconds, 1_000L);
        } catch (NumberFormatException | ArithmeticException ignored) {
            // Retry-After may also be an HTTP date; try that form below.
        }

        try {
            Instant retryAt = ZonedDateTime.parse(value, DateTimeFormatter.RFC_1123_DATE_TIME).toInstant();
            return Math.max(0, Duration.between(Instant.now(), retryAt).toMillis());
        } catch (DateTimeParseException | ArithmeticException ignored) {
            return NO_RETRY_AFTER;
        }
    }

    private boolean isRetryableStatus(int status) {
        return status == 429 || status >= 500;
    }

    /** Serializes all attempts through one process-wide pacing gate. */
    private void rateLimit() {
        long now = System.nanoTime();
        long allowed = nextRequestAtNanos.getAndUpdate(previous ->
                Math.max(now, previous) + Duration.ofMillis(rateLimitMs).toNanos());
        long waitNanos = allowed - now;
        if (waitNanos > 0) {
            sleep(Duration.ofNanos(waitNanos).toMillis());
        }
    }

    private long randomJitter() {
        return jitterMs == 0 ? 0 : ThreadLocalRandom.current().nextLong(jitterMs + 1);
    }

    private void sleep(long millis) {
        if (millis <= 0) return;
        try {
            sleeper.sleep(millis);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new AnimeDataApiException("Anime-data request interrupted", e);
        }
    }

    @FunctionalInterface
    private interface ThrowingSupplier<T> { T get(); }

    public record CharacterVoiceActor(Character character, int voiceActorMalId,
                                      String voiceActorName, String voiceActorImageUrl) { }

    @FunctionalInterface
    interface Sleeper {
        void sleep(long millis) throws InterruptedException;
    }

    public static class AnimeDataApiException extends RuntimeException {
        public AnimeDataApiException(String message) { super(message); }
        public AnimeDataApiException(String message, Throwable cause) { super(message, cause); }
    }
}
