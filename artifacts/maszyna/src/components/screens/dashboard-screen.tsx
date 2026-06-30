import { useState, useMemo } from "react"
import { useUser } from "@/lib/user-context"
import { useAuth } from "@/lib/auth-context"
import { Droplets, Footprints } from "lucide-react"
import { useMealLogs } from "@/lib/realtime-hooks"
import { Timeline } from "./Timeline"
import { AIMealSuggestion } from "@/components/AIMealSuggestion"

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

const MACRO_TARGETS = {
  patrycja: { calories: 1900, protein: 120, carbs: 200, fats: 65, fiber: 25, water: 2500 },
  marcin: { calories: 2500, protein: 160, carbs: 280, fats: 80, fiber: 30, water: 3000 }
}

export function DashboardScreen() {
  const { activeUser, getTodaySteps, updateSteps, getWeeklyAvgSteps } = useUser()
  const { profile, partner, user, settings } = useAuth()

  const partnerUser = activeUser === "patrycja" ? "marcin" : "patrycja"
  const partnerName = partner?.name || partnerUser
  const myName = profile?.name || activeUser

  const now = new Date()
  const todayDateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

  const { meals: allTodayMeals } = useMealLogs(todayDateStr)

  function getRecordOwner(record: { user_id?: string; details?: string | null }): "patrycja" | "marcin" | null {
    try {
      const d = record.details ? JSON.parse(record.details) : {}
      if (d.owner === "patrycja" || d.owner === "marcin") return d.owner
    } catch { /* ignore */ }
    return null
  }

  const myMeals = allTodayMeals.filter(m => {
    const o = getRecordOwner(m)
    return o ? o === activeUser : m.user_id === user?.id
  })

  // All planned macros = sum ALL my meal logs regardless of logged status
  const allPlannedMacros = useMemo(() => myMeals.reduce(
    (acc, m) => ({
      calories: acc.calories + (m.calories || 0),
      protein:  acc.protein  + (m.protein  || 0),
      carbs:    acc.carbs    + (m.carbs    || 0),
      fats:     acc.fats     + (m.fats     || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fats: 0 }
  ), [myMeals])

  const [loggedOverrides, setLoggedOverrides] = useState<Record<string, boolean>>(() => {
    try {
      const stored = localStorage.getItem(`meal-ticks-${todayDateStr}`)
      if (stored) return JSON.parse(stored) as Record<string, boolean>
    } catch { /* ignore */ }
    return {}
  })
  const handleToggleOverride = (id: string, newLogged: boolean) => {
    setLoggedOverrides(prev => {
      const next = { ...prev, [id]: newLogged }
      try { localStorage.setItem(`meal-ticks-${todayDateStr}`, JSON.stringify(next)) } catch { /* ignore */ }
      return next
    })
  }

  const [water, setWater] = useState(0)
  const [lastWaterAdd, setLastWaterAdd] = useState<number | null>(null)
  const [showStepInput, setShowStepInput] = useState(false)
  const [stepInput, setStepInput] = useState("")
  const [viewingPartner, setViewingPartner] = useState(false)

  const todaySteps = getTodaySteps()
  const weeklyAvg = getWeeklyAvgSteps()
  const stepGoal = 10000
  const stepCalories = Math.round(todaySteps * 0.04 * (activeUser === "patrycja" ? 62 : 85))

  const [currentMacros, setCurrentMacros] = useState({ calories: 0, protein: 0, carbs: 0, fats: 0, fiber: 0 })

  const targets = {
    calories: settings?.calorie_goal || MACRO_TARGETS[activeUser].calories,
    protein: settings?.protein_goal || MACRO_TARGETS[activeUser].protein,
    carbs: settings?.carbs_goal || MACRO_TARGETS[activeUser].carbs,
    fats: settings?.fats_goal || MACRO_TARGETS[activeUser].fats,
    fiber: MACRO_TARGETS[activeUser].fiber,
    water: MACRO_TARGETS[activeUser].water,
  }

  const remainingMacros = {
    calories: Math.max(0, targets.calories - allPlannedMacros.calories),
    protein:  Math.max(0, targets.protein  - allPlannedMacros.protein),
    carbs:    Math.max(0, targets.carbs    - allPlannedMacros.carbs),
    fats:     Math.max(0, targets.fats     - allPlannedMacros.fats),
  }

  const addWater = (amount: number) => {
    setLastWaterAdd(amount)
    setWater((prev) => Math.min(prev + amount, targets.water + 1000))
  }
  const undoWater = () => {
    if (lastWaterAdd !== null) {
      setWater((prev) => Math.max(0, prev - lastWaterAdd))
      setLastWaterAdd(null)
    }
  }

  const displayUser = viewingPartner ? partnerUser : activeUser

  return (
    <div className="flex flex-col gap-5 pb-24">

      {/* MACROS */}
      <div className="rounded-2xl border border-border overflow-hidden" style={{ background: 'linear-gradient(160deg, var(--color-olive-subtle) 0%, var(--color-card) 55%)' }}>
        <div className="p-4">
        <div className="flex justify-center pb-4 mb-4 border-b border-border">
          <ProgressRing
            value={currentMacros.calories}
            max={targets.calories}
            color="var(--color-navy, #1A2E26)"
            label="kcal"
            unit="kcal"
            size={110}
            strokeWidth={7}
            textSize="text-lg"
          />
        </div>
        <div className="grid grid-cols-4 gap-2">
          <ProgressRing value={currentMacros.protein} max={targets.protein} color="var(--color-moss, #3B5340)" label="Białko" unit="g" size={60} strokeWidth={4.5} textSize="text-[10px]" />
          <ProgressRing value={currentMacros.carbs}   max={targets.carbs}   color="var(--color-sand, #D4A373)" label="Węgle"  unit="g" size={60} strokeWidth={4.5} textSize="text-[10px]" />
          <ProgressRing value={currentMacros.fats}    max={targets.fats}    color="var(--color-terracotta, #CD7F67)" label="Tłuszcze" unit="g" size={60} strokeWidth={4.5} textSize="text-[10px]" />
          <ProgressRing value={currentMacros.fiber}   max={targets.fiber}   color="var(--color-sage, #8A9A86)" label="Błonnik" unit="g" size={60} strokeWidth={4.5} textSize="text-[10px]" />
        </div>
        </div>
      </div>

      {/* WATER */}
      <div className="bg-card rounded-2xl p-4 border border-border">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Droplets className="size-5 text-navy/70" />
            <span className="text-sm font-semibold text-foreground">Woda</span>
          </div>
          <span className="text-sm text-muted-foreground">{water}ml / {targets.water}ml</span>
        </div>
        <div className="h-2 bg-secondary rounded-full overflow-hidden mb-3">
          <div className="h-full bg-navy/70 rounded-full transition-all duration-500" style={{ width: `${Math.min((water / targets.water) * 100, 100)}%` }} />
        </div>
        <div className="flex gap-2">
          <button onClick={() => addWater(300)} className="flex-1 py-2.5 rounded-xl bg-navy/10 text-navy/70 text-sm font-medium active:scale-[0.98] transition-transform">+300ml</button>
          <button onClick={() => addWater(500)} className="flex-1 py-2.5 rounded-xl bg-navy/10 text-navy/70 text-sm font-medium active:scale-[0.98] transition-transform">+500ml</button>
          <button onClick={() => addWater(1000)} className="flex-1 py-2.5 rounded-xl bg-navy/10 text-navy/70 text-sm font-medium active:scale-[0.98] transition-transform">+1L</button>
          {lastWaterAdd !== null && (
            <button onClick={undoWater} className="px-3 py-2.5 rounded-xl bg-destructive/10 text-destructive text-sm font-medium active:scale-[0.98] transition-transform flex items-center gap-1 shrink-0" title={`Cofnij +${lastWaterAdd}ml`}>↩</button>
          )}
        </div>
      </div>

      {/* STEPS */}
      <div className="bg-card rounded-2xl p-4 border border-border">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Footprints className="size-5 text-sage/70" />
            <span className="text-sm font-semibold text-foreground">Kroki</span>
          </div>
          <button onClick={() => { setStepInput(todaySteps.toString()); setShowStepInput(true) }} className="text-xs text-primary font-medium">Zmień</button>
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
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowStepInput(false)}>
            <div className="bg-card rounded-2xl w-full max-w-xs p-5 animate-in fade-in-0 zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
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
                <button onClick={() => { updateSteps(todayDateStr, parseInt(stepInput) || 0); setShowStepInput(false) }} className="flex-1 py-2.5 rounded-xl btn-dashboard font-medium">Zapisz</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* TODAY — with partner toggle */}
      <div className="mt-1">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-foreground">Dziś</h2>
          {/* Partner toggle */}
          <div className="flex gap-1 p-0.5 bg-secondary rounded-xl">
            <button
              onClick={() => setViewingPartner(false)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all capitalize ${!viewingPartner ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}
            >
              {myName}
            </button>
            <button
              onClick={() => setViewingPartner(true)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all capitalize ${viewingPartner ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}
            >
              {partnerName}
            </button>
          </div>
        </div>

        {viewingPartner && (
          <p className="text-xs text-muted-foreground mb-3 text-center">Podgląd — nie możesz zaznaczać posiłków partnera</p>
        )}

        <Timeline
          dateStr={todayDateStr}
          activeUser={displayUser}
          loggedOverrides={viewingPartner ? {} : loggedOverrides}
          onToggleOverride={viewingPartner ? undefined : handleToggleOverride}
          onMacrosChange={viewingPartner ? undefined : (macros) => setCurrentMacros({ ...macros, fiber: 0 })}
          readOnly={viewingPartner}
        />
      </div>

      {/* AI MEAL SUGGESTION */}
      <AIMealSuggestion remaining={remainingMacros} targets={targets} />

    </div>
  )
}
