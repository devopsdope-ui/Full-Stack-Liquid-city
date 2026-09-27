<<<<<<< HEAD
# Liquid City — Frontend & AI-Driven Digital Twin

Production React + Vite + TypeScript frontend for **Liquid City**, extended with the **HackCelestial 3.0 Midnight Task: Weather-Driven Digital Twin Enhancement for Hospitality & Travel Solutions**.

---

## 🌟 Midnight Task Features Implemented

1. **Real/Live Weather API Integration**
   - Fetches live temperature, precipitation rate (mm/h), wind speed (km/h), humidity, and conditions from Open-Meteo API.
   - Provides 5-minute caching to eliminate rate limits and deterministic fallback labeled as simulated if offline.
   - Endpoints: `GET /weather/current`, `GET /weather/forecast`.

2. **Geospatial Map Visualization (Free & Working)**
   - Powered by Leaflet & OpenStreetMap (`react-leaflet`) with zero API key requirement.
   - Live color-coded status markers for Event Hall, Cafeteria, Overflow Workshop, Roads, and Partners.
   - Dynamically updates marker status and popups during live operations or counterfactual simulations.

3. **Real-World Social & Public Signal Integration**
   - Ingests and normalizes authority and public alerts (Traffic Police, Radar warnings, Transit delays).
   - Feeds directly into corridor congestion multipliers without double-counting.
   - Endpoints: `GET /social-signals`, `POST /social-signals`.

4. **Interactive Digital Twin & Counterfactual What-If Simulator**
   - Visualizes live entity virtual state (`GET /digital-twin/events/{eventId}/state`).
   - Counterfactual simulator (`POST /digital-twin/events/{eventId}/what-if`) computes explainable cascading multipliers:
     `Rainfall → Outdoor Walkway Drop → Indoor Occupancy Accumulation → Cafeteria Spike → Road Congestion → Travel Delay`.
   - **Crucial Invariant:** What-If simulations **do not mutate** the live baseline operational state.
   - Step-by-step dependency chain and side-by-side metric comparison (`Before vs. After`).
   - One-click OR-Tools / Rule Replanning (`POST /digital-twin/events/{eventId}/replan`) to stagger dining intervals, open overflow halls, and divert gate transit.

---

## 🚀 Running the Project

### One-Command Full-Stack Launch
From the frontend directory:
```bash
./run_liquid_city.sh
```

### Manual Execution

#### 1. Backend (FastAPI on Port 8000)
```bash
cd "/Users/sk/Downloads/backend 3"
source venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8000
```
Swagger API docs: [http://localhost:8000/docs](http://localhost:8000/docs)

#### 2. Frontend (Vite on Port 5173)
```bash
cd "/Users/sk/Downloads/liquid-city-frontend"
npm run dev -- --host
```
Open in browser: [http://localhost:5173](http://localhost:5173)

---

## 🧪 Testing

Run the full pytest suite (including all 7 Digital Twin & Cascade tests):
```bash
cd "/Users/sk/Downloads/backend 3"
source venv/bin/activate
python -m pytest tests
```
**Results:** `45 passed, 2 warnings in ~18s` (100% pass rate).

Frontend TypeScript build verification:
```bash
cd "/Users/sk/Downloads/liquid-city-frontend"
npm run build
```
**Results:** `tsc -b && vite build` succeeds with zero errors.

---

## 🔑 Demo Mode Instructions

1. Navigate to [http://localhost:5173/login](http://localhost:5173/login).
2. Click **"Organizer Demo"** to log in as event operator.
3. Open **"Digital Twin"** from the left navigation bar (`/organizer/digital-twin`).
4. Review **Live Weather Feed** and real-time baseline values:
   - Cafeteria: `120 / 150 (80%)`
   - Corridor: `46.1% congestion, 19.0m delay`
5. Select the **"Heavy Rain (35mm)"** preset or adjust sliders:
   - Rainfall: `35 mm/h`
   - Temperature: `22°C`
   - Wind: `28 km/h`
   - Duration: `60 mins`
6. Click **"Run What-If Simulation"**:
   - Observe counterfactual state: Cafeteria spikes to `164 / 150 (CRITICAL)`, Central Avenue congestion reaches `63.6%`.
   - Inspect the 5-step **Cascading Dependency Chain**.
   - Note the interactive map markers changing color to reflect risk.
7. Click **"Apply Weather Re-Plan"**:
   - Re-balances gates, staggers dining groups, and stabilizes cafeteria load to `125 / 150 (83.3%)`.
8. Click **"Exit What-If Mode"** or refresh to confirm the **real live state remained 100% untouched**.
=======
# Liquid City — Backend

Liquid City is a smart city / event crowd management platform. During large
events, some locations become overcrowded while nearby locations sit
underused (e.g. a stadium at 94% while a restaurant 2 km north sits at
35%). Liquid City simulates that situation, predicts what happens next
with lightweight ML models, and recommends better options — **without
ever forcing a visitor's choice**.

The core intelligence loop:

```
Simulation → Current Conditions → ML Prediction → Recommendation → Updated Conditions
```

---

## 1. Architecture

Everything runs inside **one** Python/FastAPI application — no separate ML
microservice, no Node backend.

```
Frontend
   ↓
FastAPI API            (app/api/*)          — thin, no business logic
   ↓
Service layer          (app/services/*)     — business logic, orchestration
   ├── Simulation       (app/simulation/*)  — in-memory city/event state
   ├── ML prediction     (app/ml/*)         — crowd + travel-time regressors
   ├── Recommendation    (app/ml/recommend.py + recommendation_service.py)
   └── Database          (app/db/supabase.py) — optional persistence
   ↓
Response (JSON)
```

**Rule followed throughout the code:** the ML models only *predict* a
number or *score* an option. Deciding what that means (risk level, whether
to recommend it, whether to let a visitor pick it anyway) is separate,
explainable, rule-based business logic in the service layer.

---

## 2. Folder structure

```
backend/
├── app/
│   ├── main.py                     # FastAPI app + router wiring
│   ├── api/                        # thin HTTP route handlers
│   │   ├── events.py  crowd.py  roads.py  partners.py
│   │   ├── routes.py  recommendations.py  simulation.py  admin.py
│   ├── services/                   # business logic
│   │   ├── event_service.py  crowd_service.py  road_service.py
│   │   ├── partner_service.py  route_service.py
│   │   ├── recommendation_service.py
│   │   ├── simulation_service.py  admin_service.py
│   ├── ml/
│   │   ├── data_generator.py       # synthetic data for all 3 models
│   │   ├── train_crowd_model.py
│   │   ├── train_travel_model.py
│   │   ├── train_recommendation_model.py
│   │   ├── predict_crowd.py  predict_travel_time.py  recommend.py
│   │   └── models/                 # trained .pkl files land here
│   ├── simulation/
│   │   ├── crowd_simulator.py  traffic_simulator.py
│   │   ├── restaurant_simulator.py  event_simulator.py
│   │   └── simulation_engine.py    # in-memory state + admin actions
│   ├── db/
│   │   └── supabase.py             # optional Supabase client
│   ├── schemas/                    # Pydantic request/response models
│   └── utils/
│       ├── constants.py            # thresholds, default demo state
│       └── calculations.py         # crowd status / congestion / risk
├── data/{raw,processed}/
├── tests/                          # pytest suite
├── Dockerfile
├── docker-compose.yml
├── requirements.txt
├── .env.example
└── docker-entrypoint.sh            # auto-trains missing models on boot
```

---

## 3. Installation (local, no Docker)

```bash
cd backend
python3 -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
```

`.env` only needs Supabase values if you actually want persistence — the
app runs fully in-memory without them.

---

## 4. Environment variables (`.env`)

| Variable        | Required? | Purpose                                             |
|-----------------|-----------|------------------------------------------------------|
| `SUPABASE_URL`  | No        | If set (with `SUPABASE_KEY`), events/partners persist to Supabase Postgres |
| `SUPABASE_KEY`  | No        | Supabase service/anon key |
| `CORS_ORIGINS`  | No        | Comma-separated frontend origins, or `*` (default) for local dev |

If Supabase isn't configured, everything (including the admin-controlled
simulation) still works — it just lives in memory for the life of the
process.

---

## 5. Training the ML models

Three independent RandomForestRegressor models, each with its own
synthetic-data generator (realistic relationships, not random noise — see
`app/ml/data_generator.py`):

```bash
python -m app.ml.train_crowd_model
python -m app.ml.train_travel_model
python -m app.ml.train_recommendation_model
```

Each script prints MAE / RMSE / R² and a handful of example predictions,
then saves a `.pkl` to `app/ml/models/`. If a `.pkl` is missing, the
corresponding API endpoint returns a clear `503` telling you which command
to run — it never crashes silently. Running with Docker Compose trains any
missing models automatically on first boot (see `docker-entrypoint.sh`).

Re-run any script any time to retrain with a different `seed` or
`n_samples` (edit the `train()` call at the bottom of the file, or import
and call it yourself with different arguments).

---

## 6. Running the API locally

```bash
uvicorn app.main:app --reload
```

Swagger / interactive docs: **http://localhost:8000/docs**

---

## 7. Running with Docker

```bash
cp .env.example .env      # docker-compose reads this file
docker compose up --build
```

This builds the image, installs dependencies, trains any missing models,
and starts uvicorn on port 8000. No PostgreSQL container is created —
Supabase provides Postgres externally if you choose to configure it.

---

## 8. Running tests

```bash
pytest tests/ -v
```

Covers: crowd status calculation, occupancy validation, risk/trend logic,
crowd + travel-time prediction via the API, recommendation ranking,
accept/reject/choice flow, simulation start/reset/crowd-surge/event-end/
traffic-jam, admin ↔ simulation endpoint parity, and input validation
(zero capacity, negative distance, unknown road/location ids).

---

## 9. API endpoints

**Health**
`GET /` · `GET /health`

**Events**
`GET /events` · `GET /events/{id}` · `POST /events` · `PUT /events/{id}`

**Crowd**
`GET /crowd` · `GET /crowd/{location_id}` · `GET /crowd/{location_id}/predict`

**Roads**
`GET /roads` · `GET /roads/{road_id}`

**Partners** (restaurants / parking / shuttle)
`GET /partners` · `GET /partners/{id}` · `POST /partners` · `PUT /partners/{id}`

**Routes**
`GET /routes` · `POST /routes/predict`

**Recommendations**
`GET|POST /recommendations/restaurants` · `GET|POST /recommendations/routes`
`POST /recommendations/restaurants/choice` — accept / reject / pick-your-own

**Simulation** (also mirrored under `/admin/simulation/...`)
`POST /simulation/start` · `POST /simulation/pause` · `POST /simulation/reset`
`GET /simulation/status`
`POST /simulation/crowd-surge` · `POST /simulation/event-end`
`POST /simulation/traffic-jam` · `POST /simulation/restaurant-occupancy`
`POST /simulation/set-attendance`

The `/admin/...` routes call the exact same `simulation_service` functions
— no duplicated logic — so admin actions and the "public" simulation
endpoints are always in sync.

---

## 10. Example demo flow (matches the hackathon script)

```bash
# 1. Start the simulation
curl -X POST localhost:8000/simulation/start

# 2. Check initial state: stadium ~94%, central_road ~80%, restaurant_c ~35%
curl localhost:8000/simulation/status

# 3. Admin triggers "Event Ending"
curl -X POST localhost:8000/admin/simulation/event-end

# -> stadium crowd drops (e.g. 94% -> 70%), central_road congestion rises
#    (e.g. 80% -> 95%), restaurant_c stays the strong pick

# 4. ML predicts what happens next
curl localhost:8000/crowd/stadium_crowd/predict
# -> falling trend => risk is NOT bumped up even though occupancy is still high

curl -X POST localhost:8000/routes/predict -H "Content-Type: application/json" -d \
  '{"distance_km":8,"normal_travel_time":12,"congestion":95,"road_capacity":3000,"average_speed":40}'
# -> shows that a short, jammed route can predict a LONGER travel time
#    than a longer, clearer one

# 5. Visitor asks for a recommendation
curl localhost:8000/recommendations/restaurants
# -> Restaurant C ranked first: low crowd, short wait, strong offer

# 6. Visitor rejects the top pick
curl -X POST localhost:8000/recommendations/restaurants/choice \
  -H "Content-Type: application/json" -d '{"rejected_id":"restaurant_c"}'
# -> returns the next best option

# 7. Visitor instead insists on the crowded Restaurant A
curl -X POST localhost:8000/recommendations/restaurants/choice \
  -H "Content-Type: application/json" -d '{"chosen_id":"restaurant_a"}'
# -> allowed; response includes its current occupancy/wait/predicted travel time
```

---

## 11. Simulation controls (admin)

| Action | Endpoint | Effect |
|---|---|---|
| Start | `POST /admin/simulation/start` | `simulation_running = true` |
| Pause | `POST /admin/simulation/pause` | `simulation_running = false` |
| Reset | `POST /admin/simulation/reset` | Restores default demo state |
| Set attendance | `POST /admin/simulation/set-attendance` | `{"event_attendance": 60000}` |
| Crowd surge | `POST /admin/simulation/crowd-surge` | `{"location_id": "stadium_crowd", "amount": 10}` |
| Event ending | `POST /admin/simulation/event-end` | Stadium empties, roads/restaurants react |
| Traffic jam | `POST /admin/simulation/traffic-jam` | `{"road_id": "central_road", "amount": 20}` |
| Restaurant occupancy | `POST /admin/simulation/restaurant-occupancy` | `{"partner_id": "restaurant_a", "occupancy": 50}` |

---

## 12. Why a location at 100% isn't automatically "high risk"

A stadium can sit at 100% simply because everyone has already entered and
no one is leaving yet — congestion is actually about to fall. `calculate_risk()`
in `app/utils/calculations.py` looks at **both** the predicted level and the
trend (rising vs falling) before assigning a risk label, and a falling
trend is never bumped up regardless of how high the absolute number is.

---

## 13. Organizer Questionnaire → Gemini → Planning Engine

A second, independent feature lives alongside the crowd-simulation demo:
turning an organizer's questionnaire answers into an operational plan.

```
Organizer questionnaire (raw answers)
        ↓
POST /questionnaire/submit
        ↓
event_model_service.py  — builds the structured model deterministically;
                           calls Gemini ONLY for the 3 free-text fields
                           (movement notes, special instructions, "Other"
                           event type) via app/services/gemini_service.py
        ↓
Structured Event Model (persisted: Supabase "event_models" table, or
                         in-memory if Supabase isn't configured)
        ↓
POST /planning/{event_model_id}/generate
        ↓
planning_service.py  — pure rule-based logic: gate allocation, zone
                        congestion, bottlenecks, exit flow, resource
                        demand, group handling. NOT an LLM call.
        ↓
Operational Plan (persisted: Supabase "plans" table, or in-memory)
```

**Why Gemini is scoped so narrowly:** every number in the structured model
either came directly from the organizer or is explicitly marked
`"unknown"` — Gemini never invents a capacity, an attendance figure, or a
gate percentage. Its only job is turning three free-text fields into
structured data. If `GEMINI_API_KEY` isn't set, or a call fails for any
reason, each of those three fields falls back to storing the organizer's
raw text with `"source": "raw_text_no_gemini"` instead of crashing or
guessing — verified in `tests/test_questionnaire.py`.

### Endpoints

| Endpoint | Purpose |
|---|---|
| `POST /questionnaire/submit` | Submit raw organizer answers → structured event model |
| `GET /questionnaire` | List submitted event models |
| `GET /questionnaire/{event_model_id}` | Fetch one (raw + structured) |
| `POST /planning/{event_model_id}/generate` | Run the planning engine, persist + return the plan |
| `GET /planning/{event_model_id}` | Fetch the latest plan for an event |
| `GET /planning/by-plan-id/{plan_id}` | Fetch a specific plan by its own id |

### Supabase setup for this feature

1. Create a Supabase project (or use your existing one).
2. Open **SQL Editor** → paste the contents of `migrations/supabase_schema.sql` → Run.
3. Copy your project's **Project URL** and **anon/service key** (Settings → API) into `.env` as `SUPABASE_URL` / `SUPABASE_KEY`.
4. Restart the server. `event_models` and `plans` will now persist across restarts instead of living only in memory.

Without Supabase configured, everything still works — it just resets when
the process restarts (fine for a hackathon demo, not fine for production).

### Gemini setup

1. Get a key from [Google AI Studio](https://aistudio.google.com/).
2. Put it in `.env` as `GEMINI_API_KEY`.
3. `GEMINI_MODEL` defaults to `gemini-2.5-flash`; change it in `.env` if you want a different model.

If you skip this, the questionnaire still fully works — the three
free-text fields just stay unparsed raw text (see above).

---

## 14. Connecting a frontend

CORS is already open (`CORS_ORIGINS=*` by default in `.env.example`) so
any frontend on `localhost` can call this API directly during development.
For production, set `CORS_ORIGINS` to your actual frontend origin(s),
comma-separated.

Minimal example (any framework) — submit the questionnaire and generate a plan:

```javascript
const submitRes = await fetch("http://localhost:8000/questionnaire/submit", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(organizerFormData), // shape: app/schemas/questionnaire.py
});
const { id: eventModelId, structured_model } = await submitRes.json();

const planRes = await fetch(`http://localhost:8000/planning/${eventModelId}/generate`, {
  method: "POST",
});
const plan = await planRes.json();
```

The crowd-simulation endpoints (`/simulation/*`, `/recommendations/*`, etc.
from the earlier build) are independent of this questionnaire feature and
can be called the same way — see section 9 above for the full list.

If you tell me your frontend's stack and share the repo (or its API
client folder), I can wire up the actual fetch calls / hooks directly
instead of leaving this as a generic example.

---

## 15. Known simplifications & places to extend

This is a hackathon-scoped build. A few deliberate shortcuts, called out so
you know where to dig in if you want to go further:

- **In-memory simulation state**: a single process-wide singleton
  (`app/simulation/simulation_engine.py`). Fine for a demo; would need to
  move into Supabase (or Redis) for multi-instance deployments.
- **Partner entry/exit rates**: only the stadium tracks explicit
  `entry_rate` / `exit_rate`. Restaurants/parking/shuttle use flat default
  rates when fed into the crowd model — add per-partner flow tracking in
  `simulation_engine.py` for more realistic partner-level predictions.
- **Road ↔ partner mapping**: `_PARTNER_ROAD` in
  `recommendation_service.py` is a hardcoded lookup. A real system would
  use an actual routing/geo service.
- **Visitor preference options**: currently `balanced | low_crowd | fastest
  | cheapest`. Add more (e.g. `accessible`, `family_friendly`) by extending
  `PREFERENCE_ENCODING` in `app/ml/data_generator.py` and retraining the
  recommendation model.
- **No auth**: admin endpoints are unauthenticated for demo simplicity —
  add an API key / auth dependency before any real deployment.
- **Planning engine is single-pass**: `generate_plan()` computes one plan
  from the structured model; it doesn't yet compare multiple candidate
  plans against organizer priorities the way section 5 of the spec
  describes ("the planning engine may calculate an appropriate strategy").
  The priority list is passed through and used for a couple of rules
  (e.g. `balance_entrances` forces an equal gate split) — extend
  `planning_service.py` to weigh more priorities if you want deeper
  optimization.
- **No live re-planning loop yet**: the spec's "Level 3 — Adapt" (live
  crowd data → prediction → bottleneck detection → re-planning) isn't
  wired up between this questionnaire/planning feature and the earlier
  crowd-simulation ML models. They currently run side by side; connecting
  a live plan's zones/gates to the simulation engine's crowd predictions
  is a natural next step.
- **Gemini calls are unauthenticated by IP/rate-limit protection**: add
  request throttling in front of `/questionnaire/submit` before exposing
  it publicly, since each submission can trigger up to 3 Gemini calls.
>>>>>>> 743badc0c27ebfacbf975bd56c13feb1efa9b407
