import React, { useState } from 'react';
import { eventService } from '../../services/api';
import { usePolling } from '../../hooks/usePolling';
import { TableSkeleton } from '../../components/ui/Skeleton';
import { ErrorState } from '../../components/ui/ErrorState';
import { EmptyState } from '../../components/ui/EmptyState';
import { Plus } from 'lucide-react';

export const AdminEventsPage: React.FC = () => {
  const { data: events, loading, error, refetch } = usePolling(eventService.getAll, { interval: 30000 });
  const [filter, setFilter] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any>(null);

  const filteredEvents = events?.filter(e => filter === 'All' || e.status === filter.toLowerCase()) || [];

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const eventData = {
      name: formData.get('name') as string,
      location: formData.get('location') as string,
      start_time: formData.get('start_time') as string,
      end_time: formData.get('end_time') as string,
      expected_attendance: Number(formData.get('expected_attendance')),
      current_attendance: Number(formData.get('current_attendance') || 0),
      status: formData.get('status') as string,
    };

    try {
      if (editingEvent) {
        await eventService.update(editingEvent.id, eventData);
      } else {
        await eventService.create(eventData);
      }
      setShowModal(false);
      setEditingEvent(null);
      refetch();
    } catch (err) {
      alert('Failed to save event');
    }
  };

  if (error) return <ErrorState message="Failed to load events" />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="section-title text-city-charcoal">Event Management</h1>
        <button className="btn-primary flex items-center gap-2" onClick={() => { setEditingEvent(null); setShowModal(true); }}>
          <Plus className="w-5 h-5" /> Add Event
        </button>
      </div>

      <div className="flex gap-2">
        {['All', 'Scheduled', 'Ongoing', 'Ending', 'Ended'].map(f => (
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
        {loading && !events ? (
          <TableSkeleton />
        ) : filteredEvents.length === 0 ? (
          <EmptyState message="No events found" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="p-3">Name</th>
                  <th className="p-3">Location</th>
                  <th className="p-3">Expected</th>
                  <th className="p-3">Current</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredEvents.map((e) => (
                  <tr key={e.id} className="border-b hover:bg-beige-100 cursor-pointer" onClick={() => { setEditingEvent(e); setShowModal(true); }}>
                    <td className="p-3 font-semibold">{e.name}</td>
                    <td className="p-3">{e.location}</td>
                    <td className="p-3">{e.expected_attendance}</td>
                    <td className="p-3">{e.current_attendance}</td>
                    <td className="p-3">
                      <span className="badge badge-gray">{e.status}</span>
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
            <h2 className="text-xl font-bold mb-4">{editingEvent ? 'Edit Event' : 'Add Event'}</h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="label">Name</label>
                <input name="name" className="input" defaultValue={editingEvent?.name} required />
              </div>
              <div>
                <label className="label">Location</label>
                <input name="location" className="input" defaultValue={editingEvent?.location} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Start Time</label>
                  <input type="datetime-local" name="start_time" className="input" defaultValue={editingEvent?.start_time?.slice(0, 16)} required />
                </div>
                <div>
                  <label className="label">End Time</label>
                  <input type="datetime-local" name="end_time" className="input" defaultValue={editingEvent?.end_time?.slice(0, 16)} required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Expected</label>
                  <input type="number" name="expected_attendance" className="input" defaultValue={editingEvent?.expected_attendance} required />
                </div>
                <div>
                  <label className="label">Current</label>
                  <input type="number" name="current_attendance" className="input" defaultValue={editingEvent?.current_attendance} />
                </div>
              </div>
              <div>
                <label className="label">Status</label>
                <select name="status" className="input" defaultValue={editingEvent?.status || 'scheduled'}>
                  <option value="scheduled">Scheduled</option>
                  <option value="ongoing">Ongoing</option>
                  <option value="ending">Ending</option>
                  <option value="ended">Ended</option>
                </select>
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

export default AdminEventsPage;
