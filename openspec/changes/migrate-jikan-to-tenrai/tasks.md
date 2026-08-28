## 1. Provider-Neutral Integration Boundary

- [x] 1.1 Rename the Jikan-specific backend configuration type, API service, exception, comments, and log terminology to provider-neutral anime-data equivalents.
- [x] 1.2 Rename `jikan.*` application properties/environment override expectations to provider-neutral `anime-data.*` settings and set the default base URL to `https://api.tenrai.org/v1`.
- [x] 1.3 Update `SeasonDataService` and focused tests to depend on the provider-neutral client without changing refresh orchestration, domain models, MAL IDs, or cache formats.
- [x] 1.4 Search the backend source/tests/configuration for stale Jikan-specific integration naming and retain only intentional historical/provenance references.

## 2. Tenrai-Compatible Client Behavior

- [x] 2.1 Preserve current-season pagination against `/seasons/now?page={page}` and the existing completeness validation based on `data` plus pagination metadata.
- [x] 2.2 Preserve anime cast lookup against `/anime/{id}/characters`, Japanese-language voice-actor filtering, and extraction of character/person MAL IDs, names, roles, and images.
- [x] 2.3 Preserve person career-role lookup against `/people/{id}/voices` and mapping to existing `Anime`, `Character`, and `Role` domain records.
- [x] 2.4 Keep the shared approximately one-request-per-second pacing gate and existing retry categories for 429, 5xx, timeout, and transport failures.
- [x] 2.5 On HTTP 429, honor a valid Tenrai `Retry-After` header by waiting at least the requested duration before retrying; fall back to bounded exponential backoff with jitter when the header is absent/invalid.
- [x] 2.6 Do not add Tenrai authentication/server-key handling unless current unauthenticated live validation demonstrates a concrete requirement.

## 3. Contract and Reliability Tests

- [x] 3.1 Rename `JikanApiServiceTest` and provider-specific test descriptions to match the neutral client while retaining MockWebServer isolation.
- [x] 3.2 Retain or rename the existing Jikan-shaped JSON fixtures as Tenrai-v1 compatibility contract fixtures; change payload structure only where live Tenrai behavior proves a difference.
- [x] 3.3 Verify deterministic tests cover current-season parsing/pagination/completeness, Japanese cast filtering, person roles, successful empty arrays, malformed payloads, incomplete pagination, non-retryable 4xx, 429/5xx retry, exhausted attempts, timeout/connection failure, and pacing.
- [x] 3.4 Add deterministic tests for valid `Retry-After` handling and invalid/missing-header fallback without making the test suite depend on real elapsed multi-second waits where avoidable.
- [x] 3.5 Keep normal backend tests fully offline and deterministic.

## 4. Live Tenrai Compatibility Smoke

- [x] 4.1 Add a small opt-in operational/integration smoke path that calls live Tenrai v1 without running as part of the default unit-test suite.
- [x] 4.2 Verify `/seasons/now` returns a parseable non-empty current season with usable season/year and MAL IDs.
- [x] 4.3 Verify one known anime character endpoint returns the expected response structure and allows Japanese voice-actor extraction.
- [x] 4.4 Verify one known person voice endpoint returns the expected role structure and maps to existing domain records.
- [x] 4.5 Document how to run the live smoke and ensure it requires no committed credentials.

## 5. Attribution, Configuration, and Project Documentation

- [x] 5.1 Update `README.md` data-source, tech-stack, refresh, rate-limit, configuration, rollout, and troubleshooting references from Jikan to Tenrai where they describe the current provider.
- [x] 5.2 Update `openspec/config.yaml` and `AGENTS.md` so future agents preserve Tenrai/provider rate limits and provider-neutral integration boundaries rather than Jikan-specific assumptions.
- [x] 5.3 Update the About page provenance copy/link to identify Tenrai as the API provider and MyAnimeList as the underlying data source.
- [x] 5.4 Update the Footer attribution/link consistently.
- [x] 5.5 Update About/Footer Vitest assertions and any browser tests that explicitly assert Jikan attribution.
- [x] 5.6 Search the repository for user-facing or operational Jikan references and classify each as update, intentional historical reference, or obsolete generated asset.

## 6. Validation and Production Handoff

- [x] 6.1 Run the full backend test suite and production Gradle build.
- [x] 6.2 Run frontend Vitest tests and production build; ensure generated backend static assets intentionally reflect the attribution change.
- [x] 6.3 Run Playwright smoke/accessibility checks for the existing Browse, Detail, Compare, and About flows as applicable.
- [x] 6.4 Run the opt-in live Tenrai compatibility smoke against the current public service and record any schema differences before deployment.
- [x] 6.5 Run `openspec validate migrate-jikan-to-tenrai --strict` and resolve validation failures.
- [x] 6.6 Inspect deployment/systemd environment for obsolete `JIKAN_*` overrides and replace them with the new provider-neutral settings if present.
- [ ] 6.7 Deploy with automatic refresh controllable, trigger one authenticated manual refresh against Tenrai, and verify complete season pagination, cast data, career roles, candidate promotion, refresh health, and unchanged public API behavior.
- [ ] 6.8 After the manual refresh succeeds, enable/rely on routine scheduling and retain the previous application artifact plus last known-good cache for rollback.
