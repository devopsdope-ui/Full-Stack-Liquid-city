import React, { useEffect, useState } from 'react';
import type { OperationalPlan } from '../../types';
import { EmptyState } from '../../components/ui/EmptyState';
import { Users, AlertCircle } from 'lucide-react';
import { CrowdStatusBadge } from '../../components/ui/ProgressBar';

export default function OrganizerAllocationsPage() {
  const [plan, setPlan] = useState<OperationalPlan | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('latest_plan');
    if (saved) {
      try {
        setPlan(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse saved plan');
      }
    }
  }, []);

  if (!plan) {
    return (
      <EmptyState 
        title="No Active Allocations"
        message="You haven't generated a plan yet. Go to the Setup page to create a new event plan."
        actionLabel="Create Event"
        onAction={() => window.location.href = '/organizer/setup'}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="section-title">Team & Zone Allocations</h1>
        <p className="text-gray-600">Active staffing and zone management directives based on your latest plan.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2"><Users className="w-5 h-5" /> Zone Directives</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {plan.zone_congestion?.map((zone, i) => (
              <div key={i} className="card">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-bold text-lg">{zone.zone}</h3>
                    <p className="text-sm text-gray-500">{zone.activity || 'General Use'}</p>
                  </div>
                  <CrowdStatusBadge status={
                    zone.status === 'CRITICAL' ? 'red' : 
                    zone.status === 'HIGH' ? 'red' : 
                    zone.status === 'MODERATE' ? 'yellow' : 'green'
                  } />
                </div>
                
                <div className="mb-2">
                  <div className="flex justify-between text-xs mb-1">
                    <span>Expected Load</span>
                    <span className="font-medium">{zone.expected_attendance} pax / {zone.capacity} cap</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${zone.projected_occupancy_percentage && zone.projected_occupancy_percentage > 90 ? 'bg-red-500' : 'bg-city-charcoal'}`}
                      style={{ width: `${Math.min(100, zone.projected_occupancy_percentage || 0)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="card bg-beige-100">
            <h2 className="text-lg font-bold mb-4">Gate Staffing</h2>
            <div className="space-y-3">
              {plan.gate_allocation?.map((gate, i) => (
                <div key={i} className="flex justify-between items-center bg-white p-3 rounded border border-city-border">
                  <span className="font-semibold">{gate.name}</span>
                  <div className="text-right">
                    <span className="badge badge-gray">{gate.share_percentage}% allocation</span>
                    <p className="text-xs text-gray-500 mt-1">{gate.expected_attendance} expected</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {plan.resource_demand && plan.resource_demand.length > 0 && (
            <div className="card">
              <h2 className="text-lg font-bold mb-4">Resource Needs</h2>
              <ul className="space-y-2">
                {plan.resource_demand.map((res, i) => (
                  <li key={i} className="text-sm pb-2 border-b border-gray-100 last:border-0 last:pb-0">
                    <span className="font-semibold capitalize">{res.resource}:</span> {res.estimated_demand}
                    {res.note && <p className="text-xs text-gray-500 mt-1">{res.note}</p>}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
