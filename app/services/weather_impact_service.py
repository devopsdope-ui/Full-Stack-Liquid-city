"""
Weather Impact & Cascade Propagation Engine.
Deterministic, explainable dependency propagation connecting:
Rain / Heat / Wind -> Outdoor Movement -> Indoor Crowd -> Cafeteria/Room Demand -> Traffic & Travel Time.
"""

from typing import List, Tuple
from app.schemas.digital_twin import WeatherImpact, CascadeStep
from app.schemas.weather import WeatherCurrent


def compute_weather_cascade(
    weather: WeatherCurrent,
    duration_minutes: int = 30,
    signal_severity_factor: float = 0.0,
) -> Tuple[dict, List[WeatherImpact], List[CascadeStep]]:
    """
    Computes deterministic multipliers and explainable impact steps.
    Returns:
      multipliers dict:
        - outdoor_movement_factor: 1.0 (normal) to 0.4 (heavy rain)
        - indoor_crowd_factor: 1.0 to 1.35
        - cafeteria_demand_factor: 1.0 to 1.40
        - road_congestion_factor: 1.0 to 1.45
        - travel_time_factor: 1.0 to 1.65
        - parking_demand_factor: 1.0 to 1.30
      impacts: List[WeatherImpact]
      cascade_steps: List[CascadeStep]
    """
    rain = weather.rainfall_mm_per_hour
    temp = weather.temperature_c
    wind = weather.wind_speed_kmh
    dur_factor = min(1.5, max(0.8, duration_minutes / 30.0))

    impacts: List[WeatherImpact] = []
    cascade_steps: List[CascadeStep] = []

    # --- 1. Rain Impact ---
    rain_intensity = min(1.0, rain / 50.0)  # 50 mm/h = full saturation

    outdoor_movement_drop = rain_intensity * 0.50 * dur_factor
    indoor_crowd_boost = rain_intensity * 0.30 * dur_factor
    cafeteria_demand_boost = rain_intensity * 0.35 * dur_factor
    road_congestion_boost = (rain_intensity * 0.35 + signal_severity_factor) * dur_factor
    travel_time_boost = (rain_intensity * 0.55 + signal_severity_factor * 1.2) * dur_factor

    # --- 2. Heat Impact ---
    if temp > 35.0:
        heat_intensity = min(1.0, (temp - 35.0) / 10.0)
        outdoor_movement_drop = max(outdoor_movement_drop, heat_intensity * 0.40)
        indoor_crowd_boost += heat_intensity * 0.20
        cafeteria_demand_boost += heat_intensity * 0.25
        impacts.append(
            WeatherImpact(
                source="extreme_heat",
                target="indoor_facilities",
                impact_type="demand_increase",
                change=round(heat_intensity * 20.0, 1),
                reason=f"High ambient temperature ({temp}°C) shifts crowd to air-conditioned halls and hydration points.",
                confidence=0.85,
            )
        )

    # --- 3. Wind Impact ---
    if wind > 40.0:
        wind_intensity = min(1.0, (wind - 40.0) / 40.0)
        outdoor_movement_drop = max(outdoor_movement_drop, wind_intensity * 0.30)
        impacts.append(
            WeatherImpact(
                source="high_wind",
                target="outdoor_zones",
                impact_type="capacity_reduction",
                change=round(-wind_intensity * 25.0, 1),
                reason=f"Strong gusts ({wind} km/h) restrict open canopy and outdoor exhibition access.",
                confidence=0.88,
            )
        )

    # Compile Explainable Impacts
    if rain > 0.5:
        impacts.append(
            WeatherImpact(
                source="rainfall",
                target="outdoor_movement",
                impact_type="movement_decrease",
                change=round(-outdoor_movement_drop * 100, 1),
                reason=f"Precipitation ({rain} mm/h) deters pedestrian transit in open courtyards.",
                confidence=0.92,
            )
        )
        impacts.append(
            WeatherImpact(
                source="reduced_outdoor_movement",
                target="indoor_crowd",
                impact_type="occupancy_increase",
                change=round(indoor_crowd_boost * 100, 1),
                reason="Participants linger inside shelters and lecture halls.",
                confidence=0.89,
            )
        )
        impacts.append(
            WeatherImpact(
                source="indoor_dwell_time",
                target="cafeteria",
                impact_type="demand_increase",
                change=round(cafeteria_demand_boost * 100, 1),
                reason="Participants converge on cafeteria and indoor dining amenities during downpour.",
                confidence=0.84,
            )
        )
        impacts.append(
            WeatherImpact(
                source="surface_water_and_braking",
                target="road_corridors",
                impact_type="congestion_increase",
                change=round(road_congestion_boost * 100, 1),
                reason="Wet roads, reduced vehicular speed, and localized standing water near stadium gates.",
                confidence=0.86,
            )
        )

    # Build Step-by-Step Cascade
    cascade_steps = [
        CascadeStep(
            step=1,
            cause=f"Weather condition ({weather.condition.replace('_', ' ').title()}: {rain}mm/h rain, {temp}°C)",
            effect="Outdoor walkway movement drops",
            magnitude=f"-{round(outdoor_movement_drop * 100)}%",
        ),
        CascadeStep(
            step=2,
            cause="Outdoor movement drops",
            effect="Indoor venue occupancy accumulates",
            magnitude=f"+{round(indoor_crowd_boost * 100)}%",
        ),
        CascadeStep(
            step=3,
            cause="Indoor dwelling & meal-hour overlap",
            effect="Cafeteria & dining queue spikes",
            magnitude=f"+{round(cafeteria_demand_boost * 100)}%",
        ),
        CascadeStep(
            step=4,
            cause="Transit mode shift & wet pavement speeds",
            effect="Road corridor congestion increases",
            magnitude=f"+{round(road_congestion_boost * 100)}%",
        ),
        CascadeStep(
            step=5,
            cause="Road corridor congestion",
            effect="Travel delay to/from venue expands",
            magnitude=f"+{round(travel_time_boost * 100)}%",
        ),
    ]

    multipliers = {
        "outdoor_movement_factor": max(0.35, 1.0 - outdoor_movement_drop),
        "indoor_crowd_factor": 1.0 + indoor_crowd_boost,
        "cafeteria_demand_factor": 1.0 + cafeteria_demand_boost,
        "road_congestion_factor": 1.0 + road_congestion_boost,
        "travel_time_factor": 1.0 + travel_time_boost,
        "parking_demand_factor": 1.0 + min(0.30, rain_intensity * 0.25),
    }

    return multipliers, impacts, cascade_steps
