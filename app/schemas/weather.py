"""
Weather schemas for Digital Twin & external live weather services.
"""

from typing import Optional, List
from pydantic import BaseModel, Field


class WeatherCurrent(BaseModel):
    temperature_c: float = Field(..., description="Current temperature in Celsius")
    humidity: float = Field(..., ge=0, le=100, description="Relative humidity %")
    rainfall_mm_per_hour: float = Field(0.0, ge=0, description="Precipitation rate mm/h")
    wind_speed_kmh: float = Field(..., ge=0, description="Wind speed in km/h")
    condition: str = Field("clear", description="clear | cloudy | rain | storm | extreme_heat")
    source: str = Field("open-meteo", description="API source or simulated_fallback")
    is_live: bool = Field(True, description="True if fetched from live API, False if simulated fallback")
    timestamp: str


class WeatherForecastItem(BaseModel):
    time: str
    temperature_c: float
    rainfall_mm_per_hour: float
    condition: str


class WeatherForecast(BaseModel):
    city: str
    current: WeatherCurrent
    hourly: List[WeatherForecastItem] = []
