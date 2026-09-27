import React, { useState } from 'react';
import { partnerService } from '../../services/partnerService';
import { useAuth } from '../../contexts/AuthContext';
import { Tag, Plus, Check, Clock, AlertCircle } from 'lucide-react';
import type { PartnerOffer } from '../../types';

export default function PartnerOffersPage() {
  const { user } = useAuth();
  const partnerId = user?.id || 'demo-partner';

  // Local state for offers (since dedicated partner offer CRUD is not in current backend)
  const [offers, setOffers] = useState<PartnerOffer[]>([
    {
      id: 'off-1',
      title: '₹200 Instant Flash Offer',
      description: 'Applicable on orders above ₹600 during stadium peak hours',
      discount_amount: 200,
      minimum_bill: 600,
      active: true,
      start_time: '18:00',
      end_time: '22:00',
    },
    {
      id: 'off-2',
      title: 'Hackathon Midnight Snack ₹100 Off',
      description: 'Exclusive for registered hackathon participants with badges',
      discount_amount: 100,
      minimum_bill: 350,
      active: false,
      start_time: '23:00',
      end_time: '04:00',
    },
  ]);

  const [form, setForm] = useState({
    title: '',
    description: '',
    discount_amount: 150,
    minimum_bill: 500,
    start_time: '12:00',
    end_time: '15:00',
  });
  const [showAdd, setShowAdd] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleToggleActive = async (id: string) => {
    setOffers((prev) =>
      prev.map((o) => (o.id === id ? { ...o, active: !o.active } : o))
    );
    // Sync discount amount to partner record
    const target = offers.find((o) => o.id === id);
    if (target) {
      const newOfferVal = !target.active ? target.discount_amount : 0;
      partnerService.update(partnerId, { offer: newOfferVal }).catch(() => {});
    }
  };

  const handleCreateOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    const newOffer: PartnerOffer = {
      id: `off-${Date.now()}`,
      title: form.title,
      description: form.description,
      discount_amount: Number(form.discount_amount),
      minimum_bill: Number(form.minimum_bill),
      active: true,
      start_time: form.start_time,
      end_time: form.end_time,
    };

    setOffers((prev) => [...prev, newOffer]);
    setShowAdd(false);
    setForm({
      title: '',
      description: '',
      discount_amount: 150,
      minimum_bill: 500,
      start_time: '12:00',
      end_time: '15:00',
    });

    // Update partner offer amount in backend
    try {
      await partnerService.update(partnerId, { offer: newOffer.discount_amount });
      setFeedback('Offer activated and published to Visitor map cards!');
      setTimeout(() => setFeedback(null), 3000);
    } catch {
      setFeedback('Offer saved locally.');
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold text-city-black">Partner Promotional Offers</h1>
          <p className="text-sm text-city-muted mt-0.5">
            Incentivize visitors to choose your venue during crowd redistribution windows.
          </p>
        </div>

        <button
          onClick={() => setShowAdd(!showAdd)}
          className="btn-primary text-xs flex items-center gap-1.5"
        >
          <Plus size={14} />
          {showAdd ? 'Close' : 'Create New Offer'}
        </button>
      </div>

      {feedback && (
        <div className="p-3 bg-green-50 border border-green-200 text-green-800 text-xs rounded-lg flex items-center gap-2">
          <Check size={14} className="text-green-600" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Create Offer Form */}
      {showAdd && (
        <div className="card p-5 border-2 border-city-black fade-in space-y-4">
          <h2 className="section-title">New Promotional Campaign</h2>
          <form onSubmit={handleCreateOffer} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Offer Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ₹200 OFF on Group Orders"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="input text-xs"
                />
              </div>

              <div>
                <label className="label">Description / Criteria</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Minimum bill ₹600"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="input text-xs"
                />
              </div>

              <div>
                <label className="label">Discount Value (₹)</label>
                <input
                  type="number"
                  required
                  min={10}
                  value={form.discount_amount}
                  onChange={(e) => setForm({ ...form, discount_amount: Number(e.target.value) })}
                  className="input text-xs"
                />
              </div>

              <div>
                <label className="label">Minimum Bill Amount (₹)</label>
                <input
                  type="number"
                  required
                  min={50}
                  value={form.minimum_bill}
                  onChange={(e) => setForm({ ...form, minimum_bill: Number(e.target.value) })}
                  className="input text-xs"
                />
              </div>

              <div>
                <label className="label">Start Time</label>
                <input
                  type="time"
                  required
                  value={form.start_time}
                  onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                  className="input text-xs"
                />
              </div>

              <div>
                <label className="label">End Time</label>
                <input
                  type="time"
                  required
                  value={form.end_time}
                  onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                  className="input text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-city-border">
              <button
                type="button"
                onClick={() => setShowAdd(false)}
                className="btn-ghost text-xs"
              >
                Cancel
              </button>
              <button type="submit" className="btn-primary text-xs">
                Publish Offer
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Offers List */}
      <div className="space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-city-muted">
          Active & Draft Campaigns
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {offers.map((offer) => (
            <div
              key={offer.id}
              className={`card p-5 border-2 transition-all flex flex-col justify-between ${
                offer.active ? 'border-status-available bg-white' : 'border-city-border bg-beige-100 opacity-75'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <Tag size={16} className={offer.active ? 'text-status-available' : 'text-city-muted'} />
                    <h3 className="font-bold text-base text-city-black">{offer.title}</h3>
                  </div>
                  <span className={`badge ${offer.active ? 'badge-green' : 'badge-gray'}`}>
                    {offer.active ? 'ACTIVE' : 'DISABLED'}
                  </span>
                </div>

                <p className="text-xs text-city-muted mb-3">{offer.description}</p>

                <div className="bg-beige-100 p-2.5 rounded-lg border border-city-border text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-city-muted">Discount Value:</span>
                    <span className="font-bold text-city-black">₹{offer.discount_amount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-city-muted">Min Bill Required:</span>
                    <span className="font-semibold text-city-charcoal">₹{offer.minimum_bill}</span>
                  </div>
                  <div className="flex justify-between items-center pt-1 text-city-muted">
                    <span className="flex items-center gap-1">
                      <Clock size={11} /> Active Windows:
                    </span>
                    <span>{offer.start_time} - {offer.end_time}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-city-border flex items-center justify-between">
                <span className="text-[11px] text-city-muted">
                  Visible to nearby event attendees
                </span>
                <button
                  onClick={() => handleToggleActive(offer.id)}
                  className={`btn-secondary text-xs py-1 px-3 ${
                    offer.active ? 'hover:border-red-400 hover:text-red-700' : 'hover:border-green-400 hover:text-green-700'
                  }`}
                >
                  {offer.active ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
