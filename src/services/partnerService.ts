import { get, post, put } from '../api/client';
import type { Partner, PartnerCreate, PartnerUpdate } from '../types';

export const partnerService = {
  getAll: (): Promise<Partner[]> => get('/partners'),
  getById: (id: string): Promise<Partner> => get(`/partners/${id}`),
  create: (data: PartnerCreate): Promise<Partner> => post('/partners', data),
  update: (id: string, data: PartnerUpdate): Promise<Partner> => put(`/partners/${id}`, data),
};
