import { get, post } from '../api/client';
import type { RouteOption, RoutePredictionRequest, RoutePredictionResponse } from '../types';

export const routeService = {
  getAll: (): Promise<RouteOption[]> => get('/routes'),
  predict: (data: RoutePredictionRequest): Promise<RoutePredictionResponse> => post('/routes/predict', data),
};
