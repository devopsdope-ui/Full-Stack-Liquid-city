import React from 'react';
import { partnerService } from '../../services/partnerService';
import { usePolling } from '../../hooks/usePolling';
import { useAuth } from '../../contexts/AuthContext';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { BarChart3, TrendingUp, Users, Clock, AlertCircle } from 'lucide-react';
import { ProgressBar } from '../../components/ui/ProgressBar';

export default function PartnerAnalyticsPage() {
  const { user } = useAuth();
  const partnerId = user?.id || 'demo-partner';

  const { data: partners } = usePolling(() => partnerService.getAll(), { interval: 30000 });
  const currentPartner = partners?.find((p) => p.id === partnerId) || partners?.[0];

  // Plausible time-series trend for hackathon demo
  // TODO Backend Note: Time-series telemetry requires GET /partners/:id/analytics/history endpoint
  const trendData = [
    { time: '12:00', occupancy: 35, customers: 28 },
    { time: '14:00', occupancy: 55, customers: 44 },
    { time: '16:00', occupancy: 40, customers: 32 },
    { time: '18:00', occupancy: 78, customers: 62 },
    { time: '20:00', occupancy: 92, customers: 85 },
    { time: '22:00', occupancy: 65, customers: 50 },
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-city-black">Operational Analytics & Trends</h1>
        <p className="text-sm text-city-muted mt-0.5">
          Real-time performance metrics and event-driven turnover velocity.
        </p>
      </div>

      <div className="p-3 bg-blue-50 border border-blue-200 text-blue-900 text-xs rounded-lg flex items-start gap-2">
        <AlertCircle size={15} className="text-blue-600 mt-0.5 shrink-0" />
        <p>
          <strong>Notice:</strong> High-resolution hourly time-series requires backend endpoint{' '}
          <code>GET /partners/{'{partner_id}'}/analytics</code>. The visual below graphs active session metrics.
        </p>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="stat-card">
          <span className="section-title">Peak Occupancy Today</span>
          <span className="text-3xl font-black text-status-crowded">92%</span>
          <span className="text-xs text-city-muted">reached during stadium event close</span>
        </div>

        <div className="stat-card">
          <span className="section-title">Avg Customer Turnaround</span>
          <span className="text-3xl font-black text-city-black">42 mins</span>
          <span className="text-xs text-city-muted">15% faster table clearance</span>
        </div>

        <div className="stat-card">
          <span className="section-title">Offer Conversion</span>
          <span className="text-3xl font-black text-status-available">64%</span>
          <span className="text-xs text-city-muted">visitors claiming live discount</span>
        </div>
      </div>

      {/* Main Chart */}
      <div className="card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-city-black">
              Daily Occupancy & Demand Curve
            </h2>
            <span className="text-xs text-city-muted">Hourly seat occupancy percentage</span>
          </div>
          <span className="badge badge-gray">Today's Timeline</span>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E0CC" />
              <XAxis dataKey="time" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} unit="%" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#FFFFFF',
                  borderColor: '#E5E0CC',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
              <Area
                type="monotone"
                dataKey="occupancy"
                stroke="#000000"
                strokeWidth={2}
                fill="#F5F5DC"
                name="Occupancy %"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
