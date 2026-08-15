package com.seasonalseiyuu.controller;

import com.seasonalseiyuu.model.CompareResult;
import com.seasonalseiyuu.model.VoiceActor;
import com.seasonalseiyuu.model.VoiceActorSummary;
import com.seasonalseiyuu.model.RefreshHealth;
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
                RefreshHealth health = seasonDataService.getRefreshHealth();
                SeasonDataService.RefreshStatus status = seasonDataService.getRefreshStatus();
                if (health == null) health = RefreshHealth.empty();
                if (status == null) status = new SeasonDataService.RefreshStatus(false, "Idle", 0, 0);
                final RefreshHealth responseHealth = health;
                final SeasonDataService.RefreshStatus responseStatus = status;
                return seasonDataService.getSeasonData()
                                .map(cache -> ResponseEntity.ok(SeasonInfo.from(cache, responseHealth, responseStatus)))
                                .orElse(ResponseEntity.ok(SeasonInfo.empty(responseHealth, responseStatus)));
        }

        public record SeasonInfo(
                        String season, Integer year, int voiceActorCount, String lastRefreshed,
                        String lastAttempt, String lastSuccess, String refreshOutcome,
                        String activeSeason, Integer activeYear, String candidateSeason, Integer candidateYear,
                        int incompleteAnimeCount, boolean refreshInProgress, String refreshPhase,
                        int completedAnime, int totalAnime, int completedVoiceActors, int totalVoiceActors) {
                public static SeasonInfo from(com.seasonalseiyuu.model.SeasonCache cache,
                                RefreshHealth health, SeasonDataService.RefreshStatus status) {
                        String refreshed = cache.lastRefreshed() == null ? null : cache.lastRefreshed().toString();
                        return new SeasonInfo(cache.season(), cache.year(), cache.voiceActors().size(), refreshed,
                                        instant(health.lastAttempt()), instant(health.lastSuccess(), refreshed), health.outcome(),
                                        health.activeSeason() == null ? cache.season() : health.activeSeason(),
                                        health.activeYear() == null ? cache.year() : health.activeYear(),
                                        health.candidateSeason(), health.candidateYear(), health.incompleteAnimeCount(),
                                        status.inProgress(), status.phase(), status.completedAnime(), status.totalAnime(),
                                        status.completedVoiceActors(), status.totalVoiceActors());
                }

                public static SeasonInfo empty(RefreshHealth health, SeasonDataService.RefreshStatus status) {
                        return new SeasonInfo(null, null, 0, null, instant(health.lastAttempt()),
                                        instant(health.lastSuccess()), health.outcome(), health.activeSeason(), health.activeYear(),
                                        health.candidateSeason(), health.candidateYear(), health.incompleteAnimeCount(),
                                        status.inProgress(), status.phase(), status.completedAnime(), status.totalAnime(),
                                        status.completedVoiceActors(), status.totalVoiceActors());
                }

                private static String instant(java.time.Instant value) {
                        return value == null ? null : value.toString();
                }

                private static String instant(java.time.Instant value, String fallback) {
                        return value == null ? fallback : value.toString();
                }
        }
}
