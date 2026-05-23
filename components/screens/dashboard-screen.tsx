"use client"

import { useUser } from "@/lib/user-context"
import { Droplets, Pill, Plus, Utensils } from "lucide-react"

function ProgressRing({ 
  value, 
  max, 
  color, 
  label, 
  unit,
  size = 80 
}: { 
  value: number
  max: number
  color: string
  label: string
  unit: string
  size?: number
}) {
  const radius = (size - 8) / 2
  const circumference = 2 * Math.PI * radius
  const progress = Math.min(value / max, 1)
  const strokeDashoffset = circumference * (1 - progress)

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="transform -rotate-90" width={size} height={size}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="6"
            className="text-secondary"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-700 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-sm font-semibold text-foreground">{value}</span>
          <span className="text-[9px] text-muted-foreground">{unit}</span>
        </div>
      </div>
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
    </div>
  )
}

const userData = {
  patrycja: {
    calories: { current: 1420, target: 1800 },
    protein: { current: 85, target: 120 },
    carbs: { current: 140, target: 180 },
    fats: { current: 45, target: 60 },
    water: 1500,
    supplements: [
      { name: "Vitamin D", taken: true },
      { name: "Omega-3", taken: false },
      { name: "Magnesium", taken: true },
    ],
  },
  marcin: {
    calories: { current: 2100, target: 2800 },
    protein: { current: 145, target: 180 },
    carbs: { current: 220, target: 280 },
    fats: { current: 70, target: 90 },
    water: 2000,
    supplements: [
      { name: "Creatine", taken: true },
      { name: "Vitamin D", taken: true },
      { name: "Zinc", taken: false },
    ],
  },
}

export function DashboardScreen() {
  const { activeUser } = useUser()
  const data = userData[activeUser]

  return (
    <div className="flex flex-col gap-6 pb-4">
      <div>
        <h2 className="text-lg font-semibold mb-4">Daily Progress</h2>
        <div className="bg-card rounded-2xl p-5 border border-border">
          <div className="grid grid-cols-4 gap-4">
            <ProgressRing
              value={data.calories.current}
              max={data.calories.target}
              color="oklch(0.75 0.18 145)"
              label="Calories"
              unit="kcal"
            />
            <ProgressRing
              value={data.protein.current}
              max={data.protein.target}
              color="oklch(0.65 0.15 200)"
              label="Protein"
              unit="g"
            />
            <ProgressRing
              value={data.carbs.current}
              max={data.carbs.target}
              color="oklch(0.70 0.20 50)"
              label="Carbs"
              unit="g"
            />
            <ProgressRing
              value={data.fats.current}
              max={data.fats.target}
              color="oklch(0.60 0.18 280)"
              label="Fats"
              unit="g"
            />
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-3 gap-3">
          <button className="flex flex-col items-center gap-2 bg-card rounded-2xl p-4 border border-border active:scale-95 transition-transform">
            <div className="size-12 rounded-full bg-blue-500/20 flex items-center justify-center">
              <Droplets className="size-6 text-blue-400" />
            </div>
            <span className="text-xs font-medium text-foreground">Water</span>
            <span className="text-[10px] text-muted-foreground">+250ml</span>
          </button>

          <button className="flex flex-col items-center gap-2 bg-card rounded-2xl p-4 border border-border active:scale-95 transition-transform">
            <div className="size-12 rounded-full bg-primary/20 flex items-center justify-center">
              <Utensils className="size-6 text-primary" />
            </div>
            <span className="text-xs font-medium text-foreground">Log Meal</span>
            <span className="text-[10px] text-muted-foreground">Add entry</span>
          </button>

          <button className="flex flex-col items-center gap-2 bg-card rounded-2xl p-4 border border-border active:scale-95 transition-transform">
            <div className="size-12 rounded-full bg-orange-500/20 flex items-center justify-center">
              <Pill className="size-6 text-orange-400" />
            </div>
            <span className="text-xs font-medium text-foreground">Supps</span>
            <span className="text-[10px] text-muted-foreground">Check off</span>
          </button>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4">Supplements</h2>
        <div className="bg-card rounded-2xl p-4 border border-border">
          <div className="flex flex-col gap-3">
            {data.supplements.map((supp, i) => (
              <label key={i} className="flex items-center gap-3 cursor-pointer">
                <div className={`size-5 rounded-md border-2 flex items-center justify-center transition-colors ${
                  supp.taken 
                    ? "bg-primary border-primary" 
                    : "border-muted-foreground"
                }`}>
                  {supp.taken && (
                    <svg className="size-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <span className={`text-sm ${supp.taken ? "text-muted-foreground line-through" : "text-foreground"}`}>
                  {supp.name}
                </span>
              </label>
            ))}
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4">Water Intake</h2>
        <div className="bg-card rounded-2xl p-4 border border-border">
          <div className="flex items-center justify-between mb-3">
            <span className="text-2xl font-bold text-foreground">{data.water}ml</span>
            <span className="text-sm text-muted-foreground">/ {activeUser === "patrycja" ? "2000" : "3000"}ml</span>
          </div>
          <div className="h-3 bg-secondary rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-400 rounded-full transition-all duration-500"
              style={{ width: `${(data.water / (activeUser === "patrycja" ? 2000 : 3000)) * 100}%` }}
            />
          </div>
          <button className="w-full mt-4 py-3 rounded-xl bg-secondary text-foreground font-medium flex items-center justify-center gap-2 active:scale-[0.98] transition-transform">
            <Plus className="size-4" />
            Add 250ml
          </button>
        </div>
      </div>
    </div>
  )
}
