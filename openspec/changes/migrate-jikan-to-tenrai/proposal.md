## Why

Seasonal Seiyuu currently depends on Jikan API v4 for all anime, character, and voice-actor data. Jikan's public API is being retired in 2026, so the application needs to move before the service becomes unreliable or unavailable.

Tenrai v1 is designed as a Jikan-compatible transition API and exposes the three endpoints Seasonal Seiyuu currently uses: current-season anime, anime characters/voice actors, and person voice roles. The existing backend already isolates upstream access in one client service, making this a contained migration rather than an application rewrite.

The migration should also remove Jikan-specific names from backend configuration and service boundaries. Tenrai v1 is itself a compatibility bridge, so provider-neutral naming avoids another mechanical rename when Tenrai eventually introduces a non-Jikan-compatible API version.

## What Changes

- Replace the default upstream base URL from Jikan v4 to Tenrai v1.
- Rename Jikan-specific backend client/configuration types and settings to provider-neutral anime-data names while keeping the current domain models and MAL IDs unchanged.
- Preserve the current request pipeline and supported operations:
  - current-season anime pagination;
  - anime character/cast lookup with Japanese voice-actor filtering;
  - person voice-role lookup.
- Keep the existing approximately one-request-per-second pacing, which remains comfortably inside Tenrai's unauthenticated limits.
- Continue bounded retry behavior for transient failures and add support for Tenrai's `Retry-After` response guidance on HTTP 429 where present.
- Keep deterministic MockWebServer contract tests and add a deliberate live Tenrai compatibility smoke check for the three required endpoint families.
- Update README, OpenSpec context/guidance, About page, footer, and related tests so public attribution and operational documentation describe Tenrai rather than Jikan.
- Preserve the current refresh, resumability, cache publication, public API, deployment shape, and `/seiyuu` context path.

Non-goals:

- Migrating away from MyAnimeList identifiers or changing links to MAL pages.
- Adding a database, changing cache schemas, or rebuilding historical cached data solely because the provider changed.
- Adding Tenrai authentication/server keys unless live validation shows the unauthenticated service is insufficient.
- Introducing a dual-provider Jikan/Tenrai fallback layer; Jikan is being retired and fallback would add temporary complexity with little long-term value.
- Adopting a future Tenrai v2/non-compatible schema as part of this change.
- Changing frontend product behavior beyond data-source attribution.

## Capabilities

### New Capabilities

- `anime-data-provider`: Provider-neutral upstream anime-data access backed by Tenrai v1, with compatible parsing, pacing, retries, and operational verification.

### Modified Capabilities

- `frontend`: Public provenance/attribution copy identifies Tenrai as the current API source while continuing to explain that the underlying records come from MyAnimeList.

## Impact

- **Backend:** replace/rename `JikanApiService`, `JikanProperties`, Jikan-specific exception/log text, configuration keys, and associated tests/fixtures where naming is provider-specific.
- **Refresh pipeline:** `SeasonDataService` should depend on the provider-neutral client but its orchestration, domain models, cache validation, resumability, and published data shape remain unchanged.
- **Frontend:** update About/Footer attribution and the tests that currently assert Jikan copy/links.
- **API:** no changes to Seasonal Seiyuu's public or admin endpoint paths or response contracts.
- **Data/cache:** no intended migration. Existing MAL IDs and `season-cache.json` / progress / health formats remain valid.
- **Deployment:** production upstream URL changes to `https://api.tenrai.org/v1`. No new credentials are expected for the current request volume.
- **Security:** do not introduce or commit Tenrai keys. If authentication later becomes necessary it must be environment/secret based and redacted from logs/status responses.
- **Rollout:** deploy with the existing scheduler controllable, run one explicit manual refresh against Tenrai, verify season/cast/career data and refresh health, then leave normal scheduling enabled.
- **Rollback:** before Jikan shutdown, the configurable base URL can temporarily be pointed back to Jikan for diagnosis; after retirement, rollback means reverting application code while retaining Tenrai as the configured provider or continuing to serve the last known-good cache.
