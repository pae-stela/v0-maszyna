"use client"

import { useUser } from "@/lib/user-context"
import { TrendingUp, TrendingDown, Minus, Ruler, Scale } from "lucide-react"

export function ProfileScreen() {
  const { activeUser } = useUser()

  const measurementData = {
    patrycja: {
      weight: { current: 58.5, previous: 59.2, unit: "kg" },
      measurements: [
        { label: "Chest", value: 88, unit: "cm" },
        { label: "Waist", value: 68, unit: "cm" },
        { label: "Hips", value: 94, unit: "cm" },
        { label: "Thigh", value: 54, unit: "cm" },
        { label: "Arm", value: 27, unit: "cm" },
      ],
      weightHistory: [60, 59.8, 59.5, 59.2, 58.9, 58.7, 58.5],
    },
    marcin: {
      weight: { current: 85.2, previous: 84.5, unit: "kg" },
      measurements: [
        { label: "Chest", value: 105, unit: "cm" },
        { label: "Waist", value: 84, unit: "cm" },
        { label: "Hips", value: 98, unit: "cm" },
        { label: "Thigh", value: 62, unit: "cm" },
        { label: "Arm", value: 38, unit: "cm" },
      ],
      weightHistory: [83, 83.5, 84, 84.2, 84.5, 85, 85.2],
    },
  }

  const data = measurementData[activeUser]
  const weightChange = data.weight.current - data.weight.previous
  const weightTrend = weightChange > 0 ? "up" : weightChange < 0 ? "down" : "stable"

  return (
    <div className="flex flex-col gap-6 pb-24">
      <div className="bg-card rounded-2xl p-5 border border-border">
        <div className="flex items-center gap-3 mb-4">
          <div className="size-12 rounded-full bg-primary/20 flex items-center justify-center">
            <Scale className="size-6 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Current Weight</h3>
            <p className="text-sm text-muted-foreground">Last updated today</p>
          </div>
        </div>

        <div className="flex items-end gap-3 mb-4">
          <span className="text-4xl font-bold text-foreground">{data.weight.current}</span>
          <span className="text-lg text-muted-foreground mb-1">{data.weight.unit}</span>
          <div className={`flex items-center gap-1 ml-auto px-2 py-1 rounded-full text-xs font-medium ${
            weightTrend === "up" 
              ? "bg-red-500/20 text-red-400" 
              : weightTrend === "down"
              ? "bg-green-500/20 text-green-400"
              : "bg-secondary text-muted-foreground"
          }`}>
            {weightTrend === "up" ? (
              <TrendingUp className="size-3" />
            ) : weightTrend === "down" ? (
              <TrendingDown className="size-3" />
            ) : (
              <Minus className="size-3" />
            )}
            {Math.abs(weightChange).toFixed(1)} {data.weight.unit}
          </div>
        </div>

        <div className="h-24 bg-secondary rounded-xl p-3 relative overflow-hidden">
          <svg className="w-full h-full" viewBox="0 0 100 50" preserveAspectRatio="none">
            <defs>
              <linearGradient id="weightGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="oklch(0.75 0.18 145)" stopOpacity="0.3" />
                <stop offset="100%" stopColor="oklch(0.75 0.18 145)" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path
              d={`M 0,${50 - ((data.weightHistory[0] - Math.min(...data.weightHistory)) / (Math.max(...data.weightHistory) - Math.min(...data.weightHistory) + 1)) * 40} ${data.weightHistory.map((w, i) => 
                `L ${(i / (data.weightHistory.length - 1)) * 100},${50 - ((w - Math.min(...data.weightHistory)) / (Math.max(...data.weightHistory) - Math.min(...data.weightHistory) + 1)) * 40}`
              ).join(' ')} L 100,50 L 0,50 Z`}
              fill="url(#weightGradient)"
            />
            <path
              d={`M 0,${50 - ((data.weightHistory[0] - Math.min(...data.weightHistory)) / (Math.max(...data.weightHistory) - Math.min(...data.weightHistory) + 1)) * 40} ${data.weightHistory.map((w, i) => 
                `L ${(i / (data.weightHistory.length - 1)) * 100},${50 - ((w - Math.min(...data.weightHistory)) / (Math.max(...data.weightHistory) - Math.min(...data.weightHistory) + 1)) * 40}`
              ).join(' ')}`}
              fill="none"
              stroke="oklch(0.75 0.18 145)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <div className="absolute bottom-2 left-3 right-3 flex justify-between text-[10px] text-muted-foreground">
            <span>7 days ago</span>
            <span>Today</span>
          </div>
        </div>

        <button className="w-full mt-4 py-3 rounded-xl bg-primary text-primary-foreground font-medium active:scale-[0.98] transition-transform">
          Log Weight
        </button>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Body Measurements</h3>
          <button className="text-sm text-primary font-medium">Update</button>
        </div>
        
        <div className="bg-card rounded-2xl border border-border overflow-hidden divide-y divide-border">
          {data.measurements.map((measurement, i) => (
            <div key={i} className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-full bg-secondary flex items-center justify-center">
                  <Ruler className="size-4 text-muted-foreground" />
                </div>
                <span className="font-medium text-foreground">{measurement.label}</span>
              </div>
              <div className="text-right">
                <span className="text-lg font-semibold text-foreground">{measurement.value}</span>
                <span className="text-sm text-muted-foreground ml-1">{measurement.unit}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-card rounded-2xl p-5 border border-border">
        <h3 className="font-semibold text-foreground mb-2">Progress Photos</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Track your visual transformation over time
        </p>
        <button className="w-full py-3 rounded-xl bg-secondary text-foreground font-medium flex items-center justify-center gap-2 active:scale-[0.98] transition-transform">
          Add Photo
        </button>
      </div>
    </div>
  )
}
