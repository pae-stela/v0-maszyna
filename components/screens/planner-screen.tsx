"use client"

import { useState } from "react"
import { Calendar, ShoppingCart, ChevronLeft, ChevronRight, Plus, Check, X, Dumbbell, UtensilsCrossed, ExternalLink } from "lucide-react"

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
  
  const [events, setEvents] = useState<PlannerEvent[]>([
    { id: "1", date: new Date(), title: "Leg Day", time: "7:00 AM", type: "training", details: "Squats, Lunges, Leg Press" },
    { id: "2", date: new Date(), title: "Power Breakfast", time: "8:30 AM", type: "meal", details: "Eggs, Oats, Banana" },
    { id: "3", date: new Date(), title: "Lunch Bowl", time: "1:00 PM", type: "meal", details: "Chicken, Rice, Broccoli" },
    { id: "4", date: new Date(Date.now() + 86400000), title: "Upper Body", time: "7:00 AM", type: "training" },
    { id: "5", date: new Date(Date.now() + 86400000), title: "Team Meeting", time: "10:00 AM", type: "google" },
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
    }
    setEvents([...events, event])
    setNewEvent({ title: "", time: "12:00", details: "" })
    setSelectedPreset(null)
    setInputMode("preset")
    setShowAddModal(false)
  }

  const getEventsForDate = (date: Date) => {
    return events.filter(e => isSameDay(e.date, date)).sort((a, b) => a.time.localeCompare(b.time))
  }

  const getEventColor = (type: EventType) => {
    switch (type) {
      case "training": return "bg-primary"
      case "meal": return "bg-emerald-500"
      case "google": return "bg-blue-500"
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
                      className={`rounded-lg p-2 text-white ${getEventColor(event.type)}`}
                    >
                      <div className="flex items-center gap-1.5">
                        {getEventIcon(event.type)}
                        <span className={`font-medium truncate ${viewMode === "week" ? "text-[10px]" : "text-xs"}`}>
                          {event.title}
                        </span>
                      </div>
                      <p className={`opacity-80 ${viewMode === "week" ? "text-[9px]" : "text-[10px]"}`}>
                        {event.time}
                      </p>
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
  const [items] = useState([
    { name: "Chicken breast", quantity: "1.5kg", checked: false, category: "Protein" },
    { name: "Greek yogurt", quantity: "1kg", checked: true, category: "Dairy" },
    { name: "Eggs", quantity: "30 pcs", checked: false, category: "Protein" },
    { name: "Broccoli", quantity: "500g", checked: false, category: "Vegetables" },
    { name: "Sweet potato", quantity: "1kg", checked: true, category: "Carbs" },
    { name: "Oats", quantity: "1kg", checked: false, category: "Carbs" },
    { name: "Olive oil", quantity: "500ml", checked: false, category: "Fats" },
  ])

  const categories = [...new Set(items.map((item) => item.category))]

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <input
          type="text"
          placeholder="Add item to list..."
          className="flex-1 bg-card rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground border border-border focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
        <button className="size-12 rounded-xl bg-primary text-primary-foreground flex items-center justify-center active:scale-95 transition-transform">
          <Plus className="size-5" />
        </button>
      </div>

      <div className="flex flex-col gap-4">
        {categories.map((category) => (
          <div key={category}>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              {category}
            </h4>
            <div className="bg-card rounded-2xl border border-border overflow-hidden divide-y divide-border">
              {items
                .filter((item) => item.category === category)
                .map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 p-4"
                  >
                    <button
                      className={`size-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                        item.checked
                          ? "bg-primary border-primary"
                          : "border-muted-foreground"
                      }`}
                    >
                      {item.checked && <Check className="size-3 text-primary-foreground" />}
                    </button>
                    <div className="flex-1">
                      <span className={`text-sm ${item.checked ? "text-muted-foreground line-through" : "text-foreground"}`}>
                        {item.name}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">{item.quantity}</span>
                    <button className="p-1 hover:bg-secondary rounded transition-colors">
                      <X className="size-4 text-muted-foreground" />
                    </button>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
