# AirPulse AI — Product Requirements Document

**Version:** MVP (4-day sprint) · **Team:** 4 · **Target:** hackathon prototype, end-to-end demo

---

## 1. Overview

**One-liner:** AirPulse AI fuses citizen pollution reports (photo, text, voice), ground sensors, wind, and satellite fire detections into an explainable Evidence Confidence Score, and turns high-scoring incidents into alerts that authorities can act on.

**Problem:** Official stations (CAAQMS) are kilometers apart and miss hyper-local events: industrial stack bursts, waste burning, construction dust, crop-residue fires. Citizen complaints can't be verified, so enforcement is slow or absent.

**Principle:** AI never estimates PM2.5 from a photo. Gemini evaluates *visual evidence*; a transparent formula combines it with independent data.

**India context:** Delhi-NCR industrial/waste burning, Punjab–Haryana stubble burning (Oct–Nov), winter inversion smog, sparse station coverage.

## 2. Goals & Success Criteria

| Goal | Target |
|---|---|
| Report → pin on map | ≤ 15 s p95 |
| Demo cases land in expected band | 5 / 5 |
| Gemini image validity accuracy (~25 labeled images) | ≥ 85% |
| Gemini JSON schema-valid | 100% (1 retry, then fallback) |
| Every displayed value has provenance label | 100% |
| Demo completes with any single dependency killed | Yes |

**Non-goals:** PM2.5-from-pixels, login/signup flows, real enforcement integration, custom ML, IoT, BigQuery/Postgres, Vertex training, Dialogflow, Speech-to-Text.

## 3. Users

| Role | Needs | Context |
|---|---|---|
| Citizen / volunteer | Report in ≤ 3 taps after photo, in own language, no account | Mobile, patchy 4G, EN/HI/TA |
| Ward officer / inspector | Ranked queue, evidence they can trust, assign and close | Desktop |
| District officer | See Critical alerts only | Desktop |
| Evaluator | Inspect the math | `/fusion-debug` |

## 4. End-to-End Workflow

1. Citizen opens `/report`, picks language.
2. Photo + geolocation (or manual pin) + note (or ≤ 30 s voice, Could).
3. Backend validates → Gemini analyzes image + text.
4. Enrich: nearest sensor, wind, FIRMS fire detections, forecast risk.
5. Fusion engine computes R, tier, priority band.
6. Firestore write → dashboard updates live (≤ 2 s).
7. R ≥ 75 creates an alert; officer assigns, logs action, resolves or marks false.

**Failure paths:** no GPS → manual pin · Gemini down → lookup table + "AI unavailable" badge · no sensor → weight shift + "Visual-only" tier · not a pollution photo → message, no pin.

## 4b. Decisions (defaults locked for MVP)

| Decision | Choice |
|---|---|
| μ, σ baseline for S | 7-day rolling station stats; fallback constants per region |
| Weight shift threshold | d > 3 km: V 0.70, S 0, D 0.15, W 0.15; R capped at 80 |
| Priority colors | Red ≥ 75, Orange 45–74, Green < 45 |
| Invalid image | No pin, show message |
| Languages | EN, HI, TA |
| Image storage | Compressed thumbnail ≤ 200 KB in Firebase Storage; **no base64 in Firestore** |
| Retention | 30 days |
| Public location precision | Rounded to ~100 m |
| Officer access | Shared passcode (demo only) |

## 5. Scoring & Forecast Logic

```
R = min(100, 100 × (0.35·V + 0.35·S + 0.15·D + 0.15·W)) + fireBonus (cap 100)
V = Gemini visualEvidenceScore ∈ [0,1]
S = clamp((pm25_now − μ) / (3σ), 0, 1)
D = exp(−d / 2.0)                 d = km, report → nearest station; d > 5 → S = 0
W = max(0, cos θ)                 θ = angle between wind-toward (windFrom + 180°) and bearing report → station
                                  calm wind (< 1 m/s) → W = 0.5
fireBonus = +10 if ≥ 1 FIRMS detection ≤ 5 km within 24 h and sourceType ∈ {STUBBLE, WASTE_BURNING}
cluster   = ×1.15 if ≥ 2 reports within 500 m / 30 min (Could)
```

**Evidence tiers:** Verified (S > 0 with corroboration) · Satellite-corroborated · Visual-only · Unverified.

**Spike-risk forecast (heuristic, not ML), per region, next 24–48 h:**
`Risk = 0.4·stagnation + 0.3·fireUpwind + 0.3·forecastPM`
- stagnation: low wind speed + low boundary-layer height (Open-Meteo hourly)
- fireUpwind: FIRMS detections within 200 km upwind
- forecastPM: Open-Meteo air-quality (CAMS) PM2.5 forecast, normalized
- Output: Low / Med / High + drivers, labeled "model-based estimate, not measurement".

## 6. Functional Requirements

| ID | Feature | Priority | Build status |
|---|---|---|---|
| F1 | Citizen report form (photo, GPS, text, language) | Must | Implement |
| F2 | Gemini multimodal analysis | Must | Implement |
| F3 | Fusion engine + weight shift | Must | Implement |
| F4 | Sensor data: OpenAQ live → mock fallback | Must | Implement / mock |
| F5 | Weather: Open-Meteo (wind, boundary layer) | Must | Implement |
| F6 | Alerts + case management (assign, action log, false mark) | Must | Implement |
| F7 | Dashboard: map, list, filters, detail card | Must | Implement |
| F8 | Region config + shared schema | Must | Implement |
| F9 | Fusion debug / audit page | Must | Implement |
| F10 | NASA FIRMS fire detections | Should | Implement, cached CSV fallback |
| F11 | Spike-risk forecast panel | Should | Implement |
| F12 | Multilingual UI + brief (EN/HI/TA) | Should | Implement |
| F13 | Public GeoJSON API | Should | Implement |
| F14 | Voice report (audio → Gemini) | Could | If time |
| F15 | Clustering boost | Could | If time |
| F16 | Offline queue | Could | Defer |
| — | Earth Engine satellite layers, Vertex forecasting, BigQuery, heatmaps, real auth, SMS/email alerts | Won't (v1) | Roadmap |

**Acceptance highlights:**
- F1: invalid file/size rejected with message; ≤ 5 MB; client-side compress to 1024 px.
- F2: returns schema-valid JSON; invalid image → V = 0.
- F6: state machine New → Assigned → Resolved | False.
- F8: adding a region = adding a JSON file, no code change.
- F9: shows formula with substituted numbers and raw inputs.

## 7. Screens

**`/report` (mobile-first):** language chips · dropzone + preview · location chip (auto/manual) · note box (mic button if F14) · submit. States: idle → uploading → analyzing ("Checking evidence…") → success (report ID + priority band, no raw score) | failure with retry.

**`/dashboard`:** full-screen Google Map; pins by band; FIRMS fire layer; region risk badge; sorted list (R desc); filters (region, band, status, source); detail card with photo, R, tier, sourceType, bilingual brief, action brief, provenance chips, action log, Assign / Resolve / Mark false.

**`/fusion-debug`:** four bars (V, S, D, W), weights used, raw values (pm25, μ, σ, d, wind from, bearing), fire bonus, final R, which fallbacks fired.

**Provenance chips:** Gemini · OpenAQ-live · Mock · FIRMS · Open-Meteo · Model-estimate.

## 8. Technical Architecture

```
React (Vite) + Tailwind + @react-google-maps/api
        │
Express gateway (Node 18/20)
        ├── Gemini 2.5 Flash (@google/genai)   → V, sourceType, spoof flags, multilingual brief
        ├── OpenAQ / mock_sensors.json          → S
        ├── Open-Meteo (+ air-quality)          → W, stagnation, forecastPM
        └── NASA FIRMS / cached CSV             → fire detections
        │
Fusion engine (pure, unit-tested) → Firestore (+ Storage for thumbnails) → realtime listeners
```

**Hosting:** Cloud Run (backend), Vercel (frontend). Fallback: local + ngrok.
**Justified Google services:** Gemini API, Firestore/Storage, Maps JS, Cloud Run.

### Folder structure
```
airpulse-ai/
├── frontend/src/{components,pages,services}/     # MapView, UploadModal, EvidenceCard, Dashboard, ReportDetail, FusionDebug
├── backend/src/
│   ├── controllers/reportController.js
│   ├── fusion/{evidenceEngine.js, physicsMetrics.js, forecast.js}
│   ├── ai/geminiService.js
│   ├── data/{sensorService.js, weatherService.js, fireService.js}
│   ├── config/{firebase.js, regions/*.json}
│   └── server.js
└── data/{mock_sensors.json, fixtures/, test_images/}
```

### Gemini contract
```json
{
  "isValidPollutionImage": true,
  "visualEvidenceScore": 0.82,
  "sourceType": "WASTE_BURNING | INDUSTRIAL_STACK | CONSTRUCTION_DUST | STUBBLE | UNCERTAIN",
  "spoofSuspicion": "LOW | MEDIUM | HIGH",
  "visualContext": "string",
  "summary": { "en": "...", "hi": "...", "ta": "..." }
}
```
temperature 0.1, response schema enforced, 1 retry, then lookup fallback. `UNCERTAIN` caps V at 0.5. Brief is generated **only from numbers supplied by the engine**; Gemini may not invent values. Notes are sanitized before prompting.

### Data model (Firestore)
- `regions/{id}`: name, bbox, wards, languages, stations[], baselines{μ,σ}
- `reports/{id}`: regionId, lat, lng, imageUrl, description, language, timestamp, status, weightMode, stationId, inputs{pm25, mu, sigma, distanceKm, windFrom, bearing, fireCount}, fusionResults{V,S,D,W, compositeScore, priorityClass, tier}, aiExplanation, actionBrief, clusterId?
- `sensor_obs`, `fire_detections`, `forecasts/{regionId}`, `alerts/{id}`, `actions/{id}`
- Common fields on every observation: `regionId, geo, observedAt, source, sourceType(live|mock|model), confidence`

### API
| Endpoint | Purpose |
|---|---|
| `GET /health` | Liveness |
| `POST /api/reports/process` | `{latitude, longitude, imageBase64, userDescription, language}` → `{success, reportId, fusionResults}` |
| `GET /api/reports?region=&since=&status=` | List |
| `PATCH /api/alerts/:id` | Assign / status / action note |
| `GET /api/forecast?region=` | Risk panel data |
| `GET /api/v1/incidents?region=` | Public GeoJSON with provenance, rounded coords |

### Security
- Lock Firestore rules before any public demo (Test Mode is open); writes server-side only via Admin SDK.
- Rate limit POST (5/min/IP); MIME + size checks; prompt-injection sanitization.
- Restrict Maps key by referrer; `.env` and service key never committed.

### Environment
```
# backend/.env
PORT=5000
GEMINI_API_KEY=
FIREBASE_SERVICE_ACCOUNT_PATH=./serviceAccountKey.json
OPENAQ_API_KEY=
FIRMS_MAP_KEY=
# frontend/.env
VITE_GOOGLE_MAPS_API_KEY=
VITE_BACKEND_URL=http://localhost:5000
```
`.gitignore`: `node_modules/ .env *.log serviceAccountKey.json dist/`

## 9. Non-Functional Targets

| Area | Target |
|---|---|
| Analysis latency | Gemini ≤ 6 s; end-to-end p95 ≤ 15 s |
| Alert latency | ≤ 3 s after fusion |
| Data freshness | Weather/sensor ≤ 1 h; FIRMS ≤ 3 h; forecast refresh hourly |
| Concurrency | 20 users |
| Compatibility | Latest Chrome/Safari, ≥ 360 px |
| Accessibility | WCAG AA contrast; color + text label |
| Cost | Free tiers only |
| Error trade-off | Favor false positive over false negative for Critical; tiers make uncertainty visible |

## 10. Privacy & Trust
Photo-privacy warning on `/report` · consent checkbox · no faces intentionally stored · 30-day retention · public API rounds coordinates · every AI/model output labeled as estimate · never claim health or regulatory impact.

## 11. Risks

| Risk | Impact | Likelihood | Mitigation | Phase |
|---|---|---|---|---|
| Sensor gap (d > 5 km) | High | High | Weight shift, R cap, tiers | MVP |
| Spoofed / screen / old photos | High | Med | Client timestamp, Gemini moiré flag, rate limit; EXIF later | MVP / P2 |
| Wrong μ, σ | High | High | Rolling stats + fallback constants | MVP |
| Heuristic forecast | Med | High | Label as estimate, show drivers | MVP |
| FIRMS / OpenAQ access or quota | Med | Med | Cached fixtures | MVP |
| Gemini latency / quota | High | Med | 5 s timeout + lookup table | MVP |
| Open backend / Firestore | High | High | Rules + rate limit | MVP |
| Mock data mistaken as real | High | Med | Visible MOCK badge | MVP |
| Privacy / surveillance | High | Med | Warning, rounding, retention | MVP |
| Scope creep | High | High | Cut order in §13 | MVP |

## 12. Scale Across India
Provider adapters (`sensorProvider`, `weatherProvider`, `fireProvider`) + region JSON + shared schema. New city = new region file + station mapping. Demo regions: **Delhi** (industrial / waste burning), **Punjab** (stubble, FIRMS-corroborated), **Chennai** (construction dust).

## 13. MVP Scope & Cut Order
**Must:** F1–F9. **Should:** F10–F13. **Could:** F14, F15.
**Cut order if behind:** heatmaps → voice → clustering → multilingual beyond EN/HI → forecast panel → FIRMS. Never cut: Gemini → fusion → Firestore → pin.
**Mocked/simplified:** some sensors, ward polygons, officer identity.

**Definition of done:** 5 deterministic cases hit expected bands · each dependency killed individually still completes the flow · Firestore locked · deployed URL + backup video · every value has a provenance chip.

## 14. Build Plan

| Day | Deliverable |
|---|---|
| 1 | Repo, keys, Gemini test script, Express skeleton, map renders, **schemas + region config frozen** |
| 2 | `/api/reports/process` (Gemini + weather + sensor + fusion + Firestore), fusion unit tests |
| 3 | Frontend wired, dashboard live, alerts, FIRMS, forecast, Cloud Run deploy |
| 4 | 5 demo cases, failure-injection tests, smoke test, backup video, slides |

**Ownership:** M1 frontend · M2 backend/Firestore/alerts/API · M3 Gemini schemas, prompts, eval set, fallback · M4 sensors/weather/FIRMS, fusion, forecast, tests.
**Critical path:** schema freeze → Gemini output shape → fusion → dashboard.

## 15. Testing
- **Unit:** D, W (0/360° wraparound, calm wind), S clamp, weight shift, band edges (44/45, 74/75), fire bonus cap.
- **Integration / failure injection:** disable Gemini, OpenAQ, Maps, FIRMS one at a time.
- **AI eval:** ~25 labeled images (fire, stack, dust, clean sky, screenshot, indoor) + Hindi/Tamil notes; check validity, sourceType, brief language.
- **Geospatial:** distance/bearing against known coordinate pairs.
- **Security:** oversized upload, non-image, injection text, Firestore rules.
- **Performance:** 10 sequential uploads, record p95.
- **Smoke test:** full flow on venue Wi-Fi and phone hotspot.

## 16. Demo Script
1. Submit Hindi report from phone (Delhi) → 2. show Gemini output → 3. red pin + alert appears → 4. open card and `/fusion-debug` → 5. officer assigns, resolves → 6. submit clean-sky photo (rejected) → 7. far-from-sensor case (weight shift, "Visual-only") → 8. switch to Punjab: FIRMS-corroborated stubble report → 9. forecast panel → 10. open `/api/v1/incidents` GeoJSON → 11. kill Gemini live, show fallback.

**Prepare:** 5 deterministic cases with fixed sensors, cached FIRMS/OpenAQ/Open-Meteo fixtures, 25-image eval set, backup video.
**Expect questions:** accuracy (evidence tiers, eval numbers, not PM2.5 claims) · real vs mock data (labeled) · fake photos · scaling to 100 cities (region config) · why not Vertex (not justified at MVP).
**State honestly:** weights are heuristic, forecast unvalidated, some sensors mocked.
**Backups:** lookup-table Gemini, mock sensors, static SVG map, local + ngrok.

## 17. Roadmap
- **P0:** setup (Day 1). **P1:** MVP (Days 2–4).
- **P2:** voice, offline queue, EXIF checks, officer auth, more regions, SMS/email alerts.
- **P3:** Earth Engine Sentinel-5P layers, learned forecast (Vertex / BigQuery ML) trained on officer feedback, state-level APIs.

## 18. Verify Before Building
1. `gemini-2.5-flash` available in your AI Studio.
2. NASA FIRMS MAP_KEY works; save a sample response as a fixture.
3. Open-Meteo air-quality endpoint responds for your test coordinates; save fixtures.
4. OpenAQ has a live station near each demo location; otherwise use mock + badge.
5. Legal/consent wording for photo collection.

## 19. Readiness Scorecard (target at end of MVP)

| Requirement | Status if plan holds | Gap → action |
|---|---|---|
| End-to-end prototype | Met | Build Days 2–3 |
| Meaningful Google AI (4 roles) | Met | 25-image eval numbers |
| Realistic data | Partial | Fixtures + mock labels |
| Hyper-local detection | Met | — |
| Industrial emissions | Met | Add stack test image |
| Agricultural burning | Partial | FIRMS access unverified → cached sample |
| Seasonal smog | Partial | Heuristic only → label, backtest one episode |
| Spike forecasting | Partial | Not ML → disclose, P3 model |
| Authority alerting | Met | In-app only; SMS post-MVP |
| Citizen participation | Met | Voice is Could |
| Satellite + met data | Partial | Earth Engine in P3 |
| India-specific design | Partial | 3 regions, 3 languages |
| Cross-city / state scale | Partial | Add 4th region as test |
| Interoperability | Partial | Document schema, GeoJSON API |
| Multilingual / voice | Partial | EN/HI/TA; voice optional |
| Privacy & security | Partial | Lock rules, consent notice |
| Demo readiness | Partial | Rehearse Day 4 |
