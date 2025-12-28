# 🎙️ Seasonal Seiyuu

Discover voice actors (seiyuu) in the current anime season and explore their roles.

## Tech Stack

- **Backend**: Spring Boot 3.5.5 + Java 25 + Gradle 9.1.0
- **Frontend**: Vite + Vanilla JS (built to `backend/src/main/resources/static/`)
- **Data**: Jikan API v4 (MyAnimeList) → cached to local JSON file

## ✨ Features

- **Voice Actor Grid**: See all voice actors in the current season, sorted by popularity.
- **Detailed Profiles**: Explore seasonal roles and complete career history for any seiyuu.
- **Compare Tool**: ⚔️ Compare two voice actors to find all anime they've worked on together.
- **Smart Search**: Searchable autocomplete for quick discovery.
- **MAL Integrated**: Direct links to MyAnimeList for voice actors, anime, and characters.
- **AI-Powered**: Built with the help of Antigravity AI.

## 📋 Specifications (SpecKit)

See [`.github/specs/`](.github/specs/) for detailed documentation:
- [**Constitution**](.github/specs/constitution.md) - Project principles & tech choices
- [**Features**](.github/specs/features.md) - User stories & API spec
- [**Architecture**](.github/specs/architecture.md) - System design & data flow

## 🚀 Quick Start (Development)

```bash
# Build frontend
cd frontend
npm install
npm run build

# Start backend (serves frontend)
cd ../backend
./gradlew bootRun

# Open http://localhost:8080/seiyuu/
```

> **Note**: The app runs under the `/seiyuu` context path locally and in production.

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
Environment="ADMIN_API_KEY=your-secret-key-here"
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

## 🔄 Refreshing Data for a New Season

Run this when a new anime season starts (typically Jan/Apr/Jul/Oct):

```bash
# Trigger refresh (on VPS)
curl -X POST -H "X-API-Key: your-secret-key-here" https://vergo.moe/seiyuu/api/admin/refresh

# Check progress
curl -H "X-API-Key: your-secret-key-here" https://vergo.moe/seiyuu/api/admin/refresh/status

# Or locally:
curl -X POST -H "X-API-Key: changeme" http://localhost:8080/seiyuu/api/admin/refresh
```

**Note**: Refresh takes ~10-15 minutes due to API rate limiting.

The refresh is **resumable** - if it fails mid-way, just trigger it again and it picks up where it left off.

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
└── refresh-progress.json  # Temporary (deleted after refresh)
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