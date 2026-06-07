import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Link, useLocation } from 'wouter'
import { useState, useEffect } from 'react'
import { useLanguage } from '@/lib/i18n/context'
import type { Language } from '@/lib/i18n/translations'
import { MaszynaIcon } from '@/components/logo'
import { useAuth } from '@/lib/auth-context'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [, navigate] = useLocation()
  const { language, setLanguage, t } = useLanguage()
  const { user } = useAuth()

  // Redirect to /app when user becomes logged in
  useEffect(() => {
    if (user) {
      navigate('/app')
    }
  }, [user])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
      // No manual navigation here — the useEffect above will redirect once
      // the root AuthProvider's onAuthStateChange updates the user state.
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'An error occurred')
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="absolute top-4 right-4">
        <div className="flex items-center gap-1 p-1 bg-card rounded-lg border border-border">
          <button
            onClick={() => setLanguage('en' as Language)}
            className={`px-2.5 py-1.5 rounded text-xs font-medium transition-all ${
              language === 'en'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            EN
          </button>
          <button
            onClick={() => setLanguage('pl' as Language)}
            className={`px-2.5 py-1.5 rounded text-xs font-medium transition-all ${
              language === 'pl'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            PL
          </button>
        </div>
      </div>

      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center mb-8">
          <MaszynaIcon className="w-12 h-12" />
        </div>

        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-foreground">{t('welcomeBack')}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {language === 'en'
              ? 'Sign in to continue tracking your fitness journey'
              : 'Zaloguj się, aby kontynuować śledzenie postępów'
            }
          </p>
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div>
            <label htmlFor="email" className="text-sm font-medium text-foreground mb-1.5 block">
              {t('email')}
            </label>
            <Input
              id="email"
              type="email"
              placeholder={language === 'en' ? 'you@example.com' : 'ty@example.com'}
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-card border-border"
            />
          </div>

          <div>
            <label htmlFor="password" className="text-sm font-medium text-foreground mb-1.5 block">
              {t('password')}
            </label>
            <Input
              id="password"
              type="password"
              placeholder={language === 'en' ? 'Enter your password' : 'Wprowadź hasło'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-card border-border"
            />
          </div>

          {error && (
            <div className="bg-destructive/10 text-destructive text-sm px-3 py-2 rounded-lg">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full mt-2" disabled={isLoading}>
            {isLoading
              ? (language === 'en' ? 'Signing in...' : 'Logowanie...')
              : t('login')
            }
          </Button>
        </form>

        <div className="mt-4 p-3 bg-secondary/50 rounded-xl border border-border">
          <p className="text-[10px] text-muted-foreground mb-2 text-center uppercase tracking-wider font-medium">Demo Mode</p>
          <button
            type="button"
            onClick={async () => {
              setEmail('demo@maszyna.app')
              setPassword('demo123')
              setIsLoading(true)
              setError(null)
              try {
                const { error } = await supabase.auth.signInWithPassword({
                  email: 'demo@maszyna.app',
                  password: 'demo123',
                })
                if (error) throw error
              } catch (error: unknown) {
                setError(error instanceof Error ? error.message : 'An error occurred')
                setIsLoading(false)
              }
            }}
            className="w-full py-2 rounded-lg bg-amber-500/10 text-amber-600 text-xs font-medium hover:bg-amber-500/20 transition-colors"
          >
            Sign in as Demo User
          </button>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-6">
          {t('noAccount')}{' '}
          <Link href="/auth/sign-up" className="text-primary font-medium hover:underline">
            {t('signUp')}
          </Link>
        </p>
      </div>
    </div>
  )
}
