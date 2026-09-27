"""
Weather API endpoints for live and forecast weather data.
"""

from fastapi import APIRouter, Query
from app.schemas.weather import WeatherCurrent, WeatherForecast
from app.services import weather_service

router = APIRouter(prefix="/weather", tags=["weather"])


@router.get("/current", response_model=WeatherCurrent, summary="Get current live weather")
def get_current(
    lat: float = Query(weather_service.DEFAULT_LAT, description="Latitude"),
    lon: float = Query(weather_service.DEFAULT_LON, description="Longitude"),
):
    """
    Returns live weather (temperature, humidity, precipitation rate, wind, condition)
    from Open-Meteo API, with fallback to deterministic simulated data if offline.
    """
    return weather_service.get_current_weather(lat, lon)


@router.get("/forecast", response_model=WeatherForecast, summary="Get hourly weather forecast")
def get_forecast(
    lat: float = Query(weather_service.DEFAULT_LAT, description="Latitude"),
    lon: float = Query(weather_service.DEFAULT_LON, description="Longitude"),
):
    """Returns next 8-hour weather forecast."""
    return weather_service.get_weather_forecast(lat, lon)
