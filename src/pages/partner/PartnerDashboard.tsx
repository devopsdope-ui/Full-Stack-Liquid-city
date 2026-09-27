import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { partnerService } from '../../services/partnerService';
import { crowdService } from '../../services/crowdService';
import { usePolling } from '../../hooks/usePolling';
import { StatCardSkeleton, CardSkeleton } from '../../components/ui/Skeleton';
import { ProgressBar, CrowdStatusBadge } from '../../components/ui/ProgressBar';
import { Utensils, Hotel, Truck, Users, Calendar, ArrowRight, ShieldCheck, Tag, Plus } from 'lucide-react';

export default function PartnerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const partnerType = user?.partnerType || 'restaurant';

  const { data: partners, loading: partnersLoading } = usePolling(() => partnerService.getAll(), { interval: 25000 });
  const { data: crowds, loading: crowdsLoading } = usePolling(() => crowdService.getAll(), { interval: 20000 });

  // Current partner record (or first matching type)
  const currentPartner = partners?.find((p) => p.type === partnerType) || partners?.[0];

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="badge badge-gray capitalize font-bold text-[11px]">{partnerType} Partner</span>
            <span className="badge badge-green flex items-center gap-1">
              <ShieldCheck size={12} /> Verified
            </span>
          </div>
          <h1 className="text-2xl font-bold text-city-black mt-1">
            {currentPartner?.name || `${user?.name || 'Partner'} Business Portal`}
          </h1>
          <p className="text-sm text-city-muted">
            Live availability controls, queue management, and real-time crowd alerts.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => navigate('/partner/availability')}
            className="btn-primary text-xs flex items-center gap-1.5"
          >
            <Calendar size={14} />
            Manage {partnerType === 'hotel' ? 'Rooms' : partnerType === 'transport' ? 'Fleet' : 'Tables'}
          </button>
          <button
            onClick={() => navigate('/partner/offers')}
            className="btn-secondary text-xs flex items-center gap-1.5"
          >
            <Tag size={14} />
            Live Offers
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {partnersLoading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <div className="stat-card">
              <span className="section-title">Current Occupancy</span>
              <span className="text-3xl font-black text-city-black">
                {Math.round(currentPartner?.occupancy || 65)}%
              </span>
              <ProgressBar value={currentPartner?.occupancy || 65} className="mt-1" />
            </div>

            <div className="stat-card">
              <span className="section-title">Available Capacity</span>
              <span className="text-3xl font-black text-status-available">
                {Math.round((currentPartner?.capacity || 100) * (1 - (currentPartner?.occupancy || 65) / 100))}
              </span>
              <span className="text-xs text-city-muted">out of {currentPartner?.capacity || 100} total</span>
            </div>

            <div className="stat-card">
              <span className="section-title">Avg Waiting Time</span>
              <span className="text-3xl font-black text-status-moderate">
                {Math.round(currentPartner?.waiting_time || 12)}m
              </span>
              <span className="text-xs text-city-muted">based on queue flow</span>
            </div>

            <div className="stat-card">
              <span className="section-title">Partner Rating</span>
              <span className="text-3xl font-black text-city-black">
                ★ {currentPartner?.rating?.toFixed(1) || '4.6'}
              </span>
              <span className="text-xs text-city-muted">from verified visitors</span>
            </div>
          </>
        )}
      </div>

      {/* Two Column Layout: Partner Actions & Nearby Crowd Intelligence */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Operations Card */}
        <div className="card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-city-black">
              {partnerType === 'hotel' ? 'Room Status Overview' : partnerType === 'transport' ? 'Fleet Readiness' : 'Live Table Status'}
            </h2>
            <button
              onClick={() => navigate('/partner/availability')}
              className="text-xs font-semibold text-city-muted hover:text-city-black flex items-center gap-1"
            >
              Open Floor Plan <ArrowRight size={13} />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="text-2xl font-bold text-green-700">8</div>
              <div className="text-xs font-semibold text-green-800">Available</div>
            </div>
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="text-2xl font-bold text-red-700">12</div>
              <div className="text-xs font-semibold text-red-800">Occupied</div>
            </div>
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="text-2xl font-bold text-yellow-700">2</div>
              <div className="text-xs font-semibold text-yellow-800">Reserved</div>
            </div>
          </div>

          <div className="p-3 bg-beige-100 rounded-lg border border-city-border flex items-center justify-between text-xs">
            <div>
              <span className="font-bold text-city-black">Waiting Customer Queue:</span>
              <span className="ml-1 text-city-muted">2 parties waiting (~14 mins total)</span>
            </div>
            <button
              onClick={() => navigate('/partner/availability')}
              className="btn-primary text-[11px] py-1 px-2.5"
            >
              Assign Table
            </button>
          </div>
        </div>

        {/* Live Crowd Intelligence Nearby */}
        <div className="card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users size={16} className="text-city-black" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-city-black">
                Nearby Event Crowd Surges
              </h2>
            </div>
            <button
              onClick={() => navigate('/partner/crowd-map')}
              className="text-xs font-semibold text-city-muted hover:text-city-black flex items-center gap-1"
            >
              Full Map <ArrowRight size={13} />
            </button>
          </div>

          {crowdsLoading ? (
            <CardSkeleton />
          ) : !crowds || crowds.length === 0 ? (
            <p className="text-xs text-city-muted py-4">No live crowd telemetry at this moment.</p>
          ) : (
            <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
              {crowds.slice(0, 4).map((c) => (
                <div key={c.location_id} className="p-2.5 bg-beige-100 rounded-lg border border-city-border flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-xs text-city-black">{c.name}</h4>
                    <span className="text-[11px] text-city-muted">{c.occupancy}% capacity reached</span>
                  </div>
                  <CrowdStatusBadge status={c.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
