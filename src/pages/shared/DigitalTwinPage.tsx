import React, { useState } from 'react';
import {
  Cloud,
  CloudRain,
  Sun,
  Wind,
  Droplets,
  AlertTriangle,
  Play,
  RotateCcw,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  MapPin,
  CheckCircle2,
  Share2,
  Radio,
  FileCheck,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { usePolling } from '../../hooks/usePolling';
import { digitalTwinService } from '../../services/digitalTwinService';
import { ProgressBar, CrowdStatusBadge } from '../../components/ui/ProgressBar';
import { ErrorState } from '../../components/ui/ErrorState';
import { CardSkeleton } from '../../components/ui/Skeleton';
import { CityMap, MapMarkerData } from '../../maps/CityMap';
import type {
  DigitalTwinState,
  WhatIfScenarioRequest,
  WhatIfScenarioResponse,
  ReplanResponse,
} from '../../types';

const PRESETS: Record<string, WhatIfScenarioRequest> = {
  normal: {
    rainfall_mm_per_hour: 0,
    temperature_c: 24,
    wind_speed_kmh: 12,
    storm_duration_minutes: 0,
    scenario_preset: 'Normal Clear Weather',
  },
  light_rain: {
    rainfall_mm_per_hour: 8,
    temperature_c: 23,
    wind_speed_kmh: 18,
    storm_duration_minutes: 30,
    scenario_preset: 'Light Rain Shower',
  },
  heavy_rain: {
    rainfall_mm_per_hour: 35,
    temperature_c: 22,
    wind_speed_kmh: 28,
    storm_duration_minutes: 60,
    scenario_preset: 'Heavy Downpour',
  },
  extreme_rain: {
    rainfall_mm_per_hour: 65,
    temperature_c: 21,
    wind_speed_kmh: 45,
    storm_duration_minutes: 90,
    scenario_preset: 'Extreme Flash Flood Rain',
  },
  extreme_heat: {
    rainfall_mm_per_hour: 0,
    temperature_c: 42,
    wind_speed_kmh: 10,
    storm_duration_minutes: 120,
    scenario_preset: 'Heatwave Alert',
  },
};

export default function DigitalTwinPage() {
  const [selectedEventId] = useState('techhack-2026');

  // Real-time Live Digital Twin State from Backend
  const {
    data: liveState,
    loading: liveLoading,
    error: liveError,
    refetch: refetchLive,
  } = usePolling<DigitalTwinState>(() => digitalTwinService.getState(selectedEventId), {
    interval: 15000,
  });

  // Real-time Community & Social Signals
  const { data: socialSignals, refetch: refetchSignals } = usePolling(
    () => digitalTwinService.getSocialSignals(),
    { interval: 20000 }
  );

  // Counterfactual What-If Simulation State
  const [scenario, setScenario] = useState<WhatIfScenarioRequest>({
    rainfall_mm_per_hour: 35,
    temperature_c: 22,
    wind_speed_kmh: 25,
    storm_duration_minutes: 60,
  });
  const [simulating, setSimulating] = useState(false);
  const [simResult, setSimResult] = useState<WhatIfScenarioResponse | null>(null);
  const [simError, setSimError] = useState<string | null>(null);

  // Replan State
  const [replanning, setReplanning] = useState(false);
  const [replanResult, setReplanResult] = useState<ReplanResponse | null>(null);
  const [replanError, setReplanError] = useState<string | null>(null);

  const applyPreset = (key: keyof typeof PRESETS) => {
    setScenario({ ...PRESETS[key] });
    setSimResult(null);
    setReplanResult(null);
    setSimError(null);
    setReplanError(null);
  };

  const handleRunSimulation = async () => {
    setSimulating(true);
    setSimError(null);
    setReplanResult(null);
    setReplanError(null);
    try {
      const res = await digitalTwinService.runWhatIf(selectedEventId, scenario);
      setSimResult(res);
    } catch (err: unknown) {
      console.error('Failed to run counterfactual simulation:', err);
      const msg = (err as { message?: string })?.message || 'Simulation failed. The backend may be unavailable.';
      setSimError(msg);
    } finally {
      setSimulating(false);
    }
  };

  const handleReplan = async () => {
    setReplanning(true);
    setReplanError(null);
    try {
      const res = await digitalTwinService.executeReplan(selectedEventId, {
        trigger: `weather_cascade_${scenario.rainfall_mm_per_hour}mm`,
        what_if_scenario: scenario,
      });
      setReplanResult(res);
    } catch (err: unknown) {
      console.error('Failed to execute replan:', err);
      const msg = (err as { message?: string })?.message || 'Re-plan failed. Please try again.';
      setReplanError(msg);
    } finally {
      setReplanning(false);
    }
  };

  // Build Interactive Map Markers safely from current active state
  const activeState = simResult ? simResult.simulated : liveState;

  const baseLat = 12.9716;
  const baseLng = 77.5946;
  const mapMarkers: MapMarkerData[] = [];

  if (activeState && activeState.zones) {
    // Venue Main Hall
    if (activeState.zones.main_hall) {
      mapMarkers.push({
        id: 'venue-main',
        lat: baseLat,
        lng: baseLng,
        title: 'TechHack Main Hall',
        subtitle: `${activeState.zones.main_hall.occupancy || 390}/${activeState.zones.main_hall.capacity || 500} inside`,
        status: (activeState.zones.main_hall.status as any) || 'NORMAL',
        type: 'event',
      });
    }

    // Cafeteria
    const caf = activeState.zones.cafeteria;
    if (caf) {
      mapMarkers.push({
        id: 'venue-cafeteria',
        lat: baseLat + 0.003,
        lng: baseLng - 0.003,
        title: 'Cafeteria & Dining',
        subtitle: `Occupancy: ${caf.occupancy}/${caf.capacity} (${caf.occupancy_percent}%)`,
        status: (caf.status as any) || (caf.occupancy_percent >= 90 ? 'CRITICAL' : 'MODERATE'),
        type: 'restaurant',
      });
    }

    // Workshop B (Overflow)
    const wb = activeState.zones.workshop_b;
    if (wb) {
      mapMarkers.push({
        id: 'venue-workshop-b',
        lat: baseLat - 0.003,
        lng: baseLng + 0.004,
        title: 'Workshop B (Auxiliary Space)',
        subtitle: `Occupancy: ${wb.occupancy}/${wb.capacity}`,
        status: (wb.status as any) || 'NORMAL',
        type: 'event',
      });
    }
  }

  if (activeState && activeState.transport) {
    // Road 01 (Central Avenue)
    const rd1 = activeState.transport.road_01;
    if (rd1) {
      mapMarkers.push({
        id: 'road-01',
        lat: baseLat + 0.007,
        lng: baseLng + 0.002,
        title: rd1.name || 'Central Avenue',
        subtitle: `${rd1.congestion_percent}% Congestion • ${rd1.travel_time_minutes}m travel time`,
        status: (rd1.status as any) || 'MODERATE',
        type: 'transport',
      });
    }

    // Road 02 (North Ring Road)
    const rd2 = activeState.transport.road_02;
    if (rd2) {
      mapMarkers.push({
        id: 'road-02',
        lat: baseLat + 0.004,
        lng: baseLng + 0.009,
        title: rd2.name || 'North Ring Road',
        subtitle: `${rd2.congestion_percent}% Congestion • ${rd2.travel_time_minutes}m travel time`,
        status: (rd2.status as any) || 'NORMAL',
        type: 'transport',
      });
    }
  }

  // Safe accessor for weather
  const weather = liveState?.weather || {
    temperature_c: 24,
    humidity: 65,
    rainfall_mm_per_hour: 0,
    wind_speed_kmh: 12,
    condition: 'clear',
    source: 'simulated_fallback',
    is_live: false,
    timestamp: '',
  };

  const attendanceInside = activeState?.event?.inside ?? 412;
  const attendanceExpected = activeState?.event?.expected_attendance ?? 500;
  const attendanceRatio = Math.round((attendanceInside / attendanceExpected) * 100);

  const cafeteria = activeState?.zones?.cafeteria;
  const cafeteriaOcc = cafeteria?.occupancy ?? 120;
  const cafeteriaCap = cafeteria?.capacity ?? 150;
  const cafeteriaPct = cafeteria?.occupancy_percent ?? 80;
  const cafeteriaPred = cafeteria?.predicted_15_min ?? 158;

  const road01 = activeState?.transport?.road_01;
  const road01Cong = road01?.congestion_percent ?? 42;
  const road01Time = road01?.travel_time_minutes ?? 17;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Banner: Status Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-city-border shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-status-available animate-pulse"></span>
            <span className="text-xs font-bold uppercase tracking-wider text-city-muted">
              AI-Driven Weather Digital Twin • Live Connected
            </span>
            <span className="badge badge-green text-[10px]">Active</span>
          </div>
          <h1 className="text-2xl font-black text-city-black">
            Liquid City Digital Twin & Cascade Engine
          </h1>
          <p className="text-xs text-city-muted mt-0.5">
            Real-time entity dependencies, live weather propagation, social signals, and counterfactual simulation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              refetchLive();
              refetchSignals();
            }}
            className="btn-secondary text-xs flex items-center gap-1.5"
          >
            <RefreshCw size={13} />
            Refresh Live State
          </button>
          {simResult && (
            <button
              onClick={() => {
                setSimResult(null);
                setReplanResult(null);
                setSimError(null);
                setReplanError(null);
              }}
              className="btn-primary text-xs flex items-center gap-1.5 bg-red-600 hover:bg-red-700"
            >
              <RotateCcw size={13} />
              Exit What-If Mode
            </button>
          )}
        </div>
      </div>

      {/* Show error as compact inline banner (not full-page blocker) when we already have data */}
      {liveError && (
        <ErrorState
          error={liveError}
          onRetry={refetchLive}
          compact={!!liveState}
        />
      )}

      {/* Grid: Live Weather & Real-world Environmental Signals */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {liveLoading && !liveState ? (
          <>
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </>
        ) : (
          <>
            {/* Live Weather Card */}
            <div className="stat-card bg-white border border-city-border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-city-muted uppercase tracking-wider">
                  Live Weather Feed
                </span>
                {weather.is_live ? (
                  <span className="badge badge-green text-[10px]">LIVE API</span>
                ) : (
                  <span className="badge badge-yellow text-[10px]">SIMULATED</span>
                )}
              </div>
              <div className="flex items-center gap-3 my-1">
                {(weather.rainfall_mm_per_hour ?? 0) > 5 ? (
                  <CloudRain className="w-8 h-8 text-blue-500" />
                ) : (
                  <Sun className="w-8 h-8 text-amber-500" />
                )}
                <div>
                  <div className="text-2xl font-black text-city-black">
                    {weather.temperature_c}°C
                  </div>
                  <div className="text-[11px] text-city-muted capitalize">
                    {weather.condition.replace('_', ' ')}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-1 text-[11px] text-city-muted pt-2 border-t border-city-border">
                <span>Rain: <strong>{weather.rainfall_mm_per_hour ?? 0} mm/h</strong></span>
                <span>Wind: <strong>{weather.wind_speed_kmh ?? 0} km/h</strong></span>
                <span>Humidity: <strong>{weather.humidity ?? 0}%</strong></span>
                <span>Source: <strong>{weather.source}</strong></span>
              </div>
            </div>

            {/* Venue Attendance */}
            <div className="stat-card bg-white border border-city-border">
              <span className="text-xs font-bold text-city-muted uppercase tracking-wider">
                Event Attendance
              </span>
              <div className="text-3xl font-black text-city-black my-1">
                {attendanceInside}
                <span className="text-xs text-city-muted font-normal ml-1">
                  / {attendanceExpected}
                </span>
              </div>
              <ProgressBar
                value={attendanceRatio}
                className="mt-2"
              />
              <span className="text-[11px] text-city-muted mt-1 block">
                {attendanceRatio}% attendance verified
              </span>
            </div>

            {/* Cafeteria Dining Load */}
            <div className="stat-card bg-white border border-city-border">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-bold text-city-muted uppercase tracking-wider">
                  Cafeteria Utilization
                </span>
                <CrowdStatusBadge status={cafeteria?.status || 'NORMAL'} />
              </div>
              <div className="text-3xl font-black text-city-black my-1">
                {cafeteriaOcc}
                <span className="text-xs text-city-muted font-normal ml-1">
                  / {cafeteriaCap}
                </span>
              </div>
              <ProgressBar value={cafeteriaPct} className="mt-2" />
              <div className="flex justify-between text-[11px] text-city-muted mt-1">
                <span>Predicted in 15m:</span>
                <strong className={cafeteriaPred > cafeteriaCap ? 'text-status-crowded' : ''}>
                  {cafeteriaPred} pax
                </strong>
              </div>
            </div>

            {/* Arterial Road Delay */}
            <div className="stat-card bg-white border border-city-border">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-bold text-city-muted uppercase tracking-wider">
                  Corridor Congestion
                </span>
                <CrowdStatusBadge status={road01?.status || 'MODERATE'} />
              </div>
              <div className="text-3xl font-black text-city-black my-1">
                {road01Cong}%
              </div>
              <ProgressBar value={road01Cong} className="mt-2" />
              <span className="text-[11px] text-city-muted mt-1 block">
                Travel delay: <strong>{road01Time} mins</strong>
              </span>
            </div>
          </>
        )}
      </div>

      {/* Main Interactive Grid: Counterfactual Simulator Controls + Live Geospatial Map */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: What-If Counterfactual Controls */}
        <div className="lg:col-span-5 space-y-4">
          <div className="card p-5 bg-white border border-city-border shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CloudRain className="w-5 h-5 text-city-black" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-city-black">
                  Weather What-If Simulator
                </h2>
              </div>
              <span className="badge badge-gray text-[10px]">Non-Mutating</span>
            </div>

            <p className="text-xs text-city-muted">
              Simulate high-impact weather shocks without modifying the live operational state.
            </p>

            {/* Scenario Presets */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-city-muted">
                1-Click Presets:
              </label>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { key: 'normal', label: 'Normal' },
                  { key: 'light_rain', label: 'Light Rain (8mm)' },
                  { key: 'heavy_rain', label: 'Heavy Rain (35mm)' },
                  { key: 'extreme_rain', label: 'Extreme (65mm)' },
                  { key: 'extreme_heat', label: 'Heatwave (42°C)' },
                ].map((p) => (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => applyPreset(p.key as any)}
                    className="px-2.5 py-1 text-xs rounded-md border border-city-border bg-beige-100 hover:bg-city-black hover:text-white transition-colors"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Controls Sliders */}
            <div className="space-y-3 pt-2">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-semibold text-city-charcoal">Rainfall Intensity</span>
                  <span className="font-bold text-city-black">{scenario.rainfall_mm_per_hour} mm/h</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={scenario.rainfall_mm_per_hour}
                  onChange={(e) =>
                    setScenario({ ...scenario, rainfall_mm_per_hour: parseFloat(e.target.value) })
                  }
                  className="w-full accent-city-black"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-semibold text-city-charcoal">Ambient Temperature</span>
                  <span className="font-bold text-city-black">{scenario.temperature_c}°C</span>
                </div>
                <input
                  type="range"
                  min="15"
                  max="45"
                  step="1"
                  value={scenario.temperature_c}
                  onChange={(e) =>
                    setScenario({ ...scenario, temperature_c: parseFloat(e.target.value) })
                  }
                  className="w-full accent-city-black"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-semibold text-city-charcoal">Wind Gust Speed</span>
                  <span className="font-bold text-city-black">{scenario.wind_speed_kmh} km/h</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="80"
                  step="5"
                  value={scenario.wind_speed_kmh}
                  onChange={(e) =>
                    setScenario({ ...scenario, wind_speed_kmh: parseFloat(e.target.value) })
                  }
                  className="w-full accent-city-black"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-semibold text-city-charcoal">Storm Duration</span>
                  <span className="font-bold text-city-black">{scenario.storm_duration_minutes} mins</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="180"
                  step="15"
                  value={scenario.storm_duration_minutes}
                  onChange={(e) =>
                    setScenario({ ...scenario, storm_duration_minutes: parseInt(e.target.value, 10) })
                  }
                  className="w-full accent-city-black"
                />
              </div>
            </div>

            {simError && (
              <div className="flex items-center gap-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                <AlertTriangle size={13} className="shrink-0" />
                <span className="flex-1">{simError}</span>
                <button onClick={() => setSimError(null)} className="text-red-500 hover:text-red-700 ml-1">✕</button>
              </div>
            )}

            <button
              onClick={handleRunSimulation}
              disabled={simulating}
              className="btn-primary w-full text-xs flex items-center justify-center gap-2 py-2.5 shadow-sm"
            >
              <Play size={14} />
              {simulating ? 'Running Cascade Propagation...' : 'Run What-If Simulation'}
            </button>
          </div>

          {/* Real-world Social & Public Signals Panel */}
          <div className="card p-4 bg-white border border-city-border space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Radio className="w-4 h-4 text-city-black animate-pulse" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-city-black">
                  Public & Authority Signals
                </h3>
              </div>
              <span className="text-[10px] text-city-muted">Normalized Ingestion</span>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {socialSignals && socialSignals.length > 0 ? (
                socialSignals.map((sig) => (
                  <div
                    key={sig.id}
                    className="p-2.5 bg-beige-100 rounded-lg border border-city-border text-xs space-y-1"
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-[11px] text-city-black">{sig.source}</span>
                      <span className="badge badge-yellow text-[9px]">
                        Severity: {Math.round(sig.severity * 100)}%
                      </span>
                    </div>
                    <p className="text-[11px] text-city-charcoal leading-snug">{sig.text}</p>
                  </div>
                ))
              ) : (
                <div className="text-xs text-city-muted p-2">Monitoring live public & social feeds...</div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Geospatial Digital Map of Venue & Corridors */}
        <div className="lg:col-span-7 flex flex-col space-y-4">
          <div className="card p-5 bg-white border border-city-border flex-1 flex flex-col min-h-[460px]">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-city-black">
                  Geospatial Digital Twin Visualization
                </h2>
                <span className="text-xs text-city-muted">
                  Interactive real-time map showing weather impacts, venue zones, dining, and road bottlenecks.
                </span>
              </div>
              {simResult ? (
                <span className="badge badge-red text-[10px] uppercase font-bold animate-pulse">
                  SIMULATING COUNTERFACTUAL
                </span>
              ) : (
                <span className="badge badge-green text-[10px] uppercase font-bold">
                  LIVE REAL STATE
                </span>
              )}
            </div>

            <div className="flex-1 w-full rounded-xl overflow-hidden border border-city-border min-h-[360px]">
              <CityMap
                center={{ lat: baseLat, lng: baseLng }}
                zoom={14}
                markers={mapMarkers}
                showTraffic={true}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Counterfactual Simulation Cascade & Impact Comparison (Shown when simulation runs) */}
      {simResult && (
        <div className="space-y-6 fade-in">
          {/* 1. Before vs After Comparison Cards */}
          <div className="card p-5 bg-white border border-city-border space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-city-black">
                  Counterfactual Impact Comparison
                </h2>
                <p className="text-xs text-city-muted">
                  Baseline Live State vs. What-If Scenario ({scenario.rainfall_mm_per_hour} mm/h Rain, {scenario.storm_duration_minutes}m duration)
                </p>
              </div>
              <span className="text-xs font-bold text-city-muted">
                Confidence: {Math.round(((simResult.confidence && simResult.confidence.prediction_confidence) || 0.84) * 100)}%
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {simResult.changes && simResult.changes.map((change) => {
                return (
                  <div key={change.entity} className="p-4 bg-beige-100 rounded-xl border border-city-border">
                    <span className="text-xs text-city-muted font-bold uppercase">{change.entity}</span>
                    <div className="flex items-center gap-2 my-1">
                      <span className="text-lg font-bold text-city-muted">
                        {change.before} {change.unit}
                      </span>
                      <ArrowRight size={14} className="text-city-muted" />
                      <span className="text-2xl font-black text-status-crowded">
                        {change.after} {change.unit}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-xs font-semibold text-status-crowded">
                      <TrendingUp size={13} />
                      <span>+{change.percent_change}% increase</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2. Step-by-Step Dependency Cascade Flow */}
          <div className="card p-5 bg-white border border-city-border space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-city-black">
              Cascading Dependency Chain
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              {simResult.cascade && simResult.cascade.map((step) => (
                <div
                  key={step.step}
                  className="p-3 bg-beige-100 rounded-lg border border-city-border flex flex-col justify-between"
                >
                  <div>
                    <span className="text-[10px] font-bold uppercase text-city-muted">
                      Step 0{step.step}
                    </span>
                    <h4 className="text-xs font-bold text-city-black mt-1">{step.effect}</h4>
                    <p className="text-[11px] text-city-muted mt-1 leading-tight">{step.cause}</p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-city-border flex justify-between items-center text-xs">
                    <span className="text-city-muted">Magnitude</span>
                    <strong className="text-city-black">{step.magnitude}</strong>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 3. Recommended Actions & One-Click OR-Tools Replanning */}
          <div className="card p-5 bg-white border border-city-border space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-city-black">
                  Recommended Mitigations & OR-Tools Re-plan
                </h2>
                <p className="text-xs text-city-muted">
                  Automated constraint re-balancing to resolve weather-induced dining & corridor bottlenecks.
                </p>
              </div>

              <div className="flex flex-col items-end gap-2">
                {replanError && (
                  <div className="flex items-center gap-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                    <AlertTriangle size={13} className="shrink-0" />
                    <span>{replanError}</span>
                    <button onClick={() => setReplanError(null)} className="text-red-500 hover:text-red-700 ml-1">✕</button>
                  </div>
                )}
                <button
                  onClick={handleReplan}
                  disabled={replanning}
                  className="btn-primary text-xs flex items-center gap-2 py-2 px-4 shadow-sm"
                >
                  <FileCheck size={14} />
                  {replanning ? 'Running OR-Tools Optimization...' : 'Apply Weather Re-Plan'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {simResult.recommendations && simResult.recommendations.map((rec) => (
                <div
                  key={rec.id}
                  className="p-4 bg-beige-100 rounded-xl border border-city-border space-y-2 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex justify-between items-center">
                      <h4 className="font-bold text-xs text-city-black">{rec.title}</h4>
                      <span className="badge badge-yellow text-[9px]">{rec.priority}</span>
                    </div>
                    <p className="text-xs font-semibold text-city-charcoal mt-1">{rec.action}</p>
                    <p className="text-[11px] text-city-muted mt-1 italic">"{rec.why}"</p>
                  </div>
                  <div className="pt-2 border-t border-city-border text-[11px] text-green-700 font-medium">
                    Expected: {rec.impact}
                  </div>
                </div>
              ))}
            </div>

            {/* Replan Result Banner if executed */}
            {replanResult && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-xl space-y-3 fade-in mt-4">
                <div className="flex items-center gap-2 text-green-900 font-bold text-sm">
                  <CheckCircle2 size={16} className="text-green-600" />
                  <span>
                    Plan Version {replanResult.plan_version} Generated & Applied Successfully!
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-green-950">
                  <div className="space-y-1">
                    <span className="font-bold uppercase tracking-wider text-[10px]">
                      Operational Changes Enacted:
                    </span>
                    <ul className="list-disc pl-4 space-y-1">
                      {replanResult.changes && replanResult.changes.map((ch, idx) => (
                        <li key={idx}>{ch}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-1">
                    <span className="font-bold uppercase tracking-wider text-[10px]">
                      Stabilized Outcome:
                    </span>
                    <div className="p-2 bg-white rounded border border-green-200 space-y-1">
                      <div>
                        Cafeteria Load: <strong>{replanResult.expected_result?.cafeteria_occupancy} pax ({replanResult.expected_result?.cafeteria_capacity_ratio})</strong>
                      </div>
                      <div>
                        Transit Delay Avoided: <strong>~{replanResult.expected_result?.delay_saved_minutes} mins saved</strong>
                      </div>
                      <div>
                        Status: <strong className="text-green-700">{replanResult.expected_result?.status}</strong>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
