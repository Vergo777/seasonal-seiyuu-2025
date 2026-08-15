## 1. Refresh Models and Configuration

- [x] 1.1 Add versioned, season-scoped refresh progress fields for cumulative anime IDs, voice-actor IDs, seasonal-role inputs, partial voice actors, incomplete-anime IDs, phase, and totals.
- [x] 1.2 Add a durable refresh-health model covering last attempt, last success, outcome/state, sanitized summary, active/candidate season metadata, and incomplete-anime count.
- [x] 1.3 Add typed configuration for scheduler enablement, daily cron, UTC zone, startup delay, freshness threshold, retry bounds, and the existing request pacing; disable scheduling in automated tests.
- [x] 1.4 Add model/configuration tests, including compatibility with the existing `SeasonCache` JSON shape and rejection of incompatible progress versions.

## 2. Reliable Jikan Client

- [x] 2.1 Refactor Jikan client operations so transport, HTTP, and parsing failures are explicit and cannot be returned as successful empty collections.
- [x] 2.2 Apply bounded exponential backoff with jitter to HTTP 429, HTTP 5xx, timeouts, and connection failures while keeping all attempts behind the approximately one-request-per-second limiter.
- [x] 2.3 Preserve successful empty responses as valid results so empty casts can be tracked as source-incomplete rather than failed.
- [x] 2.4 Extend MockWebServer tests for 429 and 5xx recovery, exhausted retries, non-retryable 4xx responses, timeout/connection failure, pagination failure, parsing failure, pacing, and successful empty data.

## 3. Safe Cache and Health Persistence

- [x] 3.1 Implement read/write support for `refresh-health.json` with sanitized failure summaries and backward-compatible behavior when the file is absent.
- [x] 3.2 Implement candidate-cache serialization to a same-directory temporary file, read-back validation, atomic promotion, and a safe recoverable fallback when atomic move is unavailable.
- [x] 3.3 Ensure the in-memory cache changes only after successful file promotion and that a failed write or validation leaves the prior in-memory and on-disk cache intact.
- [x] 3.4 Add isolated filesystem tests for atomic promotion, promotion failure, fallback behavior, health persistence, staging cleanup, and last-known-good cache retention.

## 4. Refresh Pipeline and Resumability

- [x] 4.1 Refactor refresh orchestration around one mutable run accumulator whose cumulative state is checkpointed coherently after each completed anime and voice actor.
- [x] 4.2 Validate saved progress against format version and detected season/year; resume compatible progress with all accumulated seasonal roles and partial voice actors, and discard incompatible progress.
- [x] 4.3 Track successful empty-cast anime as incomplete and include them in a later full reconciliation without treating them as request failures.
- [x] 4.4 Add candidate validation for complete seasonal pagination, consistent season/year, completion of required requests, and internally consistent voice-actor/role records.
- [x] 4.5 Promote and clear progress only after a valid completed snapshot; on failure retain compatible progress, update durable health, and continue serving the active cache.
- [x] 4.6 Add `SeasonDataService` tests for successful rebuild, progressive same-season updates, season rollover, interrupted same-season resume, stale-progress rejection, incomplete pagination, failed item requests, valid empty casts, failed first refresh, cache retention, and concurrent-trigger exclusion.

## 5. Automatic Scheduling and API Observability

- [x] 5.1 Add the in-process daily scheduler and delayed startup catch-up, both routed through the existing single-flight refresh entry point and guarded by scheduler configuration.
- [x] 5.2 Add scheduler tests for enabled/disabled behavior, fresh/stale/missing caches, startup catch-up, scheduled execution, and collision with an active manual refresh.
- [x] 5.3 Extend season-info and authenticated refresh-status responses additively with durable attempt/success/outcome, active/candidate season, incomplete count, and live progress fields while preserving existing fields and paths.
- [x] 5.4 Extend controller and security tests to cover the additive status fields and confirm that no API key or unsafe upstream detail appears in responses or logs.

## 6. Frontend Freshness Experience

- [x] 6.1 Extend typed frontend season metadata and API fixtures for the additive refresh-health fields.
- [x] 6.2 Render a human-readable last-successful-refresh indicator and progressive-completeness explanation near the season header, omitting the timestamp cleanly when unavailable.
- [x] 6.3 Add or update Vitest/React Testing Library coverage for available and missing freshness metadata and the early-season explanation.
- [x] 6.4 Update the Playwright smoke flow to verify the freshness messaging without depending on a brittle exact timestamp.

## 7. Operations, Validation, and Handoff

- [x] 7.1 Document scheduler environment settings, production enablement, startup catch-up, status inspection, manual override, failure handling, cache files, and rollback without including credentials.
- [x] 7.2 Document the one-time rollout sequence: deploy disabled, validate a staged manual refresh, enable production scheduling, and confirm the active season and last-success health.
- [x] 7.3 Run the full backend test suite and production Gradle build, recording or resolving failures.
- [x] 7.4 Run frontend tests, production build, and Playwright smoke tests; confirm generated backend static assets are intentional and reviewable.
- [x] 7.5 Run `openspec validate automate-season-refresh --strict` and verify every task and behavior scenario is covered before requesting archive after implementation.
