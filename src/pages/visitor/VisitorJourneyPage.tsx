import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navigation, Route, MapPin, Clock, ArrowRight, CheckCircle2, ShieldAlert } from 'lucide-react';
import { ProgressBar } from '../../components/ui/ProgressBar';

export default function VisitorJourneyPage() {
  const navigate = useNavigate();
  const [destination, setDestination] = useState('Central Stadium - Gate 2');
  const [selectedRoute, setSelectedRoute] = useState<'A' | 'B'>('B');

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-city-black">My Event Journey</h1>
        <p className="text-sm text-city-muted mt-1">
          Smart multimodal itinerary with real-time crowd avoidance recommendations.
        </p>
      </div>

      <div className="card p-6 border-city-border space-y-4">
        <h2 className="section-title">Active Destination</h2>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-city-muted" />
            <input
              type="text"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="Enter destination e.g. Hotel, Stadium, Metro"
              className="input pl-9 text-sm"
            />
          </div>
          <button
            onClick={() => navigate('/visitor/map')}
            className="btn-secondary text-xs flex items-center justify-center gap-1.5"
          >
            <Navigation size={14} />
            Pick on Map
          </button>
        </div>

        {/* Route Comparison Options */}
        <div className="pt-4 border-t border-city-border space-y-3">
          <div className="text-xs font-bold text-city-muted uppercase tracking-wider">
            Compare Live Routes:
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Route A */}
            <div
              onClick={() => setSelectedRoute('A')}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                selectedRoute === 'A'
                  ? 'border-city-black bg-beige-100 shadow-sm'
                  : 'border-city-border bg-white hover:border-city-dark'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <span className="font-bold text-base text-city-black">Route A (Direct Avenue)</span>
                <span className="badge badge-red">High Congestion</span>
              </div>
              <div className="text-xs text-city-muted mb-2">4.2 km • Est. 26 mins</div>
              <div className="space-y-1 text-xs text-city-charcoal">
                <div className="flex justify-between">
                  <span>Crowd Level:</span>
                  <span className="font-bold text-status-crowded">82%</span>
                </div>
                <ProgressBar value={82} />
              </div>
            </div>

            {/* Route B */}
            <div
              onClick={() => setSelectedRoute('B')}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all relative ${
                selectedRoute === 'B'
                  ? 'border-city-black bg-beige-100 shadow-sm'
                  : 'border-city-border bg-white hover:border-city-dark'
              }`}
            >
              <div className="absolute -top-2.5 right-3 bg-status-available text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                Recommended
              </div>
              <div className="flex justify-between items-start mb-2">
                <span className="font-bold text-base text-city-black">Route B (Ring Byway)</span>
                <span className="badge badge-green">Smooth Flow</span>
              </div>
              <div className="text-xs text-city-muted mb-2">4.8 km • Est. 14 mins</div>
              <div className="space-y-1 text-xs text-city-charcoal">
                <div className="flex justify-between">
                  <span>Crowd Level:</span>
                  <span className="font-bold text-status-available">28%</span>
                </div>
                <ProgressBar value={28} />
              </div>
            </div>
          </div>
        </div>

        {/* Action button */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-city-muted">
            <CheckCircle2 size={16} className="text-status-available shrink-0" />
            <span>Route B avoids 2 stadium bottleneck bottlenecks, saving approx. 12 mins.</span>
          </div>

          <button
            onClick={() => {
              const query = encodeURIComponent(destination);
              window.open(`https://www.google.com/maps/dir/?api=1&destination=${query}`, '_blank');
            }}
            className="btn-primary w-full sm:w-auto text-sm px-6 py-2.5 flex items-center justify-center gap-2 shadow-sm"
          >
            <Navigation size={16} />
            Start Turn-by-Turn Navigation
          </button>
        </div>
      </div>
    </div>
  );
}
