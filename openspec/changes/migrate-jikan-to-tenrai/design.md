## Context

Seasonal Seiyuu's upstream dependency is already concentrated in `JikanApiService`. The refresh coordinator asks that client for `/seasons/now`, `/anime/{id}/characters`, and `/people/{id}/voices`, then converts Jikan-shaped JSON into provider-independent domain records before cache publication. The frontend never calls Jikan directly.

Tenrai v1 intentionally mirrors Jikan v4 closely enough to support migration by base-URL replacement for most applications. The required Seasonal Seiyuu endpoint families are documented by Tenrai, and the current client parses only fields that Tenrai v1 is expected to preserve: `data`, pagination metadata, MAL IDs, titles, images, season/year, character role, voice-actor language/person data, and anime/character data in person voice roles.

The current request limiter spaces every attempt by approximately one second. This is below Tenrai's published unauthenticated rate limits, so introducing an API key is unnecessary for the expected workload. The existing retry layer already handles 429, 5xx, timeouts, and transport failures but ignores a server-provided `Retry-After` value.

## Goals / Non-Goals

**Goals:**

- Cut over upstream traffic to Tenrai v1 before Jikan public-service retirement.
- Preserve Seasonal Seiyuu behavior, MAL identity, cache formats, refresh safety, and public API contracts.
- Make the client/configuration boundary provider-neutral so future upstream changes do not leak naming through the application.
- Verify Tenrai compatibility both deterministically with fixtures and once against the live service before production rollout.
- Keep request volume conservative and respect Tenrai rate-limit guidance.

**Non-Goals:**

- A generic multi-provider plugin framework or runtime provider selection UI.
- Simultaneous production fallback to Jikan.
- Tenrai v2 adoption or speculative mapping for undocumented future schemas.
- Changes to ranking, browse/detail/compare behavior, MAL links, cache schema, or refresh frequency.

## Decisions

### 1. Use Tenrai v1 as the single default provider

Set the provider-neutral default base URL to `https://api.tenrai.org/v1`. Continue to make the base URL configurable so MockWebServer tests, local diagnostics, and emergency operational overrides remain possible.

Do not build a Jikan fallback chain. The source service is being retired, and maintaining two provider paths would increase parsing, retry, and operational ambiguity for a short-lived benefit.

### 2. Rename the integration boundary, not the domain model

Rename Jikan-specific integration types to neutral concepts, for example:

- `JikanApiService` -> `AnimeDataApiService`
- `JikanProperties` -> `AnimeDataProperties`
- `JikanApiException` -> `AnimeDataApiException`
- `jikan.*` configuration keys -> `anime-data.*`

Exact names may vary slightly if implementation conventions suggest a clearer equivalent, but no Jikan-specific type/config name should remain as the primary integration boundary after migration.

Do not rename domain fields such as `malId`. Tenrai is supplying MyAnimeList-derived records, and these identifiers are part of the application's persistent cache, links, and public semantics rather than an implementation detail of Jikan.

### 3. Preserve the existing parsing contract and prove it against Tenrai

Keep the current parsing behavior unless Tenrai live responses demonstrate a concrete incompatibility. The implementation should not pre-emptively rewrite working parsers merely because the provider changed.

Existing fixtures remain useful as contract fixtures because Tenrai v1 targets Jikan compatibility. Rename fixture/test descriptions where they refer specifically to Jikan, but retain their payload shape unless live Tenrai validation proves a required field differs.

Add a small live compatibility check, kept outside the normal deterministic unit-test path, that confirms the three required endpoint families return parseable data. It should use stable/known IDs for character and person-role checks and only assert contract-level facts, not volatile titles/counts.

The live check must not become a required offline build dependency unless explicitly enabled; normal CI/unit tests must remain deterministic.

### 4. Keep conservative pacing and bound `Retry-After` waits

Retain the existing shared pacing gate at approximately one request per second. This intentionally remains slower than Tenrai's unauthenticated ceiling and protects both the service and the long refresh pipeline from accidental bursts.

For HTTP 429, inspect both integer-seconds and HTTP-date `Retry-After` forms. A valid delay at or below the configurable `anime-data.max-inline-retry-after-ms` ceiling is slept inline before the next retry, so the retry still occurs no earlier than the provider-requested cooldown. The default ceiling is 60 seconds: long enough for a normal transient throttle response, but short enough that one refresh thread is not pinned for hours.

When a valid delay exceeds that ceiling, do not clamp it and retry early, and do not sleep the full excessive duration. Instead, record a process-local provider cooldown through the requested expiry and fail the current upstream operation with an operationally useful, response-body-free error. New client calls check that cooldown before pacing or making an upstream request and are deferred while it is active; once it expires, calls may proceed normally. Cooldown deadline arithmetic saturates safely for very large valid values. 5xx, timeout, and connection retry behavior remains unchanged.

Do not increase concurrency as part of this migration. Performance optimization is separate from provider cutover risk.

### 5. Keep refresh and cache contracts unchanged

`SeasonDataService` should depend on the renamed provider-neutral client but otherwise retain its current orchestration: discover season, fetch casts, fetch career roles, checkpoint resumable progress, validate the candidate, and atomically publish.

No cache transformation is required because the stored values are application domain records keyed by MAL IDs, not raw Jikan response payloads. Existing `season-cache.json`, `refresh-progress.json`, and `refresh-health.json` must remain readable.

### 6. Update provenance accurately

Update README, About, Footer, OpenSpec project context/guidance, configuration documentation, comments, log messages, and tests to identify Tenrai as the current API provider.

User-facing provenance should distinguish provider from source: Tenrai is the API used by Seasonal Seiyuu, while the underlying anime/character/person records remain based on MyAnimeList data. Links should point to Tenrai's public site/docs as appropriate while existing MAL entity links remain unchanged.

### 7. Roll out with an explicit live refresh before relying on automation

A successful unit/build test proves application compatibility with the expected schema but not current Tenrai production behavior. Production rollout therefore includes one manual refresh against Tenrai with automatic scheduling temporarily controllable.

Verify:

- `/seasons/now` pagination produces a complete current-season list;
- character requests yield Japanese voice actors and valid MAL IDs;
- person voice-role requests populate career history;
- candidate validation and atomic cache promotion complete;
- public browse/detail/compare responses remain compatible;
- refresh health reports success with no provider-related errors.

Only after this should routine scheduling be relied upon.

## Risks / Trade-offs

- **Tenrai v1 is a compatibility bridge and may evolve.** -> Keep the integration boundary provider-neutral, retain strong response validation, and avoid coupling domain code to Tenrai naming.
- **A nominally compatible endpoint may differ in an edge field.** -> Preserve fixtures plus perform a live compatibility smoke and one full manual refresh before production reliance.
- **Live smoke tests can become flaky if placed in the normal suite.** -> Make them opt-in/operational, while MockWebServer tests remain the required deterministic validation path.
- **Renaming configuration can break production overrides.** -> Document the new environment/property names and inspect deployment/systemd configuration during rollout; do not silently depend on old `JIKAN_*` settings.
- **An excessive `Retry-After` could pin the single refresh thread.** -> Inline-wait only through a 60-second default ceiling; for larger valid delays, enforce a process-local cooldown, fail the current operation without an early retry, and defer later calls until the requested expiry.
- **Provider-neutral naming adds churn to an otherwise one-line migration.** -> The churn is localized and prevents known Tenrai-v1 compatibility terminology from becoming another long-lived provider-specific boundary.

## Migration Plan

1. Introduce provider-neutral configuration/client names and point the default base URL at Tenrai v1 while preserving the same public Java operations and domain outputs.
2. Update `SeasonDataService` and tests to consume the neutral client, with no refresh/cache behavior change.
3. Add bounded `Retry-After` handling, a process-local provider cooldown for excessive delays, and deterministic retry/cooldown tests.
4. Rename/retain contract fixtures and update unit tests for season pagination, Japanese cast filtering, person roles, malformed payloads, pacing, retries, and empty responses.
5. Add an opt-in Tenrai live compatibility smoke covering the three endpoint families.
6. Update README, OpenSpec context/guidance, About/Footer attribution, configuration tables, operational instructions, and related frontend tests.
7. Run backend tests/build, frontend tests/build, and Playwright smoke checks; run strict OpenSpec validation for this change.
8. Deploy with normal automatic refresh controllable, trigger one manual Tenrai refresh, inspect health/logs/public endpoints, then enable/rely on routine scheduling.
9. Retain the prior application artifact and last known-good cache during rollout. If the new build must be rolled back, keep the cache and configure the viable provider endpoint rather than depending on retired Jikan availability.
