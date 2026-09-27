import { get, post } from '../api/client';
import type {
  SimulationState,
  SetAttendanceRequest,
  CrowdSurgeRequest,
  TrafficJamRequest,
  RestaurantOccupancyRequest,
} from '../types';

// Public simulation endpoints
export const simulationService = {
  start: (): Promise<unknown> => post('/simulation/start'),
  pause: (): Promise<unknown> => post('/simulation/pause'),
  reset: (): Promise<unknown> => post('/simulation/reset'),
  getStatus: (): Promise<SimulationState> => get('/simulation/status'),
  crowdSurge: (data: CrowdSurgeRequest): Promise<unknown> => post('/simulation/crowd-surge', data),
  eventEnd: (): Promise<unknown> => post('/simulation/event-end'),
  trafficJam: (data: TrafficJamRequest): Promise<unknown> => post('/simulation/traffic-jam', data),
  setAttendance: (data: SetAttendanceRequest): Promise<unknown> => post('/simulation/set-attendance', data),
  restaurantOccupancy: (data: RestaurantOccupancyRequest): Promise<unknown> =>
    post('/simulation/restaurant-occupancy', data),
};

// Admin simulation endpoints
export const adminSimulationService = {
  start: (): Promise<unknown> => post('/admin/simulation/start'),
  pause: (): Promise<unknown> => post('/admin/simulation/pause'),
  reset: (): Promise<unknown> => post('/admin/simulation/reset'),
  getStatus: (): Promise<SimulationState> => get('/admin/simulation/status'),
  crowdSurge: (data: CrowdSurgeRequest): Promise<unknown> => post('/admin/simulation/crowd-surge', data),
  eventEnd: (): Promise<unknown> => post('/admin/simulation/event-end'),
  trafficJam: (data: TrafficJamRequest): Promise<unknown> => post('/admin/simulation/traffic-jam', data),
  setAttendance: (data: SetAttendanceRequest): Promise<unknown> => post('/admin/simulation/set-attendance', data),
  restaurantOccupancy: (data: RestaurantOccupancyRequest): Promise<unknown> =>
    post('/admin/simulation/restaurant-occupancy', data),
};
