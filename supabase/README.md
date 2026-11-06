# 🗄️ AtmosAi Supabase Module

This directory manages the PostgreSQL database schema, migrations, and Row-Level Security (RLS) policies for AtmosAi.

---

## 📋 Schema Overview

AtmosAi stores user demographics, mobility modes, and vulnerability factors in the `public.profiles` table:

```sql
CREATE TABLE public.profiles (
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
```

---

## 🚀 How to Apply Migrations

In strict accordance with deployment safety policies, **migrations are never executed against the hosted database automatically**.

To apply the schema:
1. Open your [Supabase Dashboard](https://supabase.com/dashboard/project/_/sql).
2. Navigate to **SQL Editor** in the left navigation sidebar.
3. Open `supabase/schema.sql` (or `supabase/migrations/20260306_canonical_profiles.sql`).
4. Paste the SQL script and click **Run**.

---

## 🔒 Row-Level Security (RLS)

RLS is enabled on `public.profiles`. The policies guarantee that:
- Authenticated users can only **view** their own profile (`auth.uid() = user_id`).
- Authenticated users can only **insert** or **update** their own profile (`auth.uid() = user_id`).
- Guest users operate via local browser persistence without affecting remote records.

---

## 🔑 Environment Variables Required

In `frontend/.env`:
```ini
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

In `backend/.env`:
```ini
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_KEY=your-anon-or-service-key-here
```

