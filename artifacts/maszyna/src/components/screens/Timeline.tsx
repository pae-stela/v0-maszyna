import { useMemo } from "react"
import { useMealLogs, usePlannerEvents } from "@/lib/realtime-hooks"
import { Dumbbell, UtensilsCrossed, CheckCircle2, Circle } from "lucide-react"

interface TimelineProps {
  dateStr: string // Format 'YYYY-MM-DD'
  activeUser: "patrycja" | "marcin"
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

export function Timeline({ dateStr, activeUser }: TimelineProps) {
  const { meals, toggleMealLogged } = useMealLogs(dateStr)
  const { events, toggleEventLogged } = usePlannerEvents()

  // Łączymy dane z meal_logs i planner_events w jedną oś czasu
  const timelineItems = useMemo(() => {
    const items: TimelineItem[] = []

    // 1. Mapowanie posiłków
    meals
      .filter((m) => m.owner === activeUser)
      .forEach((m) => {
        items.push({
          id: m.id,
          time: m.time || "00:00",
          name: m.name,
          type: "meal",
          logged: m.logged || false,
          macros: {
            calories: m.calories || 0,
            protein: m.protein || 0,
            carbs: m.carbs || 0,
            fats: m.fats || 0,
          },
        })
      })

    // 2. Mapowanie treningów / suplementów
    events
      .filter((e) => e.date === dateStr && e.owner === activeUser)
      .forEach((e) => {
        items.push({
          id: e.id,
          time: e.time || "00:00",
          name: e.name || e.title || "Plan",
          type: e.type as "training" | "supplements",
          details: e.details,
          logged: e.logged || false,
        })
      })

    // Sortowanie chronologiczne po godzinie "HH:MM"
    return items.sort((a, b) => a.time.localeCompare(b.time))
  }, [meals, events, dateStr, activeUser])

  const handleToggle = async (item: TimelineItem) => {
    if (item.type === "meal") {
      await toggleMealLogged(item.id, item.logged)
    } else {
      await toggleEventLogged(item.id, item.logged)
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

        return (
          <div key={item.id} className="relative group">
            {/* Kulka statusu (Klikalny Checkbox) */}
            <button
              onClick={() => handleToggle(item)}
              className="absolute -left-[35px] top-0.5 bg-background rounded-full p-0.5 text-muted-foreground hover:text-primary transition-colors z-10"
            >
              {item.logged ? (
                <CheckCircle2 className="size-5 text-sage fill-sage/10" />
              ) : (
                <Circle className="size-5 opacity-40" />
              )}
            </button>

            {/* Zawartość kafelka */}
            <div className={`p-3.5 rounded-2xl border transition-all ${
              item.logged 
                ? "bg-secondary/40 border-transparent opacity-70" 
                : "bg-card border-border hover:shadow-sm"
            }`}>
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-xs font-mono font-semibold text-muted-foreground">
                  {item.time}
                </span>
                <span className={`p-1.5 rounded-lg ${
                  isMeal ? "bg-sage/10 text-sage" : "bg-primary/10 text-primary"
                }`}>
                  {isMeal ? <UtensilsCrossed className="size-3.5" /> : <Dumbbell className="size-3.5" />}
                </span>
              </div>

              <h4 className="text-sm font-medium text-foreground">{item.name}</h4>

              {item.details && (
                <p className="text-xs text-muted-foreground mt-0.5">{item.details}</p>
              )}

              {/* Wyświetlanie makro dla posiłków */}
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