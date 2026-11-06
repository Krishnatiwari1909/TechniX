"""
Pydantic Request & Response Schemas for AtmosAi Backend API
"""

from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    message: str = Field(..., description="User message/query for AtmosAi")
    persona: Optional[str] = Field("commuter", description="Active user demographic persona (runner, parent, commuter)")
    user_profile: Optional[Dict[str, Any]] = Field(None, description="Optional profile context")
    current_pm25: Optional[float] = Field(84.0, description="Current localized PM2.5 reading in µg/m³")


class VoiceAlertRequest(BaseModel):
    alert_text: Optional[str] = Field(None, description="Emergency advisory script to convert to voice")
    message: Optional[str] = Field(None, description="Alternative message parameter")
    return_base64: Optional[bool] = Field(False, description="Whether to return base64 JSON instead of audio stream")

    def get_effective_text(self) -> str:
        return self.alert_text or self.message or "High particulate alert. Atmospheric inversion detected."


class SOSRequest(BaseModel):
    contact_number: Optional[str] = Field(None, description="Emergency phone number for SMS alert")
    email: Optional[str] = Field(None, description="Emergency email address for alert notification")
    persona: Optional[str] = Field("Asthma", description="User health profile persona (e.g. Asthma, Runner)")
    current_pm25: Optional[float] = Field(None, description="Current localized PM2.5 level")


class ExposureRequest(BaseModel):
    departure_time: Optional[str] = Field("08:00 AM", description="Selected departure time, e.g. '07:30 AM' or '08:15'")
    departure_time_index: Optional[int] = Field(None, description="Slider step index (0 = 06:00 AM, 18 = 10:30 AM)")
    current_pm25: Optional[float] = Field(None, description="Current ambient PM2.5 reading")
    temperature: Optional[float] = Field(None, description="Ambient temperature in °C")
    traffic_volume: Optional[float] = Field(None, description="Traffic congestion index 0-100")


class ProfileUpdateRequest(BaseModel):
    name: Optional[str] = None
    commute_mode: Optional[str] = None
    sensitivities: Optional[List[str]] = None
    persona: Optional[str] = None
    destination: Optional[str] = None
    emergency_name: Optional[str] = None
    emergency_contact: Optional[str] = None
    commute_time: Optional[str] = None
    return_time: Optional[str] = None
    exposure_multiplier: Optional[float] = None

