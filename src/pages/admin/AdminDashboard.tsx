import React from 'react';
import { CardSkeleton, StatCardSkeleton, TableSkeleton } from '../../components/ui/Skeleton';
import { ErrorState } from '../../components/ui/ErrorState';
import { EmptyState } from '../../components/ui/EmptyState';
import { ProgressBar, CrowdStatusBadge } from '../../components/ui/ProgressBar';
import { CityMap, MapMarkerData } from '../../maps/CityMap';
import { usePolling } from '../../hooks/usePolling';
import { eventService, crowdService, partnerService, adminSimulationService } from '../../services/api';
import { Users, Calendar, Activity, Cpu } from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const fetchDashboardData = async () => {
    const [events, crowds, partners, simStatus] = await Promise.all([
      eventService.getAll(),
      crowdService.getAll(),
      partnerService.getAll(),
      adminSimulationService.getStatus()
    ]);
    return { events, crowds, partners, simStatus };
  };

  const { data, loading, error } = usePolling(fetchDashboardData, { interval: 30000 });

  if (error) return <ErrorState error={error} />;

  const markers: MapMarkerData[] = [];
  const baseLat = 12.9716;
  const baseLng = 77.5946;

  if (data?.crowds) {
    data.crowds.forEach((c, idx) => {
      markers.push({
        id: c.location_id,
        lat: baseLat + ((idx % 4) - 1.5) * 0.012,
        lng: baseLng + ((idx % 3) - 1) * 0.014,
        title: `${c.name} (${c.occupancy}%)`,
        status: c.status,
        type: 'crowd',
      });
    });
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-city-black">Admin Global Command Dashboard</h1>
          <p className="text-sm text-city-muted">City-wide system overview, simulation orchestration, and infrastructure monitoring.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {loading && !data ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <div className="stat-card">
              <div className="flex items-center gap-2 mb-2 text-city-charcoal">
                <Calendar className="w-5 h-5" />
                <h3 className="font-semibold text-xs text-city-muted uppercase tracking-wider">Total Events</h3>
              </div>
              <p className="text-3xl font-bold">{data?.events.length || 0}</p>
            </div>

            <div className="stat-card">
              <div className="flex items-center gap-2 mb-2 text-city-charcoal">
                <Users className="w-5 h-5" />
                <h3 className="font-semibold text-xs text-city-muted uppercase tracking-wider">Crowd Hotspots</h3>
              </div>
              <p className="text-3xl font-bold">
                {data?.crowds.filter(c => c.status === 'HIGH' || c.status === 'CRITICAL' || c.status === 'MODERATE').length || 0}
              </p>
            </div>

            <div className="stat-card">
              <div className="flex items-center gap-2 mb-2 text-city-charcoal">
                <Activity className="w-5 h-5" />
                <h3 className="font-semibold text-xs text-city-muted uppercase tracking-wider">Active Partners</h3>
              </div>
              <p className="text-3xl font-bold">{data?.partners.length || 0}</p>
            </div>

            <div className="stat-card">
              <div className="flex items-center gap-2 mb-2 text-city-charcoal">
                <Cpu className="w-5 h-5" />
                <h3 className="font-semibold text-xs text-city-muted uppercase tracking-wider">Sim Engine</h3>
              </div>
              <p className="text-xl font-bold">
                {data?.simStatus?.simulation_running ? (
                  <span className="badge badge-green">RUNNING</span>
                ) : (
                  <span className="badge badge-gray">STOPPED</span>
                )}
              </p>
            </div>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card p-5 bg-white space-y-3">
          <h2 className="text-base font-bold text-city-black">Integrated City Digital Map</h2>
          <div className="h-[420px] w-full rounded-xl overflow-hidden border border-city-border">
             {loading && !data ? (
               <div className="w-full h-full skeleton"></div>
             ) : (
               <CityMap 
                 center={{ lat: baseLat, lng: baseLng }}
                 zoom={13}
                 markers={markers}
                 showTraffic={true}
               />
             )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-5 bg-white space-y-3">
            <h2 className="text-base font-bold text-city-black">Crowd Telemetry</h2>
            {loading && !data ? (
              <TableSkeleton />
            ) : data?.crowds.length === 0 ? (
              <EmptyState message="No crowd data" />
            ) : (
              <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                {data?.crowds.slice(0, 5).map(c => (
                  <div key={c.location_id} className="p-2.5 bg-beige-100 rounded-lg border border-city-border space-y-1">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-semibold text-city-black">{c.name}</span>
                      <CrowdStatusBadge status={c.status} />
                    </div>
                    <ProgressBar value={c.occupancy} />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card p-5 bg-white space-y-3">
            <h2 className="text-base font-bold text-city-black">Registered Events</h2>
            {loading && !data ? (
              <TableSkeleton />
            ) : data?.events.length === 0 ? (
              <EmptyState message="No upcoming events" />
            ) : (
              <ul className="space-y-2 max-h-52 overflow-y-auto pr-1">
                {data?.events.slice(0, 5).map(e => (
                  <li key={e.id} className="flex justify-between items-center text-xs p-2.5 bg-beige-100 rounded-lg border border-city-border">
                    <div>
                      <p className="font-bold text-city-black">{e.name}</p>
                      <p className="text-[11px] text-gray-500">{e.location}</p>
                    </div>
                    <span className="badge badge-gray capitalize">{e.status}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
