import React, { useState } from 'react';
import { crowdService } from '../../services/api';
import { usePolling } from '../../hooks/usePolling';
import { TableSkeleton } from '../../components/ui/Skeleton';
import { ErrorState } from '../../components/ui/ErrorState';
import { EmptyState } from '../../components/ui/EmptyState';
import { ProgressBar, CrowdStatusBadge } from '../../components/ui/ProgressBar';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import type { CrowdPrediction } from '../../types';

export const AdminCrowdPage: React.FC = () => {
  const { data: crowds, loading, error } = usePolling(crowdService.getAll, { interval: 20000 });
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [prediction, setPrediction] = useState<CrowdPrediction | null>(null);
  const [loadingPred, setLoadingPred] = useState(false);

  const handleRowClick = async (locationId: string) => {
    if (expandedId === locationId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(locationId);
    setLoadingPred(true);
    try {
      const pred = await crowdService.predict(locationId);
      setPrediction(pred);
    } catch {
      setPrediction(null);
    } finally {
      setLoadingPred(false);
    }
  };

  const chartData = crowds?.map(c => ({
    name: c.name,
    occupancy: c.occupancy,
  })) || [];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-city-black">Admin Crowd Intelligence & Predictions</h1>
        <p className="text-sm text-city-muted">Real-time zone occupancy tracking, capacity saturation, and AI flow forecasting.</p>
      </div>

      {error && <ErrorState error={error} />}

      {/* Chart Section */}
      <div className="card p-5 bg-white space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-city-muted">Occupancy Distribution Across Monitored Venues</h2>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E0CC" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis unit="%" tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="occupancy" fill="#000000" name="Occupancy %" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Table Section */}
      <div className="card p-5 bg-white space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-city-muted">Monitored Zones & Prediction Insights</h2>
        {loading && !crowds ? (
          <TableSkeleton rows={5} />
        ) : !crowds || crowds.length === 0 ? (
          <EmptyState message="No crowd monitoring zones registered." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-city-border bg-beige-100 text-city-charcoal">
                  <th className="p-3">Location / Zone</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Current Saturation</th>
                  <th className="p-3">Capacity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-city-border">
                {crowds.map((c) => (
                  <React.Fragment key={c.location_id}>
                    <tr 
                      className="hover:bg-beige-50 cursor-pointer transition-colors"
                      onClick={() => handleRowClick(c.location_id)}
                    >
                      <td className="p-3 font-semibold text-city-black">
                        <div>{c.name}</div>
                        <div className="text-[10px] text-city-muted">{c.location_id}</div>
                      </td>
                      <td className="p-3">
                        <CrowdStatusBadge status={c.status} />
                      </td>
                      <td className="p-3 w-52">
                        <ProgressBar value={c.occupancy} />
                        <div className="text-[11px] font-semibold text-city-muted mt-1">{c.occupancy}% occupied</div>
                      </td>
                      <td className="p-3 font-medium text-city-charcoal">{c.capacity.toLocaleString()}</td>
                    </tr>
                    {expandedId === c.location_id && (
                      <tr className="bg-beige-100/70">
                        <td colSpan={4} className="p-4">
                          <h4 className="font-bold text-xs uppercase tracking-wider text-city-black mb-2">AI Crowd Prediction & Trajectory</h4>
                          {loadingPred ? (
                            <div className="skeleton h-16 w-full"></div>
                          ) : prediction ? (
                            <div className="space-y-3 bg-white p-3.5 rounded-lg border border-city-border">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                  <div className="flex justify-between text-xs text-city-muted">
                                    <span>Forecasted (15 mins):</span>
                                    <span className="font-bold text-city-black">{Math.round(prediction.predicted_15_min)}%</span>
                                  </div>
                                  <ProgressBar value={prediction.predicted_15_min} />
                                </div>
                                <div className="space-y-1">
                                  <div className="flex justify-between text-xs text-city-muted">
                                    <span>Forecasted (30 mins):</span>
                                    <span className="font-bold text-city-black">{Math.round(prediction.predicted_30_min)}%</span>
                                  </div>
                                  <ProgressBar value={prediction.predicted_30_min} />
                                </div>
                              </div>
                              <div className="flex items-center gap-2 pt-1 text-xs">
                                <span className="font-bold">Risk Assessment:</span>
                                <span className={`badge ${prediction.risk === 'HIGH' ? 'badge-red' : 'badge-yellow'}`}>
                                  {prediction.risk}
                                </span>
                              </div>
                              {prediction.reasons && prediction.reasons.length > 0 && (
                                <div className="text-xs text-city-muted">
                                  <span className="font-semibold text-city-charcoal">Identified Corridors: </span>
                                  <span>{prediction.reasons.join('; ')}</span>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="text-xs text-red-500">Could not load prediction model outputs.</div>
                          )}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminCrowdPage;
