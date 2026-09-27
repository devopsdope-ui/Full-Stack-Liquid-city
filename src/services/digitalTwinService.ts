/**
 * Digital Twin, Weather, and Social Signals API service client.
 * Calls real backend endpoints:
 *   GET  /weather/current
 *   GET  /weather/forecast
 *   GET  /social-signals
 *   POST /social-signals
 *   GET  /digital-twin/events/{eventId}/state
 *   POST /digital-twin/events/{eventId}/what-if
 *   GET  /digital-twin/events/{eventId}/impacts
 *   GET  /digital-twin/events/{eventId}/alerts
 *   POST /digital-twin/events/{eventId}/replan
 */

import { get, post } from '../api/client';
import type {
  WeatherCurrent,
  WeatherForecast,
  SocialSignal,
  DigitalTwinState,
  WhatIfScenarioRequest,
  WhatIfScenarioResponse,
  WeatherImpact,
  DigitalTwinAlert,
  ReplanRequest,
  ReplanResponse,
} from '../types';

export const digitalTwinService = {
  // Live Weather
  getCurrentWeather: (lat?: number, lon?: number): Promise<WeatherCurrent> => {
    const q = lat && lon ? `?lat=${lat}&lon=${lon}` : '';
    return get<WeatherCurrent>(`/weather/current${q}`);
  },

  getWeatherForecast: (lat?: number, lon?: number): Promise<WeatherForecast> => {
    const q = lat && lon ? `?lat=${lat}&lon=${lon}` : '';
    return get<WeatherForecast>(`/weather/forecast${q}`);
  },

  // Social & Community Signals
  getSocialSignals: (type?: string, location?: string): Promise<SocialSignal[]> => {
    const params = new URLSearchParams();
    if (type) params.append('signal_type', type);
    if (location) params.append('location', location);
    const query = params.toString() ? `?${params.toString()}` : '';
    return get<SocialSignal[]>(`/social-signals${query}`);
  },

  addSocialSignal: (signal: Partial<SocialSignal>): Promise<SocialSignal> => {
    return post<SocialSignal>('/social-signals', signal);
  },

  // Digital Twin
  getState: (eventId: string = 'techhack-2026'): Promise<DigitalTwinState> => {
    return get<DigitalTwinState>(`/digital-twin/events/${eventId}/state`);
  },

  runWhatIf: (
    eventId: string = 'techhack-2026',
    scenario: WhatIfScenarioRequest
  ): Promise<WhatIfScenarioResponse> => {
    return post<WhatIfScenarioResponse>(`/digital-twin/events/${eventId}/what-if`, scenario);
  },

  getImpacts: (eventId: string = 'techhack-2026'): Promise<WeatherImpact[]> => {
    return get<WeatherImpact[]>(`/digital-twin/events/${eventId}/impacts`);
  },

  getAlerts: (eventId: string = 'techhack-2026'): Promise<DigitalTwinAlert[]> => {
    return get<DigitalTwinAlert[]>(`/digital-twin/events/${eventId}/alerts`);
  },

  executeReplan: (
    eventId: string = 'techhack-2026',
    replanReq: ReplanRequest = { trigger: 'weather_cascade' }
  ): Promise<ReplanResponse> => {
    return post<ReplanResponse>(`/digital-twin/events/${eventId}/replan`, replanReq);
  },
};
