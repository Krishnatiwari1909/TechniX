import { createClient } from '@supabase/supabase-js';

// Environment variables for Supabase (configured in .env)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-anon-key';

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
 * Helper to calculate personalized biological multiplier based on fetched Supabase profile
 */
export function calculateDynamicMultiplier(
  persona: string | null | undefined,
  transportMode: string | null | undefined
): number {
  let base = 1.2; // Standard base

  // Persona adjustments
  const p = (persona || 'standard').toLowerCase();
  if (p === 'asthmatic') {
    base = 2.1;
  } else if (p === 'athlete' || p === 'runner') {
    base = 1.85;
  }

  // Transport mode ventilation / outdoor exposure adjustments
  const mode = (transportMode || 'bike').toLowerCase();
  if (mode === 'bike' || mode === 'bicycle' || mode === 'two-wheeler') {
    base += 0.45;
  } else if (mode === 'walk' || mode === 'walking') {
    base += 0.35;
  } else if (mode === 'transit' || mode === 'bus' || mode === 'metro') {
    base += 0.15;
  } else if (mode === 'car') {
    base += 0.05;
  }

  return Math.round(base * 100) / 100;
}
