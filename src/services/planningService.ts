import { get, post } from '../api/client';
import type { OperationalPlan } from '../types';

export const planningService = {
  // POST /planning/{event_model_id}/generate
  generate: (eventModelId: string): Promise<OperationalPlan> =>
    post(`/planning/${eventModelId}/generate`),

  // GET /planning/{event_model_id}
  getLatest: (eventModelId: string): Promise<OperationalPlan> =>
    get(`/planning/${eventModelId}`),

  // GET /planning/by-plan-id/{plan_id}
  getByPlanId: (planId: string): Promise<OperationalPlan> =>
    get(`/planning/by-plan-id/${planId}`),
};
