import { createClient } from '@supabase/supabase-js';

const rawUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Normalize the Supabase URL:
// 1. Trim whitespace
// 2. Strip any trailing slash so paths don't become `//auth/v1/token`
// 3. Strip any path suffix (e.g. `/rest/v1` or `/auth/v1`) so the client
//    can build its own paths correctly.
const supabaseUrl = (rawUrl || '')
  .trim()
  .replace(/\/$/, '')
  .replace(/\/rest\/v1\/?$/, '')
  .replace(/\/auth\/v1\/?$/, '');

console.log('[Supabase] normalized URL:', supabaseUrl);

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Brak zmiennych środowiskowych Supabase!');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey || '', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storage: window.localStorage,
    detectSessionInUrl: true
  }
});
