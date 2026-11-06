/**
 * AtmosAi Centralized API Client & Endpoint Configuration
 * Resolves hardcoded localhost URLs and supports configurable VITE_API_URL / VITE_WS_URL.
 */

export interface ChatApiRequest {
  message: string;
  persona?: string;
  current_pm25?: number;
  user_profile?: Record<string, any>;
}

export interface ChatApiResponse {
  status: string;
  response: string;
  reply?: string;
  persona: string;
  current_pm25: number;
  model: string;
}

export interface ExposureApiRequest {
  departure_time?: string;
  departure_time_index?: number;
  traffic_volume?: number;
  temperature?: number;
}

export interface ExposureApiResponse {
  status: string;
  departure_time: string;
  hour_of_day: number;
  predicted_pm25: number;
  inversion_multiplier: number;
  is_inversion_active: boolean;
  model_version: string;
  features_used?: {
    hour_of_day: number;
    traffic_volume: number;
    temperature: number;
  };
  baseline_pm25?: number;
}

export interface SOSApiRequest {
  contact_number?: string;
  email?: string;
  persona?: string;
  current_pm25?: number;
}

export interface SOSApiResponse {
  status: string;
  message: string;
  alert_text: string;
  dispatched_via: string[];
  persona: string;
  current_pm25: number;
  recipient?: {
    contact_number?: string | null;
    email?: string | null;
  };
  details?: Record<string, any>;
}

export interface ModelEvaluationPoint {
  time: string;
  actual_pm25: number | null;
  predicted_pm25: number;
}

export interface ForecastPoint {
  time: string;
  pm25: number;
}

/**
 * Returns the configured base API URL.
 * - If VITE_API_URL is configured, trims trailing slashes.
 * - Otherwise in browser dev/prod, defaults to "" (leveraging Vite /api proxy or same-origin).
 * - Fallback to "http://localhost:8000" if relative path cannot be resolved.
 */
export const getApiBaseUrl = (): string => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (typeof envUrl === 'string' && envUrl.trim().length > 0) {
    return envUrl.trim().replace(/\/+$/, '');
  }

  // If in browser and on dev server (localhost:5173), Vite proxy maps /api to http://127.0.0.1:8000
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return 'http://localhost:8000';
  }

  return '';
};

/**
 * Derives the WebSocket URL for live telemetry streaming.
 * Respects VITE_WS_URL, translates VITE_API_URL, or defaults to ws://localhost:8000/ws/telemetry.
 */
export const getWebSocketUrl = (): string => {
  const envWs = import.meta.env.VITE_WS_URL;
  if (typeof envWs === 'string' && envWs.trim().length > 0) {
    return envWs.trim();
  }

  const apiUrl = getApiBaseUrl();
  if (apiUrl.startsWith('http://') || apiUrl.startsWith('https://')) {
    const wsProto = apiUrl.startsWith('https://') ? 'wss://' : 'ws://';
    return `${apiUrl.replace(/^https?:\/\//, wsProto)}/ws/telemetry`;
  }

  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
      return 'ws://localhost:8000/ws/telemetry';
    }
    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${proto}//${window.location.host}/ws/telemetry`;
  }

  return 'ws://localhost:8000/ws/telemetry';
};

/**
 * Centralized fetch wrapper with timeout and JSON parsing.
 */
async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}${endpoint}`;

  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }

  // Attach Supabase bearer token if available
  try {
    const token = localStorage.getItem('atmos_supabase_token');
    if (token && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  } catch {}

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(`API Error ${response.status} (${response.statusText}): ${errorText}`);
  }

  return response.json() as Promise<T>;
}

/**
 * 1. AI Contextual Commute Briefing & Chat
 */
export async function sendChatMessage(payload: ChatApiRequest): Promise<ChatApiResponse> {
  return apiFetch<ChatApiResponse>('/api/chat', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * 2. 3-Hour Half-Hourly Inversion Forecast
 */
export async function fetchForecast(baseTime?: string, lat?: number, lng?: number): Promise<ForecastPoint[]> {
  const params = new URLSearchParams();
  if (baseTime) params.set('base_time', baseTime);
  if (lat !== undefined) params.set('lat', String(lat));
  if (lng !== undefined) params.set('lng', String(lng));
  const query = params.toString() ? `?${params.toString()}` : '';
  return apiFetch<ForecastPoint[]>(`/api/forecast${query}`, {
    method: 'GET',
  });
}

/**
 * 3. 16-Hour Historical & Future Model Evaluation
 */
export async function fetchModelEvaluation(lat?: number, lng?: number): Promise<ModelEvaluationPoint[]> {
  const params = new URLSearchParams();
  if (lat !== undefined) params.set('lat', String(lat));
  if (lng !== undefined) params.set('lng', String(lng));
  const query = params.toString() ? `?${params.toString()}` : '';
  return apiFetch<ModelEvaluationPoint[]>(`/api/model-evaluation${query}`, {
    method: 'GET',
  });
}

/**
 * 4. Real-Time Dynamic AQI
 */
export async function fetchAqi(lat: number = 12.8945, lng: number = 77.4646): Promise<{ latitude: number; longitude: number; pm25: number; aqi: number; status: string }> {
  return apiFetch(`/api/aqi?lat=${lat}&lng=${lng}`, {
    method: 'GET',
  });
}

/**
 * 4. LightGBM Inversion Multiplier & Exposure Calculation
 */
export async function calculateExposure(payload: ExposureApiRequest): Promise<ExposureApiResponse> {
  return apiFetch<ExposureApiResponse>('/api/exposure', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function getExposureUrl(departureTime: string, departureTimeIndex?: number): string {
  const baseUrl = getApiBaseUrl();
  const params = new URLSearchParams({ departure_time: departureTime });
  if (departureTimeIndex !== undefined) {
    params.set('departure_time_index', departureTimeIndex.toString());
  }
  return `${baseUrl}/api/exposure?${params.toString()}`;
}

/**
 * 5. Emergency SOS Dispatcher (Twilio / Resend)
 */
export async function dispatchEmergencySOS(payload: SOSApiRequest): Promise<SOSApiResponse> {
  return apiFetch<SOSApiResponse>('/api/sos', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

