package com.seasonalseiyuu.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/** Typed provider-neutral anime-data endpoint and pacing settings. */
@ConfigurationProperties(prefix = "anime-data")
public class AnimeDataProperties {
    private String baseUrl = "https://api.tenrai.org/v1";
    private long rateLimitMs = 1000;
    private int connectTimeoutMs = 10000;
    private int readTimeoutMs = 30000;
    private long maxInlineRetryAfterMs = 60_000;

    public String getBaseUrl() { return baseUrl; }
    public void setBaseUrl(String baseUrl) { this.baseUrl = baseUrl; }
    public long getRateLimitMs() { return rateLimitMs; }
    public void setRateLimitMs(long rateLimitMs) { this.rateLimitMs = rateLimitMs; }
    public int getConnectTimeoutMs() { return connectTimeoutMs; }
    public void setConnectTimeoutMs(int connectTimeoutMs) { this.connectTimeoutMs = connectTimeoutMs; }
    public int getReadTimeoutMs() { return readTimeoutMs; }
    public void setReadTimeoutMs(int readTimeoutMs) { this.readTimeoutMs = readTimeoutMs; }
    public long getMaxInlineRetryAfterMs() { return maxInlineRetryAfterMs; }
    public void setMaxInlineRetryAfterMs(long maxInlineRetryAfterMs) { this.maxInlineRetryAfterMs = maxInlineRetryAfterMs; }
}
