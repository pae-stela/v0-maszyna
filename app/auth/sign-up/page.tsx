'use client'

import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Dumbbell, Utensils, User, Users } from 'lucide-react'

export default function SignUpPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [repeatPassword, setRepeatPassword] = useState('')
  const [accountType, setAccountType] = useState<'single' | 'couple'>('single')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    if (password !== repeatPassword) {
      setError('Passwords do not match')
      setIsLoading(false)
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      setIsLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo:
            process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ??
            `${window.location.origin}/auth/callback`,
          data: {
            name,
            account_type: accountType,
          },
        },
      })
      if (error) throw error
      router.push('/auth/sign-up-success')
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="size-12 rounded-2xl bg-primary flex items-center justify-center">
            <Dumbbell className="size-6 text-primary-foreground" />
          </div>
          <div className="size-12 rounded-2xl bg-emerald-500 flex items-center justify-center">
            <Utensils className="size-6 text-white" />
          </div>
        </div>

        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-foreground">Create account</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Start your fitness journey together
          </p>
        </div>

        {/* Account Type Selection */}
        <div className="flex gap-3 mb-6">
          <button
            type="button"
            onClick={() => setAccountType('single')}
            className={`flex-1 p-4 rounded-xl border-2 transition-all ${
              accountType === 'single'
                ? 'border-primary bg-primary/10'
                : 'border-border bg-card hover:border-muted-foreground'
            }`}
          >
            <User className={`size-6 mx-auto mb-2 ${accountType === 'single' ? 'text-primary' : 'text-muted-foreground'}`} />
            <p className={`text-sm font-medium ${accountType === 'single' ? 'text-foreground' : 'text-muted-foreground'}`}>
              Solo
            </p>
          </button>
          <button
            type="button"
            onClick={() => setAccountType('couple')}
            className={`flex-1 p-4 rounded-xl border-2 transition-all ${
              accountType === 'couple'
                ? 'border-primary bg-primary/10'
                : 'border-border bg-card hover:border-muted-foreground'
            }`}
          >
            <Users className={`size-6 mx-auto mb-2 ${accountType === 'couple' ? 'text-primary' : 'text-muted-foreground'}`} />
            <p className={`text-sm font-medium ${accountType === 'couple' ? 'text-foreground' : 'text-muted-foreground'}`}>
              Couple
            </p>
          </button>
        </div>

        <form onSubmit={handleSignUp} className="flex flex-col gap-4">
          <div>
            <label htmlFor="name" className="text-sm font-medium text-foreground mb-1.5 block">
              Name
            </label>
            <Input
              id="name"
              type="text"
              placeholder="Your name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-card border-border"
            />
          </div>

          <div>
            <label htmlFor="email" className="text-sm font-medium text-foreground mb-1.5 block">
              Email
            </label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-card border-border"
            />
          </div>

          <div>
            <label htmlFor="password" className="text-sm font-medium text-foreground mb-1.5 block">
              Password
            </label>
            <Input
              id="password"
              type="password"
              placeholder="Min. 6 characters"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-card border-border"
            />
          </div>

          <div>
            <label htmlFor="repeat-password" className="text-sm font-medium text-foreground mb-1.5 block">
              Confirm Password
            </label>
            <Input
              id="repeat-password"
              type="password"
              placeholder="Repeat your password"
              required
              value={repeatPassword}
              onChange={(e) => setRepeatPassword(e.target.value)}
              className="bg-card border-border"
            />
          </div>

          {error && (
            <div className="bg-destructive/10 text-destructive text-sm px-3 py-2 rounded-lg">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full mt-2" disabled={isLoading}>
            {isLoading ? 'Creating account...' : 'Create account'}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-primary font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
