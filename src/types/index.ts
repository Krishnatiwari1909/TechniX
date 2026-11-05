export type PersonaType = 'runner' | 'parent' | 'commuter';

export type CommuteMode = 'bicycle' | 'walking' | 'transit' | 'car' | 'two-wheeler';

export interface UserProfile {
  name: string;
  persona: PersonaType;
  emergencyName: string;
  emergencyContact: string;
  commuteTime: string; // e.g. "08:15"
  returnTime: string;  // e.g. "18:00"
  commuteMode: CommuteMode;
  sensitivities: string[]; // e.g. "Asthma", "Allergies"
  exposureMultiplier: number;
  onboardingCompleted: boolean;
}

export interface HourlyAQIData {
  time: string;
  timestamp: number;
  actualPM25: number | null;
  predictedPM25: number;
  confidenceMin: number;
  confidenceMax: number;
  temperature: number;
  humidity: number;
}

export interface RouteOption {
  id: string;
  title: string;
  subtitle: string;
  type: 'clean' | 'polluted';
  distanceKm: number;
  durationMins: number;
  avgPM25: number;
  aqiScore: number;
  inhalationDelta: string;
  color: string;
  coordinates: [number, number][];
  waypoints: { name: string; lat: number; lng: number; pm25: number }[];
  demographicAdvice: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'atmos';
  text: string;
  timestamp: string;
  badge?: string;
  quickActions?: string[];
}

export interface AlertNotification {
  id: string;
  level: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  timestamp: string;
  affectedDemographic: string;
  actionRequired: string;
  read: boolean;
}

