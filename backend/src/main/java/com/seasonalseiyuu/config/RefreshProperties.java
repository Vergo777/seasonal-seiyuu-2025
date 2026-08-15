package com.seasonalseiyuu.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.time.Duration;

/** Typed settings for automatic refresh and bounded upstream retries. */
@ConfigurationProperties(prefix = "refresh")
public class RefreshProperties {
    private boolean enabled = false;
    private String dailyCron = "0 0 3 * * *";
    private String zone = "UTC";
    private Duration startupDelay = Duration.ofSeconds(15);
    private Duration freshnessThreshold = Duration.ofHours(24);
    private int retryMaxAttempts = 5;
    private Duration retryInitialBackoff = Duration.ofSeconds(1);
    private Duration retryMaxBackoff = Duration.ofSeconds(30);
    private Duration retryJitter = Duration.ofMillis(250);

    public boolean isEnabled() { return enabled; }
    public void setEnabled(boolean enabled) { this.enabled = enabled; }
    public String getDailyCron() { return dailyCron; }
    public void setDailyCron(String dailyCron) { this.dailyCron = dailyCron; }
    public String getZone() { return zone; }
    public void setZone(String zone) { this.zone = zone; }
    public Duration getStartupDelay() { return startupDelay; }
    public void setStartupDelay(Duration startupDelay) { this.startupDelay = startupDelay; }
    public Duration getFreshnessThreshold() { return freshnessThreshold; }
    public void setFreshnessThreshold(Duration freshnessThreshold) { this.freshnessThreshold = freshnessThreshold; }
    public int getRetryMaxAttempts() { return retryMaxAttempts; }
    public void setRetryMaxAttempts(int retryMaxAttempts) { this.retryMaxAttempts = retryMaxAttempts; }
    public Duration getRetryInitialBackoff() { return retryInitialBackoff; }
    public void setRetryInitialBackoff(Duration retryInitialBackoff) { this.retryInitialBackoff = retryInitialBackoff; }
    public Duration getRetryMaxBackoff() { return retryMaxBackoff; }
    public void setRetryMaxBackoff(Duration retryMaxBackoff) { this.retryMaxBackoff = retryMaxBackoff; }
    public Duration getRetryJitter() { return retryJitter; }
    public void setRetryJitter(Duration retryJitter) { this.retryJitter = retryJitter; }
}
