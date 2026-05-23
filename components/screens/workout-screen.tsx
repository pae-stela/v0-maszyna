"use client"

import { useState } from "react"
import { useUser } from "@/lib/user-context"
import { Play, Plus, ChevronRight, Timer, Flame, Dumbbell } from "lucide-react"

type SubTab = "journal" | "plans"

export function WorkoutScreen() {
  const [subTab, setSubTab] = useState<SubTab>("journal")

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2 p-1 bg-secondary rounded-xl">
        <button
          onClick={() => setSubTab("journal")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
            subTab === "journal"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground"
          }`}
        >
          <Play className="size-4" />
          Live Journal
        </button>
        <button
          onClick={() => setSubTab("plans")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
            subTab === "plans"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground"
          }`}
        >
          <Dumbbell className="size-4" />
          Plans
        </button>
      </div>

      {subTab === "journal" ? <JournalView /> : <PlansView />}
    </div>
  )
}

function JournalView() {
  const { activeUser } = useUser()
  const [exercises] = useState([
    { name: "Bench Press", sets: 3, reps: "8-10", weight: activeUser === "patrycja" ? "40kg" : "80kg" },
    { name: "Incline DB Press", sets: 3, reps: "10-12", weight: activeUser === "patrycja" ? "12kg" : "26kg" },
    { name: "Cable Flyes", sets: 3, reps: "12-15", weight: activeUser === "patrycja" ? "10kg" : "20kg" },
  ])

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-card rounded-2xl p-5 border border-border">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-foreground">Current Workout</h3>
            <p className="text-sm text-muted-foreground">Push Day - Chest Focus</p>
          </div>
          <div className="flex items-center gap-2 text-primary">
            <Timer className="size-4" />
            <span className="text-sm font-medium">32:45</span>
          </div>
        </div>
        
        <div className="flex gap-4 mb-4">
          <div className="flex-1 bg-secondary rounded-xl p-3 text-center">
            <span className="text-lg font-bold text-foreground">3</span>
            <p className="text-xs text-muted-foreground">Exercises</p>
          </div>
          <div className="flex-1 bg-secondary rounded-xl p-3 text-center">
            <span className="text-lg font-bold text-foreground">9</span>
            <p className="text-xs text-muted-foreground">Sets Done</p>
          </div>
          <div className="flex-1 bg-secondary rounded-xl p-3 text-center">
            <div className="flex items-center justify-center gap-1">
              <Flame className="size-4 text-orange-400" />
              <span className="text-lg font-bold text-foreground">245</span>
            </div>
            <p className="text-xs text-muted-foreground">Calories</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {exercises.map((exercise, i) => (
          <div
            key={i}
            className="bg-card rounded-2xl p-4 border border-border"
          >
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-foreground">{exercise.name}</h4>
              <span className="text-xs text-muted-foreground">{exercise.weight}</span>
            </div>
            <div className="flex gap-2">
              {Array.from({ length: exercise.sets }).map((_, setIndex) => (
                <button
                  key={setIndex}
                  className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all ${
                    setIndex < 2
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {exercise.reps}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <button className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform">
        <Plus className="size-5" />
        Add Exercise
      </button>
    </div>
  )
}

function PlansView() {
  const plans = [
    { name: "Push Day", exercises: 6, duration: "45-60 min", lastDone: "2 days ago" },
    { name: "Pull Day", exercises: 6, duration: "45-60 min", lastDone: "Yesterday" },
    { name: "Leg Day", exercises: 7, duration: "50-65 min", lastDone: "3 days ago" },
    { name: "Upper Body", exercises: 8, duration: "55-70 min", lastDone: "5 days ago" },
  ]

  return (
    <div className="flex flex-col gap-3">
      {plans.map((plan, i) => (
        <button
          key={i}
          className="bg-card rounded-2xl p-4 border border-border flex items-center gap-4 text-left active:scale-[0.98] transition-transform"
        >
          <div className="size-14 rounded-xl bg-primary/20 flex items-center justify-center">
            <Dumbbell className="size-6 text-primary" />
          </div>
          <div className="flex-1">
            <h4 className="font-medium text-foreground">{plan.name}</h4>
            <p className="text-sm text-muted-foreground">
              {plan.exercises} exercises · {plan.duration}
            </p>
            <p className="text-xs text-muted-foreground/70 mt-1">{plan.lastDone}</p>
          </div>
          <ChevronRight className="size-5 text-muted-foreground" />
        </button>
      ))}

      <button className="w-full py-4 rounded-2xl border-2 border-dashed border-border text-muted-foreground font-medium flex items-center justify-center gap-2 active:scale-[0.98] transition-transform">
        <Plus className="size-5" />
        Create New Plan
      </button>
    </div>
  )
}
