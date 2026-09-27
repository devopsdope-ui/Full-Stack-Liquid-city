import { get, post } from '../api/client';
import type { Recommendation, RecommendationRequest, RecommendationChoiceRequest } from '../types';

export const recommendationService = {
  getRestaurants: (): Promise<Recommendation[]> => get('/recommendations/restaurants'),
  postRestaurants: (data: RecommendationRequest): Promise<Recommendation[]> => post('/recommendations/restaurants', data),
  getRoutes: (): Promise<Recommendation[]> => get('/recommendations/routes'),
  postRoutes: (data: RecommendationRequest): Promise<Recommendation[]> => post('/recommendations/routes', data),
  submitChoice: (data: RecommendationChoiceRequest): Promise<unknown> =>
    post('/recommendations/restaurants/choice', data),
};
