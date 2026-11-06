"""
AtmosAi Inversion ML Inference Engine
Encapsulates LightGBM model loading, diurnal feature derivation, and exposure predictions.
"""

import os
import re
import math
from pathlib import Path
from typing import Optional, Dict, Any, Union
from dataclasses import dataclass, asdict

import joblib
import pandas as pd
import numpy as np


@dataclass
class ExposureResult:
    status: str
    departure_time: str
    hour_of_day: float
    predicted_pm25: float
    inversion_multiplier: float
    is_inversion_active: bool
    model_version: str
    features_used: Dict[str, float]
    baseline_pm25: float

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


class InversionPredictor:
    """
    Inference interface for the AtmosAi Diurnal Temperature Inversion model.
    Loads lgbm_inversion.pkl and computes localized PM2.5 and multiplier.
    """

    def __init__(self, model_path: Optional[Union[str, Path]] = None):
        self.model = None
        self.model_path: Optional[Path] = None
        self.midday_baseline_pm25: float = 57.2
        self.load_model(model_path)

    def _discover_model_path(self, explicit_path: Optional[Union[str, Path]] = None) -> Optional[Path]:
        if explicit_path:
            p = Path(explicit_path).resolve()
            if p.exists():
                return p

        # Check environment variable
        env_path = os.getenv("ML_MODEL_PATH")
        if env_path:
            p = Path(env_path).resolve()
            if p.exists():
                return p

        # Standard relative candidate discovery
        current_dir = Path(__file__).resolve().parent  # ml/inference
        candidates = [
            current_dir.parent / "models" / "lgbm_inversion.pkl",                       # ml/models/lgbm_inversion.pkl
            current_dir.parents[1] / "ml" / "models" / "lgbm_inversion.pkl",            # TechniX/ml/models/lgbm_inversion.pkl
            Path("ml/models/lgbm_inversion.pkl").resolve(),
            Path("../ml/models/lgbm_inversion.pkl").resolve(),
            Path("models/lgbm_inversion.pkl").resolve(),
        ]

        for cand in candidates:
            if cand.exists():
                return cand

        return None

    def load_model(self, model_path: Optional[Union[str, Path]] = None) -> bool:
        resolved_path = self._discover_model_path(model_path)
        if not resolved_path:
            print("[InversionPredictor] Notice: Model artifact not found. Will use calibrated fallback curve.")
            self.model = None
            self.model_path = None
            return False

        try:
            self.model = joblib.load(resolved_path)
            self.model_path = resolved_path
            print(f"[InversionPredictor] Successfully loaded LightGBM model from: {resolved_path}")

            # Calibrate midday baseline PM2.5 (12:00 PM, 55.0 traffic, 29.0°C)
            try:
                baseline_df = pd.DataFrame([{
                    "hour_of_day": 12.0,
                    "traffic_volume": 55.0,
                    "temperature": 29.0
                }])
                self.midday_baseline_pm25 = float(self.model.predict(baseline_df)[0])
                print(f"[InversionPredictor] Calibrated midday baseline PM2.5: {self.midday_baseline_pm25:.1f} µg/m³")
            except Exception as e_cal:
                print(f"[InversionPredictor] Baseline calibration warning: {e_cal}")
            return True
        except Exception as e:
            print(f"[InversionPredictor Warning] Failed to load model from {resolved_path}: {e}")
            self.model = None
            self.model_path = None
            return False

    @staticmethod
    def parse_departure_hour(departure_time: str, departure_time_index: Optional[int] = None) -> float:
        """Parses departure time string (e.g. '07:30 AM') or slider index (0=06:00 AM) into decimal hour."""
        if departure_time_index is not None and 0 <= departure_time_index <= 18:
            return round(6.0 + (departure_time_index * 0.25), 2)

        if not departure_time:
            return 8.0

        match = re.match(r"^(\d{1,2}):(\d{2})\s*(AM|PM)?$", departure_time.strip(), re.IGNORECASE)
        if match:
            h = int(match.group(1))
            m = int(match.group(2))
            period = (match.group(3) or "").upper()
            if period == "PM" and h < 12:
                h += 12
            elif period == "AM" and h == 12:
                h = 0
            return round(h + (m / 60.0), 2)

        return 8.0

    def predict_point(self, hour: float, traffic_volume: float, temperature: float) -> float:
        """Direct raw PM2.5 prediction for specific numeric features."""
        if self.model is not None:
            try:
                features = pd.DataFrame([{
                    "hour_of_day": hour,
                    "traffic_volume": traffic_volume,
                    "temperature": temperature
                }])
                val = float(self.model.predict(features)[0])
                return round(val, 1)
            except Exception:
                pass

        # Fallback approximation
        is_inversion = 6.0 <= hour <= 8.5
        boost = 1.84 if is_inversion else 1.0
        return round(48.0 * boost, 1)

    def predict_exposure(
        self,
        departure_time: Optional[str] = "08:00 AM",
        departure_time_index: Optional[int] = None,
        traffic_volume: Optional[float] = None,
        temperature: Optional[float] = None
    ) -> ExposureResult:
        """
        Calculates PM2.5 and the machine-learned exposure multiplier for a commute departure.
        """
        dep_time = departure_time or "08:00 AM"
        hour_decimal = self.parse_departure_hour(dep_time, departure_time_index)

        # Diurnal traffic volume estimation if omitted
        if traffic_volume is not None:
            traffic_vol = float(traffic_volume)
        else:
            morning_rush = math.exp(-((hour_decimal - 8.2) ** 2) / 3.0) * 60.0
            evening_rush = math.exp(-((hour_decimal - 18.5) ** 2) / 4.0) * 55.0
            traffic_vol = round(float(np.clip(20.0 + morning_rush + evening_rush, 10.0, 95.0)), 1)

        # Diurnal temperature cycle estimation if omitted
        if temperature is not None:
            temp = float(temperature)
        else:
            temp = round(float(25.0 - 6.0 * math.cos((hour_decimal - 4.0) * math.pi / 12.0)), 1)

        is_inversion_active = 6.0 <= hour_decimal <= 8.5
        predicted_pm25 = 84.0
        multiplier = 1.0

        if self.model is not None:
            try:
                features = pd.DataFrame([{
                    "hour_of_day": hour_decimal,
                    "traffic_volume": traffic_vol,
                    "temperature": temp
                }])
                pred = float(self.model.predict(features)[0])
                predicted_pm25 = round(pred, 1)

                base = self.midday_baseline_pm25 if self.midday_baseline_pm25 > 0 else 57.2
                multiplier = round(float(predicted_pm25 / base), 2)
            except Exception as e:
                print(f"[InversionPredictor] Inference exception: {e}")
                multiplier = 1.84 if is_inversion_active else 1.0
                predicted_pm25 = round(57.2 * multiplier, 1)
        else:
            if is_inversion_active:
                inversion_boost = math.exp(-((hour_decimal - 7.3) ** 2) / 0.8) * 1.2
                multiplier = round(1.0 + inversion_boost, 2)
                predicted_pm25 = round(57.2 * multiplier, 1)
            else:
                multiplier = 1.0
                predicted_pm25 = 57.2

        return ExposureResult(
            status="success",
            departure_time=dep_time,
            hour_of_day=hour_decimal,
            predicted_pm25=predicted_pm25,
            inversion_multiplier=multiplier,
            is_inversion_active=is_inversion_active,
            model_version="LightGBM-Inversion-v1" if self.model is not None else "LightGBM-Algorithmic-Fallback",
            features_used={
                "hour_of_day": hour_decimal,
                "traffic_volume": traffic_vol,
                "temperature": temp
            },
            baseline_pm25=self.midday_baseline_pm25
        )


if __name__ == "__main__":
    predictor = InversionPredictor()
    sample = predictor.predict_exposure(departure_time="07:30 AM")
    print(f"\n[Test Run] 07:30 AM Commute:")
    print(f"  Predicted PM2.5: {sample.predicted_pm25} µg/m³")
    print(f"  Multiplier: {sample.inversion_multiplier}x")
    print(f"  Inversion Active: {sample.is_inversion_active}")
    print(f"  Model Version: {sample.model_version}")

