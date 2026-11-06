# 🌍 AtmosAi (V2) - Intelligent Air Quality & Commute Shield
> **Built for Environmental Hackathon 2026 by Team TechniX**

AtmosAi is a cross-platform, real-time environmental early-warning and route exposure optimization platform. By combining high-frequency IoT telemetry, trigonometric 3D ambient particle physics, machine learning exposure modeling, and generative AI agents, AtmosAi empowers urban commuters and sensitive demographics to protect their respiratory health before stepping outside.

---

## 🏛️ Modular Repository Architecture

The project is organized into four decoupled modules:

```text
AtmosAI/
├── frontend/                   # React 19 + TypeScript + Vite + Tailwind CSS
│   ├── src/                    # Components, views, 3D particle canvas, context, API client
│   ├── public/                 # Static assets, PWA manifest, and SVG icons
│   └── package.json            # Frontend dependency manifest
│
├── backend/                    # Python FastAPI ASGI Server
│   ├── app/
│   │   ├── api/                # API router & endpoint definitions
│   │   ├── services/           # Inversion, Gemini, Telemetry, SOS, Voice
│   │   ├── core/               # Configuration, sys.path resolution, Supabase JWT auth
│   │   └── schemas/            # Pydantic request & response models
│   ├── main.py                 # ASGI entry point
│   └── requirements.txt        # Backend dependencies
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
├── docs/                       # Architecture & API documentation
├── README.md                   # Root project documentation
└── .gitignore                  # Unified ignore rules (preserves !ml/models/lgbm_inversion.pkl)
```

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js** v20+ and **npm**
- **Python** 3.10+

### 2. Backend Setup
```bash
cd backend
python -m venv venv
.\venv\Scripts\activate   # On Windows (or source venv/bin/activate on Linux/macOS)
pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000
```
Backend will be live at `http://127.0.0.1:8000` with Swagger docs at `http://127.0.0.1:8000/docs`.

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173/` in your browser.

### 4. Machine Learning Module
```bash
cd ml
pip install -r requirements.txt
python evaluation/evaluate.py   # Verify LightGBM inversion predictions
python training/train.py        # Retrain model and export weights to ml/models/
```

### 5. Supabase Setup
Follow instructions in [`supabase/README.md`](supabase/README.md) to apply the canonical schema in the Supabase Dashboard SQL Editor.

---

## 📄 License
MIT © 2026 Team TechniX.
