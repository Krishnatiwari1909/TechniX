import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, PersonaType, CommuteMode } from '../types';
import { PERSONA_CONFIGS } from '../data/mockData';

interface AppContextType {
  pm25Level: number;
  setPm25Level: (level: number) => void;
  windDirection: number;
  setWindDirection: (deg: number) => void;
  windSpeed: number;
  setWindSpeed: (spd: number) => void;
  telemetryHistory: { time: string; pm25: number }[];
  setTelemetryHistory: React.Dispatch<React.SetStateAction<{ time: string; pm25: number }[]>>;
  departureTimeIndex: number;
  setDepartureTimeIndex: (idx: number) => void;
  userProfile: UserProfile;
  updateProfile: (updates: Partial<UserProfile>) => void;
  calculateMultiplier: (persona: PersonaType, mode: CommuteMode, sensitivities: string[]) => number;
  activeTab: 'home' | 'map' | 'alerts' | 'profile';
  setActiveTab: (tab: 'home' | 'map' | 'alerts' | 'profile') => void;
  showOnboarding: boolean;
  setShowOnboarding: (show: boolean) => void;
  chatOpen: boolean;
  setChatOpen: (open: boolean) => void;
  selectedRouteId: string;
  setSelectedRouteId: (id: string) => void;
  userLocation: { lat: number; lng: number; name?: string; locality?: string } | null;
  setUserLocation: (loc: { lat: number; lng: number; name?: string; locality?: string } | null) => void;
  isLocating: boolean;
  isSimulating: boolean;
  setIsSimulating: (simulating: boolean) => void;
}

export const BENGALURU_FALLBACK_COORDS = {
  lat: 12.9716,
  lng: 77.5946,
  name: 'Bengaluru (MG Road)',
  locality: 'Bengaluru'
};

const DEFAULT_PROFILE: UserProfile = {
  name: 'Alex Chen',
  persona: 'runner',
  emergencyName: 'Sarah Chen (Partner)',
  emergencyContact: '+1 (555) 382-9912',
  commuteTime: '08:15',
  returnTime: '18:00',
  commuteMode: 'bicycle',
  destination: 'IISc Bangalore Campus',
  sensitivities: ['Asthma'],
  exposureMultiplier: 2.45,
  onboardingCompleted: true
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [pm25Level, setPm25Level] = useState<number>(84);
  const [windDirection, setWindDirection] = useState<number>(65);
  const [windSpeed, setWindSpeed] = useState<number>(11.2);
  const [telemetryHistory, setTelemetryHistory] = useState<{ time: string; pm25: number }[]>([
    { time: 'T-27s', pm25: 81 },
    { time: 'T-24s', pm25: 83 },
    { time: 'T-21s', pm25: 82 },
    { time: 'T-18s', pm25: 85 },
    { time: 'T-15s', pm25: 84 },
    { time: 'T-12s', pm25: 86 },
    { time: 'T-9s', pm25: 83 },
    { time: 'T-6s', pm25: 85 },
    { time: 'T-3s', pm25: 84 },
    { time: 'Live', pm25: 84 }
  ]);
  const [departureTimeIndex, setDepartureTimeIndex] = useState<number>(4); // 08:00 AM
  const [activeTab, setActiveTab] = useState<'home' | 'map' | 'alerts' | 'profile'>('home');
  const [showOnboarding, setShowOnboarding] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('atmosai_user_profile_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.onboardingCompleted) {
          return false; // Skip wizard on subsequent visits
        }
      }
    } catch (e) {
      console.warn('Could not read onboarding state from localStorage', e);
    }
    return false;
  });
  const [chatOpen, setChatOpen] = useState<boolean>(false);
  const [selectedRouteId, setSelectedRouteId] = useState<string>('route-clean');
  
  // Task 2: Auto-Geolocation with guaranteed Bengaluru [12.9716, 77.5946] Fallback
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number; name?: string; locality?: string } | null>(BENGALURU_FALLBACK_COORDS);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);

  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem('atmosai_user_profile_v2');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Could not read user profile from localStorage', e);
    }
    return DEFAULT_PROFILE;
  });

  // Task 2: Auto-Geolocation on mount with Bengaluru default fallback if blocked, failing, or timed out
  useEffect(() => {
    const applyBengaluruFallback = () => {
      setUserLocation(BENGALURU_FALLBACK_COORDS);
      setIsLocating(false);
    };

    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      setIsLocating(true);

      // Safety timeout (5s): if browser hangs or takes too long, fallback to Bengaluru
      const timeoutId = setTimeout(() => {
        setUserLocation(prev => {
          if (!prev || (prev.lat === BENGALURU_FALLBACK_COORDS.lat && prev.lng === BENGALURU_FALLBACK_COORDS.lng)) {
            console.warn('[Auto-Geolocation] Geolocation timed out (5s), defaulting to Bengaluru [12.9716, 77.5946]');
            return BENGALURU_FALLBACK_COORDS;
          }
          return prev;
        });
        setIsLocating(false);
      }, 5000);

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          clearTimeout(timeoutId);
          const { latitude, longitude } = position.coords;

          if (latitude == null || longitude == null || isNaN(latitude) || isNaN(longitude)) {
            applyBengaluruFallback();
            return;
          }

          setUserLocation({ lat: latitude, lng: longitude, locality: 'Live Location', name: 'Live GPS Location' });

          try {
            // 1. Fetch real-time localized PM2.5 from Open-Meteo Air Quality API
            const aqiRes = await fetch(
              `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${latitude}&longitude=${longitude}&current=pm2_5`
            );
            if (aqiRes.ok) {
              const aqiData = await aqiRes.json();
              if (aqiData?.current?.pm2_5 != null) {
                const livePM = Math.round(aqiData.current.pm2_5);
                setPm25Level(livePM);
                setTelemetryHistory(prev => [
                  ...prev.slice(-9),
                  { time: 'Live GPS', pm25: livePM }
                ]);
              }
            }

            // 2. Reverse geocode to get locality name and override manual wizard selection
            const geoRes = await fetch(
              `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
            );
            if (geoRes.ok) {
              const geoData = await geoRes.json();
              const placeName = geoData.locality || geoData.city || geoData.principalSubdivision || 'Detected Location';
              setUserLocation({ lat: latitude, lng: longitude, name: placeName, locality: placeName });
              setUserProfile(prev => {
                const updated = { ...prev, destination: placeName };
                try {
                  localStorage.setItem('atmosai_user_profile_v2', JSON.stringify(updated));
                } catch (e) {
                  console.warn('Could not persist updated location to localStorage', e);
                }
                return updated;
              });
            }
          } catch (err) {
            console.warn('[Auto-Geolocation] Environmental fetch failed, using localized telemetry:', err);
          } finally {
            setIsLocating(false);
          }
        },
        (error) => {
          clearTimeout(timeoutId);
          console.warn('[Auto-Geolocation] Location permission blocked or failed:', error.message);
          applyBengaluruFallback();
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 60000 }
      );
    } else {
      applyBengaluruFallback();
    }
  }, []);

  // Phase 19 Task 3: Dynamic math multiplier:
  // Base: 1.0x (Car), 1.5x (Two-Wheeler), 1.8x (Bicycle), 2.0x (Walking).
  // Penalty: +0.5x if Asthma or Cardiovascular is checked.
  const calculateMultiplier = (_persona: PersonaType, mode: CommuteMode, sensitivities: string[]): number => {
    let base = 1.0;
    const m = (mode || '').toLowerCase();
    if (m === 'walking' || m === 'walk') {
      base = 2.0;
    } else if (m === 'bicycle' || m === 'bike') {
      base = 1.8;
    } else if (m === 'two-wheeler' || m === 'motorbike' || m === 'motorcycle') {
      base = 1.5;
    } else if (m === 'transit' || m === 'bus') {
      base = 1.2;
    } else if (m === 'car') {
      base = 1.0;
    }

    const hasPenalty = sensitivities && sensitivities.some(s => {
      const lower = s.toLowerCase();
      return lower.includes('asthma') || lower.includes('cardio');
    });

    if (hasPenalty) {
      base += 0.5;
    }

    return Math.round(base * 10) / 10;
  };

  const updateProfile = (updates: Partial<UserProfile>) => {
    setUserProfile(prev => {
      const merged = { ...prev, ...updates };
      const newMultiplier = calculateMultiplier(merged.persona, merged.commuteMode, merged.sensitivities);
      const updated = { ...merged, exposureMultiplier: newMultiplier };
      try {
        localStorage.setItem('atmosai_user_profile_v2', JSON.stringify(updated));
      } catch (e) {
        console.warn('Could not save profile to localStorage', e);
      }
      return updated;
    });
  };

  return (
    <AppContext.Provider
      value={{
        pm25Level,
        setPm25Level,
        windDirection,
        setWindDirection,
        windSpeed,
        setWindSpeed,
        telemetryHistory,
        setTelemetryHistory,
        departureTimeIndex,
        setDepartureTimeIndex,
        userProfile,
        updateProfile,
        calculateMultiplier,
        activeTab,
        setActiveTab,
        showOnboarding,
        setShowOnboarding,
        chatOpen,
        setChatOpen,
        selectedRouteId,
        setSelectedRouteId,
        userLocation,
        setUserLocation,
        isLocating,
        isSimulating,
        setIsSimulating
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

