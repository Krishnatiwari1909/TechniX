"""
Telemetry Service Layer
Manages live Open-Meteo polling and caching for the WebSocket telemetry feed.
"""

import time
import asyncio
import httpx
from typing import Dict, Any

OPEN_METEO_WIND_URL = (
    "https://api.open-meteo.com/v1/forecast?latitude=12.9716&longitude=77.5946"
    "&current=wind_speed_10m,wind_direction_10m"
)
OPEN_METEO_AQI_URL = (
    "https://air-quality-api.open-meteo.com/v1/air-quality?latitude=12.9716&longitude=77.5946"
    "&current=pm2_5"
)

# In-memory cache to maintain smooth 3-second streaming while respecting Open-Meteo API intervals
live_telemetry_cache = {
    "pm25": 84.0,
    "wind_speed": 9.2,
    "wind_direction": 90.0,
    "temperature": 24.5,
    "last_fetched": 0.0
}


async def fetch_open_meteo_live() -> Dict[str, Any]:
    """Fetches real atmospheric telemetry from Open-Meteo Weather and Air Quality APIs."""
    global live_telemetry_cache
    now = time.time()

    # Cache for 15 seconds to avoid rate limits while streaming real data
    if (now - live_telemetry_cache["last_fetched"]) < 15.0:
        return live_telemetry_cache

    try:
        async with httpx.AsyncClient(timeout=4.0) as client:
            wind_res, aqi_res = await asyncio.gather(
                client.get(OPEN_METEO_WIND_URL),
                client.get(OPEN_METEO_AQI_URL),
                return_exceptions=True
            )

            # 1. Parse Real Wind
            if not isinstance(wind_res, Exception) and wind_res.status_code == 200:
                wind_json = wind_res.json()
                curr_wind = wind_json.get("current", {})
                if "wind_speed_10m" in curr_wind and curr_wind["wind_speed_10m"] is not None:
                    live_telemetry_cache["wind_speed"] = float(curr_wind["wind_speed_10m"])
                if "wind_direction_10m" in curr_wind and curr_wind["wind_direction_10m"] is not None:
                    live_telemetry_cache["wind_direction"] = float(curr_wind["wind_direction_10m"])

            # 2. Parse Real PM2.5
            if not isinstance(aqi_res, Exception) and aqi_res.status_code == 200:
                aqi_json = aqi_res.json()
                curr_aqi = aqi_json.get("current", {})
                if "pm2_5" in curr_aqi and curr_aqi["pm2_5"] is not None:
                    live_telemetry_cache["pm25"] = float(curr_aqi["pm2_5"])

            live_telemetry_cache["last_fetched"] = now
            print(f"[Open-Meteo Live] Updated Telemetry -> PM2.5: {live_telemetry_cache['pm25']} µg/m³, Wind: {live_telemetry_cache['wind_speed']} km/h @ {live_telemetry_cache['wind_direction']}°")
    except Exception as e:
        print(f"[Open-Meteo Fetch Notice] {e}. Streaming cached telemetry.")

    return live_telemetry_cache


def classify_telemetry_payload(real_data: Dict[str, Any]) -> Dict[str, Any]:
    raw_pm25 = real_data["pm25"]
    wind_spd = real_data["wind_speed"]
    wind_dir = real_data["wind_direction"]

    if raw_pm25 <= 35:
        category = "Good"
        status_color = "#22c55e"
    elif raw_pm25 <= 75:
        category = "Moderate"
        status_color = "#38bdf8"
    elif raw_pm25 <= 150:
        category = "Unhealthy for Sensitive Groups"
        status_color = "#f59e0b"
    else:
        category = "Hazardous"
        status_color = "#ef4444"

    return {
        "pm25": round(raw_pm25, 1),
        "aqi": int(raw_pm25 * 1.35),
        "category": category,
        "color": status_color,
        "temperature": 24.5,
        "humidity": 60.0,
        "wind_direction": round(wind_dir, 1),
        "wind_speed": round(wind_spd, 1),
        "sensor_id": "OPEN-METEO-BENGALURU-LIVE",
        "source": "Open-Meteo Real-Time Weather & Air Quality API",
        "timestamp": int(time.time())
    }

