import { useLanguage } from "@/lib/i18n/context"
import { useState, useMemo, useEffect } from "react"
import { usePartnerColors } from "@/lib/partner-colors-context"
import { ShoppingListScreen } from "@/components/screens/shopping-list-screen"
import { useAuth } from "@/lib/auth-context"
import { useDishes, useWorkoutPlans, usePlannerEvents, useMealLogs } from "@/lib/realtime-hooks"
import { Calendar, ShoppingCart, ChevronLeft, ChevronRight, Plus, Check, X, Dumbbell, Utensils, ExternalLink, AlertTriangle, RefreshCw, ChevronDown, FileText, Pill, Edit, Trash2 } from "lucide-react"
import type { EditMode } from "@/components/screens/kitchen-screen"

// Re-export dishCategories for shopping view
const dishCategories: Record<string, string[]> = {
  "Large": ["Pasta & Rice", "Traditional", "Pancakes & Tortillas", "Salads & Veggies", "Fakeaways"],
  "Light": ["Eggs", "Sandwiches & Wraps", "Soups", "Sweet Bakes & Desserts", "Oats & Granola"],
  "Snacks": ["Savoury", "Sweet"],
  "Drinks": ["Shakes & Smoothies", "Cocktails & Mocktails", "Hot drinks", "Cold drinks"],
}

// Returns the fraction of a dish's total macros that belongs to a single partner.
// Shared by the recipe list display and the meal save logic so they always match.
function getOwnerMacroMultiplier(
  dish: { marcinServings?: number; patrycjaServings?: number },
  owner: "marcin" | "patrycja",
): number {
  const marcinS = dish.marcinServings || 1
  const patrycjaS = dish.patrycjaServings || 1
  if (dish.marcinServings || dish.patrycjaServings) {
    const totalParts = (marcinS * 2) + (patrycjaS * 1)
    if (totalParts > 0) {
      return owner === "marcin" ? (marcinS * 2) / totalParts : (patrycjaS * 1) / totalParts
    }
  }
  return 0.5
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

export function PlannerScreen({ onNavigateToKitchen }: { onNavigateToKitchen?: (dish: EditMode) => void }) {
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
          {t("calendar")}
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
          {t("shopping")}
        </button>
      </div>

      {subTab === "calendar" ? <CalendarView onNavigateToKitchen={onNavigateToKitchen} /> : <ShoppingView />}
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

function formatDate(date: Date, language: string = 'pl'): string {
  return date.toLocaleDateString(language === 'pl' ? 'pl-PL' : 'en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

function isSameDay(d1: Date, d2: Date): boolean {
  return d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
}

function toLocalDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
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
  selfProfile,
  partner,
  plannerEvents,
  allDishes,
}: {
  date: Date
  ownerFilter: OwnerFilter
  selfProfile: { name: string } | null
  partner: { name: string; id: string } | null
  plannerEvents: { id: string; date: string; time: string; type: string; name: string; details: string | null; user_id: string; logged: boolean; shared_with_partner: boolean; created_at: string; updated_at?: string }[]
  allDishes: Array<{ id: string; name: string; totalCalories?: number; totalProtein?: number; totalCarbs?: number; totalFats?: number; totalFiber?: number; marcinServings?: number; patrycjaServings?: number; owner?: "both" | "marcin" | "patrycja" }>
}) {
  const dateStr = toLocalDateStr(date)

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
        ? (selfProfile?.name?.toLowerCase().includes("marcin") ? true : false)
        : (partner?.name?.toLowerCase().includes("patrycja") ? true : false)
    })

    const consumed = filtered.reduce(
      (acc, e) => {
        let cals = 0, prot = 0, carb = 0, fat = 0, fib = 0
        try {
          if (e.details) {
            const d = JSON.parse(e.details)
            const dishId = d.dishId as string | undefined
            if (dishId) {
              const liveDish = allDishes.find(dish => dish.id === dishId)
              if (liveDish) {
                const dishOwner = liveDish.owner || "both"
                const marcinS = liveDish.marcinServings || 1
                const patrycjaS = liveDish.patrycjaServings || 1
                if (dishOwner !== "both") {
                  // Single-owner dish: only that partner gets macros
                  const servings = dishOwner === "marcin" ? marcinS : patrycjaS
                  const isTarget = owner === dishOwner
                  cals = isTarget ? Math.round((liveDish.totalCalories || 0) / servings) : 0
                  prot = isTarget ? Math.round((liveDish.totalProtein || 0) / servings * 10) / 10 : 0
                  carb = isTarget ? Math.round((liveDish.totalCarbs || 0) / servings * 10) / 10 : 0
                  fat = isTarget ? Math.round((liveDish.totalFats || 0) / servings * 10) / 10 : 0
                  fib = isTarget ? Math.round((liveDish.totalFiber || 0) / servings * 10) / 10 : 0
                } else {
                  const totalParts = (marcinS * 2) + (patrycjaS * 1)
                  if (totalParts > 0) {
                    const mult = owner === "marcin"
                      ? (marcinS * 2) / totalParts
                      : (patrycjaS * 1) / totalParts
                    cals = Math.round((liveDish.totalCalories || 0) * mult)
                    prot = Math.round((liveDish.totalProtein || 0) * mult * 10) / 10
                    carb = Math.round((liveDish.totalCarbs || 0) * mult * 10) / 10
                    fat = Math.round((liveDish.totalFats || 0) * mult * 10) / 10
                    fib = Math.round((liveDish.totalFiber || 0) * mult * 10) / 10
                  } else {
                    cals = liveDish.totalCalories || 0
                  }
                }
              } else {
                cals = d.calories || 0
                prot = d.protein || 0
                carb = d.carbs || 0
                fat = d.fats || 0
                fib = d.fiber || 0
              }
            } else {
              cals = d.calories || 0
              prot = d.protein || 0
              carb = d.carbs || 0
              fat = d.fats || 0
              fib = d.fiber || 0
            }
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
          <div className="flex-1 rounded-xl p-2 flex flex-col gap-1" style={{ backgroundColor: `${DASHBOARD_COLORS.fiber}22` }}>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: DASHBOARD_COLORS.fiber }} />
              <span className="text-[9px] font-semibold" style={{ color: DASHBOARD_COLORS.fiber }}>{selfProfile?.name || "You"}</span>
            </div>
            <SingleOwnerMacros owner="patrycja" consumed={patrycjaData.consumed} target={patrycjaData.target} />
          </div>
          <div className="flex-1 rounded-xl p-2 flex flex-col gap-1" style={{ backgroundColor: `${DASHBOARD_COLORS.calories}22` }}>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: DASHBOARD_COLORS.calories }} />
              <span className="text-[9px] font-semibold" style={{ color: DASHBOARD_COLORS.calories }}>{partner?.name || "Partner"}</span>
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

function CalendarView({ onNavigateToKitchen }: { onNavigateToKitchen?: (dish: EditMode) => void }) {
  const { user, profile, settings, partner } = useAuth()
  const { t, language } = useLanguage()
  const { myColor, partnerColor } = usePartnerColors()
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
  const [showKitchenModeModal, setShowKitchenModeModal] = useState(false)
  const [pendingKitchenDish, setPendingKitchenDish] = useState<EditMode | null>(null)

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
  const [showRecipesOnly, setShowRecipesOnly] = useState(false)
  const [mealOwner, setMealOwner] = useState<"marcin" | "patrycja" | "both">("patrycja")

  // Set meal owner to current user when component mounts or user changes
  useEffect(() => {
    if (user?.id === profile?.user_id || profile?.name?.toLowerCase() === "patrycja") {
      setMealOwner("patrycja")
    } else {
      setMealOwner("marcin")
    }
  }, [user?.id, profile?.user_id])

  const dates = getDateRange(baseDate, viewMode)
  const today = new Date()

  const dateStrForHook = toLocalDateStr(baseDate)
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

    // Pre-compute per-person portion macros for preset dishes
    let marcinMacros = { calories, protein, carbs, fats, fiber }
    let patrycjaMacros = { calories, protein, carbs, fats, fiber }
    if (addType === "meal" && inputMode === "preset" && selectedDishId) {
      const dish = allDishes.find(d => d.id === selectedDishId)
      if (dish) {
        const dishOwner = dish.owner || "both"
        const marcinS = dish.marcinServings || 1
        const patrycjaS = dish.patrycjaServings || 1
        if (dishOwner !== "both") {
          // Single-owner dish: total / that partner's servings
          const servings = dishOwner === "marcin" ? marcinS : patrycjaS
          marcinMacros = {
            calories: dishOwner === "marcin" ? Math.round(calories / servings) : 0,
            protein: dishOwner === "marcin" ? Math.round(protein / servings * 10) / 10 : 0,
            carbs: dishOwner === "marcin" ? Math.round(carbs / servings * 10) / 10 : 0,
            fats: dishOwner === "marcin" ? Math.round(fats / servings * 10) / 10 : 0,
            fiber: dishOwner === "marcin" ? Math.round(fiber / servings * 10) / 10 : 0,
          }
          patrycjaMacros = {
            calories: dishOwner === "patrycja" ? Math.round(calories / servings) : 0,
            protein: dishOwner === "patrycja" ? Math.round(protein / servings * 10) / 10 : 0,
            carbs: dishOwner === "patrycja" ? Math.round(carbs / servings * 10) / 10 : 0,
            fats: dishOwner === "patrycja" ? Math.round(fats / servings * 10) / 10 : 0,
            fiber: dishOwner === "patrycja" ? Math.round(fiber / servings * 10) / 10 : 0,
          }
        } else if (marcinS || patrycjaS) {
          // Shared dish: 2:1 ratio split
          const totalParts = (marcinS * 2) + (patrycjaS * 1)
          if (totalParts > 0) {
            const marcinMult = 2 / totalParts
            const patrycjaMult = 1 / totalParts
            marcinMacros = {
              calories: Math.round(calories * marcinMult),
              protein: Math.round(protein * marcinMult * 10) / 10,
              carbs: Math.round(carbs * marcinMult * 10) / 10,
              fats: Math.round(fats * marcinMult * 10) / 10,
              fiber: Math.round(fiber * marcinMult * 10) / 10,
            }
            patrycjaMacros = {
              calories: Math.round(calories * patrycjaMult),
              protein: Math.round(protein * patrycjaMult * 10) / 10,
              carbs: Math.round(carbs * patrycjaMult * 10) / 10,
              fats: Math.round(fats * patrycjaMult * 10) / 10,
              fiber: Math.round(fiber * patrycjaMult * 10) / 10,
            }
          }
        }
      }
    }

    // For single-owner dishes: only add for that partner, regardless of mealOwner UI
    const dishOwner = (addType === "meal" && inputMode === "preset" && selectedDishId)
      ? (allDishes.find(d => d.id === selectedDishId)?.owner || "both")
      : "both"
    const targetOwners = dishOwner !== "both"
      ? [dishOwner]
      : (mealOwner === "both" ? ["patrycja", "marcin"] : [mealOwner])
    console.log("[addEvent] dishOwner:", dishOwner, "mealOwner:", mealOwner, "targetOwners:", targetOwners)

    try {
      const getRecurringDates = (startDate: Date, daysOfWeek: number[], count: number): string[] => {
        const datesList: string[] = []
        let current = new Date(startDate)

        if (daysOfWeek.includes(current.getDay())) {
          datesList.push(toLocalDateStr(current))
        }

        while (datesList.length < count) {
          current.setDate(current.getDate() + 1)
          if (daysOfWeek.includes(current.getDay())) {
            datesList.push(toLocalDateStr(current))
          }
          if (daysOfWeek.length === 0 || datesList.length > 100) break
        }
        return datesList
      }

      const targetDates = (addType === "supplements" && isRecurring && selectedDays.length > 0)
        ? getRecurringDates(selectedDate, selectedDays, totalOccurrences)
        : [toLocalDateStr(selectedDate)]

      let hasError = false

      for (const targetDateStr of targetDates) {
        for (const owner of targetOwners) {
          const ownerMacros = owner === "marcin" ? marcinMacros : patrycjaMacros
          const detailsJson = JSON.stringify({
            owner,
            calories: addType === "meal" ? ownerMacros.calories : undefined,
            protein: addType === "meal" ? ownerMacros.protein : undefined,
            carbs: addType === "meal" ? ownerMacros.carbs : undefined,
            fats: addType === "meal" ? ownerMacros.fats : undefined,
            fiber: addType === "meal" ? ownerMacros.fiber : undefined,
            dishId,
            planId,
            shared,
            type: addType,
          })

          if (addType === "meal") {
            console.log("[addMeal] owner:", owner, "macros:", ownerMacros, "dishOwner:", dishOwner)
            const mealResult = await addMeal({
              date: targetDateStr,
              time: newEvent.time,
              name: title,
              details: JSON.stringify({ owner }),
              calories: ownerMacros.calories,
              protein: ownerMacros.protein,
              carbs: ownerMacros.carbs,
              fats: ownerMacros.fats,
              fiber: ownerMacros.fiber,
              logged: false,
            })
            if (mealResult?.error) {
              console.error("[planner] addMeal error:", mealResult.error)
              hasError = true
            } else {
              console.log("[addMeal] success:", mealResult.data)
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
    const dateStr = toLocalDateStr(date)
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

        const dishId = parsedDetails.dishId as string | undefined

        // Live-resolve macros from current dish data to stay fresh after edits
        let calories = parsedDetails.calories as number | undefined
        let protein = parsedDetails.protein as number | undefined
        let carbs = parsedDetails.carbs as number | undefined
        let fats = parsedDetails.fats as number | undefined
        let fiber = parsedDetails.fiber as number | undefined
        let title = e.name

        if (dishId) {
          const liveDish = allDishes.find(d => d.id === dishId)
          if (liveDish) {
            title = liveDish.name
            const dishOwner = liveDish.owner || "both"
            const marcinS = liveDish.marcinServings || 1
            const patrycjaS = liveDish.patrycjaServings || 1
            if (dishOwner !== "both") {
              // Single-owner dish: total / that partner's servings
              const servings = dishOwner === "marcin" ? marcinS : patrycjaS
              const isTarget = eventOwner === dishOwner
              calories = isTarget ? Math.round((liveDish.totalCalories || 0) / servings) : 0
              protein = isTarget ? Math.round((liveDish.totalProtein || 0) / servings * 10) / 10 : 0
              carbs = isTarget ? Math.round((liveDish.totalCarbs || 0) / servings * 10) / 10 : 0
              fats = isTarget ? Math.round((liveDish.totalFats || 0) / servings * 10) / 10 : 0
              fiber = isTarget ? Math.round((liveDish.totalFiber || 0) / servings * 10) / 10 : 0
            } else {
              const totalParts = (marcinS * 2) + (patrycjaS * 1)
              if (totalParts > 0) {
                const mult = eventOwner === "marcin"
                  ? (marcinS * 2) / totalParts
                  : (patrycjaS * 1) / totalParts
                calories = Math.round((liveDish.totalCalories || 0) * mult)
                protein = Math.round((liveDish.totalProtein || 0) * mult * 10) / 10
                carbs = Math.round((liveDish.totalCarbs || 0) * mult * 10) / 10
                fats = Math.round((liveDish.totalFats || 0) * mult * 10) / 10
                fiber = Math.round((liveDish.totalFiber || 0) * mult * 10) / 10
              } else {
                calories = liveDish.totalCalories || 0
                protein = liveDish.totalProtein || 0
                carbs = liveDish.totalCarbs || 0
                fats = liveDish.totalFats || 0
                fiber = liveDish.totalFiber || 0
              }
            }
          }
        }

        return {
          id: e.id,
          date: new Date(e.date + "T00:00:00"),
          title,
          time: e.time,
          type: e.type as EventType,
          details: e.details || undefined,
          owner: eventOwner,
          calories,
          protein,
          carbs,
          fats,
          fiber,
          dishId,
          planId: parsedDetails.planId as string | undefined,
          sharedWithPartner: parsedDetails.shared as boolean | undefined,
        }
      })
  }

  const getEventColor = (type: EventType, owner: "marcin" | "patrycja"): string => {
    if (owner === "marcin") {
      switch (type) {
        case "training": return "bg-[#1A2E26]"
        case "meal": return "bg-[#1A2E26]/70"
        case "supplements": return "bg-[#1A2E26]/50"
        case "google": return "bg-[#1A2E26]"
      }
    } else {
      switch (type) {
        case "training": return "bg-[#8A9A86]"
        case "meal": return "bg-[#8A9A86]/70"
        case "supplements": return "bg-[#8A9A86]/50"
        case "google": return "bg-emerald-900"
      }
    }
    return "bg-muted"
  }

  const getEventIcon = (type: EventType) => {
    switch (type) {
      case "training": return <Dumbbell className="size-4" />
      case "meal": return <Utensils className="size-4" />
      case "supplements": return <Pill className="size-4" />
      case "google": return <Calendar className="size-4" />
    }
  }

  const filteredPlans = useMemo(() => {
    return allPlans.filter(p => p.type === workoutTypeFilter)
  }, [allPlans, workoutTypeFilter])

  return (
    <div className="flex flex-col gap-4">
      {/* Compact single row: view mode (left) + owner filter (right) */}
      <div className="flex items-center gap-2">
        <div className="flex gap-0.5 p-0.5 bg-card border border-border rounded-xl">
          {(["today", "3day", "week"] as CalendarViewMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                viewMode === mode
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {mode === "today" ? t('today') : mode === "3day" ? t('threeDays') : t('week')}
            </button>
          ))}
        </div>
        <div className="flex gap-0.5 p-0.5 bg-card border border-border rounded-xl ml-auto">
          <button
            onClick={() => { setShowBothCalendars(false); setActiveUser("patrycja"); setOwnerFilter("patrycja") }}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              !showBothCalendars && activeUser === "patrycja" ? "text-white" : "text-muted-foreground hover:text-foreground"
            }`}
            style={!showBothCalendars && activeUser === "patrycja" ? { backgroundColor: myColor } : undefined}
          >
            {profile?.name?.split(' ')[0] || "Patrycja"}
          </button>
          <button
            onClick={() => { setShowBothCalendars(false); setActiveUser("marcin"); setOwnerFilter("marcin") }}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              !showBothCalendars && activeUser === "marcin" ? "text-white" : "text-muted-foreground hover:text-foreground"
            }`}
            style={!showBothCalendars && activeUser === "marcin" ? { backgroundColor: partnerColor } : undefined}
          >
            {partner?.name?.split(' ')[0] || "Marcin"}
          </button>
          <button
            onClick={() => { setShowBothCalendars(true); setOwnerFilter("both") }}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              showBothCalendars ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t('both')}
          </button>
        </div>
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
              ? formatDate(baseDate, language)
              : `${formatDate(dates[0], language)} - ${formatDate(dates[dates.length - 1], language)}`
          }
          </h3>
          {!isSameDay(baseDate, today) && (
            <button
              onClick={goToToday}
              className="text-xs text-primary hover:underline"
            >
              {t("today")}
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
                selfProfile={profile}
                partner={partner}
                plannerEvents={plannerEvents}
                allDishes={allDishes}
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
                                      className={`rounded-lg p-2 text-white cursor-pointer active:scale-[0.98] transition-transform overflow-hidden ${isMulti ? 'flex-1 min-w-0' : 'w-full'} ${getEventColor(event.type, event.owner)}`}
                                    >
                                      <div className="flex items-center gap-1.5 min-w-0">
                                        <span className="shrink-0">{getEventIcon(event.type)}</span>
                                        <span className={`font-medium truncate overflow-hidden ${viewMode === "week" ? "text-[10px]" : "text-xs"}`}>
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
                          <Utensils className="size-3.5" />
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

            {/* Preview of selected meal with recipe steps */}
            {addType === "meal" && inputMode === "preset" && selectedDishId && (() => {
              const dish = allDishes.find(d => d.id === selectedDishId)
              if (!dish) return null
              const hasRecipe = (dish.recipeSteps && dish.recipeSteps.length > 0) || (dish.steps && dish.steps.length > 0)
              const recipeSteps = dish.recipeSteps || dish.steps || []
              
              return (
                <div className="p-3 bg-secondary/50 border border-border rounded-xl space-y-3">
                  <div>
                    <p className="text-xs font-medium text-foreground mb-1.5">{dish.name}</p>
                    <div className="text-[10px] text-muted-foreground space-y-1">
                      <div className="flex justify-between">
                        <span>Kalorie:</span>
                        <span className="font-mono font-medium">{Math.round(dish.totalCalories || 0)} kcal</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Białko:</span>
                        <span className="font-mono font-medium">{Math.round(dish.totalProtein || 0)}g</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Węglowodany:</span>
                        <span className="font-mono font-medium">{Math.round(dish.totalCarbs || 0)}g</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Tłuszcze:</span>
                        <span className="font-mono font-medium">{Math.round(dish.totalFats || 0)}g</span>
                      </div>
                    </div>
                  </div>
                  
                  {hasRecipe && (
                    <div className="border-t border-border pt-2.5">
                      <p className="text-xs font-medium text-foreground mb-1.5 flex items-center gap-1">
                        <span>📖</span> Przepis
                      </p>
                      <ul className="text-[10px] text-muted-foreground space-y-1">
                        {recipeSteps.map((step, idx) => (
                          <li key={idx} className="flex gap-2">
                            <span className="text-primary/60 font-mono min-w-5">{idx + 1}.</span>
                            <span>{step}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )
            })()}

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
                        <RefreshCw className="size-4 text-muted-foreground" />
                        <span>Zamień danie</span>
                      </button>
                    )}
                    {isMeal && onNavigateToKitchen && (
                      <button
                        onClick={() => {
                          setShowEventMenu(false)
                          let dishId: string | undefined
                          try {
                            if (event.details) {
                              const d = JSON.parse(event.details)
                              dishId = d.dishId
                            }
                          } catch {}
                          const dish = dishId ? allDishes.find((d) => d.id === dishId) : null
                          if (dish) {
                            setPendingKitchenDish({
                              type: 'dish',
                              id: dish.id,
                              name: dish.name,
                              elements: Array.isArray((dish as any).elements) ? (dish as any).elements : [],
                              recipeSteps: (dish as any).recipeSteps || (dish as any).steps || [],
                              marcinServings: (dish as any).marcinServings,
                              patrycjaServings: (dish as any).patrycjaServings,
                              mainCategory: (dish as any).mainCategory,
                              subCategory: (dish as any).subCategory,
                              owner: (dish as any).owner,
                            })
                            setShowKitchenModeModal(true)
                          } else {
                            alert("Nie znaleziono dania w bazie. Otwórz kalkulator ręcznie i wyszukaj danie.")
                          }
                        }}
                        className="flex items-center gap-3 px-4 py-3 text-sm text-foreground hover:bg-secondary transition-colors"
                      >
                        <Edit className="size-4 text-muted-foreground" />
                        <span>Edytuj w kalkulatorze</span>
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setShowEventMenu(false)
                        deleteEvent(selectedEventForMenu)
                          .then(() => setShowEventMenu(false))
                          .catch(() => {
                            alert("Nie uda��o się usunąć wydarzenia. Spróbuj ponownie.")
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
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-end justify-center p-4 pb-24" onClick={() => setShowSwapDishModal(false)}>
          <div className="bg-card rounded-2xl w-full max-w-md overflow-hidden max-h-[80vh] flex flex-col animate-in slide-in-from-bottom-4 duration-250" onClick={(e) => e.stopPropagation()}>
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
                      const eventDetails = event.details as any
                      // Dish owner overrides event owner if dish is saved for one partner only
                      const dishOwner = dish.owner || "both"
                      const owner = dishOwner !== "both" ? dishOwner : (eventDetails?.owner as "marcin" | "patrycja" | "both") || "patrycja"
                      const dOwner = owner === "both" ? "patrycja" : owner
                      // For single-owner dishes: total / servings (per person)
                      // For shared dishes: use the 2:1 ratio (existing behavior)
                      const servings = dOwner === "marcin" ? (dish.marcinServings || 1) : (dish.patrycjaServings || 1)
                      const caloriesValue = dishOwner !== "both"
                        ? dish.totalCalories / servings
                        : (dish.totalCalories / (dish.servings || 1)) * servings
                      const proteinValue = dishOwner !== "both"
                        ? dish.totalProtein / servings
                        : (dish.totalProtein / (dish.servings || 1)) * servings
                      const carbsValue = dishOwner !== "both"
                        ? dish.totalCarbs / servings
                        : (dish.totalCarbs / (dish.servings || 1)) * servings
                      const fatsValue = dishOwner !== "both"
                        ? dish.totalFats / servings
                        : (dish.totalFats / (dish.servings || 1)) * servings
                      const ratio = dishOwner !== "both" ? 1 : 1
                      const newDetails = {
                        owner,
                        calories: Math.round(caloriesValue),
                        protein: Math.round(proteinValue),
                        carbs: Math.round(carbsValue),
                        fats: Math.round(fatsValue),
                        dishId: dish.id,
                        servingRatio: ratio,
                        marcin: null,
                        patrycja: null,
                        sharedWithPartner: owner === "both",
                        auto: true,
                      }
                      updateEvent(selectedEventForMenu, {
                        name: dish.name,
                        details: JSON.stringify(newDetails),
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
                        {Math.round(dish.totalCalories / (dish.servings || 1))} kcal
                      </span>
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-1">
                      P:{Math.round(dish.totalProtein / (dish.servings || 1))}g ·
                      C:{Math.round(dish.totalCarbs / (dish.servings || 1))}g ·
                      F:{Math.round(dish.totalFats / (dish.servings || 1))}g
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Kitchen Mode Modal (T005) */}
      {showKitchenModeModal && pendingKitchenDish && onNavigateToKitchen && (
        <div
          className="fixed inset-0 bg-black/50 z-[70] flex items-end justify-center p-4 pb-24"
          onClick={() => setShowKitchenModeModal(false)}
        >
          <div
            className="bg-card rounded-2xl w-full max-w-md overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-border">
              <p className="text-sm font-semibold text-foreground">Jak chcesz edytować?</p>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">{pendingKitchenDish.name}</p>
            </div>
            <div className="flex flex-col divide-y divide-border">
              <button
                onClick={() => {
                  setShowKitchenModeModal(false)
                  onNavigateToKitchen(pendingKitchenDish)
                  setPendingKitchenDish(null)
                }}
                className="flex items-start gap-3 px-4 py-3.5 text-left hover:bg-secondary transition-colors"
              >
                <div className="size-8 rounded-lg bg-sky-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Edit className="size-4 text-sky-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Nadpisz danie</p>
                  <p className="text-xs text-muted-foreground">Zaktualizuj przepis — zmiana widoczna wszędzie</p>
                </div>
              </button>
              <button
                onClick={() => {
                  setShowKitchenModeModal(false)
                  if (pendingKitchenDish) {
                    onNavigateToKitchen(pendingKitchenDish)
                  }
                  setPendingKitchenDish(null)
                }}
                className="flex items-start gap-3 px-4 py-3.5 text-left hover:bg-secondary transition-colors"
              >
                <div className="size-8 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <FileText className="size-4 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Zapisz jako nowe danie</p>
                  <p className="text-xs text-muted-foreground">Utwórz nową wersję — oryginał pozostaje bez zmian</p>
                </div>
              </button>
              <button
                onClick={() => setShowKitchenModeModal(false)}
                className="flex items-center gap-3 px-4 py-3 text-sm text-muted-foreground hover:bg-secondary transition-colors border-t border-border"
              >
                <X className="size-4" />
                <span>Anuluj</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Event Modal */}
      {showAddModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-end justify-center z-50 p-4 pb-24"
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="bg-card rounded-2xl w-full max-w-md overflow-hidden max-h-[80vh] flex flex-col animate-in slide-in-from-bottom-4 duration-250"
            onClick={(e) => e.stopPropagation()}
          >

            {/* Modal Header */}
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                {addType === "meal" ? (
                  <div className="size-8 rounded-lg bg-sage/20 flex items-center justify-center">
                    <Utensils className="size-4 text-sage" />
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
                  <p className="text-xs text-muted-foreground font-mono">{formatDate(selectedDate, language)}</p>
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

              {/* Type + Owner — single compact row */}
              <div className="flex items-center gap-2">
                {/* Type tabs with icons */}
                <div className="flex gap-0.5 p-1 bg-secondary rounded-xl text-xs flex-1">
                  <button
                    type="button"
                    onClick={() => setAddType("meal")}
                    className={`flex-1 py-1.5 rounded-lg font-medium transition-all flex items-center justify-center gap-1 ${
                      addType === "meal" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                    }`}
                  >
                    <Utensils className="size-3" />
                    <span className="hidden sm:inline">Posiłek</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAddType("training")}
                    className={`flex-1 py-1.5 rounded-lg font-medium transition-all flex items-center justify-center gap-1 ${
                      addType === "training" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                    }`}
                  >
                    <Dumbbell className="size-3" />
                    <span className="hidden sm:inline">Trening</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAddType("supplements")}
                    className={`flex-1 py-1.5 rounded-lg font-medium transition-all flex items-center justify-center gap-1 ${
                      addType === "supplements" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                    }`}
                  >
                    <Pill className="size-3" />
                    <span className="hidden sm:inline">Suplement</span>
                  </button>
                </div>

                {/* Owner — compact avatar buttons */}
                <div className="flex gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => setMealOwner("patrycja")}
                    title={profile?.name || "Patrycja"}
                    className={`size-8 rounded-lg text-xs font-bold transition-all ${
                      mealOwner === "patrycja" ? "text-white shadow-sm" : "bg-secondary text-muted-foreground"
                    }`}
                    style={mealOwner === "patrycja" ? { backgroundColor: myColor } : undefined}
                  >
                    {(profile?.name || "P")[0].toUpperCase()}
                  </button>
                  <button
                    type="button"
                    onClick={() => setMealOwner("marcin")}
                    title={partner?.name || "Marcin"}
                    className={`size-8 rounded-lg text-xs font-bold transition-all ${
                      mealOwner === "marcin" ? "text-white shadow-sm" : "bg-secondary text-muted-foreground"
                    }`}
                    style={mealOwner === "marcin" ? { backgroundColor: partnerColor } : undefined}
                  >
                    {(partner?.name || "M")[0].toUpperCase()}
                  </button>
                  <button
                    type="button"
                    onClick={() => setMealOwner("both")}
                    className={`px-2 h-8 rounded-lg text-[10px] font-medium transition-all ${
                      mealOwner === "both" ? "bg-primary text-primary-foreground shadow-sm" : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    Oboje
                  </button>
                </div>
              </div>

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
              {addType === "meal" && inputMode !== "custom" && (
                <div className="flex flex-col gap-3">
                  {/* Category chips inline */}
                  <div className="flex gap-1 flex-wrap items-center">
                    {([
                      ["Large", t("large")],
                      ["Light", t("light")],
                      ["Snacks", t("snacks")],
                      ["Drinks", t("drinksCategory")],
                    ] as const).map(([cat, label]) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setSelectedMainCategory(selectedMainCategory === cat ? null : cat)}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-medium transition-all border ${
                          selectedMainCategory === cat
                            ? "bg-sage/20 border-sage/40 text-sage/80"
                            : "border-border text-muted-foreground hover:border-muted"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                    <div className="h-4 w-px bg-border mx-1" />
                    <button
                      type="button"
                      onClick={() => setShowRecipesOnly(!showRecipesOnly)}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-medium transition-all border flex items-center gap-1 ${
                        showRecipesOnly
                          ? "bg-primary/20 border-primary/40 text-primary/80"
                          : "border-border text-muted-foreground hover:border-muted"
                      }`}
                    >
                      Przepisy
                    </button>
                  </div>
                  <div className="flex flex-col gap-1.5 max-h-[200px] overflow-y-auto pr-1">
                    {allDishes
                      .filter(d => selectedMainCategory ? d.mainCategory === selectedMainCategory : true)
                      .filter(d => showRecipesOnly ? (d.recipeSteps && d.recipeSteps.length > 0) || (d.steps && d.steps.length > 0) : true)
                      .map((dish) => {
                        const hasRecipe = (dish.recipeSteps && dish.recipeSteps.length > 0) || (dish.steps && dish.steps.length > 0)
                        const ownerForDisplay = mealOwner === "both" ? "patrycja" : mealOwner
                        const multiplier = getOwnerMacroMultiplier(dish, ownerForDisplay)
                        const displayCals = Math.round((dish.totalCalories || 0) * multiplier)
                        return (
                          <button
                            key={dish.id}
                            type="button"
                            onClick={() => {
                              setSelectedDishId(dish.id)
                              // Auto-update mealOwner to match dish owner (from main)
                              if ((dish as any).owner && (dish as any).owner !== "both") {
                                setMealOwner((dish as any).owner)
                              }
                            }}
                            className={`p-2.5 rounded-xl text-left border text-xs font-medium transition-all ${
                              selectedDishId === dish.id
                                ? "bg-sage/20 border-sage text-foreground"
                                : "bg-secondary border-transparent hover:border-border text-muted-foreground"
                            }`}
                          >
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-2">
                                <span className="font-sans text-sm text-foreground">{dish.name}</span>
                                {hasRecipe && <span className="text-[10px] bg-primary/20 text-primary/80 px-1.5 py-0.5 rounded font-mono">przepis</span>}
                              </div>
                              <span className="font-mono text-[11px] text-muted-foreground">{displayCals} kcal</span>
                            </div>
                            <div className="text-[10px] text-muted-foreground mt-0.5">
                              {t(dish.mainCategory?.toLowerCase() as any) || dish.mainCategory} · {dish.subCategory}
                            </div>
                          </button>
                        )
                      })}
                    {allDishes.filter(d => selectedMainCategory ? d.mainCategory === selectedMainCategory : true).filter(d => showRecipesOnly ? (d.recipeSteps && d.recipeSteps.length > 0) || (d.steps && d.steps.length > 0) : true).length === 0 && (
                      <p className="text-xs text-muted-foreground text-center py-4">Brak posiłków w tej kategorii</p>
                    )}
                  </div>
                  {/* Toggle to custom */}
                  <button
                    type="button"
                    onClick={() => { setInputMode("custom"); setSelectedDishId(null) }}
                    className="text-xs text-muted-foreground hover:text-primary transition-colors text-center py-0.5"
                  >
                    + Wpisz własny posiłek
                  </button>
                </div>
              )}

              {/* Custom Meal Input / Supplement Input Fields */}
              {((addType === "meal" && inputMode === "custom") || addType === "supplements") && (
                <div className="flex flex-col gap-3">
                  {addType === "meal" && (
                    <button
                      type="button"
                      onClick={() => setInputMode("preset")}
                      className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
                    >
                      <ChevronLeft className="size-3.5" />
                      Wróć do listy posiłków
                    </button>
                  )}
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
                  {/* Workout type inline filter */}
                  <div className="flex gap-1">
                    {(["weights", "cardio", "flexibility"] as const).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setWorkoutTypeFilter(type)}
                        className={`flex-1 py-1.5 rounded-lg text-[10px] font-medium transition-all capitalize border ${
                          workoutTypeFilter === type
                            ? "bg-primary/10 border-primary/40 text-primary"
                            : "border-border text-muted-foreground hover:border-muted"
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
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
                onClick={() => {
                  setShowAddModal(false)
                  setSelectedMainCategory(null)
                  setShowRecipesOnly(false)
                }}
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

// Shopping tab — renders the full shopping list screen inline
function ShoppingView() {
  return <ShoppingListScreen />
}
