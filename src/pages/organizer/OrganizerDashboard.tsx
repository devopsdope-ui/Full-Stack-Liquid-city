import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useEvents, useCrowd } from '../../hooks/useDomain';
import { Plus, Users, Calendar as CalendarIcon, Activity, AlertTriangle } from 'lucide-react';
import { CardSkeleton, StatCardSkeleton } from '../../components/ui/Skeleton';
import { ErrorState } from '../../components/ui/ErrorState';
import { CrowdStatusBadge } from '../../components/ui/ProgressBar';

export default function OrganizerDashboard() {
  const navigate = useNavigate();
  const { data: events, loading: eventsLoading, error: eventsError } = useEvents();
  const { data: crowds, loading: crowdLoading, error: crowdError } = useCrowd();

  const totalCrowd = crowds?.reduce((sum, c) => sum + Math.round((c.occupancy / 100) * c.capacity), 0) || 0;
  const activeEvents = events?.filter(e => e.status === 'ongoing' || e.status === 'scheduled') || [];
  const systemStatus = 'Platform Operational';

  if (eventsError || crowdError) {
    return <ErrorState error={eventsError || crowdError} />;
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-city-black">Organizer Command Center</h1>
          <p className="text-sm text-city-muted">Plan, allocate, and monitor live venue crowds and resources.</p>
        </div>
        <button
          onClick={() => navigate('/organizer/setup')}
          className="btn-primary flex items-center gap-2 text-xs"
        >
          <Plus className="w-4 h-4" />
          Organize New Event
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {eventsLoading || crowdLoading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <div className="stat-card">
              <div className="flex items-center gap-3 mb-2">
                <CalendarIcon className="w-5 h-5 text-gray-500" />
                <h3 className="font-semibold text-gray-700">Scheduled / Active Events</h3>
              </div>
              <p className="text-3xl font-bold">{activeEvents.length}</p>
            </div>
            <div className="stat-card">
              <div className="flex items-center gap-3 mb-2">
                <Users className="w-5 h-5 text-gray-500" />
                <h3 className="font-semibold text-gray-700">Total Monitored Crowd</h3>
              </div>
              <p className="text-3xl font-bold">{totalCrowd.toLocaleString()}</p>
            </div>
            <div className="stat-card">
              <div className="flex items-center gap-3 mb-2">
                <Activity className="w-5 h-5 text-gray-500" />
                <h3 className="font-semibold text-gray-700">AI Engine Status</h3>
              </div>
              <p className="text-lg font-medium text-green-600">{systemStatus}</p>
            </div>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <h2 className="text-base font-bold mb-4 text-city-black">Registered Events</h2>
          {eventsLoading ? (
            <CardSkeleton />
          ) : !events || events.length === 0 ? (
            <p className="text-gray-500 py-4 text-sm">No events found. Start by organizing one.</p>
          ) : (
            <div className="space-y-3">
              {events.slice(0, 5).map(event => (
                <div key={event.id} className="flex justify-between items-center p-3 bg-beige-100 rounded-lg border border-city-border">
                  <div>
                    <h4 className="font-semibold text-sm">{event.name}</h4>
                    <p className="text-xs text-gray-600">{event.location} • {event.expected_attendance.toLocaleString()} attendees</p>
                  </div>
                  <span className={`badge ${event.status === 'ongoing' ? 'badge-green' : 'badge-gray'}`}>
                    {event.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card p-5">
          <h2 className="text-base font-bold mb-4 text-city-black">Venue Crowd Telemetry</h2>
          {crowdLoading ? (
            <CardSkeleton />
          ) : !crowds || crowds.length === 0 ? (
            <p className="text-gray-500 py-4 text-sm">No crowd data available.</p>
          ) : (
            <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
              {crowds.map(loc => (
                <div key={loc.location_id} className="flex justify-between items-center p-3 border-b border-city-border last:border-0">
                  <div className="flex-1">
                    <h4 className="font-semibold text-xs text-city-black">{loc.name}</h4>
                    <div className="text-[11px] text-gray-500">
                      {Math.round((loc.occupancy / 100) * loc.capacity)} / {loc.capacity} people ({loc.occupancy}%)
                    </div>
                  </div>
                  <CrowdStatusBadge status={loc.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
