"""
AtmosAi Model Evaluation Script
Verifies LightGBM Inversion Regressor predictions across Bengaluru diurnal points.
"""

import sys
from pathlib import Path
from typing import List, Dict, Any

# Ensure repository root is on sys.path when running evaluate.py directly
REPO_ROOT = Path(__file__).resolve().parents[2]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

try:
    from ml.inference.predictor import InversionPredictor
except ImportError:
    from inference.predictor import InversionPredictor


def evaluate_inversion_model() -> List[Dict[str, Any]]:
    predictor = InversionPredictor()

    test_cases = [
        {"departure_time": "06:00 AM", "hour_of_day": 6.0, "traffic_volume": 32.0, "temperature": 18.0, "note": "Early Dawn"},
        {"departure_time": "07:30 AM", "hour_of_day": 7.5, "traffic_volume": 85.0, "temperature": 19.5, "note": "Peak Inversion"},
        {"departure_time": "08:15 AM", "hour_of_day": 8.25, "traffic_volume": 92.0, "temperature": 21.0, "note": "Morning Rush"},
        {"departure_time": "12:00 PM", "hour_of_day": 12.0, "traffic_volume": 55.0, "temperature": 29.0, "note": "Midday Baseline"},
        {"departure_time": "06:30 PM", "hour_of_day": 18.5, "traffic_volume": 88.0, "temperature": 26.0, "note": "Evening Rush"},
        {"departure_time": "11:00 PM", "hour_of_day": 23.0, "traffic_volume": 20.0, "temperature": 20.0, "note": "Late Night"}
    ]

    print("\n=======================================================")
    print("      AtmosAi LightGBM Model Evaluation Summary        ")
    print("=======================================================")
    print(f"Model Loaded: {predictor.model is not None}")
    print(f"Model Path:   {predictor.model_path}")
    print(f"Midday Base:  {predictor.midday_baseline_pm25:.1f} µg/m³\n")
    print(f"{'Time':<12} | {'Note':<16} | {'PM2.5 (µg)':<12} | {'Multiplier':<10} | {'Inversion?'}")
    print("-" * 65)

    results = []
    for tc in test_cases:
        res = predictor.predict_exposure(
            departure_time=tc["departure_time"],
            traffic_volume=tc["traffic_volume"],
            temperature=tc["temperature"]
        )
        inv_str = "YES (Hazard)" if res.is_inversion_active else "No (Normal)"
        print(f"{tc['departure_time']:<12} | {tc['note']:<16} | {res.predicted_pm25:<12.1f} | {res.inversion_multiplier:<10.2f}x | {inv_str}")
        results.append(res.to_dict())

    print("=======================================================\n")
    return results


if __name__ == "__main__":
    evaluate_inversion_model()

