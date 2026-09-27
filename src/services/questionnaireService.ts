import { get, post } from '../api/client';
import type { QuestionnaireSubmission } from '../types';

export interface QuestionnaireResponse {
  event_model_id: string;
  structured_model: unknown;
  [key: string]: unknown;
}

export const questionnaireService = {
  // GET /questionnaire - returns question metadata
  getMeta: (): Promise<unknown> => get('/questionnaire'),

  // GET /questionnaire/{event_model_id}
  getById: (eventModelId: string): Promise<QuestionnaireResponse> =>
    get(`/questionnaire/${eventModelId}`),

  // POST /questionnaire/submit
  submit: (data: QuestionnaireSubmission): Promise<QuestionnaireResponse> =>
    post('/questionnaire/submit', data),
};
