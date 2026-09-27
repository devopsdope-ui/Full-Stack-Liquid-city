import React, { useState, useEffect } from 'react';
import { restaurantTableService } from '../../services/restaurantTableService';
import { partnerService } from '../../services/partnerService';
import { useAuth } from '../../contexts/AuthContext';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { Plus, Users, Clock, Check, Utensils, Hotel, AlertCircle, RefreshCw } from 'lucide-react';
import type { TableEntry, CustomerQueue } from '../../types';

export default function PartnerAvailabilityPage() {
  const { user } = useAuth();
  const partnerId = user?.id || 'demo-partner';
  const partnerType = user?.partnerType || 'restaurant';

  const [tables, setTables] = useState<TableEntry[]>([]);
  const [queue, setQueue] = useState<CustomerQueue[]>([]);
  const [loading, setLoading] = useState(true);
  const [newSeats, setNewSeats] = useState(4);
  const [selectedQueue, setSelectedQueue] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [tList, qList] = await Promise.all([
        restaurantTableService.getTables(partnerId),
        restaurantTableService.getQueue(partnerId),
      ]);
      setTables(tList);
      setQueue(qList);
    } catch (err) {
      console.error('Failed to load table and queue state:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [partnerId]);

  const handleStatusChange = async (tableId: string, status: TableEntry['status']) => {
    try {
      await restaurantTableService.updateTableStatus(partnerId, tableId, status);
      setTables((prev) => prev.map((t) => (t.id === tableId ? { ...t, status } : t)));

      // Sync partner occupancy with backend where possible
      const updatedTables = tables.map((t) => (t.id === tableId ? { ...t, status } : t));
      const occupied = updatedTables.filter((t) => t.status === 'occupied').length;
      const occPercent = Math.round((occupied / updatedTables.length) * 100);
      partnerService.update(partnerId, { occupancy: occPercent }).catch(() => {});
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddTable = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newTable = await restaurantTableService.addTable(partnerId, newSeats);
      setTables((prev) => [...prev, newTable]);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAssign = async (queueId: string, tableId: string) => {
    try {
      await restaurantTableService.seatCustomer(partnerId, queueId, tableId);
      loadData();
      setSelectedQueue(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleComplete = async (queueId: string) => {
    try {
      await restaurantTableService.completeCustomer(partnerId, queueId);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const availableTables = tables.filter((t) => t.status === 'available');

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold text-city-black">
            {partnerType === 'hotel' ? 'Room Availability Management' : 'Table & Seating Management'}
          </h1>
          <p className="text-sm text-city-muted mt-0.5">
            Manually maintain physical capacity and assign waiting customers.
          </p>
        </div>

        <button
          onClick={loadData}
          className="btn-secondary text-xs flex items-center gap-1.5"
        >
          <RefreshCw size={13} />
          Refresh
        </button>
      </div>

      {/* Backend API Notice */}
      <div className="p-3 bg-beige-100 border border-city-border rounded-lg flex items-start gap-2">
        <AlertCircle size={15} className="text-city-muted mt-0.5 shrink-0" />
        <p className="text-xs text-city-charcoal">
          <strong>Integration notice:</strong> Individual table entities and real-time customer queue actions are managed through{' '}
          <code className="bg-white px-1 py-0.5 rounded border border-city-border">restaurantTableService.ts</code>.
          Aggregated partner occupancy is synchronized to backend <code className="bg-white px-1 py-0.5 rounded border border-city-border">PUT /partners/:id</code>.
        </p>
      </div>

      {/* Add Table Form */}
      <div className="card p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-sm text-city-black">Add New Dining Table</h3>
          <span className="text-xs text-city-muted">Expand your registered restaurant seating arrangement</span>
        </div>

        <form onSubmit={handleAddTable} className="flex items-center gap-2">
          <select
            value={newSeats}
            onChange={(e) => setNewSeats(Number(e.target.value))}
            className="input w-32 text-xs"
          >
            <option value={2}>2 Seats</option>
            <option value={4}>4 Seats</option>
            <option value={6}>6 Seats</option>
            <option value={8}>8 Seats</option>
          </select>
          <button type="submit" className="btn-primary text-xs flex items-center gap-1">
            <Plus size={14} /> Add Table
          </button>
        </form>
      </div>

      {/* Grid of Tables */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-city-muted">
          Active Tables ({tables.length} Total)
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {tables.map((table) => {
            const statusColors: Record<string, string> = {
              available: 'border-green-300 bg-green-50/50 text-green-900',
              occupied: 'border-red-300 bg-red-50/50 text-red-900',
              reserved: 'border-yellow-300 bg-yellow-50/50 text-yellow-900',
              cleaning: 'border-gray-300 bg-gray-100 text-gray-800',
              unavailable: 'border-gray-300 bg-gray-200 text-gray-500',
            };

            return (
              <div
                key={table.id}
                className={`p-3.5 rounded-xl border-2 flex flex-col justify-between transition-all ${
                  statusColors[table.status] || 'border-city-border bg-white'
                }`}
              >
                <div>
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-bold text-sm">Table {table.number}</span>
                    <span className="text-[11px] font-semibold opacity-75">{table.seats} seats</span>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider">
                    {table.status}
                  </span>
                </div>

                <div className="mt-3 pt-2 border-t border-black/10">
                  <select
                    value={table.status}
                    onChange={(e) => handleStatusChange(table.id, e.target.value as TableEntry['status'])}
                    className="w-full text-[11px] font-semibold bg-white/90 border border-black/20 rounded p-1 cursor-pointer"
                  >
                    <option value="available">Available</option>
                    <option value="occupied">Occupied</option>
                    <option value="reserved">Reserved</option>
                    <option value="cleaning">Cleaning</option>
                    <option value="unavailable">Unavailable</option>
                  </select>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Customer Queue & Allocation */}
      <div className="card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-city-black">
              Customer Allocation & Waitlist
            </h2>
            <span className="text-xs text-city-muted">Assign incoming patrons to available tables</span>
          </div>
          <button
            onClick={() => restaurantTableService.addToQueue(partnerId, 3).then(loadData)}
            className="btn-secondary text-xs flex items-center gap-1"
          >
            <Plus size={13} /> Add Walk-in
          </button>
        </div>

        {queue.length === 0 ? (
          <p className="text-xs text-city-muted py-4 text-center">No customers currently in the waitlist.</p>
        ) : (
          <div className="divide-y divide-city-border border border-city-border rounded-lg overflow-hidden">
            {queue.map((item) => (
              <div key={item.queue_id} className="p-3.5 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-beige-200 flex items-center justify-center font-bold text-xs">
                    {item.party_size}P
                  </div>
                  <div>
                    <div className="text-sm font-bold text-city-black">Party of {item.party_size}</div>
                    <div className="text-xs text-city-muted flex items-center gap-1">
                      <Clock size={12} />
                      Waiting approx. {Math.round((Date.now() - new Date(item.waiting_since).getTime()) / 60000)} mins
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {item.status === 'waiting' ? (
                    selectedQueue === item.queue_id ? (
                      <div className="flex items-center gap-1.5">
                        <select
                          id={`select-table-${item.queue_id}`}
                          className="input text-xs py-1"
                          defaultValue=""
                        >
                          <option value="" disabled>Select Table</option>
                          {availableTables.map((t) => (
                            <option key={t.id} value={t.id}>
                              Table {t.number} ({t.seats} seats)
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => {
                            const selectEl = document.getElementById(`select-table-${item.queue_id}`) as HTMLSelectElement;
                            if (selectEl && selectEl.value) {
                              handleAssign(item.queue_id, selectEl.value);
                            }
                          }}
                          className="btn-primary text-xs py-1 px-3"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setSelectedQueue(null)}
                          className="btn-ghost text-xs py-1"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setSelectedQueue(item.queue_id)}
                        disabled={availableTables.length === 0}
                        className="btn-primary text-xs py-1 px-3 disabled:opacity-50"
                      >
                        {availableTables.length > 0 ? 'Assign Table' : 'No Free Tables'}
                      </button>
                    )
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="badge badge-green">Seated (Table {item.assigned_table})</span>
                      <button
                        onClick={() => handleComplete(item.queue_id)}
                        className="btn-secondary text-xs py-1 px-2.5"
                      >
                        Done / Free Up
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
