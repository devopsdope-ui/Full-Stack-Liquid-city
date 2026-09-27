import React, { useState } from 'react';
import { AlertTriangle, Search, Filter, Users, ChevronDown } from 'lucide-react';
import { EmptyState } from '../../components/ui/EmptyState';

/**
 * Volunteer Allocation Page
 *
 * NOTE: Volunteer allocation data comes from the planning backend as part of
 * OperationalPlan (resource_demand, zone_congestion). However, the current
 * backend does not expose a structured volunteer-specific endpoint.
 *
 * TODO: Backend endpoints required:
 *   GET /planning/{event_model_id}/volunteers → VolunteerAllocation[]
 *   Structure: { head, area, volunteers: string[], teams: string[] }
 *
 * This page shows a rich UI that reads from localStorage (set by planning page)
 * and displays demo volunteer data where backend data is unavailable.
 */

interface Volunteer {
  id: string;
  name: string;
  role: string;
  area: string;
  head: string;
  teams: string[];
  status: 'active' | 'break' | 'unavailable';
}

interface VolunteerHead {
  name: string;
  area: string;
  volunteers: Volunteer[];
}

// Demo volunteer data (would come from backend)
const DEMO_HEADS: VolunteerHead[] = [
  {
    name: 'Rahul Sharma',
    area: 'Main Entrance',
    volunteers: [
      { id: 'v1', name: 'Aisha Kumar', role: 'Registration', area: 'Gate A', head: 'Rahul Sharma', teams: ['Team 1–5'], status: 'active' },
      { id: 'v2', name: 'Dev Patel', role: 'Security', area: 'Gate A', head: 'Rahul Sharma', teams: ['Team 6–10'], status: 'active' },
      { id: 'v3', name: 'Priya Singh', role: 'Guide', area: 'Gate B', head: 'Rahul Sharma', teams: ['Team 11–15'], status: 'break' },
    ],
  },
  {
    name: 'Neha Joshi',
    area: 'Workshop Zone',
    volunteers: [
      { id: 'v4', name: 'Vikram Rao', role: 'Coordinator', area: 'Workshop A', head: 'Neha Joshi', teams: ['Team 21–30'], status: 'active' },
      { id: 'v5', name: 'Sakshi Mehta', role: 'Coordinator', area: 'Workshop B', head: 'Neha Joshi', teams: ['Team 31–40'], status: 'active' },
      { id: 'v6', name: 'Arjun Das', role: 'Tech Support', area: 'Workshop A', head: 'Neha Joshi', teams: [], status: 'active' },
    ],
  },
  {
    name: 'Kiran Pillai',
    area: 'Cafeteria & Food',
    volunteers: [
      { id: 'v7', name: 'Ritu Nair', role: 'Food Management', area: 'Cafeteria', head: 'Kiran Pillai', teams: [], status: 'active' },
      { id: 'v8', name: 'Sanjay Verma', role: 'Crowd Control', area: 'Cafeteria', head: 'Kiran Pillai', teams: [], status: 'unavailable' },
    ],
  },
];

const STATUS_BADGE: Record<string, string> = {
  active: 'badge-green',
  break: 'badge-yellow',
  unavailable: 'badge-red',
};

export default function OrganizerVolunteersPage() {
  const [search, setSearch] = useState('');
  const [filterHead, setFilterHead] = useState('');
  const [filterArea, setFilterArea] = useState('');
  const [expandedHead, setExpandedHead] = useState<string | null>(DEMO_HEADS[0]?.name || null);

  const allHeads = DEMO_HEADS.map((h) => h.name);
  const allAreas = Array.from(new Set(DEMO_HEADS.flatMap((h) => h.volunteers.map((v) => v.area))));

  const filteredHeads = DEMO_HEADS
    .filter((h) => !filterHead || h.name === filterHead)
    .map((h) => ({
      ...h,
      volunteers: h.volunteers.filter((v) => {
        const matchesSearch = !search ||
          v.name.toLowerCase().includes(search.toLowerCase()) ||
          v.role.toLowerCase().includes(search.toLowerCase());
        const matchesArea = !filterArea || v.area === filterArea;
        return matchesSearch && matchesArea;
      }),
    }))
    .filter((h) => h.volunteers.length > 0);

  const totalVolunteers = DEMO_HEADS.reduce((sum, h) => sum + h.volunteers.length, 0);
  const activeVolunteers = DEMO_HEADS.flatMap((h) => h.volunteers).filter((v) => v.status === 'active').length;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-city-black">Volunteer Allocation</h1>
        <p className="text-sm text-city-muted mt-0.5">Team hierarchy and area assignments</p>
      </div>

      {/* Backend note */}
      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2">
        <AlertTriangle size={14} className="text-blue-500 mt-0.5 shrink-0" />
        <p className="text-xs text-blue-800">
          <strong>Note:</strong> Detailed volunteer allocation requires backend endpoint:
          <code className="ml-1">GET /planning/{'{event_model_id}'}/volunteers</code>.
          Showing demo data.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="stat-card">
          <span className="section-title">Total Volunteers</span>
          <span className="text-3xl font-black">{totalVolunteers}</span>
        </div>
        <div className="stat-card">
          <span className="section-title">Active Now</span>
          <span className="text-3xl font-black text-status-available">{activeVolunteers}</span>
        </div>
        <div className="stat-card">
          <span className="section-title">Heads</span>
          <span className="text-3xl font-black">{DEMO_HEADS.length}</span>
        </div>
        <div className="stat-card">
          <span className="section-title">Coverage Areas</span>
          <span className="text-3xl font-black">{allAreas.length}</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-city-muted" />
          <input
            className="input pl-9"
            placeholder="Search volunteers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="input w-auto min-w-36"
          value={filterHead}
          onChange={(e) => setFilterHead(e.target.value)}
        >
          <option value="">All Heads</option>
          {allHeads.map((h) => <option key={h} value={h}>{h}</option>)}
        </select>
        <select
          className="input w-auto min-w-36"
          value={filterArea}
          onChange={(e) => setFilterArea(e.target.value)}
        >
          <option value="">All Areas</option>
          {allAreas.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
        {(search || filterHead || filterArea) && (
          <button
            className="btn-ghost"
            onClick={() => { setSearch(''); setFilterHead(''); setFilterArea(''); }}
          >
            Clear
          </button>
        )}
      </div>

      {/* Volunteer hierarchy */}
      {filteredHeads.length === 0 ? (
        <EmptyState message="No volunteers match your filters" />
      ) : (
        <div className="space-y-3">
          {filteredHeads.map((head) => (
            <div key={head.name} className="card overflow-hidden">
              {/* Head */}
              <button
                className="w-full flex items-center justify-between p-4 hover:bg-beige-50 transition-colors"
                onClick={() => setExpandedHead(expandedHead === head.name ? null : head.name)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-city-black text-white flex items-center justify-center text-sm font-bold">
                    {head.name.charAt(0)}
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-bold">{head.name}</div>
                    <div className="text-xs text-city-muted flex items-center gap-1">
                      <Filter size={10} />
                      {head.area}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="badge badge-gray">{head.volunteers.length} volunteers</span>
                  <ChevronDown
                    size={16}
                    className={`text-city-muted transition-transform ${expandedHead === head.name ? 'rotate-180' : ''}`}
                  />
                </div>
              </button>

              {/* Volunteers */}
              {expandedHead === head.name && (
                <div className="border-t border-city-border">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-beige-100">
                          <th className="text-left px-4 py-2 text-xs font-bold text-city-muted uppercase tracking-wider">Volunteer</th>
                          <th className="text-left px-4 py-2 text-xs font-bold text-city-muted uppercase tracking-wider">Role</th>
                          <th className="text-left px-4 py-2 text-xs font-bold text-city-muted uppercase tracking-wider">Area</th>
                          <th className="text-left px-4 py-2 text-xs font-bold text-city-muted uppercase tracking-wider">Teams</th>
                          <th className="text-left px-4 py-2 text-xs font-bold text-city-muted uppercase tracking-wider">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-city-border">
                        {head.volunteers.map((v) => (
                          <tr key={v.id} className="hover:bg-beige-50">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-full bg-beige-300 flex items-center justify-center text-xs font-semibold">
                                  {v.name.charAt(0)}
                                </div>
                                <span className="font-medium">{v.name}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-city-gray">{v.role}</td>
                            <td className="px-4 py-3 text-city-gray">{v.area}</td>
                            <td className="px-4 py-3">
                              {v.teams.length > 0 ? (
                                <span className="text-xs bg-beige-200 px-2 py-0.5 rounded-full">
                                  {v.teams.join(', ')}
                                </span>
                              ) : (
                                <span className="text-city-muted text-xs">—</span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`badge ${STATUS_BADGE[v.status]}`}>
                                {v.status.charAt(0).toUpperCase() + v.status.slice(1)}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
