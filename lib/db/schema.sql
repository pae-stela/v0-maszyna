-- FitCouple Database Schema (Fixed)
-- Run this in Supabase SQL Editor

-- 1. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  account_type TEXT NOT NULL DEFAULT 'single',
  partner_id UUID,
  partner_invite_code TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_partner" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;

CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_select_partner" ON public.profiles FOR SELECT USING (auth.uid() = partner_id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- 2. USER SETTINGS TABLE (references auth.users directly)
CREATE TABLE IF NOT EXISTS public.user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  weight DECIMAL(5,2),
  height INTEGER,
  calorie_goal INTEGER DEFAULT 2000,
  protein_goal INTEGER DEFAULT 150,
  carbs_goal INTEGER DEFAULT 200,
  fats_goal INTEGER DEFAULT 65,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "settings_all_own" ON public.user_settings;
CREATE POLICY "settings_all_own" ON public.user_settings FOR ALL USING (auth.uid() = user_id);

-- 3. MEAL LOGS TABLE
CREATE TABLE IF NOT EXISTS public.meal_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  time TIME NOT NULL,
  name TEXT NOT NULL,
  details TEXT,
  calories INTEGER DEFAULT 0,
  protein DECIMAL(5,1) DEFAULT 0,
  carbs DECIMAL(5,1) DEFAULT 0,
  fats DECIMAL(5,1) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.meal_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "meals_all_own" ON public.meal_logs;
CREATE POLICY "meals_all_own" ON public.meal_logs FOR ALL USING (auth.uid() = user_id);

-- 4. WORKOUT LOGS TABLE
CREATE TABLE IF NOT EXISTS public.workout_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  plan_name TEXT NOT NULL,
  exercises JSONB DEFAULT '[]',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.workout_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "workouts_all_own" ON public.workout_logs;
CREATE POLICY "workouts_all_own" ON public.workout_logs FOR ALL USING (auth.uid() = user_id);

-- 5. STEP LOGS TABLE
CREATE TABLE IF NOT EXISTS public.step_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  steps INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

ALTER TABLE public.step_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "steps_all_own" ON public.step_logs;
CREATE POLICY "steps_all_own" ON public.step_logs FOR ALL USING (auth.uid() = user_id);

-- 6. PLANNER EVENTS TABLE
CREATE TABLE IF NOT EXISTS public.planner_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  time TIME NOT NULL,
  type TEXT NOT NULL,
  name TEXT NOT NULL,
  details TEXT,
  logged BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.planner_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "events_all_own" ON public.planner_events;
CREATE POLICY "events_all_own" ON public.planner_events FOR ALL USING (auth.uid() = user_id);

-- 7. MEASUREMENTS TABLE
CREATE TABLE IF NOT EXISTS public.measurements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  weight DECIMAL(5,2),
  body_fat DECIMAL(4,1),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.measurements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "measurements_all_own" ON public.measurements;
CREATE POLICY "measurements_all_own" ON public.measurements FOR ALL USING (auth.uid() = user_id);

-- 8. RECIPES TABLE (global library - you can add recipes via Supabase Table Editor)
CREATE TABLE IF NOT EXISTS public.recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_pl TEXT,
  category TEXT,
  calories INTEGER DEFAULT 0,
  protein DECIMAL(5,1) DEFAULT 0,
  carbs DECIMAL(5,1) DEFAULT 0,
  fats DECIMAL(5,1) DEFAULT 0,
  ingredients JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "recipes_select_all" ON public.recipes;
CREATE POLICY "recipes_select_all" ON public.recipes FOR SELECT USING (true);

-- 9. WORKOUT TEMPLATES TABLE (global library)
CREATE TABLE IF NOT EXISTS public.workout_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_pl TEXT,
  type TEXT NOT NULL,
  exercises JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.workout_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "templates_select_all" ON public.workout_templates;
CREATE POLICY "templates_select_all" ON public.workout_templates FOR SELECT USING (true);

-- 10. TRIGGER TO AUTO-CREATE PROFILE ON SIGNUP
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, account_type, partner_invite_code)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'account_type', 'single'),
    encode(gen_random_bytes(6), 'hex')
  );
  
  INSERT INTO public.user_settings (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log error but don't block signup
  RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 11. ENABLE REAL-TIME
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.meal_logs;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.workout_logs;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.planner_events;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 12. INDEXES
CREATE INDEX IF NOT EXISTS idx_meal_logs_user_date ON public.meal_logs(user_id, date);
CREATE INDEX IF NOT EXISTS idx_workout_logs_user_date ON public.workout_logs(user_id, date);
CREATE INDEX IF NOT EXISTS idx_step_logs_user_date ON public.step_logs(user_id, date);
CREATE INDEX IF NOT EXISTS idx_planner_events_user_date ON public.planner_events(user_id, date);
