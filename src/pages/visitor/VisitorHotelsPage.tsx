import React from 'react';
import { useNavigate } from 'react-router-dom';
import { partnerService } from '../../services/partnerService';
import { usePolling } from '../../hooks/usePolling';
import { CardSkeleton } from '../../components/ui/Skeleton';
import { ErrorState } from '../../components/ui/ErrorState';
import { EmptyState } from '../../components/ui/EmptyState';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { Hotel, Star, Clock, Tag, MapPin, Navigation, ShieldCheck } from 'lucide-react';
import type { Partner } from '../../types';

export default function VisitorHotelsPage() {
  const navigate = useNavigate();

  // Poll hotel partners
  const { data: hotels, loading, error } = usePolling(
    () => partnerService.getAll().then((list) => list.filter((p) => p.type === 'hotel')),
    { interval: 30000 }
  );

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-city-black">Hotel Partner Accommodations</h1>
        <p className="text-sm text-city-muted mt-1">
          Real-time room occupancy, event-proximity crowd conditions, and reserved partner rates.
        </p>
      </div>

      {error && <ErrorState error={error} />}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : !hotels || hotels.length === 0 ? (
        <EmptyState
          message="No partner hotels available"
          description="Check back soon as venue partner hotels register their rooms."
          icon={<Hotel size={24} className="text-city-muted" />}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {hotels.map((hotel) => {
            const availableRooms = Math.max(
              0,
              Math.round(hotel.capacity * (1 - hotel.occupancy / 100))
            );
            const isFull = hotel.occupancy >= 90;
            const isModerate = hotel.occupancy >= 60 && hotel.occupancy < 90;

            return (
              <div key={hotel.id} className="card p-5 flex flex-col justify-between hover:shadow-panel transition-all">
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-bold text-city-black text-lg">{hotel.name}</h3>
                        {hotel.verified && <ShieldCheck size={15} className="text-blue-600" />}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-status-moderate font-semibold mt-0.5">
                        <Star size={12} className="fill-current" />
                        <span>{hotel.rating?.toFixed(1) || '4.5'}</span>
                        <span className="text-city-muted ml-1">• 1.4 km to venue</span>
                      </div>
                    </div>
                    <span
                      className={`badge ${
                        isFull ? 'badge-red' : isModerate ? 'badge-yellow' : 'badge-green'
                      }`}
                    >
                      {isFull ? 'Almost Booked' : isModerate ? 'Moderate' : 'Rooms Open'}
                    </span>
                  </div>

                  {/* Room stats */}
                  <div className="bg-beige-100 p-3 rounded-lg border border-city-border my-3 space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-city-muted">Available rooms:</span>
                      <span className="font-bold text-city-black">
                        {availableRooms} / {hotel.capacity}
                      </span>
                    </div>
                    <ProgressBar value={hotel.occupancy} />
                    <div className="flex justify-between items-center pt-1 text-city-charcoal">
                      <span>Crowd around hotel:</span>
                      <span className="font-semibold text-green-700">LOW</span>
                    </div>
                  </div>

                  {hotel.offer > 0 && (
                    <div className="flex items-center gap-1.5 text-xs text-city-black font-semibold bg-beige-200 px-2.5 py-1.5 rounded-md border border-city-border mb-3">
                      <Tag size={13} />
                      <span>₹{hotel.offer} Instant Booking Discount</span>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-city-border flex items-center gap-2">
                  <button
                    onClick={() => navigate('/visitor/journey')}
                    className="btn-primary text-xs flex-1 flex items-center justify-center gap-1.5"
                  >
                    <Navigation size={13} />
                    Plan Route
                  </button>
                  <a
                    href="tel:+918000000000"
                    className="btn-secondary text-xs"
                  >
                    Contact
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
