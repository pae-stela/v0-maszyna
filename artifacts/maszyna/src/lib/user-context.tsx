

import { createContext, useContext, useState, type ReactNode } from "react"

export type User = "patrycja" | "marcin"

// Meal Log Types
export interface MealLogItem {
  id: string
  name: string
  grams: number
  calories: number
  protein: number
  carbs: number
  fats: number
  fiber: number
}

export interface MealLog {
  id: string
  user: User
  date: string // ISO date
  time: string // HH:MM
  type: "breakfast" | "lunch" | "dinner" | "snack"
  items: MealLogItem[]
  totalCalories: number
  totalProtein: number
  totalCarbs: number
  totalFats: number
  totalFiber: number
  notes?: string
}

// Workout Log Types
export interface WorkoutSetLog {
  reps: number
  weight: string
  difficulty: number // 1-5
}

export interface WorkoutExerciseLog {
  exerciseId: string
  name: string
  sets: WorkoutSetLog[]
}

export interface WorkoutLog {
  id: string
  user: User
  date: string // ISO date
  startTime: string // HH:MM
  endTime: string // HH:MM
  planName: string
  exercises: WorkoutExerciseLog[]
  totalSets: number
  totalReps: number
  estimatedCalories: number
  notes?: string
}

// Step Log Types
export interface StepLog {
  date: string // ISO date
  user: User
  steps: number
}

interface UserContextType {
  activeUser: User
  setActiveUser: (user: User) => void
  mealLogs: MealLog[]
  addMealLog: (log: MealLog) => void
  workoutLogs: WorkoutLog[]
  addWorkoutLog: (log: WorkoutLog) => void
  stepLogs: StepLog[]
  updateSteps: (date: string, steps: number) => void
  getTodaySteps: () => number
  getWeeklyAvgSteps: () => number
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({ children }: { children: ReactNode }) {
  const [activeUser, setActiveUser] = useState<User>("patrycja")
  const [mealLogs, setMealLogs] = useState<MealLog[]>([])
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLog[]>([])
  const [stepLogs, setStepLogs] = useState<StepLog[]>([])

  const addMealLog = (log: MealLog) => {
    setMealLogs(prev => [log, ...prev])
  }

  const addWorkoutLog = (log: WorkoutLog) => {
    setWorkoutLogs(prev => [log, ...prev])
  }

  const updateSteps = (date: string, steps: number) => {
    setStepLogs(prev => {
      const existing = prev.findIndex(s => s.date === date && s.user === activeUser)
      if (existing >= 0) {
        const updated = [...prev]
        updated[existing] = { ...updated[existing], steps }
        return updated
      }
      return [...prev, { date, user: activeUser, steps }]
    })
  }

  const getTodaySteps = () => {
    const todayDate = new Date().toISOString().split('T')[0]
    return stepLogs.find(s => s.date === todayDate && s.user === activeUser)?.steps || 0
  }

  const getWeeklyAvgSteps = () => {
    const userLogs = stepLogs.filter(s => s.user === activeUser)
    if (userLogs.length === 0) return 0
    const total = userLogs.reduce((sum, s) => sum + s.steps, 0)
    return Math.round(total / userLogs.length)
  }

  return (
    <UserContext.Provider value={{ 
      activeUser, 
      setActiveUser, 
      mealLogs, 
      addMealLog,
      workoutLogs,
      addWorkoutLog,
      stepLogs,
      updateSteps,
      getTodaySteps,
      getWeeklyAvgSteps
    }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider")
  }
  return context
}
