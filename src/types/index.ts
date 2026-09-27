// =====================
// Core domain types matching backend schemas exactly
// =====================

// --- Events ---
export interface Event {
  id: string;
  name: string;
  location: string;
  expected_attendance: number;
  current_attendance: number;
  status: 'scheduled' | 'ongoing' | 'ending' | 'ended';
}

export interface EventCreate {
  name: string;
  location: string;
  expected_attendance: number;
  current_attendance?: number;
  status?: string;
}

export interface EventUpdate {
  name?: string;
  location?: string;
  expected_attendance?: number;
  current_attendance?: number;
  status?: string;
}

// --- Crowd ---
export interface Crowd {
  location_id: string;
  name: string;
  occupancy: number; // 0-100 percentage
  capacity: number;
  status: 'NORMAL' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  timestamp: string;
}

export interface CrowdPrediction {
  location_id: string;
  current_percentage: number;
  predicted_15_min: number;
  predicted_30_min: number;
  risk: string;
  reasons: string[];
}

// --- Roads ---
export interface Road {
  road_id: string;
  name: string;
  congestion: number; // 0-100 percentage
  average_speed: number; // km/h
  predicted_travel_time: number; // minutes
}

export interface RoutePredictionRequest {
  distance_km: number;
  normal_travel_time: number;
  congestion: number;
  nearby_crowd?: number;
  event_attendance?: number;
  road_capacity?: number;
  average_speed?: number;
}

export interface RoutePredictionResponse {
  distance_km: number;
  predicted_travel_time: number;
  congestion: number;
}

// --- Partners ---
export interface Partner {
  id: string;
  name: string;
  type: 'restaurant' | 'parking' | 'shuttle' | 'hotel' | 'transport';
  capacity: number;
  occupancy: number; // 0-100 percentage
  waiting_time: number;
  rating: number;
  offer: number; // discount amount
  verified: boolean;
}

export interface PartnerCreate {
  name: string;
  type: string;
  capacity: number;
  occupancy?: number;
  waiting_time?: number;
  rating?: number;
  offer?: number;
  verified?: boolean;
}

export interface PartnerUpdate {
  name?: string;
  type?: string;
  capacity?: number;
  occupancy?: number;
  waiting_time?: number;
  rating?: number;
  offer?: number;
  verified?: boolean;
}

// --- Routes ---
export interface RouteOption {
  route_id: string;
  name: string;
  distance_km: number;
  congestion: number;
  predicted_travel_time: number;
}

// --- Recommendations ---
export interface Recommendation {
  id: string;
  name: string;
  type: string;
  score: number;
  distance: number;
  occupancy: number;
  waiting_time: number;
  predicted_crowd: number;
  predicted_travel_time?: number;
  reason: string;
}

export interface RecommendationRequest {
  visitor_preference?: 'balanced' | 'low_crowd' | 'fastest' | 'cheapest';
  price_level_max?: number;
  exclude_ids?: string[];
}

export interface RecommendationChoiceRequest {
  chosen_id?: string;
  rejected_id?: string;
}

// --- Simulation ---
export interface SimulationState {
  simulation_running: boolean;
  event_attendance: number;
  event_progress: number;
  stadium_crowd: number;
  road_congestion: Record<string, number>;
  restaurants: Record<string, unknown>;
  partners: Record<string, unknown>;
}

export interface SetAttendanceRequest {
  event_attendance: number;
}

export interface CrowdSurgeRequest {
  location_id?: string;
  amount?: number;
}

export interface TrafficJamRequest {
  road_id?: string;
  amount?: number;
}

export interface RestaurantOccupancyRequest {
  partner_id: string;
  occupancy: number;
}

// --- Questionnaire ---
export interface ZoneInput {
  name: string;
  capacity?: number;
  capacity_type?: 'known' | 'estimated' | 'unknown';
  location?: string;
  restrictions?: string;
}

export interface EntranceInput {
  name: string;
  capacity?: number;
  location?: string;
  restrictions?: string;
}

export interface ExitInput {
  name?: string;
  capacity?: number;
  location?: string;
}

export interface ActivityInput {
  name: string;
  start: string;
  end: string;
  expected_attendance?: number;
  zone?: string;
  mandatory?: 'yes' | 'no' | 'unknown';
}

export interface GroupsInput {
  enabled: boolean;
  count?: number;
  average_size?: number;
  keep_together?: 'yes' | 'no' | 'not_important';
}

export interface ResourceDetail {
  selected: boolean;
  detail?: string;
}

export interface ResourcesInput {
  food: ResourceDetail;
  parking: ResourceDetail;
  public_transport: ResourceDetail;
  shuttle: ResourceDetail;
  registration: ResourceDetail;
  restrooms: ResourceDetail;
  medical: ResourceDetail;
  security: ResourceDetail;
  exhibition: ResourceDetail;
  accommodation: ResourceDetail;
  other?: string;
}

export type PriorityOption =
  | 'avoid_overcrowding'
  | 'reduce_entry_queues'
  | 'reduce_waiting_time'
  | 'balance_entrances'
  | 'avoid_room_congestion'
  | 'manage_food_crowds'
  | 'manage_parking'
  | 'manage_transportation'
  | 'smooth_event_exit'
  | 'keep_groups_together'
  | 'emergency_preparedness'
  | 'other';

export interface QuestionnaireSubmission {
  event_type: string;
  event_type_other?: string;
  expected_attendance: number;
  expected_peak_attendance?: number;
  venue_name: string;
  venue_city: string;
  venue_type: 'indoor' | 'outdoor' | 'both';
  venue_description?: string;
  zones: ZoneInput[];
  entrances: EntranceInput[];
  entrances_count_only?: number;
  normal_exits: ExitInput[];
  normal_exits_count_only?: number;
  emergency_exits: ExitInput[];
  emergency_exits_count_only?: number;
  activities: ActivityInput[];
  movement_notes?: string;
  groups: GroupsInput;
  resources: ResourcesInput;
  priorities: PriorityOption[];
  priorities_other?: string;
  special_instructions?: string;
}

// --- Planning ---
export interface GateAllocation {
  name: string;
  share_percentage: number;
  expected_attendance: number;
  basis: string;
}

export interface ZoneCongestionEstimate {
  zone: string;
  activity?: string;
  expected_attendance?: number;
  capacity?: number;
  projected_occupancy_percentage?: number;
  status: 'NORMAL' | 'MODERATE' | 'HIGH' | 'CRITICAL' | 'UNKNOWN_CAPACITY';
}

export interface Bottleneck {
  zone_or_gate: string;
  reason: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface ResourceDemand {
  resource: string;
  estimated_demand?: string;
  note?: string;
}

export interface OperationalPlan {
  event_model_id?: string;
  gate_allocation: GateAllocation[];
  zone_congestion: ZoneCongestionEstimate[];
  exit_flow_note?: string;
  bottlenecks: Bottleneck[];
  resource_demand: ResourceDemand[];
  group_handling_note?: string;
  priorities_applied: string[];
  warnings: string[];
}

// --- Auth / User ---
export type UserRole = 'visitor' | 'organizer' | 'partner' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  partnerType?: 'restaurant' | 'hotel' | 'transport';
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupData {
  email: string;
  password: string;
  name: string;
  role: UserRole;
  partnerType?: string;
}

// --- Frontend-only types ---
export type CrowdStatusColor = 'green' | 'yellow' | 'red' | 'gray';

export interface TableEntry {
  id: string;
  number: number;
  seats: number;
  status: 'available' | 'occupied' | 'reserved' | 'cleaning' | 'unavailable';
}

export interface CustomerQueue {
  queue_id: string;
  party_size: number;
  waiting_since: string; // ISO timestamp
  status: 'waiting' | 'seated' | 'completed';
  assigned_table?: string;
}

export interface HotelRoom {
  id: string;
  number: string;
  type: string;
  status: 'available' | 'occupied' | 'reserved' | 'cleaning' | 'maintenance';
  price_per_night?: number;
}

export interface PartnerOffer {
  id: string;
  title: string;
  description: string;
  discount_amount: number;
  minimum_bill?: number;
  active: boolean;
  start_time: string;
  end_time: string;
}

export interface ApiError {
  status: number;
  message: string;
  detail?: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

// =========================================================================
// Midnight Task: Weather-Driven Digital Twin & Social Signals Types
// =========================================================================

export interface WeatherCurrent {
  temperature_c: number;
  humidity: number;
  rainfall_mm_per_hour: number;
  wind_speed_kmh: number;
  condition: string;
  source: string;
  is_live: boolean;
  timestamp: string;
}

export interface WeatherForecastItem {
  time: string;
  temperature_c: number;
  rainfall_mm_per_hour: number;
  condition: string;
}

export interface WeatherForecast {
  city: string;
  current: WeatherCurrent;
  hourly: WeatherForecastItem[];
}

export interface SocialSignal {
  id: string;
  source: string;
  type: string;
  location: string;
  severity: number;
  text: string;
  timestamp: string;
  confidence: number;
  is_live: boolean;
}

export interface DigitalTwinZoneState {
  name: string;
  capacity: number;
  occupancy: number;
  occupancy_percent: number;
  status: string;
  predicted_15_min?: number;
  predicted_30_min?: number;
}

export interface DigitalTwinTransportState {
  road_id: string;
  name: string;
  congestion_percent: number;
  travel_time_minutes: number;
  predicted_travel_time?: number;
  status: string;
}

export interface DigitalTwinPartnerState {
  id: string;
  name: string;
  type: string;
  capacity: number;
  occupancy_percent: number;
  wait_minutes: number;
  offer_discount: number;
}

export interface WeatherImpact {
  source: string;
  target: string;
  impact_type: string;
  change: number;
  reason: string;
  confidence: number;
}

export interface DigitalTwinAlert {
  id: string;
  severity: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL' | string;
  entity: string;
  message: string;
  current_value: string;
  predicted_value: string;
  recommended_action: string;
  action_key?: string;
}

export interface DigitalTwinState {
  timestamp: string;
  event: {
    id: string;
    expected_attendance: number;
    inside: number;
  };
  weather: WeatherCurrent;
  zones: Record<string, DigitalTwinZoneState>;
  transport: Record<string, DigitalTwinTransportState>;
  partners: Record<string, DigitalTwinPartnerState>;
  predictions: Record<string, any>;
  weather_impacts: WeatherImpact[];
  alerts: DigitalTwinAlert[];
  confidence: Record<string, number>;
  is_counterfactual: boolean;
}

export interface WhatIfScenarioRequest {
  rainfall_mm_per_hour: number;
  temperature_c: number;
  wind_speed_kmh: number;
  storm_duration_minutes: number;
  scenario_preset?: string;
}

export interface MetricChange {
  entity: string;
  metric: string;
  before: number;
  after: number;
  unit: string;
  percent_change: number;
}

export interface CascadeStep {
  step: number;
  cause: string;
  effect: string;
  magnitude: string;
}

export interface WhatIfScenarioResponse {
  scenario: WhatIfScenarioRequest;
  baseline: DigitalTwinState;
  simulated: DigitalTwinState;
  changes: MetricChange[];
  cascade: CascadeStep[];
  impacts: WeatherImpact[];
  alerts: DigitalTwinAlert[];
  recommendations: Array<{
    id: string;
    title: string;
    action: string;
    why: string;
    impact: string;
    priority: string;
  }>;
  confidence: Record<string, number>;
}

export interface ReplanRequest {
  trigger?: string;
  what_if_scenario?: WhatIfScenarioRequest;
}

export interface ReplanResponse {
  plan_version: number;
  trigger: string;
  timestamp: string;
  changes: string[];
  expected_result: Record<string, any>;
  gate_allocation: Array<{
    name: string;
    share_percentage: number;
    expected_attendance: number;
    basis: string;
  }>;
  zone_congestion: Array<{
    zone: string;
    activity: string;
    expected_attendance: number;
    capacity: number;
    projected_occupancy_percentage: number;
    status: string;
  }>;
  bottlenecks: Array<{
    zone_or_gate: string;
    reason: string;
    severity: string;
  }>;
}
