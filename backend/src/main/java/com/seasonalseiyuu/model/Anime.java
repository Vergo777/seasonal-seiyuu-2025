package com.seasonalseiyuu.model;

import java.util.List;

/**
 * Represents an anime series.
 */
public record Anime(
        int malId,
        String title,
        String titleEnglish,
        String imageUrl,
        String synopsis,
        String season,
        int year) {
}
