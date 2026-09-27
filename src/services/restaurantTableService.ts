/**
 * Restaurant Table Service
 *
 * NOTE: The current backend does not expose individual table management endpoints.
 * This service is designed as a frontend abstraction so it can connect to a real
 * backend later with no changes to the UI components.
 *
 * TODO Backend endpoints required:
 *   GET  /partners/{partner_id}/tables         - list tables
 *   POST /partners/{partner_id}/tables         - add table
 *   PUT  /partners/{partner_id}/tables/{table_id} - update table status
 *   DELETE /partners/{partner_id}/tables/{table_id} - remove table
 *
 *   GET  /partners/{partner_id}/queue          - customer queue
 *   POST /partners/{partner_id}/queue          - add customer to queue
 *   PUT  /partners/{partner_id}/queue/{queue_id} - update queue status (seat/complete)
 */

import type { TableEntry, CustomerQueue } from '../types';

// In-memory store for demo/hackathon purposes
const tableStore: Map<string, TableEntry[]> = new Map();
const queueStore: Map<string, CustomerQueue[]> = new Map();

function getDefaultTables(): TableEntry[] {
  return [
    { id: 't1', number: 1, seats: 2, status: 'available' },
    { id: 't2', number: 2, seats: 4, status: 'occupied' },
    { id: 't3', number: 3, seats: 4, status: 'available' },
    { id: 't4', number: 4, seats: 6, status: 'reserved' },
    { id: 't5', number: 5, seats: 2, status: 'cleaning' },
    { id: 't6', number: 6, seats: 8, status: 'available' },
  ];
}

function getDefaultQueue(): CustomerQueue[] {
  return [
    {
      queue_id: 'q1',
      party_size: 2,
      waiting_since: new Date(Date.now() - 8 * 60000).toISOString(),
      status: 'waiting',
    },
    {
      queue_id: 'q2',
      party_size: 4,
      waiting_since: new Date(Date.now() - 12 * 60000).toISOString(),
      status: 'waiting',
    },
  ];
}

export const restaurantTableService = {
  getTables: async (partnerId: string): Promise<TableEntry[]> => {
    // TODO: Replace with GET /partners/{partner_id}/tables
    if (!tableStore.has(partnerId)) {
      tableStore.set(partnerId, getDefaultTables());
    }
    return tableStore.get(partnerId)!;
  },

  addTable: async (partnerId: string, seats: number): Promise<TableEntry> => {
    // TODO: Replace with POST /partners/{partner_id}/tables
    const tables = tableStore.get(partnerId) || [];
    const newTable: TableEntry = {
      id: `t${Date.now()}`,
      number: tables.length + 1,
      seats,
      status: 'available',
    };
    tableStore.set(partnerId, [...tables, newTable]);
    return newTable;
  },

  updateTableStatus: async (
    partnerId: string,
    tableId: string,
    status: TableEntry['status']
  ): Promise<TableEntry> => {
    // TODO: Replace with PUT /partners/{partner_id}/tables/{table_id}
    const tables = tableStore.get(partnerId) || [];
    const updated = tables.map((t) => (t.id === tableId ? { ...t, status } : t));
    tableStore.set(partnerId, updated);
    return updated.find((t) => t.id === tableId)!;
  },

  removeTable: async (partnerId: string, tableId: string): Promise<void> => {
    // TODO: Replace with DELETE /partners/{partner_id}/tables/{table_id}
    const tables = tableStore.get(partnerId) || [];
    tableStore.set(partnerId, tables.filter((t) => t.id !== tableId));
  },

  getQueue: async (partnerId: string): Promise<CustomerQueue[]> => {
    // TODO: Replace with GET /partners/{partner_id}/queue
    if (!queueStore.has(partnerId)) {
      queueStore.set(partnerId, getDefaultQueue());
    }
    return queueStore.get(partnerId)!;
  },

  addToQueue: async (partnerId: string, partySize: number): Promise<CustomerQueue> => {
    // TODO: Replace with POST /partners/{partner_id}/queue
    const queue = queueStore.get(partnerId) || [];
    const entry: CustomerQueue = {
      queue_id: `q${Date.now()}`,
      party_size: partySize,
      waiting_since: new Date().toISOString(),
      status: 'waiting',
    };
    queueStore.set(partnerId, [...queue, entry]);
    return entry;
  },

  seatCustomer: async (partnerId: string, queueId: string, tableId: string): Promise<void> => {
    // TODO: Replace with PUT /partners/{partner_id}/queue/{queue_id}
    const queue = queueStore.get(partnerId) || [];
    queueStore.set(
      partnerId,
      queue.map((q) =>
        q.queue_id === queueId ? { ...q, status: 'seated' as const, assigned_table: tableId } : q
      )
    );
    // Also mark table as occupied
    const tables = tableStore.get(partnerId) || [];
    tableStore.set(
      partnerId,
      tables.map((t) => (t.id === tableId ? { ...t, status: 'occupied' as const } : t))
    );
  },

  completeCustomer: async (partnerId: string, queueId: string): Promise<void> => {
    // TODO: Replace with PUT /partners/{partner_id}/queue/{queue_id} with status=completed
    const queue = queueStore.get(partnerId) || [];
    queueStore.set(
      partnerId,
      queue.map((q) => (q.queue_id === queueId ? { ...q, status: 'completed' as const } : q))
    );
  },
};
