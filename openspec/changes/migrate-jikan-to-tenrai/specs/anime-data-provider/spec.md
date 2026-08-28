## Purpose

Provide Seasonal Seiyuu with a stable, provider-neutral anime-data integration backed by Tenrai v1 while preserving current application behavior, MAL identity, refresh safety, and cache/API contracts.

## ADDED Requirements

### Requirement: Tenrai v1 as the Default Anime Data Provider
The system SHALL use Tenrai v1 as its default upstream anime-data provider and SHALL keep the provider base URL configurable outside application code.

#### Scenario: Default provider
- **WHEN** the application starts without an explicit anime-data base URL override
- **THEN** upstream anime-data requests are sent to `https://api.tenrai.org/v1`

#### Scenario: Configurable provider URL
- **WHEN** an operator or test supplies an anime-data base URL override
- **THEN** the client uses that configured base URL without changing domain behavior or public API contracts

### Requirement: Provider-Neutral Integration Boundary
The system MUST expose upstream anime-data access to application services through provider-neutral types and configuration rather than Jikan-specific integration names.

#### Scenario: Refresh orchestration consumes upstream data
- **WHEN** `SeasonDataService` requests season, cast, or person-role data
- **THEN** it depends on a provider-neutral anime-data client
- **AND** no Jikan-specific service or configuration type is required by refresh orchestration

#### Scenario: MAL identity remains stable
- **WHEN** data is fetched through Tenrai
- **THEN** existing MAL IDs remain the identifiers used by domain records, cache keys, public responses, and MyAnimeList links

### Requirement: Current-Season Contract Compatibility
The system SHALL preserve its current-season behavior using Tenrai's Jikan-compatible season endpoint and MUST reject incomplete or malformed required pagination metadata.

#### Scenario: Complete seasonal pagination
- **WHEN** Tenrai returns one or more valid `/seasons/now` pages with complete pagination metadata
- **THEN** the system maps all returned anime into the existing `Anime` domain model
- **AND** reports the expected total so refresh validation can confirm completeness

#### Scenario: Incomplete seasonal response
- **WHEN** a required seasonal response omits `data`, required pagination metadata, or otherwise cannot prove complete pagination
- **THEN** the client reports an explicit upstream-data failure
- **AND** the candidate refresh is not treated as complete

### Requirement: Cast Contract Compatibility
The system SHALL preserve anime-character and Japanese voice-actor extraction using Tenrai's anime character endpoint.

#### Scenario: Japanese voice actors are extracted
- **WHEN** Tenrai returns character records containing multiple voice-actor languages
- **THEN** the system includes Japanese voice actors only
- **AND** maps character role, character MAL ID/name/image, and person MAL ID/name/image into the existing domain inputs

#### Scenario: Successful empty cast
- **WHEN** Tenrai successfully returns an empty `data` array for an anime's characters
- **THEN** the client returns a valid empty result rather than an upstream failure

### Requirement: Person Voice-Role Contract Compatibility
The system SHALL preserve complete career-role lookup using Tenrai's person voice endpoint.

#### Scenario: Career roles are mapped
- **WHEN** Tenrai returns valid `/people/{id}/voices` data
- **THEN** the system maps anime and character records into the existing `Role` domain model using MAL identifiers

#### Scenario: Malformed person-role response
- **WHEN** the response does not contain a valid required `data` array
- **THEN** the client reports an explicit upstream-data failure rather than a successful empty result

### Requirement: Conservative Request Pacing
The system MUST keep all upstream attempts behind a shared pacing gate of approximately one request per second unless a future approved change explicitly revises the limit.

#### Scenario: Consecutive requests
- **WHEN** multiple Tenrai requests are issued by one application process
- **THEN** their attempts remain serialized through the configured pacing gate

### Requirement: Tenrai-Aware Rate-Limit Retry
The system MUST retry HTTP 429 responses using bounded retry behavior and MUST honor a valid server-provided `Retry-After` delay when present.

#### Scenario: 429 with Retry-After
- **WHEN** Tenrai responds with HTTP 429 and a valid `Retry-After` header
- **THEN** the next retry waits at least the server-requested duration
- **AND** the request remains subject to the configured maximum retry attempts

#### Scenario: 429 without usable Retry-After
- **WHEN** Tenrai responds with HTTP 429 without a valid `Retry-After` value
- **THEN** the client falls back to the existing bounded exponential backoff with jitter

#### Scenario: Other transient failures
- **WHEN** Tenrai responds with HTTP 5xx, a timeout, or a transient transport failure
- **THEN** the existing bounded retry policy remains in effect

### Requirement: Existing Cache and Public API Compatibility
The migration MUST NOT require a cache-schema migration and MUST NOT change Seasonal Seiyuu's public/admin endpoint paths or response contracts solely because the upstream provider changed.

#### Scenario: Existing cache at startup
- **WHEN** the migrated application starts with a valid cache produced before the provider migration
- **THEN** the cache remains readable and can continue serving public requests before the next refresh

#### Scenario: Successful Tenrai refresh
- **WHEN** a full refresh completes successfully through Tenrai
- **THEN** the resulting cache uses the same domain/cache format and public APIs continue to expose compatible data

### Requirement: Provider Attribution
The user-facing application and project documentation SHALL identify Tenrai as the current API provider while making clear that the underlying records are sourced from MyAnimeList.

#### Scenario: User views provenance
- **WHEN** a user views the About page or footer
- **THEN** Tenrai is identified and linked as the current API provider
- **AND** MyAnimeList remains identified as the underlying source of anime/person/character records

### Requirement: Live Compatibility Verification
The project SHALL provide an opt-in live compatibility smoke check for the Tenrai endpoint families required by Seasonal Seiyuu without making the default automated test suite depend on external network availability.

#### Scenario: Normal automated tests
- **WHEN** the standard backend test suite runs without live-smoke enablement
- **THEN** all upstream contract tests use deterministic local fixtures/MockWebServer
- **AND** no Tenrai network access is required

#### Scenario: Operator runs live smoke
- **WHEN** the live Tenrai compatibility smoke is explicitly invoked
- **THEN** it verifies current-season, anime-character, and person-voice endpoint responses are parseable into the expected application contracts
