package com.seasonalseiyuu.controller;

import com.seasonalseiyuu.model.SeasonCache;
import com.seasonalseiyuu.model.VoiceActor;
import com.seasonalseiyuu.service.SeasonDataService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Comparator;
import java.util.List;
import java.util.Map;

/**
 * REST controller for voice actor endpoints.
 */
@RestController
@RequestMapping("/api")
public class VoiceActorController {

    private final SeasonDataService seasonDataService;

    public VoiceActorController(SeasonDataService seasonDataService) {
        this.seasonDataService = seasonDataService;
    }

    /**
     * Get all voice actors in the current season, sorted by show count descending.
     */
    @GetMapping("/voice-actors")
    public ResponseEntity<List<VoiceActor>> getAllVoiceActors() {
        return seasonDataService.getSeasonData()
                .map(cache -> {
                    List<VoiceActor> sorted = cache.voiceActors().values().stream()
                            .sorted(Comparator.comparingInt(VoiceActor::totalSeasonalShows).reversed()
                                    .thenComparing(VoiceActor::name))
                            .toList();
                    return ResponseEntity.ok(sorted);
                })
                .orElse(ResponseEntity.ok(List.of()));
    }

    /**
     * Get a specific voice actor by ID.
     */
    @GetMapping("/voice-actors/{id}")
    public ResponseEntity<VoiceActor> getVoiceActor(@PathVariable int id) {
        return seasonDataService.getVoiceActor(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Get season info and cache status.
     */
    @GetMapping("/season-info")
    public ResponseEntity<SeasonInfo> getSeasonInfo() {
        return seasonDataService.getSeasonData()
                .map(cache -> ResponseEntity.ok(new SeasonInfo(
                        cache.season(),
                        cache.year(),
                        cache.voiceActors().size(),
                        cache.lastRefreshed().toString())))
                .orElse(ResponseEntity.ok(new SeasonInfo(
                        null, 0, 0, null)));
    }

    public record SeasonInfo(String season, int year, int voiceActorCount, String lastRefreshed) {
    }
}
