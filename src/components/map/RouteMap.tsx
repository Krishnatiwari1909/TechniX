import React, { useState } from 'react';
import { MapContainer, TileLayer, GeoJSON, Marker, Popup } from 'react-leaflet';
import type { Feature, LineString } from 'geojson';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  Zap, 
  HeartPulse, 
  Sparkles, 
  MapPin, 
  ShieldCheck, 
  AlertTriangle,
  Footprints,
  Bike,
  Bus,
  Car,
  Compass,
  Wind
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export type RouteType = 'fastest' | 'healthiest';
export type TransportMode = 'walk' | 'bike' | 'transit' | 'car';

const TRANSPORT_MULTIPLIERS: Record<TransportMode, { label: string; multiplier: number; desc: string }> = {
  walk: { label: 'Walk', multiplier: 2.0, desc: 'Heavy aerobic minute ventilation (45L/min)' },
  bike: { label: 'Bike', multiplier: 1.5, desc: 'Active physical exertion in road canyon' },
  transit: { label: 'Transit', multiplier: 1.0, desc: 'Standard ambient cabin exposure' },
  car: { label: 'Car', multiplier: 0.5, desc: 'Enclosed AC vehicle cabin with filtration' }
};

// Helper for cardinal compass directions
const getCardinalDirection = (deg: number): string => {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(((deg % 360) / 22.5)) % 16;
  return directions[index < 0 ? index + 16 : index];
};

// Fixed Point A (Start: MG Road / Cubbon Center) and Point B (End: Koramangala)
const POINT_A: [number, number] = [12.9716, 77.5946]; // [lat, lng]
const POINT_B: [number, number] = [12.9352, 77.6245]; // [lat, lng]

// Mock GeoJSON LineString for Fastest Route (Arterial Highway corridor)
// Note: Standard GeoJSON coordinates are [longitude, latitude]
export const FASTEST_ROUTE_GEOJSON: Feature<LineString> = {
  type: 'Feature',
  properties: {
    id: 'fastest',
    name: 'Fastest Route (Arterial Expressway)',
    distance: '5.2 km',
    exposure: 'High',
    pm25Intake: '18µg',
    color: '#ef4444'
  },
  geometry: {
    type: 'LineString',
    coordinates: [
      [77.5946, 12.9716],
      [77.6025, 12.9670],
      [77.6095, 12.9595],
      [77.6140, 12.9510],
      [77.6185, 12.9430],
      [77.6220, 12.9380],
      [77.6245, 12.9352]
    ]
  }
};

// Mock GeoJSON LineString for Healthiest Route (Parkside & Green Canopy corridor)
export const HEALTHIEST_ROUTE_GEOJSON: Feature<LineString> = {
  type: 'Feature',
  properties: {
    id: 'healthiest',
    name: 'Healthiest Route (Parkside Greenway Bypass)',
    distance: '6.1 km',
    exposure: 'Low',
    pm25Intake: '4µg',
    color: '#22c55e'
  },
  geometry: {
    type: 'LineString',
    coordinates: [
      [77.5946, 12.9716],
      [77.5910, 12.9660],
      [77.5875, 12.9580],
      [77.5920, 12.9490],
      [77.6010, 12.9425],
      [77.6130, 12.9370],
      [77.6245, 12.9352]
    ]
  }
};

// Custom Marker Icons for Point A and Point B
const createCustomPin = (label: string, color: string, glowColor: string) => {
  return L.divIcon({
    className: 'custom-route-pin',
    html: `
      <div style="
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: ${color};
        border: 3px solid #ffffff;
        box-shadow: 0 0 18px ${glowColor}, 0 4px 10px rgba(0,0,0,0.5);
        color: #ffffff;
        font-family: 'Inter', sans-serif;
        font-size: 13px;
        font-weight: 800;
      ">
        ${label}
        <span style="
          position: absolute;
          inset: -4px;
          border-radius: 50%;
          border: 1.5px solid ${color};
          opacity: 0.6;
          animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;
        "></span>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -18]
  });
};

const startPin = createCustomPin('A', '#0284c7', 'rgba(2,132,199,0.85)');
const endPin = createCustomPin('B', '#10b981', 'rgba(16,185,129,0.85)');

export const RouteMap: React.FC = () => {
  const { userProfile, updateProfile, windDirection, windSpeed, departureTimeIndex } = useApp();
  const [activeRoute, setActiveRoute] = useState<RouteType>('healthiest');
  
  // Task 3: Transport Mode Exposure Adjuster
  const [transportMode, setTransportMode] = useState<TransportMode>(() => {
    const mode = userProfile.commuteMode;
    if (mode === 'walking') return 'walk';
    if (mode === 'car') return 'car';
    if (mode === 'transit') return 'transit';
    return 'bike';
  });

  const isFastest = activeRoute === 'fastest';
  const activeGeoJson = isFastest ? FASTEST_ROUTE_GEOJSON : HEALTHIEST_ROUTE_GEOJSON;
  const inactiveGeoJson = isFastest ? HEALTHIEST_ROUTE_GEOJSON : FASTEST_ROUTE_GEOJSON;

  // Task 2: Check if departure time falls between 06:00 and 08:30 (Morning Inversion: 1.3x multiplier)
  const isMorningInversion = departureTimeIndex >= 0 && departureTimeIndex <= 10;
  const inversionMultiplier = isMorningInversion ? 1.3 : 1.0;

  // Task 3: Adjust Est. Exposure and Lungs Saved math dynamically based on transport mode & inversion
  const currentMultiplier = TRANSPORT_MULTIPLIERS[transportMode].multiplier;
  const baseFastestIntake = 18;
  const baseHealthiestIntake = 4;
  const adjustedFastest = Math.round(baseFastestIntake * currentMultiplier * inversionMultiplier * 10) / 10;
  const adjustedHealthiest = Math.round(baseHealthiestIntake * currentMultiplier * inversionMultiplier * 10) / 10;
  const adjustedSaved = Math.round((adjustedFastest - adjustedHealthiest) * 10) / 10;

  const fastestExposureLabel = adjustedFastest > 25 ? 'Critical' : adjustedFastest > 12 ? 'High' : 'Moderate';
  const healthiestExposureLabel = adjustedHealthiest > 6 ? 'Moderate' : 'Low';

  return (
    <div className="w-full space-y-4">
      {/* 1. TOGGLE CONTROL ABOVE THE MAP */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-2 rounded-2xl glass-panel border border-white/10">
        <div className="flex items-center gap-2 px-3 py-1">
          <MapPin className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Route Exposure Optimization
          </span>
        </div>

        {/* Two Toggle Buttons */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950/80 rounded-xl border border-white/10">
          {/* Fastest Route Button */}
          <button
            type="button"
            onClick={() => setActiveRoute('fastest')}
            className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${
              isFastest
                ? 'bg-red-500/20 text-red-400 border border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.35)]'
                : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
            }`}
          >
            <Zap className={`w-3.5 h-3.5 ${isFastest ? 'text-red-400 fill-red-400/20' : ''}`} />
            <span>Fastest Route</span>
          </button>

          {/* Healthiest Route Button */}
          <button
            type="button"
            onClick={() => setActiveRoute('healthiest')}
            className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${
              !isFastest
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 shadow-[0_0_15px_rgba(34,197,94,0.35)]'
                : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
            }`}
          >
            <HeartPulse className={`w-3.5 h-3.5 ${!isFastest ? 'text-emerald-400' : ''}`} />
            <span>Healthiest Route</span>
          </button>
        </div>
      </div>

      {/* Task 3: Transport Mode Exposure Adjuster Toggle Group */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl glass-panel border border-white/10">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Transport Mode:
          </span>
          <span className="text-[10px] text-emerald-300 font-mono px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-800">
            {TRANSPORT_MULTIPLIERS[transportMode].multiplier}x Intake Multiplier
          </span>
        </div>

        <div className="grid grid-cols-4 gap-1.5 p-1 bg-slate-950/80 rounded-xl border border-white/10">
          {(['walk', 'bike', 'transit', 'car'] as TransportMode[]).map((mode) => {
            const isSelected = transportMode === mode;
            const config = TRANSPORT_MULTIPLIERS[mode];
            return (
              <button
                key={mode}
                type="button"
                onClick={() => {
                  setTransportMode(mode);
                  updateProfile({
                    commuteMode: mode === 'walk' ? 'walking' : mode === 'bike' ? 'bicycle' : mode
                  });
                }}
                className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/50 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                    : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
                title={config.desc}
              >
                {mode === 'walk' && <Footprints className="w-3.5 h-3.5" />}
                {mode === 'bike' && <Bike className="w-3.5 h-3.5" />}
                {mode === 'transit' && <Bus className="w-3.5 h-3.5" />}
                {mode === 'car' && <Car className="w-3.5 h-3.5" />}
                <span className="capitalize">{config.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. THE MAP COMPONENT */}
      <div className="relative w-full h-[380px] sm:h-[460px] rounded-2xl overflow-hidden border border-white/10 shadow-2xl glass-panel">
        
        {/* Floating Route Status Overlay */}
        <div className="absolute top-4 left-4 z-[400] max-w-xs sm:max-w-sm p-3 rounded-xl bg-slate-950/85 backdrop-blur-md border border-white/10 shadow-xl pointer-events-none">
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isFastest ? 'bg-red-500 shadow-[0_0_8px_#ef4444]' : 'bg-emerald-500 shadow-[0_0_8px_#22c55e]'
              }`}
            />
            <span className="text-xs font-bold text-white tracking-wide">
              {isFastest ? 'Arterial Highway (Polluted)' : 'Green Canopy Corridor (Protected)'}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Point A (MG Road) &rarr; Point B (Koramangala)
          </p>
        </div>

        {/* Task 1: The Wind Compass Widget (Live Crosswind Telemetry Overlay) */}
        <div 
          className="absolute top-4 right-4 z-[400] p-2.5 rounded-2xl bg-slate-950/85 backdrop-blur-md border border-white/10 shadow-2xl flex items-center gap-2.5 select-none transition-all duration-300 hover:border-cyan-500/40"
          title={`Live wind: ${Math.round(windDirection)}° (${getCardinalDirection(windDirection)}) at ${windSpeed.toFixed(1)} km/h`}
        >
          {/* Compass Dial */}
          <div className="relative w-11 h-11 rounded-full bg-slate-900/90 border border-white/20 flex items-center justify-center shadow-inner">
            {/* Cardinal Markers */}
            <span className="absolute top-0.5 text-[7px] font-black text-cyan-400 font-mono tracking-tighter">N</span>
            <span className="absolute right-1 text-[6px] font-bold text-slate-500 font-mono">E</span>
            <span className="absolute bottom-0.5 text-[6px] font-bold text-slate-500 font-mono">S</span>
            <span className="absolute left-1 text-[6px] font-bold text-slate-500 font-mono">W</span>

            {/* Center Pivot Point */}
            <span className="absolute w-1.5 h-1.5 rounded-full bg-white z-20 shadow-[0_0_4px_white]" />

            {/* Rotating SVG Wind Needle */}
            <div
              className="w-full h-full flex items-center justify-center transition-transform duration-700 ease-out"
              style={{ transform: `rotate(${windDirection || 0}deg)` }}
            >
              <svg
                viewBox="0 0 24 24"
                className="w-7 h-7 drop-shadow-[0_0_6px_rgba(6,182,212,0.8)]"
              >
                {/* Needle Pointing in Wind Vector Direction */}
                <polygon points="12,2 15,11 12,9 9,11" fill="#22d3ee" />
                <polygon points="12,22 14,13 12,15 10,13" fill="#f59e0b" fillOpacity="0.8" />
              </svg>
            </div>
          </div>

          {/* Compass Meta readout */}
          <div className="flex flex-col pr-1">
            <div className="flex items-center gap-1.5">
              <Wind className="w-3 h-3 text-cyan-400" />
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-300">
                Crosswind
              </span>
            </div>
            <div className="text-xs font-mono font-black text-white flex items-center gap-1 mt-0.5">
              <span>{Math.round(windDirection || 0)}°</span>
              <span className="text-cyan-300 font-bold">{getCardinalDirection(windDirection || 0)}</span>
            </div>
            <span className="text-[10px] font-mono text-slate-400 leading-none">
              {(windSpeed || 0).toFixed(1)} km/h
            </span>
          </div>
        </div>

        {/* Map Container */}
        <MapContainer
          center={POINT_A}
          zoom={13}
          zoomControl={false}
          attributionControl={false}
          className="w-full h-full"
          style={{ background: '#0A1128' }}
        >
          {/* CartoDB Dark Matter Tile Layer */}
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            subdomains="abcd"
            maxZoom={19}
          />

          {/* Inactive Route (faint dashed context line) */}
          <GeoJSON
            key={`inactive-${activeRoute}`}
            data={inactiveGeoJson}
            style={{
              color: isFastest ? '#22c55e' : '#ef4444',
              weight: 3.5,
              opacity: 0.35,
              dashArray: '6, 8',
              lineCap: 'round',
              lineJoin: 'round'
            }}
          />

          {/* Active Route Glow Casing */}
          <GeoJSON
            key={`active-glow-${activeRoute}`}
            data={activeGeoJson}
            style={{
              color: isFastest ? '#ef4444' : '#22c55e',
              weight: 12,
              opacity: 0.25,
              lineCap: 'round',
              lineJoin: 'round'
            }}
          />

          {/* Active Route Core Solid Line */}
          <GeoJSON
            key={`active-core-${activeRoute}`}
            data={activeGeoJson}
            style={{
              color: isFastest ? '#ef4444' : '#22c55e',
              weight: 6.5,
              opacity: 0.95,
              lineCap: 'round',
              lineJoin: 'round'
            }}
          />

          {/* Point A (Start) Marker */}
          <Marker position={POINT_A} icon={startPin}>
            <Popup className="dark-popup">
              <div className="text-xs font-bold text-slate-900">
                Point A: Start (MG Road Central)
              </div>
            </Popup>
          </Marker>

          {/* Point B (End) Marker */}
          <Marker position={POINT_B} icon={endPin}>
            <Popup className="dark-popup">
              <div className="text-xs font-bold text-slate-900">
                Point B: Destination (Koramangala Hub)
              </div>
            </Popup>
          </Marker>
        </MapContainer>
      </div>

      {/* 3. DYNAMIC STATS CARD BELOW THE MAP */}
      <div className="p-5 rounded-2xl glass-panel border border-white/10 shadow-xl space-y-3 transition-all duration-300">
        
        {/* Main Stats Strip */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 block">
                Route Telemetry Comparison
              </span>
              {isMorningInversion && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-bold">
                  <AlertTriangle className="w-2.5 h-2.5 text-amber-400" />
                  1.3x Morning Inversion Active
                </span>
              )}
            </div>
            <div className="text-sm sm:text-base font-extrabold text-white mt-0.5 tracking-tight">
              {isFastest ? (
                /* Fastest Route Stats */
                <span className="text-slate-100 flex flex-wrap items-center gap-2">
                  <span>Distance: <strong className="text-white font-mono">5.2 km</strong></span>
                  <span className="text-slate-500">|</span>
                  <span>Est. Exposure: <strong className={fastestExposureLabel === 'Critical' ? 'text-rose-500 font-extrabold' : 'text-red-400 font-bold'}>{fastestExposureLabel}</strong></span>
                  <span className="text-slate-500">|</span>
                  <span>PM2.5 Intake: <strong className="text-red-400 font-mono">{adjustedFastest}µg</strong></span>
                </span>
              ) : (
                /* Healthiest Route Stats */
                <span className="text-slate-100 flex flex-wrap items-center gap-2">
                  <span>Distance: <strong className="text-white font-mono">6.1 km</strong></span>
                  <span className="text-slate-500">|</span>
                  <span>Est. Exposure: <strong className="text-emerald-400 font-bold">{healthiestExposureLabel}</strong></span>
                  <span className="text-slate-500">|</span>
                  <span>PM2.5 Intake: <strong className="text-emerald-400 font-mono">{adjustedHealthiest}µg</strong></span>
                </span>
              )}
            </div>
          </div>

          {/* Status Badge */}
          <div className="shrink-0 self-start sm:self-auto">
            {isFastest ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-950/70 border border-red-500/40 text-red-300 text-xs font-bold shadow-[0_0_10px_rgba(239,68,68,0.25)]">
                <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                High Pollution Corridor
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 text-xs font-bold shadow-[0_0_10px_rgba(34,197,94,0.25)]">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Active Clean Shield
              </span>
            )}
          </div>
        </div>

        {/* 4. CONDITIONALLY RENDERED GAMIFIED BADGE */}
        {!isFastest && (
          <div className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-950/60 via-slate-900/60 to-cyan-950/60 border border-emerald-500/35 shadow-[0_0_20px_rgba(34,197,94,0.15)] flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5 text-emerald-300 animate-bounce" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-extrabold text-white">
                  🎉 Lungs Saved! You avoided inhaling {adjustedSaved}µg of toxic dust.
                </h4>
                <p className="text-[11px] text-emerald-300/80 mt-0.5">
                  Mode: <strong className="capitalize text-white">{transportMode}</strong> ({currentMultiplier}x). Adding just 0.9 km reduced your particulate dose by 77.8% (equivalent to {(adjustedSaved / 7.5).toFixed(1)} cigarettes avoided).
                </p>
              </div>
            </div>

            <span className="hidden sm:inline-block px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 font-mono text-[11px] font-bold shrink-0">
              -78% Exposure
            </span>
          </div>
        )}

        {/* Fastest Route Warning Note */}
        {isFastest && (
          <div className="p-3 rounded-xl bg-red-950/30 border border-red-500/20 text-xs text-slate-300 flex items-center gap-2 animate-in fade-in duration-200">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <span>
              <strong>Note:</strong> Fastest Route saves 3 minutes of travel time but traverses heavy vehicular diesel canyons with peak particulate accumulation.
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default RouteMap;

