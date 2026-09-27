import { get, post, put } from '../api/client';
import type { Event, EventCreate, EventUpdate } from '../types';

export const eventService = {
  getAll: (): Promise<Event[]> => get('/events'),
  getById: (id: string): Promise<Event> => get(`/events/${id}`),
  create: (data: EventCreate): Promise<Event> => post('/events', data),
  update: (id: string, data: EventUpdate): Promise<Event> => put(`/events/${id}`, data),
};
