"use client"

import { useState } from "react"
import { Calendar, ShoppingCart, ChevronLeft, ChevronRight, Plus, Check, X } from "lucide-react"

type SubTab = "calendar" | "shopping"

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

function CalendarView() {
  const [currentMonth] = useState("January 2025")
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
  const dates = Array.from({ length: 31 }, (_, i) => i + 1)
  const today = 15

  const events = [
    { day: 15, title: "Leg Day", time: "7:00 AM", color: "bg-primary" },
    { day: 15, title: "Meal Prep", time: "2:00 PM", color: "bg-blue-500" },
    { day: 16, title: "Rest Day", time: "All day", color: "bg-orange-500" },
  ]

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-card rounded-2xl p-4 border border-border">
        <div className="flex items-center justify-between mb-4">
          <button className="p-2 rounded-lg hover:bg-secondary transition-colors">
            <ChevronLeft className="size-5 text-muted-foreground" />
          </button>
          <h3 className="font-semibold text-foreground">{currentMonth}</h3>
          <button className="p-2 rounded-lg hover:bg-secondary transition-colors">
            <ChevronRight className="size-5 text-muted-foreground" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-2">
          {days.map((day) => (
            <div key={day} className="text-center text-xs text-muted-foreground py-2">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {dates.slice(0, 28).map((date) => (
            <button
              key={date}
              className={`aspect-square rounded-lg text-sm font-medium flex items-center justify-center transition-all ${
                date === today
                  ? "bg-primary text-primary-foreground"
                  : events.some((e) => e.day === date)
                  ? "bg-primary/20 text-primary"
                  : "text-foreground hover:bg-secondary"
              }`}
            >
              {date}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-base font-semibold mb-3">Today&apos;s Schedule</h3>
        <div className="flex flex-col gap-2">
          {events
            .filter((e) => e.day === today)
            .map((event, i) => (
              <div
                key={i}
                className="bg-card rounded-xl p-4 border border-border flex items-center gap-3"
              >
                <div className={`w-1 h-10 rounded-full ${event.color}`} />
                <div className="flex-1">
                  <h4 className="font-medium text-foreground">{event.title}</h4>
                  <p className="text-sm text-muted-foreground">{event.time}</p>
                </div>
              </div>
            ))}
        </div>
      </div>

      <div className="bg-card rounded-2xl p-4 border border-border">
        <div className="flex items-center gap-2 mb-3">
          <div className="size-6 rounded-full bg-red-500/20 flex items-center justify-center">
            <span className="text-xs">G</span>
          </div>
          <span className="text-sm text-muted-foreground">Google Calendar</span>
          <span className="ml-auto text-xs text-primary">Connected</span>
        </div>
        <p className="text-xs text-muted-foreground">
          View-only sync enabled. Your Google events appear automatically.
        </p>
      </div>
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
