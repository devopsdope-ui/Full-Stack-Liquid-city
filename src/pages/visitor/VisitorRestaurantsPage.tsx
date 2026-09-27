import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { partnerService } from '../../services/partnerService';
import { recommendationService } from '../../services/recommendationService';
import { usePolling } from '../../hooks/usePolling';
import { CardSkeleton } from '../../components/ui/Skeleton';
import { ErrorState } from '../../components/ui/ErrorState';
import { EmptyState } from '../../components/ui/EmptyState';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { Utensils, Star, Clock, Tag, MapPin, Check, Sparkles, Filter } from 'lucide-react';
import type { Recommendation, Partner } from '../../types';

export default function VisitorRestaurantsPage() {
  const navigate = useNavigate();
  const [pref, setPref] = useState<'balanced' | 'low_crowd' | 'fastest' | 'cheapest'>('balanced');
  const [recList, setRecList] = useState<Recommendation[] | null>(null);
  const [recLoading, setRecLoading] = useState(false);
  const [choiceSubmitted, setChoiceSubmitted] = useState<string | null>(null);

  // Poll all restaurants from partnerService
  const { data: partners, loading: partnersLoading, error } = usePolling(
    () => partnerService.getAll().then((list) => list.filter((p) => p.type === 'restaurant')),
    { interval: 25000 }
  );

  const handleGetRecommendations = async () => {
    setRecLoading(true);
    try {
      const recs = await recommendationService.postRestaurants({
        visitor_preference: pref,
      });
      setRecList(recs);
    } catch (err) {
      console.error('Error fetching recommendations:', err);
    } finally {
      setRecLoading(false);
    }
  };

  const handleSelectChoice = async (id: string, name: string) => {
    try {
      await recommendationService.submitChoice({ chosen_id: id });
      setChoiceSubmitted(`Choice recorded: ${name}! Route updated.`);
      setTimeout(() => setChoiceSubmitted(null), 4000);
    } catch (err) {
      console.error('Error recording choice:', err);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-city-black">Restaurant Intelligence & Availability</h1>
          <p className="text-sm text-city-muted mt-1">
            Real-time table occupancies, AI crowd-balanced recommendations, and active offers.
          </p>
        </div>

        {/* Preference Selector & Recommend Button */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 bg-white border border-city-border p-1 rounded-lg">
            {(['balanced', 'low_crowd', 'fastest', 'cheapest'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setPref(mode)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md capitalize transition-colors ${
                  pref === mode ? 'bg-city-black text-white' : 'text-city-muted hover:text-city-charcoal'
                }`}
              >
                {mode.replace('_', ' ')}
              </button>
            ))}
          </div>

          <button
            onClick={handleGetRecommendations}
            disabled={recLoading}
            className="btn-primary text-xs flex items-center gap-1.5"
          >
            <Sparkles size={14} />
            {recLoading ? 'Ranking...' : 'Get AI Recommendation'}
          </button>
        </div>
      </div>

      {choiceSubmitted && (
        <div className="p-3 bg-green-50 border border-green-200 text-green-800 text-sm rounded-lg flex items-center gap-2 fade-in">
          <Check size={16} className="text-green-600" />
          <span>{choiceSubmitted}</span>
        </div>
      )}

      {/* AI Recommended Section */}
      {recList && recList.length > 0 && (
        <div className="space-y-3 bg-beige-100 p-5 rounded-xl border border-city-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="text-status-moderate w-4 h-4" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-city-black">
                Personalized Recommendation ({pref})
              </h2>
            </div>
            <button
              onClick={() => setRecList(null)}
              className="text-xs text-city-muted hover:text-city-black underline"
            >
              Clear
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recList.map((rec, idx) => (
              <div
                key={rec.id}
                className={`card p-4 flex flex-col justify-between border-2 transition-all ${
                  idx === 0 ? 'border-status-available shadow-md' : 'border-city-border'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-city-black text-white">
                      Rank #{idx + 1}
                    </span>
                    <span className="text-xs font-bold text-city-charcoal">
                      Score: {rec.score?.toFixed(1) || '9.4'}
                    </span>
                  </div>
                  <h3 className="font-bold text-base text-city-black">{rec.name}</h3>
                  <p className="text-xs text-city-muted italic mt-0.5 mb-2">"{rec.reason}"</p>

                  <div className="space-y-1.5 text-xs text-city-charcoal">
                    <div className="flex justify-between">
                      <span className="text-city-muted">Occupancy</span>
                      <span className="font-semibold">{Math.round(rec.occupancy)}%</span>
                    </div>
                    <ProgressBar value={rec.occupancy} />
                    <div className="flex justify-between pt-1">
                      <span className="text-city-muted">Wait time:</span>
                      <span className="font-semibold">{Math.round(rec.waiting_time)} mins</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-city-muted">Distance:</span>
                      <span className="font-semibold">{rec.distance?.toFixed(1)} km</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-city-border flex gap-2">
                  <button
                    onClick={() => handleSelectChoice(rec.id, rec.name)}
                    className="btn-primary text-xs flex-1"
                  >
                    I Want This
                  </button>
                  <button
                    onClick={() => navigate('/visitor/routes')}
                    className="btn-secondary text-xs"
                  >
                    Route
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Restaurant Directory */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-city-muted">
          All Participating Restaurants
        </h2>

        {error && <ErrorState error={error} />}

        {partnersLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
        ) : !partners || partners.length === 0 ? (
          <EmptyState
            message="No restaurants currently available"
            description="Restaurants will appear here once partners update their live tables."
            icon={<Utensils size={24} className="text-city-muted" />}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {partners.map((restaurant) => {
              const availableSeats = Math.max(
                0,
                Math.round(restaurant.capacity * (1 - restaurant.occupancy / 100))
              );
              const isCrowded = restaurant.occupancy >= 85;
              const isModerate = restaurant.occupancy >= 60 && restaurant.occupancy < 85;

              return (
                <div key={restaurant.id} className="card p-5 flex flex-col justify-between hover:shadow-panel transition-all">
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <h3 className="font-bold text-city-black text-lg">{restaurant.name}</h3>
                        <div className="flex items-center gap-1 text-xs text-status-moderate font-semibold mt-0.5">
                          <Star size={12} className="fill-current" />
                          <span>{restaurant.rating?.toFixed(1) || '4.2'}</span>
                          <span className="text-city-muted ml-1">• 0.8 km away</span>
                        </div>
                      </div>
                      <span
                        className={`badge ${
                          isCrowded ? 'badge-red' : isModerate ? 'badge-yellow' : 'badge-green'
                        }`}
                      >
                        {isCrowded ? 'Crowded' : isModerate ? 'Moderate' : 'Available'}
                      </span>
                    </div>

                    {/* Table availability stats */}
                    <div className="bg-beige-100 p-3 rounded-lg border border-city-border my-3 space-y-1.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-city-muted">Available capacity:</span>
                        <span className="font-bold text-city-black">
                          {availableSeats} / {restaurant.capacity} seats
                        </span>
                      </div>
                      <ProgressBar value={restaurant.occupancy} />
                      <div className="flex justify-between items-center pt-1">
                        <span className="flex items-center gap-1 text-city-muted">
                          <Clock size={12} /> Waiting time:
                        </span>
                        <span className="font-semibold text-city-black">
                          {restaurant.waiting_time > 0 ? `${restaurant.waiting_time} mins` : 'Immediate seating'}
                        </span>
                      </div>
                    </div>

                    {/* Offer badge */}
                    {restaurant.offer > 0 && (
                      <div className="flex items-center gap-1.5 text-xs text-city-black font-semibold bg-beige-200 px-2.5 py-1.5 rounded-md border border-city-border mb-3">
                        <Tag size={13} />
                        <span>₹{restaurant.offer} OFF on ₹600+ order</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-city-border flex items-center gap-2">
                    <button
                      onClick={() => handleSelectChoice(restaurant.id, restaurant.name)}
                      className="btn-primary text-xs flex-1"
                    >
                      Choose Restaurant
                    </button>
                    <button
                      onClick={() => navigate('/visitor/routes')}
                      className="btn-secondary text-xs"
                    >
                      Route
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
