"use client"

import { useState } from "react"
import { Calendar, ShoppingCart, ChevronLeft, ChevronRight, Plus, Check, X, Dumbbell, UtensilsCrossed, ExternalLink, AlertTriangle, RefreshCw, ChevronDown, FileText } from "lucide-react"

type SubTab = "calendar" | "shopping"
type CalendarViewMode = "today" | "3day" | "week"
type EventType = "meal" | "training" | "google"

interface PlannerEvent {
  id: string
  date: Date
  title: string
  time: string
  type: EventType
  details?: string
  owner: "marcin" | "patrycja"
}

export function PlannerScreen() {
  const [subTab, setSubTab] = useState<SubTab>("calendar")

  return (
    <div className="flex flex-col gap-4">
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

// Preset workouts (would normally come from training screen)
const presetWorkouts = [
  { id: "w1", name: "Leg Day", details: "Squats, Lunges, Leg Press, Calf Raises" },
  { id: "w2", name: "Upper Body", details: "Bench Press, Rows, Shoulder Press, Bicep Curls" },
  { id: "w3", name: "Push Day", details: "Chest Press, Tricep Dips, Shoulder Raises" },
  { id: "w4", name: "Pull Day", details: "Deadlifts, Pull-ups, Rows, Bicep Curls" },
  { id: "w5", name: "Full Body", details: "Squats, Deadlifts, Bench Press, Rows" },
  { id: "w6", name: "Core & Abs", details: "Planks, Crunches, Russian Twists, Leg Raises" },
]

// Preset dishes (would normally come from kitchen screen)
const presetDishes = [
  { id: "d1", name: "Power Breakfast", details: "Eggs, Oats, Banana" },
  { id: "d2", name: "Lunch Bowl", details: "Chicken, Rice, Broccoli, Guacamole" },
  { id: "d3", name: "Protein Shake", details: "Banana, Greek Yogurt, Almonds" },
  { id: "d4", name: "Trail Mix Bites", details: "Almonds, Oats" },
  { id: "d5", name: "Grilled Salmon", details: "Salmon, Vegetables, Olive Oil" },
  { id: "d6", name: "Chicken Salad", details: "Chicken Breast, Mixed Greens, Dressing" },
]

function CalendarView() {
  const [viewMode, setViewMode] = useState<CalendarViewMode>("today")
  const [baseDate, setBaseDate] = useState(new Date())
  const [showAddModal, setShowAddModal] = useState(false)
  const [addType, setAddType] = useState<"meal" | "training">("meal")
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [googleConnected, setGoogleConnected] = useState(false)
  const [activeUser, setActiveUser] = useState<"marcin" | "patrycja">("marcin")
  const [showBothCalendars, setShowBothCalendars] = useState(true)
  
  const [events, setEvents] = useState<PlannerEvent[]>([
    { id: "1", date: new Date(), title: "Leg Day", time: "7:00 AM", type: "training", details: "Squats, Lunges, Leg Press", owner: "marcin" },
    { id: "2", date: new Date(), title: "Power Breakfast", time: "8:30 AM", type: "meal", details: "Eggs, Oats, Banana", owner: "marcin" },
    { id: "3", date: new Date(), title: "Lunch Bowl", time: "1:00 PM", type: "meal", details: "Chicken, Rice, Broccoli", owner: "marcin" },
    { id: "4", date: new Date(Date.now() + 86400000), title: "Upper Body", time: "7:00 AM", type: "training", owner: "marcin" },
    { id: "5", date: new Date(Date.now() + 86400000), title: "Team Meeting", time: "10:00 AM", type: "google", owner: "marcin" },
    { id: "6", date: new Date(), title: "Yoga", time: "6:30 AM", type: "training", details: "Morning flow", owner: "patrycja" },
    { id: "7", date: new Date(), title: "Protein Shake", time: "7:30 AM", type: "meal", owner: "patrycja" },
    { id: "8", date: new Date(), title: "Chicken Salad", time: "12:30 PM", type: "meal", owner: "patrycja" },
    { id: "9", date: new Date(Date.now() + 86400000), title: "Pilates", time: "6:00 PM", type: "training", owner: "patrycja" },
  ])

  const [newEvent, setNewEvent] = useState({ title: "", time: "12:00", details: "" })
  const [inputMode, setInputMode] = useState<"preset" | "custom">("preset")
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null)

  const dates = getDateRange(baseDate, viewMode)
  const today = new Date()

  const navigate = (direction: "prev" | "next") => {
    const newDate = new Date(baseDate)
    const offset = viewMode === "today" ? 1 : viewMode === "3day" ? 3 : 7
    newDate.setDate(baseDate.getDate() + (direction === "next" ? offset : -offset))
    setBaseDate(newDate)
  }

  const goToToday = () => {
    setBaseDate(new Date())
  }

  const handleAddEvent = () => {
    let title = ""
    let details = ""
    
    if (inputMode === "preset" && selectedPreset) {
      const presets = addType === "meal" ? presetDishes : presetWorkouts
      const preset = presets.find(p => p.id === selectedPreset)
      if (preset) {
        title = preset.name
        details = preset.details
      }
    } else if (inputMode === "custom" && newEvent.title.trim()) {
      title = newEvent.title
      details = newEvent.details
    }
    
    if (!title) return
    
    const event: PlannerEvent = {
      id: Date.now().toString(),
      date: selectedDate,
      title,
      time: newEvent.time,
      type: addType,
      details: details || undefined,
      owner: activeUser,
    }
    setEvents([...events, event])
    setNewEvent({ title: "", time: "12:00", details: "" })
    setSelectedPreset(null)
    setInputMode("preset")
    setShowAddModal(false)
  }

  const getEventsForDate = (date: Date) => {
    return events
      .filter(e => isSameDay(e.date, date) && (showBothCalendars || e.owner === activeUser))
      .sort((a, b) => a.time.localeCompare(b.time))
  }

  // Color scheme: Marcin = blue/navy, Patrycja = green/dark green
  const getEventColor = (type: EventType, owner: "marcin" | "patrycja") => {
    if (owner === "marcin") {
      switch (type) {
        case "training": return "bg-blue-500"
        case "meal": return "bg-blue-400"
        case "google": return "bg-blue-900"
      }
    } else {
      switch (type) {
        case "training": return "bg-emerald-500"
        case "meal": return "bg-emerald-400"
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

      {/* Calendar Owner Toggle */}
      <div className="flex items-center gap-2">
        <div className="flex gap-1 p-1 bg-card border border-border rounded-xl flex-1">
          <button
            onClick={() => setActiveUser("marcin")}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
              activeUser === "marcin"
                ? "bg-blue-500 text-white"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Marcin
          </button>
          <button
            onClick={() => setActiveUser("patrycja")}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
              activeUser === "patrycja"
                ? "bg-emerald-500 text-white"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Patrycja
          </button>
        </div>
        <button
          onClick={() => setShowBothCalendars(!showBothCalendars)}
          className={`px-3 py-2 rounded-xl text-sm font-medium transition-all border ${
            showBothCalendars
              ? "bg-secondary border-primary/50 text-foreground"
              : "bg-card border-border text-muted-foreground"
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
          
          return (
            <div 
              key={date.toISOString()} 
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
                    setShowAddModal(true)
                  }}
                  className="flex-1 py-2 text-emerald-600 hover:bg-emerald-500/10 transition-colors flex items-center justify-center gap-1 border-r border-border"
                >
                  <Plus className="size-3" />
                  <UtensilsCrossed className="size-3.5" />
                </button>
                <button
                  onClick={() => {
                    setSelectedDate(date)
                    setAddType("training")
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
          <div className="size-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
            <svg className="size-5" viewBox="0 0 24 24" fill="none">
              <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" fill="#4285F4"/>
              <path d="M12 6v6l4 2" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
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
                ? "bg-emerald-500/20 text-emerald-500" 
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
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50 p-4">
          <div className="bg-card rounded-2xl w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                {addType === "meal" ? (
                  <div className="size-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                    <UtensilsCrossed className="size-4 text-emerald-500" />
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

            <div className="p-4 flex flex-col gap-4">
              {/* Preset / Custom Toggle */}
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
                  Select {addType === "meal" ? "Dish" : "Workout"}
                </button>
                <button
                  onClick={() => {
                    setInputMode("custom")
                    setSelectedPreset(null)
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

              {/* Preset Selection */}
              {inputMode === "preset" && (
                <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
                  {(addType === "meal" ? presetDishes : presetWorkouts).map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => setSelectedPreset(preset.id)}
                      className={`p-3 rounded-xl text-left transition-all ${
                        selectedPreset === preset.id
                          ? addType === "meal" 
                            ? "bg-emerald-500/20 border border-emerald-500"
                            : "bg-primary/20 border border-primary"
                          : "bg-secondary border border-transparent hover:border-border"
                      }`}
                    >
                      <p className={`text-sm font-medium ${
                        selectedPreset === preset.id ? "text-foreground" : "text-foreground"
                      }`}>
                        {preset.name}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {preset.details}
                      </p>
                    </button>
                  ))}
                </div>
              )}

              {/* Custom Input */}
              {inputMode === "custom" && (
                <>
                  <input
                    type="text"
                    placeholder={addType === "meal" ? "e.g. Homemade pasta, Restaurant dinner..." : "e.g. Running, Swimming, Yoga..."}
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
                disabled={inputMode === "preset" ? !selectedPreset : !newEvent.title.trim()}
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

  // Sample data for import options
  const upcomingDays = [
    { day: 0, label: "Today", meals: ["Power Breakfast", "Lunch Bowl"] },
    { day: 1, label: "Tomorrow", meals: ["Protein Shake", "Chicken Salad"] },
    { day: 2, label: "Day 3", meals: ["Trail Mix Bites"] },
    { day: 3, label: "Day 4", meals: [] },
    { day: 4, label: "Day 5", meals: ["Grilled Salmon"] },
    { day: 5, label: "Day 6", meals: [] },
    { day: 6, label: "Day 7", meals: ["Power Breakfast"] },
  ]

  const dishesAndComponents = [
    { id: "d1", name: "Power Breakfast", type: "dish", category: "Light", subCategory: "Oats & Granola", ingredients: ["Eggs", "Oats", "Banana"], marcinServings: 1, patrycjaServings: 1 },
    { id: "d2", name: "Lunch Bowl", type: "dish", category: "Large", subCategory: "Salads & Veggies", ingredients: ["Chicken Breast", "Rice", "Broccoli", "Guacamole"], marcinServings: 2, patrycjaServings: 2 },
    { id: "d3", name: "Protein Shake", type: "dish", category: "Drinks", subCategory: "Shakes & Smoothies", ingredients: ["Banana", "Greek Yogurt", "Almonds"], marcinServings: 1, patrycjaServings: 1 },
    { id: "d4", name: "Trail Mix Bites", type: "dish", category: "Snacks", subCategory: "Sweet", ingredients: ["Almonds", "Oats"], marcinServings: 3, patrycjaServings: 2 },
    { id: "d5", name: "Grilled Salmon", type: "dish", category: "Large", subCategory: "Traditional", ingredients: ["Salmon", "Olive Oil", "Lemon"], marcinServings: 1, patrycjaServings: 1 },
    { id: "d6", name: "Chicken Salad", type: "dish", category: "Large", subCategory: "Salads & Veggies", ingredients: ["Chicken Breast", "Mixed Greens", "Tomato", "Dressing"], marcinServings: 2, patrycjaServings: 2 },
    { id: "c1", name: "Guacamole", type: "component", ingredients: ["Avocado", "Tomato", "Onion", "Lime juice"], marcinServings: 2, patrycjaServings: 2 },
    { id: "c2", name: "Scrambled Eggs", type: "component", ingredients: ["Eggs", "Butter", "Salt"], marcinServings: 1, patrycjaServings: 1 },
    { id: "c3", name: "Tomato Sauce", type: "component", ingredients: ["Tomato", "Onion", "Garlic", "Olive Oil"], marcinServings: 4, patrycjaServings: 4 },
    { id: "c4", name: "Pesto", type: "component", ingredients: ["Basil", "Pine Nuts", "Parmesan", "Olive Oil"], marcinServings: 3, patrycjaServings: 3 },
  ]

  const dishCategories = ["All", "Large", "Light", "Snacks", "Drinks"]
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
    <div className="flex flex-col gap-4">
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
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 flex items-center gap-3">
          <AlertTriangle className="size-5 text-amber-500 shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-foreground font-medium">Planner has been edited</p>
            <p className="text-xs text-muted-foreground">Update planner items? Manual items won&apos;t change.</p>
          </div>
          <button
            onClick={() => {
              setImportMode("days")
              setShowImportModal(true)
            }}
            className="px-3 py-1.5 rounded-lg bg-amber-500 text-white text-xs font-medium flex items-center gap-1"
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
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50 p-4">
          <div className="bg-card rounded-2xl w-full max-w-md overflow-hidden max-h-[80vh] flex flex-col">
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
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50 p-4">
          <div className="bg-card rounded-2xl w-full max-w-md overflow-hidden max-h-[80vh] flex flex-col">
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
                  {dishCategories.map((cat) => (
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
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50 p-4">
          <div className="bg-card rounded-2xl w-full max-w-md overflow-hidden max-h-[85vh] flex flex-col">
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
                        <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-500 text-[9px] font-medium">
                          M:{dish.marcinServings || 1}
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-500 text-[9px] font-medium">
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
                      <div className={`mt-2 text-xs ${coversOccasions >= count ? "text-emerald-500" : "text-amber-500"}`}>
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
