import React, { useState } from 'react';
import { routeService } from '../../services/routeService';
import { usePolling } from '../../hooks/usePolling';
import { CityMap } from '../../maps/CityMap';
import { CardSkeleton } from '../../components/ui/Skeleton';
import { ErrorState } from '../../components/ui/ErrorState';
import { EmptyState } from '../../components/ui/EmptyState';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { Route as RouteIcon, Navigation, Clock, Activity, AlertTriangle, ArrowRight } from 'lucide-react';
import type { RouteOption, RoutePredictionRequest, RoutePredictionResponse } from '../../types';

export default function VisitorRoutesPage() {
  const { data: routes, loading, error } = usePolling(() => routeService.getAll(), { interval: 20000 });

  // Custom route prediction state
  const [customDistance, setCustomDistance] = useState(4.5);
  const [customSpeed, setCustomSpeed] = useState(30);
  const [customCongestion, setCustomCongestion] = useState(40);
  const [predictResult, setPredictResult] = useState<RoutePredictionResponse | null>(null);
  const [predicting, setPredicting] = useState(false);

  const handlePredict = async (e: React.FormEvent) => {
    e.preventDefault();
    setPredicting(true);
    try {
      const normalTime = (customDistance / customSpeed) * 60;
      const res = await routeService.predict({
        distance_km: customDistance,
        normal_travel_time: normalTime,
        congestion: customCongestion,
        average_speed: customSpeed,
      });
      setPredictResult(res);
    } catch (err) {
      console.error('Failed to predict route:', err);
    } finally {
      setPredicting(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-city-black">Route & Traffic Intelligence</h1>
        <p className="text-sm text-city-muted mt-1">
          Crowd-aware routing minimizing transit bottlenecks and delay around event zones.
        </p>
      </div>

      {error && <ErrorState error={error} />}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Routes List */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-city-muted">
            Live Available Routes
          </h2>

          {loading ? (
            <div className="space-y-3">
              <CardSkeleton />
              <CardSkeleton />
            </div>
          ) : !routes || routes.length === 0 ? (
            <EmptyState
              message="No route data available"
              description="Routes will appear once traffic simulators are running."
              icon={<RouteIcon size={24} className="text-city-muted" />}
            />
          ) : (
            <div className="space-y-4">
              {routes.map((rt, idx) => {
                const isHeavy = rt.congestion >= 70;
                const isModerate = rt.congestion >= 40 && rt.congestion < 70;

                return (
                  <div key={rt.route_id} className="card p-5 border-city-border hover:shadow-panel transition-all">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold px-2 py-0.5 rounded bg-beige-200 text-city-black">
                            {idx === 0 ? 'RECOMMENDED' : `ALTERNATIVE ${idx}`}
                          </span>
                          <h3 className="font-bold text-lg text-city-black">{rt.name}</h3>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-city-muted mt-1">
                          <span>{rt.distance_km.toFixed(1)} km</span>
                          <span>•</span>
                          <span className="flex items-center gap-1 font-semibold text-city-charcoal">
                            <Clock size={12} /> {Math.round(rt.predicted_travel_time)} mins
                          </span>
                        </div>
                      </div>

                      <span
                        className={`badge self-start sm:self-center ${
                          isHeavy ? 'badge-red' : isModerate ? 'badge-yellow' : 'badge-green'
                        }`}
                      >
                        {isHeavy ? 'Heavy Congestion' : isModerate ? 'Moderate Flow' : 'Clear / Fast'}
                      </span>
                    </div>

                    <div className="bg-beige-100 p-3 rounded-lg border border-city-border space-y-1.5 text-xs mb-3">
                      <div className="flex justify-between">
                        <span className="text-city-muted">Traffic Congestion Index:</span>
                        <span className="font-bold text-city-black">{Math.round(rt.congestion)}%</span>
                      </div>
                      <ProgressBar value={rt.congestion} />
                    </div>

                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => {
                          const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                            rt.name
                          )}`;
                          window.open(url, '_blank');
                        }}
                        className="btn-primary text-xs flex items-center gap-1.5"
                      >
                        <Navigation size={13} />
                        Start Navigation
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: AI Travel Time Calculator */}
        <div className="space-y-4">
          <div className="card p-5">
            <h2 className="section-title mb-3">Predict Custom Travel Time</h2>
            <p className="text-xs text-city-muted mb-4">
              Uses the Liquid City ML model to calculate delay considering venue attendance & congestion.
            </p>

            <form onSubmit={handlePredict} className="space-y-3">
              <div>
                <label className="label">Distance (km): {customDistance}</label>
                <input
                  type="range"
                  min="0.5"
                  max="25"
                  step="0.5"
                  value={customDistance}
                  onChange={(e) => setCustomDistance(parseFloat(e.target.value))}
                  className="w-full accent-city-black"
                />
              </div>

              <div>
                <label className="label">Avg Speed (km/h): {customSpeed}</label>
                <input
                  type="range"
                  min="10"
                  max="80"
                  step="5"
                  value={customSpeed}
                  onChange={(e) => setCustomSpeed(parseFloat(e.target.value))}
                  className="w-full accent-city-black"
                />
              </div>

              <div>
                <label className="label">Road Congestion (%): {customCongestion}</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={customCongestion}
                  onChange={(e) => setCustomCongestion(parseFloat(e.target.value))}
                  className="w-full accent-city-black"
                />
              </div>

              <button
                type="submit"
                disabled={predicting}
                className="btn-primary w-full text-xs mt-2"
              >
                {predicting ? 'Calculating...' : 'Run Travel Prediction'}
              </button>
            </form>

            {predictResult && (
              <div className="mt-4 p-3 bg-beige-100 rounded-lg border border-city-border space-y-1.5 text-xs fade-in">
                <div className="font-bold text-city-black text-sm">Prediction Result</div>
                <div className="flex justify-between">
                  <span className="text-city-muted">Estimated Duration:</span>
                  <span className="font-bold text-city-black">
                    {Math.round(predictResult.predicted_travel_time)} mins
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-city-muted">Simulated Congestion:</span>
                  <span className="font-semibold text-city-charcoal">
                    {Math.round(predictResult.congestion)}%
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
