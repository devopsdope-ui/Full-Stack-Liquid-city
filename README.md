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
