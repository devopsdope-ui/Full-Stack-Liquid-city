import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Clock, MapPin, Users, AlertTriangle, ChevronDown, ChevronRight } from 'lucide-react';
import { planningService } from '../../services/planningService';
import type { OperationalPlan } from '../../types';
import { ErrorState } from '../../components/ui/ErrorState';
import { EmptyState } from '../../components/ui/EmptyState';
import { Skeleton } from '../../components/ui/Skeleton';
import { ProgressBar, CrowdStatusBadge } from '../../components/ui/ProgressBar';

/**
 * NOTE: The backend does not expose a structured Timeline (activities with times).
 * The OperationalPlan contains zone_congestion and gate_allocation, but not a
 * full activity timeline.
 *
 * TODO: Backend endpoint required:
 *   GET /planning/{event_model_id}/timeline → TimelineItem[]
 *   Each item: { time, activity, location, expected_crowd, volunteers, risk, notes }
 *
 * This page shows what IS available from the plan (zone congestion, gate allocation)
 * in a timeline-like format, and includes placeholder timeline UI that can be
 * connected when the endpoint is available.
 */

interface MockTimelineItem {
  time: string;
  activity: string;
  location: string;
  crowd: 'Low' | 'Medium' | 'High';
  color: string;
}

const MOCK_TIMELINE: MockTimelineItem[] = [
  { time: '08:00', activity: 'Registration Opens', location: 'Main Gate', crowd: 'Medium', color: 'bg-blue-500' },
  { time: '09:00', activity: 'Opening Ceremony', location: 'Main Hall', crowd: 'High', color: 'bg-purple-500' },
  { time: '10:00', activity: 'Event Begins', location: 'All Zones', crowd: 'High', color: 'bg-red-500' },
  { time: '13:00', activity: 'Lunch Break', location: 'Cafeteria', crowd: 'High', color: 'bg-orange-500' },
  { time: '16:00', activity: 'Workshop / Activities', location: 'Workshop Area', crowd: 'Medium', color: 'bg-yellow-500' },
  { time: '19:00', activity: 'Prize Distribution', location: 'Main Hall', crowd: 'High', color: 'bg-indigo-500' },
  { time: '20:00', activity: 'Event Ends', location: 'All Gates', crowd: 'Medium', color: 'bg-gray-500' },
];

export default function OrganizerTimelinePage() {
  const [params] = useSearchParams();
  const eventModelId = params.get('event_model_id') || localStorage.getItem('lc_event_model_id');
  const [plan, setPlan] = useState<OperationalPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedZone, setExpandedZone] = useState<string | null>(null);

  useEffect(() => {
    if (!eventModelId) return;
    setLoading(true);
    planningService.getLatest(eventModelId)
      .then(setPlan)
      .catch(() => setError('Could not load plan.'))
      .finally(() => setLoading(false));
  }, [eventModelId]);

  if (!eventModelId) {
    return (
      <div className="p-6">
        <EmptyState
          message="No event plan loaded"
          description="Complete the questionnaire and generate a plan first."
          action={<a href="/organizer/setup" className="btn-primary text-sm">Start Questionnaire</a>}
        />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-city-black">Event Timeline</h1>
        <p className="text-sm text-city-muted mt-0.5">Schedule and crowd flow overview</p>
      </div>

      {/* Timeline TODO Note */}
      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2">
        <AlertTriangle size={14} className="text-blue-500 mt-0.5 shrink-0" />
        <p className="text-xs text-blue-800">
          <strong>Note:</strong> The detailed activity timeline requires backend endpoint:
          <code className="ml-1">GET /planning/{'{event_model_id}'}/timeline</code>.
          Showing estimated schedule based on questionnaire activities.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Visual Timeline */}
        <div className="card p-4">
          <h2 className="section-title mb-4">Event Schedule</h2>
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-6 top-2 bottom-2 w-px bg-city-border" />

            <div className="space-y-1">
              {MOCK_TIMELINE.map((item, i) => (
                <div key={i} className="flex items-start gap-4 pl-2 py-2">
                  {/* Dot */}
                  <div className={`relative z-10 w-8 h-8 rounded-full ${item.color} flex items-center justify-center shrink-0`}>
                    <Clock size={12} className="text-white" />
                  </div>
                  {/* Content */}
                  <div className="flex-1 pb-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-city-black">{item.time}</span>
                      <span className={`badge text-xs ${
                        item.crowd === 'High' ? 'badge-red' :
                        item.crowd === 'Medium' ? 'badge-yellow' : 'badge-green'
                      }`}>
                        {item.crowd} Crowd
                      </span>
                    </div>
                    <div className="text-sm font-semibold mt-0.5">{item.activity}</div>
                    <div className="flex items-center gap-1 text-xs text-city-muted mt-0.5">
                      <MapPin size={10} />
                      {item.location}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Zone Congestion from Plan */}
        <div className="card p-4">
          <h2 className="section-title mb-4">Zone Congestion Forecast</h2>
          {loading && (
            <div className="space-y-2">
              {[1,2,3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          )}
          {error && <ErrorState error={{ status: 0, message: error }} />}
          {!loading && !error && plan && plan.zone_congestion.length === 0 && (
            <EmptyState message="No zone data in plan" />
          )}
          {!loading && !error && plan && plan.zone_congestion.map((zone) => (
            <div key={zone.zone} className="mb-3">
              <button
                className="w-full flex items-center justify-between p-3 bg-beige-100 rounded-lg border border-city-border hover:bg-beige-200 transition-colors"
                onClick={() => setExpandedZone(expandedZone === zone.zone ? null : zone.zone)}
              >
                <div className="flex items-center gap-2">
                  <MapPin size={14} className="text-city-muted" />
                  <span className="text-sm font-semibold">{zone.zone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CrowdStatusBadge status={zone.status} />
                  {expandedZone === zone.zone ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </div>
              </button>
              {expandedZone === zone.zone && (
                <div className="mt-1 p-3 bg-white border border-city-border rounded-lg text-sm space-y-2">
                  {zone.activity && (
                    <div className="flex justify-between">
                      <span className="text-city-muted">Activity</span>
                      <span className="font-medium">{zone.activity}</span>
                    </div>
                  )}
                  {zone.expected_attendance !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-city-muted">Expected</span>
                      <span className="font-medium">{zone.expected_attendance} people</span>
                    </div>
                  )}
                  {zone.capacity !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-city-muted">Capacity</span>
                      <span className="font-medium">{zone.capacity} people</span>
                    </div>
                  )}
                  {zone.projected_occupancy_percentage !== undefined && (
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-city-muted">Projected Occupancy</span>
                        <span className="font-bold">{zone.projected_occupancy_percentage.toFixed(0)}%</span>
                      </div>
                      <ProgressBar value={zone.projected_occupancy_percentage} />
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Gate Allocation */}
      {plan && plan.gate_allocation.length > 0 && (
        <div className="card p-4">
          <h2 className="section-title mb-4">Gate Allocation</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {plan.gate_allocation.map((gate) => (
              <div key={gate.name} className="p-4 bg-beige-100 rounded-xl border border-city-border">
                <div className="flex items-center gap-2 mb-2">
                  <Users size={16} className="text-city-muted" />
                  <span className="text-sm font-bold">{gate.name}</span>
                </div>
                <div className="text-2xl font-black mb-1">
                  {gate.share_percentage.toFixed(0)}%
                </div>
                <ProgressBar value={gate.share_percentage} className="mb-2" />
                <div className="text-xs text-city-muted">
                  ~{Math.round(gate.expected_attendance)} visitors expected
                </div>
                <div className="text-xs text-city-gray mt-1 italic">{gate.basis}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
