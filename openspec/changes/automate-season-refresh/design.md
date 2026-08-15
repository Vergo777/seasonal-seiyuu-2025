## Context

See `proposal.md` for motivation and scope. Today a manual admin call starts one long-running refresh that fetches `/seasons/now`, then every anime's characters and every discovered voice actor's career roles. The active JSON cache remains in memory during the run, while a second JSON file attempts to provide resumability.

The current pipeline treats most upstream failures as empty results, only retries HTTP 429, continues after incomplete pagination, writes the active cache directly, and does not verify that saved progress belongs to the detected season. Its progress sets are derived repeatedly from the originally loaded sets rather than accumulated through the run, and character-phase seasonal-role data is not durably represented well enough to resume safely.

Jikan responses are cached upstream for roughly 24 hours. A daily reconciliation is therefore frequent enough to absorb progressive cast updates without creating a second deployment-time automation system. Public user requests read the local cache and do not consume the Jikan request budget.

## Goals / Non-Goals

**Goals:**

- Make current-season rollover and ongoing reconciliation automatic after one-time production enablement.
- Preserve the last known-good user experience through upstream outages and interrupted refreshes.
- Make refresh state durable and diagnosable enough for a human-on-exception operating model.
- Keep the existing manual trigger, API key boundary, local JSON storage, and one-request-per-second pacing.

**Non-Goals:**

- Distributed scheduling or coordination across multiple application instances.
- Historical season storage, an admin UI, notifications, or a new database.
- Incremental ETag-based synchronization in the first implementation.
- Inferring cast completeness beyond what a successful Jikan response exposes.

## Decisions

### 1. Schedule inside the Spring application

Add a small scheduling component that calls the same refresh coordinator as the admin controller. Scheduling is enabled through configuration in production, uses a configurable daily cron and UTC time zone, and performs a delayed startup catch-up when the cache is absent or older than the configured freshness threshold. Tests disable scheduling explicitly.

The existing single-flight guard remains the authority for scheduler, startup, and manual triggers. A trigger that encounters an active run records/skips cleanly rather than queueing another run.

**Alternatives considered:**

- A systemd timer would fit the VPS but would need a second script, secure API-key injection, status polling, and retry semantics.
- GitHub Actions would add an external secret and network dependency and cannot naturally observe the asynchronous refresh to completion.
- Hard-coded quarterly dates would not address progressive cast updates and could disagree with Jikan's season boundary.

### 2. Perform a full daily reconciliation

Each scheduled run asks Jikan for the current season and rebuilds a candidate snapshot from authoritative responses. Successful empty cast responses are tracked as source-incomplete and checked again on the next run. This intentionally favors simple convergence and correction handling over a monotonic merge, which could retain roles later removed upstream.

Keep the existing approximately one-second global pacing. Daily execution aligns with Jikan's upstream cache window; ETag/`If-None-Match` optimization can be introduced later if request volume becomes material.

### 3. Represent request failure explicitly and retry transient faults

Jikan client methods return successful data or a typed failure/exception; they never translate transport or parsing failure into an empty collection. Apply bounded exponential backoff with jitter to HTTP 429, HTTP 5xx, timeouts, and connection failures. Do not retry other HTTP 4xx responses. All attempts continue to pass through the shared rate limiter.

A successful HTTP response containing an empty array remains valid source data. The refresh records empty-cast anime as incomplete for health reporting, but that alone does not fail validation.

### 4. Make progress cumulative, complete, and season-scoped

Evolve refresh progress to include a format version, season/year, phase, complete cumulative anime and voice-actor ID sets, accumulated seasonal-role/name/image inputs, partial voice-actor results, incomplete-anime IDs, and relevant totals. Update the in-memory accumulator before each checkpoint and serialize a coherent snapshot of that accumulator.

After current-season discovery, resume only when the stored progress version and season/year match. Delete incompatible progress and start clean. A successful promotion deletes progress; a failed/interrupted run retains it for the next automatic or manual attempt.

### 5. Stage, validate, and atomically promote cache files

Build the candidate independently of the active in-memory cache. Validation requires complete seasonal pagination, completion of every required item request, consistent season/year across seasonal anime, and internally consistent candidate records. A valid successful empty cast remains permitted.

Serialize the candidate to a temporary file in the cache directory, read it back for validation, then move it over `season-cache.json` atomically on the same filesystem. Update the in-memory reference only after promotion. If atomic move is unsupported, use a documented safe replace fallback that retains a recoverable prior file.

Direct readers therefore continue receiving the old snapshot until promotion. Failures delete or retain the staging file for diagnostics according to a bounded cleanup policy but never replace active data.

### 6. Persist health separately from the active dataset

Use a small `refresh-health.json` record for last-attempt time, last-success time, outcome/state, sanitized summary, active season/year, candidate season/year when known, and incomplete-anime count. This allows a failed attempt to be visible without mutating the last successful `SeasonCache`.

The existing season-info and admin status responses gain additive fields derived from durable health plus live progress. Existing fields and endpoint paths remain unchanged. Error summaries must exclude request headers, credentials, response bodies that may contain unsafe data, and stack traces.

### 7. Show freshness without presenting upstream completeness as guaranteed

Extend the typed frontend season metadata and render a concise last-updated indicator near the season badge. Add stable copy explaining that cast data is refreshed automatically and can fill in as the season progresses. When timestamps are absent, omit the freshness value instead of synthesizing one.

## Risks / Trade-offs

- **A full daily rebuild uses hundreds of upstream requests.** → Retain one-request-per-second pacing, one active run, configurable scheduling, and consider conditional requests only if measured volume warrants it.
- **A single repeatedly failing item can delay a new-season promotion.** → Retry transient errors, retain resumable progress, preserve the old snapshot, and surface durable failure health so an operator can intervene after repeated failures.
- **An upstream successful empty response may mean either “not announced” or genuinely no cast.** → Treat it as valid but incomplete, report it, and revisit it daily rather than guessing.
- **Progress/cache schema evolution can strand old temporary files.** → Version progress, reject incompatible progress, keep active-cache reading backward compatible, and test migration from the current cache shape.
- **In-process scheduling stops when the service is down.** → Perform startup catch-up and rely on the existing systemd restart policy; durable timestamps decide whether catch-up is needed.
- **Atomic moves may vary by filesystem.** → Keep staging on the same filesystem, test the normal path, and implement a safe documented fallback.

## Migration Plan

1. Deploy code with automatic scheduling disabled and confirm existing cache compatibility and API response compatibility.
2. Run or observe one manual refresh through the new staged pipeline; verify promotion, health metadata, progress cleanup, and the frontend freshness display.
3. Enable the scheduler in the production service environment and restart once; the startup catch-up updates the stale cache, after which the daily schedule maintains it.
4. Verify the active season, last-success timestamp, incomplete-anime count, and next scheduled reconciliation through logs and status endpoints.
5. To roll back operationally, disable scheduling and use the manual endpoint while retaining the last known-good cache. If application rollback is required, preserve `season-cache.json`; newer progress and health files may be removed or ignored by the older version.
