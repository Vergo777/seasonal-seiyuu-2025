package com.seasonalseiyuu.model;

import org.junit.jupiter.api.Test;

import java.util.Map;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

class RefreshProgressTest {
    @Test
    void progressIsSeasonScopedAndVersioned() {
        RefreshProgress progress = RefreshProgress.start("winter", 2026);

        assertThat(progress.formatVersion()).isEqualTo(RefreshProgress.CURRENT_FORMAT_VERSION);
        assertThat(progress.isCompatibleWith("winter", 2026)).isTrue();
        assertThat(progress.isCompatibleWith("spring", 2026)).isFalse();
        assertThat(progress.isCompatibleWith("winter", 2025)).isFalse();
    }

    @Test
    void unsupportedProgressVersionIsDetectable() {
        RefreshProgress progress = new RefreshProgress(
                RefreshProgress.CURRENT_FORMAT_VERSION - 1, "winter", 2026,
                Set.of(), Set.of(), Map.of(), Map.of(), Map.of(), Set.of(),
                RefreshProgress.RefreshPhase.FETCHING_ANIME, 1, 0);

        assertThat(progress.isCompatibleWith("winter", 2026)).isFalse();
    }

    @Test
    void oldConstructorRetainsTheOriginalProgressShape() {
        RefreshProgress progress = new RefreshProgress("fall", 2025, Set.of(1), Set.of(), Map.of(),
                RefreshProgress.RefreshPhase.FETCHING_CHARACTERS, 1, 0);

        assertThat(progress.fetchedAnimeIds()).containsExactly(1);
        assertThat(progress.seasonalRoles()).isEmpty();
        assertThat(progress.incompleteAnimeIds()).isEmpty();
    }
}
