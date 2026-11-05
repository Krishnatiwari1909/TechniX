"""
AtmosAi Inversion & Exposure Machine Learning Model Trainer
Trains a LightGBM Regressor on synthetic real-world atmospheric telemetry
mapping hour_of_day, traffic_volume, and temperature to PM2.5 inversion peaks.
"""

import os
from pathlib import Path
import numpy as np
import pandas as pd
import lightgbm as lgb
import joblib

def generate_synthetic_inversion_dataset(n_samples: int = 1000) -> pd.DataFrame:
    np.random.seed(42)

    # 1. Continuous hour of day [0.0 to 24.0)
    hours = np.random.uniform(0.0, 24.0, n_samples)

    # 2. Temperature in Celsius (Bengaluru diurnal cycle: 17°C night/morning to 33°C afternoon)
    base_temp = 25.0 - 6.0 * np.cos((hours - 4.0) * np.pi / 12.0)
    temperature = base_temp + np.random.normal(0.0, 1.8, n_samples)
    temperature = np.clip(temperature, 15.0, 36.0)

    # 3. Traffic Volume (0 - 100 scale), peaking in morning (08:00) and evening (18:30)
    morning_rush = np.exp(-((hours - 8.2) ** 2) / 3.0) * 60.0
    evening_rush = np.exp(-((hours - 18.5) ** 2) / 4.0) * 55.0
    base_traffic = 20.0 + morning_rush + evening_rush + np.random.normal(0.0, 5.0, n_samples)
    traffic_volume = np.clip(base_traffic, 5.0, 100.0)

    # 4. Target PM2.5 Level with Thermal Inversion dynamics
    # Baseline PM2.5 in urban Bengaluru
    base_pm25 = 38.0 + (traffic_volume * 0.35)

    # Inversion Logic: Severe trapping between 06:00 and 08:30 (hours 6.0 to 8.5)
    # Cold ground layer traps diesel soot before solar boundary layer expansion
    inversion_mask = (hours >= 6.0) & (hours <= 8.5)
    inversion_intensity = np.zeros(n_samples)
    
    # Peak inversion around 07:15 - 08:00
    for idx, h in enumerate(hours):
        if 5.8 <= h <= 8.7:
            # Bell curve peaking at 7.25 AM
            inversion_intensity[idx] = np.exp(-((h - 7.3) ** 2) / 0.8) * 68.0

    # Cold temperature enhances nocturnal surface boundary trapping
    temp_inversion_bonus = np.maximum(0.0, (22.0 - temperature) * 2.5)

    # Combined PM2.5 calculation
    pm25_target = base_pm25 + inversion_intensity + temp_inversion_bonus + np.random.normal(0.0, 4.0, n_samples)
    pm25_target = np.clip(pm25_target, 18.0, 195.0)

    df = pd.DataFrame({
        'hour_of_day': np.round(hours, 2),
        'traffic_volume': np.round(traffic_volume, 1),
        'temperature': np.round(temperature, 1),
        'pm25_level': np.round(pm25_target, 1)
    })

    return df

def train_and_export_model():
    print("[AtmosAi ML] Generating synthetic training dataset (1,000 samples)...")
    df = generate_synthetic_inversion_dataset(1000)

    feature_cols = ['hour_of_day', 'traffic_volume', 'temperature']
    X = df[feature_cols]
    y = df['pm25_level']

    print("[AtmosAi ML] Training LightGBM Regressor...")
    model = lgb.LGBMRegressor(
        n_estimators=120,
        learning_rate=0.05,
        max_depth=5,
        num_leaves=31,
        random_state=42,
        verbosity=-1
    )
    model.fit(X, y)

    # Evaluate predictions at specific hours
    test_cases = [
        {"hour_of_day": 7.5, "traffic_volume": 85.0, "temperature": 19.0, "note": "Morning Inversion (07:30 AM)"},
        {"hour_of_day": 8.0, "traffic_volume": 90.0, "temperature": 21.0, "note": "Peak Morning Rush (08:00 AM)"},
        {"hour_of_day": 12.0, "traffic_volume": 55.0, "temperature": 29.0, "note": "Midday Solar Convection (12:00 PM)"},
        {"hour_of_day": 18.5, "traffic_volume": 88.0, "temperature": 26.0, "note": "Evening Commute (06:30 PM)"},
        {"hour_of_day": 23.0, "traffic_volume": 20.0, "temperature": 20.0, "note": "Late Night (11:00 PM)"}
    ]

    test_df = pd.DataFrame(test_cases)
    preds = model.predict(test_df[feature_cols])

    print("\n--- Model Verification & Inversion Validation ---")
    baseline_midday = preds[2] # 12:00 PM
    for i, row in test_df.iterrows():
        multiplier = round(preds[i] / baseline_midday, 2)
        print(f"[{row['note']}] -> Predicted PM2.5: {preds[i]:.1f} µg/m³ (Multiplier: {multiplier}x vs midday)")

    # Save to root and backend directories for robust discovery
    root_dir = Path(__file__).resolve().parent
    export_paths = [
        root_dir / "lgbm_inversion.pkl",
        root_dir / "backend" / "lgbm_inversion.pkl"
    ]

    for p in export_paths:
        try:
            joblib.dump(model, p)
            print(f"[AtmosAi ML] Model exported successfully to: {p}")
        except Exception as e:
            print(f"[AtmosAi ML] Could not save to {p}: {e}")

if __name__ == "__main__":
    train_and_export_model()
