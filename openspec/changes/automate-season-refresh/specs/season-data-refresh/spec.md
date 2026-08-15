## Purpose

Keep the published Seasonal Seiyuu dataset aligned with Jikan's current anime season while safely incorporating cast information that appears throughout the season.

## ADDED Requirements

### Requirement: Automatic Current-Season Reconciliation
The system SHALL automatically reconcile its cache with Jikan's current season on a configurable daily schedule when automatic refresh is enabled, without requiring human approval for each run.

#### Scenario: Scheduled same-season reconciliation
- **WHEN** the configured daily schedule fires and no refresh is running
- **THEN** the system starts a refresh for the season currently reported by Jikan
- **AND** newly available anime, character, and Japanese voice-actor information is eligible for inclusion in the next published snapshot

#### Scenario: Automatic season rollover
- **WHEN** Jikan reports a season different from the active cache season
- **THEN** the system builds a snapshot for the newly reported season
- **AND** it MUST NOT reuse progress belonging to the previous season

#### Scenario: Startup catch-up
- **WHEN** automatic refresh is enabled and the application starts with no cache or a cache older than the configured freshness threshold
- **THEN** the system starts a catch-up refresh after startup without waiting for the next scheduled time

#### Scenario: Automation disabled
- **WHEN** automatic refresh is disabled by configuration
- **THEN** no scheduled or startup refresh is initiated
- **AND** the authenticated manual refresh remains available

### Requirement: Single Refresh Execution
The system MUST allow at most one refresh to execute at a time, regardless of whether it was initiated by the scheduler, startup catch-up, or the manual admin endpoint.

#### Scenario: Trigger while refresh is active
- **WHEN** any refresh trigger occurs while another refresh is active
- **THEN** the system does not start a second refresh
- **AND** the existing refresh continues unaffected

### Requirement: Upstream Request Reliability
The system MUST distinguish a successful empty upstream response from a failed request and MUST retry transient Jikan failures while preserving the configured rate limit of approximately one request per second.

#### Scenario: Transient upstream failure recovers
- **WHEN** Jikan responds with rate limiting, a server error, a timeout, or a transient connection failure
- **THEN** the system retries the request using bounded backoff
- **AND** the refresh continues if a retry succeeds

#### Scenario: Upstream request exhausts retries
- **WHEN** a required Jikan request still fails after the configured retry attempts
- **THEN** the request is recorded as failed rather than as valid empty data
- **AND** the candidate snapshot is not published

#### Scenario: Successful empty cast response
- **WHEN** Jikan successfully returns an empty cast for an anime
- **THEN** the refresh records that anime as successfully checked but currently incomplete
- **AND** a later scheduled reconciliation checks it again

### Requirement: Validated Snapshot Publication
The system SHALL continue serving the last successful cache while a refresh is running and MUST publish a candidate snapshot only after all required upstream work and validation complete successfully.

#### Scenario: Successful snapshot
- **WHEN** all required pages and item requests complete and the candidate snapshot passes validation
- **THEN** the system atomically promotes the candidate as the active cache
- **AND** readers observe either the prior complete snapshot or the new complete snapshot, never a partially written file

#### Scenario: Incomplete pagination or failed item request
- **WHEN** seasonal pagination is incomplete or a required item request fails
- **THEN** the refresh attempt is marked unsuccessful
- **AND** the previous active cache remains available and unchanged

#### Scenario: No previous cache
- **WHEN** the first refresh attempt fails before a valid snapshot exists
- **THEN** the system reports that no season data is available
- **AND** it MUST NOT publish the partial candidate as active data

### Requirement: Resumable Refresh Progress
The system SHALL persist cumulative, season-scoped progress sufficient to resume a failed or interrupted refresh without losing or duplicating already completed work.

#### Scenario: Resume interrupted same-season refresh
- **WHEN** a refresh starts and compatible progress exists for the season reported by Jikan
- **THEN** the system resumes from the saved phase and completed item sets
- **AND** previously collected seasonal roles and completed voice-actor records remain part of the candidate snapshot

#### Scenario: Ignore incompatible progress
- **WHEN** saved progress belongs to another season or has an unsupported format
- **THEN** the system discards that progress safely
- **AND** starts a fresh candidate for the current season

#### Scenario: Successful completion clears progress
- **WHEN** a candidate snapshot is promoted successfully
- **THEN** the temporary resumable progress is removed

### Requirement: Refresh Health Reporting
The system SHALL persist and report enough refresh health information to operate the automated process without routine human participation.

#### Scenario: Successful refresh health
- **WHEN** a refresh completes successfully
- **THEN** the season information and admin refresh-status APIs report the last attempt time, last successful refresh time, successful outcome, and active season

#### Scenario: Failed refresh health
- **WHEN** a refresh attempt fails
- **THEN** refresh health records the failed outcome and a sanitized failure summary
- **AND** retains the last successful refresh time and active-cache season

#### Scenario: Progressive completeness is reported
- **WHEN** a successful snapshot contains anime whose successful cast responses are still empty
- **THEN** refresh health reports the number of currently incomplete anime

### Requirement: Manual Operational Control
The system SHALL preserve the authenticated manual refresh endpoint as an operational override and SHALL NOT expose its API key through scheduling configuration, API responses, or logs.

#### Scenario: Manual refresh after automation failure
- **WHEN** an authorized operator triggers a manual refresh and no refresh is active
- **THEN** the system starts the same validated, resumable refresh pipeline used by automation
