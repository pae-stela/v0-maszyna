import { UserProvider } from '@/lib/user-context'
import { AuthProvider, useAuth } from '@/lib/auth-context'
import { AppShell } from '@/components/app-shell'
import { Loader2 } from 'lucide-react'

function AppContent() {
  const { loading, user } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Please sign in to continue</p>
          <a
            href="/auth/login"
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium"
          >
            Sign In
          </a>
        </div>
      </div>
    )
  }

  return (
    <UserProvider>
      <AppShell />
    </UserProvider>
  )
}

export default function AppPage() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}
