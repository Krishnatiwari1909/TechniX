-- ==============================================================================
-- AtmosAi - Phase 12: Supabase User Profiles Schema & RLS Policies
-- Run this script in the Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql
-- ==============================================================================

-- 1. Create the user_profiles table
create table if not exists public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  transport_mode text default 'bike' check (transport_mode in ('bike', 'walk', 'car', 'transit')),
  health_persona text default 'standard' check (health_persona in ('standard', 'asthmatic', 'athlete')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Enable Row-Level Security (RLS)
alter table public.user_profiles enable row level security;

-- 3. RLS Policies: Authenticated users can only read & update their own records
drop policy if exists "Users can view own profile" on public.user_profiles;
create policy "Users can view own profile"
  on public.user_profiles
  for select
  to authenticated
  using (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.user_profiles;
create policy "Users can update own profile"
  on public.user_profiles
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "Users can insert own profile" on public.user_profiles;
create policy "Users can insert own profile"
  on public.user_profiles
  for insert
  to authenticated
  with check (auth.uid() = id);

-- 4. Automatic Trigger: Creates a user_profiles row on auth.users signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.user_profiles (id, full_name, transport_mode, health_persona)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'transport_mode', 'bike'),
    coalesce(new.raw_user_meta_data->>'health_persona', 'standard')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Drop existing trigger if it exists
drop trigger if exists on_auth_user_created on auth.users;

-- Bind trigger to auth.users after insert
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Optional: Comments for PostgREST schema inspection
comment on table public.user_profiles is 'Stores demographic and mobility profiles for AtmosAi pollution exposure calculations.';

