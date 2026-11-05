import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, GeoJSON, Marker, Popup, useMap } from 'react-leaflet';
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

// Smooth map recentering on GPS lock or coordinate change
const MapRecenter: React.FC<{ center: [number, number] }> = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, 13, { duration: 1.2 });
  }, [center, map]);
  return null;
};

// Fixed Point A (Default Fallback: MG Road) and Point B (End: Koramangala)
const POINT_A: [number, number] = [12.9716, 77.5946]; // [lat, lng]
const POINT_B: [number, number] = [12.9352, 77.6245]; // [lat, lng]

// Mock GeoJSON LineString for Fastest Route (Arterial Highway corridor)
export const FASTEST_ROUTE_GEOJSON: Feature<LineString> = {
  type: 'Feature',
  properties: {
    id: 'fastest',
    name: 'Fastest Route (Arterial Expressway)',
    distance: '5.2 km',
    exposure: 'High',
    pm25Intake: '18µg',
    color: '#f43f5e'
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
    color: '#059669'
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
        box-shadow: 0 4px 14px ${glowColor}, 0 2px 6px rgba(0,0,0,0.15);
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
          border: 2px solid ${color};
          opacity: 0.5;
          animation: ping 2.5s cubic-bezier(0, 0, 0.2, 1) infinite;
        "></span>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -18]
  });
};

const startPin = createCustomPin('A', '#059669', 'rgba(5,150,105,0.4)');
const endPin = createCustomPin('B', '#0284c7', 'rgba(2,132,199,0.4)');

export const RouteMap: React.FC = () => {
  const { userProfile, updateProfile, windDirection, windSpeed, departureTimeIndex, userLocation } = useApp();
  const [activeRoute, setActiveRoute] = useState<RouteType>('healthiest');
  
  // Transport Mode Exposure Adjuster
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

  // Check if departure time falls between 06:00 and 08:30 (Morning Inversion: 1.3x multiplier)
  const isMorningInversion = departureTimeIndex >= 0 && departureTimeIndex <= 10;
  const inversionMultiplier = isMorningInversion ? 1.3 : 1.0;

  // Adjust Est. Exposure and Lungs Saved math dynamically based on transport mode & inversion
  const currentMultiplier = TRANSPORT_MULTIPLIERS[transportMode].multiplier;
  const baseFastestIntake = 18;
  const baseHealthiestIntake = 4;
  const adjustedFastest = Math.round(baseFastestIntake * currentMultiplier * inversionMultiplier * 10) / 10;
  const adjustedHealthiest = Math.round(baseHealthiestIntake * currentMultiplier * inversionMultiplier * 10) / 10;
  const adjustedSaved = Math.round((adjustedFastest - adjustedHealthiest) * 10) / 10;

  const fastestExposureLabel = adjustedFastest > 25 ? 'Critical' : adjustedFastest > 12 ? 'High' : 'Moderate';
  const healthiestExposureLabel = adjustedHealthiest > 6 ? 'Moderate' : 'Low';

  // Point A coordinates derived from live auto-geolocation or default
  const startCoord: [number, number] = userLocation ? [userLocation.lat, userLocation.lng] : POINT_A;

  return (
    <div className="w-full space-y-4">
      {/* 1. TOGGLE CONTROL ABOVE THE MAP */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl bg-white border border-stone-200/80 shadow-sm">
        <div className="flex items-center gap-2 px-1">
          <MapPin className="w-4 h-4 text-emerald-600" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Route Exposure Optimization
          </span>
        </div>

        {/* Two Toggle Buttons */}
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-stone-100 rounded-xl border border-stone-200/80">
          {/* Fastest Route Button */}
          <button
            type="button"
            onClick={() => setActiveRoute('fastest')}
            className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${
              isFastest
                ? 'bg-rose-500 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-stone-200/60'
            }`}
          >
            <Zap className={`w-3.5 h-3.5 ${isFastest ? 'text-white' : 'text-slate-500'}`} />
            <span>Fastest Route</span>
          </button>

          {/* Healthiest Route Button */}
          <button
            type="button"
            onClick={() => setActiveRoute('healthiest')}
            className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${
              !isFastest
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-stone-200/60'
            }`}
          >
            <HeartPulse className={`w-3.5 h-3.5 ${!isFastest ? 'text-white' : 'text-slate-500'}`} />
            <span>Healthiest Route</span>
          </button>
        </div>
      </div>

      {/* 2. Transport Mode Exposure Adjuster Toggle Group */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl bg-white border border-stone-200/80 shadow-sm">
        <div className="flex items-center gap-2 px-1">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Transport Mode:
          </span>
          <span className="text-[10px] text-emerald-800 font-mono px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 font-bold">
            {TRANSPORT_MULTIPLIERS[transportMode].multiplier}x Intake Multiplier
          </span>
        </div>

        <div className="grid grid-cols-4 gap-1.5 p-1 bg-stone-100 rounded-xl border border-stone-200/80">
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
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-stone-200/60'
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

      {/* 3. THE MAP CONTAINER */}
      <div className="relative w-full h-[380px] sm:h-[460px] rounded-2xl overflow-hidden border border-stone-200/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] bg-[#f8fafc]">
        
        {/* Floating Route Status Overlay */}
        <div className="absolute top-4 left-4 z-[400] max-w-xs sm:max-w-sm p-3 rounded-xl bg-white/95 backdrop-blur-md border border-stone-200/90 shadow-md pointer-events-none">
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isFastest ? 'bg-rose-500 shadow-[0_0_8px_#f43f5e]' : 'bg-emerald-600 shadow-[0_0_8px_#059669]'
              }`}
            />
            <span className="text-xs font-bold text-slate-800 tracking-wide">
              {isFastest ? 'Arterial Highway (Heavy Smog)' : 'Green Canopy Corridor (Protected)'}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5 truncate">
            {userLocation?.locality ? `Live GPS (${userLocation.locality})` : 'Point A (Start)'} &rarr; Point B ({userProfile.destination || 'Destination'})
          </p>
        </div>

        {/* Task 1: The Wind Compass Widget (Live Crosswind Telemetry Overlay) */}
        <div 
          className="absolute top-4 right-4 z-[400] p-2.5 rounded-2xl bg-white/95 backdrop-blur-md border border-stone-200/90 shadow-md flex items-center gap-2.5 select-none transition-all duration-300 hover:border-emerald-500/50"
          title={`Live wind: ${Math.round(windDirection)}° (${getCardinalDirection(windDirection)}) at ${windSpeed.toFixed(1)} km/h`}
        >
          {/* Compass Dial */}
          <div className="relative w-11 h-11 rounded-full bg-stone-50 border border-stone-200 flex items-center justify-center shadow-inner">
            {/* Cardinal Markers */}
            <span className="absolute top-0.5 text-[7px] font-black text-emerald-700 font-mono tracking-tighter">N</span>
            <span className="absolute right-1 text-[6px] font-bold text-stone-400 font-mono">E</span>
            <span className="absolute bottom-0.5 text-[6px] font-bold text-stone-400 font-mono">S</span>
            <span className="absolute left-1 text-[6px] font-bold text-stone-400 font-mono">W</span>

            {/* Center Pivot Point */}
            <span className="absolute w-1.5 h-1.5 rounded-full bg-slate-800 z-20 shadow-sm" />

            {/* Rotating SVG Wind Needle */}
            <div
              className="w-full h-full flex items-center justify-center transition-transform duration-700 ease-out"
              style={{ transform: `rotate(${windDirection || 0}deg)` }}
            >
              <svg
                viewBox="0 0 24 24"
                className="w-7 h-7 drop-shadow-sm"
              >
                {/* Needle Pointing in Wind Vector Direction */}
                <polygon points="12,2 15,11 12,9 9,11" fill="#059669" />
                <polygon points="12,22 14,13 12,15 10,13" fill="#f59e0b" fillOpacity="0.85" />
              </svg>
            </div>
          </div>

          {/* Compass Meta readout */}
          <div className="flex flex-col pr-1">
            <div className="flex items-center gap-1.5">
              <Wind className="w-3 h-3 text-emerald-600" />
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-700">
                Crosswind
              </span>
            </div>
            <div className="text-xs font-mono font-black text-slate-800 flex items-center gap-1 mt-0.5">
              <span>{Math.round(windDirection || 0)}°</span>
              <span className="text-emerald-700 font-bold">{getCardinalDirection(windDirection || 0)}</span>
            </div>
            <span className="text-[10px] font-mono text-slate-500 leading-none">
              {(windSpeed || 0).toFixed(1)} km/h
            </span>
          </div>
        </div>

        {/* Map Container */}
        <MapContainer
          center={startCoord}
          zoom={13}
          zoomControl={false}
          attributionControl={false}
          className="w-full h-full"
          style={{ background: '#f8fafc' }}
        >
          {/* Dynamic FlyTo Recenter on GPS update */}
          <MapRecenter center={startCoord} />

          {/* CartoDB Voyager Light Tiles */}
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            subdomains="abcd"
            maxZoom={19}
          />

          {/* Inactive Route (faint dashed context line) */}
          <GeoJSON
            key={`inactive-${activeRoute}`}
            data={inactiveGeoJson}
            style={{
              color: isFastest ? '#059669' : '#f43f5e',
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
              color: isFastest ? '#f43f5e' : '#059669',
              weight: 12,
              opacity: 0.2,
              lineCap: 'round',
              lineJoin: 'round'
            }}
          />

          {/* Active Route Core Solid Line */}
          <GeoJSON
            key={`active-core-${activeRoute}`}
            data={activeGeoJson}
            style={{
              color: isFastest ? '#e11d48' : '#059669',
              weight: 6.5,
              opacity: 0.95,
              lineCap: 'round',
              lineJoin: 'round'
            }}
          />

          {/* Point A (Start) Marker */}
          <Marker position={startCoord} icon={startPin}>
            <Popup>
              <div className="text-xs font-bold text-slate-900 p-1">
                Point A: {userLocation?.locality ? `${userLocation.locality} (Your Location)` : 'Start (MG Road Central)'}
              </div>
            </Popup>
          </Marker>

          {/* Point B (End) Marker */}
          <Marker position={POINT_B} icon={endPin}>
            <Popup>
              <div className="text-xs font-bold text-slate-900 p-1">
                Point B: Destination ({userProfile.destination || 'Koramangala Hub'})
              </div>
            </Popup>
          </Marker>
        </MapContainer>
      </div>

      {/* 4. DYNAMIC STATS CARD BELOW THE MAP */}
      <div className="p-5 rounded-2xl bg-white border border-stone-200/80 shadow-sm space-y-3 transition-all duration-300">
        
        {/* Main Stats Strip */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-200/80">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 block">
                Route Telemetry Comparison
              </span>
              {isMorningInversion && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 border border-amber-300 text-amber-800 text-[10px] font-bold">
                  <AlertTriangle className="w-2.5 h-2.5 text-amber-600" />
                  1.3x Morning Inversion Active
                </span>
              )}
            </div>
            <div className="text-sm sm:text-base font-extrabold text-slate-900 mt-1 tracking-tight">
              {isFastest ? (
                /* Fastest Route Stats */
                <span className="text-slate-800 flex flex-wrap items-center gap-2">
                  <span>Distance: <strong className="text-slate-900 font-mono">5.2 km</strong></span>
                  <span className="text-slate-300">|</span>
                  <span>Est. Exposure: <strong className={fastestExposureLabel === 'Critical' ? 'text-rose-600 font-extrabold' : 'text-rose-500 font-bold'}>{fastestExposureLabel}</strong></span>
                  <span className="text-slate-300">|</span>
                  <span>PM2.5 Intake: <strong className="text-rose-600 font-mono">{adjustedFastest}µg</strong></span>
                </span>
              ) : (
                /* Healthiest Route Stats */
                <span className="text-slate-800 flex flex-wrap items-center gap-2">
                  <span>Distance: <strong className="text-slate-900 font-mono">6.1 km</strong></span>
                  <span className="text-slate-300">|</span>
                  <span>Est. Exposure: <strong className="text-emerald-700 font-bold">{healthiestExposureLabel}</strong></span>
                  <span className="text-slate-300">|</span>
                  <span>PM2.5 Intake: <strong className="text-emerald-700 font-mono">{adjustedHealthiest}µg</strong></span>
                </span>
              )}
            </div>
          </div>

          {/* Status Badge */}
          <div className="shrink-0 self-start sm:self-auto">
            {isFastest ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                High Pollution Corridor
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Active Clean Shield
              </span>
            )}
          </div>
        </div>

        {/* 5. CONDITIONALLY RENDERED GAMIFIED BADGE */}
        {!isFastest && (
          <div className="p-3.5 rounded-xl bg-emerald-50/90 border border-emerald-200/90 shadow-sm flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5 text-emerald-600 animate-bounce" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-extrabold text-emerald-950">
                  🎉 Lungs Saved! You avoided inhaling {adjustedSaved}µg of toxic dust.
                </h4>
                <p className="text-[11px] text-emerald-800 mt-0.5">
                  Mode: <strong className="capitalize text-emerald-950">{transportMode}</strong> ({currentMultiplier}x). Adding just 0.9 km reduced your particulate dose by 77.8% (equivalent to {(adjustedSaved / 7.5).toFixed(1)} cigarettes avoided).
                </p>
              </div>
            </div>

            <span className="hidden sm:inline-block px-2.5 py-1 rounded-lg bg-emerald-100 border border-emerald-200 text-emerald-800 font-mono text-[11px] font-bold shrink-0">
              -78% Exposure
            </span>
          </div>
        )}

        {/* Fastest Route Warning Note */}
        {isFastest && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900 flex items-center gap-2 animate-in fade-in duration-200">
            <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
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
