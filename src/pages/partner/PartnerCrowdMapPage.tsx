import React, { useState } from 'react';
import { crowdService } from '../../services/crowdService';
import { roadService } from '../../services/roadService';
import { usePolling } from '../../hooks/usePolling';
import { CityMap, MapMarkerData } from '../../maps/CityMap';
import { CrowdStatusBadge, ProgressBar } from '../../components/ui/ProgressBar';
import { CardSkeleton } from '../../components/ui/Skeleton';
import { Users, AlertTriangle, Activity, Navigation, RefreshCw } from 'lucide-react';
import type { Crowd, Road } from '../../types';

export default function PartnerCrowdMapPage() {
  const { data: crowds, loading: crowdLoading, refetch } = usePolling(() => crowdService.getAll(), { interval: 20000 });
  const { data: roads } = usePolling(() => roadService.getAll(), { interval: 25000 });

  const [selectedCrowd, setSelectedCrowd] = useState<Crowd | null>(null);

  const baseLat = 12.9716;
  const baseLng = 77.5946;

  const markers: MapMarkerData[] = (crowds || []).map((c, idx) => ({
    id: c.location_id,
    lat: baseLat + ((idx % 3) - 1) * 0.012,
    lng: baseLng + ((idx % 2) - 0.5) * 0.015,
    title: `${c.name} (${c.occupancy}%)`,
    status: c.status,
    type: 'crowd',
  }));

  return (
    <div className="flex flex-col lg:flex-row h-full">
      {/* Map Left View */}
      <div className="flex-1 relative min-h-[400px]">
        <CityMap
          center={{ lat: baseLat, lng: baseLng }}
          zoom={14}
          markers={markers}
          onMarkerClick={(m) => {
            const found = crowds?.find((c) => c.location_id === m.id);
            if (found) setSelectedCrowd(found);
          }}
          showTraffic={true}
        />

        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur border border-city-border rounded-lg p-2.5 shadow-sm text-xs z-10 flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-status-crowded animate-ping"></span>
          <span className="font-bold text-city-black">Live Crowd Telemetry Feed</span>
          <button onClick={refetch} className="p-1 hover:bg-beige-100 rounded">
            <RefreshCw size={12} className="text-city-muted" />
          </button>
        </div>
      </div>

      {/* Side Panel: Hotspots & Road Delays */}
      <div className="w-full lg:w-96 bg-white border-l border-city-border p-5 overflow-y-auto space-y-6">
        <div>
          <h2 className="text-base font-bold text-city-black">Venue Crowd Hotspots</h2>
          <p className="text-xs text-city-muted">Surge monitoring for customer influx preparation</p>
        </div>

        {selectedCrowd && (
          <div className="card p-4 border-2 border-city-black fade-in space-y-2">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-bold uppercase text-city-muted">Selected Hotspot</span>
                <h3 className="font-bold text-sm text-city-black">{selectedCrowd.name}</h3>
              </div>
              <CrowdStatusBadge status={selectedCrowd.status} />
            </div>

            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-city-muted">Occupancy:</span>
                <span className="font-bold">{selectedCrowd.occupancy}%</span>
              </div>
              <ProgressBar value={selectedCrowd.occupancy} />
              <div className="flex justify-between pt-1">
                <span className="text-city-muted">Capacity limit:</span>
                <span className="font-semibold">{selectedCrowd.capacity.toLocaleString()} people</span>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-city-muted">
            All Monitored Zones
          </h3>

          {crowdLoading ? (
            <div className="space-y-2">
              <CardSkeleton />
              <CardSkeleton />
            </div>
          ) : !crowds || crowds.length === 0 ? (
            <p className="text-xs text-city-muted py-3">No crowd records.</p>
          ) : (
            <div className="space-y-2">
              {crowds.map((c) => (
                <div
                  key={c.location_id}
                  onClick={() => setSelectedCrowd(c)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    selectedCrowd?.location_id === c.location_id
                      ? 'border-city-black bg-beige-100 shadow-sm'
                      : 'border-city-border bg-white hover:bg-beige-50'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-xs text-city-black">{c.name}</span>
                    <CrowdStatusBadge status={c.status} />
                  </div>
                  <ProgressBar value={c.occupancy} className="h-1.5" />
                  <div className="flex justify-between text-[11px] text-city-muted mt-1">
                    <span>{c.occupancy}% full</span>
                    <span>Max {c.capacity}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Road Congestion */}
        {roads && roads.length > 0 && (
          <div className="space-y-3 pt-3 border-t border-city-border">
            <h3 className="text-xs font-bold uppercase tracking-wider text-city-muted">
              Nearby Road Congestion
            </h3>
            <div className="space-y-2">
              {roads.slice(0, 3).map((r) => (
                <div key={r.road_id} className="p-2.5 bg-beige-100 rounded-lg border border-city-border text-xs flex justify-between items-center">
                  <div>
                    <div className="font-semibold text-city-black">{r.name}</div>
                    <div className="text-[11px] text-city-muted">Avg {r.average_speed} km/h</div>
                  </div>
                  <span className={`badge ${r.congestion >= 70 ? 'badge-red' : r.congestion >= 40 ? 'badge-yellow' : 'badge-green'}`}>
                    {Math.round(r.congestion)}% delay
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
