"use client"

import { useState } from "react"
import { useUser } from "@/lib/user-context"
import { TrendingUp, TrendingDown, Minus, Ruler, Scale, Utensils, Dumbbell, ChevronRight, Clock, Flame, X } from "lucide-react"

export function ProfileScreen() {
  const { activeUser, mealLogs, workoutLogs } = useUser()
  const [logsTab, setLogsTab] = useState<"meals" | "workouts">("meals")
  const [expandedLog, setExpandedLog] = useState<string | null>(null)

  const userMealLogs = mealLogs.filter(log => log.user === activeUser)
  const userWorkoutLogs = workoutLogs.filter(log => log.user === activeUser)

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

      {/* Activity Logs Section */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Activity Logs</h3>
        
        {/* Tab Toggle */}
        <div className="flex gap-2 p-1 bg-secondary rounded-xl mb-4">
          <button
            onClick={() => setLogsTab("meals")}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
              logsTab === "meals"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground"
            }`}
          >
            <Utensils className="size-4" />
            Meals
          </button>
          <button
            onClick={() => setLogsTab("workouts")}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
              logsTab === "workouts"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground"
            }`}
          >
            <Dumbbell className="size-4" />
            Workouts
          </button>
        </div>

        {/* Meal Logs */}
        {logsTab === "meals" && (
          <div className="flex flex-col gap-2">
            {userMealLogs.length === 0 ? (
              <div className="bg-card rounded-2xl p-6 border border-dashed border-border text-center">
                <p className="text-sm text-muted-foreground">No meals logged yet</p>
              </div>
            ) : (
              userMealLogs.map((log) => (
                <div key={log.id} className="bg-card rounded-2xl border border-border overflow-hidden">
                  <button
                    onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                    className="w-full p-4 flex items-center gap-3 text-left"
                  >
                    <div className={`size-10 rounded-xl flex items-center justify-center ${
                      log.type === "breakfast" ? "bg-amber-500/20 text-amber-500" :
                      log.type === "lunch" ? "bg-blue-500/20 text-blue-500" :
                      log.type === "dinner" ? "bg-purple-500/20 text-purple-500" :
                      "bg-emerald-500/20 text-emerald-500"
                    }`}>
                      <Utensils className="size-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground capitalize">{log.type}</span>
                        <span className="text-xs text-muted-foreground">{log.date}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Clock className="size-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">{log.time}</span>
                        <span className="text-xs text-muted-foreground">·</span>
                        <span className="text-xs font-medium text-primary">{log.totalCalories} kcal</span>
                      </div>
                    </div>
                    <ChevronRight className={`size-5 text-muted-foreground transition-transform ${expandedLog === log.id ? "rotate-90" : ""}`} />
                  </button>

                  {expandedLog === log.id && (
                    <div className="px-4 pb-4 border-t border-border pt-3">
                      {/* Macro Summary */}
                      <div className="grid grid-cols-4 gap-2 mb-3">
                        <div className="bg-secondary rounded-lg p-2 text-center">
                          <p className="text-xs font-semibold text-primary">{log.totalProtein}g</p>
                          <p className="text-[10px] text-muted-foreground">Protein</p>
                        </div>
                        <div className="bg-secondary rounded-lg p-2 text-center">
                          <p className="text-xs font-semibold text-amber-500">{log.totalCarbs}g</p>
                          <p className="text-[10px] text-muted-foreground">Carbs</p>
                        </div>
                        <div className="bg-secondary rounded-lg p-2 text-center">
                          <p className="text-xs font-semibold text-rose-400">{log.totalFats}g</p>
                          <p className="text-[10px] text-muted-foreground">Fats</p>
                        </div>
                        <div className="bg-secondary rounded-lg p-2 text-center">
                          <p className="text-xs font-semibold text-emerald-500">{log.totalFiber}g</p>
                          <p className="text-[10px] text-muted-foreground">Fiber</p>
                        </div>
                      </div>

                      {/* Items */}
                      <div className="flex flex-col gap-1.5">
                        {log.items.map((item) => (
                          <div key={item.id} className="flex items-center justify-between text-xs">
                            <span className="text-foreground">{item.name}</span>
                            <span className="text-muted-foreground">{item.grams}g · {item.calories} kcal</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Workout Logs */}
        {logsTab === "workouts" && (
          <div className="flex flex-col gap-2">
            {userWorkoutLogs.length === 0 ? (
              <div className="bg-card rounded-2xl p-6 border border-dashed border-border text-center">
                <p className="text-sm text-muted-foreground">No workouts logged yet</p>
              </div>
            ) : (
              userWorkoutLogs.map((log) => (
                <div key={log.id} className="bg-card rounded-2xl border border-border overflow-hidden">
                  <button
                    onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                    className="w-full p-4 flex items-center gap-3 text-left"
                  >
                    <div className="size-10 rounded-xl bg-primary/20 flex items-center justify-center">
                      <Dumbbell className="size-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">{log.planName}</span>
                        <span className="text-xs text-muted-foreground">{log.date}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Clock className="size-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">{log.startTime} - {log.endTime}</span>
                        <span className="text-xs text-muted-foreground">·</span>
                        <Flame className="size-3 text-orange-400" />
                        <span className="text-xs font-medium text-orange-400">{log.estimatedCalories} kcal</span>
                      </div>
                    </div>
                    <ChevronRight className={`size-5 text-muted-foreground transition-transform ${expandedLog === log.id ? "rotate-90" : ""}`} />
                  </button>

                  {expandedLog === log.id && (
                    <div className="px-4 pb-4 border-t border-border pt-3">
                      {/* Stats Summary */}
                      <div className="grid grid-cols-3 gap-2 mb-3">
                        <div className="bg-secondary rounded-lg p-2 text-center">
                          <p className="text-xs font-semibold text-foreground">{log.exercises.length}</p>
                          <p className="text-[10px] text-muted-foreground">Exercises</p>
                        </div>
                        <div className="bg-secondary rounded-lg p-2 text-center">
                          <p className="text-xs font-semibold text-foreground">{log.totalSets}</p>
                          <p className="text-[10px] text-muted-foreground">Sets</p>
                        </div>
                        <div className="bg-secondary rounded-lg p-2 text-center">
                          <p className="text-xs font-semibold text-foreground">{log.totalReps}</p>
                          <p className="text-[10px] text-muted-foreground">Reps</p>
                        </div>
                      </div>

                      {/* Exercises */}
                      <div className="flex flex-col gap-2">
                        {log.exercises.map((exercise) => (
                          <div key={exercise.exerciseId} className="bg-secondary/50 rounded-lg p-2.5">
                            <p className="text-xs font-medium text-foreground mb-1.5">{exercise.name}</p>
                            <div className="flex gap-1.5">
                              {exercise.sets.map((set, i) => {
                                const diffColors = ["bg-emerald-500", "bg-blue-500", "bg-amber-500", "bg-orange-500", "bg-red-500"]
                                return (
                                  <div key={i} className="flex items-center gap-1">
                                    <span className="text-[10px] text-muted-foreground">{set.reps}×{set.weight}</span>
                                    <span className={`size-1.5 rounded-full ${diffColors[set.difficulty - 1]}`} />
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
