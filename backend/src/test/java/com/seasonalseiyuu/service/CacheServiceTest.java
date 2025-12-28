package com.seasonalseiyuu.service;

import com.seasonalseiyuu.model.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.io.IOException;
import java.nio.file.Path;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Unit tests for CacheService.
 * Uses @TempDir to isolate file system operations.
 */
class CacheServiceTest {

    @TempDir
    Path tempDir;

    private CacheService cacheService;

    @BeforeEach
    void setUp() {
        cacheService = new CacheService(tempDir.toString());
        cacheService.init();
    }

    @Test
    void saveCache_writesJsonToDisk() {
        // Given
        SeasonCache cache = createTestCache();

        // When
        cacheService.saveCache(cache);

        // Then
        Path cacheFile = tempDir.resolve("season-cache.json");
        assertThat(cacheFile).exists();
    }

    @Test
    void loadCache_readsFromDisk() {
        // Given
        SeasonCache original = createTestCache();
        cacheService.saveCache(original);

        // Create new instance to clear in-memory cache
        CacheService freshService = new CacheService(tempDir.toString());

        // When
        Optional<SeasonCache> loaded = freshService.loadCache();

        // Then
        assertThat(loaded).isPresent();
        SeasonCache cache = loaded.get();
        assertThat(cache.season()).isEqualTo("fall");
        assertThat(cache.year()).isEqualTo(2025);
        assertThat(cache.voiceActors()).hasSize(1);

        VoiceActor va = cache.voiceActors().get(2001);
        assertThat(va).isNotNull();
        assertThat(va.name()).isEqualTo("Test VA");
        assertThat(va.totalSeasonalShows()).isEqualTo(1);
    }

    @Test
    void loadCache_returnsEmptyWhenFileNotFound() {
        // When (no cache saved)
        Optional<SeasonCache> loaded = cacheService.loadCache();

        // Then
        assertThat(loaded).isEmpty();
    }

    @Test
    void loadCache_returnsFromMemoryOnSecondCall() {
        // Given
        SeasonCache cache = createTestCache();
        cacheService.saveCache(cache);

        // When - load twice
        Optional<SeasonCache> first = cacheService.loadCache();
        Optional<SeasonCache> second = cacheService.loadCache();

        // Then - both should return same data (from memory on second call)
        assertThat(first).isPresent();
        assertThat(second).isPresent();
        assertThat(first.get()).isSameAs(second.get());
    }

    @Test
    void hasCache_returnsTrueWhenCacheExists() {
        // Given
        cacheService.saveCache(createTestCache());

        // When & Then
        assertThat(cacheService.hasCache()).isTrue();
    }

    @Test
    void hasCache_returnsFalseWhenNoCacheExists() {
        // When & Then (no save)
        assertThat(cacheService.hasCache()).isFalse();
    }

    @Test
    void saveProgress_and_loadProgress_roundTrip() {
        // Given
        RefreshProgress progress = new RefreshProgress(
                "fall", 2025,
                Set.of(1, 2, 3),
                Set.of(100, 200),
                Map.of(),
                RefreshProgress.RefreshPhase.FETCHING_CHARACTERS,
                10, 5);

        // When
        cacheService.saveProgress(progress);
        Optional<RefreshProgress> loaded = cacheService.loadProgress();

        // Then
        assertThat(loaded).isPresent();
        RefreshProgress result = loaded.get();
        assertThat(result.season()).isEqualTo("fall");
        assertThat(result.year()).isEqualTo(2025);
        assertThat(result.fetchedAnimeIds()).containsExactlyInAnyOrder(1, 2, 3);
        assertThat(result.fetchedVoiceActorIds()).containsExactlyInAnyOrder(100, 200);
        assertThat(result.currentPhase()).isEqualTo(RefreshProgress.RefreshPhase.FETCHING_CHARACTERS);
        assertThat(result.totalAnime()).isEqualTo(10);
        assertThat(result.totalVoiceActors()).isEqualTo(5);
    }

    @Test
    void loadProgress_returnsEmptyWhenNoProgressFile() {
        // When
        Optional<RefreshProgress> loaded = cacheService.loadProgress();

        // Then
        assertThat(loaded).isEmpty();
    }

    @Test
    void deleteProgress_removesFile() throws IOException {
        // Given
        RefreshProgress progress = new RefreshProgress(
                "fall", 2025, Set.of(), Set.of(), Map.of(),
                RefreshProgress.RefreshPhase.FETCHING_CHARACTERS, 0, 0);
        cacheService.saveProgress(progress);
        Path progressFile = tempDir.resolve("refresh-progress.json");
        assertThat(progressFile).exists();

        // When
        cacheService.deleteProgress();

        // Then
        assertThat(progressFile).doesNotExist();
    }

    // Helper methods

    private SeasonCache createTestCache() {
        Anime anime = new Anime(12345, "Test Anime", "Test Anime EN",
                "https://example.com/image.jpg", "Synopsis", "fall", 2025);
        com.seasonalseiyuu.model.Character character = new com.seasonalseiyuu.model.Character(1001, "Test Character",
                "https://example.com/char.jpg", "Main");
        Role role = new Role(anime, character);

        VoiceActor va = VoiceActor.create(2001, "Test VA",
                "https://example.com/va.jpg", List.of(role), List.of(role));

        return new SeasonCache("fall", 2025, Instant.now(), Map.of(2001, va));
    }
}
