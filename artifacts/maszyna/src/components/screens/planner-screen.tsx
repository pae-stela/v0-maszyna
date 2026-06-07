import { useLanguage } from "@/lib/i18n/context"
import { useState, useMemo } from "react"
import { useAuth } from "@/lib/auth-context"
import { useDishes, useWorkoutPlans, usePlannerEvents, useMealLogs } from "@/lib/realtime-hooks"
import { Calendar, ShoppingCart, ChevronLeft, ChevronRight, Plus, Check, X, Dumbbell, UtensilsCrossed, ExternalLink, AlertTriangle, RefreshCw, ChevronDown, FileText, Pill, Edit, Trash2 } from "lucide-react"

// Re-export dishCategories for shopping view
const dishCategories: Record<string, string[]> = {
  "Large": ["Pasta & Rice", "Traditional", "Pancakes & Tortillas", "Salads & Veggies", "Fakeaways"],
  "Light": ["Eggs", "Sandwiches & Wraps", "Soups", "Sweet Bakes & Desserts", "Oats & Granola"],
  "Snacks": ["Savoury", "Sweet"],
  "Drinks": ["Shakes & Smoothies", "Cocktails & Mocktails", "Hot drinks", "Cold drinks"],
}

type SubTab = "calendar" | "shopping"
type CalendarViewMode = "today" | "3day" | "week"
type EventType = "meal" | "training" | "supplements" | "google"

type OwnerFilter = "patrycja" | "marcin" | "both"

interface PlannerEventLocal {
  id: string
  date: Date
  title: string
  time: string
  type: EventType
  details?: string
  owner: "marcin" | "patrycja"
  calories?: number
  protein?: number
  carbs?: number
  fats?: number
  fiber?: number
  dishId?: string
  planId?: string
  sharedWithPartner?: boolean
}

export function PlannerScreen() {
  const { t } = useLanguage()
  const [subTab, setSubTab] = useState<SubTab>("calendar")

  return (
    <div className="flex flex-col gap-4 pb-24">
      <div className="flex gap-2 p-1 bg-secondary rounded-xl">
        <button
          onClick={() => setSubTab("calendar")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
            subTab === "calendar"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground"
          }`}
        >
          <Calendar className="size-4" />
         {t("planner")}
        </button>
        <button
          onClick={() => setSubTab("shopping")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
            subTab === "shopping"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground"
          }`}
        >
          <ShoppingCart className="size-4" />
          {t("Shopping")}
        </button>
      </div>

      {subTab === "calendar" ? <CalendarView /> : <ShoppingView />}
    </div>
  )
}

// Helper to get dates for views
function getDateRange(baseDate: Date, mode: CalendarViewMode): Date[] {
  const dates: Date[] = []
  const start = new Date(baseDate)
  start.setHours(0, 0, 0, 0)

  if (mode === "today") {
    dates.push(new Date(start))
  } else if (mode === "3day") {
    for (let i = 0; i < 3; i++) {
      const d = new Date(start)
      d.setDate(start.getDate() + i)
      dates.push(d)
    }
  } else if (mode === "week") {
    const day = start.getDay()
    const diff = start.getDate() - day + (day === 0 ? -6 : 1)
    start.setDate(diff)
    for (let i = 0; i < 7; i++) {
      const d = new Date(start)
      d.setDate(start.getDate() + i)
      dates.push(d)
    }
  }
  return dates
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

function isSameDay(d1: Date, d2: Date): boolean {
  return d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
}

const DASHBOARD_COLORS = {
  calories: "#1A2E26",
  protein: "#3B5340",
  carbs: "#D4A373",
  fats: "#CD7F67",
  fiber: "#8A9A86",
}

const MACRO_TARGETS: Record<string, { calories: number; protein: number; carbs: number; fats: number; fiber: number }> = {
  patrycja: { calories: 1900, protein: 120, carbs: 200, fats: 65, fiber: 25 },
  marcin: { calories: 2500, protein: 160, carbs: 280, fats: 80, fiber: 30 },
}

function MacroProgressBar({
  label, value, max, color
}: {
  label: string
  value: number
  max: number
  color: string
}) {
  const pct = Math.min((value / max) * 100, 100)
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between text-[10px]">
        <span className="text-muted-foreground font-medium">{label}</span>
        <span className="text-foreground font-semibold">{Math.round(value)}/{max}</span>
      </div>
      <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{ width: `${pct}%`, transition: 'width 0.5s ease-out', backgroundColor: color }}
        />
      </div>
    </div>
  )
}

function MacroRing({
  value, max, color, size = 22
}: {
  value: number
  max: number
  color: string
  size?: number
}) {
  const radius = (size - 3) / 2
  const circumference = 2 * Math.PI * radius
  const progress = Math.min(value / max, 1) || 0
  const strokeDashoffset = circumference * (1 - progress)
  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle
        cx={size / 2} cy={size / 2} r={radius}
        fill="none" strokeWidth={2}
        stroke="currentColor" className="text-secondary/40"
      />
      <circle
        cx={size / 2} cy={size / 2} r={radius}
        fill="none" strokeWidth={2}
        stroke={color}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        className="transition-all duration-500"
      />
    </svg>
  )
}

function MacroSummary({
  date,
  ownerFilter,
  partner,
  plannerEvents
}: {
  date: Date
  ownerFilter: OwnerFilter
  partner: { name: string; id: string } | null
  plannerEvents: { id: string; date: string; time: string; type: string; name: string; details: string | null; user_id: string; logged: boolean; shared_with_partner: boolean; created_at: string; updated_at?: string }[]
}) {
  const dateStr = date.toISOString().split('T')[0]
  const { profile } = useAuth()

  const getMacros = (owner: "marcin" | "patrycja") => {
    const target = MACRO_TARGETS[owner] || MACRO_TARGETS.patrycja
    const filtered = plannerEvents.filter(e => {
      if (e.date !== dateStr) return false
      if (e.type !== 'meal') return false
      let parsedOwner: string | null = null
      try {
        if (e.details) {
          const d = JSON.parse(e.details)
          if (d && typeof d.owner === "string") parsedOwner = d.owner.toLowerCase()
        }
      } catch { /* ignore */ }
      if (parsedOwner) return parsedOwner === owner
      return owner === "marcin"
        ? (profile?.name?.toLowerCase().includes("marcin") ? true : false)
        : (partner?.name?.toLowerCase().includes("patrycja") ? true : false)
    })

    const consumed = filtered.reduce(
      (acc, e) => {
        let cals = 0, prot = 0, carb = 0, fat = 0, fib = 0
        try {
          if (e.details) {
            const d = JSON.parse(e.details)
            cals = d.calories || 0
            prot = d.protein || 0
            carb = d.carbs || 0
            fat = d.fats || 0
            fib = d.fiber || 0
          }
        } catch { /* ignore */ }
        return {
          calories: acc.calories + cals,
          protein: acc.protein + prot,
          carbs: acc.carbs + carb,
          fats: acc.fats + fat,
          fiber: acc.fiber + fib,
        }
      },
      { calories: 0, protein: 0, carbs: 0, fats: 0, fiber: 0 }
    )
    return { consumed, target, owner }
  }

  const SingleOwnerMacros = ({ owner, consumed, target }: { owner: "marcin" | "patrycja"; consumed: any; target: any }) => {
    const pct = target.calories > 0 ? Math.round((consumed.calories / target.calories) * 100) : 0
    const ringColor = owner === "marcin" ? DASHBOARD_COLORS.calories : DASHBOARD_COLORS.fiber
    return (
      <div className="flex-1 flex flex-col gap-1.5">
        <div className="flex items-center gap-1.5">
          <MacroRing value={consumed.calories} max={target.calories} color={ringColor} size={20} />
          <div className="flex flex-col">
            <span className="text-[9px] font-semibold text-foreground">{consumed.calories} kcal</span>
            <span className="text-[8px] text-muted-foreground">{pct}% / {target.calories}</span>
          </div>
        </div>
        <MacroProgressBar label="B" value={consumed.protein} max={target.protein} color={DASHBOARD_COLORS.protein} />
        <MacroProgressBar label="W" value={consumed.carbs} max={target.carbs} color={DASHBOARD_COLORS.carbs} />
        <MacroProgressBar label="T" value={consumed.fats} max={target.fats} color={DASHBOARD_COLORS.fats} />
        <MacroProgressBar label="Bl" value={consumed.fiber} max={target.fiber} color={DASHBOARD_COLORS.fiber} />
      </div>
    )
  }

  if (ownerFilter === "both") {
    const patrycjaData = getMacros("patrycja")
    const marcinData = getMacros("marcin")
    return (
      <div className="px-2 pb-3 pt-1 border-b border-border">
        <div className="flex gap-2">
          <div className="flex-1 bg-sage/10 rounded-xl p-2 flex flex-col gap-1">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-sage" />
              <span className="text-[9px] font-semibold text-sage">{partner?.name?.includes("Patrycja") ? "Patrycja" : "Patrycja"}</span>
            </div>
            <SingleOwnerMacros owner="patrycja" consumed={patrycjaData.consumed} target={patrycjaData.target} />
          </div>
          <div className="flex-1 bg-navy/10 rounded-xl p-2 flex flex-col gap-1">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-navy" />
              <span className="text-[9px] font-semibold text-navy">{partner?.name?.includes("Marcin") ? "Marcin" : "Marcin"}</span>
            </div>
            <SingleOwnerMacros owner="marcin" consumed={marcinData.consumed} target={marcinData.target} />
          </div>
        </div>
      </div>
    )
  }

  const data = getMacros(ownerFilter)
  return (
    <div className="px-3 pb-3 pt-1 flex flex-col gap-2 border-b border-border">
      <div className="flex items-center gap-1.5">
        <MacroRing value={data.consumed.calories} max={data.target.calories} color={DASHBOARD_COLORS.calories} size={24} />
        <span className="text-[10px] text-muted-foreground font-medium">{Math.round(data.consumed.calories)} / {data.target.calories} kcal</span>
      </div>
      <MacroProgressBar label="Białko" value={data.consumed.protein} max={data.target.protein} color={DASHBOARD_COLORS.protein} />
      <MacroProgressBar label="Węgle" value={data.consumed.carbs} max={data.target.carbs} color={DASHBOARD_COLORS.carbs} />
      <MacroProgressBar label="Tłuszcze" value={data.consumed.fats} max={data.target.fats} color={DASHBOARD_COLORS.fats} />
      <MacroProgressBar label="Błonnik" value={data.consumed.fiber} max={data.target.fiber} color={DASHBOARD_COLORS.fiber} />
    </div>
  )
}

function CalendarView() {
  const { user, profile, settings, partner } = useAuth()
  const { dishes: allDishes } = useDishes()
  const { plans: allPlans } = useWorkoutPlans()

  const [viewMode, setViewMode] = useState<CalendarViewMode>("today")
  const [baseDate, setBaseDate] = useState(new Date())
  const [showAddModal, setShowAddModal] = useState(false)
  const [addType, setAddType] = useState<"meal" | "training" | "supplements">("meal")
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [googleConnected, setGoogleConnected] = useState(false)
  const [ownerFilter, setOwnerFilter] = useState<OwnerFilter>("both")
  const [activeUser, setActiveUser] = useState<"marcin" | "patrycja">("patrycja")
  const [showBothCalendars, setShowBothCalendars] = useState(true)

  // Event menu state
  const [showEventMenu, setShowEventMenu] = useState(false)
  const [selectedEventForMenu, setSelectedEventForMenu] = useState<string | null>(null)
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 })
  const [showSwapDishModal, setShowSwapDishModal] = useState(false)

  const [onKitchenEditDish, setOnKitchenEditDish] = useState<(() => void) | null>(null)

  const [newEvent, setNewEvent] = useState({ title: "", time: "12:00", details: "" })
  const [inputMode, setInputMode] = useState<"preset" | "custom">("preset")
  const [selectedDishId, setSelectedDishId] = useState<string | null>(null)
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null)
  const [workoutTypeFilter, setWorkoutTypeFilter] = useState<"weights" | "cardio" | "flexibility">("weights")
  const [isRecurring, setIsRecurring] = useState(false)
  const [selectedDays, setSelectedDays] = useState<number[]>([])
  const [totalOccurrences, setTotalOccurrences] = useState(4)

  const [selectedMainCategory, setSelectedMainCategory] = useState<string | null>(null)
  const [selectedSubCategory, setSelectedSubCategory] = useState<string | null>(null)
  const [mealOwner, setMealOwner] = useState<"marcin" | "patrycja" | "both">("patrycja")

  const dates = getDateRange(baseDate, viewMode)
  const today = new Date()

  const dateStrForHook = baseDate.toISOString().split('T')[0]
  const { events: plannerEvents, addEvent, updateEvent, deleteEvent } = usePlannerEvents()
  const { addMeal } = useMealLogs(dateStrForHook)

  const navigate = (direction: "prev" | "next") => {
    const newDate = new Date(baseDate)
    const offset = viewMode === "today" ? 1 : viewMode === "3day" ? 3 : 7
    newDate.setDate(baseDate.getDate() + (direction === "next" ? offset : -offset))
    setBaseDate(newDate)
  }

  const goToToday = () => {
    setBaseDate(new Date())
  }

  const handleAddEvent = async () => {
    if (!user) {
      alert("Musisz być zalogowany/a, aby dodać pozycję do planera.")
      return
    }

    let title = ""
    let details = ""
    let calories = 0
    let protein = 0
    let carbs = 0
    let fats = 0
    let fiber = 0
    let dishId: string | undefined
    let planId: string | undefined
    const shared = mealOwner === "both"

    if (addType === "training" && selectedPlanId) {
      const plan = allPlans.find(p => p.id === selectedPlanId)
      if (plan) {
        title = plan.name
        details = plan.type
        planId = plan.id
      }
    } else if (addType === "supplements" && newEvent.title.trim()) {
      title = newEvent.title
      details = newEvent.details
    } else if (addType === "meal") {
      if (inputMode === "preset" && selectedDishId) {
        const dish = allDishes.find(d => d.id === selectedDishId)
        if (dish) {
          title = dish.name
          details = dish.subCategory || dish.mainCategory
          calories = dish.totalCalories || 0
          protein = dish.totalProtein || 0
          carbs = dish.totalCarbs || 0
          fats = dish.totalFats || 0
          fiber = dish.totalFiber || 0
          dishId = dish.id
        }
      } else if (inputMode === "custom" && newEvent.title.trim()) {
        title = newEvent.title
        details = newEvent.details
      }
    }

    if (!title) return

    const targetOwners = mealOwner === "both" ? ["patrycja", "marcin"] : [mealOwner]

    try {
      const getRecurringDates = (startDate: Date, daysOfWeek: number[], count: number): string[] => {
        const datesList: string[] = []
        let current = new Date(startDate)

        if (daysOfWeek.includes(current.getDay())) {
          datesList.push(current.toISOString().split('T')[0])
        }

        while (datesList.length < count) {
          current.setDate(current.getDate() + 1)
          if (daysOfWeek.includes(current.getDay())) {
            datesList.push(current.toISOString().split('T')[0])
          }
          if (daysOfWeek.length === 0 || datesList.length > 100) break
        }
        return datesList
      }

      const targetDates = (addType === "supplements" && isRecurring && selectedDays.length > 0)
        ? getRecurringDates(selectedDate, selectedDays, totalOccurrences)
        : [selectedDate.toISOString().split('T')[0]]

      let hasError = false

      for (const targetDateStr of targetDates) {
        for (const owner of targetOwners) {
          const detailsJson = JSON.stringify({
            owner,
            calories: addType === "meal" ? calories : undefined,
            protein: addType === "meal" ? protein : undefined,
            carbs: addType === "meal" ? carbs : undefined,
            fats: addType === "meal" ? fats : undefined,
            fiber: addType === "meal" ? fiber : undefined,
            dishId,
            planId,
            shared,
            type: addType,
          })

          if (addType === "meal") {
            const mealResult = await addMeal({
              date: targetDateStr,
              time: newEvent.time,
              name: title,
              details: JSON.stringify({ owner }),
              calories,
              protein,
              carbs,
              fats,
              fiber,
              logged: false,
            })
            if (mealResult?.error) {
              console.error("[planner] addMeal error:", mealResult.error)
              hasError = true
            }
          }

          const plannerResult = await addEvent({
            date: targetDateStr,
            name: title,
            time: newEvent.time,
            type: addType,
            details: detailsJson,
            shared_with_partner: shared,
            logged: false,
          })
          if (plannerResult?.error) {
            console.error("[planner] addEvent error:", plannerResult.error)
            hasError = true
          }
        }
      }

      if (hasError) {
        alert("Nie udało się zapisać wszystkich pozycji. Sprawdź konsolę.")
      } else {
        setNewEvent({ title: "", time: "12:00", details: "" })
        setSelectedDishId(null)
        setSelectedPlanId(null)
        setSelectedMainCategory(null)
        setSelectedSubCategory(null)
        setInputMode("preset")
        setMealOwner("patrycja")
        setIsRecurring(false)
        setSelectedDays([])
        setTotalOccurrences(4)
        setShowAddModal(false)
      }
    } catch (error) {
      console.error("Błąd podczas dodawania pozycji:", error)
      alert("Wystąpił błąd podczas zapisywania.")
    }
  }

  const getEventsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0]
    return plannerEvents
      .filter(e => {
        if (e.date !== dateStr) return false
        if (showBothCalendars) return true
        if (ownerFilter === "both") return true
        // Read owner from stored JSON details
        let eventOwner: "marcin" | "patrycja" = "patrycja"
        try {
          const parsed = e.details ? JSON.parse(e.details) : {}
          eventOwner = parsed.owner || eventOwner
        } catch { /* ignore */ }
        return eventOwner === activeUser
      })
      .sort((a, b) => a.time.localeCompare(b.time))
      .map(e => {
        // Read owner from stored JSON details
        let eventOwner: "marcin" | "patrycja" = "patrycja"
        let parsedDetails: Record<string, unknown> = {}
        try {
          parsedDetails = e.details ? JSON.parse(e.details) : {}
          eventOwner = (parsedDetails.owner as "marcin" | "patrycja") || eventOwner
        } catch { /* ignore */ }
        return {
          id: e.id,
          date: new Date(e.date + "T00:00:00"),
          title: e.name,
          time: e.time,
          type: e.type as EventType,
          details: e.details || undefined,
          owner: eventOwner,
          calories: parsedDetails.calories as number | undefined,
          protein: parsedDetails.protein as number | undefined,
          carbs: parsedDetails.carbs as number | undefined,
          fats: parsedDetails.fats as number | undefined,
          fiber: parsedDetails.fiber as number | undefined,
          dishId: parsedDetails.dishId as string | undefined,
          planId: parsedDetails.planId as string | undefined,
          sharedWithPartner: parsedDetails.shared as boolean | undefined,
        }
      })
  }

  const getEventColor = (type: EventType, owner: "marcin" | "patrycja") => {
    if (owner === "marcin") {
      switch (type) {
        case "training": return "bg-navy"
        case "meal": return "bg-navy/70"
        case "supplements": return "bg-navy/50"
        case "google": return "bg-navy"
      }
    } else {
      switch (type) {
        case "training": return "bg-sage"
        case "meal": return "bg-sage/70"
        case "supplements": return "bg-sage/50"
        case "google": return "bg-emerald-900"
      }
    }
  }

  const getEventIcon = (type: EventType) => {
    switch (type) {
      case "training": return <Dumbbell className="size-4" />
      case "meal": return <UtensilsCrossed className="size-4" />
      case "supplements": return <Pill className="size-4" />
      case "google": return <Calendar className="size-4" />
    }
  }

  const filteredPlans = useMemo(() => {
    return allPlans.filter(p => p.type === workoutTypeFilter)
  }, [allPlans, workoutTypeFilter])

  return (
    <div className="flex flex-col gap-4">
      {/* View Mode Toggle */}
      <div className="flex gap-2 p-1 bg-card border border-border rounded-xl">
        {(["today", "3day", "week"] as CalendarViewMode[]).map((mode) => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
              viewMode === mode
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {mode === "today" ? "Today" : mode === "3day" ? "3 Days" : "Week"}
          </button>
        ))}
      </div>

      {/* Calendar View Toggle */}
      <div className="flex gap-1 p-1 bg-card border border-border rounded-xl">
        <button
          onClick={() => {
            setShowBothCalendars(false)
            setActiveUser("patrycja")
            setOwnerFilter("patrycja")
          }}
          className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
            !showBothCalendars && activeUser === "patrycja"
              ? "bg-sage text-background"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {profile?.name || "Patrycja"}
        </button>
        <button
          onClick={() => {
            setShowBothCalendars(false)
            setActiveUser("marcin")
            setOwnerFilter("marcin")
          }}
          className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
            !showBothCalendars && activeUser === "marcin"
              ? "bg-navy text-background"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {partner?.name || "Marcin"}
        </button>
        <button
          onClick={() => {
            setShowBothCalendars(true)
            setOwnerFilter("both")
          }}
          className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
            showBothCalendars
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Both
        </button>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate("prev")}
          className="p-2 rounded-lg hover:bg-secondary transition-colors"
        >
          <ChevronLeft className="size-5 text-muted-foreground" />
        </button>
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-foreground">
            {viewMode === "today"
              ? formatDate(baseDate)
              : `${formatDate(dates[0])} - ${formatDate(dates[dates.length - 1])}`
          }
          </h3>
          {!isSameDay(baseDate, today) && (
            <button
              onClick={goToToday}
              className="text-xs text-primary hover:underline"
            >
              Today
            </button>
          )}
        </div>
        <button
          onClick={() => navigate("next")}
          className="p-2 rounded-lg hover:bg-secondary transition-colors"
        >
          <ChevronRight className="size-5 text-muted-foreground" />
        </button>
      </div>

      {/* Calendar Grid */}
      <div className={`grid gap-3 ${viewMode === "week" ? "grid-cols-7" : viewMode === "3day" ? "grid-cols-3" : "grid-cols-1"}`}>
        {dates.map((date) => {
          const dayEvents = getEventsForDate(date)
          const isToday = isSameDay(date, today)
          const dateKey = date.toISOString()

          return (
            <div
              key={dateKey}
              className={`bg-card rounded-2xl border overflow-hidden ${isToday ? "border-primary" : "border-border"}`}
            >
              {/* Date Header */}
              <div className={`p-3 border-b border-border ${isToday ? "bg-primary/10" : ""}`}>
                <p className={`text-xs ${isToday ? "text-primary font-semibold" : "text-muted-foreground"}`}>
                  {date.toLocaleDateString('en-US', { weekday: 'short' })}
                </p>
                <p className={`text-lg font-bold ${isToday ? "text-primary" : "text-foreground"}`}>
                  {date.getDate()}
                </p>
              </div>

              {/* Macro Progress Summary */}
              <MacroSummary
                date={date}
                ownerFilter={ownerFilter}
                settings={settings}
                partner={partner}
                plannerEvents={plannerEvents}
              />
              
              {/* Events - Grouped by time slot */}
                      <div className={`p-2 flex flex-col gap-1.5 ${viewMode === "week" ? "min-h-[120px]" : "min-h-[80px]"}`}>
                        {dayEvents.length === 0 ? (
                          <p className="text-xs text-muted-foreground text-center py-4">No events</p>
                        ) : (
                          (() => {
                            // Group events by time slot
                            const grouped = new Map<string, PlannerEventLocal[]>()
                            dayEvents.forEach(event => {
                              const timeKey = event.time
                              if (!grouped.has(timeKey)) grouped.set(timeKey, [])
                              grouped.get(timeKey)!.push(event)
                            })
                            const timeSlots = Array.from(grouped.keys()).sort()
                            return timeSlots.map(time => {
                              const events = grouped.get(time)!
                              const isMulti = events.length > 1
                              return (
                                <div key={time} className={isMulti ? "flex gap-1" : ""}>
                                  {events.map(event => (
                                    <div
                                      key={event.id}
                                      onClick={() => {
                                        setSelectedEventForMenu(event.id)
                                        setMenuPosition({ x: 0, y: 0 })
                                        setShowEventMenu(true)
                                      }}
                                      className={`rounded-lg p-2 text-white cursor-pointer active:scale-[0.98] transition-transform ${isMulti ? 'flex-1' : ''} ${getEventColor(event.type, event.owner)}`}
                                    >
                                      <div className="flex items-center gap-1.5">
                                        {getEventIcon(event.type)}
                                        <span className={`font-medium truncate ${viewMode === "week" ? "text-[10px]" : "text-xs"}`}>
                                          {event.title}
                                        </span>
                                      </div>
                                      <div className="flex items-center justify-between mt-0.5">
                                        <div className="flex items-center gap-1.5">
                                          <p className={`opacity-80 ${viewMode === "week" ? "text-[9px]" : "text-[10px]"}`}>
                                            {event.time}
                                          </p>
                                          {event.type === "meal" && event.calories !== undefined && event.calories > 0 && (
                                            <span className={`opacity-70 ${viewMode === "week" ? "text-[8px]" : "text-[9px]"}`}>
                                              {Math.round(event.calories)} kcal · {Math.round(event.protein || 0)}g P
                                            </span>
                                          )}
                                        </div>
                                        {showBothCalendars && (
                                          <span className={`opacity-70 ${viewMode === "week" ? "text-[8px]" : "text-[9px]"}`}>
                                            {event.owner === "marcin" ? "M" : "P"}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )
                            })
                          })()
                        )}
                      </div>

                      {/* TRZY PRZYCISKI Z PLUSAMI I IKONAMI */}
                      <div className="mt-auto p-2 border-t border-border flex justify-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedDate(date)
                            setAddType("meal")
                            setShowAddModal(true)
                          }}
                          title="Dodaj posiłek"
                          className="py-1.5 px-2.5 rounded-full border border-input bg-background hover:bg-accent hover:text-accent-foreground text-muted-foreground transition-all shadow-sm flex items-center justify-center gap-0.5"
                        >
                          <span className="text-xs font-light text-muted-foreground/80">+</span>
                          <UtensilsCrossed className="size-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedDate(date)
                            setAddType("training")
                            setShowAddModal(true)
                          }}
                          title="Dodaj trening"
                          className="py-1.5 px-2.5 rounded-full border border-input bg-background hover:bg-accent hover:text-accent-foreground text-muted-foreground transition-all shadow-sm flex items-center justify-center gap-0.5"
                        >
                          <span className="text-xs font-light text-muted-foreground/80">+</span>
                          <Dumbbell className="size-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedDate(date)
                            setAddType("supplements")
                            setShowAddModal(true)
                          }}
                          title="Dodaj suplementy"
                          className="py-1.5 px-2.5 rounded-full border border-input bg-background hover:bg-accent hover:text-accent-foreground text-muted-foreground transition-all shadow-sm flex items-center justify-center gap-0.5"
                        >
                          <span className="text-xs font-light text-muted-foreground/80">+</span>
                          <Pill className="size-3.5" />
                        </button>
                      </div>

                    </div>
                  )
                })}
              </div>
      
      {/* Google Calendar Sync */}
      <div className="bg-card rounded-2xl p-4 border border-border">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-navy/20 flex items-center justify-center">
            <svg className="size-5" viewBox="0 0 24 24" fill="none">
              <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" fill="#4285F4" />
              <path d="M12 6v6l4 2" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">Google Calendar</p>
            <p className="text-xs text-muted-foreground">
              {googleConnected ? "View-only sync enabled" : "Connect to see your events"}
            </p>
          </div>
          <button
            onClick={() => setGoogleConnected(!googleConnected)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              googleConnected
                ? "bg-sage/20 text-sage"
                : "bg-primary text-primary-foreground"
            }`}
          >
            {googleConnected ? "Connected" : "Connect"}
          </button>
        </div>
        {googleConnected && (
          <div className="mt-3 pt-3 border-t border-border flex items-center gap-2 text-xs text-muted-foreground">
            <ExternalLink className="size-3" />
            <span>Events from Google Calendar appear in blue</span>
          </div>
        )}
      </div>

      {/* Event Action Menu */}
      {showEventMenu && selectedEventForMenu && (
        <div
          className="fixed inset-0 bg-black/30 z-[60]"
          onClick={() => setShowEventMenu(false)}
        >
          <div className="absolute bottom-0 left-0 right-0 p-4 pb-24 z-[70]">
            <div
              className="bg-card rounded-2xl shadow-xl border border-border overflow-hidden max-w-md mx-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {(() => {
                const event = plannerEvents.find((e) => e.id === selectedEventForMenu)
                if (!event) return null
                const isMeal = event.type === "meal"
                return (
                  <div className="flex flex-col">
                    <div className="px-4 py-3 border-b border-border">
                      <p className="text-sm font-semibold">{event.name}</p>
                      <p className="text-xs text-muted-foreground">{event.time} · {event.type}</p>
                    </div>
                    {isMeal && (
                      <button
                        onClick={() => {
                          setShowEventMenu(false)
                          setShowSwapDishModal(true)
                        }}
                        className="flex items-center gap-3 px-4 py-3 text-sm text-foreground hover:bg-secondary transition-colors"
                      >
                        <RefreshCw className="size-4 text-amber-500" />
                        <span>Zamień danie</span>
                      </button>
                    )}
                    {isMeal && (
                      <button
                        onClick={() => {
                          setShowEventMenu(false)
                          if (onKitchenEditDish) onKitchenEditDish()
                        }}
                        className="flex items-center gap-3 px-4 py-3 text-sm text-foreground hover:bg-secondary transition-colors"
                      >
                        <Edit className="size-4 text-sky-500" />
                        <span>Edytuj w kuchni</span>
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setShowEventMenu(false)
                        deleteEvent(selectedEventForMenu)
                          .then(() => setShowEventMenu(false))
                          .catch(() => {
                            alert("Nie udało się usunąć wydarzenia. Spróbuj ponownie.")
                          })
                      }}
                      className="flex items-center gap-3 px-4 py-3 text-sm text-destructive hover:bg-secondary transition-colors"
                    >
                      <Trash2 className="size-4 text-destructive" />
                      <span>Usuń</span>
                    </button>
                    <button
                      onClick={() => setShowEventMenu(false)}
                      className="flex items-center gap-3 px-4 py-3 text-sm text-muted-foreground hover:bg-secondary transition-colors border-t border-border"
                    >
                      <X className="size-4" />
                      <span>Anuluj</span>
                    </button>
                  </div>
                )
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Swap Dish Modal */}
      {showSwapDishModal && selectedEventForMenu && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-end justify-center p-4 pb-24">
          <div className="bg-card rounded-2xl w-full max-w-md overflow-hidden max-h-[80vh] flex flex-col">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h3 className="text-lg font-semibold">Zamień danie</h3>
              <button onClick={() => setShowSwapDishModal(false)} className="p-1 rounded-lg hover:bg-secondary">
                <X className="size-4 text-muted-foreground" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-2">
                {allDishes.map((dish) => (
                  <button
                    key={dish.id}
                    onClick={() => {
                      const event = plannerEvents.find((e) => e.id === selectedEventForMenu)
                      if (!event) return
                      const owner = (event.details?.owner as "marcin" | "patrycja" | "both") || "patrycja"
                      const dOwner = owner === "both" ? "patrycja" : owner
                      const ratio = owner === "both" ? 1 : 1
                      const marcinPer = dish.perMarcin || dish.perServing
                      const patrycjaPer = dish.perPatrycja || dish.perServing
                      const dServing = dOwner === "marcin" ? marcinPer : patrycjaPer
                      const calories = dServing?.calories ?? 0
                      const protein = dServing?.protein ?? 0
                      const carbs = dServing?.carbs ?? 0
                      const fats = dServing?.fats ?? 0
                      const newDetails = {
                        owner,
                        calories: Math.round(calories),
                        protein: Math.round(protein),
                        carbs: Math.round(carbs),
                        fats: Math.round(fats),
                        dishId: dish.id,
                        servingRatio: ratio,
                        marcin: marcinPer || null,
                        patrycja: patrycjaPer || null,
                        sharedWithPartner: owner === "both",
                        auto: true,
                      }
                      updateEvent(selectedEventForMenu, {
                        name: dish.name,
                        details: newDetails,
                      }).then(() => {
                        setShowSwapDishModal(false)
                        setSelectedEventForMenu(null)
                      })
                    }}
                    className="w-full text-left p-3 rounded-xl border border-border hover:bg-secondary transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{dish.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {dish.perServing?.calories ?? dish.perMarcin?.calories ?? 0} kcal
                      </span>
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-1">
                      P:{dish.perServing?.protein ?? dish.perMarcin?.protein ?? 0}g ·
                      C:{dish.perServing?.carbs ?? dish.perMarcin?.carbs ?? 0}g ·
                      F:{dish.perServing?.fats ?? dish.perMarcin?.fats ?? 0}g
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Event Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50 p-4 pb-24">
          <div className="bg-card rounded-2xl w-full max-w-md overflow-hidden max-h-[80vh] flex flex-col">

            {/* Modal Header */}
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                {addType === "meal" ? (
                  <div className="size-8 rounded-lg bg-sage/20 flex items-center justify-center">
                    <UtensilsCrossed className="size-4 text-sage" />
                  </div>
                ) : addType === "training" ? (
                  <div className="size-8 rounded-lg bg-primary/20 flex items-center justify-center">
                    <Dumbbell className="size-4 text-primary" />
                  </div>
                ) : (
                  <div className="size-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                    <Pill className="size-4 text-amber-600" />
                  </div>
                )}
                <div>
                  <h3 className="font-semibold text-foreground font-sans text-sm">
                    {addType === "meal" ? "Dodaj posiłek" : addType === "training" ? "Dodaj trening" : "Dodaj suplement"}
                  </h3>
                  <p className="text-xs text-muted-foreground font-mono">{formatDate(selectedDate)}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg hover:bg-secondary"
              >
                <X className="size-5 text-muted-foreground" />
              </button>
            </div>

            {/* Modal Body Container */}
            <div className="p-4 flex flex-col gap-4 overflow-y-auto">

              {/* Type Switcher */}
              <div className="flex gap-1.5 p-1 bg-secondary rounded-xl text-xs">
                {(["meal", "training", "supplements"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setAddType(t)}
                    className={`flex-1 py-1.5 rounded-lg font-medium transition-all capitalize ${
                      addType === t ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              {/* For meals: Preset / Custom Toggle */}
              {addType === "meal" && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setInputMode("preset")
                      setNewEvent({ ...newEvent, title: "", details: "" })
                    }}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                      inputMode === "preset"
                        ? "bg-secondary text-foreground border border-primary/50"
                        : "bg-secondary/50 text-muted-foreground border border-transparent"
                    }`}
                  >
                    Select Dish
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setInputMode("custom")
                      setSelectedDishId(null)
                      setSelectedMainCategory(null)
                      setSelectedSubCategory(null)
                    }}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                      inputMode === "custom"
                        ? "bg-secondary text-foreground border border-primary/50"
                        : "bg-secondary/50 text-muted-foreground border border-transparent"
                    }`}
                  >
                    Custom
                  </button>
                </div>
              )}

              {/* For training: Workout Type Filter */}
              {addType === "training" && (
                <div className="flex gap-2 p-1 bg-secondary rounded-xl">
                  {(["weights", "cardio", "flexibility"] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setWorkoutTypeFilter(type)}
                      className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all capitalize ${
                        workoutTypeFilter === type ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              )}

              {/* Owner Selection for all types */}
              <div className="flex gap-2 p-1 bg-secondary rounded-xl">
                <button
                  type="button"
                  onClick={() => setMealOwner("patrycja")}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                    mealOwner === "patrycja" ? "bg-sage text-background shadow-sm" : "text-muted-foreground"
                  }`}
                >
                  {profile?.name || "Patrycja"}
                </button>
                <button
                  type="button"
                  onClick={() => setMealOwner("marcin")}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                    mealOwner === "marcin" ? "bg-navy text-background shadow-sm" : "text-muted-foreground"
                  }`}
                >
                  {partner?.name || "Marcin"}
                </button>
                <button
                  type="button"
                  onClick={() => setMealOwner("both")}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                    mealOwner === "both" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground"
                  }`}
                >
                  Both
                </button>
              </div>

              {/* Sub-filters: Dish category for meals */}
              {addType === "meal" && inputMode === "preset" && (
                <div className="flex gap-1 p-1 bg-secondary/50 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setSelectedMainCategory(selectedMainCategory === "Large" ? null : "Large")}
                    className={`flex-1 py-1.5 rounded-md text-[10px] font-medium transition-all ${
                      selectedMainCategory === "Large" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                    }`}
                  >
                    Large
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedMainCategory(selectedMainCategory === "Light" ? null : "Light")}
                    className={`flex-1 py-1.5 rounded-md text-[10px] font-medium transition-all ${
                      selectedMainCategory === "Light" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                    }`}
                  >
                    Light
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedMainCategory(selectedMainCategory === "Snacks" ? null : "Snacks")}
                    className={`flex-1 py-1.5 rounded-md text-[10px] font-medium transition-all ${
                      selectedMainCategory === "Snacks" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                    }`}
                  >
                    Snacks
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedMainCategory(selectedMainCategory === "Drinks" ? null : "Drinks")}
                    className={`flex-1 py-1.5 rounded-md text-[10px] font-medium transition-all ${
                      selectedMainCategory === "Drinks" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                    }`}
                  >
                    Drinks
                  </button>
                </div>
              )}

              {/* Common Fields: Time selection */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-muted-foreground">Godzina</label>
                <input
                  type="time"
                  value={newEvent.time}
                  onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                  className="p-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:border-primary font-mono"
                />
              </div>

              {/* Dish Picker - Show all dishes immediately with optional filter */}
              {addType === "meal" && inputMode === "preset" && (
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col gap-1.5 max-h-[220px] overflow-y-auto pr-1">
                    {allDishes
                      .filter(d => selectedMainCategory ? d.mainCategory === selectedMainCategory : true)
                      .map((dish) => (
                        <button
                          key={dish.id}
                          type="button"
                          onClick={() => setSelectedDishId(dish.id)}
                          className={`p-2.5 rounded-xl text-left border text-xs font-medium transition-all ${
                            selectedDishId === dish.id
                              ? "bg-sage/20 border-sage text-foreground"
                              : "bg-secondary border-transparent hover:border-border text-muted-foreground"
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <span className="font-sans text-sm text-foreground">{dish.name}</span>
                            <span className="font-mono text-[11px] text-muted-foreground">{dish.totalCalories || 0} kcal</span>
                          </div>
                          <div className="text-[10px] text-muted-foreground mt-0.5">
                            {dish.mainCategory} · {dish.subCategory}
                          </div>
                        </button>
                      ))}
                    {allDishes.filter(d => selectedMainCategory ? d.mainCategory === selectedMainCategory : true).length === 0 && (
                      <p className="text-xs text-muted-foreground text-center py-4">Brak dań w tej kategorii</p>
                    )}
                  </div>
                </div>
              )}

              {/* Custom Meal Input / Supplement Input Fields */}
              {((addType === "meal" && inputMode === "custom") || addType === "supplements") && (
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Nazwa</label>
                    <input
                      type="text"
                      placeholder={addType === "meal" ? "np. Jajecznica" : "np. Kreatyna"}
                      value={newEvent.title}
                      onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                      className="p-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Szczegóły / Notatki</label>
                    <input
                      type="text"
                      placeholder="Opcjonalne uwagi"
                      value={newEvent.details}
                      onChange={(e) => setNewEvent({ ...newEvent, details: e.target.value })}
                      className="p-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>
              )}

              {/* Training Workout Picker */}
              {addType === "training" && (
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-medium text-muted-foreground">Wybierz plan treningowy</label>
                  <div className="flex flex-col gap-1.5 max-h-[200px] overflow-y-auto pr-1">
                    {filteredPlans.map((plan) => (
                      <button
                        key={plan.id}
                        type="button"
                        onClick={() => setSelectedPlanId(plan.id)}
                        className={`p-2.5 rounded-xl text-left border text-xs font-medium transition-all ${
                          selectedPlanId === plan.id
                            ? "bg-primary/10 border-primary text-foreground"
                            : "bg-secondary border-transparent hover:border-border text-muted-foreground"
                        }`}
                      >
                        {plan.name}
                      </button>
                    ))}
                    {filteredPlans.length === 0 && (
                      <p className="text-xs text-muted-foreground text-center py-4">Brak planów dla tego typu</p>
                    )}
                  </div>
                </div>
              )}

              {/* Supplements Recurring Selector */}
              {addType === "supplements" && (
                <div className="p-3 bg-secondary/50 border border-border rounded-xl space-y-3">
                  <label className="flex items-center gap-2 text-xs font-medium text-foreground cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isRecurring}
                      onChange={(e) => setIsRecurring(e.target.checked)}
                      className="rounded text-primary focus:ring-0"
                    />
                    Wpis cykliczny (powtarzalny)
                  </label>
                  {isRecurring && (
                    <div className="space-y-2 animate-in fade-in duration-100">
                      <p className="text-[11px] text-muted-foreground font-medium">Wybierz dni tygodnia:</p>
                      <div className="flex justify-between gap-1">
                        {["N", "Pn", "Wt", "Śr", "Cw", "Pt", "Sb"].map((dayName, idx) => {
                          const isSelected = selectedDays.includes(idx)
                          return (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => {
                                setSelectedDays(prev =>
                                  prev.includes(idx) ? prev.filter(d => d !== idx) : [...prev, idx]
                                )
                              }}
                              className={`w-9 h-9 rounded-lg text-xs font-semibold border transition-all ${
                                isSelected
                                  ? "bg-primary text-primary-foreground border-primary"
                                  : "bg-background border-border text-muted-foreground hover:border-muted"
                              }`}
                            >
                              {dayName}
                            </button>
                          )
                        })}
                      </div>
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[11px] text-muted-foreground">Liczba powtórzeń serii:</span>
                        <input
                          type="number"
                          min={1}
                          max={50}
                          value={totalOccurrences}
                          onChange={(e) => setTotalOccurrences(parseInt(e.target.value) || 4)}
                          className="w-16 p-1 text-center rounded border border-border bg-background text-xs font-mono text-foreground"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

            </div>

            {/* Modal Footer (Action Buttons) */}
            <div className="p-4 border-t border-border bg-secondary/30 flex gap-2">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-border bg-background text-sm font-medium text-muted-foreground hover:bg-secondary transition-colors"
              >
                Anuluj
              </button>
              <button
                type="button"
                onClick={handleAddEvent}
                className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
              >
                Zapisz
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  )
}

// Fallback ShoppingView component to ensure layout compatibility
function ShoppingView() {
  return (
    <div className="bg-card p-6 rounded-2xl border border-border text-center">
      <p className="text-sm text-muted-foreground font-medium">Shopping List content coming soon.</p>
    </div>
  )
}