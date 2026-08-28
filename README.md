# Seasonal Seiyuu — a way to easily track which seasonal anime feature your favourite voice actors

## The problem statement

Every new season of anime brings with it about 30-40+ new different shows. Most of the main anime tracking websites such as [MyAnimeList](https://myanimelist.net/) now offer a [dedicated seasonal page](https://myanimelist.net/anime/season) to track all these new shows in one place, making it convenient to browse what's coming up.

However, a sizeable number of anime fans choose what to watch in a new season based on the voice cast for the show. Specifically, dedicated fans of certain [seiyuus](https://en.wiktionary.org/wiki/seiyuu) (roughly "voice actor" in Japanese) choose what to watch based on whichever shows their favourite seiyuu is involved in.

As things stand, while it's simple enough to look up the voice cast for a given single anime, no major anime platform provides the ability to do the "reverse" search - finding out what shows in the current season a particular given seiyuu is involved in. This is the problem that **Seasonal Seiyuu** aims to solve.

The live version of the app is normally accessible here: https://www.vergo.moe/seiyuu

## Data source

Seasonal Seiyuu uses the public [Tenrai v1 API](https://tenrai.org/) to fetch anime, character, season, and voice-actor data. Tenrai serves records derived from [MyAnimeList](https://myanimelist.net/), which remains the identity source for the catalogue and the destination for entity links.

## Tech Stack

- **Backend**: Spring Boot 3.5.5 + Java 25 + Gradle 9.1.0
- **Frontend**: React 19 + TypeScript + Vite (built to `backend/src/main/resources/static/`)
- **Testing**: Vitest + React Testing Library + Playwright smoke tests (frontend), JUnit 5 + MockWebServer (backend)
- **Data**: Tenrai v1 API (MyAnimeList-derived records) → cached to local JSON file

## Frontend experience

The frontend is a light editorial cast index: Browse presents the active season
as a compact issue, Detail uses URL-backed Seasonal/Career role tabs, Compare
uses keyboard-operable actor comboboxes, and About documents the data
provenance. The `/seiyuu` route, API contracts, cached data, and refresh
behavior remain unchanged.

The interface is designed for WCAG 2.2 A/AA review. It uses semantic
landmarks, visible labels, `:focus-visible` states, reduced-motion support,
reserved image dimensions, responsive reflow down to 320 px, inline async
states, and `@axe-core/playwright` checks for representative Browse, Detail,
and Compare states.

Typography is self-hosted through [Fontsource Newsreader](https://fontsource.org/fonts/newsreader)
for display copy and [Fontsource Barlow Condensed](https://fontsource.org/fonts/barlow-condensed)
for catalogue metadata. The bundled font files are licensed under the [SIL
Open Font License 1.1](https://openfontlicense.org); the package license notices
are kept in `frontend/node_modules/@fontsource/{newsreader,barlow-condensed}`
after installation. No runtime Google Fonts request is required.

## Features

- **Voice Actor Grid**: See all voice actors in the current season, sorted by popularity.
- **Detailed Profiles**: Explore seasonal roles and complete career history for any seiyuu.
- **Compare Tool**: Compare two voice actors to find all anime they've worked on together.
- **Smart Search**: Searchable autocomplete for quick discovery.
- **MAL Integrated**: Direct links to MyAnimeList for voice actors, anime, and characters.

The implementation was completed with human direction and AI-assisted
development; the product and its data provenance remain the primary focus.

## 🚀 Quick Start (Development)

```bash
# Install frontend dependencies
cd frontend
npm install

# Run frontend dev server (hot reload)
npm run dev
# → http://localhost:5173/seiyuu/

# Run frontend tests
npm test

# Run browser smoke and accessibility checks
npm run test:e2e

# In another terminal, start backend
cd backend
./gradlew bootRun
# → API at http://localhost:8080/seiyuu/api/
```

### Production Build

```bash
# Build frontend (outputs to backend/static)
cd frontend
npm run build

# Start backend (serves frontend)
cd ../backend
./gradlew bootRun

# Open http://localhost:8080/seiyuu/
```

> **Note**: The app runs under the `/seiyuu` context path locally and in production.

### Tenrai compatibility smoke

The live compatibility check is opt-in and makes read-only requests to the public Tenrai v1 API. It requires no credentials and is not part of the normal offline test suite:

```bash
cd backend
TENRAI_LIVE_SMOKE=true ./gradlew test --tests '*AnimeDataLiveSmokeTest'
```

The smoke checks current-season pagination, Japanese cast extraction for MAL anime `5114`, and career-role mapping for MAL person `1`. It keeps the normal one-second upstream pacing, so allow several seconds for the current-season pages.

---

## 🖥️ VPS Deployment (vergo.moe/seiyuu)

### Prerequisites
- Java 25+ installed
- nginx with reverse proxy to port 8080

### 1. Build the JAR

```bash
cd frontend && npm run build && cd ..
cd backend
./gradlew bootJar
# Output: build/libs/seasonal-seiyuu-1.0.0.jar
```

### 2. Copy to VPS

```bash
scp backend/build/libs/seasonal-seiyuu-1.0.0.jar user@vergo.moe:/opt/seasonal-seiyuu/
```

### 3. nginx Configuration

Add to your nginx server block:

```nginx
# Route /seiyuu to Spring Boot App
location /seiyuu/ {
    proxy_pass http://localhost:8080/seiyuu/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-Prefix /seiyuu;
}

# Redirect /seiyuu (no slash) to /seiyuu/
location = /seiyuu {
    return 301 /seiyuu/;
}
```

### 4. Create systemd Service

Create `/etc/systemd/system/seasonal-seiyuu.service`:
```ini
[Unit]
Description=Seasonal Seiyuu Webapp
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/seasonal-seiyuu
EnvironmentFile=/etc/seasonal-seiyuu.env
Environment="REFRESH_ENABLED=false"
ExecStart=/usr/bin/java -jar seasonal-seiyuu-1.0.0.jar
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

### 5. Start the Service

```bash
sudo systemctl daemon-reload
sudo systemctl enable seasonal-seiyuu
sudo systemctl start seasonal-seiyuu

# Check status
sudo systemctl status seasonal-seiyuu
sudo journalctl -u seasonal-seiyuu -f
```

---

## 🔄 Refreshing and operating automatic data refresh

Run this when a new anime season starts (typically Jan/Apr/Jul/Oct):

```bash
# Trigger a manual refresh. Supply the protected key from your shell/secret manager.
curl -X POST -H "X-API-Key: $ADMIN_API_KEY" https://vergo.moe/seiyuu/api/admin/refresh

# Check progress
curl -H "X-API-Key: $ADMIN_API_KEY" https://vergo.moe/seiyuu/api/admin/refresh/status

# Or locally:
curl -X POST -H "X-API-Key: $ADMIN_API_KEY" http://localhost:8080/seiyuu/api/admin/refresh
```

**Note**: Refresh takes ~10-15 minutes due to API rate limiting.

Transient Tenrai rate-limit responses honor a valid `Retry-After` delay. Delays up to the configured inline ceiling are waited before retrying; an excessive valid delay records the provider cooldown and fails the current refresh, deferring subsequent attempts instead of blocking the refresh thread indefinitely or retrying early. Subsequent attempts respect that cooldown, while the last known-good cache remains active. Other transient failures use the bounded backoff and jitter settings above. Public requests read the local cache and do not consume the upstream request budget.

The refresh is **resumable** - if it fails mid-way, trigger it again and it picks up compatible progress. A failed attempt never replaces the last known-good cache.

Automatic scheduling is disabled by default. Enable it only after the rollout below has been validated. The scheduler runs inside the Spring process, uses UTC by default, performs a delayed stale-cache catch-up after startup, and shares the same single-flight entry point as the manual endpoint.

| Setting | Default | Purpose |
|---------|---------|---------|
| `REFRESH_ENABLED` | `false` | Enables daily and startup refreshes; manual refresh is always available |
| `REFRESH_DAILY_CRON` | `0 0 3 * * *` | Spring six-field daily cron expression |
| `REFRESH_ZONE` | `UTC` | Scheduler time zone |
| `REFRESH_STARTUP_DELAY` | `15s` | Delay before startup catch-up checks cache freshness |
| `REFRESH_FRESHNESS_THRESHOLD` | `24h` | Age at which startup catch-up considers the cache stale |
| `REFRESH_RETRY_MAX_ATTEMPTS` | `5` | Maximum attempts for transient anime-data provider failures |
| `REFRESH_RETRY_INITIAL_BACKOFF` | `1s` | Initial transient retry delay |
| `REFRESH_RETRY_MAX_BACKOFF` | `30s` | Retry delay ceiling |
| `REFRESH_RETRY_JITTER` | `250ms` | Random delay added to retries |

### Anime-data provider settings

| Variable | Default | Description |
|----------|---------|-------------|
| `ANIME_DATA_BASE_URL` | `https://api.tenrai.org/v1` | Upstream anime-data provider base URL |
| `ANIME_DATA_RATE_LIMIT_MS` | `1000` | Minimum spacing between all Tenrai attempts |
| `ANIME_DATA_CONNECT_TIMEOUT_MS` | `10000` | Upstream connection timeout |
| `ANIME_DATA_READ_TIMEOUT_MS` | `30000` | Upstream response timeout |
| `ANIME_DATA_MAX_INLINE_RETRY_AFTER_MS` | `60000` | Maximum valid `Retry-After` delay slept inline; larger delays fail the current operation and enforce the provider cooldown until it expires |

### One-time production rollout

1. Deploy with `REFRESH_ENABLED=false` and verify the existing cache loads, the public season-info response remains compatible, and the authenticated status endpoint is reachable.
2. Trigger one manual refresh against Tenrai. Inspect the status response and logs for staged promotion, a successful `lastSuccess`, the detected active season, and any incomplete-anime count.
3. Enable `REFRESH_ENABLED=true` in the protected service environment and restart once. Startup catch-up will run only when the cache is missing or older than the freshness threshold; the daily cron handles later reconciliation.
4. Confirm `GET /seiyuu/api/season-info` reports the expected active season and last-success health, then leave the scheduler enabled.

If an automated Tenrai run fails, the failure summary and `lastAttempt` are persisted in `data/refresh-health.json`; the active `data/season-cache.json` remains available and `refresh-progress.json` remains for a compatible retry. Use the authenticated manual endpoint as an override. To roll back, set `REFRESH_ENABLED=false` and restart; retain the active cache. A previous application version can ignore newer progress/health files while continuing to read the cache.

---

## ⚙️ Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `ADMIN_API_KEY` | `changeme` | Required for `/seiyuu/api/admin/*` endpoints |
| `SERVER_PORT` | `8080` | HTTP port |

---

## 📁 Data Storage

Cache files (auto-created in working directory):
```
data/
├── season-cache.json      # Current season data (~5-10MB)
├── refresh-progress.json  # Cumulative resumable checkpoint (deleted after success)
└── refresh-health.json    # Last attempt/success and sanitized operational state
```

---

## 🔧 Useful Commands

```bash
# View logs
sudo journalctl -u seasonal-seiyuu -f

# Restart service
sudo systemctl restart seasonal-seiyuu

# Stop service  
sudo systemctl stop seasonal-seiyuu

# Check if running
curl https://vergo.moe/seiyuu/api/season-info
```

---

## API Endpoints

All endpoints are prefixed with `/seiyuu`:

| Endpoint | Auth | Description |
|----------|------|-------------|
| `GET /seiyuu/api/voice-actors` | No | List all VAs (lightweight summaries) |
| `GET /seiyuu/api/voice-actors/{id}` | No | VA details with full career roles |
| `GET /seiyuu/api/season-info` | No | Season metadata & cache status |
| `GET /seiyuu/api/compare/{id1}/{id2}` | No | Shared anime and career comparison |
| `POST /seiyuu/api/admin/refresh` | API Key | Trigger data refresh (resumable) |
| `GET /seiyuu/api/admin/refresh/status` | API Key | Current refresh progress |
