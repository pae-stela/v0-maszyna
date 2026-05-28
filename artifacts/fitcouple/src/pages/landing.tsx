import { Link } from 'wouter'
import { Dumbbell, Utensils, Users, Activity, Calendar, ChefHat } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="px-6 py-12 flex flex-col items-center text-center">
        <div className="flex items-center gap-2 mb-6">
          <div className="size-14 rounded-2xl bg-primary flex items-center justify-center">
            <Dumbbell className="size-7 text-primary-foreground" />
          </div>
          <div className="size-14 rounded-2xl bg-emerald-500 flex items-center justify-center">
            <Utensils className="size-7 text-white" />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-foreground mb-3">
          FitCouple
        </h1>
        <p className="text-muted-foreground max-w-xs mb-8">
          Track nutrition and workouts together. Stay healthy as a team, or go solo.
        </p>

        <div className="flex flex-col gap-3 w-full max-w-xs">
          <Link
            href="/auth/sign-up"
            className="w-full py-3 px-4 bg-primary text-primary-foreground rounded-xl font-medium text-center hover:bg-primary/90 transition-colors"
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
          <div className="bg-card rounded-xl p-4 border border-border">
            <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
              <Activity className="size-5 text-primary" />
            </div>
            <h3 className="font-medium text-foreground text-sm mb-1">Macro Tracking</h3>
            <p className="text-xs text-muted-foreground">Track calories, protein, carbs and fats</p>
          </div>

          <div className="bg-card rounded-xl p-4 border border-border">
            <div className="size-10 rounded-lg bg-orange-500/10 flex items-center justify-center mb-3">
              <Dumbbell className="size-5 text-orange-500" />
            </div>
            <h3 className="font-medium text-foreground text-sm mb-1">Workouts</h3>
            <p className="text-xs text-muted-foreground">Log weights, cardio, yoga and more</p>
          </div>

          <div className="bg-card rounded-xl p-4 border border-border">
            <div className="size-10 rounded-lg bg-emerald-500/10 flex items-center justify-center mb-3">
              <ChefHat className="size-5 text-emerald-500" />
            </div>
            <h3 className="font-medium text-foreground text-sm mb-1">Meal Planning</h3>
            <p className="text-xs text-muted-foreground">Recipe suggestions based on macros</p>
          </div>

          <div className="bg-card rounded-xl p-4 border border-border">
            <div className="size-10 rounded-lg bg-blue-500/10 flex items-center justify-center mb-3">
              <Users className="size-5 text-blue-500" />
            </div>
            <h3 className="font-medium text-foreground text-sm mb-1">Partner Sync</h3>
            <p className="text-xs text-muted-foreground">Real-time sync for couples</p>
          </div>

          <div className="bg-card rounded-xl p-4 border border-border col-span-2">
            <div className="size-10 rounded-lg bg-purple-500/10 flex items-center justify-center mb-3">
              <Calendar className="size-5 text-purple-500" />
            </div>
            <h3 className="font-medium text-foreground text-sm mb-1">Daily Planner</h3>
            <p className="text-xs text-muted-foreground">Plan meals and workouts for the week ahead</p>
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
