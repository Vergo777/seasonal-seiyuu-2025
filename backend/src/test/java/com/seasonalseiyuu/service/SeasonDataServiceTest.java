package com.seasonalseiyuu.service;

import com.seasonalseiyuu.config.RefreshProperties;
import com.seasonalseiyuu.model.Anime;
import com.seasonalseiyuu.model.Character;
import com.seasonalseiyuu.model.RefreshProgress;
import com.seasonalseiyuu.model.Role;
import com.seasonalseiyuu.model.SeasonCache;
import com.seasonalseiyuu.service.JikanApiService.CharacterVoiceActor;
import com.seasonalseiyuu.service.JikanApiService.SeasonAnimeResult;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SeasonDataServiceTest {
    @Mock JikanApiService jikanApi;
    @Mock CacheService cacheService;

    private SeasonDataService service;
    private final Anime anime = new Anime(100, "Test Anime", null, "image", "", "winter", 2026);

    @BeforeEach
    void setUp() {
        RefreshProperties properties = new RefreshProperties();
        properties.setRetryMaxAttempts(1);
        service = new SeasonDataService(jikanApi, cacheService, properties);
        when(cacheService.loadCache()).thenReturn(Optional.empty());
        lenient().when(cacheService.loadProgress()).thenReturn(Optional.empty());
        lenient().when(cacheService.loadRefreshHealth()).thenReturn(Optional.empty());
        lenient().when(cacheService.saveProgress(any())).thenReturn(true);
        lenient().when(cacheService.saveCache(any())).thenReturn(true);
    }

    @Test
    void successfulRefreshPublishesCandidateAndClearsProgress() {
        CharacterVoiceActor cva = cva(200, "Test VA", "Character");
        when(jikanApi.getCurrentSeasonAnime()).thenReturn(new SeasonAnimeResult(List.of(anime), 1));
        when(jikanApi.getAnimeCharacters(100)).thenReturn(List.of(cva));
        when(jikanApi.getPersonVoiceRoles(200)).thenReturn(List.of(new Role(anime, cva.character())));

        assertThat(service.refreshNow()).isTrue();

        ArgumentCaptor<SeasonCache> candidate = ArgumentCaptor.forClass(SeasonCache.class);
        verify(cacheService).saveCache(candidate.capture());
        assertThat(candidate.getValue().season()).isEqualTo("winter");
        assertThat(candidate.getValue().voiceActors()).containsKey(200);
        verify(cacheService).deleteProgress();
        assertThat(service.getRefreshHealth().outcome()).isEqualTo("success");
    }

    @Test
    void failedItemRequestRetainsProgressAndActiveCache() {
        when(jikanApi.getCurrentSeasonAnime()).thenReturn(new SeasonAnimeResult(List.of(anime), 1));
        when(jikanApi.getAnimeCharacters(100)).thenThrow(new JikanApiService.JikanApiException("upstream unavailable"));

        assertThat(service.refreshNow()).isTrue();

        verify(cacheService, never()).saveCache(any());
        verify(cacheService, never()).deleteProgress();
        assertThat(service.getRefreshHealth().outcome()).isEqualTo("failed");
    }

    @Test
    void successfulEmptyCastIsPublishedAndReportedIncomplete() {
        when(jikanApi.getCurrentSeasonAnime()).thenReturn(new SeasonAnimeResult(List.of(anime), 1));
        when(jikanApi.getAnimeCharacters(100)).thenReturn(List.of());

        assertThat(service.refreshNow()).isTrue();

        ArgumentCaptor<SeasonCache> candidate = ArgumentCaptor.forClass(SeasonCache.class);
        verify(cacheService).saveCache(candidate.capture());
        assertThat(candidate.getValue().voiceActors()).isEmpty();
        assertThat(service.getRefreshHealth().incompleteAnimeCount()).isEqualTo(1);
    }

    @Test
    void incompleteSeasonPaginationDoesNotPublish() {
        when(jikanApi.getCurrentSeasonAnime()).thenReturn(new SeasonAnimeResult(List.of(anime), 2));

        service.refreshNow();

        verify(cacheService, never()).saveCache(any());
        assertThat(service.getRefreshHealth().outcome()).isEqualTo("failed");
    }

    @Test
    void incompatibleProgressIsDiscardedBeforeFreshRun() {
        RefreshProgress progress = new RefreshProgress(RefreshProgress.CURRENT_FORMAT_VERSION,
                "fall", 2025, Set.of(999), Set.of(), Map.of(), Map.of(), Map.of(), Set.of(),
                RefreshProgress.RefreshPhase.FETCHING_CHARACTERS, 1, 0);
        when(cacheService.loadProgress()).thenReturn(Optional.of(progress));
        when(jikanApi.getCurrentSeasonAnime()).thenReturn(new SeasonAnimeResult(List.of(anime), 1));
        when(jikanApi.getAnimeCharacters(100)).thenReturn(List.of());

        service.refreshNow();

        verify(cacheService, times(2)).deleteProgress();
        verify(jikanApi).getAnimeCharacters(100);
    }

    @Test
    void concurrentTriggerDoesNotStartSecondRefresh() throws Exception {
        CountDownLatch entered = new CountDownLatch(1);
        CountDownLatch release = new CountDownLatch(1);
        when(jikanApi.getCurrentSeasonAnime()).thenAnswer(invocation -> {
            entered.countDown();
            release.await(2, TimeUnit.SECONDS);
            return new SeasonAnimeResult(List.of(anime), 1);
        });
        when(jikanApi.getAnimeCharacters(100)).thenReturn(List.of());

        assertThat(service.startRefresh()).isTrue();
        assertThat(entered.await(2, TimeUnit.SECONDS)).isTrue();
        assertThat(service.startRefresh()).isFalse();
        release.countDown();
        while (service.getRefreshStatus().inProgress()) Thread.sleep(5);
        verify(jikanApi, times(1)).getCurrentSeasonAnime();
    }

    private CharacterVoiceActor cva(int vaId, String name, String characterName) {
        return new CharacterVoiceActor(new Character(300, characterName, "", "Main"), vaId, name, "");
    }
}
