package com.seasonalseiyuu.service;

import com.seasonalseiyuu.model.CompareResult;
import com.seasonalseiyuu.model.CompareResult.SharedAnime;
import com.seasonalseiyuu.model.CompareResult.VoiceActorSummary;
import com.seasonalseiyuu.model.Role;
import com.seasonalseiyuu.model.VoiceActor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Service for comparing two voice actors.
 */
@Service
public class CompareService {

    private final SeasonDataService seasonDataService;

    public CompareService(SeasonDataService seasonDataService) {
        this.seasonDataService = seasonDataService;
    }

    /**
     * Compare two voice actors and find their shared anime.
     */
    public CompareResult compare(int vaId1, int vaId2) {
        VoiceActor va1 = seasonDataService.getVoiceActor(vaId1).orElse(null);
        VoiceActor va2 = seasonDataService.getVoiceActor(vaId2).orElse(null);

        if (va1 == null || va2 == null) {
            return null;
        }

        // Build a map of anime ID -> list of character names for VA1
        Map<Integer, List<String>> va1AnimeToCharacters = new HashMap<>();
        Map<Integer, Role> animeInfo = new HashMap<>(); // Store anime details

        if (va1.allTimeRoles() != null) {
            for (Role role : va1.allTimeRoles()) {
                int animeId = role.anime().malId();
                va1AnimeToCharacters.computeIfAbsent(animeId, k -> new ArrayList<>())
                        .add(role.character() != null ? role.character().name() : "Unknown");
                animeInfo.putIfAbsent(animeId, role);
            }
        }

        // Build a map for VA2's characters in shared anime
        Map<Integer, List<String>> va2AnimeToCharacters = new HashMap<>();
        if (va2.allTimeRoles() != null) {
            for (Role role : va2.allTimeRoles()) {
                int animeId = role.anime().malId();
                if (va1AnimeToCharacters.containsKey(animeId)) {
                    va2AnimeToCharacters.computeIfAbsent(animeId, k -> new ArrayList<>())
                            .add(role.character() != null ? role.character().name() : "Unknown");
                    animeInfo.putIfAbsent(animeId, role);
                }
            }
        }

        // Create SharedAnime entries for anime where both VAs appear
        List<SharedAnime> sharedAnime = new ArrayList<>();
        for (Integer animeId : va2AnimeToCharacters.keySet()) {
            Role roleInfo = animeInfo.get(animeId);
            sharedAnime.add(new SharedAnime(
                    animeId,
                    roleInfo.anime().title(),
                    roleInfo.anime().imageUrl(),
                    va1AnimeToCharacters.get(animeId),
                    va2AnimeToCharacters.get(animeId)));
        }

        return new CompareResult(
                VoiceActorSummary.from(va1),
                VoiceActorSummary.from(va2),
                sharedAnime);
    }
}
