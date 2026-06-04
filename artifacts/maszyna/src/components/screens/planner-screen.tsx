
import { useState, useMemo } from "react"
import { useAuth } from "@/lib/auth-context"
import { useDishes, useWorkoutPlans, usePlannerEvents, useMealLogs } from "@/lib/realtime-hooks"
import { Calendar, ShoppingCart, ChevronLeft, ChevronRight, Plus, Check, X, Dumbbell, UtensilsCrossed, ExternalLink, AlertTriangle, RefreshCw, ChevronDown, FileText } from "lucide-react"

// Re-export dishCategories for shopping view
const dishCategories: Record<string, string[]> = {
  "Large": ["Pasta & Rice", "Traditional", "Pancakes & Tortillas", "Salads & Veggies", "Fakeaways"],
  "Light": ["Eggs", "Sandwiches & Wraps", "Soups", "Sweet Bakes & Desserts", "Oats & Granola"],
  "Snacks": ["Savoury", "Sweet"],
  "Drinks": ["Shakes & Smoothies", "Cocktails & Mocktails", "Hot drinks", "Cold drinks"],
}

export { dishCategories }

type SubTab = "calendar" | "shopping"
type CalendarViewMode = "today" | "3day" | "week"
type EventType = "meal" | "training" | "google"

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
          Calendar
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
          Shopping List
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
    // Start from Monday of current week
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
          className={`h-full rounded-full ${color}`}
          style={{ width: `${pct}%`, transition: 'width 0.5s ease-out' }}
        />
      </div>
    </div>
  )
}

function MacroSummary({
  date,
  ownerFilter,
  settings,
  partner
}: {
  date: Date
  ownerFilter: OwnerFilter
  settings: { calorie_goal: number; protein_goal: number; carbs_goal: number; fats_goal: number } | null
  partner: { name: string; id: string } | null
}) {
  const dateStr = date.toISOString().split('T')[0]
  const { meals: mealLogs } = useMealLogs(dateStr)
  const { user, profile } = useAuth()

  const target = settings || {
    calorie_goal: 2000,
    protein_goal: 150,
    carbs_goal: 200,
    fats_goal: 65,
  }

  // Filter by owner filter (use user_id to determine owner)
  const filtered = mealLogs.filter(log => {
    if (ownerFilter === "both") return true
    const ownerName = log.user_id === user?.id
      ? (profile?.name?.toLowerCase().includes("marcin") ? "marcin" : "patrycja")
      : (partner?.name?.toLowerCase().includes("marcin") ? "marcin" : "patrycja")
    return ownerName === ownerFilter
  })

  const consumed = filtered.reduce(
    (acc, log) => ({
      calories: acc.calories + (log.calories || 0),
      protein: acc.protein + (log.protein || 0),
      carbs: acc.carbs + (log.carbs || 0),
      fats: acc.fats + (log.fats || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fats: 0 }
  )

  return (
    <div className="px-3 pb-3 pt-1 flex flex-col gap-2 border-b border-border">
      <div className="flex items-center gap-1.5">
        <div className="w-4 h-4 rounded-full border-2 border-sage flex items-center justify-center">
          <span className="text-[7px] font-bold text-sage">{Math.round((consumed.calories / target.calorie_goal) * 100)}%</span>
        </div>
        <span className="text-[10px] text-muted-foreground font-medium">{Math.round(consumed.calories)} kcal</span>
      </div>
      <MacroProgressBar label="Protein" value={consumed.protein} max={target.protein_goal} color="bg-amber-500" />
      <MacroProgressBar label="Carbs" value={consumed.carbs} max={target.carbs_goal} color="bg-emerald-500" />
      <MacroProgressBar label="Fats" value={consumed.fats} max={target.fats_goal} color="bg-rose-500" />
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
  const [addType, setAddType] = useState<"meal" | "training">("meal")
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [googleConnected, setGoogleConnected] = useState(false)
  const [ownerFilter, setOwnerFilter] = useState<OwnerFilter>("both")
  const [activeUser, setActiveUser] = useState<"marcin" | "patrycja">("patrycja")
  const [showBothCalendars, setShowBothCalendars] = useState(true)

  const [newEvent, setNewEvent] = useState({ title: "", time: "12:00", details: "" })
  const [inputMode, setInputMode] = useState<"preset" | "custom">("preset")
  const [selectedDishId, setSelectedDishId] = useState<string | null>(null)
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null)
  const [workoutTypeFilter, setWorkoutTypeFilter] = useState<"weights" | "cardio" | "flexibility">("weights")

  // Cascading dish selection state
  const [selectedMainCategory, setSelectedMainCategory] = useState<string | null>(null)
  const [selectedSubCategory, setSelectedSubCategory] = useState<string | null>(null)

  // Meal owner: "marcin" | "patrycja" | "both"
  const [mealOwner, setMealOwner] = useState<"marcin" | "patrycja" | "both">("patrycja")

  const dates = getDateRange(baseDate, viewMode)
  const today = new Date()

  // Planner events for the current date range
  const startDate = dates[0]?.toISOString().split('T')[0] || today.toISOString().split('T')[0]
  const endDate = dates[dates.length - 1]?.toISOString().split('T')[0] || today.toISOString().split('T')[0]

  // We use a date-agnostic query for planner events, then filter in memory
  const { events: plannerEvents, addEvent, deleteEvent } = usePlannerEvents()

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
    let title = ""
    let details = ""
    let calories: number | undefined
    let protein: number | undefined
    let carbs: number | undefined
    let fats: number | undefined
    let fiber: number | undefined
    let dishId: string | undefined
    let planId: string | undefined
    let shared = false

    if (addType === "training" && selectedPlanId) {
      const plan = allPlans.find(p => p.id === selectedPlanId)
      if (plan) {
        title = plan.name
        details = plan.type
        planId = plan.id
      }
    } else if (addType === "meal") {
      if (inputMode === "preset" && selectedDishId) {
        const dish = allDishes.find(d => d.id === selectedDishId)
        if (dish) {
          title = dish.name
          details = dish.subCategory || dish.mainCategory
          calories = dish.totalCalories
          protein = dish.totalProtein
          carbs = dish.totalCarbs
          fats = dish.totalFats
          fiber = dish.totalFiber
          dishId = dish.id
          shared = mealOwner === "both"
        }
      } else if (inputMode === "custom" && newEvent.title.trim()) {
        title = newEvent.title
        details = newEvent.details
      }
    }

    if (!title) return

    const dateStr = selectedDate.toISOString().split('T')[0]
    const owners = mealOwner === "both"
      ? ["marcin" as const, "patrycja" as const]
      : [mealOwner as "marcin" | "patrycja"]

    for (const owner of owners) {
      await addEvent({
        date: dateStr,
        name: title,
        title,
        time: newEvent.time,
        type: addType,
        details: details || undefined,
        owner,
        calories,
        protein,
        carbs,
        fats,
        fiber,
        dish_id: dishId,
        plan_id: planId,
        shared_with_partner: shared,
        logged: false,
      })
    }

    setNewEvent({ title: "", time: "12:00", details: "" })
    setSelectedDishId(null)
    setSelectedPlanId(null)
    setSelectedMainCategory(null)
    setSelectedSubCategory(null)
    setInputMode("preset")
    setMealOwner("patrycja")
    setShowAddModal(false)
  }

  const getEventsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0]
    return plannerEvents
      .filter(e => {
        if (e.date !== dateStr) return false
        if (showBothCalendars) return true
        if (ownerFilter === "both") return true
        return e.owner === activeUser
      })
      .sort((a, b) => a.time.localeCompare(b.time))
      .map(e => ({
        id: e.id,
        date: new Date(e.date + "T00:00:00"),
        title: e.title,
        time: e.time,
        type: e.type as EventType,
        details: e.details || undefined,
        owner: e.owner as "marcin" | "patrycja",
        calories: e.calories,
        protein: e.protein,
        carbs: e.carbs,
        fats: e.fats,
        fiber: e.fiber,
        dishId: e.dish_id || undefined,
        planId: e.plan_id || undefined,
        sharedWithPartner: e.shared_with_partner,
      }))
  }

  const getEventColor = (type: EventType, owner: "marcin" | "patrycja") => {
    if (owner === "marcin") {
      switch (type) {
        case "training": return "bg-navy"
        case "meal": return "bg-navy/70"
        case "google": return "bg-navy"
      }
    } else {
      switch (type) {
        case "training": return "bg-sage"
        case "meal": return "bg-sage/70"
        case "google": return "bg-emerald-900"
      }
    }
  }

  const getEventIcon = (type: EventType) => {
    switch (type) {
      case "training": return <Dumbbell className="size-4" />
      case "meal": return <UtensilsCrossed className="size-4" />
      case "google": return <Calendar className="size-4" />
    }
  }

  // Filtered dishes by cascading selection
  const filteredDishes = useMemo(() => {
    if (!selectedMainCategory) return []
    if (!selectedSubCategory) {
      return allDishes.filter(d => d.mainCategory === selectedMainCategory)
    }
    return allDishes.filter(d => d.mainCategory === selectedMainCategory && d.subCategory === selectedSubCategory)
  }, [allDishes, selectedMainCategory, selectedSubCategory])

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
          Me
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
          Marcin
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
              />

              {/* Events */}
              <div className={`p-2 flex flex-col gap-1.5 ${viewMode === "week" ? "min-h-[120px]" : "min-h-[80px]"}`}>
                {dayEvents.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">No events</p>
                ) : (
                  dayEvents.map((event) => (
                    <div
                      key={event.id}
                      className={`rounded-lg p-2 text-white ${getEventColor(event.type, event.owner)}`}
                    >
                      <div className="flex items-center gap-1.5">
                        {getEventIcon(event.type)}
                        <span className={`font-medium truncate ${viewMode === "week" ? "text-[10px]" : "text-xs"}`}>
                          {event.title}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className={`opacity-80 ${viewMode === "week" ? "text-[9px]" : "text-[10px]"}`}>
                          {event.time}
                        </p>
                        {showBothCalendars && (
                          <span className={`opacity-70 ${viewMode === "week" ? "text-[8px]" : "text-[9px]"}`}>
                            {event.owner === "marcin" ? "M" : "P"}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Add buttons */}
              <div className="flex border-t border-border">
                <button
                  onClick={() => {
                    setSelectedDate(date)
                    setAddType("meal")
                    setSelectedDishId(null)
                    setSelectedPlanId(null)
                    setSelectedMainCategory(null)
                    setSelectedSubCategory(null)
                    setInputMode("preset")
                    setMealOwner("patrycja")
                    setShowAddModal(true)
                  }}
                  className="flex-1 py-2 text-sage/80 hover:bg-sage/10 transition-colors flex items-center justify-center gap-1 border-r border-border"
                >
                  <Plus className="size-3" />
                  <UtensilsCrossed className="size-3.5" />
                </button>
                <button
                  onClick={() => {
                    setSelectedDate(date)
                    setAddType("training")
                    setSelectedDishId(null)
                    setSelectedPlanId(null)
                    setSelectedMainCategory(null)
                    setSelectedSubCategory(null)
                    setInputMode("preset")
                    setShowAddModal(true)
                  }}
                  className="flex-1 py-2 text-primary hover:bg-primary/10 transition-colors flex items-center justify-center gap-1"
                >
                  <Plus className="size-3" />
                  <Dumbbell className="size-3.5" />
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

      {/* Add Event Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50 p-4 pb-24">
          <div className="bg-card rounded-2xl w-full max-w-md overflow-hidden max-h-[80vh] flex flex-col">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                {addType === "meal" ? (
                  <div className="size-8 rounded-lg bg-sage/20 flex items-center justify-center">
                    <UtensilsCrossed className="size-4 text-sage" />
                  </div>
                ) : (
                  <div className="size-8 rounded-lg bg-primary/20 flex items-center justify-center">
                    <Dumbbell className="size-4 text-primary" />
                  </div>
                )}
                <div>
                  <h3 className="font-semibold text-foreground">
                    Add {addType === "meal" ? "Meal" : "Training"}
                  </h3>
                  <p className="text-xs text-muted-foreground">{formatDate(selectedDate)}</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg hover:bg-secondary"
              >
                <X className="size-5 text-muted-foreground" />
              </button>
            </div>

            <div className="p-4 flex flex-col gap-4 overflow-y-auto">
              {/* For meals: Preset / Custom Toggle */}
              {addType === "meal" && (
                <div className="flex gap-2">
                  <button
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
                  <button
                    onClick={() => setWorkoutTypeFilter("weights")}
                    className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                      workoutTypeFilter === "weights"
                        ? "bg-card text-foreground shadow-sm"
                        : "text-muted-foreground"
                    }`}
                  >
                    Weights
                  </button>
                  <button
                    onClick={() => setWorkoutTypeFilter("cardio")}
                    className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                      workoutTypeFilter === "cardio"
                        ? "bg-card text-foreground shadow-sm"
                        : "text-muted-foreground"
                    }`}
                  >
                    Cardio
                  </button>
                  <button
                    onClick={() => setWorkoutTypeFilter("flexibility")}
                    className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                      workoutTypeFilter === "flexibility"
                        ? "bg-card text-foreground shadow-sm"
                        : "text-muted-foreground"
                    }`}
                  >
                    Flexibility
                  </button>
                </div>
              )}

              {/* Meal Owner Selection (for meals) */}
              {addType === "meal" && (
                <div className="flex gap-2 p-1 bg-secondary rounded-xl">
                  <button
                    onClick={() => setMealOwner("patrycja")}
                    className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                      mealOwner === "patrycja"
                        ? "bg-sage text-background shadow-sm"
                        : "text-muted-foreground"
                    }`}
                  >
                    Patrycja
                  </button>
                  <button
                    onClick={() => setMealOwner("marcin")}
                    className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                      mealOwner === "marcin"
                        ? "bg-navy text-background shadow-sm"
                        : "text-muted-foreground"
                    }`}
                  >
                    Marcin
                  </button>
                  <button
                    onClick={() => setMealOwner("both")}
                    className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                      mealOwner === "both"
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground"
                    }`}
                  >
                    Both
                  </button>
                </div>
              )}

              {/* Meal Preset: Cascading Selection */}
              {addType === "meal" && inputMode === "preset" && (
                <div className="flex flex-col gap-3">
                  {/* Step 1: Main Category */}
                  {!selectedMainCategory && (
                    <div className="flex flex-col gap-2">
                      <p className="text-xs font-medium text-muted-foreground">1. Select category</p>
                      <div className="flex flex-col gap-1.5">
                        {Object.keys(dishCategories).map((cat) => (
                          <button
                            key={cat}
                            onClick={() => {
                              setSelectedMainCategory(cat)
                              setSelectedSubCategory(null)
                              setSelectedDishId(null)
                            }}
                            className="p-2.5 rounded-xl text-left bg-secondary border border-transparent hover:border-border text-sm font-medium text-foreground transition-all"
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Step 2: Sub Category */}
                  {selectedMainCategory && !selectedSubCategory && (
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedMainCategory(null)
                            setSelectedSubCategory(null)
                            setSelectedDishId(null)
                          }}
                          className="text-xs text-muted-foreground hover:text-foreground"
                        >
                          &larr; Back to categories
                        </button>
                      </div>
                      <p className="text-xs font-medium text-muted-foreground">
                        2. Select subcategory ({selectedMainCategory})
                      </p>
                      <div className="flex flex-col gap-1.5">
                        {dishCategories[selectedMainCategory]?.map((sub) => (
                          <button
                            key={sub}
                            onClick={() => {
                              setSelectedSubCategory(sub)
                              setSelectedDishId(null)
                            }}
                            className="p-2.5 rounded-xl text-left bg-secondary border border-transparent hover:border-border text-sm font-medium text-foreground transition-all"
                          >
                            {sub}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Step 3: Dish List */}
                  {selectedMainCategory && selectedSubCategory && (
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedSubCategory(null)
                            setSelectedDishId(null)
                          }}
                          className="text-xs text-muted-foreground hover:text-foreground"
                        >
                          &larr; Back to subcategories
                        </button>
                      </div>
                      <p className="text-xs font-medium text-muted-foreground">
                        3. Select dish ({selectedSubCategory})
                      </p>
                      <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto">
                        {filteredDishes.length === 0 ? (
                          <p className="text-xs text-muted-foreground text-center py-4">No dishes in this category</p>
                        ) : (
                          filteredDishes.map((dish) => (
                            <button
                              key={dish.id}
                              onClick={() => setSelectedDishId(dish.id)}
                              className={`p-3 rounded-xl text-left transition-all ${
                                selectedDishId === dish.id
                                  ? "bg-sage/20 border border-sage"
                                  : "bg-secondary border border-transparent hover:border-border"
                              }`}
                            >
                              <p className="text-sm font-medium text-foreground">{dish.name}</p>
                              <p className="text-[10px] text-muted-foreground mt-0.5">
                                {Math.round(dish.totalCalories)} kcal | P {Math.round(dish.totalProtein)}g | C {Math.round(dish.totalCarbs)}g | F {Math.round(dish.totalFats)}g
                              </p>
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Workout Preset Selection (filtered by type) */}
              {addType === "training" && (
                <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
                  {filteredPlans.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-4">No plans in this category</p>
                  ) : (
                    filteredPlans.map((plan) => (
                      <button
                        key={plan.id}
                        onClick={() => setSelectedPlanId(plan.id)}
                        className={`p-3 rounded-xl text-left transition-all ${
                          selectedPlanId === plan.id
                            ? "bg-primary/20 border border-primary"
                            : "bg-secondary border border-transparent hover:border-border"
                        }`}
                      >
                        <p className="text-sm font-medium text-foreground">
                          {plan.name}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5 capitalize">
                          {plan.type}
                        </p>
                      </button>
                    ))
                  )}
                </div>
              )}

              {/* Custom Input (meals only) */}
              {addType === "meal" && inputMode === "custom" && (
                <>
                  <input
                    type="text"
                    placeholder="e.g. Homemade pasta, Restaurant dinner..."
                    value={newEvent.title}
                    onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                    className="bg-secondary rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                  <textarea
                    placeholder="Optional notes..."
                    value={newEvent.details}
                    onChange={(e) => setNewEvent({ ...newEvent, details: e.target.value })}
                    rows={2}
                    className="bg-secondary rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                  />
                </>
              )}

              {/* Time */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Time:</span>
                <input
                  type="time"
                  value={newEvent.time}
                  onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                  className="flex-1 bg-secondary rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              {/* Add Button */}
              <button
                onClick={handleAddEvent}
                disabled={
                  addType === "meal"
                    ? inputMode === "preset"
                      ? !selectedDishId
                      : !newEvent.title.trim()
                    : !selectedPlanId
                }
                className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-medium disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] transition-transform"
              >
                Add {addType === "meal" ? "Meal" : "Training"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ShoppingView() {
  interface ShoppingItem {
    id: string
    name: string
    amount: string
    note: string
    checked: boolean
    category: string
    source?: string // "manual" | dish/component name
  }

  const [items, setItems] = useState<ShoppingItem[]>([
    { id: "1", name: "Chicken breast", amount: "1.5kg", note: "", checked: false, category: "Protein", source: "Lunch Bowl" },
    { id: "2", name: "Greek yogurt", amount: "1kg", note: "Low fat preferred", checked: true, category: "Dairy", source: "Protein Shake" },
    { id: "3", name: "Eggs", amount: "30 pcs", note: "", checked: false, category: "Protein", source: "Power Breakfast" },
    { id: "4", name: "Broccoli", amount: "500g", note: "", checked: false, category: "Vegetables", source: "Lunch Bowl" },
    { id: "5", name: "Oats", amount: "1kg", note: "Steel cut", checked: false, category: "Carbs", source: "Power Breakfast" },
  ])

  const [newItemName, setNewItemName] = useState("")
  const [newItemAmount, setNewItemAmount] = useState("")
  const [newItemNote, setNewItemNote] = useState("")
  const [showAddForm, setShowAddForm] = useState(false)
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null)
  const [plannerChanged, setPlannerChanged] = useState(true) // Simulated planner change warning
  const [showImportModal, setShowImportModal] = useState(false)
  const [showRecipeModal, setShowRecipeModal] = useState(false)
  const [showBatchReview, setShowBatchReview] = useState(false)
  const [batchCounts, setBatchCounts] = useState<Record<string, number>>({})
  const [importMode, setImportMode] = useState<"days" | "dishes">("days")
  const [recipeTab, setRecipeTab] = useState<"dishes" | "components">("dishes")
  const [recipeSearch, setRecipeSearch] = useState("")
  const [selectedDays, setSelectedDays] = useState<number[]>([])
  const [selectedDishes, setSelectedDishes] = useState<string[]>([])

  // Import options (empty until user creates dishes)
  const upcomingDays: { day: number; label: string; meals: string[] }[] = []

  const dishesAndComponents: { id: string; name: string; type: string; category?: string; subCategory?: string; ingredients: string[]; marcinServings: number; patrycjaServings: number }[] = []

  const dishCategoryOptions = ["All", "Large", "Light", "Snacks", "Drinks"]
  const [selectedDishCategory, setSelectedDishCategory] = useState("All")

  const filteredRecipes = dishesAndComponents.filter(item => {
    const matchesTab = recipeTab === "dishes" ? item.type === "dish" : item.type === "component"
    const matchesSearch = item.name.toLowerCase().includes(recipeSearch.toLowerCase())
    const matchesCategory = recipeTab === "components" || selectedDishCategory === "All" || item.category === selectedDishCategory
    return matchesTab && matchesSearch && matchesCategory
  })

  const categories = [...new Set(items.map((item) => item.category))]

  // Calculate meal occurrences for batch review
  const getMealOccurrences = () => {
    const occurrences: Record<string, { count: number; dish: typeof dishesAndComponents[0] }> = {}
    
    selectedDays.forEach(dayIndex => {
      const day = upcomingDays[dayIndex]
      day.meals.forEach(mealName => {
        const dish = dishesAndComponents.find(d => d.name === mealName)
        if (dish) {
          if (!occurrences[dish.id]) {
            occurrences[dish.id] = { count: 0, dish }
          }
          occurrences[dish.id].count++
        }
      })
    })
    
    return occurrences
  }

  const initializeBatchReview = () => {
    const occurrences = getMealOccurrences()
    const initialBatches: Record<string, number> = {}
    
    Object.entries(occurrences).forEach(([dishId, { count, dish }]) => {
      const totalServings = (dish.marcinServings || 1) + (dish.patrycjaServings || 1)
      // Suggest batches: ceil(occurrences / totalServings), minimum 1
      initialBatches[dishId] = Math.max(1, Math.ceil(count / totalServings))
    })
    
    setBatchCounts(initialBatches)
    setShowImportModal(false)
    setShowBatchReview(true)
  }

  const toggleCheck = (id: string) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, checked: !item.checked } : item
    ))
  }

  const deleteItem = (id: string) => {
    setItems(items.filter(item => item.id !== id))
  }

  const addItem = () => {
    if (!newItemName.trim()) return
    const newItem: ShoppingItem = {
      id: Date.now().toString(),
      name: newItemName,
      amount: newItemAmount || "—",
      note: newItemNote,
      checked: false,
      category: "Other",
      source: "manual"
    }
    setItems([...items, newItem])
    setNewItemName("")
    setNewItemAmount("")
    setNewItemNote("")
    setShowAddForm(false)
  }

  const updateItemNote = (id: string, note: string) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, note } : item
    ))
  }

  const updateItemAmount = (id: string, amount: string) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, amount } : item
    ))
  }

  const importFromPlanner = () => {
    // Import ingredients based on batch counts
    const newItems: ShoppingItem[] = []
    const ingredientAmounts: Record<string, number> = {}
    
    // Calculate ingredient quantities based on batches
    Object.entries(batchCounts).forEach(([dishId, batches]) => {
      const dish = dishesAndComponents.find(d => d.id === dishId)
      if (dish && batches > 0) {
        dish.ingredients.forEach(ing => {
          if (!ingredientAmounts[ing]) {
            ingredientAmounts[ing] = 0
          }
          ingredientAmounts[ing] += batches
        })
      }
    })

    // Create shopping items from aggregated ingredients
    Object.entries(ingredientAmounts).forEach(([ing, batches]) => {
      const manualItems = items.filter(i => i.source === "manual")
      if (!manualItems.some(i => i.name.toLowerCase() === ing.toLowerCase())) {
        newItems.push({
          id: Date.now().toString() + Math.random(),
          name: ing,
          amount: batches > 1 ? `${batches}x` : "—",
          note: "",
          checked: false,
          category: "Imported",
          source: "planner"
        })
      }
    })

    // Keep all manual items, only update planner-sourced items
    const manualItems = items.filter(i => i.source === "manual")
    
    setItems([...manualItems, ...newItems])
    setShowBatchReview(false)
    setShowImportModal(false)
    setSelectedDays([])
    setBatchCounts({})
    setPlannerChanged(false)
  }

  const importFromRecipe = () => {
    // Import from specific dishes/components (no batch review needed)
    const newItems: ShoppingItem[] = []
    
    selectedDishes.forEach(dishId => {
      const dish = dishesAndComponents.find(d => d.id === dishId)
      if (dish) {
        dish.ingredients.forEach(ing => {
          const manualItems = items.filter(i => i.source === "manual")
          if (!manualItems.some(i => i.name.toLowerCase() === ing.toLowerCase()) && 
              !newItems.some(i => i.name.toLowerCase() === ing.toLowerCase())) {
            newItems.push({
              id: Date.now().toString() + Math.random(),
              name: ing,
              amount: "—",
              note: "",
              checked: false,
              category: "Imported",
              source: dish.name
            })
          }
        })
      }
    })

    const manualItems = items.filter(i => i.source === "manual")
    setItems([...manualItems, ...newItems])
    setShowRecipeModal(false)
    setSelectedDishes([])
  }

  return (
    <div className="flex flex-col gap-4 pb-24">
      {/* Quick Add Input */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          placeholder="Add item..."
          value={newItemName}
          onChange={(e) => setNewItemName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && newItemName.trim()) {
              addItem()
            }
          }}
          className="flex-1 bg-card rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground border border-border focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
        <button
          onClick={addItem}
          disabled={!newItemName.trim()}
          className="size-12 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shrink-0 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition-transform"
        >
          <Plus className="size-5" />
        </button>
      </div>

      {/* Import Buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => {
            setImportMode("days")
            setShowImportModal(true)
          }}
          className="flex-1 py-3 rounded-xl bg-card border border-border text-foreground text-sm font-medium flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
        >
          <Calendar className="size-4" />
          From Planner
        </button>
        <button
          onClick={() => {
            setShowRecipeModal(true)
          }}
          className="flex-1 py-3 rounded-xl bg-card border border-border text-foreground text-sm font-medium flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
        >
          <FileText className="size-4" />
          From Recipe
        </button>
      </div>

      {/* Planner Changed Warning */}
      {plannerChanged && items.some(i => i.source !== "manual") && (
        <div className="bg-wheat/10 border border-wheat/30 rounded-xl p-3 flex items-center gap-3">
          <AlertTriangle className="size-5 text-wheat shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-foreground font-medium">Planner has been edited</p>
            <p className="text-xs text-muted-foreground">Update planner items? Manual items won&apos;t change.</p>
          </div>
          <button
            onClick={() => {
              setImportMode("days")
              setShowImportModal(true)
            }}
            className="px-3 py-1.5 rounded-lg bg-wheat text-foreground text-xs font-medium flex items-center gap-1"
          >
            <RefreshCw className="size-3" />
            Update
          </button>
          <button
            onClick={() => setPlannerChanged(false)}
            className="p-1 hover:bg-secondary rounded"
          >
            <X className="size-4 text-muted-foreground" />
          </button>
        </div>
      )}

      {/* Shopping List */}
      <div className="flex flex-col gap-4">
        {categories.length === 0 ? (
          <div className="bg-card rounded-2xl border border-border p-8 text-center">
            <ShoppingCart className="size-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Your shopping list is empty</p>
          </div>
        ) : (
          categories.map((category) => (
            <div key={category}>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                {category}
              </h4>
              <div className="bg-card rounded-2xl border border-border overflow-hidden divide-y divide-border">
                {items
                  .filter((item) => item.category === category)
                  .map((item) => (
                    <div key={item.id}>
                      <div
                        className="flex items-center gap-3 p-4 cursor-pointer"
                        onClick={() => setExpandedItemId(expandedItemId === item.id ? null : item.id)}
                      >
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleCheck(item.id)
                          }}
                          className={`size-6 rounded-full border-2 flex items-center justify-center transition-colors shrink-0 ${
                            item.checked
                              ? "bg-primary border-primary"
                              : "border-muted-foreground"
                          }`}
                        >
                          {item.checked && <Check className="size-3 text-primary-foreground" />}
                        </button>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className={`text-sm ${item.checked ? "text-muted-foreground line-through" : "text-foreground"}`}>
                              {item.name}
                            </span>
                            {item.source && item.source !== "manual" && (
                              <span className="px-1.5 py-0.5 rounded bg-primary/20 text-primary text-[9px] font-medium shrink-0">
                                PLANNER
                              </span>
                            )}
                          </div>
                          {item.source && item.source !== "manual" && (
                            <p className="text-[10px] text-muted-foreground truncate">from {item.source}</p>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground shrink-0">{item.amount}</span>
                        <ChevronDown className={`size-4 text-muted-foreground transition-transform ${expandedItemId === item.id ? "rotate-180" : ""}`} />
                      </div>
                      
                      {/* Expanded Edit Section */}
                      {expandedItemId === item.id && (
                        <div className="px-4 pb-4 pt-2 border-t border-border bg-secondary/30">
                          <div className="flex flex-col gap-3">
                            <div className="flex gap-2">
                              <input
                                type="text"
                                placeholder="Amount"
                                value={item.amount === "—" ? "" : item.amount}
                                onChange={(e) => updateItemAmount(item.id, e.target.value || "—")}
                                onClick={(e) => e.stopPropagation()}
                                className="flex-1 bg-secondary rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                              />
                            </div>
                            <textarea
                              placeholder="Add a note..."
                              value={item.note}
                              onChange={(e) => updateItemNote(item.id, e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                              rows={2}
                              className="bg-secondary rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                            />
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                deleteItem(item.id)
                              }}
                              className="w-full py-2 rounded-lg bg-destructive/10 text-destructive text-sm font-medium flex items-center justify-center gap-2"
                            >
                              <X className="size-4" />
                              Remove
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Import from Planner Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50 p-4 pb-24">
          <div className="bg-card rounded-2xl w-full max-w-md overflow-hidden max-h-[70vh] flex flex-col">
            <div className="p-4 border-b border-border flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Calendar className="size-5 text-primary" />
                <h3 className="font-semibold text-foreground">Import from Planner</h3>
              </div>
              <button 
                onClick={() => {
                  setShowImportModal(false)
                  setSelectedDays([])
                }}
                className="p-1 rounded-lg hover:bg-secondary"
              >
                <X className="size-5 text-muted-foreground" />
              </button>
            </div>

            <div className="p-4 flex flex-col gap-3 overflow-y-auto">
              <p className="text-xs text-muted-foreground">Select days to import ingredients from planned meals:</p>
              {upcomingDays.map((day, index) => (
                <button
                  key={index}
                  onClick={() => {
                    if (selectedDays.includes(index)) {
                      setSelectedDays(selectedDays.filter(d => d !== index))
                    } else {
                      setSelectedDays([...selectedDays, index])
                    }
                  }}
                  disabled={day.meals.length === 0}
                  className={`p-3 rounded-xl text-left transition-all ${
                    selectedDays.includes(index)
                      ? "bg-primary/20 border border-primary"
                      : day.meals.length === 0
                      ? "bg-secondary/50 border border-transparent opacity-50"
                      : "bg-secondary border border-transparent hover:border-border"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">{day.label}</span>
                    {selectedDays.includes(index) && <Check className="size-4 text-primary" />}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {day.meals.length > 0 ? day.meals.join(", ") : "No meals planned"}
                  </p>
                </button>
              ))}
            </div>

            <div className="p-4 border-t border-border shrink-0">
              <button
                onClick={initializeBatchReview}
                disabled={selectedDays.length === 0}
                className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-medium disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] transition-transform"
              >
                Review Batches ({selectedDays.length} day{selectedDays.length !== 1 ? "s" : ""})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import from Recipe Modal */}
      {showRecipeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50 p-4 pb-24">
          <div className="bg-card rounded-2xl w-full max-w-md overflow-hidden max-h-[70vh] flex flex-col">
            <div className="p-4 border-b border-border flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <FileText className="size-5 text-primary" />
                <h3 className="font-semibold text-foreground">Import from Recipe</h3>
              </div>
              <button 
                onClick={() => {
                  setShowRecipeModal(false)
                  setSelectedDishes([])
                  setRecipeSearch("")
                  setSelectedDishCategory("All")
                }}
                className="p-1 rounded-lg hover:bg-secondary"
              >
                <X className="size-5 text-muted-foreground" />
              </button>
            </div>

            <div className="p-4 border-b border-border flex flex-col gap-3 shrink-0">
              {/* Tab Toggle */}
              <div className="flex gap-2 p-1 bg-secondary rounded-xl">
                <button
                  onClick={() => {
                    setRecipeTab("dishes")
                    setSelectedDishes([])
                  }}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                    recipeTab === "dishes"
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground"
                  }`}
                >
                  Dishes
                </button>
                <button
                  onClick={() => {
                    setRecipeTab("components")
                    setSelectedDishes([])
                  }}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                    recipeTab === "components"
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground"
                  }`}
                >
                  Components
                </button>
              </div>

              {/* Search */}
              <input
                type="text"
                placeholder="Search..."
                value={recipeSearch}
                onChange={(e) => setRecipeSearch(e.target.value)}
                className="bg-secondary rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />

              {/* Category Filter (dishes only) */}
              {recipeTab === "dishes" && (
                <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
                  {dishCategoryOptions.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedDishCategory(cat)}
                      className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                        selectedDishCategory === cat
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 flex flex-col gap-2 overflow-y-auto flex-1">
              {filteredRecipes.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No {recipeTab} found</p>
              ) : (
                filteredRecipes.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      if (selectedDishes.includes(item.id)) {
                        setSelectedDishes(selectedDishes.filter(d => d !== item.id))
                      } else {
                        setSelectedDishes([...selectedDishes, item.id])
                      }
                    }}
                    className={`p-3 rounded-xl text-left transition-all ${
                      selectedDishes.includes(item.id)
                        ? "bg-primary/20 border border-primary"
                        : "bg-secondary border border-transparent hover:border-border"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {item.type === "component" ? (
                        <FileText className="size-4 text-muted-foreground" />
                      ) : (
                        <UtensilsCrossed className="size-4 text-muted-foreground" />
                      )}
                      <span className="text-sm font-medium text-foreground flex-1">{item.name}</span>
                      {item.type === "dish" && item.category && (
                        <span className="text-[10px] text-muted-foreground">{item.category}</span>
                      )}
                      {selectedDishes.includes(item.id) && <Check className="size-4 text-primary" />}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 pl-6 truncate">
                      {item.ingredients.join(", ")}
                    </p>
                  </button>
                ))
              )}
            </div>

            <div className="p-4 border-t border-border shrink-0">
              <button
                onClick={importFromRecipe}
                disabled={selectedDishes.length === 0}
                className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-medium disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] transition-transform"
              >
                Import {selectedDishes.length} {recipeTab === "dishes" ? "dish" : "component"}{selectedDishes.length !== 1 ? "es" : ""}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Batch Review Modal */}
      {showBatchReview && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50 p-4 pb-24">
          <div className="bg-card rounded-2xl w-full max-w-md overflow-hidden max-h-[70vh] flex flex-col">
            <div className="p-4 border-b border-border flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <RefreshCw className="size-5 text-primary" />
                <h3 className="font-semibold text-foreground">Review Batches</h3>
              </div>
              <button 
                onClick={() => {
                  setShowBatchReview(false)
                  setBatchCounts({})
                  setSelectedDays([])
                }}
                className="p-1 rounded-lg hover:bg-secondary"
              >
                <X className="size-5 text-muted-foreground" />
              </button>
            </div>

            <div className="p-4 border-b border-border bg-secondary/30 shrink-0">
              <p className="text-xs text-muted-foreground">
                We&apos;ve analyzed your planned meals. Adjust how many batches of each recipe you want to prepare.
              </p>
            </div>

            <div className="p-4 flex flex-col gap-3 overflow-y-auto flex-1">
              {Object.entries(getMealOccurrences()).map(([dishId, { count, dish }]) => {
                const totalServings = (dish.marcinServings || 1) + (dish.patrycjaServings || 1)
                const currentBatches = batchCounts[dishId] || 1
                const coversOccasions = currentBatches * totalServings
                
                return (
                  <div key={dishId} className="bg-secondary/50 rounded-xl p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-foreground">{dish.name}</h4>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Planned {count}x · Recipe yields {totalServings} servings
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="px-1.5 py-0.5 rounded bg-navy/20 text-navy text-[9px] font-medium">
                          M:{dish.marcinServings || 1}
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-sage/20 text-sage text-[9px] font-medium">
                          P:{dish.patrycjaServings || 1}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-xs text-muted-foreground">Batches to make:</span>
                      <div className="flex items-center bg-background rounded-lg">
                        <button
                          onClick={() => setBatchCounts(prev => ({
                            ...prev,
                            [dishId]: Math.max(0, (prev[dishId] || 1) - 1)
                          }))}
                          className="px-3 py-1.5 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          -
                        </button>
                        <span className="w-8 text-center text-sm font-semibold text-foreground">{currentBatches}</span>
                        <button
                          onClick={() => setBatchCounts(prev => ({
                            ...prev,
                            [dishId]: (prev[dishId] || 1) + 1
                          }))}
                          className="px-3 py-1.5 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {currentBatches > 0 && (
                      <div className={`mt-2 text-xs ${coversOccasions >= count ? "text-sage" : "text-wheat"}`}>
                        {coversOccasions >= count 
                          ? `Covers all ${count} occasion${count !== 1 ? "s" : ""} (${coversOccasions} servings)`
                          : `Only covers ${coversOccasions} of ${count} occasions`
                        }
                      </div>
                    )}
                    {currentBatches === 0 && (
                      <div className="mt-2 text-xs text-muted-foreground">
                        Skipping this recipe
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            <div className="p-4 border-t border-border shrink-0 flex flex-col gap-2">
              <button
                onClick={importFromPlanner}
                disabled={Object.values(batchCounts).every(b => b === 0)}
                className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-medium disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] transition-transform"
              >
                Import Ingredients
              </button>
              <p className="text-[10px] text-muted-foreground text-center">
                {Object.values(batchCounts).reduce((sum, b) => sum + b, 0)} total batch{Object.values(batchCounts).reduce((sum, b) => sum + b, 0) !== 1 ? "es" : ""} to prepare
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
