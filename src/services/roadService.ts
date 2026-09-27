import { get } from '../api/client';
import type { Road } from '../types';

export const roadService = {
  getAll: (): Promise<Road[]> => get('/roads'),
  getById: (roadId: string): Promise<Road> => get(`/roads/${roadId}`),
};
