package com.seasonalseiyuu.model;

import java.util.List;

/**
 * Response model for VA comparison.
 */
public record CompareResult(
        VoiceActorSummary va1,
        VoiceActorSummary va2,
        List<SharedAnime> sharedAnime) {

    /**
     * An anime that both VAs have appeared in.
     */
    public record SharedAnime(
            int malId,
            String title,
            String imageUrl,
            List<CharacterRef> characters1,
            List<CharacterRef> characters2) {
    }

    /**
     * Reference to a character with name and MAL ID for linking.
     */
    public record CharacterRef(int malId, String name) {
    }
}
