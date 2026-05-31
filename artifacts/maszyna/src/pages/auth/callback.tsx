import { useEffect } from 'react'
import { useLocation } from 'wouter'
import { createClient } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'

export default function AuthCallbackPage() {
  const [, navigate] = useLocation()

  useEffect(() => {
    const handleCallback = async () => {
      const supabase = createClient()
      const searchParams = new URLSearchParams(window.location.search)
      const code = searchParams.get('code')

      if (!code) {
        navigate('/auth/error')
        return
      }

      const { error } = await supabase.auth.exchangeCodeForSession(code)

      if (error) {
        navigate('/auth/error')
      } else {
        navigate('/app')
      }
    }

    handleCallback()
  }, [navigate])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Loader2 className="size-8 animate-spin text-primary" />
    </div>
  )
}
