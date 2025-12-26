# Seasonal Seiyuu - Project Constitution

## Purpose
Enable anime fans to discover which voice actors are participating in the current anime season and explore their career history.

## Core Principles

### 1. Simplicity Over Complexity
- Single JAR deployment (frontend bundled with backend)
- File-based caching instead of database
- Vanilla JS frontend, no heavy frameworks

### 2. Respect API Limits
- Jikan API has strict rate limits (3 req/sec, 60 req/min)
- Always implement delays and retry logic
- Cache aggressively to minimize API calls

### 3. Resilient Data Loading
- Refresh operations must be resumable
- Save progress incrementally to survive interruptions
- Never lose already-fetched data on failure

### 4. User Experience First
- Fast page loads from cached data
- Responsive design for mobile/desktop
- Clear visual hierarchy with voice actor prominence

## Technology Choices

| Layer | Technology | Rationale |
|-------|------------|-----------|
| Backend | Spring Boot 3.5.5 | Mature, well-documented, easy deployment |
| Runtime | Java 25 | Latest LTS, virtual threads |
| Build | Gradle | Faster than Maven, Kotlin DSL ready |
| Frontend | Vanilla JS | Simple, no build complexity for small app |
| Styling | Custom CSS | Full control, dark theme |
| Data | JSON file cache | No database dependency |
| API | Jikan v4 | Unofficial MAL API, free |

## Non-Goals
- User authentication (public read-only app)
- Real-time updates (manual refresh is fine)
- Multiple language support (Japanese VAs only)
- Historical season archives (current season only)
