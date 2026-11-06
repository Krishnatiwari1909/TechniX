"""
AtmosAi FastAPI Server Entry Point
Modular ASGI server orchestrating routes, CORS, and ML services.
"""

import sys
from pathlib import Path

# Add backend directory and repository root to sys.path
CURRENT_DIR = Path(__file__).resolve().parent
REPO_ROOT = CURRENT_DIR.parent
for p in [CURRENT_DIR, REPO_ROOT]:
    p_str = str(p)
    if p_str not in sys.path:
        sys.path.insert(0, p_str)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

try:
    from app.core.config import FRONTEND_ORIGINS, HOST, PORT
    from app.api.routes import router as api_router
    from app.services.inversion import get_inversion_predictor
except ImportError:
    from backend.app.core.config import FRONTEND_ORIGINS, HOST, PORT
    from backend.app.api.routes import router as api_router
    from backend.app.services.inversion import get_inversion_predictor

# Initialize FastAPI application
app = FastAPI(
    title="AtmosAi Backend API",
    description="Contextual Air Quality AI, Real-time Open-Meteo Telemetry, LightGBM Model Serving, and Emergency SOS Dispatch Server",
    version="3.1.0"
)

# Configure CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=FRONTEND_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Router
app.include_router(api_router)


@app.on_event("startup")
async def startup_event():
    predictor = get_inversion_predictor()
    if predictor.model is None:
        print("[Startup] Initializing LightGBM inversion model...")
        predictor.load_model()


if __name__ == "__main__":
    import uvicorn
    print(f"[AtmosAi] Starting server at http://{HOST}:{PORT}")
    uvicorn.run("main:app", host=HOST, port=PORT, reload=True)
