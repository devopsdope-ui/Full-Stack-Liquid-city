import { get } from '../api/client';
import type { Crowd, CrowdPrediction } from '../types';

export const crowdService = {
  getAll: (): Promise<Crowd[]> => get('/crowd'),
  getById: (locationId: string): Promise<Crowd> => get(`/crowd/${locationId}`),
  predict: (locationId: string): Promise<CrowdPrediction> => get(`/crowd/${locationId}/predict`),
};
