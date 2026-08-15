package com.seasonalseiyuu.model;

import java.time.Instant;

/** Durable operational state for the most recent refresh attempt. */
public record RefreshHealth(
        Instant lastAttempt,
        Instant lastSuccess,
        String outcome,
        String summary,
        String activeSeason,
        Integer activeYear,
        String candidateSeason,
        Integer candidateYear,
        int incompleteAnimeCount) {

    public RefreshHealth {
        outcome = outcome == null ? "never_run" : outcome;
        summary = summary == null ? "" : summary;
    }

    public static RefreshHealth empty() {
        return new RefreshHealth(null, null, "never_run", "", null, null, null, null, 0);
    }
}
