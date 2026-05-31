import { useEffect } from 'react'
import { useLocation } from 'wouter'
import { createClient } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'

export default function AuthCallbackPage() {
  const [, navigate] = useLocation()

  useEffect(() => {
    const handleCallback = async () => {
      const supabase = createClient()
      const { error } = await supabase.auth.exchangeCodeForSession(window.location.search)

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
