package com.seasonalseiyuu.config;

import org.junit.jupiter.api.Test;

import java.time.Duration;

import static org.assertj.core.api.Assertions.assertThat;

class RefreshPropertiesTest {
    @Test
    void defaultsKeepAutomationDisabledAndUseSafeRetryBounds() {
        RefreshProperties properties = new RefreshProperties();

        assertThat(properties.isEnabled()).isFalse();
        assertThat(properties.getZone()).isEqualTo("UTC");
        assertThat(properties.getFreshnessThreshold()).isEqualTo(Duration.ofHours(24));
        assertThat(properties.getRetryMaxAttempts()).isEqualTo(5);
        assertThat(properties.getRetryMaxBackoff()).isEqualTo(Duration.ofSeconds(30));
    }
}
