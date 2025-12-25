# Seasonal Seiyuu - Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                         Browser                              │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  Frontend (Vanilla JS SPA)                              ││
│  │  - Landing page with VA grid                            ││
│  │  - Detail page with tabs                                ││
│  │  - Hash-based routing                                   ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Spring Boot Backend                        │
│  ┌─────────────────┐  ┌──────────────┐  ┌────────────────┐ │
│  │ Controllers     │  │ Services     │  │ Models         │ │
│  │ - VoiceActor    │  │ - JikanApi   │  │ - VoiceActor   │ │
│  │ - Admin         │  │ - Cache      │  │ - Anime        │ │
│  │                 │  │ - SeasonData │  │ - Character    │ │
│  └─────────────────┘  └──────────────┘  └────────────────┘ │
│                              │                              │
│  ┌───────────────────────────┴───────────────────────────┐ │
│  │                    File System                         │ │
│  │  data/season-cache.json    data/refresh-progress.json │ │
│  └───────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Jikan API v4                           │
│                  (MyAnimeList data)                         │
└─────────────────────────────────────────────────────────────┘
```

## Component Responsibilities

### JikanApiService
- HTTP client for Jikan API
- Rate limiting (1 second between requests)
- Retry with exponential backoff for 429 errors

### CacheService
- JSON file persistence using Jackson
- Load/save season cache
- Load/save refresh progress for resumability

### SeasonDataService
- Orchestrates data fetching workflow
- Aggregates VAs across all anime
- Manages resumable refresh state

### VoiceActorController
- Public REST endpoints
- Returns cached data only (no live API calls)

### AdminController
- Protected by API key filter
- Triggers refresh operations
- Reports refresh progress

## Data Flow: Refresh Operation

```mermaid
sequenceDiagram
    participant Admin
    participant Backend
    participant Cache
    participant Jikan

    Admin->>Backend: POST /api/admin/refresh
    Backend->>Cache: Load progress (if exists)
    
    loop For each anime
        Backend->>Jikan: GET /seasons/now
        Backend->>Cache: Save progress
    end
    
    loop For each anime
        Backend->>Jikan: GET /anime/{id}/characters
        Backend->>Cache: Save progress
    end
    
    loop For each VA
        Backend->>Jikan: GET /people/{id}/voices
        Backend->>Cache: Save progress
    end
    
    Backend->>Cache: Save final cache
    Backend->>Cache: Delete progress file
    Backend-->>Admin: Complete
```
