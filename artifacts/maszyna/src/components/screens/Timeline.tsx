import { useMemo, useState, useEffect } from "react"
import { useMealLogs, usePlannerEvents } from "@/lib/realtime-hooks"
import { useAuth } from "@/lib/auth-context"
import { Dumbbell, UtensilsCrossed, CheckCircle2, Circle, Pill } from "lucide-react"

interface MacroSummary { calories: number; protein: number; carbs: number; fats: number }

interface TimelineProps {
  dateStr: string
  activeUser: "patrycja" | "marcin"
  loggedOverrides?: Record<string, boolean>
  onToggleOverride?: (id: string, newLogged: boolean) => void
  onMacrosChange?: (macros: MacroSummary) => void
  readOnly?: boolean
}

interface TimelineItem {
  id: string
  time: string
  name: string
  type: "meal" | "training" | "supplements"
  details?: string
  logged: boolean
  macros?: { calories: number; protein: number; carbs: number; fats: number }
}

function getOwnerFromRecord(
  record: { user_id?: string; details?: string | null },
  userId: string | undefined,
  profileName: string | undefined,
  partnerName: string | undefined
): "marcin" | "patrycja" {
  try {
    const parsed = record.details ? JSON.parse(record.details) : {}
    if (parsed.owner === "marcin" || parsed.owner === "patrycja") return parsed.owner
  } catch { /* ignore */ }
  if (record.user_id === userId) {
    return profileName?.toLowerCase().includes("marcin") ? "marcin" : "patrycja"
  }
  return partnerName?.toLowerCase().includes("marcin") ? "marcin" : "patrycja"
}

function parseDisplayDetails(raw: string | null | undefined): string | undefined {
  if (!raw) return undefined
  try {
    const parsed = JSON.parse(raw)
    const { owner: _owner, ...rest } = parsed
    const entries = Object.entries(rest)
    if (entries.length === 0) return undefined
    const labels: Record<string, string> = {
      workoutType: "Typ",
      notes: "Notatki",
      description: "Opis",
      plan: "Plan",
    }
    return entries.map(([k, v]) => `${labels[k] ?? k}: ${v}`).join(" · ")
  } catch {
    return raw
  }
}

export function Timeline({ dateStr, activeUser, loggedOverrides: externalOverrides, onToggleOverride, onMacrosChange, readOnly }: TimelineProps) {
  const { meals, toggleMealLogged } = useMealLogs(dateStr)
  const { events, toggleEventLogged } = usePlannerEvents()
  const { user, profile, partner } = useAuth()

  // Local override map used only when no external overrides are provided
  const [localLoggedOverrides, setLocalLoggedOverrides] = useState<Record<string, boolean>>({})
  const loggedOverrides = externalOverrides ?? localLoggedOverrides

  const timelineItems = useMemo(() => {
    const items: TimelineItem[] = []

    meals
      .filter((m) => getOwnerFromRecord(m, user?.id, profile?.name, partner?.name) === activeUser)
      .forEach((m) => {
        items.push({
          id: m.id,
          time: m.time || "00:00",
          name: m.name,
          type: "meal",
          logged: loggedOverrides[m.id] !== undefined ? loggedOverrides[m.id] : (m.logged || false),
          macros: {
            calories: m.calories || 0,
            protein: m.protein || 0,
            carbs: m.carbs || 0,
            fats: m.fats || 0,
          },
        })
      })

    // Build a set of meal name+time combos already covered by meal_logs
    // so we don't show duplicate entries for the same meal
    const mealLogKeys = new Set(
      items.map(i => `${i.time}|${i.name.toLowerCase().trim()}`)
    )

    events
      .filter(
        (e) =>
          e.date === dateStr &&
          getOwnerFromRecord(e, user?.id, profile?.name, partner?.name) === activeUser
      )
      .forEach((e) => {
        // Skip planner_events of type "meal" that are already represented by a meal_log
        if (e.type === "meal") {
          const key = `${e.time || "00:00"}|${(e.name || "").toLowerCase().trim()}`
          if (mealLogKeys.has(key)) return
        }
        // Extract macros stored in planner event details JSON
        let eventMacros: { calories: number; protein: number; carbs: number; fats: number } | undefined
        if (e.type === "meal" && e.details) {
          try {
            const d = JSON.parse(e.details)
            if (d.calories || d.protein || d.carbs || d.fats) {
              eventMacros = {
                calories: Number(d.calories) || 0,
                protein:  Number(d.protein)  || 0,
                carbs:    Number(d.carbs)    || 0,
                fats:     Number(d.fats)     || 0,
              }
            }
          } catch { }
        }
        items.push({
          id: e.id,
          time: e.time || "00:00",
          name: e.name || "Plan",
          type: (e.type === "meal" || e.type === "training" || e.type === "supplements")
            ? e.type
            : "training",
          details: parseDisplayDetails(e.details),
          logged: loggedOverrides[e.id] !== undefined ? loggedOverrides[e.id] : (e.logged || false),
          macros: eventMacros,
        })
      })

    return items.sort((a, b) => a.time.localeCompare(b.time))
  }, [meals, events, dateStr, activeUser, user, profile, partner, loggedOverrides])

  const loggedMacros = useMemo(() =>
    timelineItems
      .filter(i => i.type === "meal" && i.logged && i.macros)
      .reduce((acc, i) => ({
        calories: acc.calories + (i.macros!.calories),
        protein:  acc.protein  + (i.macros!.protein),
        carbs:    acc.carbs    + (i.macros!.carbs),
        fats:     acc.fats     + (i.macros!.fats),
      }), { calories: 0, protein: 0, carbs: 0, fats: 0 })
  , [timelineItems])

  useEffect(() => {
    onMacrosChange?.(loggedMacros)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loggedMacros])

  const handleToggle = (item: TimelineItem) => {
    const newLogged = !item.logged
    // Instant visual feedback — update either external or local overrides
    if (onToggleOverride) {
      onToggleOverride(item.id, newLogged)
    } else {
      setLocalLoggedOverrides(prev => ({ ...prev, [item.id]: newLogged }))
    }
    // Persist in background (fire-and-forget; visual won't revert even on error)
    if (item.type === "meal") {
      toggleMealLogged?.(item.id, item.logged)
    } else {
      toggleEventLogged?.(item.id, item.logged)
    }
  }

  if (timelineItems.length === 0) {
    return (
      <div className="text-center py-6 text-sm text-muted-foreground bg-card rounded-2xl border border-border">
        Brak zaplanowanych pozycji na dziś.
      </div>
    )
  }

  return (
    <div className="relative border-l border-muted-foreground/20 ml-3 pl-6 space-y-6 py-2">
      {timelineItems.map((item) => {
        const isMeal = item.type === "meal"
        const isSupp = item.type === "supplements"

        const iconBg = isMeal
          ? "bg-sage/10 text-sage"
          : isSupp
          ? "bg-sand/10 text-sand"
          : "bg-primary/10 text-primary"

        const Icon = isMeal ? UtensilsCrossed : isSupp ? Pill : Dumbbell

        return (
          <div key={item.id} className="relative group">
            <button
              onClick={() => !readOnly && handleToggle(item)}
              disabled={readOnly}
              className={`absolute -left-[35px] top-0.5 bg-background rounded-full p-0.5 transition-colors z-10 ${readOnly ? "cursor-default text-muted-foreground/40" : "text-muted-foreground hover:text-primary"}`}
            >
              {item.logged ? (
                <CheckCircle2 className={`size-5 ${readOnly ? "text-sage/50 fill-sage/5" : "text-sage fill-sage/10"}`} />
              ) : (
                <Circle className="size-5 opacity-40" />
              )}
            </button>

            <div
              className={`p-3.5 rounded-2xl border transition-all ${
                item.logged
                  ? "bg-secondary/40 border-transparent opacity-70"
                  : "bg-card border-border hover:shadow-sm"
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-xs font-mono font-semibold text-muted-foreground">
                  {item.time}
                </span>
                <span className={`p-1.5 rounded-lg ${iconBg}`}>
                  <Icon className="size-3.5" />
                </span>
              </div>

              <h4 className="text-sm font-medium text-foreground">{item.name}</h4>

              {item.details && (
                <p className="text-xs text-muted-foreground mt-0.5">{item.details}</p>
              )}

              {isMeal && item.macros && !item.logged && (
                <div className="flex gap-3 mt-2 pt-2 border-t border-border/50 text-[10px] text-muted-foreground font-mono">
                  <span>{item.macros.calories} kcal</span>
                  <span>B: {item.macros.protein}g</span>
                  <span>W: {item.macros.carbs}g</span>
                  <span>T: {item.macros.fats}g</span>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
