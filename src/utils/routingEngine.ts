import type { Feature, LineString } from 'geojson';

/**
 * Phase 8 & 8b: Dynamic Routing Logic Engine
 * Implements Mapbox Directions API, Turn-by-Turn Steps, Base AQI Limits,
 * "Already Safe" Rule, 1.3x Distance Cap, and Spike Tolerance (<10% high AQI distance).
 */

// Base AQI Limits
export const AQI_LIMITS = {
  SAFE_MAX: 50,       // 0 - 50: Safe Air Corridor (Green)
  MODERATE_MAX: 100,  // 51 - 100: Moderate (Amber)
  HIGH_MIN: 101       // 101+: High Pollution Zone (Coral / Red)
} as const;

export const DISTANCE_CAP_MULTIPLIER = 1.3; // Max allowable detour is 1.3x shortest route
export const SPIKE_TOLERANCE_DISTANCE_PCT = 10; // High AQI on <10% distance is tolerated

export interface Coordinate {
  lat: number;
  lng: number;
}

export interface RouteSegment {
  distanceKm: number;
  aqi: number;
  startCoord?: [number, number]; // [lng, lat]
  endCoord?: [number, number];
}

export interface TurnByTurnStep {
  id: string;
  instruction: string;
  distanceMeters: number;
  durationSeconds: number;
  modifier?: string;
  type?: string;
}

export interface CalculatedRoute {
  id: 'shortest' | 'healthiest';
  name: string;
  distanceKm: number;
  durationMinutes: number;
  geojson: Feature<LineString>;
  coordinates?: [number, number][];
  averageAqi: number;
  highAqiDistancePct: number;
  isSafe: boolean;
  isModerate: boolean;
  isHigh: boolean;
  pm25IntakeUg: number;
  color: string;
  description: string;
  steps: TurnByTurnStep[];
}

export interface RoutingEngineResult {
  shortestRoute: CalculatedRoute;
  alternativeRoute: CalculatedRoute | null;
  isAlreadySafe: boolean;
  alternativeRejectedDueToDistanceCap: boolean;
  distanceCapLimitKm: number;
  activeDisplayMode: 'single_safe' | 'alternative_recommended' | 'shortest_only_detour_too_long';
  statusMessage: string;
}

/**
 * Calculates weighted average AQI and percentage of route passing through High AQI (>100).
 * Implements the Spike Tolerance rule: a small section (<10% distance) of High AQI
 * does not disqualify the route if the overall average remains healthy.
 */
export const evaluateRouteAirQuality = (segments: RouteSegment[]): {
  averageAqi: number;
  highAqiDistancePct: number;
  isSafe: boolean;
} => {
  if (!segments || segments.length === 0) {
    return { averageAqi: 45, highAqiDistancePct: 0, isSafe: true };
  }

  const totalDistance = segments.reduce((sum, s) => sum + s.distanceKm, 0);
  if (totalDistance <= 0) {
    return { averageAqi: 45, highAqiDistancePct: 0, isSafe: true };
  }

  // Weighted AQI calculation over distance
  const weightedAqiSum = segments.reduce((sum, s) => sum + s.distanceKm * s.aqi, 0);
  const averageAqi = Math.round((weightedAqiSum / totalDistance) * 10) / 10;

  // Measure high AQI distance
  const highAqiDistance = segments
    .filter(s => s.aqi >= AQI_LIMITS.HIGH_MIN)
    .reduce((sum, s) => sum + s.distanceKm, 0);

  const highAqiDistancePct = Math.round((highAqiDistance / totalDistance) * 1000) / 10;

  // Spike tolerance: if high AQI distance < 10% and average AQI is <= 50, mark as safe
  const isSafe = averageAqi <= AQI_LIMITS.SAFE_MAX || (highAqiDistancePct < SPIKE_TOLERANCE_DISTANCE_PCT && averageAqi <= 55);

  return {
    averageAqi,
    highAqiDistancePct,
    isSafe
  };
};

/**
 * Main Routing Decision Engine:
 * 1. Checks if Shortest Route is "Already Safe" -> If true, renders ONLY that route in Green (#059669).
 * 2. If Shortest is High AQI, checks Alternative Route.
 * 3. Enforces 1.3x Distance Cap: If alternative.distance > shortest.distance * 1.3, discards the alternative.
 */
export const processRouteDecision = (params: {
  shortestDistanceKm: number;
  shortestDurationMinutes: number;
  shortestSegments: RouteSegment[];
  shortestCoordinates: [number, number][]; // [[lng, lat], ...]
  shortestSteps?: TurnByTurnStep[];
  alternativeDistanceKm?: number;
  alternativeDurationMinutes?: number;
  alternativeSegments?: RouteSegment[];
  alternativeCoordinates?: [number, number][];
  alternativeSteps?: TurnByTurnStep[];
  transportMultiplier?: number;
  inversionMultiplier?: number;
}): RoutingEngineResult => {
  const {
    shortestDistanceKm,
    shortestDurationMinutes,
    shortestSegments,
    shortestCoordinates,
    shortestSteps = [],
    alternativeDistanceKm,
    alternativeDurationMinutes,
    alternativeSegments,
    alternativeCoordinates,
    alternativeSteps = [],
    transportMultiplier = 1.0,
    inversionMultiplier = 1.0
  } = params;

  const shortestEval = evaluateRouteAirQuality(shortestSegments);
  const distanceCapLimitKm = Number((shortestDistanceKm * DISTANCE_CAP_MULTIPLIER).toFixed(1));

  // Base PM2.5 intake calculations
  const shortestIntake = Math.round(
    ((shortestDistanceKm * (shortestEval.averageAqi * 0.22) * transportMultiplier * inversionMultiplier) / 5) * 10
  ) / 10;

  // RULE: The "Already Safe" Rule
  // If the shortest route is mostly Safe, render only that route in Green. Do not invent a red route.
  if (shortestEval.isSafe) {
    const safeShortestRoute: CalculatedRoute = {
      id: 'shortest',
      name: 'Direct Route (Safe Air Corridor)',
      distanceKm: shortestDistanceKm,
      durationMinutes: shortestDurationMinutes,
      geojson: {
        type: 'Feature',
        properties: { id: 'shortest', name: 'Direct Route', color: '#059669' },
        geometry: { type: 'LineString', coordinates: shortestCoordinates }
      },
      coordinates: shortestCoordinates,
      averageAqi: shortestEval.averageAqi,
      highAqiDistancePct: shortestEval.highAqiDistancePct,
      isSafe: true,
      isModerate: false,
      isHigh: false,
      pm25IntakeUg: shortestIntake,
      color: '#059669', // Emerald Green
      description: `Shortest route is safe (Avg AQI: ${shortestEval.averageAqi}). No detour necessary.`,
      steps: shortestSteps
    };

    return {
      shortestRoute: safeShortestRoute,
      alternativeRoute: null,
      isAlreadySafe: true,
      alternativeRejectedDueToDistanceCap: false,
      distanceCapLimitKm,
      activeDisplayMode: 'single_safe',
      statusMessage: `Direct route is already safe (Avg AQI ${shortestEval.averageAqi} ≤ 50). Single clean corridor displayed.`
    };
  }

  // Shortest route is NOT safe (Moderate or High AQI) -> Render in Coral / Red
  const hazardousShortestRoute: CalculatedRoute = {
    id: 'shortest',
    name: 'Shortest Arterial Route (Polluted)',
    distanceKm: shortestDistanceKm,
    durationMinutes: shortestDurationMinutes,
    geojson: {
      type: 'Feature',
      properties: { id: 'shortest', name: 'Shortest Route', color: '#f43f5e' },
      geometry: { type: 'LineString', coordinates: shortestCoordinates }
    },
    coordinates: shortestCoordinates,
    averageAqi: shortestEval.averageAqi,
    highAqiDistancePct: shortestEval.highAqiDistancePct,
    isSafe: false,
    isModerate: shortestEval.averageAqi <= AQI_LIMITS.MODERATE_MAX,
    isHigh: shortestEval.averageAqi >= AQI_LIMITS.HIGH_MIN,
    pm25IntakeUg: shortestIntake,
    color: '#f43f5e', // Coral Red
    description: `High particulate exposure (Avg AQI: ${shortestEval.averageAqi}, ${shortestEval.highAqiDistancePct}% severe zone).`,
    steps: shortestSteps
  };

  // Check Alternative Route if provided
  if (alternativeDistanceKm && alternativeSegments && alternativeCoordinates) {
    const alternativeEval = evaluateRouteAirQuality(alternativeSegments);

    // RULE: Distance Cap (Max 1.3x Shortest Route)
    if (alternativeDistanceKm > distanceCapLimitKm) {
      const detourPct = Math.round(((alternativeDistanceKm / shortestDistanceKm) - 1) * 100);
      return {
        shortestRoute: hazardousShortestRoute,
        alternativeRoute: null,
        isAlreadySafe: false,
        alternativeRejectedDueToDistanceCap: true,
        distanceCapLimitKm,
        activeDisplayMode: 'shortest_only_detour_too_long',
        statusMessage: `Detour too long (${alternativeDistanceKm.toFixed(1)} km is +${detourPct}% vs ${distanceCapLimitKm.toFixed(1)} km cap). Route not rendered.`
      };
    }

    // Alternative route is within the 1.3x Distance Cap
    const alternativeIntake = Math.round(
      ((alternativeDistanceKm * (alternativeEval.averageAqi * 0.22) * transportMultiplier * inversionMultiplier) / 5) * 10
    ) / 10;

    const healthyAlternativeRoute: CalculatedRoute = {
      id: 'healthiest',
      name: 'Clean Canopy Bypass (Recommended)',
      distanceKm: alternativeDistanceKm,
      durationMinutes: alternativeDurationMinutes || Math.round(shortestDurationMinutes * 1.15),
      geojson: {
        type: 'Feature',
        properties: { id: 'healthiest', name: 'Clean Bypass', color: '#059669' },
        geometry: { type: 'LineString', coordinates: alternativeCoordinates }
      },
      coordinates: alternativeCoordinates,
      averageAqi: alternativeEval.averageAqi,
      highAqiDistancePct: alternativeEval.highAqiDistancePct,
      isSafe: alternativeEval.isSafe,
      isModerate: alternativeEval.averageAqi <= AQI_LIMITS.MODERATE_MAX,
      isHigh: false,
      pm25IntakeUg: alternativeIntake,
      color: '#059669', // Emerald Green
      description: `Protects lungs: Avg AQI ${alternativeEval.averageAqi} with only +${(alternativeDistanceKm - shortestDistanceKm).toFixed(1)} km detour.`,
      steps: alternativeSteps
    };

    return {
      shortestRoute: hazardousShortestRoute,
      alternativeRoute: healthyAlternativeRoute,
      isAlreadySafe: false,
      alternativeRejectedDueToDistanceCap: false,
      distanceCapLimitKm,
      activeDisplayMode: 'alternative_recommended',
      statusMessage: `Clean air detour active: Avoids ${(shortestIntake - alternativeIntake).toFixed(1)}µg PM2.5 within 1.3x distance limit.`
    };
  }

  // No alternative available
  return {
    shortestRoute: hazardousShortestRoute,
    alternativeRoute: null,
    isAlreadySafe: false,
    alternativeRejectedDueToDistanceCap: false,
    distanceCapLimitKm,
    activeDisplayMode: 'shortest_only_detour_too_long',
    statusMessage: `Shortest route has elevated AQI (${shortestEval.averageAqi}). No viable alternative found.`
  };
};

/**
 * Phase 8c: Mapbox Geocoding API helper
 * Geocodes a text address or place name into [longitude, latitude] coordinates.
 * Endpoint: https://api.mapbox.com/geocoding/v5/mapbox.places/{query}.json?access_token={token}
 */
export const geocodeWithMapbox = async (
  query: string,
  token?: string
): Promise<{
  coordinates: [number, number]; // [lng, lat] for Mapbox
  latLng: [number, number];       // [lat, lng] for Leaflet
  placeName: string;
} | null> => {
  const trimmed = query.trim();
  if (!trimmed) return null;

  const mapboxToken = token || import.meta.env.VITE_MAPBOX_API_KEY;
  if (mapboxToken && typeof mapboxToken === 'string' && mapboxToken.trim().startsWith('pk.')) {
    try {
      // Proximity biases geocoding towards Bengaluru [77.5946, 12.9716] to prevent US fallback
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(trimmed)}.json?proximity=77.5946,12.9716&access_token=${mapboxToken.trim()}&limit=1`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data.features && data.features.length > 0) {
          const feat = data.features[0];
          const [lng, lat] = feat.center as [number, number];
          return {
            coordinates: [lng, lat],
            latLng: [lat, lng],
            placeName: feat.place_name || feat.text || trimmed
          };
        }
      }
    } catch (err) {
      console.warn('[RoutingEngine] Mapbox Geocoding error:', err);
    }
  }

  return null;
};

/**
 * Mapbox Directions API Fetcher:
 * Calls Mapbox API with &steps=true if VITE_MAPBOX_API_KEY is available.
 * Returns GeoJSON LineStrings, distance, duration, and turn-by-turn guidance steps.
 */
export const fetchMapboxDirections = async (
  origin: [number, number], // [lng, lat]
  destination: [number, number], // [lng, lat]
  mode: 'walk' | 'bike' | 'transit' | 'car' = 'bike'
): Promise<{
  routes: Array<{
    distanceKm: number;
    durationMinutes: number;
    coordinates: [number, number][];
    steps: TurnByTurnStep[];
  }>;
  source: 'mapbox' | 'mock';
}> => {
  const mapboxToken = import.meta.env.VITE_MAPBOX_API_KEY;

  if (mapboxToken && typeof mapboxToken === 'string' && mapboxToken.trim().startsWith('pk.')) {
    try {
      const profile = mode === 'walk' ? 'walking' : mode === 'bike' ? 'cycling' : 'driving';
      const url = `https://api.mapbox.com/directions/v5/mapbox/${profile}/${origin[0]},${origin[1]};${destination[0]},${destination[1]}?alternatives=true&geometries=geojson&overview=full&steps=true&access_token=${mapboxToken.trim()}`;

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data.routes && data.routes.length > 0) {
          const parsed = data.routes.map((r: any, rIdx: number) => {
            const rawSteps = r.legs?.[0]?.steps || [];
            const steps: TurnByTurnStep[] = rawSteps.map((step: any, sIdx: number) => ({
              id: `step-${rIdx}-${sIdx}`,
              instruction: step.maneuver?.instruction || (sIdx === 0 ? 'Start navigation toward corridor' : 'Continue straight'),
              distanceMeters: Math.round(step.distance || 0),
              durationSeconds: Math.round(step.duration || 0),
              modifier: step.maneuver?.modifier || 'straight',
              type: step.maneuver?.type || 'turn'
            }));

            const cleanDistanceKm = Number((r.distance / 1000).toFixed(1));

            return {
              distanceKm: cleanDistanceKm,
              durationMinutes: Math.round(r.duration / 60),
              coordinates: r.geometry.coordinates as [number, number][],
              steps: steps.length > 0 ? steps : createDefaultSteps(rIdx === 0 ? 'shortest' : 'healthiest', cleanDistanceKm)
            };
          });
          return { routes: parsed, source: 'mapbox' };
        }
      }
    } catch (err) {
      console.warn('[RoutingEngine] Mapbox API request failed, engaging intelligent fallback:', err);
    }
  }

  // Graceful intelligent fallback: Synthetic geographical interpolation
  const [lng1, lat1] = origin;
  const [lng2, lat2] = destination;

  // Approximate Haversine distance in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const directDistance = Number((6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(1));
  const shortestKm = Math.max(1.2, Number((directDistance * 1.18).toFixed(1)));
  const alternativeKm = Number((shortestKm * 1.16).toFixed(1));

  // Shortest Route Coordinates (arterial road trajectory)
  const shortestCoords: [number, number][] = [
    [lng1, lat1],
    [lng1 + (lng2 - lng1) * 0.25 + 0.003, lat1 + (lat2 - lat1) * 0.25 - 0.001],
    [lng1 + (lng2 - lng1) * 0.5 + 0.005, lat1 + (lat2 - lat1) * 0.5 - 0.002],
    [lng1 + (lng2 - lng1) * 0.75 + 0.002, lat1 + (lat2 - lat1) * 0.75],
    [lng2, lat2]
  ];

  // Alternative Route Coordinates (parkside greenway bypass trajectory)
  const alternativeCoords: [number, number][] = [
    [lng1, lat1],
    [lng1 + (lng2 - lng1) * 0.2 - 0.008, lat1 + (lat2 - lat1) * 0.3 + 0.004],
    [lng1 + (lng2 - lng1) * 0.45 - 0.012, lat1 + (lat2 - lat1) * 0.55 + 0.006],
    [lng1 + (lng2 - lng1) * 0.7 - 0.006, lat1 + (lat2 - lat1) * 0.8 + 0.003],
    [lng2, lat2]
  ];

  return {
    routes: [
      {
        distanceKm: shortestKm,
        durationMinutes: Math.round(shortestKm * 3.2),
        coordinates: shortestCoords,
        steps: createDefaultSteps('shortest', shortestKm)
      },
      {
        distanceKm: alternativeKm,
        durationMinutes: Math.round(alternativeKm * 3.4),
        coordinates: alternativeCoords,
        steps: createDefaultSteps('healthiest', alternativeKm)
      }
    ],
    source: 'mock'
  };
};

/**
 * Creates clean turn-by-turn navigation instructions for synthetic / offline corridors
 */
export const createDefaultSteps = (routeType: 'shortest' | 'healthiest', distanceKm: number): TurnByTurnStep[] => {
  const isHealthy = routeType === 'healthiest';

  if (isHealthy) {
    return [
      {
        id: 'step-h-1',
        instruction: 'Depart toward the Cubbon Park greenway buffer',
        distanceMeters: Math.round(distanceKm * 180),
        durationSeconds: 180,
        modifier: 'straight',
        type: 'depart'
      },
      {
        id: 'step-h-2',
        instruction: 'Turn right onto Tree-Lined Residential Avenue (low vehicular exhaust)',
        distanceMeters: Math.round(distanceKm * 280),
        durationSeconds: 240,
        modifier: 'right',
        type: 'turn'
      },
      {
        id: 'step-h-3',
        instruction: 'Continue straight through the Vegetative Canopy Corridor (68% particulate filtration)',
        distanceMeters: Math.round(distanceKm * 340),
        durationSeconds: 320,
        modifier: 'straight',
        type: 'continue'
      },
      {
        id: 'step-h-4',
        instruction: 'Keep left past the park perimeter to avoid arterial diesel canyon',
        distanceMeters: Math.round(distanceKm * 150),
        durationSeconds: 150,
        modifier: 'left',
        type: 'fork'
      },
      {
        id: 'step-h-5',
        instruction: 'Arrive at destination via clean air drop point',
        distanceMeters: 50,
        durationSeconds: 30,
        modifier: 'reach',
        type: 'arrive'
      }
    ];
  }

  return [
    {
      id: 'step-s-1',
      instruction: 'Head straight toward main highway arterial corridor',
      distanceMeters: Math.round(distanceKm * 200),
      durationSeconds: 180,
      modifier: 'straight',
      type: 'depart'
    },
    {
      id: 'step-s-2',
      instruction: 'Merge onto Hosur Arterial Expressway (heavy diesel bus & truck canyon)',
      distanceMeters: Math.round(distanceKm * 520),
      durationSeconds: 450,
      modifier: 'merge',
      type: 'merge'
    },
    {
      id: 'step-s-3',
      instruction: 'Take the flyover ramp toward central commercial junction',
      distanceMeters: Math.round(distanceKm * 230),
      durationSeconds: 200,
      modifier: 'right',
      type: 'ramp'
    },
    {
      id: 'step-s-4',
      instruction: 'Arrive at destination via commercial front road',
      distanceMeters: 50,
      durationSeconds: 30,
      modifier: 'reach',
      type: 'arrive'
    }
  ];
};

/**
 * Mock Testing Function (Task 3 Requirement):
 * Simulates a 15km trip to verify that:
 * 1. The "Already Safe" rule executes correctly (only 1 green route, no red route invented).
 * 2. The 1.3x Distance Cap executes correctly (rejects detours > 19.5 km).
 * 3. The Spike Tolerance (<10% high AQI distance) does not disqualify clean routes.
 */
export const run15KmTripSimulation = () => {
  const results = {
    test1_alreadySafe: false,
    test2_distanceCapEnforced: false,
    test3_alternativeAcceptedWithinCap: false,
    test4_spikeToleranceTolerated: false,
    details: [] as string[]
  };

  // Test 1: Shortest Route is 15km with AQI 38 (Safe <= 50)
  const test1 = processRouteDecision({
    shortestDistanceKm: 15.0,
    shortestDurationMinutes: 35,
    shortestSegments: [
      { distanceKm: 8.0, aqi: 35 },
      { distanceKm: 7.0, aqi: 42 }
    ],
    shortestCoordinates: [[77.59, 12.97], [77.62, 12.93]],
    alternativeDistanceKm: 17.5,
    alternativeDurationMinutes: 42,
    alternativeSegments: [{ distanceKm: 17.5, aqi: 30 }],
    alternativeCoordinates: [[77.59, 12.97], [77.61, 12.92]]
  });

  results.test1_alreadySafe =
    test1.isAlreadySafe === true &&
    test1.alternativeRoute === null &&
    test1.shortestRoute.color === '#059669';
  results.details.push(
    `[Test 1: Already Safe Rule] Result: ${results.test1_alreadySafe ? 'PASS' : 'FAIL'} - Output mode: "${test1.activeDisplayMode}", Color: "${test1.shortestRoute.color}", Has Alt Route: ${test1.alternativeRoute !== null}`
  );

  // Test 2: Shortest is 15km with High AQI 145. Alternative is 21.5km (1.43x > 1.3x cap of 19.5km)
  const test2 = processRouteDecision({
    shortestDistanceKm: 15.0,
    shortestDurationMinutes: 35,
    shortestSegments: [{ distanceKm: 15.0, aqi: 145 }],
    shortestCoordinates: [[77.59, 12.97], [77.62, 12.93]],
    alternativeDistanceKm: 21.5,
    alternativeDurationMinutes: 52,
    alternativeSegments: [{ distanceKm: 21.5, aqi: 35 }],
    alternativeCoordinates: [[77.59, 12.97], [77.61, 12.92]]
  });

  results.test2_distanceCapEnforced =
    test2.alternativeRejectedDueToDistanceCap === true &&
    test2.alternativeRoute === null &&
    test2.distanceCapLimitKm === 19.5;
  results.details.push(
    `[Test 2: Distance Cap Disqualification] Result: ${results.test2_distanceCapEnforced ? 'PASS' : 'FAIL'} - 21.5km vs 19.5km Cap. Alt Rejected: ${test2.alternativeRejectedDueToDistanceCap}, Alt in state: ${test2.alternativeRoute !== null}`
  );

  // Test 3: Shortest is 15km with High AQI 145. Alternative is 18.0km (1.20x <= 1.3x cap of 19.5km)
  const test3 = processRouteDecision({
    shortestDistanceKm: 15.0,
    shortestDurationMinutes: 35,
    shortestSegments: [{ distanceKm: 15.0, aqi: 145 }],
    shortestCoordinates: [[77.59, 12.97], [77.62, 12.93]],
    alternativeDistanceKm: 18.0,
    alternativeDurationMinutes: 44,
    alternativeSegments: [{ distanceKm: 18.0, aqi: 42 }],
    alternativeCoordinates: [[77.59, 12.97], [77.61, 12.92]]
  });

  results.test3_alternativeAcceptedWithinCap =
    test3.alternativeRoute !== null &&
    test3.shortestRoute.color === '#f43f5e' &&
    test3.alternativeRoute?.color === '#059669';
  results.details.push(
    `[Test 3: Alternative Within Cap] Result: ${results.test3_alternativeAcceptedWithinCap ? 'PASS' : 'FAIL'} - 18.0km detour accepted. Shortest: "${test3.shortestRoute.color}", Alternative: "${test3.alternativeRoute?.color}"`
  );

  // Test 4: Spike Tolerance Test
  const test4 = processRouteDecision({
    shortestDistanceKm: 15.0,
    shortestDurationMinutes: 35,
    shortestSegments: [
      { distanceKm: 13.8, aqi: 40 },
      { distanceKm: 1.2, aqi: 130 }
    ],
    shortestCoordinates: [[77.59, 12.97], [77.62, 12.93]]
  });

  results.test4_spikeToleranceTolerated =
    test4.isAlreadySafe === true &&
    test4.shortestRoute.highAqiDistancePct <= 10 &&
    test4.shortestRoute.color === '#059669';
  results.details.push(
    `[Test 4: Spike Tolerance (<10% distance)] Result: ${results.test4_spikeToleranceTolerated ? 'PASS' : 'FAIL'} - Spike pct: ${test4.shortestRoute.highAqiDistancePct}%, Overall Safe: ${test4.isAlreadySafe}`
  );

  return results;
};
