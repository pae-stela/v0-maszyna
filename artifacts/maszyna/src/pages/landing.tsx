import { Link } from 'wouter'
import { Users, Activity, Calendar, ChefHat, Dumbbell } from 'lucide-react'
import { MaszynaIcon } from '@/components/logo'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background" style={{ background: 'linear-gradient(170deg, var(--color-olive-subtle) 0%, var(--background) 32%)' }}>
      <div className="px-6 py-12 flex flex-col items-center text-center">
        {/* Zwiększony kontener z ikoną (w-24 h-24) */}
        <div className="mb-4">
          <MaszynaIcon className="w-24 h-24" />
        </div>

        <h1 className="text-3xl font-bold text-foreground mb-3">
          Maszyna
        </h1>
        <p className="text-muted-foreground max-w-xs mb-8">
          Track nutrition and workouts together. Stay healthy as a team, or go solo.
        </p>

        <div className="flex flex-col gap-3 w-full max-w-xs">
          <Link
            href="/auth/sign-up"
            className="w-full py-3 px-4 btn-dashboard rounded-xl font-medium text-center hover:opacity-90 transition-opacity"
          >
            Get Started
          </Link>
          <Link
            href="/auth/login"
            className="w-full py-3 px-4 bg-card border border-border text-foreground rounded-xl font-medium text-center hover:bg-secondary transition-colors"
          >
            Sign In
          </Link>
        </div>
      </div>

      <div className="px-6 py-8">
        <h2 className="text-lg font-semibold text-foreground mb-4 text-center">
          Everything you need
        </h2>

        <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
          {/* 1. Macro Tracking */}
          <div className="bg-card rounded-xl p-4 border border-border">
            <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
              <Activity className="size-5 text-primary" />
            </div>
            <h3 className="font-medium text-foreground text-sm mb-1">Macro Tracking</h3>
            <p className="text-xs text-muted-foreground">Track calories, protein, carbs and fats</p>
          </div>

          {/* 2. Workouts */}
          <div className="bg-card rounded-xl p-4 border border-border">
            <div className="size-10 rounded-lg bg-terracotta/10 flex items-center justify-center mb-3">
              <Dumbbell className="size-5 text-terracotta" />
            </div>
            <h3 className="font-medium text-foreground text-sm mb-1">Workouts</h3>
            <p className="text-xs text-muted-foreground">Log weights, cardio, yoga and more</p>
          </div>

          {/* 3. Meal Planning */}
          <div className="bg-card rounded-xl p-4 border border-border">
            <div className="size-10 rounded-lg bg-sage/10 flex items-center justify-center mb-3">
              <ChefHat className="size-5 text-sage" />
            </div>
            <h3 className="font-medium text-foreground text-sm mb-1">Meal Planning</h3>
            <p className="text-xs text-muted-foreground">Recipe suggestions based on macros</p>
          </div>

          {/* 4. Daily Planner (Przeniesiony do siatki) */}
          <div className="bg-card rounded-xl p-4 border border-border">
            <div className="size-10 rounded-lg bg-sand/10 flex items-center justify-center mb-3">
              <Calendar className="size-5 text-sand" />
            </div>
            <h3 className="font-medium text-foreground text-sm mb-1">Daily Planner</h3>
            <p className="text-xs text-muted-foreground">Plan meals and workouts for the week ahead</p>
          </div>

          {/* 5. Partner Sync (Teraz na samym dole, rozciągnięty na 2 kolumny) */}
          <div className="bg-card rounded-xl p-4 border border-border col-span-2">
            <div className="size-10 rounded-lg bg-navy/10 flex items-center justify-center mb-3">
              <Users className="size-5 text-navy" />
            </div>
            <h3 className="font-medium text-foreground text-sm mb-1">Partner Sync</h3>
            <p className="text-xs text-muted-foreground">Real-time sync for couples</p>
          </div>
        </div>
      </div>

      <div className="px-6 py-8 text-center">
        <p className="text-sm text-muted-foreground">
          Join couples and individuals tracking their health journey
        </p>
      </div>
    </div>
  )
}