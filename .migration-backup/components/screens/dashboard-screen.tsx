"use client"

import { useState } from "react"
import { useUser } from "@/lib/user-context"
import { Droplets, Dumbbell, Pill, Check, ChevronRight, Calculator, Footprints, Sparkles, ChevronDown, Users } from "lucide-react"
import { presetDishes } from "./planner-screen"

function ProgressRing({ 
  value, 
  max, 
  color, 
  label, 
  unit,
  size = 64 
}: { 
  value: number
  max: number
  color: string
  label: string
  unit: string
  size?: number
}) {
  const radius = (size - 6) / 2
  const circumference = 2 * Math.PI * radius
  const progress = Math.min(value / max, 1)
  const strokeDashoffset = circumference * (1 - progress)

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="transform -rotate-90" width={size} height={size}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="5"
            className="text-secondary"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-700 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xs font-semibold text-foreground">{value}</span>
        </div>
      </div>
      <span className="text-[10px] font-medium text-muted-foreground">{label}</span>
    </div>
  )
}

const userData = {
  patrycja: {
    calories: { current: 1420, target: 1800 },
    protein: { current: 85, target: 120 },
    carbs: { current: 140, target: 180 },
    fats: { current: 45, target: 60 },
    fiber: { current: 18, target: 25 },
    water: 1500,
    waterTarget: 2000,
    dayPlan: [
      { id: "1", time: "07:30", type: "meal" as const, name: "Power Breakfast", dishId: "d1", calories: 520, logged: false },
      { id: "2", time: "08:00", type: "supplement" as const, name: "Vitamin D + Omega-3", logged: true },
      { id: "3", time: "10:00", type: "meal" as const, name: "Morning Snack", dishId: null, calories: 180, logged: false },
      { id: "4", time: "12:30", type: "meal" as const, name: "Lunch Bowl", dishId: "d2", calories: 680, logged: true },
      { id: "5", time: "15:00", type: "training" as const, name: "Upper Body Workout", logged: false },
      { id: "6", time: "16:00", type: "meal" as const, name: "Post-Workout Shake", dishId: null, calories: 320, logged: false },
      { id: "7", time: "19:00", type: "meal" as const, name: "Dinner", dishId: null, calories: 550, logged: false },
      { id: "8", time: "21:00", type: "supplement" as const, name: "Magnesium", logged: false },
    ],
  },
  marcin: {
    calories: { current: 2100, target: 2800 },
    protein: { current: 145, target: 180 },
    carbs: { current: 220, target: 280 },
    fats: { current: 70, target: 90 },
    fiber: { current: 22, target: 30 },
    water: 2000,
    waterTarget: 3000,
    dayPlan: [
      { id: "1", time: "06:30", type: "meal" as const, name: "Protein Oatmeal", dishId: null, calories: 480, logged: true },
      { id: "2", time: "07:00", type: "supplement" as const, name: "Creatine + Vitamin D", logged: true },
      { id: "3", time: "09:30", type: "training" as const, name: "Leg Day", logged: false },
      { id: "4", time: "11:00", type: "meal" as const, name: "Post-Workout Meal", dishId: null, calories: 720, logged: false },
      { id: "5", time: "14:00", type: "meal" as const, name: "Lunch", dishId: null, calories: 650, logged: false },
      { id: "6", time: "17:00", type: "meal" as const, name: "Afternoon Snack", dishId: null, calories: 350, logged: false },
      { id: "7", time: "20:00", type: "meal" as const, name: "Dinner", dishId: null, calories: 700, logged: false },
      { id: "8", time: "22:00", type: "supplement" as const, name: "Zinc + Magnesium", logged: false },
    ],
  },
}

export function DashboardScreen() {
  const { activeUser, getTodaySteps, updateSteps, getWeeklyAvgSteps } = useUser()
  const data = userData[activeUser]
  const partnerUser = activeUser === "patrycja" ? "marcin" : "patrycja"
  const partnerData = userData[partnerUser]
  const [dayPlan, setDayPlan] = useState(data.dayPlan)
  const [water, setWater] = useState(data.water)
  const [showStepInput, setShowStepInput] = useState(false)
  const [stepInput, setStepInput] = useState("")
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [showPartnerDay, setShowPartnerDay] = useState(false)

  const todaySteps = getTodaySteps()
  const weeklyAvg = getWeeklyAvgSteps()
  const stepGoal = 10000
  const stepCalories = Math.round(todaySteps * 0.04 * (activeUser === "patrycja" ? 62 : 85))

  // Calculate remaining macros
  const remainingMacros = {
    calories: data.calories.target - data.calories.current,
    protein: data.protein.target - data.protein.current,
    carbs: data.carbs.target - data.carbs.current,
    fats: data.fats.target - data.fats.current,
  }

  // Score recipes based on how well they fill remaining macros
  const getSuggestedRecipes = () => {
    return presetDishes
      .map(dish => {
        // Penalize if exceeds remaining (we want to fill, not overflow)
        const calorieScore = dish.calories <= remainingMacros.calories 
          ? dish.calories / Math.max(remainingMacros.calories, 1)
          : -0.5 * (dish.calories - remainingMacros.calories) / dish.calories
        
        // Prioritize protein matching
        const proteinScore = dish.protein <= remainingMacros.protein + 10
          ? dish.protein / Math.max(remainingMacros.protein, 1)
          : -0.3 * (dish.protein - remainingMacros.protein) / dish.protein

        const carbScore = dish.carbs <= remainingMacros.carbs + 15
          ? 0.3 * dish.carbs / Math.max(remainingMacros.carbs, 1)
          : -0.2

        const fatScore = dish.fats <= remainingMacros.fats + 10
          ? 0.3 * dish.fats / Math.max(remainingMacros.fats, 1)
          : -0.2

        const totalScore = calorieScore + proteinScore * 1.5 + carbScore + fatScore

        return { ...dish, score: totalScore }
      })
      .filter(dish => dish.calories <= remainingMacros.calories + 100) // Allow small overflow
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
  }

  const suggestedRecipes = getSuggestedRecipes()
  const hasRemainingMacros = remainingMacros.calories > 200

  const toggleItem = (id: string) => {
    setDayPlan(dayPlan.map((item) => 
      item.id === id ? { ...item, logged: !item.logged } : item
    ))
  }

  const addWater = (amount: number) => {
    setWater((prev) => Math.min(prev + amount, data.waterTarget + 1000))
  }

  return (
    <div className="flex flex-col gap-5 pb-24">
      {/* Macro Circles */}
      <div className="bg-card rounded-2xl p-4 border border-border">
        <div className="flex items-center justify-between">
          <ProgressRing
            value={data.calories.current}
            max={data.calories.target}
            color="oklch(0.75 0.18 145)"
            label="kcal"
            unit="kcal"
          />
          <ProgressRing
            value={data.protein.current}
            max={data.protein.target}
            color="oklch(0.65 0.15 200)"
            label="Protein"
            unit="g"
          />
          <ProgressRing
            value={data.carbs.current}
            max={data.carbs.target}
            color="oklch(0.70 0.20 50)"
            label="Carbs"
            unit="g"
          />
          <ProgressRing
            value={data.fats.current}
            max={data.fats.target}
            color="oklch(0.65 0.18 0)"
            label="Fats"
            unit="g"
          />
          <ProgressRing
            value={data.fiber.current}
            max={data.fiber.target}
            color="oklch(0.70 0.18 160)"
            label="Fiber"
            unit="g"
          />
        </div>
      </div>

      {/* Water Intake */}
      <div className="bg-card rounded-2xl p-4 border border-border">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Droplets className="size-5 text-blue-400" />
            <span className="text-sm font-semibold text-foreground">Water</span>
          </div>
          <span className="text-sm text-muted-foreground">
            {water}ml / {data.waterTarget}ml
          </span>
        </div>
        <div className="h-2 bg-secondary rounded-full overflow-hidden mb-3">
          <div 
            className="h-full bg-blue-400 rounded-full transition-all duration-500"
            style={{ width: `${Math.min((water / data.waterTarget) * 100, 100)}%` }}
          />
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => addWater(300)}
            className="flex-1 py-2.5 rounded-xl bg-blue-500/10 text-blue-400 text-sm font-medium active:scale-[0.98] transition-transform"
          >
            +300ml
          </button>
          <button 
            onClick={() => addWater(500)}
            className="flex-1 py-2.5 rounded-xl bg-blue-500/10 text-blue-400 text-sm font-medium active:scale-[0.98] transition-transform"
          >
            +500ml
          </button>
          <button 
            onClick={() => addWater(1000)}
            className="flex-1 py-2.5 rounded-xl bg-blue-500/10 text-blue-400 text-sm font-medium active:scale-[0.98] transition-transform"
          >
            +1L
          </button>
        </div>
      </div>

      {/* Step Tracker */}
      <div className="bg-card rounded-2xl p-4 border border-border">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Footprints className="size-5 text-emerald-400" />
            <span className="text-sm font-semibold text-foreground">Steps</span>
          </div>
          <button
            onClick={() => {
              setStepInput(todaySteps.toString())
              setShowStepInput(true)
            }}
            className="text-xs text-primary font-medium"
          >
            Update
          </button>
        </div>
        
        <div className="flex items-end justify-between mb-3">
          <div>
            <span className="text-2xl font-bold text-foreground">{todaySteps.toLocaleString()}</span>
            <span className="text-sm text-muted-foreground ml-1">/ {stepGoal.toLocaleString()}</span>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">~{stepCalories} kcal</p>
            <p className="text-[10px] text-muted-foreground">Avg: {weeklyAvg.toLocaleString()}/day</p>
          </div>
        </div>

        <div className="h-2 bg-secondary rounded-full overflow-hidden">
          <div 
            className="h-full bg-emerald-400 rounded-full transition-all duration-500"
            style={{ width: `${Math.min((todaySteps / stepGoal) * 100, 100)}%` }}
          />
        </div>

        {/* Step Input Modal */}
        {showStepInput && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-card rounded-2xl w-full max-w-xs p-5">
              <h3 className="font-semibold text-foreground mb-1 text-center">Update Steps</h3>
              <p className="text-xs text-muted-foreground text-center mb-4">Enter today&apos;s step count from your watch</p>
              
              <input
                type="number"
                value={stepInput}
                onChange={(e) => setStepInput(e.target.value)}
                placeholder="e.g. 8500"
                className="w-full bg-secondary rounded-xl px-4 py-3 text-lg text-center font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary mb-4"
                autoFocus
              />

              <div className="flex gap-2">
                <button
                  onClick={() => setShowStepInput(false)}
                  className="flex-1 py-2.5 rounded-xl bg-secondary text-muted-foreground font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    const steps = parseInt(stepInput) || 0
                    updateSteps(new Date().toISOString().split('T')[0], steps)
                    setShowStepInput(false)
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Recipe Suggestion Card */}
      {hasRemainingMacros && suggestedRecipes.length > 0 && (
        <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl border border-primary/20 overflow-hidden">
          <button
            onClick={() => setShowSuggestions(!showSuggestions)}
            className="w-full p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <Sparkles className="size-5 text-primary" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-foreground">Meal Suggestions</p>
                <p className="text-xs text-muted-foreground">
                  {remainingMacros.calories} kcal · {remainingMacros.protein}g protein remaining
                </p>
              </div>
            </div>
            <ChevronDown className={`size-5 text-muted-foreground transition-transform ${showSuggestions ? "rotate-180" : ""}`} />
          </button>

          {showSuggestions && (
            <div className="px-4 pb-4 flex flex-col gap-2">
              {suggestedRecipes.map((recipe, index) => (
                <div
                  key={recipe.id}
                  className="bg-card rounded-xl p-3 border border-border"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {index === 0 && (
                          <span className="px-1.5 py-0.5 rounded bg-primary/20 text-primary text-[9px] font-semibold">
                            BEST MATCH
                          </span>
                        )}
                        <p className="text-sm font-medium text-foreground truncate">{recipe.name}</p>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{recipe.details}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-[10px]">
                    <span className="text-foreground font-medium">{recipe.calories} kcal</span>
                    <span className="text-primary">{recipe.protein}g P</span>
                    <span className="text-amber-500">{recipe.carbs}g C</span>
                    <span className="text-rose-400">{recipe.fats}g F</span>
                  </div>
                </div>
              ))}
              <p className="text-[10px] text-muted-foreground text-center mt-1">
                Suggestions based on your remaining daily macros
              </p>
            </div>
          )}
        </div>
      )}

      {/* Partner's Day Card */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <button
          onClick={() => setShowPartnerDay(!showPartnerDay)}
          className="w-full p-4 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className={`size-10 rounded-xl flex items-center justify-center ${
              partnerUser === "marcin" ? "bg-blue-500/20" : "bg-emerald-500/20"
            }`}>
              <Users className={`size-5 ${partnerUser === "marcin" ? "text-blue-500" : "text-emerald-500"}`} />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-foreground capitalize">{partnerUser}&apos;s Day</p>
              <p className="text-xs text-muted-foreground">
                {partnerData.dayPlan.filter(i => i.type === "meal").length} meals · {partnerData.dayPlan.filter(i => i.type === "training").length} workout
              </p>
            </div>
          </div>
          <ChevronDown className={`size-5 text-muted-foreground transition-transform ${showPartnerDay ? "rotate-180" : ""}`} />
        </button>

        {showPartnerDay && (
          <div className="px-4 pb-4 flex flex-col gap-2">
            {partnerData.dayPlan.slice(0, 5).map((item) => (
              <div
                key={item.id}
                className={`flex items-center gap-3 p-2 rounded-lg ${
                  item.logged ? "bg-primary/5" : "bg-secondary/50"
                }`}
              >
                <span className="text-[10px] font-medium text-muted-foreground w-10">
                  {item.time}
                </span>
                <div className={`size-6 rounded-lg flex items-center justify-center ${
                  item.type === "meal" 
                    ? "bg-primary/20" 
                    : item.type === "training"
                    ? "bg-orange-500/20"
                    : "bg-purple-500/20"
                }`}>
                  {item.type === "meal" ? (
                    <div className="size-2.5 rounded-full bg-primary" />
                  ) : item.type === "training" ? (
                    <Dumbbell className="size-3 text-orange-400" />
                  ) : (
                    <Pill className="size-3 text-purple-400" />
                  )}
                </div>
                <span className="text-xs text-foreground flex-1 truncate">{item.name}</span>
                {item.logged && <Check className="size-3.5 text-primary" />}
              </div>
            ))}
            {partnerData.dayPlan.length > 5 && (
              <p className="text-[10px] text-muted-foreground text-center">
                +{partnerData.dayPlan.length - 5} more items
              </p>
            )}
          </div>
        )}
      </div>

      {/* My Day Timeline */}
      <div>
        <h2 className="text-base font-semibold mb-3">My Day</h2>
        <div className="flex flex-col gap-2">
          {dayPlan.map((item) => (
            <div
              key={item.id}
              className={`bg-card rounded-2xl p-4 border transition-colors ${
                item.logged ? "border-primary/30 bg-primary/5" : "border-border"
              }`}
            >
              <div className="flex items-center gap-3">
                {/* Time */}
                <span className="text-xs font-medium text-muted-foreground w-12 shrink-0">
                  {item.time}
                </span>

                {/* Icon */}
                <div className={`size-9 rounded-xl flex items-center justify-center shrink-0 ${
                  item.type === "meal" 
                    ? "bg-primary/20" 
                    : item.type === "training"
                    ? "bg-orange-500/20"
                    : "bg-purple-500/20"
                }`}>
                  {item.type === "meal" ? (
                    <div className="size-4 rounded-full bg-primary" />
                  ) : item.type === "training" ? (
                    <Dumbbell className="size-4 text-orange-400" />
                  ) : (
                    <Pill className="size-4 text-purple-400" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${
                    item.logged ? "text-muted-foreground" : "text-foreground"
                  }`}>
                    {item.name}
                  </p>
                  {item.type === "meal" && (
                    <p className="text-xs text-muted-foreground">{item.calories} kcal</p>
                  )}
                </div>

                {/* Actions */}
                {item.type === "meal" ? (
                  <div className="flex items-center gap-1">
                    {!item.logged && (
                      <>
                        <button 
                          onClick={() => toggleItem(item.id)}
                          className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium active:scale-95 transition-transform"
                        >
                          Log
                        </button>
                        <button className="size-8 rounded-lg bg-secondary flex items-center justify-center active:scale-95 transition-transform">
                          <Calculator className="size-4 text-muted-foreground" />
                        </button>
                      </>
                    )}
                    {item.logged && (
                      <div className="size-7 rounded-full bg-primary flex items-center justify-center">
                        <Check className="size-4 text-primary-foreground" />
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => toggleItem(item.id)}
                    className={`size-6 rounded-md border-2 flex items-center justify-center transition-colors ${
                      item.logged 
                        ? "bg-primary border-primary" 
                        : "border-muted-foreground"
                    }`}
                  >
                    {item.logged && (
                      <Check className="size-3.5 text-primary-foreground" />
                    )}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
