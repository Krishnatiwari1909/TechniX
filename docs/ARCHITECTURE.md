# 🏛️ AtmosAi V2 — Modular Architecture Documentation

AtmosAi is structured into four independent, self-contained modules designed for clean separation of concerns, easy deployment, and maintainability.

---

## 📦 Directory Structure

```text
AtmosAI/
├── frontend/                   # React 19 + TypeScript + Vite + Tailwind CSS
│   ├── src/                    # Components, views, 3D particle canvas, context, API client
│   ├── public/                 # Static assets, PWA manifest, and SVG icons
│   ├── vite.config.ts          # Vite build config with /api proxy to FastAPI
│   └── package.json            # Frontend dependency manifest
│
├── backend/                    # Python FastAPI ASGI Server
│   ├── app/
│   │   ├── api/                # API router & endpoint definitions
│   │   ├── services/           # Business logic: Inversion, Gemini, Telemetry, SOS, Voice
│   │   ├── core/               # App configuration, sys.path resolution, Supabase JWT auth
│   │   └── schemas/            # Pydantic request & response models
│   ├── main.py                 # ASGI entry point
│   └── requirements.txt        # Backend dependencies (FastAPI, LightGBM, Gemini, etc.)
│
├── ml/                         # LightGBM Inversion Regressor & Exposure Modeling
│   ├── models/                 # Canonical model weights (lgbm_inversion.pkl)
│   ├── inference/              # InversionPredictor interface & exposure calculations
│   ├── training/               # Synthetic dataset generator & LightGBM trainer
│   ├── evaluation/             # Model verification & diurnal test benchmark
│   └── requirements.txt        # Machine learning dependencies
│
├── supabase/                   # Database & Authentication
│   ├── migrations/             # Timestamped SQL migration files
│   ├── schema.sql              # Canonical profiles table & RLS policies
│   ├── seed.sql                # Development seed script
│   └── README.md               # Supabase migration guide
│
├── docs/                       # Architectural & API specifications
├── README.md                   # Root repository overview
└── .gitignore                  # Unified ignore rules with !ml/models/lgbm_inversion.pkl
```

---

## 🔄 Cross-Module Communication

1. **Frontend $\longleftrightarrow$ Backend:**
   - Frontend communicates via `frontend/src/lib/api.ts`.
   - In development, Vite dev server proxies `/api` to `http://127.0.0.1:8000`.
   - In production, `VITE_API_URL` configures the backend base URL.
   - Live telemetry streams via `ws://localhost:8000/ws/telemetry`.

2. **Backend $\longleftrightarrow$ ML:**
   - `backend/app/core/config.py` automatically injects the repository root into `sys.path`.
   - `backend/app/services/inversion.py` cleanly imports `InversionPredictor` from `ml.inference.predictor`.
   - `InversionPredictor` automatically resolves the canonical weights at `ml/models/lgbm_inversion.pkl`.

3. **Backend & Frontend $\longleftrightarrow$ Supabase:**
   - Frontend uses Supabase JS client for GoTrue email/password authentication.
   - Backend verifies Supabase JWT tokens via `verify_supabase_user` dependency.

