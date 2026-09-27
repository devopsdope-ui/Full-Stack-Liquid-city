import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CityMap, MapMarkerData, getUserLocation } from '../../maps/CityMap';
import { partnerService } from '../../services/partnerService';
import { crowdService } from '../../services/crowdService';
import { eventService } from '../../services/eventService';
import { usePolling } from '../../hooks/usePolling';
import { CardSkeleton } from '../../components/ui/Skeleton';
import { CrowdStatusBadge } from '../../components/ui/ProgressBar';
import { Utensils, Hotel, Truck, Route, Calendar, Users, Navigation, ExternalLink, Clock, Tag } from 'lucide-react';
import type { Partner, Crowd, Event } from '../../types';

type FilterTab = 'all' | 'restaurants' | 'hotels' | 'transport' | 'events' | 'crowd';

export default function VisitorDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [selectedMarker, setSelectedMarker] = useState<MapMarkerData | null>(null);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);

  // Poll partners, crowd, events
  const { data: partners, loading: partnersLoading } = usePolling(() => partnerService.getAll(), { interval: 25000 });
  const { data: crowds, loading: crowdsLoading } = usePolling(() => crowdService.getAll(), { interval: 20000 });
  const { data: events, loading: eventsLoading } = usePolling(() => eventService.getAll(), { interval: 30000 });

  useEffect(() => {
    getUserLocation()
      .then((coords) => setUserCoords({ lat: coords.latitude, lng: coords.longitude }))
      .catch(() => {
        // Fallback to default city center (e.g. Bangalore center)
        setUserCoords({ lat: 12.9716, lng: 77.5946 });
      });
  }, []);

  // Assemble markers based on active tab
  const markers: MapMarkerData[] = [];

  // User location marker
  if (userCoords) {
    markers.push({
      id: 'user-loc',
      lat: userCoords.lat,
      lng: userCoords.lng,
      title: 'Your Location',
      type: 'user',
    });
  }

  // Base coordinates mapping for realistic map demo
  const baseLat = userCoords?.lat || 12.9716;
  const baseLng = userCoords?.lng || 77.5946;

  if (partners && (activeTab === 'all' || activeTab === 'restaurants' || activeTab === 'hotels' || activeTab === 'transport')) {
    partners.forEach((p, idx) => {
      if (activeTab === 'restaurants' && p.type !== 'restaurant') return;
      if (activeTab === 'hotels' && p.type !== 'hotel') return;
      if (activeTab === 'transport' && p.type !== 'shuttle' && p.type !== 'parking' && p.type !== 'transport') return;

      const offsetLat = ((idx % 5) - 2) * 0.008 + 0.003;
      const offsetLng = (Math.floor(idx / 5) - 1) * 0.009 - 0.002;

      markers.push({
        id: `partner-${p.id}`,
        lat: baseLat + offsetLat,
        lng: baseLng + offsetLng,
        title: p.name,
        status: p.occupancy >= 85 ? 'HIGH' : p.occupancy >= 60 ? 'MODERATE' : 'NORMAL',
        type: p.type === 'restaurant' ? 'restaurant' : p.type === 'hotel' ? 'hotel' : 'transport',
      });
    });
  }

  if (crowds && (activeTab === 'all' || activeTab === 'crowd')) {
    crowds.forEach((c, idx) => {
      const offsetLat = ((idx % 4) - 1.5) * 0.012;
      const offsetLng = ((idx % 3) - 1) * 0.014 + 0.005;

      markers.push({
        id: `crowd-${c.location_id}`,
        lat: baseLat + offsetLat,
        lng: baseLng + offsetLng,
        title: `${c.name} (${c.occupancy}% Occupancy)`,
        status: c.status,
        type: 'crowd',
      });
    });
  }

  if (events && (activeTab === 'all' || activeTab === 'events')) {
    events.forEach((e, idx) => {
      const offsetLat = 0.006 * (idx + 1);
      const offsetLng = -0.005 * (idx + 1);

      markers.push({
        id: `event-${e.id}`,
        lat: baseLat + offsetLat,
        lng: baseLng + offsetLng,
        title: e.name,
        status: e.status === 'ongoing' ? 'HIGH' : 'NORMAL',
        type: 'event',
      });
    });
  }

  return (
    <div className="flex flex-col h-full relative">
      {/* Top Filter Bar */}
      <div className="p-4 bg-white/80 backdrop-blur border-b border-city-border flex items-center justify-between gap-3 overflow-x-auto z-10">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-city-muted mr-1">View:</span>
          {[
            { id: 'all', label: 'All', icon: Navigation },
            { id: 'restaurants', label: 'Restaurants', icon: Utensils },
            { id: 'hotels', label: 'Hotels', icon: Hotel },
            { id: 'transport', label: 'Transport', icon: Truck },
            { id: 'events', label: 'Events', icon: Calendar },
            { id: 'crowd', label: 'Crowd Heat', icon: Users },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id as FilterTab); setSelectedMarker(null); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                  active
                    ? 'bg-city-black text-white shadow-sm'
                    : 'bg-beige-100 text-city-charcoal hover:bg-beige-200 border border-city-border'
                }`}
              >
                <Icon size={14} />
                {tab.label}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => navigate('/visitor/journey')}
          className="btn-primary text-xs whitespace-nowrap flex items-center gap-1.5"
        >
          <Route size={14} />
          Plan Journey
        </button>
      </div>

      {/* Main Map View */}
      <div className="flex-1 relative overflow-hidden">
        <CityMap
          center={userCoords || { lat: 12.9716, lng: 77.5946 }}
          zoom={14}
          markers={markers}
          onMarkerClick={(m) => setSelectedMarker(m)}
          showTraffic={true}
        />

        {/* Floating Side Info Panel when a marker is clicked */}
        {selectedMarker && selectedMarker.type !== 'user' && (
          <div className="absolute bottom-6 left-6 right-6 sm:right-auto sm:w-80 card p-4 shadow-panel bg-white/95 backdrop-blur z-20 fade-in border-city-border">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-city-muted">
                  {selectedMarker.type?.toUpperCase()}
                </span>
                <h3 className="font-bold text-city-black text-base">{selectedMarker.title}</h3>
              </div>
              <button
                onClick={() => setSelectedMarker(null)}
                className="text-city-muted hover:text-city-black p-1 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {selectedMarker.status && (
              <div className="flex items-center gap-2 mb-3">
                <CrowdStatusBadge status={selectedMarker.status} />
                <span className="text-xs text-city-muted">
                  {selectedMarker.status === 'NORMAL' ? 'Available / Low Crowd' : selectedMarker.status === 'MODERATE' ? 'Moderate Waiting' : 'Crowded'}
                </span>
              </div>
            )}

            <div className="space-y-1.5 text-xs text-city-charcoal mb-4 bg-beige-100 p-2.5 rounded-lg border border-city-border">
              <div className="flex items-center gap-2">
                <Clock size={13} className="text-city-muted" />
                <span>Est. Wait / Delay: <strong>{selectedMarker.status === 'HIGH' ? '25 mins' : '5-10 mins'}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <Tag size={13} className="text-city-muted" />
                <span>Live Offer: <strong>₹200 OFF on ₹600+</strong></span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => navigate('/visitor/routes')}
                className="btn-primary text-xs flex-1 flex items-center justify-center gap-1.5"
              >
                <Route size={13} />
                Get Route
              </button>
              <button
                onClick={() => {
                  if (selectedMarker.type === 'restaurant') navigate('/visitor/restaurants');
                  else if (selectedMarker.type === 'hotel') navigate('/visitor/hotels');
                  else navigate('/visitor/journey');
                }}
                className="btn-secondary text-xs flex items-center justify-center gap-1"
              >
                <ExternalLink size={13} />
                Details
              </button>
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur border border-city-border rounded-lg p-2.5 text-[11px] shadow-sm hidden md:flex flex-col gap-1.5 z-10">
          <div className="font-bold text-city-black uppercase tracking-wider text-[9px] mb-0.5">Live Status</div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-status-available"></span>
            <span>Available / Free Flow</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-status-moderate"></span>
            <span>Moderate Wait</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-status-crowded"></span>
            <span>Crowded / Congested</span>
          </div>
        </div>
      </div>
    </div>
  );
}
