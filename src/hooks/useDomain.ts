/**
 * useDomain.ts — domain-specific polling hooks
 * Fixed: useCrowd always returns Crowd[] (never a single Crowd)
 */
import { usePolling } from './usePolling';
import { crowdService } from '../services/crowdService';
import { partnerService } from '../services/partnerService';
import { simulationService } from '../services/simulationService';
import { eventService } from '../services/eventService';
import { roadService } from '../services/roadService';
import type { Crowd } from '../types';

export function useCrowd() {
  return usePolling<Crowd[]>(() => crowdService.getAll(), { interval: 20000 });
}

export function useRestaurants() {
  return usePolling(
    () => partnerService.getAll().then((p) => p.filter((x) => x.type === 'restaurant')),
    { interval: 25000 }
  );
}

export function usePartners() {
  return usePolling(() => partnerService.getAll(), { interval: 30000 });
}

export function useSimulationStatus() {
  return usePolling(() => simulationService.getStatus(), { interval: 10000 });
}

export function useEvents() {
  return usePolling(() => eventService.getAll(), { interval: 60000 });
}

export function useRoads() {
  return usePolling(() => roadService.getAll(), { interval: 30000 });
}
