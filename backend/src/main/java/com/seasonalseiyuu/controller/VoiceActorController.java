package com.seasonalseiyuu.controller;

import com.seasonalseiyuu.model.CompareResult;
import com.seasonalseiyuu.model.VoiceActor;
import com.seasonalseiyuu.model.VoiceActorSummary;
import com.seasonalseiyuu.service.CompareService;
import com.seasonalseiyuu.service.SeasonDataService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Comparator;
import java.util.List;

/**
 * REST controller for voice actor endpoints.
 */
@RestController
@RequestMapping("/api")
public class VoiceActorController {

        private final SeasonDataService seasonDataService;
        private final CompareService compareService;

        public VoiceActorController(SeasonDataService seasonDataService, CompareService compareService) {
                this.seasonDataService = seasonDataService;
                this.compareService = compareService;
        }

        /**
         * Get all voice actors in the current season, sorted by show count descending.
         * Returns lightweight summary objects for performance.
         */
        @GetMapping("/voice-actors")
        public ResponseEntity<List<VoiceActorSummary>> getAllVoiceActors() {
                return seasonDataService.getSeasonData()
                                .map(cache -> {
                                        List<VoiceActorSummary> summaries = cache.voiceActors().values().stream()
                                                        .map(VoiceActorSummary::from)
                                                        .sorted(Comparator.comparingInt(
                                                                        VoiceActorSummary::totalSeasonalShows)
                                                                        .reversed()
                                                                        .thenComparing(VoiceActorSummary::name))
                                                        .toList();
                                        return ResponseEntity.ok(summaries);
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
         * Compare two voice actors and find shared anime.
         */
        @GetMapping("/compare/{id1}/{id2}")
        public ResponseEntity<CompareResult> compareVoiceActors(
                        @PathVariable int id1, @PathVariable int id2) {
                CompareResult result = compareService.compare(id1, id2);
                if (result == null) {
                        return ResponseEntity.notFound().build();
                }
                return ResponseEntity.ok(result);
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
