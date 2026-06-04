

import { useState } from "react"
import { useUser } from "@/lib/user-context"
import { Droplets, Dumbbell, Pill, Check, ChevronRight, Calculator, Footprints, Sparkles, ChevronDown, Users } from "lucide-react"
import { useDishes } from "@/lib/realtime-hooks"

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
    calories: { current: 0, target: 0 },
    protein: { current: 0, target: 0 },
    carbs: { current: 0, target: 0 },
    fats: { current: 0, target: 0 },
    fiber: { current: 0, target: 0 },
    water: 0,
    waterTarget: 0,
    dayPlan: [] as { id: string; time: string; type: "meal" | "supplement" | "training"; name: string; dishId: string | null; calories?: number; logged: boolean }[],
  },
  marcin: {
    calories: { current: 0, target: 0 },
    protein: { current: 0, target: 0 },
    carbs: { current: 0, target: 0 },
    fats: { current: 0, target: 0 },
    fiber: { current: 0, target: 0 },
    water: 0,
    waterTarget: 0,
    dayPlan: [] as { id: string; time: string; type: "meal" | "supplement" | "training"; name: string; dishId: string | null; calories?: number; logged: boolean }[],
  },
}

export function DashboardScreen() {
  const { activeUser, getTodaySteps, updateSteps, getWeeklyAvgSteps } = useUser()
  const { dishes: allDishes } = useDishes()
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
    return allDishes
      .map(dish => {
        const cals = dish.totalCalories
        const protein = dish.totalProtein
        const carbs = dish.totalCarbs
        const fats = dish.totalFats
        // Penalize if exceeds remaining (we want to fill, not overflow)
        const calorieScore = cals <= remainingMacros.calories
          ? cals / Math.max(remainingMacros.calories, 1)
          : -0.5 * (cals - remainingMacros.calories) / cals

        // Prioritize protein matching
        const proteinScore = protein <= remainingMacros.protein + 10
          ? protein / Math.max(remainingMacros.protein, 1)
          : -0.3 * (protein - remainingMacros.protein) / protein

        const carbScore = carbs <= remainingMacros.carbs + 15
          ? 0.3 * carbs / Math.max(remainingMacros.carbs, 1)
          : -0.2

        const fatScore = fats <= remainingMacros.fats + 10
          ? 0.3 * fats / Math.max(remainingMacros.fats, 1)
          : -0.2

        const totalScore = calorieScore + proteinScore * 1.5 + carbScore + fatScore

        return { ...dish, score: totalScore }
      })
      .filter(dish => dish.totalCalories <= remainingMacros.calories + 100) // Allow small overflow
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
            <Droplets className="size-5 text-navy/70" />
            <span className="text-sm font-semibold text-foreground">Water</span>
          </div>
          <span className="text-sm text-muted-foreground">
            {water}ml / {data.waterTarget}ml
          </span>
        </div>
        <div className="h-2 bg-secondary rounded-full overflow-hidden mb-3">
          <div 
            className="h-full bg-navy/70 rounded-full transition-all duration-500"
            style={{ width: `${Math.min((water / data.waterTarget) * 100, 100)}%` }}
          />
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => addWater(300)}
            className="flex-1 py-2.5 rounded-xl bg-navy/10 text-navy/70 text-sm font-medium active:scale-[0.98] transition-transform"
          >
            +300ml
          </button>
          <button 
            onClick={() => addWater(500)}
            className="flex-1 py-2.5 rounded-xl bg-navy/10 text-navy/70 text-sm font-medium active:scale-[0.98] transition-transform"
          >
            +500ml
          </button>
          <button 
            onClick={() => addWater(1000)}
            className="flex-1 py-2.5 rounded-xl bg-navy/10 text-navy/70 text-sm font-medium active:scale-[0.98] transition-transform"
          >
            +1L
          </button>
        </div>
      </div>

      {/* Step Tracker */}
      <div className="bg-card rounded-2xl p-4 border border-border">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Footprints className="size-5 text-sage/70" />
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
            className="h-full bg-sage/70 rounded-full transition-all duration-500"
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
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{recipe.description || recipe.subCategory}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-[10px]">
                    <span className="text-foreground font-medium">{recipe.totalCalories} kcal</span>
                    <span className="text-primary">{recipe.totalProtein}g P</span>
                    <span className="text-wheat">{recipe.totalCarbs}g C</span>
                    <span className="text-terracotta/70">{recipe.totalFats}g F</span>
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
              partnerUser === "marcin" ? "bg-navy/20" : "bg-sage/20"
            }`}>
              <Users className={`size-5 ${partnerUser === "marcin" ? "text-navy" : "text-sage"}`} />
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
                    ? "bg-terracotta/20"
                    : "bg-sand/20"
                }`}>
                  {item.type === "meal" ? (
                    <div className="size-2.5 rounded-full bg-primary" />
                  ) : item.type === "training" ? (
                    <Dumbbell className="size-3 text-terracotta/70" />
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
                    ? "bg-terracotta/20"
                    : "bg-sand/20"
                }`}>
                  {item.type === "meal" ? (
                    <div className="size-4 rounded-full bg-primary" />
                  ) : item.type === "training" ? (
                    <Dumbbell className="size-4 text-terracotta/70" />
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
