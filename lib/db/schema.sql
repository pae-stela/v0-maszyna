-- FitCouple Database Schema
-- Run this in Supabase SQL Editor

-- 1. PROFILES TABLE (linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  account_type TEXT NOT NULL DEFAULT 'single' CHECK (account_type IN ('single', 'couple')),
  partner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  partner_invite_code TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles 
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can view partner profile" ON public.profiles 
  FOR SELECT USING (auth.uid() = partner_id);
CREATE POLICY "Users can update own profile" ON public.profiles 
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles 
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 2. USER SETTINGS TABLE
CREATE TABLE IF NOT EXISTS public.user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  weight DECIMAL(5,2),
  height INTEGER,
  age INTEGER,
  sex TEXT CHECK (sex IN ('male', 'female')),
  activity_level DECIMAL(3,2) DEFAULT 1.55,
  calorie_goal INTEGER DEFAULT 2000,
  protein_goal INTEGER DEFAULT 150,
  carbs_goal INTEGER DEFAULT 200,
  fats_goal INTEGER DEFAULT 65,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own settings" ON public.user_settings 
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view partner settings" ON public.user_settings 
  FOR SELECT USING (user_id IN (SELECT partner_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "Users can update own settings" ON public.user_settings 
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own settings" ON public.user_settings 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 3. MEAL LOGS TABLE
CREATE TABLE IF NOT EXISTS public.meal_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
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

CREATE POLICY "Users can view own meals" ON public.meal_logs 
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view partner meals" ON public.meal_logs 
  FOR SELECT USING (user_id IN (SELECT partner_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "Users can insert own meals" ON public.meal_logs 
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own meals" ON public.meal_logs 
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own meals" ON public.meal_logs 
  FOR DELETE USING (auth.uid() = user_id);

-- 4. WORKOUT LOGS TABLE
CREATE TABLE IF NOT EXISTS public.workout_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  start_time TIME,
  end_time TIME,
  plan_name TEXT NOT NULL,
  exercises JSONB DEFAULT '[]',
  total_sets INTEGER DEFAULT 0,
  total_reps INTEGER DEFAULT 0,
  estimated_calories INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.workout_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own workouts" ON public.workout_logs 
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view partner workouts" ON public.workout_logs 
  FOR SELECT USING (user_id IN (SELECT partner_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "Users can insert own workouts" ON public.workout_logs 
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own workouts" ON public.workout_logs 
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own workouts" ON public.workout_logs 
  FOR DELETE USING (auth.uid() = user_id);

-- 5. STEP LOGS TABLE
CREATE TABLE IF NOT EXISTS public.step_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  steps INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

ALTER TABLE public.step_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own steps" ON public.step_logs 
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view partner steps" ON public.step_logs 
  FOR SELECT USING (user_id IN (SELECT partner_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "Users can insert own steps" ON public.step_logs 
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own steps" ON public.step_logs 
  FOR UPDATE USING (auth.uid() = user_id);

-- 6. PLANNER EVENTS TABLE
CREATE TABLE IF NOT EXISTS public.planner_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  time TIME NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('meal', 'training', 'supplements')),
  name TEXT NOT NULL,
  details TEXT,
  logged BOOLEAN DEFAULT FALSE,
  shared_with_partner BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.planner_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own events" ON public.planner_events 
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view partner events" ON public.planner_events 
  FOR SELECT USING (user_id IN (SELECT partner_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "Users can insert own events" ON public.planner_events 
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own events" ON public.planner_events 
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own events" ON public.planner_events 
  FOR DELETE USING (auth.uid() = user_id);

-- 7. MEASUREMENTS TABLE
CREATE TABLE IF NOT EXISTS public.measurements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  weight DECIMAL(5,2),
  body_fat DECIMAL(4,1),
  muscle_mass DECIMAL(5,2),
  chest DECIMAL(5,1),
  waist DECIMAL(5,1),
  hips DECIMAL(5,1),
  biceps DECIMAL(5,1),
  thighs DECIMAL(5,1),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.measurements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own measurements" ON public.measurements 
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own measurements" ON public.measurements 
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own measurements" ON public.measurements 
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own measurements" ON public.measurements 
  FOR DELETE USING (auth.uid() = user_id);

-- 8. TRIGGER TO AUTO-CREATE PROFILE ON SIGNUP
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, partner_invite_code)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    encode(gen_random_bytes(6), 'hex')
  )
  ON CONFLICT (id) DO NOTHING;
  
  -- Also create default settings
  INSERT INTO public.user_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 9. ENABLE REAL-TIME FOR ALL TABLES
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.meal_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.workout_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.step_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.planner_events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.measurements;

-- 10. INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_meal_logs_user_date ON public.meal_logs(user_id, date);
CREATE INDEX IF NOT EXISTS idx_workout_logs_user_date ON public.workout_logs(user_id, date);
CREATE INDEX IF NOT EXISTS idx_step_logs_user_date ON public.step_logs(user_id, date);
CREATE INDEX IF NOT EXISTS idx_planner_events_user_date ON public.planner_events(user_id, date);
CREATE INDEX IF NOT EXISTS idx_measurements_user_date ON public.measurements(user_id, date);
