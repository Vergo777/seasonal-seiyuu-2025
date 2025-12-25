package com.seasonalseiyuu.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.seasonalseiyuu.model.Anime;
import com.seasonalseiyuu.model.Character;
import com.seasonalseiyuu.model.Role;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.ArrayList;
import java.util.List;

/**
 * Service for interacting with the Jikan API (MyAnimeList unofficial API).
 */
@Service
public class JikanApiService {

    private static final Logger log = LoggerFactory.getLogger(JikanApiService.class);

    private final RestClient restClient;
    private final ObjectMapper objectMapper;
    private final long rateLimitMs;

    public JikanApiService(
            @Value("${jikan.base-url}") String baseUrl,
            @Value("${jikan.rate-limit-ms}") long rateLimitMs,
            ObjectMapper objectMapper) {
        this.restClient = RestClient.builder()
                .baseUrl(baseUrl)
                .build();
        this.objectMapper = objectMapper;
        this.rateLimitMs = rateLimitMs;
    }

    /**
     * Fetches all anime from the current season (handles pagination).
     */
    public List<Anime> getCurrentSeasonAnime() {
        List<Anime> allAnime = new ArrayList<>();
        int page = 1;
        boolean hasNextPage = true;

        while (hasNextPage) {
            log.info("Fetching season anime page {}", page);
            String response = restClient.get()
                    .uri("/seasons/now?page={page}", page)
                    .retrieve()
                    .body(String.class);

            try {
                JsonNode root = objectMapper.readTree(response);
                JsonNode data = root.get("data");

                if (data != null && data.isArray()) {
                    for (JsonNode animeNode : data) {
                        allAnime.add(parseAnime(animeNode));
                    }
                }

                hasNextPage = root.path("pagination").path("has_next_page").asBoolean(false);
                page++;

                rateLimit();
            } catch (Exception e) {
                log.error("Error parsing anime response", e);
                break;
            }
        }

        log.info("Fetched {} anime from current season", allAnime.size());
        return allAnime;
    }

    /**
     * Fetches characters and voice actors for a specific anime.
     */
    public List<CharacterVoiceActor> getAnimeCharacters(int animeId) {
        List<CharacterVoiceActor> results = new ArrayList<>();

        log.debug("Fetching characters for anime {}", animeId);
        String response = restClient.get()
                .uri("/anime/{id}/characters", animeId)
                .retrieve()
                .body(String.class);

        try {
            JsonNode root = objectMapper.readTree(response);
            JsonNode data = root.get("data");

            if (data != null && data.isArray()) {
                for (JsonNode charNode : data) {
                    Character character = parseCharacter(charNode);

                    // Get Japanese voice actors
                    JsonNode voiceActors = charNode.path("voice_actors");
                    for (JsonNode vaNode : voiceActors) {
                        if ("Japanese".equals(vaNode.path("language").asText())) {
                            results.add(new CharacterVoiceActor(
                                    character,
                                    vaNode.path("person").path("mal_id").asInt(),
                                    vaNode.path("person").path("name").asText(),
                                    vaNode.path("person").path("images").path("jpg").path("image_url").asText()));
                        }
                    }
                }
            }

            rateLimit();
        } catch (Exception e) {
            log.error("Error fetching characters for anime {}", animeId, e);
        }

        return results;
    }

    /**
     * Fetches all voice roles for a person (voice actor).
     */
    public List<Role> getPersonVoiceRoles(int personId) {
        List<Role> roles = new ArrayList<>();

        log.debug("Fetching voice roles for person {}", personId);
        String response = restClient.get()
                .uri("/people/{id}/voices", personId)
                .retrieve()
                .body(String.class);

        try {
            JsonNode root = objectMapper.readTree(response);
            JsonNode data = root.get("data");

            if (data != null && data.isArray()) {
                for (JsonNode roleNode : data) {
                    Anime anime = parseAnimeFromRole(roleNode.path("anime"));
                    Character character = parseCharacterFromRole(roleNode.path("character"));
                    roles.add(new Role(anime, character));
                }
            }

            rateLimit();
        } catch (Exception e) {
            log.error("Error fetching voice roles for person {}", personId, e);
        }

        return roles;
    }

    private Anime parseAnime(JsonNode node) {
        return new Anime(
                node.path("mal_id").asInt(),
                node.path("title").asText(),
                node.path("title_english").asText(null),
                node.path("images").path("jpg").path("large_image_url").asText(),
                node.path("synopsis").asText(""),
                node.path("season").asText(),
                node.path("year").asInt());
    }

    private Anime parseAnimeFromRole(JsonNode node) {
        return new Anime(
                node.path("mal_id").asInt(),
                node.path("title").asText(),
                null,
                node.path("images").path("jpg").path("large_image_url").asText(),
                "",
                "",
                0);
    }

    private Character parseCharacter(JsonNode node) {
        JsonNode charData = node.path("character");
        return new Character(
                charData.path("mal_id").asInt(),
                charData.path("name").asText(),
                charData.path("images").path("jpg").path("image_url").asText(),
                node.path("role").asText());
    }

    private Character parseCharacterFromRole(JsonNode node) {
        return new Character(
                node.path("mal_id").asInt(),
                node.path("name").asText(),
                node.path("images").path("jpg").path("image_url").asText(),
                "");
    }

    private void rateLimit() {
        try {
            Thread.sleep(rateLimitMs);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }

    /**
     * DTO for character with voice actor info.
     */
    public record CharacterVoiceActor(
            Character character,
            int voiceActorMalId,
            String voiceActorName,
            String voiceActorImageUrl) {
    }
}
