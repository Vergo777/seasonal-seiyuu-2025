package com.seasonalseiyuu.service;

import com.seasonalseiyuu.config.RefreshProperties;
import org.junit.jupiter.api.Test;

import java.time.Duration;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

class RefreshSchedulerTest {
    @Test
    void disabledSchedulerDoesNotStartScheduledOrStartupRefresh() throws Exception {
        SeasonDataService service = mock(SeasonDataService.class);
        RefreshProperties properties = new RefreshProperties();
        properties.setEnabled(false);
        RefreshScheduler scheduler = new RefreshScheduler(service, properties);

        scheduler.scheduledRefresh();
        scheduler.startupCatchUp();
        Thread.sleep(20);

        verifyNoInteractions(service);
    }

    @Test
    void scheduledRefreshUsesSingleFlightEntryPoint() {
        SeasonDataService service = mock(SeasonDataService.class);
        when(service.startRefresh()).thenReturn(true);
        RefreshProperties properties = new RefreshProperties();
        properties.setEnabled(true);

        new RefreshScheduler(service, properties).scheduledRefresh();

        verify(service).startRefresh();
    }

    @Test
    void startupCatchUpRunsOnlyForMissingOrStaleCache() throws Exception {
        SeasonDataService service = mock(SeasonDataService.class);
        when(service.isCacheStale()).thenReturn(true);
        when(service.startRefresh()).thenReturn(true);
        RefreshProperties properties = new RefreshProperties();
        properties.setEnabled(true);
        properties.setStartupDelay(Duration.ZERO);
        RefreshScheduler scheduler = new RefreshScheduler(service, properties);

        scheduler.startupCatchUp();

        long deadline = System.nanoTime() + TimeUnit.SECONDS.toNanos(2);
        while (System.nanoTime() < deadline) {
            try {
                verify(service).startRefresh();
                break;
            } catch (AssertionError ignored) {
                Thread.sleep(10);
            }
        }
        verify(service).isCacheStale();
    }
}
