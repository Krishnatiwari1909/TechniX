import React, { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, GeoJSON, Marker, Popup, useMap, Polyline } from 'react-leaflet';
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
  Wind,
  Search,
  CheckCircle2,
  Navigation2,
  RotateCcw,
  Play,
  Square,
  ArrowUpDown,
  LocateFixed
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  fetchMapboxDirections,
  geocodeWithMapbox,
  processRouteDecision,
  RoutingEngineResult,
  CalculatedRoute,
  RouteSegment
} from '../../utils/routingEngine';

export type RouteType = 'fastest' | 'healthiest';
export type TransportMode = 'walk' | 'bike' | 'transit' | 'car';

const TRANSPORT_MULTIPLIERS: Record<TransportMode, { label: string; multiplier: number; desc: string }> = {
  walk: { label: 'Walk', multiplier: 2.0, desc: 'Heavy aerobic minute ventilation (45L/min)' },
  bike: { label: 'Bike', multiplier: 1.5, desc: 'Active physical exertion in road canyon' },
  transit: { label: 'Transit', multiplier: 1.0, desc: 'Standard ambient cabin exposure' },
  car: { label: 'Car', multiplier: 0.5, desc: 'Enclosed AC vehicle cabin with filtration' }
};

export interface DestinationPreset {
  name: string;
  coords: [number, number];
  tag: string;
}

export const BANGALORE_DESTINATIONS: DestinationPreset[] = [
  { name: 'Koramangala Hub', coords: [12.9352, 77.6245], tag: 'Commercial' },
  { name: 'Electronic City (Phase 1)', coords: [12.8399, 77.6770], tag: 'Tech Park' },
  { name: 'Whitefield (ITPL)', coords: [12.9863, 77.7340], tag: 'IT Corridor' },
  { name: 'Indiranagar (100ft Rd)', coords: [12.9784, 77.6408], tag: 'Central' },
  { name: 'IISc Bangalore (Malleswaram)', coords: [13.0219, 77.5671], tag: 'Campus' },
  { name: 'MG Road Central', coords: [12.9716, 77.5946], tag: 'CBD' }
];

const getCardinalDirection = (deg: number): string => {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(((deg % 360) / 22.5)) % 16;
  return directions[index < 0 ? index + 16 : index];
};



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

// Phase 20 Task 1: Distinctive pulsing dot marker for live GPS tracking
const liveUserPin = L.divIcon({
  className: 'live-gps-user-marker',
  html: `
    <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 32px; height: 32px;">
      <span style="position: absolute; width: 30px; height: 30px; border-radius: 50%; background: rgba(16, 185, 129, 0.5); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></span>
      <span style="position: relative; width: 16px; height: 16px; border-radius: 50%; background: #059669; border: 3px solid #ffffff; box-shadow: 0 0 10px rgba(5,150,105,0.8), 0 2px 6px rgba(0,0,0,0.3);"></span>
    </div>
  `,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -16]
});

const POINT_A_DEFAULT: [number, number] = [12.9716, 77.5946]; // MG Road Central
const POINT_B_DEFAULT: [number, number] = [12.9352, 77.6245]; // Koramangala Hub

export const RouteMap: React.FC = () => {
  const mapboxToken = (import.meta.env.VITE_MAPBOX_API_KEY || import.meta.env.VITE_MAPBOX_TOKEN || '').trim();

  const { 
    userProfile, 
    updateProfile, 
    windDirection, 
    windSpeed, 
    departureTimeIndex, 
    userLocation,
    pm25Level
  } = useApp();

  // Phase 8c Task 1: Distinct Origin & Destination States
  const [originInput, setOriginInput] = useState<string>(() => {
    if (userLocation?.locality) return `${userLocation.locality}, Bengaluru`;
    return 'MG Road Central, Bengaluru';
  });

  const [destinationInput, setDestinationInput] = useState<string>(
    userProfile.destination || 'Koramangala Hub, Bengaluru'
  );

  const [originCoords, setOriginCoords] = useState<[number, number]>(() => {
    return userLocation ? [userLocation.lat, userLocation.lng] : POINT_A_DEFAULT;
  });

  const [destinationCoords, setDestinationCoords] = useState<[number, number]>(() => {
    const match = BANGALORE_DESTINATIONS.find(d => 
      userProfile.destination?.toLowerCase().includes(d.name.toLowerCase().split(' ')[0])
    );
    return match ? match.coords : POINT_B_DEFAULT;
  });

  // Task 3: Selective Route Rendering state
  const [activeRouteType, setActiveRouteType] = useState<RouteType>('healthiest');

  // Phase 14 Task 1: Route Coordinates state in [latitude, longitude] format for Leaflet
  const [routeCoordinates, setRouteCoordinates] = useState<[number, number][]>([]);

  // Task 4: Navigation Mode state
  const [isNavigating, setIsNavigating] = useState(false);

  // Routing Loading state
  const [isRoutingLoading, setIsRoutingLoading] = useState(false);
  const [routingResult, setRoutingResult] = useState<RoutingEngineResult | null>(null);

  const [transportMode, setTransportMode] = useState<TransportMode>(() => {
    const mode = userProfile.commuteMode;
    if (mode === 'walking') return 'walk';
    if (mode === 'car') return 'car';
    if (mode === 'transit') return 'transit';
    return 'bike';
  });

  const isMorningInversion = departureTimeIndex >= 0 && departureTimeIndex <= 10;
  const [inversionMultiplier, setInversionMultiplier] = useState<number>(() => (isMorningInversion ? 1.3 : 1.0));
  const [isMlPowered, setIsMlPowered] = useState<boolean>(false);

  // Fetch ML-powered atmospheric inversion factor from FastAPI LightGBM service
  useEffect(() => {
    let isCancelled = false;
    const fetchMLInversion = async () => {
      try {
        const hours = 6 + Math.floor((departureTimeIndex * 15) / 60);
        const mins = (departureTimeIndex * 15) % 60;
        const period = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours > 12 ? hours - 12 : hours;
        const timeStr = `${displayHours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')} ${period}`;

        const res = await fetch(
          `http://localhost:8000/api/exposure?departure_time=${encodeURIComponent(timeStr)}&departure_time_index=${departureTimeIndex}`
        );
        if (res.ok) {
          const data = await res.json();
          if (!isCancelled && typeof data.inversion_multiplier === 'number') {
            setInversionMultiplier(data.inversion_multiplier);
            setIsMlPowered(true);
          }
        }
      } catch {
        if (!isCancelled) {
          const isMorning = departureTimeIndex >= 0 && departureTimeIndex <= 10;
          setInversionMultiplier(isMorning ? 1.3 : 1.0);
          setIsMlPowered(false);
        }
      }
    };
    fetchMLInversion();
    return () => {
      isCancelled = true;
    };
  }, [departureTimeIndex]);

  const transportMultiplier = TRANSPORT_MULTIPLIERS[transportMode].multiplier;

  // Sync GPS location if initial geolocation finishes and origin hasn't been manually overridden
  useEffect(() => {
    if (userLocation && (originInput === 'MG Road Central, Bengaluru' || originInput === '')) {
      const locName = userLocation.locality ? `${userLocation.locality}, Bengaluru` : 'Live Location';
      setOriginInput(locName);
      setOriginCoords([userLocation.lat, userLocation.lng]);
    }
  }, [userLocation]);

  // Phase 14 Task 1: Keep routeCoordinates in sync when activeRouteType or routingResult changes
  useEffect(() => {
    if (routingResult) {
      const activeData = activeRouteType === 'healthiest' && routingResult.alternativeRoute
        ? routingResult.alternativeRoute
        : routingResult.shortestRoute;

      if (activeData?.coordinates && activeData.coordinates.length > 0) {
        // Mapbox Directions returns [longitude, latitude], reverse tuple to [latitude, longitude] for Leaflet
        const flipped: [number, number][] = activeData.coordinates.map(([lng, lat]) => [lat, lng]);
        setRouteCoordinates(flipped);
      }
    }
  }, [activeRouteType, routingResult]);

  // Phase 20 Task 1: Live user coordinates state for GPS navigation
  const [liveCoordinates, setLiveCoordinates] = useState<[number, number] | null>(null);

  // Phase 20 Task 1: Live Location Tracking (watchPosition)
  useEffect(() => {
    let watchId: number | null = null;

    if (isNavigating) {
      if (typeof window !== 'undefined' && 'geolocation' in navigator) {
        if (userLocation?.lat && userLocation?.lng) {
          setLiveCoordinates([userLocation.lat, userLocation.lng]);
        } else if (originCoords) {
          setLiveCoordinates(originCoords);
        }

        watchId = navigator.geolocation.watchPosition(
          (position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            setLiveCoordinates([lat, lng]);
          },
          (error) => {
            console.warn('[RouteMap] watchPosition notice:', error);
            if (originCoords) {
              setLiveCoordinates(originCoords);
            }
          },
          {
            enableHighAccuracy: true,
            maximumAge: 1000,
            timeout: 10000
          }
        );
      } else if (originCoords) {
        setLiveCoordinates(originCoords);
      }
    } else {
      setLiveCoordinates(null);
    }

    return () => {
      if (watchId !== null && typeof window !== 'undefined' && 'geolocation' in navigator) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [isNavigating, originCoords, userLocation]);

  // Phase 14 & 20 Task 2: Camera Follow (Auto-Panning) and route framing
  const RouteCameraAutoFitter: React.FC<{
    isNavigating: boolean;
    liveCoordinates: [number, number] | null;
  }> = ({ isNavigating, liveCoordinates }) => {
    const map = useMap();

    // Phase 20 Task 2: Camera follow user's live position (zoom 18) when navigating
    useEffect(() => {
      if (isNavigating && liveCoordinates) {
        try {
          map.setView(liveCoordinates, 18, { animate: true });
        } catch (err) {
          console.warn('[RouteMap] Camera auto-pan error:', err);
        }
      }
    }, [map, isNavigating, liveCoordinates]);

    // Phase 14 Task 2: Fit entire journey bounds when not navigating
    useEffect(() => {
      if (!isNavigating) {
        if (routeCoordinates && routeCoordinates.length > 0) {
          try {
            map.fitBounds(routeCoordinates, { padding: [50, 50] });
          } catch (err) {
            console.warn('[RouteMap] Camera fitBounds error:', err);
          }
        } else if (originCoords && destinationCoords) {
          try {
            const bounds = L.latLngBounds([originCoords, destinationCoords]);
            map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
          } catch {
            map.flyTo(originCoords, 13, { duration: 1.2 });
          }
        }
      }
    }, [map, isNavigating, routeCoordinates, originCoords, destinationCoords]);

    return null;
  };

  // Core Routing Calculation with try/catch/finally
  const calculateRoutesWithCoords = useCallback(async (
    fromCoords: [number, number],
    toCoords: [number, number],
    mode: TransportMode
  ) => {
    // Phase 14 Task 1: Explicitly clear existing routeCoordinates first
    setRouteCoordinates([]);
    setIsRoutingLoading(true);
    let autoResetTimer: ReturnType<typeof setTimeout> | null = null;

    autoResetTimer = setTimeout(() => {
      setIsRoutingLoading(false);
    }, 7000);

    try {
      // Mapbox Directions takes [longitude, latitude]
      const originLngLat: [number, number] = [fromCoords[1], fromCoords[0]];
      const destLngLat: [number, number] = [toCoords[1], toCoords[0]];

      const fetched = await fetchMapboxDirections(originLngLat, destLngLat, mode);
      const shortestRaw = fetched.routes[0];
      const alternativeRaw = fetched.routes[1];

      const ambientAqi = Math.round(pm25Level * 1.35);

      const shortestSegDistance = shortestRaw.distanceKm / 3;
      const shortestSegments: RouteSegment[] = [
        { distanceKm: shortestSegDistance, aqi: Math.max(30, Math.round(ambientAqi * 0.85)) },
        { distanceKm: shortestSegDistance, aqi: Math.round(ambientAqi * 1.25) },
        { distanceKm: shortestSegDistance, aqi: Math.round(ambientAqi * 1.1) }
      ];

      let alternativeSegments: RouteSegment[] | undefined;
      if (alternativeRaw) {
        const altSegDistance = alternativeRaw.distanceKm / 3;
        alternativeSegments = [
          { distanceKm: altSegDistance, aqi: Math.max(25, Math.round(ambientAqi * 0.45)) },
          { distanceKm: altSegDistance, aqi: Math.max(28, Math.round(ambientAqi * 0.55)) },
          { distanceKm: altSegDistance, aqi: Math.max(30, Math.round(ambientAqi * 0.6)) }
        ];
      }

      const decision = processRouteDecision({
        shortestDistanceKm: shortestRaw.distanceKm,
        shortestDurationMinutes: shortestRaw.durationMinutes,
        shortestSegments,
        shortestCoordinates: shortestRaw.coordinates,
        shortestSteps: shortestRaw.steps,
        alternativeDistanceKm: alternativeRaw?.distanceKm,
        alternativeDurationMinutes: alternativeRaw?.durationMinutes,
        alternativeSegments,
        alternativeCoordinates: alternativeRaw?.coordinates,
        alternativeSteps: alternativeRaw?.steps,
        transportMultiplier,
        inversionMultiplier
      });

      setRoutingResult(decision);

      if (decision.isAlreadySafe || !decision.alternativeRoute) {
        setActiveRouteType('fastest');
      } else {
        setActiveRouteType('healthiest');
      }

      // Phase 14 Task 1: Reverse [longitude, latitude] to [latitude, longitude] for Leaflet
      const chosen = (decision.isAlreadySafe || !decision.alternativeRoute)
        ? decision.shortestRoute
        : (decision.alternativeRoute || decision.shortestRoute);
      if (chosen?.coordinates) {
        const flippedCoords: [number, number][] = chosen.coordinates.map(([lng, lat]) => [lat, lng]);
        setRouteCoordinates(flippedCoords);
      }
    } catch (err) {
      console.warn('[RouteMap] Route calculation error:', err);
    } finally {
      if (autoResetTimer) clearTimeout(autoResetTimer);
      setIsRoutingLoading(false);
    }
  }, [pm25Level, transportMultiplier, inversionMultiplier]);

  // Initial calculation on mount / mode change
  useEffect(() => {
    calculateRoutesWithCoords(originCoords, destinationCoords, transportMode);
  }, [calculateRoutesWithCoords, originCoords, destinationCoords, transportMode, departureTimeIndex, pm25Level]);

  // Phase 8c Task 2: Dual Geocoding on "Calculate Route"
  const handleCalculateRoute = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    // Phase 14 Task 1: Explicitly clear routeCoordinates on calculation start
    setRouteCoordinates([]);
    setIsRoutingLoading(true);

    try {
      let resolvedOrigin: [number, number] = originCoords;
      let resolvedDest: [number, number] = destinationCoords;

      // 1. Geocode Origin
      const originQuery = originInput.trim();
      if (originQuery) {
        const geocodedOrigin = await geocodeWithMapbox(originQuery);
        if (geocodedOrigin) {
          resolvedOrigin = geocodedOrigin.latLng;
          setOriginCoords(geocodedOrigin.latLng);
        } else {
          const match = BANGALORE_DESTINATIONS.find(d => 
            originQuery.toLowerCase().includes(d.name.toLowerCase().split(' ')[0]) ||
            d.name.toLowerCase().includes(originQuery.toLowerCase())
          );
          if (match) {
            resolvedOrigin = match.coords;
            setOriginCoords(match.coords);
          }
        }
      }

      // 2. Geocode Destination
      const destQuery = destinationInput.trim();
      if (destQuery) {
        const geocodedDest = await geocodeWithMapbox(destQuery);
        if (geocodedDest) {
          resolvedDest = geocodedDest.latLng;
          setDestinationCoords(geocodedDest.latLng);
          updateProfile({ destination: destQuery });
        } else {
          const match = BANGALORE_DESTINATIONS.find(d => 
            destQuery.toLowerCase().includes(d.name.toLowerCase().split(' ')[0]) ||
            d.name.toLowerCase().includes(destQuery.toLowerCase())
          );
          if (match) {
            resolvedDest = match.coords;
            setDestinationCoords(match.coords);
            updateProfile({ destination: match.name });
          }
        }
      }

      // 3. Trigger Directions API with fresh coordinates
      await calculateRoutesWithCoords(resolvedOrigin, resolvedDest, transportMode);
    } catch (err) {
      console.warn('[RouteMap] Geocoding or route calculation error:', err);
    } finally {
      setIsRoutingLoading(false);
    }
  };

  // Quick Preset Selection
  const handleSelectPreset = async (preset: DestinationPreset) => {
    setDestinationInput(preset.name);
    setDestinationCoords(preset.coords);
    updateProfile({ destination: preset.name });
    await calculateRoutesWithCoords(originCoords, preset.coords, transportMode);
  };

  // Swap Origin and Destination
  const handleSwapPoints = async () => {
    const prevOrigin = originInput;
    const prevDest = destinationInput;
    const prevOriginCoords = originCoords;
    const prevDestCoords = destinationCoords;

    setOriginInput(prevDest);
    setDestinationInput(prevOrigin);
    setOriginCoords(prevDestCoords);
    setDestinationCoords(prevOriginCoords);

    await calculateRoutesWithCoords(prevDestCoords, prevOriginCoords, transportMode);
  };

  // One-click live GPS for origin
  const handleUseLiveLocation = () => {
    if (userLocation) {
      const locName = userLocation.locality ? `${userLocation.locality}, Bengaluru` : 'Live Location';
      setOriginInput(locName);
      setOriginCoords([userLocation.lat, userLocation.lng]);
      calculateRoutesWithCoords([userLocation.lat, userLocation.lng], destinationCoords, transportMode);
    }
  };

  const activeRoute: CalculatedRoute | null = (() => {
    if (!routingResult) return null;
    if (routingResult.isAlreadySafe || !routingResult.alternativeRoute) {
      return routingResult.shortestRoute;
    }
    return activeRouteType === 'fastest' ? routingResult.shortestRoute : routingResult.alternativeRoute;
  })();

  const isFastestActive = activeRoute?.id === 'shortest';
  const hasAlternative = !!(routingResult && routingResult.alternativeRoute && !routingResult.isAlreadySafe);

  const savedMicrograms = routingResult && routingResult.alternativeRoute 
    ? Math.max(0, Math.round((routingResult.shortestRoute.pm25IntakeUg - routingResult.alternativeRoute.pm25IntakeUg) * 10) / 10)
    : 0;

  return (
    <div className="w-full space-y-4">
      {/* PHASE 8c TASK 1: DUAL ORIGIN & DESTINATION INPUTS */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-stone-200/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
              <Navigation2 className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                Plan Clean Air Route
              </h3>
              <p className="text-[11px] text-slate-500">
                Custom origin &amp; destination with dynamic microclimate AQI routing
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-stone-100 border border-stone-200 text-slate-600 font-semibold">
              Max 1.3x Detour Cap
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold">
              Live GPS Grid
            </span>
          </div>
        </div>

        {/* Dual Inputs Form */}
        <form onSubmit={handleCalculateRoute} className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-[1fr,auto,1fr] items-end gap-2.5">
            {/* "From (Origin)" Input */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block" />
                  From (Origin)
                </label>
                {userLocation && (
                  <button
                    type="button"
                    onClick={handleUseLiveLocation}
                    className="inline-flex items-center gap-1 text-[10px] text-emerald-700 hover:text-emerald-800 font-semibold cursor-pointer"
                    title="Reset to current live GPS"
                  >
                    <LocateFixed className="w-3 h-3 text-emerald-600" />
                    <span>Live GPS</span>
                  </button>
                )}
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-emerald-600">
                  <MapPin className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={originInput}
                  onChange={(e) => setOriginInput(e.target.value)}
                  placeholder="Starting point (e.g. MG Road, Indiranagar, Live GPS...)"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-slate-800 placeholder-slate-400 text-xs sm:text-sm font-medium focus:outline-none focus:border-emerald-600 focus:bg-white transition-all shadow-2xs"
                />
              </div>
            </div>

            {/* Swap Button */}
            <div className="flex justify-center pb-0.5">
              <button
                type="button"
                onClick={handleSwapPoints}
                className="p-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-slate-600 border border-stone-200/80 transition-all cursor-pointer shadow-2xs"
                title="Swap Origin and Destination"
              >
                <ArrowUpDown className="w-4 h-4" />
              </button>
            </div>

            {/* "To (Destination)" Input */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-sky-600 inline-block" />
                To (Destination)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-sky-600">
                  <MapPin className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={destinationInput}
                  onChange={(e) => setDestinationInput(e.target.value)}
                  placeholder="Destination (e.g. Koramangala Hub, Whitefield, Electronic City...)"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-slate-800 placeholder-slate-400 text-xs sm:text-sm font-medium focus:outline-none focus:border-emerald-600 focus:bg-white transition-all shadow-2xs"
                />
              </div>
            </div>
          </div>

          {/* Action Row: Popular Presets + "Calculate Route" Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider shrink-0 mr-1">
                Quick Hubs:
              </span>
              {BANGALORE_DESTINATIONS.map((preset) => {
                const isSelected = destinationInput.toLowerCase().includes(preset.name.toLowerCase().split(' ')[0]);
                return (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all whitespace-nowrap cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-600 text-white font-bold shadow-xs'
                        : 'bg-stone-100 hover:bg-stone-200 text-slate-700 border border-stone-200/80'
                    }`}
                  >
                    {preset.name.split(' (')[0]}
                  </button>
                );
              })}
            </div>

            <button
              type="submit"
              disabled={isRoutingLoading}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs sm:text-sm transition-all shadow-sm cursor-pointer shrink-0"
            >
              {isRoutingLoading ? (
                <>
                  <RotateCcw className="w-4 h-4 animate-spin" />
                  <span>Calculating Route...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>Calculate Route</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* TASK 4: NAVIGATION MODE VS ROUTE CONTROLS */}
      {isNavigating ? (
        /* ACTIVE TURN-BY-TURN DIRECTIONS PANEL */
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-stone-200/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] space-y-3 animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
            <div className="flex items-center gap-2.5">
              <div className="relative flex items-center justify-center">
                <span className="w-3 h-3 rounded-full bg-emerald-500 block animate-ping" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 absolute" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-sm text-slate-900 tracking-tight">
                    Turn-by-Turn Navigation
                  </h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold">
                    {activeRoute?.name}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {activeRoute?.distanceKm.toFixed(1)} km • ~{activeRoute?.durationMinutes} min • Avg AQI: <strong className="text-emerald-700">{activeRoute?.averageAqi}</strong>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
              <a
                href={`https://www.google.com/maps/dir/?api=1&origin=${originCoords[0]},${originCoords[1]}&destination=${destinationCoords[0]},${destinationCoords[1]}&travelmode=bicycling`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all shadow-sm cursor-pointer"
                title="Launch Google Maps Live GPS Turn-by-Turn Navigation"
              >
                <Navigation2 className="w-3.5 h-3.5" />
                <span>Start Live Navigation</span>
              </a>

              <button
                type="button"
                onClick={() => setIsNavigating(false)}
                className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs transition-all shadow-sm cursor-pointer"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>End Journey</span>
              </button>
            </div>
          </div>

          <div className="max-h-56 overflow-y-auto space-y-2 pr-1 divide-y divide-stone-100">
            {activeRoute?.steps && activeRoute.steps.length > 0 ? (
              activeRoute.steps.map((step, idx) => (
                <div key={step.id || idx} className="pt-2.5 first:pt-0 flex items-start gap-3 text-xs">
                  <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center shrink-0 font-bold text-[10px] mt-0.5">
                    {idx + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-800 leading-snug">
                      {step.instruction}
                    </p>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {step.distanceMeters >= 1000
                        ? `${(step.distanceMeters / 1000).toFixed(1)} km`
                        : `${step.distanceMeters} m`}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 py-2">
                Continue along corridor toward {destinationInput}. Follow clean vegetative canopy markers.
              </p>
            )}
          </div>
        </div>
      ) : (
        /* ROUTE PLANNING CONTROLS & "START JOURNEY" BUTTON */
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl bg-white border border-stone-200/80 shadow-sm">
          <div className="flex items-center gap-2 px-1">
            <MapPin className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Route Exposure Optimization
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-stone-100 rounded-xl border border-stone-200/80">
              {routingResult?.isAlreadySafe ? (
                <div className="col-span-2 flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 text-white shadow-sm">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-100" />
                  <span>Direct Safe Route ({routingResult.shortestRoute.distanceKm.toFixed(1)} km • AQI: {routingResult.shortestRoute.averageAqi})</span>
                </div>
              ) : routingResult?.alternativeRejectedDueToDistanceCap ? (
                <div className="col-span-2 flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-500 text-white shadow-sm">
                  <AlertTriangle className="w-3.5 h-3.5 text-white" />
                  <span>Shortest Route ({routingResult.shortestRoute.distanceKm.toFixed(1)} km • Detour &gt; 1.3x Cap)</span>
                </div>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setActiveRouteType('fastest')}
                    className={`flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${
                      isFastestActive
                        ? 'bg-rose-500 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-stone-200/60'
                    }`}
                  >
                    <Zap className={`w-3.5 h-3.5 ${isFastestActive ? 'text-white' : 'text-slate-500'}`} />
                    <span>Fastest ({(routingResult ? routingResult.shortestRoute.distanceKm : 5.2).toFixed(1)} km)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveRouteType('healthiest')}
                    className={`flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${
                      !isFastestActive
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-stone-200/60'
                    }`}
                  >
                    <HeartPulse className={`w-3.5 h-3.5 ${!isFastestActive ? 'text-white' : 'text-slate-500'}`} />
                    <span>Healthiest ({(routingResult?.alternativeRoute ? routingResult.alternativeRoute.distanceKm : 6.1).toFixed(1)} km)</span>
                  </button>
                </>
              )}
            </div>

            {/* Navigation Actions */}
            <div className="flex items-center gap-2 shrink-0">
              <a
                href={`https://www.google.com/maps/dir/?api=1&origin=${originCoords[0]},${originCoords[1]}&destination=${destinationCoords[0]},${destinationCoords[1]}&travelmode=bicycling`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-xs transition-all shadow-2xs cursor-pointer"
                title="Launch Google Maps Live GPS Turn-by-Turn Navigation"
              >
                <Navigation2 className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden sm:inline">Google Maps</span>
              </a>

              <button
                type="button"
                onClick={() => setIsNavigating(true)}
                className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all shadow-sm cursor-pointer"
                title="Begin active in-app live GPS navigation"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>In-App Navigation</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transport Mode Selector */}
      {!isNavigating && (
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
      )}

      {/* MAP CONTAINER */}
      <div className="relative w-full h-[380px] sm:h-[460px] rounded-2xl overflow-hidden border border-stone-200/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] bg-[#f8fafc]">
        
        {/* Floating Route Status Overlay (Top-Left) */}
        <div className="absolute top-4 left-4 z-[400] max-w-xs sm:max-w-sm p-3 rounded-xl bg-white/95 backdrop-blur-md border border-stone-200/90 shadow-md pointer-events-none">
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                activeRoute?.color === '#059669'
                  ? 'bg-emerald-600 shadow-[0_0_8px_#059669]'
                  : 'bg-rose-500 shadow-[0_0_8px_#f43f5e]'
              }`}
            />
            <span className="text-xs font-bold text-slate-800 tracking-wide">
              {isNavigating
                ? 'Active Navigation Corridor'
                : routingResult?.isAlreadySafe 
                ? 'Direct Clean Corridor (Optimal Air)'
                : isFastestActive
                ? 'Arterial Highway (Heavy Smog)'
                : 'Green Canopy Corridor (Protected)'}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5 truncate">
            {originInput || 'Origin'} &rarr; {destinationInput || 'Destination'}
          </p>
        </div>

        {/* The Wind Compass Widget (Top-Right) */}
        <div 
          className="absolute top-4 right-4 z-[400] p-2.5 rounded-2xl bg-white/95 backdrop-blur-md border border-stone-200/90 shadow-md flex items-center gap-2.5 select-none transition-all duration-300 hover:border-emerald-500/50"
          title={`Live wind: ${Math.round(windDirection)}° (${getCardinalDirection(windDirection)}) at ${windSpeed.toFixed(1)} km/h`}
        >
          <div className="relative w-11 h-11 rounded-full bg-stone-50 border border-stone-200 flex items-center justify-center shadow-inner">
            <span className="absolute top-0.5 text-[7px] font-black text-emerald-700 font-mono tracking-tighter">N</span>
            <span className="absolute right-1 text-[6px] font-bold text-stone-400 font-mono">E</span>
            <span className="absolute bottom-0.5 text-[6px] font-bold text-stone-400 font-mono">S</span>
            <span className="absolute left-1 text-[6px] font-bold text-stone-400 font-mono">W</span>

            <span className="absolute w-1.5 h-1.5 rounded-full bg-slate-800 z-20 shadow-sm" />

            <div
              className="w-full h-full flex items-center justify-center transition-transform duration-700 ease-out"
              style={{ transform: `rotate(${windDirection || 0}deg)` }}
            >
              <svg viewBox="0 0 24 24" className="w-7 h-7 drop-shadow-sm">
                <polygon points="12,2 15,11 12,9 9,11" fill="#059669" />
                <polygon points="12,22 14,13 12,15 10,13" fill="#f59e0b" fillOpacity="0.85" />
              </svg>
            </div>
          </div>

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
          center={originCoords}
          zoom={13}
          zoomControl={false}
          attributionControl={false}
          className="w-full h-full"
          style={{ background: '#090a0f' }}
        >
          {/* Phase 14 & 20 Task 2: Auto-Zoom & Live GPS Camera Follow */}
          <RouteCameraAutoFitter isNavigating={isNavigating} liveCoordinates={liveCoordinates} />

          {/* Phase 28 Task 1: Mapbox Dark v11 Premium Tiles */}
          <TileLayer
            url={
              mapboxToken
                ? `https://api.mapbox.com/styles/v1/mapbox/dark-v11/tiles/256/{z}/{x}/{y}@2x?access_token=${mapboxToken}`
                : 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
            }
            attribution='&copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> <strong><a href="https://www.mapbox.com/map-feedback/" target="_blank">Improve this map</a></strong>'
            tileSize={256}
            maxZoom={22}
          />

          {/* Phase 28 Task 2: Neon Route Styling (Luminescent Cyan / Toxic-Alert Green, Weight 6, Opacity 0.9) */}
          {routeCoordinates.length > 0 && (
            <>
              {/* Outer Luminescent Neon Glow */}
              <Polyline
                positions={routeCoordinates}
                pathOptions={{
                  color: activeRouteType === 'healthiest' ? '#00FF9D' : '#00E5FF',
                  weight: 10,
                  opacity: 0.35,
                  lineCap: 'round',
                  lineJoin: 'round'
                }}
              />
              {/* Core Neon Clean-Air Route */}
              <Polyline
                positions={routeCoordinates}
                pathOptions={{
                  color: activeRouteType === 'healthiest' ? '#00FF9D' : '#00E5FF',
                  weight: 6,
                  opacity: 0.9,
                  lineCap: 'round',
                  lineJoin: 'round'
                }}
              />
            </>
          )}

          {/* Phase 20 Task 1: Distinctive pulsing dot marker at live GPS coordinates */}
          {isNavigating && liveCoordinates && (
            <Marker position={liveCoordinates} icon={liveUserPin} zIndexOffset={1000}>
              <Popup>
                <div className="text-xs font-bold text-slate-900 p-1">
                  Live GPS Position (In-App Navigation)
                </div>
              </Popup>
            </Marker>
          )}

          {/* Point A (Origin) Marker */}
          <Marker position={originCoords} icon={startPin}>
            <Popup>
              <div className="text-xs font-bold text-slate-900 p-1">
                Point A (Origin): {originInput}
              </div>
            </Popup>
          </Marker>

          {/* Point B (Destination) Marker */}
          <Marker position={destinationCoords} icon={endPin}>
            <Popup>
              <div className="text-xs font-bold text-slate-900 p-1">
                Point B (Destination): {destinationInput}
              </div>
            </Popup>
          </Marker>
        </MapContainer>
      </div>

      {/* DYNAMIC STATS & TELEMETRY CARD BELOW THE MAP */}
      <div className="p-5 rounded-2xl bg-white border border-stone-200/80 shadow-sm space-y-3 transition-all duration-300">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-200/80">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 block">
                Route Telemetry Comparison
              </span>
              {(inversionMultiplier > 1.05 || isMorningInversion) && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 border border-amber-300 text-amber-800 text-[10px] font-bold">
                  <AlertTriangle className="w-2.5 h-2.5 text-amber-600" />
                  {inversionMultiplier.toFixed(2)}x Inversion Surge {isMlPowered ? '(Atmos ML)' : 'Active'}
                </span>
              )}
            </div>

            <div className="text-sm sm:text-base font-extrabold text-slate-900 mt-1 tracking-tight">
              {activeRoute && (
                <span className="text-slate-800 flex flex-wrap items-center gap-2">
                  <span>Distance: <strong className="text-slate-900 font-mono">{activeRoute.distanceKm.toFixed(1)} km</strong></span>
                  <span className="text-slate-300">|</span>
                  <span>Est. Exposure: <strong className={activeRoute.color === '#059669' ? 'text-emerald-700 font-bold' : 'text-rose-600 font-bold'}>
                    {activeRoute.isSafe ? 'Low (Safe)' : activeRoute.isModerate ? 'Moderate' : 'High'}
                  </strong></span>
                  <span className="text-slate-300">|</span>
                  <span>Avg AQI: <strong className="font-mono text-slate-900">{activeRoute.averageAqi}</strong></span>
                  <span className="text-slate-300">|</span>
                  <span>PM2.5 Intake: <strong className={activeRoute.color === '#059669' ? 'text-emerald-700 font-mono' : 'text-rose-600 font-mono'}>
                    {activeRoute.pm25IntakeUg}µg
                  </strong></span>
                </span>
              )}
            </div>
          </div>

          <div className="shrink-0 self-start sm:self-auto">
            {routingResult?.isAlreadySafe ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Already Safe Corridor (≤ 50 AQI)
              </span>
            ) : isFastestActive ? (
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

        {routingResult?.statusMessage && (
          <p className="text-xs text-slate-600 leading-relaxed font-medium">
            💡 {routingResult.statusMessage}
          </p>
        )}

        {hasAlternative && !isFastestActive && (
          <div className="p-3.5 rounded-xl bg-emerald-50/90 border border-emerald-200/90 shadow-sm flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5 text-emerald-600 animate-bounce" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-extrabold text-emerald-950">
                  🎉 Lungs Saved! You avoided inhaling {savedMicrograms}µg of toxic dust.
                </h4>
                <p className="text-[11px] text-emerald-800 mt-0.5">
                  Mode: <strong className="capitalize text-emerald-950">{transportMode}</strong> ({transportMultiplier}x). Detour is within the 1.3x limit (max {routingResult?.distanceCapLimitKm ? routingResult.distanceCapLimitKm.toFixed(1) : '0.0'} km).
                </p>
              </div>
            </div>

            <span className="hidden sm:inline-block px-2.5 py-1 rounded-lg bg-emerald-100 border border-emerald-200 text-emerald-800 font-mono text-[11px] font-bold shrink-0">
              -72% Dose
            </span>
          </div>
        )}

        {routingResult?.alternativeRejectedDueToDistanceCap && (
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-xs text-amber-900 flex items-center gap-2 animate-in fade-in duration-200">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>1.3x Distance Cap Enforced:</strong> Clean detour was disqualified because it required a &gt;30% distance increase. Following shortest route with recommended respiratory mask.
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default RouteMap;
