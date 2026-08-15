package com.seasonalseiyuu.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.seasonalseiyuu.config.JikanProperties;
import com.seasonalseiyuu.config.RefreshProperties;
import com.seasonalseiyuu.model.Anime;
import com.seasonalseiyuu.model.Character;
import com.seasonalseiyuu.model.Role;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.http.client.SimpleClientHttpRequestFactory;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ThreadLocalRandom;
import java.util.concurrent.atomic.AtomicLong;

/** Reliable, paced client for the Jikan API. */
@Service
public class JikanApiService {

    private static final Logger log = LoggerFactory.getLogger(JikanApiService.class);

    private final RestClient restClient;
    private final ObjectMapper objectMapper;
    private final long rateLimitMs;
    private final int maxAttempts;
    private final long initialBackoffMs;
    private final long maxBackoffMs;
    private final long jitterMs;
    private final AtomicLong nextRequestAtNanos = new AtomicLong();

    @Autowired
    public JikanApiService(JikanProperties jikanProperties, RefreshProperties refreshProperties,
                           ObjectMapper objectMapper) {
        this(jikanProperties.getBaseUrl(), jikanProperties.getRateLimitMs(), objectMapper,
                jikanProperties.getConnectTimeoutMs(), jikanProperties.getReadTimeoutMs(),
                refreshProperties.getRetryMaxAttempts(),
                refreshProperties.getRetryInitialBackoff().toMillis(),
                refreshProperties.getRetryMaxBackoff().toMillis(),
                refreshProperties.getRetryJitter().toMillis());
    }

    /** Compatibility constructor used by focused tests and small integrations. */
    public JikanApiService(String baseUrl, long rateLimitMs, ObjectMapper objectMapper) {
        this(baseUrl, rateLimitMs, objectMapper, 10_000, 30_000, 3, 20, 250, 0);
    }

    public JikanApiService(String baseUrl, long rateLimitMs, ObjectMapper objectMapper,
                           int connectTimeoutMs, int readTimeoutMs, int maxAttempts,
                           long initialBackoffMs, long maxBackoffMs, long jitterMs) {
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
                    throw new JikanApiException("Jikan season response missing required fields");
                }
                if (page == 1) {
                    JsonNode total = pagination.path("items").path("total");
                    if (!total.isNumber()) {
                        throw new JikanApiException("Jikan season response missing pagination total");
                    }
                    expectedTotal = total.asInt();
                }
                for (JsonNode animeNode : data) {
                    allAnime.add(parseAnime(animeNode));
                }
                hasNextPage = pagination.path("has_next_page").isBoolean()
                        && pagination.path("has_next_page").asBoolean();
                page++;
            } catch (JikanApiException e) {
                throw e;
            } catch (Exception e) {
                throw new JikanApiException("Jikan season response parse failure", e);
            }
        } while (hasNextPage);

        if (expectedTotal < 0) {
            throw new JikanApiException("Jikan season response contained no pages");
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
                throw new JikanApiException("Jikan characters response missing data");
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
        } catch (JikanApiException e) {
            throw e;
        } catch (Exception e) {
            throw new JikanApiException("Jikan characters response parse failure", e);
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
                throw new JikanApiException("Jikan voice roles response missing data");
            }
            List<Role> roles = new ArrayList<>();
            for (JsonNode roleNode : data) {
                roles.add(new Role(parseAnimeFromRole(roleNode.path("anime")),
                        parseCharacterFromRole(roleNode.path("character"))));
            }
            return List.copyOf(roles);
        } catch (JikanApiException e) {
            throw e;
        } catch (Exception e) {
            throw new JikanApiException("Jikan voice roles response parse failure", e);
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
        JikanApiException lastFailure = null;
        for (int attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                rateLimit();
                String response = fetcher.get();
                if (response == null) throw new JikanApiException("Jikan returned an empty response");
                return response;
            } catch (HttpStatusCodeException e) {
                int status = e.getStatusCode().value();
                lastFailure = new JikanApiException("Jikan HTTP request failed with status " + status);
                if (!isRetryableStatus(status)) throw lastFailure;
                log.warn("Transient Jikan HTTP failure for {} (attempt {}/{}, status {})",
                        operation, attempt, maxAttempts, status);
            } catch (RestClientException e) {
                lastFailure = new JikanApiException("Jikan transport request failed");
                log.warn("Transient Jikan transport failure for {} (attempt {}/{})",
                        operation, attempt, maxAttempts);
            } catch (JikanApiException e) {
                throw e;
            } catch (Exception e) {
                lastFailure = new JikanApiException("Jikan request failed");
                log.warn("Transient Jikan request failure for {} (attempt {}/{})",
                        operation, attempt, maxAttempts);
            }

            if (attempt < maxAttempts) {
                sleep(backoff + randomJitter());
                backoff = Math.min(maxBackoffMs, Math.max(backoff, backoff * 2));
            }
        }
        throw lastFailure == null ? new JikanApiException("Jikan request failed") : lastFailure;
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
            Thread.sleep(millis);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new JikanApiException("Jikan request interrupted", e);
        }
    }

    @FunctionalInterface
    private interface ThrowingSupplier<T> { T get(); }

    public record CharacterVoiceActor(Character character, int voiceActorMalId,
                                      String voiceActorName, String voiceActorImageUrl) { }

    public static class JikanApiException extends RuntimeException {
        public JikanApiException(String message) { super(message); }
        public JikanApiException(String message, Throwable cause) { super(message, cause); }
    }
}
