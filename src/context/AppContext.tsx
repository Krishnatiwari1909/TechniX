import React, { createContext, useContext, useState } from 'react';
import { UserProfile, PersonaType, CommuteMode } from '../types';
import { PERSONA_CONFIGS } from '../data/mockData';

interface AppContextType {
  pm25Level: number;
  setPm25Level: (level: number) => void;
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
}

const DEFAULT_PROFILE: UserProfile = {
  name: 'Alex Chen',
  persona: 'runner',
  emergencyName: 'Sarah Chen (Partner)',
  emergencyContact: '+1 (555) 382-9912',
  commuteTime: '08:15',
  returnTime: '18:00',
  commuteMode: 'bicycle',
  sensitivities: ['Asthma'],
  exposureMultiplier: 2.45,
  onboardingCompleted: true
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [pm25Level, setPm25Level] = useState<number>(84);
  const [departureTimeIndex, setDepartureTimeIndex] = useState<number>(4); // 08:00 AM
  const [activeTab, setActiveTab] = useState<'home' | 'map' | 'alerts' | 'profile'>('home');
  const [showOnboarding, setShowOnboarding] = useState<boolean>(false);
  const [chatOpen, setChatOpen] = useState<boolean>(false);
  const [selectedRouteId, setSelectedRouteId] = useState<string>('route-clean');

  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem('atmosai_user_profile_v2');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Could not read user profile from localStorage', e);
    }
    return DEFAULT_PROFILE;
  });

  const calculateMultiplier = (persona: PersonaType, mode: CommuteMode, sensitivities: string[]): number => {
    let base = PERSONA_CONFIGS[persona]?.baseMultiplier || 1.5;
    
    // Mode multiplier
    if (mode === 'bicycle' || mode === 'walking') base += 0.35;
    else if (mode === 'two-wheeler') base += 0.25;
    else if (mode === 'transit') base += 0.10;
    
    // Sensitivities
    if (sensitivities.includes('Asthma')) base += 0.40;
    if (sensitivities.includes('Cardiovascular')) base += 0.30;
    if (sensitivities.includes('Allergies')) base += 0.15;
    
    return Math.round(base * 100) / 100;
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
        setSelectedRouteId
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

