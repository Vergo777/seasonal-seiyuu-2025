package com.seasonalseiyuu.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/** Typed Jikan endpoint and pacing settings. */
@ConfigurationProperties(prefix = "jikan")
public class JikanProperties {
    private String baseUrl = "https://api.jikan.moe/v4";
    private long rateLimitMs = 1000;
    private int connectTimeoutMs = 10000;
    private int readTimeoutMs = 30000;

    public String getBaseUrl() { return baseUrl; }
    public void setBaseUrl(String baseUrl) { this.baseUrl = baseUrl; }
    public long getRateLimitMs() { return rateLimitMs; }
    public void setRateLimitMs(long rateLimitMs) { this.rateLimitMs = rateLimitMs; }
    public int getConnectTimeoutMs() { return connectTimeoutMs; }
    public void setConnectTimeoutMs(int connectTimeoutMs) { this.connectTimeoutMs = connectTimeoutMs; }
    public int getReadTimeoutMs() { return readTimeoutMs; }
    public void setReadTimeoutMs(int readTimeoutMs) { this.readTimeoutMs = readTimeoutMs; }
}
