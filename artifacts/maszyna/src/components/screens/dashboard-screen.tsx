import { getT } from "@/lib/i18n";
import { useState } from "react"
import { useUser } from "@/lib/user-context"
import { useAuth } from "@/lib/auth-context"
import { Droplets, Dumbbell, Pill, Check, ChevronRight, Calculator, Footprints, Sparkles, ChevronDown, Users } from "lucide-react"
import { useDishes, useMealLogs, usePlannerEvents } from "@/lib/realtime-hooks"
import { Timeline } from "./Timeline"

function ProgressRing({ 
  value, 
  max, 
  color, 
  label, 
  unit,
  size = 64,
  strokeWidth = 5,
  textSize = "text-xs"
}: { 
  value: number
  max: number
  color: string
  label: string
  unit: string
  size?: number
  strokeWidth?: number
  textSize?: string
}) {
  const radius = (size - strokeWidth - 2) / 2
  const circumference = 2 * Math.PI * radius
  const progress = Math.min(value / max, 1) || 0
  const strokeDashoffset = circumference * (1 - progress)

  return (
    <div className="flex flex-col items-center gap-1 w-full justify-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="transform -rotate-90" width={size} height={size}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-secondary/30"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-700 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`${textSize} font-bold text-foreground`}>{Math.round(value)}</span>
          <span className="text-[9px] text-muted-foreground opacity-70">/ {max}</span>
        </div>
      </div>
      <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mt-1">{label}</span>
    </div>
  )
}

// Cele makro (wartości bazowe, dopasuj je do Waszych rzeczywistych celów)
const MACRO_TARGETS = {
  patrycja: { calories: 1900, protein: 120, carbs: 200, fats: 65, fiber: 25, water: 2500 },
  marcin: { calories: 2500, protein: 160, carbs: 280, fats: 80, fiber: 30, water: 3000 }
}

export function DashboardScreen() {
  const { activeUser, getTodaySteps, updateSteps, getWeeklyAvgSteps } = useUser()
  const { dishes: allDishes } = useDishes()
  const { profile, partner } = useAuth()

  const partnerUser = activeUser === "patrycja" ? "marcin" : "patrycja"
  const partnerName = partner?.name || partnerUser
  const todayDateStr = new Date().toISOString().split('T')[0] // 'YYYY-MM-DD'

  // POBIERANIE DANYCH Z SUPABASE (Real-time)
  const { meals: myMeals } = useMealLogs(todayDateStr)
  const { events: myEvents } = usePlannerEvents(todayDateStr)

  const { meals: partnerMeals } = useMealLogs(todayDateStr)
  const { events: partnerEvents } = usePlannerEvents(todayDateStr)

  const [water, setWater] = useState(MACRO_TARGETS[activeUser].water * 0.4) // Proste demo stanu wody
  const [showStepInput, setShowStepInput] = useState(false)
  const [stepInput, setStepInput] = useState("")
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [showPartnerDay, setShowPartnerDay] = useState(false)

  const todaySteps = getTodaySteps()
  const weeklyAvg = getWeeklyAvgSteps()
  const stepGoal = 10000
  const stepCalories = Math.round(todaySteps * 0.04 * (activeUser === "patrycja" ? 62 : 85))

  // DYNAMICZNE OBLICZANIE MAKRO NA BAZIE ZJEDZONYCH (logged === true) POSIŁKÓW
  const currentMacros = myMeals
    .filter(meal => meal.logged)
    .reduce((acc, meal) => {
      acc.calories += meal.calories || 0
      acc.protein += meal.protein || 0
      acc.carbs += meal.carbs || 0
      acc.fats += meal.fats || 0
      return acc
    }, { calories: 0, protein: 0, carbs: 0, fats: 0, fiber: 0 })

  const targets = MACRO_TARGETS[activeUser]

  const remainingMacros = {
    calories: targets.calories - currentMacros.calories,
    protein: targets.protein - currentMacros.protein,
    carbs: targets.carbs - currentMacros.carbs,
    fats: targets.fats - currentMacros.fats,
  }

  // Podpowiedzi przepisów dopasowane do brakujących makroskładników
  const getSuggestedRecipes = () => {
    return allDishes
      .map(dish => {
        const cals = dish.totalCalories
        const protein = dish.totalProtein
        const carbs = dish.totalCarbs
        const fats = dish.totalFats

        const calorieScore = cals <= remainingMacros.calories
          ? cals / Math.max(remainingMacros.calories, 1)
          : -0.5 * (cals - remainingMacros.calories) / cals

        const proteinScore = protein <= remainingMacros.protein + 10
          ? protein / Math.max(remainingMacros.protein, 1)
          : -0.3 * (protein - remainingMacros.protein) / protein

        const totalScore = calorieScore + proteinScore * 1.5

        return { ...dish, score: totalScore }
      })
      .filter(dish => dish.totalCalories <= remainingMacros.calories + 100)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
  }

  const suggestedRecipes = getSuggestedRecipes()
  const hasRemainingMacros = remainingMacros.calories > 200

  const addWater = (amount: number) => {
    setWater((prev) => Math.min(prev + amount, targets.water + 1000))
  }

  // Agregacja planu partnera do uproszczonego podglądu pod przyciskiem rozwijanym
  const partnerDayPlan = [
    ...partnerMeals.map(m => ({ ...m, type: 'meal' as const })),
    ...partnerEvents.map(e => ({ ...e, type: e.type }))
  ].sort((a, b) => a.time.localeCompare(b.time))

  return (
    <div className="flex flex-col gap-5 pb-24">

      {/* SEKCJA MAKROSKŁADNIKÓW - ZASILANA DANYMI LIVE */}
      <div className="bg-card rounded-2xl p-5 border border-border">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-center">

          {/* LEWA STRONA: Kalorie */}
          <div className="md:col-span-2 flex justify-center border-b md:border-b-0 md:border-r border-border pb-4 md:pb-0 md:pr-4">
            <ProgressRing
              value={currentMacros.calories}
              max={targets.calories}
              color="var(--color-navy, #1A2E26)"
              label="kcal"
              unit="kcal"
              size={140}
              strokeWidth={8}
              textSize="text-xl"
            />
          </div>

          {/* PRAWA STRONA: Układ Ringów Makro */}
          <div className="md:col-span-3 grid grid-cols-2 gap-4">
            <ProgressRing
              value={currentMacros.protein}
              max={targets.protein}
              color="var(--color-moss, #3B5340)"
              label="Białko"
              unit="g"
              size={76}
              strokeWidth={5.5}
              textSize="text-sm"
            />
            <ProgressRing
              value={currentMacros.carbs}
              max={targets.carbs}
              color="var(--color-sand, #D4A373)"
              label="Węgle"
              unit="g"
              size={76}
              strokeWidth={5.5}
              textSize="text-sm"
            />
            <ProgressRing
              value={currentMacros.fats}
              max={targets.fats}
              color="var(--color-terracotta, #CD7F67)"
              label="Tłuszcze"
              unit="g"
              size={76}
              strokeWidth={5.5}
              textSize="text-sm"
            />
            <ProgressRing
              value={currentMacros.fiber}
              max={targets.fiber}
              color="var(--color-sage, #8A9A86)"
              label="Błonnik"
              unit="g"
              size={76}
              strokeWidth={5.5}
              textSize="text-sm"
            />
          </div>

        </div>
      </div>

      {/* Water Intake */}
      <div className="bg-card rounded-2xl p-4 border border-border">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Droplets className="size-5 text-navy/70" />
            <span className="text-sm font-semibold text-foreground">Woda</span>
          </div>
          <span className="text-sm text-muted-foreground">
            {water}ml / {targets.water}ml
          </span>
        </div>
        <div className="h-2 bg-secondary rounded-full overflow-hidden mb-3">
          <div 
            className="h-full bg-navy/70 rounded-full transition-all duration-500"
            style={{ width: `${Math.min((water / targets.water) * 100, 100)}%` }}
          />
        </div>
        <div className="flex gap-2">
          <button onClick={() => addWater(300)} className="flex-1 py-2.5 rounded-xl bg-navy/10 text-navy/70 text-sm font-medium active:scale-[0.98] transition-transform">
            +300ml
          </button>
          <button onClick={() => addWater(500)} className="flex-1 py-2.5 rounded-xl bg-navy/10 text-navy/70 text-sm font-medium active:scale-[0.98] transition-transform">
            +500ml
          </button>
          <button onClick={() => addWater(1000)} className="flex-1 py-2.5 rounded-xl bg-navy/10 text-navy/70 text-sm font-medium active:scale-[0.98] transition-transform">
            +1L
          </button>
        </div>
      </div>

      {/* Step Tracker */}
      <div className="bg-card rounded-2xl p-4 border border-border">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Footprints className="size-5 text-sage/70" />
            <span className="text-sm font-semibold text-foreground">Kroki</span>
          </div>
          <button onClick={() => { setStepInput(todaySteps.toString()); setShowStepInput(true) }} className="text-xs text-primary font-medium">
            Zmień
          </button>
        </div>

        <div className="flex items-end justify-between mb-3">
          <div>
            <span className="text-2xl font-bold text-foreground">{todaySteps.toLocaleString()}</span>
            <span className="text-sm text-muted-foreground ml-1">/ {stepGoal.toLocaleString()}</span>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">~{stepCalories} kcal</p>
            <p className="text-[10px] text-muted-foreground">Śr: {weeklyAvg.toLocaleString()}/dzień</p>
          </div>
        </div>

        <div className="h-2 bg-secondary rounded-full overflow-hidden">
          <div className="h-full bg-sage/70 rounded-full transition-all duration-500" style={{ width: `${Math.min((todaySteps / stepGoal) * 100, 100)}%` }} />
        </div>

        {showStepInput && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-card rounded-2xl w-full max-w-xs p-5">
              <h3 className="font-semibold text-foreground mb-1 text-center">Aktualizuj kroki</h3>
              <input
                type="number"
                value={stepInput}
                onChange={(e) => setStepInput(e.target.value)}
                className="w-full bg-secondary rounded-xl px-4 py-3 text-lg text-center font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary mb-4"
                autoFocus
              />
              <div className="flex gap-2">
                <button onClick={() => setShowStepInput(false)} className="flex-1 py-2.5 rounded-xl bg-secondary text-muted-foreground font-medium">Anuluj</button>
                <button onClick={() => { updateSteps(todayDateStr, parseInt(stepInput) || 0); setShowStepInput(false) }} className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium">Zapisz</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Recipe Suggestions */}
      {hasRemainingMacros && suggestedRecipes.length > 0 && (
        <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl border border-primary/20 overflow-hidden">
          <button onClick={() => setShowSuggestions(!showSuggestions)} className="w-full p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <Sparkles className="size-5 text-primary" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-foreground">Propozycje posiłków</p>
                <p className="text-xs text-muted-foreground">Zostało: {remainingMacros.calories} kcal · {remainingMacros.protein}g białka</p>
              </div>
            </div>
            <ChevronDown className={`size-5 text-muted-foreground transition-transform ${showSuggestions ? "rotate-180" : ""}`} />
          </button>

          {showSuggestions && (
            <div className="px-4 pb-4 flex flex-col gap-2">
              {suggestedRecipes.map((recipe, index) => (
                <div key={recipe.id} className="bg-card rounded-xl p-3 border border-border">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{recipe.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-[10px]">
                    <span className="text-foreground font-medium">{recipe.totalCalories} kcal</span>
                    <span className="text-primary">{recipe.totalProtein}g B</span>
                    <span className="text-wheat">{recipe.totalCarbs}g W</span>
                    <span className="text-terracotta/70">{recipe.totalFats}g T</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Partner's Day Card */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <button onClick={() => setShowPartnerDay(!showPartnerDay)} className="w-full p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`size-10 rounded-xl flex items-center justify-center ${partnerUser === "marcin" ? "bg-navy/20" : "bg-sage/20"}`}>
              <Users className={`size-5 ${partnerUser === "marcin" ? "text-navy" : "text-sage"}`} />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-foreground capitalize">{partnerName}&apos;s Day</p>
              <p className="text-xs text-muted-foreground">
                {partnerMeals.length} posiłków · {partnerEvents.filter(e => e.type === 'training').length} treningi
              </p>
            </div>
          </div>
          <ChevronDown className={`size-5 text-muted-foreground transition-transform ${showPartnerDay ? "rotate-180" : ""}`} />
        </button>

        {showPartnerDay && (
          <div className="px-4 pb-4 flex flex-col gap-2">
            {partnerDayPlan.slice(0, 5).map((item) => (
              <div key={item.id} className={`flex items-center gap-3 p-2 rounded-lg ${item.logged ? "bg-primary/5" : "bg-secondary/50"}`}>
                <span className="text-[10px] font-medium text-muted-foreground w-10">{item.time}</span>
                <span className="text-xs text-foreground flex-1 truncate">{item.name}</span>
                {item.logged && <Check className="size-3.5 text-primary" />}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* KROK 3 W AKCJI: NOWY OŚ CZASU (MIRIADA POSIŁKÓW I SUPLEMENTÓW) */}
      {/* ========================================================= */}
      <div className="mt-2">
        <Timeline selectedDate={todayDateStr} />
      </div>

    </div>
  )
}