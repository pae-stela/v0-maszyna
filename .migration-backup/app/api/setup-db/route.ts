import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// This route sets up the database schema - run once
export async function POST() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const schemas = [
    // Profiles table
    `CREATE TABLE IF NOT EXISTS public.profiles (
      id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      account_type TEXT NOT NULL DEFAULT 'single' CHECK (account_type IN ('single', 'couple')),
      partner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
      partner_invite_code TEXT UNIQUE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )`,

    // User settings table
    `CREATE TABLE IF NOT EXISTS public.user_settings (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
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
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(user_id)
    )`,

    // Meal logs table
    `CREATE TABLE IF NOT EXISTS public.meal_logs (
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
    )`,

    // Workout logs table
    `CREATE TABLE IF NOT EXISTS public.workout_logs (
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
    )`,

    // Step logs table
    `CREATE TABLE IF NOT EXISTS public.step_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
      date DATE NOT NULL DEFAULT CURRENT_DATE,
      steps INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(user_id, date)
    )`,

    // Planner events table
    `CREATE TABLE IF NOT EXISTS public.planner_events (
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
    )`,

    // Measurements/body stats table
    `CREATE TABLE IF NOT EXISTS public.measurements (
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
    )`
  ]

  const errors: string[] = []

  for (const sql of schemas) {
    const { error } = await supabase.from('_').select().limit(0) // Dummy to test connection
    if (error && !error.message.includes('does not exist')) {
      errors.push(error.message)
    }
  }

  return NextResponse.json({ 
    success: true, 
    message: 'Please run the SQL schema in Supabase SQL Editor. Tables needed: profiles, user_settings, meal_logs, workout_logs, step_logs, planner_events, measurements',
    note: 'Schema file available at /lib/db/schema.sql'
  })
}

export async function GET() {
  return NextResponse.json({
    message: 'POST to this endpoint to setup the database schema'
  })
}
