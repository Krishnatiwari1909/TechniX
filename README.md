# 🌍 AtmosAi (V2) - Intelligent Air Quality & Commute Shield
> **Built for Environmental Hackathon 2026 by Team TechniX**

AtmosAi is a cross-platform, real-time environmental early-warning and route exposure optimization platform. By combining high-frequency IoT telemetry, trigonometric 3D ambient particle physics, machine learning exposure modeling, and generative AI agents, AtmosAi empowers urban commuters and sensitive demographics to protect their respiratory health before stepping outside.

---

## 🚀 Key Features

### 1. 🌐 Real-Time Telemetry & Ambient Particulate Engine
- **Live WebSocket Pipeline**: Streams live PM2.5 concentrations, wind speed, and wind direction from IoT sensors at `/ws/telemetry`.
- **Trigonometric 3D Particle Drift**: Uses **React Three Fiber** and `<instancedMesh>` with `THREE.SphereGeometry`. Particles physically drift according to real-time wind vectors ($\vec{v} = (\cos(\theta), \sin(\theta))$) with sine-wave vertical wobble.
- **Rolling Sparkline**: 10-point rolling telemetry window rendered with Recharts for micro-trend observation.

### 2. 🗺️ Clean Route Optimization & Live Crosswind Compass
- **Interactive Leaflet Cartography**: Side-by-side comparison between the **Fastest Arterial Highway** (high particulate canyon) and the **Healthiest Green Canopy Corridor** (protected parkside path).
- **Transport Mode Exposure Adjuster**: Dynamic inhaled dose computation calibrated by mode ventilation factors:
  - 🚶 **Walk**: $2.0\times$ (heavy aerobic minute ventilation)
  - 🚲 **Bike**: $1.5\times$ (road canyon exertion)
  - 🚌 **Transit**: $1.0\times$ (standard cabin exposure)
  - 🚗 **Car**: $0.5\times$ (filtered AC cabin)
- **Live Wind Compass Widget**: Semi-transparent HUD widget showing real-time crosswind angle with a smoothly rotating aerodynamic vector needle and cardinal direction readouts.

### 3. ⏳ Diurnal Inversion & Time-Shift Departure Simulation
- **Morning Inversion Engine**: Identifies hazardous ground-level temperature inversions between 06:00 AM and 08:30 AM, automatically applying a $1.3\times$ exposure surcharge with contextual alert badges.
- **Lungs Saved Metric**: Converts microgram particulate avoidance into Berkeley Earth cigarette equivalents ($22\,\mu\text{g/m}^3 \approx 1\text{ cigarette/day}$).
- **Interactive Departure Slider for the application**: Interactive slider comparing exposure at 15-minute intervals throughout peak traffic periods.

### 4. 🤖 Generative AI & Emergency Shield
- **Morning Commute Briefing**: One-click AI commute safety briefing powered by **Google Gemini 3.5 Flash**, factoring in destination and transport mode.
- **AI Voice Shield**: Voice broadcasts via **ElevenLabs TTS** with an automatic, zero-dependency offline fallback to browser **Web Speech API** (`window.speechSynthesis`).
- **Emergency SOS Dispatch**: Emergency dispatch integration with Twilio SMS and Resend email alerts.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Lucide React, Recharts
- **3D Visualization**: Three.js, React Three Fiber (`@react-three/fiber`), `@react-three/drei`
- **Mapping**: Leaflet, React-Leaflet, CartoDB Dark Matter tiles, GeoJSON
- **Backend**: Python 3.12, FastAPI, Uvicorn, WebSockets
- **AI / Voice**: Google Gemini 1.5 Flash, ElevenLabs TTS, Web Speech API

---

## 📦 Getting Started

### 1. Prerequisites
- **Node.js** v20+ and **npm**
- **Python** 3.10+

### 2. Backend Setup
```bash
cd AtmosAi/backend
python -m venv venv
.\venv\Scripts\activate   # On Windows
pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000
```
Backend will be live at `http://127.0.0.1:8000` with Swagger docs at `http://127.0.0.1:8000/docs`.

### 3. Frontend Setup
```bash
cd AtmosAi
npm install
npm run dev
```
Open `http://localhost:5173/` in your browser.

---

## 📄 License
MIT © 2026 Team TechniX.
