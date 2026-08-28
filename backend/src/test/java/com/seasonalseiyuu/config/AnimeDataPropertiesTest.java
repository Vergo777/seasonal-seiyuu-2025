package com.seasonalseiyuu.config;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class AnimeDataPropertiesTest {
    @Test
    void defaultsUseTenraiAndConservativePacing() {
        AnimeDataProperties properties = new AnimeDataProperties();

        assertThat(properties.getBaseUrl()).isEqualTo("https://api.tenrai.org/v1");
        assertThat(properties.getRateLimitMs()).isEqualTo(1000);
        assertThat(properties.getConnectTimeoutMs()).isEqualTo(10000);
        assertThat(properties.getReadTimeoutMs()).isEqualTo(30000);
    }
}
