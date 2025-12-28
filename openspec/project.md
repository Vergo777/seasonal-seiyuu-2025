# Project Context

## Purpose

**Seasonal Seiyuu** is a web application that helps anime fans discover voice actors (seiyuu) appearing in the current anime season. It provides a grid view of all voice actors, detailed profiles with career history, and a comparison tool to find shared anime between two actors.

**Live at**: [vergo.moe/seiyuu](https://vergo.moe/seiyuu)

## Tech Stack

- **Backend**: Spring Boot 3.5.5, Java 25, Gradle 9.1.0
- **Frontend**: Vite + Vanilla JavaScript (no framework)
- **Data Source**: Jikan API v4 (unofficial MyAnimeList API)
- **Storage**: Local JSON file cache (no database)
- **Deployment**: VPS with nginx reverse proxy + systemd service

## Project Conventions

### Code Style

**Java (Backend)**
- Use Java records for DTOs and model classes
- Constructor injection for Spring beans
- Service layer handles business logic; controllers are thin
- Use `Optional` for nullable return values

**JavaScript (Frontend)**
- Vanilla JS with ES6+ features (no framework)
- Single `main.js` handles routing, state, and DOM manipulation
- CSS variables for theming in `style.css`

### Architecture Patterns

- **Monolithic JAR**: Frontend is bundled into `backend/src/main/resources/static/`
- **File-based caching**: Season data is cached to `data/season-cache.json`
- **Resumable refresh**: Progress is saved to `data/refresh-progress.json` to recover from failures
- **Rate-limited API calls**: Jikan API requires delays between requests (~1 req/sec)

### Testing Strategy

- **Backend**: JUnit 5 + Mockito + AssertJ
  - Unit tests for services with `MockWebServer` for API mocking
  - Integration tests for controllers with `@WebMvcTest`
- **Frontend**: No automated tests (manual testing only)

### Git Workflow

- Main branch for stable releases
- Feature branches for new work
- No enforced commit message convention

## Domain Context

- **Seiyuu (声優)**: Japanese voice actor
- **Seasonal anime**: Anime airing in the current quarter (Winter/Spring/Summer/Fall)
- **MAL ID**: MyAnimeList unique identifier for anime, characters, and people
- **Career roles**: All voice acting credits for an actor across their entire career
- **Seasonal roles**: Voice acting credits only for the current anime season

## Important Constraints

- **Rate limiting**: Jikan API allows ~1 request/second; bulk refresh takes 10-15 minutes
- **No database**: All data stored in JSON files; entire dataset loaded into memory
- **Japanese VAs only**: Non-Japanese voice actors are filtered out
- **Single-user admin**: Refresh endpoint protected by a single API key (not multi-user auth)

## External Dependencies

| Service | Purpose | Notes |
|---------|---------|-------|
| [Jikan API v4](https://jikan.moe/) | Anime/character/person data | Unofficial MAL API, rate-limited |
| MyAnimeList | Links for VA/anime/character profiles | No direct API access |
| nginx | Reverse proxy on VPS | Routes `/seiyuu/*` to Spring Boot |
