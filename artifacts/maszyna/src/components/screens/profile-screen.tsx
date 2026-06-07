
import { getT } from "@/lib/i18n";
import { useState } from "react"
import { useUser } from "@/lib/user-context"
import { useAuth } from "@/lib/auth-context"
import { 
  TrendingUp, TrendingDown, Minus, Ruler, Scale, Utensils, Dumbbell, 
  ChevronRight, Clock, Flame, Plus, Camera, Trophy, Zap, Target, 
  Calendar, Award, Star, Heart, CheckCircle2, Settings
} from "lucide-react"
import { SettingsModal, WhiteCat, BlackCat } from "@/components/top-bar"

type ProfileTab = "measurements" | "logs" | "achievements"

export function ProfileScreen() {
  const { activeUser, mealLogs, workoutLogs } = useUser()
  const { profile, partner } = useAuth()
  const [activeTab, setActiveTab] = useState<ProfileTab>("measurements")
  const [logsSubTab, setLogsSubTab] = useState<"meals" | "workouts">("meals")
  const [expandedLog, setExpandedLog] = useState<string | null>(null)
  const [showAddMeasurement, setShowAddMeasurement] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  const userMealLogs = mealLogs.filter(log => log.user === activeUser)
  const userWorkoutLogs = workoutLogs.filter(log => log.user === activeUser)

  // Measurement data (empty until user logs)
  const measurementData = {
    patrycja: {
      weight: { current: 0, previous: 0, unit: "kg", history: [] as number[] },
      measurements: [] as { id: string; label: string; current: number; previous: number; unit: string; history: number[] }[],
    },
    marcin: {
      weight: { current: 0, previous: 0, unit: "kg", history: [] as number[] },
      measurements: [] as { id: string; label: string; current: number; previous: number; unit: string; history: number[] }[],
    },
  }

  // Achievement data (empty until earned)
  const achievements = {
    patrycja: {
      currentStreak: 0,
      longestStreak: 0,
      totalMealsLogged: 0,
      totalWorkoutsLogged: 0,
      badges: [] as { id: string; name: string; description: string; icon: typeof Utensils; unlocked: boolean; date?: string; progress?: number; target?: number }[],
    },
    marcin: {
      currentStreak: 0,
      longestStreak: 0,
      totalMealsLogged: 0,
      totalWorkoutsLogged: 0,
      badges: [] as { id: string; name: string; description: string; icon: typeof Utensils; unlocked: boolean; date?: string; progress?: number; target?: number }[],
    },
  }

  const data = measurementData[activeUser]
  const userAchievements = achievements[activeUser]
  const weightChange = data.weight.current - data.weight.previous
  const weightTrend = weightChange > 0 ? "up" : weightChange < 0 ? "down" : "stable"

  // Analytics calculations
  const totalCaloriesThisWeek = userMealLogs
    .filter(log => {
      const logDate = new Date(log.date)
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      return logDate >= weekAgo
    })
    .reduce((sum, log) => sum + log.totalCalories, 0)

  const avgCaloriesPerDay = Math.round(totalCaloriesThisWeek / 7)
  const totalProteinThisWeek = userMealLogs
    .filter(log => {
      const logDate = new Date(log.date)
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      return logDate >= weekAgo
    })
    .reduce((sum, log) => sum + log.totalProtein, 0)

  const renderMiniChart = (history: number[], color: string) => {
    const min = Math.min(...history)
    const max = Math.max(...history)
    const range = max - min || 1
    
    return (
      <svg className="w-16 h-8" viewBox="0 0 64 32" preserveAspectRatio="none">
        <path
          d={`M 0,${32 - ((history[0] - min) / range) * 28} ${history.map((v, i) => 
            `L ${(i / (history.length - 1)) * 64},${32 - ((v - min) / range) * 28}`
          ).join(' ')}`}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    )
  }

  return (
    <div className="flex flex-col gap-4 pb-24">
      {/* Profile Header */}
      <div className="flex items-center justify-between -mt-2 mb-2">
        <div className="flex items-center gap-3">
          <div className={`size-12 rounded-full flex items-center justify-center ${
            activeUser === "patrycja" ? "bg-sage" : "bg-navy"
          }`}>
            {activeUser === "patrycja" ? <WhiteCat /> : <BlackCat />}
          </div>
          <div>
            <p className="text-lg font-semibold text-foreground capitalize">{profile?.name || activeUser}</p>
            <p className="text-xs text-muted-foreground">Member since Jan 2024</p>
          </div>
        </div>
        <button 
          onClick={() => setShowSettings(true)}
          className="p-2.5 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors"
        >
          <Settings className="size-5 text-foreground" />
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 p-1 bg-secondary rounded-xl">
        {[
          { id: "measurements" as const, label: "Body", icon: Scale },
          { id: "logs" as const, label: "Logs", icon: Calendar },
          { id: "achievements" as const, label: "Badges", icon: Trophy },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1.5 ${
              activeTab === tab.id
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground"
            }`}
          >
            <tab.icon className="size-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Measurements Tab */}
      {activeTab === "measurements" && (
        <div className="flex flex-col gap-4">
          {/* Weight Card */}
          <div className="bg-card rounded-2xl p-4 border border-border">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="size-9 rounded-xl bg-primary/20 flex items-center justify-center">
                  <Scale className="size-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Current Weight</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-foreground">{data.weight.current}</span>
                    <span className="text-sm text-muted-foreground">{data.weight.unit}</span>
                  </div>
                </div>
              </div>
              <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                weightTrend === "up" 
                  ? "bg-terracotta/20 text-red-400" 
                  : weightTrend === "down"
                  ? "bg-sage/20 text-sage/70"
                  : "bg-secondary text-muted-foreground"
              }`}>
                {weightTrend === "up" ? (
                  <TrendingUp className="size-3" />
                ) : weightTrend === "down" ? (
                  <TrendingDown className="size-3" />
                ) : (
                  <Minus className="size-3" />
                )}
                {Math.abs(weightChange).toFixed(1)}kg
              </div>
            </div>

            {/* Weight Chart */}
            <div className="h-20 bg-secondary/50 rounded-xl p-3 relative overflow-hidden mb-3">
              <svg className="w-full h-full" viewBox="0 0 100 50" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="weightGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="oklch(0.75 0.18 145)" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="oklch(0.75 0.18 145)" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path
                  d={`M 0,${50 - ((data.weight.history[0] - Math.min(...data.weight.history)) / (Math.max(...data.weight.history) - Math.min(...data.weight.history) + 0.1)) * 40} ${data.weight.history.map((w, i) => 
                    `L ${(i / (data.weight.history.length - 1)) * 100},${50 - ((w - Math.min(...data.weight.history)) / (Math.max(...data.weight.history) - Math.min(...data.weight.history) + 0.1)) * 40}`
                  ).join(' ')} L 100,50 L 0,50 Z`}
                  fill="url(#weightGradient)"
                />
                <path
                  d={`M 0,${50 - ((data.weight.history[0] - Math.min(...data.weight.history)) / (Math.max(...data.weight.history) - Math.min(...data.weight.history) + 0.1)) * 40} ${data.weight.history.map((w, i) => 
                    `L ${(i / (data.weight.history.length - 1)) * 100},${50 - ((w - Math.min(...data.weight.history)) / (Math.max(...data.weight.history) - Math.min(...data.weight.history) + 0.1)) * 40}`
                  ).join(' ')}`}
                  fill="none"
                  stroke="oklch(0.75 0.18 145)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <div className="absolute bottom-1.5 left-3 right-3 flex justify-between text-[9px] text-muted-foreground">
                <span>7d ago</span>
                <span>Today</span>
              </div>
            </div>

            <button className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium active:scale-[0.98] transition-transform">
              Log Weight
            </button>
          </div>

          {/* Body Measurements */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-foreground">Measurements</h3>
              <button 
                onClick={() => setShowAddMeasurement(true)}
                className="text-xs text-primary font-medium flex items-center gap-1"
              >
                <Plus className="size-3.5" />
                Update
              </button>
            </div>
            
            <div className="flex flex-col gap-2">
              {data.measurements.map((m) => {
                const change = m.current - m.previous
                const trend = change > 0 ? "up" : change < 0 ? "down" : "stable"
                return (
                  <div key={m.id} className="bg-card rounded-xl p-3 border border-border flex items-center gap-3">
                    <div className="size-9 rounded-lg bg-secondary flex items-center justify-center">
                      <Ruler className="size-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{m.label}</p>
                      <div className="flex items-center gap-1.5">
                        <span className="text-lg font-bold text-foreground">{m.current}</span>
                        <span className="text-xs text-muted-foreground">{m.unit}</span>
                        {trend !== "stable" && (
                          <span className={`text-[10px] font-medium ${trend === "up" ? "text-sage" : "text-terracotta/70"}`}>
                            {trend === "up" ? "+" : ""}{change.toFixed(1)}
                          </span>
                        )}
                      </div>
                    </div>
                    {renderMiniChart(m.history, trend === "up" ? "#10b981" : trend === "down" ? "#f43f5e" : "#71717a")}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Progress Photos */}
          <div className="bg-card rounded-2xl p-4 border border-border">
            <div className="flex items-center gap-2 mb-3">
              <Camera className="size-5 text-muted-foreground" />
              <h3 className="font-semibold text-foreground">Progress Photos</h3>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              Track your visual transformation over time
            </p>
            <button className="w-full py-2.5 rounded-xl bg-secondary text-foreground text-sm font-medium active:scale-[0.98] transition-transform">
              Add Photo
            </button>
          </div>
        </div>
      )}

      {/* Logs Tab */}
      {activeTab === "logs" && (
        <div className="flex flex-col gap-4">
          {/* Weekly Analytics Summary */}
          <div className="bg-card rounded-2xl p-4 border border-border">
            <h3 className="font-semibold text-foreground mb-3">This Week</h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-secondary/50 rounded-xl p-3 text-center">
                <p className="text-xl font-bold text-foreground">{avgCaloriesPerDay}</p>
                <p className="text-[10px] text-muted-foreground">Avg Cal/Day</p>
              </div>
              <div className="bg-secondary/50 rounded-xl p-3 text-center">
                <p className="text-xl font-bold text-primary">{Math.round(totalProteinThisWeek / 7)}g</p>
                <p className="text-[10px] text-muted-foreground">Avg Protein</p>
              </div>
              <div className="bg-secondary/50 rounded-xl p-3 text-center">
                <p className="text-xl font-bold text-terracotta/70">{userWorkoutLogs.length}</p>
                <p className="text-[10px] text-muted-foreground">Workouts</p>
              </div>
            </div>
          </div>

          {/* Logs Sub-tabs */}
          <div className="flex gap-2 p-1 bg-secondary rounded-xl">
            <button
              onClick={() => setLogsSubTab("meals")}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1.5 ${
                logsSubTab === "meals"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground"
              }`}
            >
              <Utensils className="size-3.5" />
              Meals
            </button>
            <button
              onClick={() => setLogsSubTab("workouts")}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1.5 ${
                logsSubTab === "workouts"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground"
              }`}
            >
              <Dumbbell className="size-3.5" />
              Workouts
            </button>
          </div>

          {/* Meal Logs */}
          {logsSubTab === "meals" && (
            <div className="flex flex-col gap-2">
              {userMealLogs.length === 0 ? (
                <div className="bg-card rounded-2xl p-6 border border-dashed border-border text-center">
                  <Utensils className="size-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No meals logged yet</p>
                </div>
              ) : (
                userMealLogs.map((log) => (
                  <div key={log.id} className="bg-card rounded-xl border border-border overflow-hidden">
                    <button
                      onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                      className="w-full p-3 flex items-center gap-3 text-left"
                    >
                      <div className={`size-9 rounded-lg flex items-center justify-center ${
                        log.type === "breakfast" ? "bg-wheat/20 text-wheat" :
                        log.type === "lunch" ? "bg-navy/20 text-navy" :
                        log.type === "dinner" ? "bg-sand/20 text-sand" :
                        "bg-sage/20 text-sage"
                      }`}>
                        <Utensils className="size-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-foreground capitalize">{log.type}</span>
                          <span className="text-[10px] text-muted-foreground">{log.date}</span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Clock className="size-3 text-muted-foreground" />
                          <span className="text-[10px] text-muted-foreground">{log.time}</span>
                          <span className="text-[10px] text-muted-foreground">·</span>
                          <span className="text-[10px] font-medium text-primary">{log.totalCalories} kcal</span>
                        </div>
                      </div>
                      <ChevronRight className={`size-4 text-muted-foreground transition-transform ${expandedLog === log.id ? "rotate-90" : ""}`} />
                    </button>

                    {expandedLog === log.id && (
                      <div className="px-3 pb-3 border-t border-border pt-2">
                        <div className="grid grid-cols-4 gap-1.5 mb-2">
                          <div className="bg-secondary rounded-lg p-1.5 text-center">
                            <p className="text-[10px] font-semibold text-primary">{log.totalProtein}g</p>
                            <p className="text-[8px] text-muted-foreground">Protein</p>
                          </div>
                          <div className="bg-secondary rounded-lg p-1.5 text-center">
                            <p className="text-[10px] font-semibold text-wheat">{log.totalCarbs}g</p>
                            <p className="text-[8px] text-muted-foreground">Carbs</p>
                          </div>
                          <div className="bg-secondary rounded-lg p-1.5 text-center">
                            <p className="text-[10px] font-semibold text-terracotta/70">{log.totalFats}g</p>
                            <p className="text-[8px] text-muted-foreground">Fats</p>
                          </div>
                          <div className="bg-secondary rounded-lg p-1.5 text-center">
                            <p className="text-[10px] font-semibold text-sage">{log.totalFiber}g</p>
                            <p className="text-[8px] text-muted-foreground">Fiber</p>
                          </div>
                        </div>
                        <div className="flex flex-col gap-1">
                          {log.items.map((item) => (
                            <div key={item.id} className="flex items-center justify-between text-[10px]">
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
          {logsSubTab === "workouts" && (
            <div className="flex flex-col gap-2">
              {userWorkoutLogs.length === 0 ? (
                <div className="bg-card rounded-2xl p-6 border border-dashed border-border text-center">
                  <Dumbbell className="size-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No workouts logged yet</p>
                </div>
              ) : (
                userWorkoutLogs.map((log) => (
                  <div key={log.id} className="bg-card rounded-xl border border-border overflow-hidden">
                    <button
                      onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                      className="w-full p-3 flex items-center gap-3 text-left"
                    >
                      <div className="size-9 rounded-lg bg-primary/20 flex items-center justify-center">
                        <Dumbbell className="size-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-foreground">{log.planName}</span>
                          <span className="text-[10px] text-muted-foreground">{log.date}</span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Clock className="size-3 text-muted-foreground" />
                          <span className="text-[10px] text-muted-foreground">{log.startTime} - {log.endTime}</span>
                          <span className="text-[10px] text-muted-foreground">·</span>
                          <Flame className="size-3 text-terracotta/70" />
                          <span className="text-[10px] font-medium text-terracotta/70">{log.estimatedCalories}</span>
                        </div>
                      </div>
                      <ChevronRight className={`size-4 text-muted-foreground transition-transform ${expandedLog === log.id ? "rotate-90" : ""}`} />
                    </button>

                    {expandedLog === log.id && (
                      <div className="px-3 pb-3 border-t border-border pt-2">
                        <div className="grid grid-cols-3 gap-1.5 mb-2">
                          <div className="bg-secondary rounded-lg p-1.5 text-center">
                            <p className="text-[10px] font-semibold text-foreground">{log.exercises.length}</p>
                            <p className="text-[8px] text-muted-foreground">Exercises</p>
                          </div>
                          <div className="bg-secondary rounded-lg p-1.5 text-center">
                            <p className="text-[10px] font-semibold text-foreground">{log.totalSets}</p>
                            <p className="text-[8px] text-muted-foreground">Sets</p>
                          </div>
                          <div className="bg-secondary rounded-lg p-1.5 text-center">
                            <p className="text-[10px] font-semibold text-foreground">{log.totalReps}</p>
                            <p className="text-[8px] text-muted-foreground">Reps</p>
                          </div>
                        </div>
                        <div className="flex flex-col gap-1.5">
                          {log.exercises.map((exercise) => (
                            <div key={exercise.exerciseId} className="bg-secondary/50 rounded-lg p-2">
                              <p className="text-[10px] font-medium text-foreground mb-1">{exercise.name}</p>
                              <div className="flex flex-wrap gap-1">
                                {exercise.sets.map((set, i) => {
                                  const diffColors = ["bg-sage", "bg-navy", "bg-wheat", "bg-terracotta", "bg-terracotta"]
                                  return (
                                    <div key={i} className="flex items-center gap-0.5">
                                      <span className="text-[9px] text-muted-foreground">{set.reps}×{set.weight}</span>
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
      )}

      {/* Achievements Tab */}
      {activeTab === "achievements" && (
        <div className="flex flex-col gap-4">
          {/* Streak Card */}
          <div className="bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl p-4 border border-primary/20">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Zap className="size-5 text-primary" />
                  <span className="text-sm font-medium text-foreground">Current Streak</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-primary">{userAchievements.currentStreak}</span>
                  <span className="text-sm text-muted-foreground">days</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground mb-0.5">Best Streak</p>
                <p className="text-lg font-bold text-foreground">{userAchievements.longestStreak} days</p>
              </div>
            </div>
          </div>

          {/* Stats Summary */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-card rounded-xl p-3 border border-border text-center">
              <Utensils className="size-5 text-wheat mx-auto mb-1" />
              <p className="text-2xl font-bold text-foreground">{userAchievements.totalMealsLogged}</p>
              <p className="text-[10px] text-muted-foreground">Meals Logged</p>
            </div>
            <div className="bg-card rounded-xl p-3 border border-border text-center">
              <Dumbbell className="size-5 text-primary mx-auto mb-1" />
              <p className="text-2xl font-bold text-foreground">{userAchievements.totalWorkoutsLogged}</p>
              <p className="text-[10px] text-muted-foreground">Workouts</p>
            </div>
          </div>

          {/* Badges */}
          <div>
            <h3 className="font-semibold text-foreground mb-3">Badges</h3>
            <div className="grid grid-cols-2 gap-2">
              {userAchievements.badges.map((badge) => {
                const IconComponent = badge.icon
                return (
                  <div 
                    key={badge.id} 
                    className={`rounded-xl p-3 border ${
                      badge.unlocked 
                        ? "bg-card border-border" 
                        : "bg-secondary/30 border-dashed border-border"
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <div className={`size-10 rounded-xl flex items-center justify-center ${
                        badge.unlocked 
                          ? "bg-primary/20" 
                          : "bg-secondary"
                      }`}>
                        <IconComponent className={`size-5 ${badge.unlocked ? "text-primary" : "text-muted-foreground"}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-medium ${badge.unlocked ? "text-foreground" : "text-muted-foreground"}`}>
                          {badge.name}
                        </p>
                        <p className="text-[9px] text-muted-foreground leading-tight">
                          {badge.description}
                        </p>
                      </div>
                    </div>
                    {badge.unlocked ? (
                      <div className="flex items-center gap-1 mt-2">
                        <CheckCircle2 className="size-3 text-sage" />
                        <span className="text-[9px] text-sage">{badge.date}</span>
                      </div>
                    ) : (
                      <div className="mt-2">
                        <div className="flex items-center justify-between text-[9px] text-muted-foreground mb-1">
                          <span>Progress</span>
                          <span>{badge.progress}/{badge.target}</span>
                        </div>
                        <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary/50 rounded-full transition-all"
                            style={{ width: `${((badge.progress || 0) / (badge.target || 1)) * 100}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
    </div>
  )
}
