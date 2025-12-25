package com.seasonalseiyuu.model;

/**
 * Represents a role - linking an anime to the character a voice actor plays.
 */
public record Role(
        Anime anime,
        Character character) {
}
