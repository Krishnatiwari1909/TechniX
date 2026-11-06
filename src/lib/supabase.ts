import { createClient } from '@supabase/supabase-js';

// Environment variables for Supabase (configured in .env)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://hfgavtrkzloetrrgvpnd.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_bTsnrGUd-0Bbpr_9q8G1NA_dbwxcWOn';

export const isSupabaseConfigured = () => {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  return Boolean(url && key && !url.includes('your-project-id') && !url.includes('placeholder'));
};

/**
 * Supabase Client Initialization
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export interface UserProfileRow {
  id: string;
  full_name: string | null;
  transport_mode: 'bike' | 'walk' | 'car' | 'transit' | string | null;
  health_persona: 'standard' | 'asthmatic' | 'athlete' | string | null;
  created_at?: string;
  updated_at?: string;
}

/**
 * Helper to calculate personalized biological multiplier based on fetched profile
 * Phase 24: Base is 1.0x (Car), 1.5x (Two-Wheeler/Public Transit), 1.8x (Bicycle), or 2.0x (Walking).
 * If "+ Asthma" or "+ Cardiovascular", add 0.5x penalty.
 */
export function calculateDynamicMultiplier(
  personaOrSensitivities: string | string[] | null | undefined,
  transportMode: string | null | undefined
): number {
  let base = 1.0;
  const mode = (transportMode || '').toLowerCase().trim();
  
  if (mode === 'car') {
    base = 1.0;
  } else if (
    mode === 'two-wheeler' || 
    mode === 'two wheeler' || 
    mode === 'motorbike' || 
    mode === 'motorcycle' || 
    mode === 'transit' || 
    mode === 'public transit' || 
    mode === 'bus' || 
    mode === 'metro'
  ) {
    base = 1.5;
  } else if (mode === 'bike' || mode === 'bicycle') {
    base = 1.8;
  } else if (mode === 'walk' || mode === 'walking') {
    base = 2.0;
  }

  let hasPenalty = false;
  if (Array.isArray(personaOrSensitivities)) {
    hasPenalty = personaOrSensitivities.some(s => {
      const lower = s.toLowerCase();
      return lower.includes('asthma') || lower.includes('cardio');
    });
  } else if (typeof personaOrSensitivities === 'string') {
    const lower = personaOrSensitivities.toLowerCase();
    hasPenalty = lower.includes('asthma') || lower.includes('asthmatic') || lower.includes('cardio');
  }

  if (hasPenalty) {
    base += 0.5;
  }

  return Math.round(base * 10) / 10;
}

