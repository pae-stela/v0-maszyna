import { useEffect, useState } from 'react'
import { useLocation } from 'wouter'
import { createClient } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'

export default function AuthCallbackPage() {
  const [, navigate] = useLocation()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const supabase = createClient()
        const searchParams = new URLSearchParams(window.location.search)
        const code = searchParams.get('code')

        if (!code) {
          navigate('/auth/error')
          return
        }

        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

        if (exchangeError) {
          setError(exchangeError.message)
          setTimeout(() => navigate('/auth/error'), 2000)
        } else {
          // Force full client-side navigation to dashboard
          window.location.href = '/app'
        }
      } catch (err) {
        console.error('Callback error:', err)
        setError(err instanceof Error ? err.message : 'Authentication failed')
        setTimeout(() => navigate('/auth/error'), 2000)
      }
    }

    handleCallback()
  }, [navigate])

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center">
          <p className="text-destructive mb-2">Authentication failed</p>
          <p className="text-muted-foreground text-sm">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Loader2 className="size-8 animate-spin text-primary" />
    </div>
  )
}
