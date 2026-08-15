package com.seasonalseiyuu.model;

/** Identity data collected while processing seasonal character responses. */
public record VoiceActorInput(String name, String imageUrl) {
    public VoiceActorInput {
        name = name == null ? "Unknown" : name;
        imageUrl = imageUrl == null ? "" : imageUrl;
    }
}
