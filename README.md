# 🎙️ Seasonal Seiyuu

Discover voice actors (seiyuu) in the current anime season and explore their roles.

## Tech Stack

- **Backend**: Spring Boot 3.5.5 + Java 25 + Gradle 9.1.0
- **Frontend**: Vite + Vanilla JS (built to `backend/src/main/resources/static/`)
- **Data**: Jikan API v4 (MyAnimeList) → cached to local JSON file

## 📋 Specifications (SpecKit)

See [`.github/specs/`](.github/specs/) for detailed documentation:
- [**Constitution**](.github/specs/constitution.md) - Project principles & tech choices
- [**Features**](.github/specs/features.md) - User stories & API spec
- [**Architecture**](.github/specs/architecture.md) - System design & data flow

## 🚀 Quick Start (Development)

```bash
# Start backend (serves frontend)
cd backend
./gradlew bootRun

# Open http://localhost:8080
```

---

## 🖥️ VPS Deployment

### Prerequisites
- Java 25+ installed
- Port 8080 available (or configure `server.port`)

### 1. Build the JAR

```bash
cd backend
./gradlew bootJar
# Output: build/libs/seasonal-seiyuu-1.0.0.jar
```

### 2. Copy to VPS

```bash
scp build/libs/seasonal-seiyuu-1.0.0.jar user@your-vps:/opt/seasonal-seiyuu/
```

### 3. Create systemd Service

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

### 4. Start the Service

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
# Trigger refresh
curl -X POST -H "X-API-Key: your-secret-key-here" http://localhost:8080/api/admin/refresh

# Check progress
curl -H "X-API-Key: your-secret-key-here" http://localhost:8080/api/admin/refresh/status
```

**Note**: Refresh takes ~10-15 minutes due to API rate limiting.

The refresh is **resumable** - if it fails mid-way, just trigger it again and it picks up where it left off.

---

## ⚙️ Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `ADMIN_API_KEY` | `changeme` | Required for `/api/admin/*` endpoints |
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
curl http://localhost:8080/api/season-info
```

---

## API Endpoints

| Endpoint | Auth | Description |
|----------|------|-------------|
| `GET /api/voice-actors` | No | List all VAs (sorted by show count) |
| `GET /api/voice-actors/{id}` | No | VA details with roles |
| `GET /api/season-info` | No | Season metadata |
| `POST /api/admin/refresh` | API Key | Trigger data refresh |
| `GET /api/admin/refresh/status` | API Key | Refresh progress |