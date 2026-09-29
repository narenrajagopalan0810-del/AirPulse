# AirPulse AI — Autonomous Environmental Intelligence & Triage System

> *Combining Multimodal Google Gemini 2.5 Flash, Pure Atmospheric Transport Physics, Satellite Telemetry, and CAAQMS Sensors with Zero Hallucination.*

---

## 🌟 The Core Breakthrough: "Glass-Box AI"

Traditional approaches attempt to guess PM2.5 concentrations directly from raw pixels—a practice widely rejected by environmental scientists due to lighting, humidity, and sensor variances.

**AirPulse AI pioneers "Glass-Box AI":**
1. **Gemini 2.5 Flash Multimodal Vision & Voice:** Validates physical emission evidence ($V \in [0, 1]$), eliminates screen-photo moiré spoof attacks, and parses vernacular voice reports in Hindi, Tamil, and English.
2. **Ground Sensor Anomaly ($S \in [0, 1]$):** Computes normalized z-score deviations against 7-day rolling baselines ($\mu, \sigma$) from official CAAQMS monitoring stations.
3. **Atmospheric Physics ($D, W$):** Calculates geospatial exponential distance decay ($D = \exp(-d/2)$) and cosine atmospheric wind vector alignment ($W = \max(0, \cos \theta)$).
4. **NASA FIRMS Active Fire Hotspots:** Awards $+10$ satellite corroboration bonus for thermal anomalies confirmed within 5 km.
5. **100% Provenance & Transparency:** Every byte of data displayed includes an immutable provenance badge (`Gemini-2.5-Flash`, `OpenAQ-Live`, `NASA-FIRMS`, `Open-Meteo`).

---

## 🚀 Quick Start (Running Locally)

### 1. Requirements
- Node.js 20+ / 24+
- npm 10+

### 2. Backend Setup
```bash
cd backend
npm install
npm test              # Runs 23 pure math & physics unit tests
npm run dev           # Launches Express API + Real-time SSE on port 5000
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev           # Launches Tactical Command Center on http://localhost:3000
```

---

## 🎛️ Key Features & Endpoints

| Component | URL / Endpoint | Purpose |
|---|---|---|
| **Command Center** | `http://localhost:3000` | Tactical dark glassmorphism GIS map with live wind streamlines and triage feed |
| **Citizen PWA** | Modal in UI | 3-tap mobile reporting with client-side WebP compression and vernacular voice recording |
| **Glass-Box Audit** | `/fusion-debug` modal | Complete mathematical equation breakdown with substituted numbers and provenance |
| **Judge Chaos Studio** | Studio modal in UI | 1-click deterministic demo scenarios + live circuit-breaker API killswitches |
| **Realtime Stream** | `GET /api/events` | Sub-200ms Server-Sent Events (SSE) alert bus |
| **Public GeoJSON** | `GET /api/v1/incidents` | Standard Open Geospatial API with coordinates rounded to ~100m for privacy |
| **48h Risk Forecast** | `GET /api/forecast` | Atmospheric stagnation index and upwind thermal fire risk panel |

---

## 🧪 Unit Test Coverage

All pure math and physics logic is tested with **100% boundary coverage**:
- `tests/physicsMetrics.test.ts`: Haversine distance, forward bearing, exponential decay $D$, $S$ clamps, and $0^\circ/360^\circ$ wind circular wraparounds.
- `tests/evidenceEngine.test.ts`: Dynamic weight shift matrix ($d \le 3$km, $3 < d \le 5$km, $d > 5$km blindspot cap), priority boundaries (44/45, 74/75), and satellite fire bonus.
- `tests/forecast.test.ts`: 48h atmospheric smog trapping calculation.

Run tests:
```bash
npm --prefix backend test
```
