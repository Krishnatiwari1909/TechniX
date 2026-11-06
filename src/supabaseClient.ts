import { createClient } from '@supabase/supabase-js';

// Phase 30 Task 1: Environment Variable Diagnostics
console.log("Supabase URL:", import.meta.env.VITE_SUPABASE_URL ? "Loaded" : "MISSING");
console.log("Supabase Key:", import.meta.env.VITE_SUPABASE_ANON_KEY ? "Loaded" : "MISSING");

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://hfgavtrkzloetrrgvpnd.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_bTsnrGUd-0Bbpr_9q8G1NA_dbwxcWOn';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

