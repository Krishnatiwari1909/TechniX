-- ==============================================================================
-- AtmosAi - Development Database Seed Script
-- Run this script in the Supabase SQL Editor if you wish to seed mock test users.
-- ==============================================================================

-- Note: In production Supabase, user_id references auth.users(id).
-- To insert a mock profile for testing without auth.users foreign key constraint:
-- INSERT INTO public.profiles (user_id, name, commute_mode, sensitivities, persona, destination, exposure_multiplier)
-- VALUES (
--   '00000000-0000-0000-0000-000000000001',
--   'Alex Chen (Runner)',
--   'bicycle',
--   ARRAY['Asthma'],
--   'runner',
--   'IISc Bangalore Campus',
--   2.3
-- )
-- ON CONFLICT (user_id) DO NOTHING;

