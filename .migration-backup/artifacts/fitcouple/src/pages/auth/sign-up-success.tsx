import { Mail } from 'lucide-react'
import { Link } from 'wouter'
import { MaszynaIcon } from '@/components/logo'

export default function SignUpSuccessPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm text-center">
        <div className="flex items-center justify-center mb-8">
          <MaszynaIcon className="w-12 h-12" />
        </div>

        <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
          <Mail className="size-8 text-primary" />
        </div>

        <h1 className="text-2xl font-bold text-foreground mb-2">Check your email</h1>
        <p className="text-muted-foreground mb-8">
          We've sent you a confirmation link. Click the link in your email to activate your account.
        </p>

        <div className="bg-card rounded-xl p-4 border border-border mb-6">
          <p className="text-sm text-muted-foreground">
            Didn't receive an email? Check your spam folder or{' '}
            <Link href="/auth/sign-up" className="text-primary hover:underline">
              try again
            </Link>
          </p>
        </div>

        <Link href="/auth/login" className="text-sm text-primary font-medium hover:underline">
          Back to login
        </Link>
      </div>
    </div>
  )
}
