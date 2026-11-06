"""
Inversion Service Layer
Connects FastAPI to the modular ml.inference.predictor package.
"""

from typing import Optional, Dict, Any

try:
    from app.core.config import ML_MODEL_PATH
except ImportError:
    from backend.app.core.config import ML_MODEL_PATH

from ml.inference.predictor import InversionPredictor, ExposureResult

# Singleton instance of InversionPredictor
predictor = InversionPredictor(model_path=ML_MODEL_PATH)


def get_inversion_predictor() -> InversionPredictor:
    return predictor


def calculate_commute_exposure(
    departure_time: Optional[str] = "08:00 AM",
    departure_time_index: Optional[int] = None,
    traffic_volume: Optional[float] = None,
    temperature: Optional[float] = None
) -> Dict[str, Any]:
    res: ExposureResult = predictor.predict_exposure(
        departure_time=departure_time,
        departure_time_index=departure_time_index,
        traffic_volume=traffic_volume,
        temperature=temperature
    )
    return res.to_dict()
