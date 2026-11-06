"""
AtmosAi Backend Configuration & Environment Management
Ensures repository root is accessible on sys.path for ML package imports.
"""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Ensure backend directory and repository root are on sys.path for clean cross-module imports
CORE_DIR = Path(__file__).resolve().parent
APP_DIR = CORE_DIR.parent
BACKEND_DIR = APP_DIR.parent
REPO_ROOT = BACKEND_DIR.parent

for candidate_path in [BACKEND_DIR, REPO_ROOT]:
    path_str = str(candidate_path)
    if path_str not in sys.path:
        sys.path.insert(0, path_str)

# Load unified environment variables
for env_file in [
    REPO_ROOT / ".env",
    BACKEND_DIR / ".env",
    CORE_DIR / ".env"
]:
    if env_file.exists():
        load_dotenv(dotenv_path=env_file, override=True)
load_dotenv()

# Server Settings
HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", "8000"))
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

# CORS Origins
FRONTEND_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:4173",
    "http://127.0.0.1:4173",
    FRONTEND_URL
]

# API Keys & Secrets
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY") or ""
ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY") or ""
ELEVENLABS_VOICE_ID = os.getenv("ELEVENLABS_VOICE_ID", "21m00Tcm4TlvDq8ikWAM")
TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID") or ""
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN") or ""
TWILIO_PHONE_NUMBER = os.getenv("TWILIO_PHONE_NUMBER") or ""
RESEND_API_KEY = os.getenv("RESEND_API_KEY") or ""
RESEND_FROM_EMAIL = os.getenv("RESEND_FROM_EMAIL", "onboarding@resend.dev")

# Supabase Settings
SUPABASE_URL = os.getenv("SUPABASE_URL") or os.getenv("VITE_SUPABASE_URL") or ""
SUPABASE_KEY = os.getenv("SUPABASE_KEY") or os.getenv("VITE_SUPABASE_ANON_KEY") or ""

# ML Model Settings
DEFAULT_ML_MODEL_PATH = REPO_ROOT / "ml" / "models" / "lgbm_inversion.pkl"
ML_MODEL_PATH = os.getenv("ML_MODEL_PATH") or str(DEFAULT_ML_MODEL_PATH)
