package com.seasonalseiyuu.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.seasonalseiyuu.model.RefreshHealth;
import com.seasonalseiyuu.model.RefreshProgress;
import com.seasonalseiyuu.model.SeasonCache;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.AtomicMoveNotSupportedException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.Optional;

/** File-backed cache, progress, and durable refresh-health storage. */
@Service
public class CacheService {

    private static final Logger log = LoggerFactory.getLogger(CacheService.class);
    static final String CACHE_FILE = "season-cache.json";
    static final String PROGRESS_FILE = "refresh-progress.json";
    static final String HEALTH_FILE = "refresh-health.json";

    private final ObjectMapper objectMapper;
    private final Path cacheDirectory;
    private volatile SeasonCache cachedData;

    public CacheService(@Value("${cache.directory}") String cacheDir) {
        this.cacheDirectory = Path.of(cacheDir);
        this.objectMapper = new ObjectMapper()
                .registerModule(new JavaTimeModule())
                .disable(SerializationFeature.INDENT_OUTPUT)
                .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
    }

    @PostConstruct
    public void init() {
        try {
            Files.createDirectories(cacheDirectory);
            log.info("Cache directory initialized: {}", cacheDirectory.toAbsolutePath());
        } catch (IOException e) {
            throw new CachePersistenceException("Unable to initialize cache directory", e);
        }
    }

    public Optional<SeasonCache> loadCache() {
        SeasonCache inMemory = cachedData;
        if (inMemory != null) {
            return Optional.of(inMemory);
        }

        Path cachePath = cacheDirectory.resolve(CACHE_FILE);
        if (!Files.exists(cachePath)) {
            return Optional.empty();
        }

        try {
            SeasonCache loaded = objectMapper.readValue(cachePath.toFile(), SeasonCache.class);
            validateCache(loaded);
            cachedData = loaded;
            log.info("Loaded cache from disk: {} {} with {} voice actors",
                    loaded.season(), loaded.year(), loaded.voiceActors().size());
            return Optional.of(loaded);
        } catch (IOException | RuntimeException e) {
            log.error("Failed to load cache: {}", safeMessage(e));
            return Optional.empty();
        }
    }

    /**
     * Stages, validates, and promotes a candidate. Memory is updated only after
     * the final move succeeds.
     */
    public synchronized boolean saveCache(SeasonCache cache) {
        validateCache(cache);
        Path staged = null;
        try {
            Files.createDirectories(cacheDirectory);
            staged = Files.createTempFile(cacheDirectory, ".season-cache-", ".tmp");
            objectMapper.writeValue(staged.toFile(), cache);

            SeasonCache readBack = objectMapper.readValue(staged.toFile(), SeasonCache.class);
            validateCache(readBack);
            promote(staged, cacheDirectory.resolve(CACHE_FILE));
            cachedData = readBack;
            log.info("Promoted cache: {} {} with {} voice actors",
                    readBack.season(), readBack.year(), readBack.voiceActors().size());
            return true;
        } catch (IOException | RuntimeException e) {
            log.error("Failed to promote cache candidate: {}", safeMessage(e));
            throw new CachePersistenceException("Unable to promote cache candidate", e);
        } finally {
            if (staged != null) {
                try {
                    Files.deleteIfExists(staged);
                } catch (IOException e) {
                    log.warn("Unable to clean cache staging file");
                }
            }
        }
    }

    public boolean hasCache() {
        return cachedData != null || Files.exists(cacheDirectory.resolve(CACHE_FILE));
    }

    public Optional<RefreshProgress> loadProgress() {
        Path progressPath = cacheDirectory.resolve(PROGRESS_FILE);
        if (!Files.exists(progressPath)) {
            return Optional.empty();
        }
        try {
            RefreshProgress progress = objectMapper.readValue(progressPath.toFile(), RefreshProgress.class);
            if (progress.formatVersion() != RefreshProgress.CURRENT_FORMAT_VERSION) {
                log.warn("Discarding unsupported refresh progress version {}", progress.formatVersion());
                deleteProgress();
                return Optional.empty();
            }
            return Optional.of(progress);
        } catch (IOException | RuntimeException e) {
            log.warn("Discarding unreadable refresh progress: {}", safeMessage(e));
            deleteProgress();
            return Optional.empty();
        }
    }

    public synchronized boolean saveProgress(RefreshProgress progress) {
        if (progress == null || progress.formatVersion() != RefreshProgress.CURRENT_FORMAT_VERSION) {
            throw new IllegalArgumentException("Unsupported refresh progress version");
        }
        Path staged = null;
        try {
            Files.createDirectories(cacheDirectory);
            staged = Files.createTempFile(cacheDirectory, ".refresh-progress-", ".tmp");
            objectMapper.writeValue(staged.toFile(), progress);
            promote(staged, cacheDirectory.resolve(PROGRESS_FILE));
            return true;
        } catch (IOException e) {
            log.error("Failed to save refresh progress: {}", safeMessage(e));
            return false;
        } finally {
            if (staged != null) {
                try { Files.deleteIfExists(staged); } catch (IOException ignored) { }
            }
        }
    }

    public void deleteProgress() {
        try {
            Files.deleteIfExists(cacheDirectory.resolve(PROGRESS_FILE));
        } catch (IOException e) {
            log.warn("Failed to delete refresh progress");
        }
    }

    public Optional<RefreshHealth> loadRefreshHealth() {
        Path healthPath = cacheDirectory.resolve(HEALTH_FILE);
        if (!Files.exists(healthPath)) {
            return Optional.empty();
        }
        try {
            return Optional.of(objectMapper.readValue(healthPath.toFile(), RefreshHealth.class));
        } catch (IOException | RuntimeException e) {
            log.warn("Ignoring unreadable refresh health: {}", safeMessage(e));
            return Optional.empty();
        }
    }

    public synchronized boolean saveRefreshHealth(RefreshHealth health) {
        Path staged = null;
        try {
            Files.createDirectories(cacheDirectory);
            staged = Files.createTempFile(cacheDirectory, ".refresh-health-", ".tmp");
            objectMapper.writeValue(staged.toFile(), sanitizeHealth(health));
            promote(staged, cacheDirectory.resolve(HEALTH_FILE));
            return true;
        } catch (IOException e) {
            log.error("Failed to save refresh health: {}", safeMessage(e));
            return false;
        } finally {
            if (staged != null) {
                try { Files.deleteIfExists(staged); } catch (IOException ignored) { }
            }
        }
    }

    Path cachePath() { return cacheDirectory.resolve(CACHE_FILE); }
    Path healthPath() { return cacheDirectory.resolve(HEALTH_FILE); }
    Path progressPath() { return cacheDirectory.resolve(PROGRESS_FILE); }

    private void promote(Path staged, Path target) throws IOException {
        try {
            Files.move(staged, target, StandardCopyOption.ATOMIC_MOVE, StandardCopyOption.REPLACE_EXISTING);
            return;
        } catch (AtomicMoveNotSupportedException | UnsupportedOperationException ignored) {
            // Continue with the recoverable same-directory replacement below.
        }

        Path backup = target.resolveSibling(target.getFileName() + ".bak");
        boolean hadTarget = Files.exists(target);
        if (hadTarget) {
            Files.move(target, backup, StandardCopyOption.REPLACE_EXISTING);
        }
        try {
            Files.move(staged, target, StandardCopyOption.REPLACE_EXISTING);
            Files.deleteIfExists(backup);
        } catch (IOException e) {
            if (hadTarget && Files.exists(backup)) {
                try { Files.move(backup, target, StandardCopyOption.REPLACE_EXISTING); }
                catch (IOException restoreFailure) { e.addSuppressed(restoreFailure); }
            }
            throw e;
        }
    }

    private void validateCache(SeasonCache cache) {
        if (cache == null || cache.season() == null || cache.voiceActors() == null) {
            throw new IllegalArgumentException("Candidate cache is incomplete");
        }
    }

    private String safeMessage(Throwable throwable) {
        String message = throwable.getMessage();
        if (message == null || message.isBlank()) return throwable.getClass().getSimpleName();
        return message.replaceAll("[\\r\\n\\t]", " ").substring(0, Math.min(message.length(), 240));
    }

    private RefreshHealth sanitizeHealth(RefreshHealth health) {
        if (health == null) return RefreshHealth.empty();
        String summary = health.summary().replaceAll("[\\r\\n\\t]", " ")
                .replaceAll("(?i)(x-api-key|authorization|cookie)\\s*[:=]\\s*\\S+", "$1=[redacted]")
                .replaceAll("(?i)(response body|stack trace)\\s*[:=].*", "$1=[redacted]");
        summary = summary.substring(0, Math.min(240, summary.length()));
        return new RefreshHealth(health.lastAttempt(), health.lastSuccess(), health.outcome(), summary,
                health.activeSeason(), health.activeYear(), health.candidateSeason(), health.candidateYear(),
                health.incompleteAnimeCount());
    }

    public static class CachePersistenceException extends RuntimeException {
        public CachePersistenceException(String message, Throwable cause) { super(message, cause); }
    }
}
