"use client"

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

interface UserContextType {
  activeUser: User
  setActiveUser: (user: User) => void
  mealLogs: MealLog[]
  addMealLog: (log: MealLog) => void
  workoutLogs: WorkoutLog[]
  addWorkoutLog: (log: WorkoutLog) => void
}

const UserContext = createContext<UserContextType | undefined>(undefined)

// Sample data for demonstration
const sampleMealLogs: MealLog[] = [
  {
    id: "m1",
    user: "patrycja",
    date: new Date().toISOString().split('T')[0],
    time: "08:30",
    type: "breakfast",
    items: [
      { id: "i1", name: "Oatmeal", grams: 80, calories: 304, protein: 10, carbs: 54, fats: 5, fiber: 8 },
      { id: "i2", name: "Banana", grams: 120, calories: 107, protein: 1, carbs: 27, fats: 0, fiber: 3 },
      { id: "i3", name: "Greek Yogurt", grams: 150, calories: 146, protein: 15, carbs: 6, fats: 7, fiber: 0 },
    ],
    totalCalories: 557,
    totalProtein: 26,
    totalCarbs: 87,
    totalFats: 12,
    totalFiber: 11,
  },
  {
    id: "m2",
    user: "patrycja",
    date: new Date().toISOString().split('T')[0],
    time: "13:00",
    type: "lunch",
    items: [
      { id: "i4", name: "Chicken Breast", grams: 150, calories: 248, protein: 46, carbs: 0, fats: 5, fiber: 0 },
      { id: "i5", name: "Brown Rice", grams: 150, calories: 166, protein: 4, carbs: 35, fats: 1, fiber: 2 },
      { id: "i6", name: "Broccoli", grams: 100, calories: 34, protein: 3, carbs: 7, fats: 0, fiber: 3 },
    ],
    totalCalories: 448,
    totalProtein: 53,
    totalCarbs: 42,
    totalFats: 6,
    totalFiber: 5,
  },
  {
    id: "m3",
    user: "marcin",
    date: new Date().toISOString().split('T')[0],
    time: "07:45",
    type: "breakfast",
    items: [
      { id: "i7", name: "Eggs", grams: 200, calories: 286, protein: 24, carbs: 2, fats: 20, fiber: 0 },
      { id: "i8", name: "Toast", grams: 60, calories: 158, protein: 5, carbs: 30, fats: 2, fiber: 2 },
      { id: "i9", name: "Avocado", grams: 100, calories: 160, protein: 2, carbs: 9, fats: 15, fiber: 7 },
    ],
    totalCalories: 604,
    totalProtein: 31,
    totalCarbs: 41,
    totalFats: 37,
    totalFiber: 9,
  },
]

const sampleWorkoutLogs: WorkoutLog[] = [
  {
    id: "w1",
    user: "patrycja",
    date: new Date().toISOString().split('T')[0],
    startTime: "10:00",
    endTime: "11:15",
    planName: "Push Day",
    exercises: [
      { exerciseId: "e1", name: "Bench Press", sets: [
        { reps: 10, weight: "40kg", difficulty: 3 },
        { reps: 10, weight: "40kg", difficulty: 3 },
        { reps: 8, weight: "40kg", difficulty: 4 },
      ]},
      { exerciseId: "e2", name: "Incline DB Press", sets: [
        { reps: 12, weight: "12kg", difficulty: 2 },
        { reps: 10, weight: "12kg", difficulty: 3 },
        { reps: 10, weight: "12kg", difficulty: 4 },
      ]},
      { exerciseId: "e3", name: "Cable Flyes", sets: [
        { reps: 12, weight: "10kg", difficulty: 2 },
        { reps: 12, weight: "10kg", difficulty: 3 },
        { reps: 10, weight: "10kg", difficulty: 4 },
      ]},
    ],
    totalSets: 9,
    totalReps: 94,
    estimatedCalories: 185,
  },
  {
    id: "w2",
    user: "marcin",
    date: new Date(Date.now() - 86400000).toISOString().split('T')[0], // yesterday
    startTime: "18:00",
    endTime: "19:30",
    planName: "Pull Day",
    exercises: [
      { exerciseId: "e5", name: "Pull-ups", sets: [
        { reps: 10, weight: "BW", difficulty: 3 },
        { reps: 8, weight: "BW", difficulty: 4 },
        { reps: 8, weight: "BW", difficulty: 4 },
        { reps: 6, weight: "BW", difficulty: 5 },
      ]},
      { exerciseId: "e6", name: "Barbell Rows", sets: [
        { reps: 10, weight: "60kg", difficulty: 2 },
        { reps: 10, weight: "60kg", difficulty: 3 },
        { reps: 8, weight: "60kg", difficulty: 4 },
      ]},
    ],
    totalSets: 7,
    totalReps: 60,
    estimatedCalories: 220,
  },
]

export function UserProvider({ children }: { children: ReactNode }) {
  const [activeUser, setActiveUser] = useState<User>("patrycja")
  const [mealLogs, setMealLogs] = useState<MealLog[]>(sampleMealLogs)
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLog[]>(sampleWorkoutLogs)

  const addMealLog = (log: MealLog) => {
    setMealLogs(prev => [log, ...prev])
  }

  const addWorkoutLog = (log: WorkoutLog) => {
    setWorkoutLogs(prev => [log, ...prev])
  }

  return (
    <UserContext.Provider value={{ 
      activeUser, 
      setActiveUser, 
      mealLogs, 
      addMealLog,
      workoutLogs,
      addWorkoutLog
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
