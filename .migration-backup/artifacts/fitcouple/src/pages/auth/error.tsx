import { AlertCircle } from 'lucide-react'
import { Link } from 'wouter'

export default function AuthErrorPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm text-center">
        <div className="size-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="size-8 text-destructive" />
        </div>

        <h1 className="text-2xl font-bold text-foreground mb-2">Authentication Error</h1>
        <p className="text-muted-foreground mb-8">
          Something went wrong during authentication. Please try again.
        </p>

        <div className="flex flex-col gap-3">
          <Link
            href="/auth/login"
            className="w-full py-3 px-4 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors"
          >
            Back to login
          </Link>
          <Link
            href="/auth/sign-up"
            className="w-full py-3 px-4 bg-card border border-border text-foreground rounded-xl font-medium hover:bg-secondary transition-colors"
          >
            Create new account
          </Link>
        </div>
      </div>
    </div>
  )
}
