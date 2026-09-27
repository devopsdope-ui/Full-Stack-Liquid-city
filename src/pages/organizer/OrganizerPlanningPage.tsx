import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { planningService } from '../../services/planningService';
import type { OperationalPlan } from '../../types';
import { CheckCircle2, Loader2, AlertTriangle, Download, Info } from 'lucide-react';
import { CrowdStatusBadge } from '../../components/ui/ProgressBar';

const STEPS = [
  'Understanding event...',
  'Analyzing venue...',
  'Analyzing participants...',
  'Building timeline...',
  'Checking capacity...',
  'Generating event plan...'
];

export default function OrganizerPlanningPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const eventModelId = searchParams.get('event_model_id');

  const [animating, setAnimating] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [plan, setPlan] = useState<OperationalPlan | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!eventModelId) {
      setError('No event model ID provided');
      setAnimating(false);
      return;
    }

    let interval: ReturnType<typeof setInterval>;
    let stepCount = 0;

    interval = setInterval(() => {
      stepCount++;
      setCurrentStep(s => (s < STEPS.length - 1 ? s + 1 : s));
    }, 400);

    planningService.generate(eventModelId)
      .then(data => {
        setPlan(data);
        localStorage.setItem('latest_plan', JSON.stringify(data));
        setTimeout(() => {
          clearInterval(interval);
          setAnimating(false);
        }, 1200);
      })
      .catch(err => {
        clearInterval(interval);
        setError(err.message || 'Plan generation failed');
        setAnimating(false);
      });

    return () => clearInterval(interval);
  }, [eventModelId]);

  if (animating) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8">
        <Loader2 className="w-16 h-16 animate-spin text-city-charcoal" />
        <div className="space-y-4 w-full max-w-md">
          {STEPS.map((step, idx) => (
            <div key={step} className={`flex items-center gap-3 transition-opacity duration-300 ${idx > currentStep ? 'opacity-30' : 'opacity-100'}`}>
              {idx < currentStep ? (
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              ) : idx === currentStep ? (
                <Loader2 className="w-5 h-5 animate-spin text-city-charcoal" />
              ) : (
                <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
              )}
              <span className={idx === currentStep ? 'font-semibold' : ''}>{step}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="p-4 bg-red-50 text-red-700 rounded-lg">{error}</div>;
  }

  if (!plan) return null;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="section-title">Operational Plan Generated</h1>
        <div className="flex gap-3">
          <button className="btn-secondary flex items-center gap-2" onClick={() => {
            const blob = new Blob([JSON.stringify(plan, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'operational-plan.json';
            a.click();
          }}>
            <Download size={16} /> Export JSON
          </button>
          <button className="btn-primary" onClick={() => navigate('/organizer/allocations')}>
            View Allocations
          </button>
        </div>
      </div>

      {plan.warnings && plan.warnings.length > 0 && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg space-y-2">
          <div className="flex items-center gap-2 text-yellow-800 font-semibold">
            <AlertTriangle size={18} />
            <span>Plan Warnings</span>
          </div>
          <ul className="list-disc pl-5 text-sm text-yellow-700 space-y-1">
            {plan.warnings.map((w, i) => <li key={i}>{w}</li>)}
          </ul>
        </div>
      )}

      {/* Gates */}
      <div className="card p-5 space-y-4">
        <h2 className="text-lg font-bold">Gate Allocations</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {plan.gate_allocation.map(gate => (
            <div key={gate.name} className="p-4 bg-beige-100 rounded-lg border border-city-border space-y-2">
              <div className="flex justify-between items-start">
                <span className="font-semibold text-lg">{gate.name}</span>
                <span className="text-xl font-bold">{gate.share_percentage}%</span>
              </div>
              <p className="text-sm text-city-muted">Expected: {gate.expected_attendance} people</p>
              <p className="text-xs text-city-muted italic">{gate.basis}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Congestion */}
      <div className="card p-5 space-y-4">
        <h2 className="text-lg font-bold">Zone Congestion Estimates</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {plan.zone_congestion.map(zone => (
            <div key={zone.zone} className="p-4 bg-beige-100 rounded-lg border border-city-border space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-semibold">{zone.zone}</span>
                <CrowdStatusBadge status={zone.status} />
              </div>
              {zone.activity && <p className="text-xs text-city-muted">Activity: {zone.activity}</p>}
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Occupancy:</span>
                  <span className="font-semibold">{zone.projected_occupancy_percentage || 0}%</span>
                </div>
                <div className="flex justify-between text-xs text-city-muted">
                  <span>Expected: {zone.expected_attendance || 'N/A'}</span>
                  <span>Capacity: {zone.capacity || 'N/A'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottlenecks */}
      {plan.bottlenecks && plan.bottlenecks.length > 0 && (
        <div className="card p-5 space-y-4">
          <h2 className="text-lg font-bold">Identified Bottlenecks</h2>
          <div className="space-y-2">
            {plan.bottlenecks.map((b, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
                <div>
                  <span className="font-semibold text-red-900">{b.zone_or_gate}</span>
                  <p className="text-sm text-red-700">{b.reason}</p>
                </div>
                <span className="badge badge-red">{b.severity}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
