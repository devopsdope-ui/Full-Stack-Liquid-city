import React, { useState } from 'react';
import { partnerService } from '../../services/api';
import { usePolling } from '../../hooks/usePolling';
import { TableSkeleton } from '../../components/ui/Skeleton';
import { ErrorState } from '../../components/ui/ErrorState';
import { EmptyState } from '../../components/ui/EmptyState';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { Plus, Star, CheckCircle } from 'lucide-react';

export const AdminPartnersPage: React.FC = () => {
  const { data: partners, loading, error, refetch } = usePolling(partnerService.getAll, { interval: 30000 });
  const [filter, setFilter] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [editingPartner, setEditingPartner] = useState<any>(null);

  const filteredPartners = partners?.filter(p => filter === 'All' || p.type.toLowerCase() === filter.toLowerCase()) || [];

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const partnerData = {
      name: formData.get('name') as string,
      type: formData.get('type') as string,
      capacity: Number(formData.get('capacity')),
      occupancy: Number(formData.get('occupancy') || 0),
      waiting_time: Number(formData.get('waiting_time') || 0),
      rating: Number(formData.get('rating') || 0),
      offer: Number(formData.get('offer') || 0),
      verified: formData.get('verified') === 'on',
    };

    try {
      if (editingPartner) {
        await partnerService.update(editingPartner.id, partnerData);
      } else {
        await partnerService.create(partnerData);
      }
      setShowModal(false);
      setEditingPartner(null);
      refetch();
    } catch (err) {
      alert('Failed to save partner');
    }
  };

  if (error) return <ErrorState message="Failed to load partners" />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="section-title text-city-charcoal">Partner Management</h1>
        <button className="btn-primary flex items-center gap-2" onClick={() => { setEditingPartner(null); setShowModal(true); }}>
          <Plus className="w-5 h-5" /> Add Partner
        </button>
      </div>

      <div className="flex gap-2">
        {['All', 'Restaurant', 'Parking', 'Shuttle'].map(f => (
          <button 
            key={f} 
            className={`px-4 py-2 rounded ${filter === f ? 'bg-city-black text-white' : 'bg-beige-100 text-city-charcoal hover:bg-beige-200'}`}
            onClick={() => setFilter(f)}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="card bg-white">
        {loading && !partners ? (
          <TableSkeleton />
        ) : filteredPartners.length === 0 ? (
          <EmptyState message="No partners found" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="p-3">Name</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Occupancy</th>
                  <th className="p-3">Wait Time</th>
                  <th className="p-3">Rating</th>
                  <th className="p-3">Verified</th>
                </tr>
              </thead>
              <tbody>
                {filteredPartners.map((p) => (
                  <tr key={p.id} className="border-b hover:bg-beige-100 cursor-pointer" onClick={() => { setEditingPartner(p); setShowModal(true); }}>
                    <td className="p-3 font-semibold">{p.name}</td>
                    <td className="p-3 capitalize"><span className="badge badge-gray">{p.type}</span></td>
                    <td className="p-3 w-48">
                      <ProgressBar value={p.occupancy} max={100} />
                      <div className="text-xs mt-1">{p.occupancy}% ({p.capacity} cap)</div>
                    </td>
                    <td className="p-3">{p.waiting_time} min</td>
                    <td className="p-3 flex items-center gap-1">
                      {p.rating} <Star className="w-4 h-4 text-yellow-500 fill-current" />
                    </td>
                    <td className="p-3">
                      {p.verified && <CheckCircle className="w-5 h-5 text-green-500" />}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">{editingPartner ? 'Edit Partner' : 'Add Partner'}</h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="label">Name</label>
                <input name="name" className="input" defaultValue={editingPartner?.name} required />
              </div>
              <div>
                <label className="label">Type</label>
                <select name="type" className="input" defaultValue={editingPartner?.type || 'restaurant'}>
                  <option value="restaurant">Restaurant</option>
                  <option value="parking">Parking</option>
                  <option value="shuttle">Shuttle</option>
                  <option value="hotel">Hotel</option>
                  <option value="transport">Transport</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Capacity</label>
                  <input type="number" name="capacity" className="input" defaultValue={editingPartner?.capacity} required />
                </div>
                <div>
                  <label className="label">Occupancy (%)</label>
                  <input type="number" name="occupancy" className="input" defaultValue={editingPartner?.occupancy} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Wait Time (min)</label>
                  <input type="number" name="waiting_time" className="input" defaultValue={editingPartner?.waiting_time} />
                </div>
                <div>
                  <label className="label">Rating</label>
                  <input type="number" step="0.1" name="rating" className="input" defaultValue={editingPartner?.rating} />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" name="verified" id="verified" defaultChecked={editingPartner?.verified} />
                <label htmlFor="verified" className="label mb-0">Verified Partner</label>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button type="button" className="btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPartnersPage;
