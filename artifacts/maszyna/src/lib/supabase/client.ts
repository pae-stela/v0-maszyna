import { createClient } from '@supabase/supabase-js';

const rawUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Supabase URL must not have a trailing slash; otherwise the client builds
// paths like `https://project.supabase.co//auth/v1/token` which return
// "Invalid path specified in request URL".
const supabaseUrl = (rawUrl || '').replace(/\/$/, '');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Brak zmiennych środowiskowych Supabase w Netlify!');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey || '', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storage: window.localStorage,
    detectSessionInUrl: true
  }
});
