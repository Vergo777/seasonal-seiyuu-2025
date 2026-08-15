## Why

Seasonal Seiyuu currently depends on a manual admin refresh and is still serving Winter 2026 data months later. A current-season app needs to roll over automatically and reconcile repeatedly because Jikan/MAL cast information is often incomplete at the start of a season and improves as the season progresses.

## What Changes

- Add an automatic, configurable daily refresh that detects Jikan's current season and runs without routine human approval.
- Run a catch-up refresh after startup when the active cache is absent or stale, while retaining the authenticated manual refresh as an operational override.
- Make refreshes safe to repeat: distinguish upstream failures from legitimate empty data, retry transient failures, validate a staged snapshot, and retain the last successful cache when an attempt is incomplete or fails.
- Correct resumable-refresh behavior so progress is cumulative, contains enough intermediate data to resume without loss, and is discarded when it belongs to a different season.
- Publish successful cache snapshots atomically and expose durable refresh-health metadata, including the last attempt and last successful refresh.
- Show users when the current data was last successfully refreshed and explain that cast information can continue to fill in during a season.
- Add automated backend, frontend, and browser-flow coverage plus deployment and operations documentation.

Non-goals:

- Adding a database or retaining a browsable archive of past seasons.
- Adding a user-facing administration dashboard or requiring human approval for routine refreshes.
- Changing the `/seiyuu` context path, public voice-actor/compare API contracts, or the existing admin API-key mechanism.
- Guaranteeing data newer than Jikan/MAL makes available.

## Capabilities

### New Capabilities

- `season-data-refresh`: Automatic current-season detection, scheduled reconciliation, safe retry/resume behavior, validated cache promotion, and refresh-health reporting.

### Modified Capabilities

- `frontend`: Display data freshness and set expectations about progressive early-season cast completeness.

## Impact

- **Backend:** `SeasonDataService`, `JikanApiService`, `CacheService`, refresh progress/cache models, scheduling configuration, admin/season-info status responses, and associated tests.
- **Frontend:** Typed season metadata, the home-page season header, Vitest coverage, and the Playwright smoke flow.
- **API:** Existing endpoints and paths remain compatible; season-info and refresh-status responses gain additive health/freshness fields.
- **Data/cache:** Refresh progress and cache metadata evolve; writes use a staged file and atomic promotion. Existing valid cache data remains readable or is migrated compatibly.
- **Deployment:** Production enables a configurable scheduler. No separate cron service or external automation account is required.
- **Security:** Scheduled refreshes call the service internally and do not duplicate or expose the admin API key. Logs and documentation must not contain credentials.
- **Rollout:** Deploy with scheduling configurable and verify one successful staged refresh before relying on automation. The old cache remains the rollback source if the first attempt fails.
- **Rollback:** Disable scheduling through configuration and continue using the existing manual admin endpoint; retain the last known-good cache file.
