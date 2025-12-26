# Seasonal Seiyuu - Feature Specification

## Overview
A web application that aggregates voice actor information for the current anime season, allowing users to discover which shows their favorite VAs are in and explore their career history.

## User Stories

### Landing Page
**As a** visitor  
**I want to** see a grid of all voice actors in the current season  
**So that** I can quickly find who is active and how many shows they're in

**Acceptance Criteria:**
- VA cards show profile image, name, and show count
- Sorted by number of shows (most active first)
- Search filter by VA name
- Responsive grid layout

### Voice Actor Detail Page
**As a** visitor  
**I want to** click a VA and see their current season roles  
**So that** I can discover which shows they're in

**Acceptance Criteria:**
- Header with VA image and name
- Tab 1: Current season roles with anime + character info
- Tab 2: All-time career roles (full history)
- Back navigation to list

### Admin Refresh
**As an** admin  
**I want to** trigger a data refresh for the new season  
**So that** the site stays current each quarter

**Acceptance Criteria:**
- POST endpoint with API key authentication
- Progress tracking during long refresh
- Resumable if interrupted
- Status endpoint to monitor progress

## Data Model

```mermaid
erDiagram
    VoiceActor ||--o{ Role : has
    Role }|--|| Anime : references
    Role }|--|| Character : plays
    
    VoiceActor {
        int malId PK
        string name
        string imageUrl
        int totalSeasonalShows
    }
    
    Anime {
        int malId PK
        string title
        string imageUrl
        string season
        int year
    }
    
    Character {
        int malId PK
        string name
        string imageUrl
        string role
    }
```

## API Specification

All endpoints are served under the `/seiyuu` context path.

### Public Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/seiyuu/api/voice-actors` | List all VAs (sorted by show count) |
| GET | `/seiyuu/api/voice-actors/{id}` | Get VA with seasonal + all-time roles |
| GET | `/seiyuu/api/season-info` | Get current season metadata |

### Admin Endpoints (X-API-Key required)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/seiyuu/api/admin/refresh` | Trigger data refresh |
| GET | `/seiyuu/api/admin/refresh/status` | Get refresh progress |
