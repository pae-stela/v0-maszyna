import { useState, useMemo } from "react"
import { useAuth } from "@/lib/auth-context"
import { useDishes, useWorkoutPlans, usePlannerEvents, useMealLogs } from "@/lib/realtime-hooks"
import { Calendar, ShoppingCart, ChevronLeft, ChevronRight, Plus, Check, X, Dumbbell, UtensilsCrossed, ExternalLink, AlertTriangle, RefreshCw, ChevronDown, FileText, Sparkles } from "lucide-react"

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
          <span className="text-[7px] font-bold text-sage">{target.calorie_goal > 0 ? Math.round((consumed.calories / target.calorie_goal) * 100) : 0}%</span>
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
  const [addType, setAddType] = useState<"meal" | "training" | "supplements">("meal")
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
  const [isRecurring, setIsRecurring] = useState(false)
  const [selectedDays, setSelectedDays] = useState<number[]>([])
  const [totalOccurrences, setTotalOccurrences] = useState(4)

  const [selectedMainCategory, setSelectedMainCategory] = useState<string | null>(null)
  const [selectedSubCategory, setSelectedSubCategory] = useState<string | null>(null)
  const [mealOwner, setMealOwner] = useState<"marcin" | "patrycja" | "both">("patrycja")

  const dates = getDateRange(baseDate, viewMode)
  const today = new Date()

  const dateStrForHook = baseDate.toISOString().split('T')[0]
  const { events: plannerEvents, addEvent } = usePlannerEvents()
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
    let title = ""
    let details = ""
    let calories = 0
    let protein = 0
    let carbs = 0
    let fats = 0
    let fiber = 0
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
          shared = mealOwner === "both"
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

      for (const targetDateStr of targetDates) {
        for (const owner of targetOwners) {
          if (addType === "meal") {
            await addMeal({
              date: targetDateStr,
              time: newEvent.time,
              name: title,
              calories,
              protein,
              carbs,
              fats,
              logged: false,
              owner: owner as "patrycja" | "marcin",
            })
          } else {
            await addEvent({
              date: targetDateStr,
              name: title,
              title,
              time: newEvent.time,
              type: addType,
              details: details || undefined,
              owner: owner as "patrycja" | "marcin",
              plan_id: planId,
              shared_with_partner: shared,
              logged: false,
            })
          }
        }
      }

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
    } catch (error) {
      console.error("Błąd podczas dodawania pozycji:", error)
    }
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

      {/* Trigger template for triggering the Add Modal */}
      <div className="flex justify-center mt-2">
        <button
          onClick={() => {
            setSelectedDate(baseDate)
            setShowAddModal(true)
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium shadow-sm hover:opacity-90 transition-all"
        >
          <Plus className="size-4" />
          Add Item
        </button>
      </div>

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
                    <Sparkles className="size-4 text-amber-600" />
                  </div>
                )}
                <div>
                  <h3 className="font-semibold text-foreground font-serif text-sm">
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

              {/* Meal & Supplements Owner Selection */}
              {(addType === "meal" || addType === "supplements") && (
                <div className="flex gap-2 p-1 bg-secondary rounded-xl">
                  <button
                    type="button"
                    onClick={() => setMealOwner("patrycja")}
                    className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                      mealOwner === "patrycja" ? "bg-sage text-background shadow-sm" : "text-muted-foreground"
                    }`}
                  >
                    Patrycja
                  </button>
                  <button
                    type="button"
                    onClick={() => setMealOwner("marcin")}
                    className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                      mealOwner === "marcin" ? "bg-navy text-background shadow-sm" : "text-muted-foreground"
                    }`}
                  >
                    Marcin
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

              {/* Cascading Preset Dish Picker */}
              {addType === "meal" && inputMode === "preset" && (
                <div className="flex flex-col gap-3">
                  {!selectedMainCategory && (
                    <div className="flex flex-col gap-2">
                      <p className="text-xs font-medium text-muted-foreground">1. Wybierz kategorię</p>
                      <div className="flex flex-col gap-1.5">
                        {Object.keys(dishCategories).map((cat) => (
                          <button
                            key={cat}
                            type="button"
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

                  {selectedMainCategory && !selectedSubCategory && (
                    <div className="flex flex-col gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedMainCategory(null)
                          setSelectedSubCategory(null)
                        }}
                        className="text-xs text-muted-foreground hover:text-foreground text-left"
                      >
                        &larr; Powrót do kategorii
                      </button>
                      <p className="text-xs font-medium text-muted-foreground">2. Wybierz podkategorię ({selectedMainCategory})</p>
                      <div className="flex flex-col gap-1.5">
                        {dishCategories[selectedMainCategory]?.map((sub) => (
                          <button
                            key={sub}
                            type="button"
                            onClick={() => setSelectedSubCategory(sub)}
                            className="p-2.5 rounded-xl text-left bg-secondary border border-transparent hover:border-border text-sm font-medium text-foreground transition-all"
                          >
                            {sub}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedMainCategory && selectedSubCategory && (
                    <div className="flex flex-col gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedSubCategory(null)
                          setSelectedDishId(null)
                        }}
                        className="text-xs text-muted-foreground hover:text-foreground text-left"
                      >
                        &larr; Powrót do {selectedMainCategory}
                      </button>
                      <p className="text-xs font-medium text-muted-foreground">3. Wybierz danie ({selectedSubCategory})</p>
                      <div className="flex flex-col gap-1.5 max-h-[180px] overflow-y-auto pr-1">
                        {allDishes
                          .filter(d => d.mainCategory === selectedMainCategory && d.subCategory === selectedSubCategory)
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
                                <span className="font-serif text-sm text-foreground">{dish.name}</span>
                                <span className="font-mono text-[11px] text-muted-foreground">{dish.totalCalories || 0} kcal</span>
                              </div>
                            </button>
                          ))}
                      </div>
                    </div>
                  )}
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