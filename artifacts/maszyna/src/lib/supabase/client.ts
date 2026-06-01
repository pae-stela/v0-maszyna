import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Brak zmiennych środowiskowych dla Supabase!')
}

export const supabase = createClient(supabaseUrl!, supabaseAnonKey!, {
  auth: {
    persistSession: true,       // Zapisuje logowanie na stałe w pamięci telefonu
    autoRefreshToken: true,     // Automatycznie odświeża sesję w tle
    detectSessionInUrl: true,   // Wykrywa powrót z autoryzacji
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    storageKey: 'maszyna-auth-token'
  }
})

// Zachowujemy te funkcje, jeśli inne pliki w projekcie ich szukają
export function createClientComponentClient() {
  return supabase
}

export function createClient() {
  return supabase
}