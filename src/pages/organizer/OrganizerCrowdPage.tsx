import React, { useState } from 'react';
import { useCrowd } from '../../hooks/useDomain';
import { crowdService } from '../../services/crowdService';
import { RefreshCw, TrendingUp, AlertTriangle } from 'lucide-react';
import { CardSkeleton } from '../../components/ui/Skeleton';
import { ErrorState } from '../../components/ui/ErrorState';
import { CrowdStatusBadge, ProgressBar } from '../../components/ui/ProgressBar';
import type { CrowdPrediction } from '../../types';

export default function OrganizerCrowdPage() {
  const { data: crowds, loading, error, refetch } = useCrowd();
  const [predictions, setPredictions] = useState<Record<string, CrowdPrediction>>({});
  const [loadingPreds, setLoadingPreds] = useState<Record<string, boolean>>({});

  const handlePredict = async (locationId: string) => {
    setLoadingPreds(prev => ({ ...prev, [locationId]: true }));
    try {
      const pred = await crowdService.predict(locationId);
      setPredictions(prev => ({ ...prev, [locationId]: pred }));
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingPreds(prev => ({ ...prev, [locationId]: false }));
    }
  };

  if (error) return <ErrorState error={error} onRetry={refetch} />;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold text-city-black">Live Venue Crowd Intelligence</h1>
          <p className="text-sm text-city-muted">15-minute and 30-minute AI surge predictions per venue zone.</p>
        </div>
        <button
          onClick={refetch}
          className="btn-secondary text-xs flex items-center gap-1.5"
        >
          <RefreshCw size={13} />
          Poll Telemetry
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : !crowds || crowds.length === 0 ? (
        <div className="card p-6 text-center text-city-muted text-sm">
          No crowd sensors reporting data.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {crowds.map((loc) => {
            const pred = predictions[loc.location_id];
            const isPredicting = loadingPreds[loc.location_id];

            return (
              <div key={loc.location_id} className="card p-5 space-y-3 border-city-border">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-base text-city-black">{loc.name}</h3>
                    <div className="text-xs text-city-muted">
                      Current: {Math.round((loc.occupancy / 100) * loc.capacity)} / {loc.capacity} people
                    </div>
                  </div>
                  <CrowdStatusBadge status={loc.status} />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-city-muted">Capacity Occupancy:</span>
                    <span className="font-bold text-city-black">{loc.occupancy}%</span>
                  </div>
                  <ProgressBar value={loc.occupancy} />
                </div>

                {/* Predictions View */}
                {pred ? (
                  <div className="p-3 bg-beige-100 rounded-lg border border-city-border text-xs space-y-2 fade-in">
                    <div className="flex justify-between items-center font-bold text-city-black">
                      <span>Predicted Trajectory</span>
                      <span className={`badge ${pred.risk === 'HIGH' ? 'badge-red' : 'badge-yellow'}`}>
                        {pred.risk} Risk
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-center pt-1">
                      <div className="p-2 bg-white rounded border border-city-border">
                        <div className="text-[10px] text-city-muted uppercase">In 15 Mins</div>
                        <div className="text-base font-bold text-city-black">{Math.round(pred.predicted_15_min)}%</div>
                      </div>
                      <div className="p-2 bg-white rounded border border-city-border">
                        <div className="text-[10px] text-city-muted uppercase">In 30 Mins</div>
                        <div className="text-base font-bold text-city-black">{Math.round(pred.predicted_30_min)}%</div>
                      </div>
                    </div>

                    {pred.reasons && pred.reasons.length > 0 && (
                      <div className="text-[11px] text-city-muted italic pt-1">
                        Driver: {pred.reasons.join(', ')}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={() => handlePredict(loc.location_id)}
                      disabled={isPredicting}
                      className="btn-secondary text-xs flex items-center gap-1.5"
                    >
                      <TrendingUp size={13} />
                      {isPredicting ? 'Forecasting...' : 'Forecast Crowd'}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
