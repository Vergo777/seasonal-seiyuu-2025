package com.seasonalseiyuu.model;

/**
 * Represents an anime character.
 */
public record Character(
        int malId,
        String name,
        String imageUrl,
        String role // MAIN or SUPPORTING
) {
}
