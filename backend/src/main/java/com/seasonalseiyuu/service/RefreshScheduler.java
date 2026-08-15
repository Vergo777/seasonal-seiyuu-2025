package com.seasonalseiyuu.service;

import com.seasonalseiyuu.config.RefreshProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/** In-process daily reconciliation and delayed startup catch-up. */
@Component
public class RefreshScheduler {
    private static final Logger log = LoggerFactory.getLogger(RefreshScheduler.class);

    private final SeasonDataService seasonDataService;
    private final RefreshProperties properties;

    public RefreshScheduler(SeasonDataService seasonDataService, RefreshProperties properties) {
        this.seasonDataService = seasonDataService;
        this.properties = properties;
    }

    @Scheduled(cron = "${refresh.daily-cron:0 0 3 * * *}", zone = "${refresh.zone:UTC}")
    public void scheduledRefresh() {
        if (!properties.isEnabled()) return;
        if (seasonDataService.startRefresh()) {
            log.info("Started scheduled season refresh");
        }
    }

    @EventListener(ApplicationReadyEvent.class)
    public void startupCatchUp() {
        if (!properties.isEnabled()) return;
        Thread.startVirtualThread(() -> {
            try {
                Thread.sleep(properties.getStartupDelay().toMillis());
                if (seasonDataService.isCacheStale() && seasonDataService.startRefresh()) {
                    log.info("Started stale-cache startup catch-up refresh");
                }
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        });
    }
}
