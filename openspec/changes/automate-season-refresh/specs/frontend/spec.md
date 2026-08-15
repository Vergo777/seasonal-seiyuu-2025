## ADDED Requirements

### Requirement: Season Data Freshness Display
The system SHALL show users the active season's last successful refresh time and SHALL explain that cast information may continue to be added during the season.

#### Scenario: Freshness metadata is available
- **WHEN** the home page loads season information with a last successful refresh time
- **THEN** the season header displays a human-readable data freshness indicator
- **AND** the page indicates that early-season cast data can be incomplete and is refreshed automatically

#### Scenario: Freshness metadata is unavailable
- **WHEN** the home page loads season information without a last successful refresh time
- **THEN** the page displays the season without an inaccurate freshness claim
