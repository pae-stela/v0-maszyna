import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    import.meta.env.VITE_SUPABASE_URL!,
    import.meta.env.VITE_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        // KLUCZOWE DLA MOBILE: Wymuszenie użycia localStorage zamiast samych ciasteczek
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
        storageKey: 'maszyna-auth-token', // własny klucz zapewni, że telefon nie wyczyści sesji
      },
    }
  )
}