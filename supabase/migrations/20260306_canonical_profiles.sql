-- ==============================================================================
-- AtmosAi - Supabase User Profiles Schema & RLS Policies (Phase 1 Stabilization)
-- Safe, non-destructive migration aligning with application data model 'profiles'.
-- Run this script in the Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql
-- ==============================================================================

-- 1. Create the canonical profiles table expected by AtmosAi application code
CREATE TABLE IF NOT EXISTS public.profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  commute_mode TEXT DEFAULT 'bicycle',
  sensitivities TEXT[] DEFAULT '{}',
  persona TEXT DEFAULT 'commuter',
  destination TEXT,
  emergency_name TEXT,
  emergency_contact TEXT,
  commute_time TEXT,
  return_time TEXT,
  exposure_multiplier NUMERIC DEFAULT 1.0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Non-destructive sync: If legacy user_profiles table exists, safely copy rows
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'user_profiles'
  ) THEN
    INSERT INTO public.profiles (user_id, name, commute_mode, persona, created_at, updated_at)
    SELECT 
      id AS user_id, 
      coalesce(full_name, 'Commuter') AS name, 
      coalesce(transport_mode, 'bicycle') AS commute_mode, 
      coalesce(health_persona, 'commuter') AS persona, 
      created_at, 
      updated_at
    FROM public.user_profiles
    ON CONFLICT (user_id) DO UPDATE SET
      name = coalesce(EXCLUDED.name, public.profiles.name),
      commute_mode = coalesce(EXCLUDED.commute_mode, public.profiles.commute_mode),
      updated_at = timezone('utc'::text, now());
  END IF;
END $$;

-- 3. Enable Row-Level Security (RLS) on public.profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies: Authenticated users can only read, insert, and update their own records
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 5. Automatic Trigger: Creates a profiles row on auth.users signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name, commute_mode, persona)
  VALUES (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', 'Commuter'),
    coalesce(new.raw_user_meta_data->>'commute_mode', new.raw_user_meta_data->>'transport_mode', 'bicycle'),
    coalesce(new.raw_user_meta_data->>'persona', new.raw_user_meta_data->>'health_persona', 'commuter')
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN new;
END;
$$;

-- Drop existing trigger if it exists and re-bind to auth.users after insert
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. Add comment documentation
COMMENT ON TABLE public.profiles IS 'Stores demographic, mobility, and vulnerability parameters for AtmosAi exposure modeling.';
