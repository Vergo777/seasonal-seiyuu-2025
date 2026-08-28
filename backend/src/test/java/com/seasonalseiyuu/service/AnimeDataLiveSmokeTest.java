package com.seasonalseiyuu.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.seasonalseiyuu.config.AnimeDataProperties;
import com.seasonalseiyuu.config.RefreshProperties;
import com.seasonalseiyuu.model.Anime;
import com.seasonalseiyuu.model.Role;
import com.seasonalseiyuu.service.AnimeDataApiService.CharacterVoiceActor;
import com.seasonalseiyuu.service.AnimeDataApiService.SeasonAnimeResult;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Opt-in live compatibility coverage for the public Tenrai v1 service.
 * Run with {@code TENRAI_LIVE_SMOKE=true} and keep it out of offline CI.
 */
@EnabledIfEnvironmentVariable(named = "TENRAI_LIVE_SMOKE", matches = "true")
class AnimeDataLiveSmokeTest {

    private static final int KNOWN_ANIME_ID = 5114;
    private static final int KNOWN_PERSON_ID = 1;

    @Test
    void requiredTenraiEndpointFamiliesRemainCompatible() {
        AnimeDataApiService client = new AnimeDataApiService(
                new AnimeDataProperties(), new RefreshProperties(), new ObjectMapper());

        SeasonAnimeResult season = client.getCurrentSeasonAnime();
        assertThat(season.anime()).isNotEmpty();
        assertThat(season.isComplete()).isTrue();
        assertThat(season.anime()).allSatisfy(anime -> {
            assertThat(anime.malId()).isPositive();
            assertThat(anime.season()).isNotBlank();
            assertThat(anime.year()).isPositive();
        });

        List<CharacterVoiceActor> characters = client.getAnimeCharacters(KNOWN_ANIME_ID);
        assertThat(characters).isNotEmpty();
        assertThat(characters).allSatisfy(character -> {
            assertThat(character.character().malId()).isPositive();
            assertThat(character.voiceActorMalId()).isPositive();
            assertThat(character.voiceActorName()).isNotBlank();
        });

        List<Role> roles = client.getPersonVoiceRoles(KNOWN_PERSON_ID);
        assertThat(roles).isNotEmpty();
        assertThat(roles).allSatisfy(role -> {
            Anime anime = role.anime();
            assertThat(anime.malId()).isPositive();
            assertThat(anime.title()).isNotBlank();
            assertThat(role.character().malId()).isPositive();
            assertThat(role.character().name()).isNotBlank();
        });
    }
}
