package com.seasonalseiyuu.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.seasonalseiyuu.model.RefreshProgress;
import com.seasonalseiyuu.model.SeasonCache;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Optional;

/**
 * Service for managing file-based JSON cache.
 */
@Service
public class CacheService {

    private static final Logger log = LoggerFactory.getLogger(CacheService.class);
    private static final String CACHE_FILE = "season-cache.json";
    private static final String PROGRESS_FILE = "refresh-progress.json";

    private final ObjectMapper objectMapper;
    private final Path cacheDirectory;

    public CacheService(@Value("${cache.directory}") String cacheDir) {
        this.cacheDirectory = Path.of(cacheDir);
        this.objectMapper = new ObjectMapper()
                .registerModule(new JavaTimeModule())
                .enable(SerializationFeature.INDENT_OUTPUT)
                .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
    }

    @PostConstruct
    public void init() {
        try {
            Files.createDirectories(cacheDirectory);
            log.info("Cache directory initialized: {}", cacheDirectory.toAbsolutePath());
        } catch (IOException e) {
            log.error("Failed to create cache directory", e);
        }
    }

    /**
     * Loads the season cache from disk.
     */
    public Optional<SeasonCache> loadCache() {
        Path cachePath = cacheDirectory.resolve(CACHE_FILE);
        if (!Files.exists(cachePath)) {
            log.info("No cache file found");
            return Optional.empty();
        }

        try {
            SeasonCache cache = objectMapper.readValue(cachePath.toFile(), SeasonCache.class);
            log.info("Loaded cache: {} {} with {} voice actors",
                    cache.season(), cache.year(), cache.voiceActors().size());
            return Optional.of(cache);
        } catch (IOException e) {
            log.error("Failed to load cache", e);
            return Optional.empty();
        }
    }

    /**
     * Saves the season cache to disk.
     */
    public void saveCache(SeasonCache cache) {
        Path cachePath = cacheDirectory.resolve(CACHE_FILE);
        try {
            objectMapper.writeValue(cachePath.toFile(), cache);
            log.info("Saved cache: {} {} with {} voice actors",
                    cache.season(), cache.year(), cache.voiceActors().size());
        } catch (IOException e) {
            log.error("Failed to save cache", e);
        }
    }

    /**
     * Checks if cache exists.
     */
    public boolean hasCache() {
        return Files.exists(cacheDirectory.resolve(CACHE_FILE));
    }

    /**
     * Loads refresh progress for resumable operations.
     */
    public Optional<RefreshProgress> loadProgress() {
        Path progressPath = cacheDirectory.resolve(PROGRESS_FILE);
        if (!Files.exists(progressPath)) {
            return Optional.empty();
        }

        try {
            RefreshProgress progress = objectMapper.readValue(progressPath.toFile(), RefreshProgress.class);
            log.info("Loaded refresh progress: phase={}, anime={}/{}, VAs={}/{}",
                    progress.currentPhase(),
                    progress.fetchedAnimeIds().size(), progress.totalAnime(),
                    progress.fetchedVoiceActorIds().size(), progress.totalVoiceActors());
            return Optional.of(progress);
        } catch (IOException e) {
            log.error("Failed to load progress", e);
            return Optional.empty();
        }
    }

    /**
     * Saves refresh progress for resumable operations.
     */
    public void saveProgress(RefreshProgress progress) {
        Path progressPath = cacheDirectory.resolve(PROGRESS_FILE);
        try {
            objectMapper.writeValue(progressPath.toFile(), progress);
            log.debug("Saved refresh progress");
        } catch (IOException e) {
            log.error("Failed to save progress", e);
        }
    }

    /**
     * Deletes the progress file after successful completion.
     */
    public void deleteProgress() {
        Path progressPath = cacheDirectory.resolve(PROGRESS_FILE);
        try {
            Files.deleteIfExists(progressPath);
            log.info("Deleted progress file");
        } catch (IOException e) {
            log.error("Failed to delete progress file", e);
        }
    }
}
