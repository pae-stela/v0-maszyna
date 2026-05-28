

import { useState, useEffect } from "react"
import { useUser } from "@/lib/user-context"
import { Play, Plus, ChevronRight, Timer, Flame, Dumbbell, Search, X, Check, Link2, Trash2, Pause, Square } from "lucide-react"

type SubTab = "journal" | "plans" | "exercises"

interface Exercise {
  id: string
  name: string
  muscleGroup: string
  equipment: string
  type: "compound" | "isolation" | "cardio" | "flexibility"
  antagonistPairsWith?: string[] // muscle groups it pairs well with
  caloriesPerMinute?: number // for cardio/flexibility activities
  isTimeBased?: boolean // true for duration-based activities
}

interface PlanExercise {
  exerciseId: string
  exercise: Exercise
  sets: number
  reps: number
  weight: string
  duration?: number // minutes, for time-based exercises
  pairedWith?: string // exerciseId of antagonist pair
}

const exerciseLibrary: Exercise[] = [
  // Chest
  { id: "e1", name: "Bench Press", muscleGroup: "Chest", equipment: "Barbell", type: "compound", antagonistPairsWith: ["Back"] },
  { id: "e2", name: "Incline DB Press", muscleGroup: "Chest", equipment: "Dumbbells", type: "compound", antagonistPairsWith: ["Back"] },
  { id: "e3", name: "Cable Flyes", muscleGroup: "Chest", equipment: "Cable", type: "isolation", antagonistPairsWith: ["Back"] },
  { id: "e4", name: "Dips", muscleGroup: "Chest", equipment: "Bodyweight", type: "compound", antagonistPairsWith: ["Back"] },
  // Back
  { id: "e5", name: "Pull-ups", muscleGroup: "Back", equipment: "Bodyweight", type: "compound", antagonistPairsWith: ["Chest"] },
  { id: "e6", name: "Barbell Rows", muscleGroup: "Back", equipment: "Barbell", type: "compound", antagonistPairsWith: ["Chest"] },
  { id: "e7", name: "Lat Pulldown", muscleGroup: "Back", equipment: "Cable", type: "compound", antagonistPairsWith: ["Chest"] },
  { id: "e8", name: "Face Pulls", muscleGroup: "Back", equipment: "Cable", type: "isolation", antagonistPairsWith: ["Chest", "Shoulders"] },
  // Shoulders
  { id: "e9", name: "Overhead Press", muscleGroup: "Shoulders", equipment: "Barbell", type: "compound", antagonistPairsWith: ["Back"] },
  { id: "e10", name: "Lateral Raises", muscleGroup: "Shoulders", equipment: "Dumbbells", type: "isolation", antagonistPairsWith: ["Back"] },
  { id: "e11", name: "Front Raises", muscleGroup: "Shoulders", equipment: "Dumbbells", type: "isolation", antagonistPairsWith: ["Back"] },
  // Arms
  { id: "e12", name: "Bicep Curls", muscleGroup: "Biceps", equipment: "Dumbbells", type: "isolation", antagonistPairsWith: ["Triceps"] },
  { id: "e13", name: "Hammer Curls", muscleGroup: "Biceps", equipment: "Dumbbells", type: "isolation", antagonistPairsWith: ["Triceps"] },
  { id: "e14", name: "Tricep Pushdowns", muscleGroup: "Triceps", equipment: "Cable", type: "isolation", antagonistPairsWith: ["Biceps"] },
  { id: "e15", name: "Skull Crushers", muscleGroup: "Triceps", equipment: "Barbell", type: "isolation", antagonistPairsWith: ["Biceps"] },
  // Legs
  { id: "e16", name: "Squats", muscleGroup: "Quads", equipment: "Barbell", type: "compound", antagonistPairsWith: ["Hamstrings"] },
  { id: "e17", name: "Leg Press", muscleGroup: "Quads", equipment: "Machine", type: "compound", antagonistPairsWith: ["Hamstrings"] },
  { id: "e18", name: "Romanian Deadlifts", muscleGroup: "Hamstrings", equipment: "Barbell", type: "compound", antagonistPairsWith: ["Quads"] },
  { id: "e19", name: "Leg Curls", muscleGroup: "Hamstrings", equipment: "Machine", type: "isolation", antagonistPairsWith: ["Quads"] },
  { id: "e20", name: "Calf Raises", muscleGroup: "Calves", equipment: "Machine", type: "isolation" },
  // Core
  { id: "e21", name: "Planks", muscleGroup: "Core", equipment: "Bodyweight", type: "isolation" },
  { id: "e22", name: "Cable Crunches", muscleGroup: "Core", equipment: "Cable", type: "isolation" },
  { id: "e23", name: "Hanging Leg Raises", muscleGroup: "Core", equipment: "Bodyweight", type: "isolation" },
  // Cardio
  { id: "e24", name: "Running", muscleGroup: "Cardio", equipment: "Treadmill/Outdoor", type: "cardio", caloriesPerMinute: 10, isTimeBased: true },
  { id: "e25", name: "Swimming", muscleGroup: "Cardio", equipment: "Pool", type: "cardio", caloriesPerMinute: 8, isTimeBased: true },
  { id: "e26", name: "Rowing Machine", muscleGroup: "Cardio", equipment: "Machine", type: "cardio", caloriesPerMinute: 7, isTimeBased: true },
  { id: "e27", name: "Cycling", muscleGroup: "Cardio", equipment: "Bike/Stationary", type: "cardio", caloriesPerMinute: 6, isTimeBased: true },
  { id: "e28", name: "Jump Rope", muscleGroup: "Cardio", equipment: "Jump Rope", type: "cardio", caloriesPerMinute: 12, isTimeBased: true },
  { id: "e29", name: "Stair Climber", muscleGroup: "Cardio", equipment: "Machine", type: "cardio", caloriesPerMinute: 9, isTimeBased: true },
  // Flexibility & Recovery
  { id: "e30", name: "Yoga Flow", muscleGroup: "Flexibility", equipment: "Mat", type: "flexibility", caloriesPerMinute: 3, isTimeBased: true },
  { id: "e31", name: "Static Stretching", muscleGroup: "Flexibility", equipment: "None", type: "flexibility", caloriesPerMinute: 2, isTimeBased: true },
  { id: "e32", name: "Dynamic Stretching", muscleGroup: "Flexibility", equipment: "None", type: "flexibility", caloriesPerMinute: 3, isTimeBased: true },
  { id: "e33", name: "Foam Rolling", muscleGroup: "Flexibility", equipment: "Foam Roller", type: "flexibility", caloriesPerMinute: 2, isTimeBased: true },
  { id: "e34", name: "Pilates", muscleGroup: "Flexibility", equipment: "Mat", type: "flexibility", caloriesPerMinute: 4, isTimeBased: true },
]

export function WorkoutScreen() {
  const [subTab, setSubTab] = useState<SubTab>("journal")

  return (
    <div className="flex flex-col gap-4 pb-24">
      <div className="flex gap-1 p-1 bg-secondary rounded-xl">
        <button
          onClick={() => setSubTab("journal")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
            subTab === "journal"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground"
          }`}
        >
          <Play className="size-4" />
          Journal
        </button>
        <button
          onClick={() => setSubTab("plans")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
            subTab === "plans"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground"
          }`}
        >
          <Dumbbell className="size-4" />
          Plans
        </button>
        <button
          onClick={() => setSubTab("exercises")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
            subTab === "exercises"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground"
          }`}
        >
          <Search className="size-4" />
          Exercises
        </button>
      </div>

      {subTab === "journal" && <JournalView />}
      {subTab === "plans" && <PlansView />}
      {subTab === "exercises" && <ExercisesView />}
    </div>
  )
}

interface WorkoutSet {
  completed: boolean
  actualReps: number
  difficulty: number | null // 1-5
}

interface JournalExercise {
  id: string
  name: string
  targetSets: number
  targetReps: number
  weight: string
  sets: WorkoutSet[]
}

const availablePlans = [
  // Weights
  { id: "p1", name: "Push Day", type: "weights" as const, exercises: [
    { id: "e1", name: "Bench Press", sets: 3, reps: 10, weight: "80kg" },
    { id: "e2", name: "Incline DB Press", sets: 3, reps: 10, weight: "26kg" },
    { id: "e3", name: "Cable Flyes", sets: 3, reps: 12, weight: "20kg" },
    { id: "e14", name: "Tricep Pushdowns", sets: 3, reps: 12, weight: "25kg" },
  ]},
  { id: "p2", name: "Pull Day", type: "weights" as const, exercises: [
    { id: "e5", name: "Pull-ups", sets: 4, reps: 8, weight: "BW" },
    { id: "e6", name: "Barbell Rows", sets: 3, reps: 10, weight: "60kg" },
    { id: "e12", name: "Bicep Curls", sets: 3, reps: 12, weight: "14kg" },
  ]},
  { id: "p3", name: "Leg Day", type: "weights" as const, exercises: [
    { id: "e16", name: "Squats", sets: 4, reps: 8, weight: "100kg" },
    { id: "e18", name: "Romanian Deadlifts", sets: 3, reps: 10, weight: "80kg" },
    { id: "e19", name: "Leg Curls", sets: 3, reps: 12, weight: "40kg" },
  ]},
  { id: "p4", name: "Upper Body", type: "weights" as const, exercises: [
    { id: "e1", name: "Bench Press", sets: 3, reps: 10, weight: "70kg" },
    { id: "e5", name: "Pull-ups", sets: 3, reps: 8, weight: "BW" },
    { id: "e9", name: "Overhead Press", sets: 3, reps: 10, weight: "40kg" },
  ]},
  // Cardio
  { id: "p5", name: "HIIT Running", type: "cardio" as const, exercises: [
    { id: "e24", name: "Running", sets: 1, reps: 1, weight: "", duration: 30 },
  ]},
  { id: "p6", name: "Pool Session", type: "cardio" as const, exercises: [
    { id: "e25", name: "Swimming", sets: 1, reps: 1, weight: "", duration: 45 },
  ]},
  { id: "p7", name: "Rowing Intervals", type: "cardio" as const, exercises: [
    { id: "e26", name: "Rowing Machine", sets: 1, reps: 1, weight: "", duration: 25 },
  ]},
  { id: "p8", name: "Cardio Mix", type: "cardio" as const, exercises: [
    { id: "e24", name: "Running", sets: 1, reps: 1, weight: "", duration: 15 },
    { id: "e27", name: "Cycling", sets: 1, reps: 1, weight: "", duration: 15 },
    { id: "e28", name: "Jump Rope", sets: 1, reps: 1, weight: "", duration: 10 },
  ]},
  // Flexibility
  { id: "p9", name: "Morning Yoga", type: "flexibility" as const, exercises: [
    { id: "e30", name: "Yoga Flow", sets: 1, reps: 1, weight: "", duration: 30 },
  ]},
  { id: "p10", name: "Recovery Stretch", type: "flexibility" as const, exercises: [
    { id: "e31", name: "Static Stretching", sets: 1, reps: 1, weight: "", duration: 20 },
    { id: "e33", name: "Foam Rolling", sets: 1, reps: 1, weight: "", duration: 15 },
  ]},
  { id: "p11", name: "Pilates Core", type: "flexibility" as const, exercises: [
    { id: "e34", name: "Pilates", sets: 1, reps: 1, weight: "", duration: 45 },
  ]},
  { id: "p12", name: "Pre-Workout Warmup", type: "flexibility" as const, exercises: [
    { id: "e32", name: "Dynamic Stretching", sets: 1, reps: 1, weight: "", duration: 10 },
  ]},
]

function JournalView() {
  const { activeUser, addWorkoutLog } = useUser()
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  const [showPlanPicker, setShowPlanPicker] = useState(false)
  const [planTypeFilter, setPlanTypeFilter] = useState<"weights" | "cardio" | "flexibility">("weights")
  const [exercises, setExercises] = useState<JournalExercise[]>([])
  const [expandedSet, setExpandedSet] = useState<{exerciseId: string, setIndex: number} | null>(null)
  const [workoutStartTime, setWorkoutStartTime] = useState<number | null>(null)
  const [pausedTime, setPausedTime] = useState<number>(0) // Accumulated paused time
  const [pauseStartTime, setPauseStartTime] = useState<number | null>(null)
  const [elapsedTime, setElapsedTime] = useState("00:00")
  const [isWorkoutActive, setIsWorkoutActive] = useState(false)
  const [isWorkoutPaused, setIsWorkoutPaused] = useState(false)
  const [showFinishModal, setShowFinishModal] = useState(false)
  
  // Rest timer state
  const [restTimerActive, setRestTimerActive] = useState(false)
  const [restTimeRemaining, setRestTimeRemaining] = useState(0)
  const [restDuration] = useState(90) // Default 90 seconds, could come from settings

  // Workout timer effect
  useEffect(() => {
    if (!isWorkoutActive || !workoutStartTime || isWorkoutPaused) return
    const interval = setInterval(() => {
      const elapsed = Date.now() - workoutStartTime - pausedTime
      const mins = Math.floor(elapsed / 60000)
      const secs = Math.floor((elapsed % 60000) / 1000)
      setElapsedTime(`${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`)
    }, 1000)
    return () => clearInterval(interval)
  }, [isWorkoutActive, workoutStartTime, isWorkoutPaused, pausedTime])

  // Rest timer effect
  useEffect(() => {
    if (!restTimerActive || restTimeRemaining <= 0) return
    const interval = setInterval(() => {
      setRestTimeRemaining(prev => {
        if (prev <= 1) {
          setRestTimerActive(false)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [restTimerActive, restTimeRemaining])

  const startWorkout = () => {
    setWorkoutStartTime(Date.now())
    setIsWorkoutActive(true)
    setPausedTime(0)
  }

  const pauseWorkout = () => {
    setIsWorkoutPaused(true)
    setPauseStartTime(Date.now())
    setRestTimerActive(false)
  }

  const resumeWorkout = () => {
    if (pauseStartTime) {
      setPausedTime(prev => prev + (Date.now() - pauseStartTime))
    }
    setIsWorkoutPaused(false)
    setPauseStartTime(null)
  }

  const finishWorkout = (logToAnalytics: boolean, checkOffPlan: boolean) => {
    if (logToAnalytics && workoutStartTime) {
      const currentPlan = availablePlans.find(p => p.id === selectedPlan)
      const now = new Date()
      const startDate = new Date(workoutStartTime)
      
      addWorkoutLog({
        id: `w${Date.now()}`,
        user: activeUser,
        date: now.toISOString().split('T')[0],
        startTime: `${startDate.getHours().toString().padStart(2, '0')}:${startDate.getMinutes().toString().padStart(2, '0')}`,
        endTime: `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`,
        planName: currentPlan?.name || "Custom Workout",
        exercises: exercises.map(ex => ({
          exerciseId: ex.id,
          name: ex.name,
          sets: ex.sets.filter(s => s.completed).map(s => ({
            reps: s.actualReps,
            weight: ex.weight,
            difficulty: s.difficulty || 3
          }))
        })),
        totalSets: completedSets,
        totalReps: exercises.reduce((sum, ex) => 
          sum + ex.sets.filter(s => s.completed).reduce((setSum, s) => setSum + s.actualReps, 0), 0),
        estimatedCalories
      })
    }
    
    // Reset state
    setShowFinishModal(false)
    setSelectedPlan(null)
    setExercises([])
    setIsWorkoutActive(false)
    setIsWorkoutPaused(false)
    setWorkoutStartTime(null)
    setPausedTime(0)
    setElapsedTime("00:00")
  }

  const startRestTimer = () => {
    setRestTimeRemaining(restDuration)
    setRestTimerActive(true)
  }

  const skipRestTimer = () => {
    setRestTimerActive(false)
    setRestTimeRemaining(0)
  }

  const selectPlan = (planId: string) => {
    const plan = availablePlans.find(p => p.id === planId)
    if (plan) {
      const weightMultiplier = activeUser === "patrycja" ? 0.5 : 1
      setExercises(plan.exercises.map(e => ({
        id: e.id,
        name: e.name,
        targetSets: e.sets,
        targetReps: e.reps,
        weight: e.weight === "BW" ? "BW" : `${Math.round(parseInt(e.weight) * weightMultiplier)}kg`,
        sets: Array.from({ length: e.sets }, () => ({
          completed: false,
          actualReps: e.reps,
          difficulty: null
        }))
      })))
      setSelectedPlan(planId)
      setShowPlanPicker(false)
    }
  }

  const toggleSet = (exerciseId: string, setIndex: number) => {
    const currentExpanded = expandedSet?.exerciseId === exerciseId && expandedSet?.setIndex === setIndex
    const exercise = exercises.find(ex => ex.id === exerciseId)
    const isCompleted = exercise?.sets[setIndex]?.completed

    if (currentExpanded) {
      // Collapse and unmark
      setExercises(exercises.map(ex => {
        if (ex.id === exerciseId) {
          const newSets = [...ex.sets]
          newSets[setIndex] = { ...newSets[setIndex], completed: false, difficulty: null }
          return { ...ex, sets: newSets }
        }
        return ex
      }))
      setExpandedSet(null)
    } else if (isCompleted) {
      // Already completed, just expand to edit
      setExpandedSet({ exerciseId, setIndex })
    } else {
      // Mark as completed and expand
      setExercises(exercises.map(ex => {
        if (ex.id === exerciseId) {
          const newSets = [...ex.sets]
          newSets[setIndex] = { ...newSets[setIndex], completed: true }
          return { ...ex, sets: newSets }
        }
        return ex
      }))
      setExpandedSet({ exerciseId, setIndex })
      // Start rest timer
      startRestTimer()
    }
  }

  const updateSetReps = (exerciseId: string, setIndex: number, reps: number) => {
    setExercises(exercises.map(ex => {
      if (ex.id === exerciseId) {
        const newSets = [...ex.sets]
        newSets[setIndex] = { ...newSets[setIndex], actualReps: Math.max(1, reps) }
        return { ...ex, sets: newSets }
      }
      return ex
    }))
  }

  const updateSetDifficulty = (exerciseId: string, setIndex: number, difficulty: number) => {
    setExercises(exercises.map(ex => {
      if (ex.id === exerciseId) {
        const newSets = [...ex.sets]
        newSets[setIndex] = { ...newSets[setIndex], difficulty }
        return { ...ex, sets: newSets }
      }
      return ex
    }))
  }

  // Stats
  const totalSets = exercises.reduce((sum, ex) => sum + ex.sets.length, 0)
  const completedSets = exercises.reduce((sum, ex) => sum + ex.sets.filter(s => s.completed).length, 0)
  const progress = totalSets > 0 ? (completedSets / totalSets) * 100 : 0
  const estimatedCalories = completedSets * 8 // rough estimate

  const difficultyLabels = ["Easy", "OK", "Mod", "Hard", "Max"]
  const difficultyColors = ["text-emerald-500", "text-blue-500", "text-amber-500", "text-orange-500", "text-red-500"]

  const currentPlan = availablePlans.find(p => p.id === selectedPlan)

  return (
    <div className="flex flex-col gap-4">
      {/* Plan Selector */}
      <div 
        onClick={() => setShowPlanPicker(true)}
        className="bg-card rounded-2xl p-4 border border-border flex items-center justify-between cursor-pointer active:scale-[0.99] transition-transform"
      >
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-primary/20 flex items-center justify-center">
            <Dumbbell className="size-5 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Current Workout</p>
            <p className="font-semibold text-foreground">
              {currentPlan ? currentPlan.name : "Select a plan"}
            </p>
          </div>
        </div>
        <ChevronRight className="size-5 text-muted-foreground" />
      </div>

      {/* Stats Card */}
      {selectedPlan && (
        <div className="bg-card rounded-2xl p-4 border border-border">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-4">
              <div className="text-center">
                <p className="text-lg font-bold text-foreground">{exercises.length}</p>
                <p className="text-[10px] text-muted-foreground">Exercises</p>
              </div>
              <div className="w-px h-8 bg-border" />
              <div className="text-center">
                <p className="text-lg font-bold text-foreground">{completedSets}/{totalSets}</p>
                <p className="text-[10px] text-muted-foreground">Sets</p>
              </div>
              <div className="w-px h-8 bg-border" />
              <div className="text-center flex items-center gap-1">
                <Flame className="size-4 text-orange-400" />
                <p className="text-lg font-bold text-foreground">{estimatedCalories}</p>
              </div>
            </div>
            {isWorkoutActive ? (
              <div className="flex items-center gap-2">
                <div className={`flex items-center gap-1.5 ${isWorkoutPaused ? "text-amber-500" : "text-primary"}`}>
                  <Timer className="size-4" />
                  <span className="text-sm font-mono font-medium">{elapsedTime}</span>
                </div>
                <div className="flex gap-1">
                  {isWorkoutPaused ? (
                    <button
                      onClick={resumeWorkout}
                      className="p-1.5 bg-primary rounded-lg text-primary-foreground active:scale-95 transition-transform"
                    >
                      <Play className="size-3.5" />
                    </button>
                  ) : (
                    <button
                      onClick={pauseWorkout}
                      className="p-1.5 bg-secondary rounded-lg text-muted-foreground active:scale-95 transition-transform"
                    >
                      <Pause className="size-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => setShowFinishModal(true)}
                    className="p-1.5 bg-emerald-500 rounded-lg text-white active:scale-95 transition-transform"
                  >
                    <Square className="size-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={startWorkout}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-primary rounded-lg text-primary-foreground text-xs font-medium active:scale-95 transition-transform"
              >
                <Play className="size-3.5" />
                Start
              </button>
            )}
          </div>
          
          {/* Progress Bar */}
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-[10px] text-muted-foreground text-center mt-1.5">
            {Math.round(progress)}% complete
          </p>
        </div>
      )}

      {/* Rest Timer */}
      {restTimerActive && (
        <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl p-4 border border-blue-500/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative size-12">
                <svg className="size-12 -rotate-90">
                  <circle
                    cx="24"
                    cy="24"
                    r="20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    className="text-secondary"
                  />
                  <circle
                    cx="24"
                    cy="24"
                    r="20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeDasharray={125.6}
                    strokeDashoffset={125.6 * (1 - restTimeRemaining / restDuration)}
                    strokeLinecap="round"
                    className="text-primary transition-all duration-1000"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-foreground">
                  {restTimeRemaining}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Rest Time</p>
                <p className="text-xs text-muted-foreground">Recover before next set</p>
              </div>
            </div>
            <button
              onClick={skipRestTimer}
              className="px-3 py-1.5 rounded-lg bg-secondary text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Skip
            </button>
          </div>
        </div>
      )}

      {/* Exercises */}
      {selectedPlan && (
        <div className="flex flex-col gap-3">
          {exercises.map((exercise) => (
            <div
              key={exercise.id}
              className="bg-card rounded-2xl border border-border overflow-hidden"
            >
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-foreground">{exercise.name}</h4>
                  <span className="text-xs font-medium text-muted-foreground bg-secondary px-2 py-1 rounded-lg">{exercise.weight}</span>
                </div>
                <div className="flex gap-2">
                  {exercise.sets.map((set, setIndex) => (
                    <button
                      key={setIndex}
                      onClick={() => toggleSet(exercise.id, setIndex)}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all flex flex-col items-center ${
                        set.completed
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-muted-foreground"
                      }`}
                    >
                      <span>{set.completed ? set.actualReps : exercise.targetReps}</span>
                      {set.difficulty && (
                        <span className="text-[9px] opacity-80">{difficultyLabels[set.difficulty - 1]}</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Expanded Set Editor */}
              {expandedSet?.exerciseId === exercise.id && (
                <div className="px-4 pb-4 pt-1 border-t border-border bg-secondary/30">
                  <div className="flex items-center gap-4">
                    {/* Reps */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Reps:</span>
                      <div className="flex items-center bg-background rounded-lg">
                        <button
                          onClick={() => updateSetReps(exercise.id, expandedSet.setIndex, exercise.sets[expandedSet.setIndex].actualReps - 1)}
                          className="px-2 py-1 text-muted-foreground hover:text-foreground"
                        >
                          -
                        </button>
                        <span className="w-6 text-center text-sm font-medium">{exercise.sets[expandedSet.setIndex].actualReps}</span>
                        <button
                          onClick={() => updateSetReps(exercise.id, expandedSet.setIndex, exercise.sets[expandedSet.setIndex].actualReps + 1)}
                          className="px-2 py-1 text-muted-foreground hover:text-foreground"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Difficulty */}
                    <div className="flex-1 flex items-center gap-1.5">
                      {[1, 2, 3, 4, 5].map((level) => (
                        <button
                          key={level}
                          onClick={() => updateSetDifficulty(exercise.id, expandedSet.setIndex, level)}
                          className={`flex-1 py-1.5 rounded-lg text-[10px] font-medium transition-all ${
                            exercise.sets[expandedSet.setIndex].difficulty === level
                              ? `bg-background ${difficultyColors[level - 1]}`
                              : "bg-background/50 text-muted-foreground"
                          }`}
                        >
                          {difficultyLabels[level - 1]}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!selectedPlan && (
        <div className="bg-card rounded-2xl p-8 border border-dashed border-border text-center">
          <div className="size-14 rounded-full bg-secondary mx-auto mb-4 flex items-center justify-center">
            <Play className="size-6 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">Select a workout plan to start</p>
        </div>
      )}

      {/* Plan Picker Modal */}
      {showPlanPicker && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50 p-4 pb-24">
          <div className="bg-card rounded-2xl w-full max-w-md overflow-hidden max-h-[70vh] flex flex-col">
            <div className="p-4 border-b border-border flex items-center justify-between shrink-0">
              <h3 className="font-semibold text-foreground">Select Workout</h3>
              <button 
                onClick={() => setShowPlanPicker(false)}
                className="p-1 rounded-lg hover:bg-secondary"
              >
                <X className="size-5 text-muted-foreground" />
              </button>
            </div>

            {/* Type Filter Tabs */}
            <div className="px-4 pt-3 pb-2 border-b border-border shrink-0">
              <div className="flex gap-2 p-1 bg-secondary rounded-xl">
                <button
                  onClick={() => setPlanTypeFilter("weights")}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                    planTypeFilter === "weights"
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground"
                  }`}
                >
                  Weights
                </button>
                <button
                  onClick={() => setPlanTypeFilter("cardio")}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                    planTypeFilter === "cardio"
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground"
                  }`}
                >
                  Cardio
                </button>
                <button
                  onClick={() => setPlanTypeFilter("flexibility")}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                    planTypeFilter === "flexibility"
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground"
                  }`}
                >
                  Flexibility
                </button>
              </div>
            </div>

            <div className="p-4 flex flex-col gap-2 overflow-y-auto flex-1">
              {availablePlans
                .filter(plan => plan.type === planTypeFilter)
                .map((plan) => {
                  const isTimeBased = plan.exercises.some(e => 'duration' in e && e.duration)
                  const totalDuration = (plan.exercises as any[]).reduce((sum: number, e: any) => sum + (e.duration || 0), 0)
                  
                  return (
                    <button
                      key={plan.id}
                      onClick={() => selectPlan(plan.id)}
                      className={`p-4 rounded-xl text-left transition-all ${
                        selectedPlan === plan.id
                          ? "bg-primary/10 border-2 border-primary"
                          : "bg-secondary border-2 border-transparent"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-foreground">{plan.name}</p>
                        {selectedPlan === plan.id && (
                          <Check className="size-5 text-primary" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {isTimeBased 
                          ? `${plan.exercises.length} ${plan.exercises.length === 1 ? 'activity' : 'activities'} · ${totalDuration} min`
                          : `${plan.exercises.length} exercises`
                        }
                      </p>
                    </button>
                  )
                })}
            </div>
          </div>
        </div>
      )}

      {/* Finish Workout Modal */}
      {showFinishModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl w-full max-w-sm overflow-hidden">
            <div className="p-5 text-center">
              <div className="size-14 rounded-full bg-emerald-500/20 mx-auto mb-4 flex items-center justify-center">
                <Check className="size-7 text-emerald-500" />
              </div>
              <h3 className="font-semibold text-lg text-foreground mb-1">Finish Workout?</h3>
              <p className="text-sm text-muted-foreground mb-2">
                {completedSets}/{totalSets} sets completed in {elapsedTime}
              </p>
              <p className="text-xs text-muted-foreground">
                ~{estimatedCalories} calories burned
              </p>
            </div>

            <div className="p-4 border-t border-border flex flex-col gap-2">
              <button
                onClick={() => finishWorkout(true, true)}
                className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-medium active:scale-[0.98] transition-transform"
              >
                Log & Check Off Plan
              </button>
              <button
                onClick={() => finishWorkout(true, false)}
                className="w-full py-3 rounded-xl bg-secondary text-foreground font-medium active:scale-[0.98] transition-transform"
              >
                Log to Analytics Only
              </button>
              <button
                onClick={() => finishWorkout(false, false)}
                className="w-full py-2.5 text-sm text-muted-foreground font-medium"
              >
                Discard Workout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function PlansView() {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [planName, setPlanName] = useState("")
  const [planExercises, setPlanExercises] = useState<PlanExercise[]>([])
  const [showExercisePicker, setShowExercisePicker] = useState(false)
  const [exerciseSearch, setExerciseSearch] = useState("")
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<string | null>(null)
  const [pairingMode, setPairingMode] = useState<string | null>(null) // exerciseId being paired

  const plans = [
    { name: "Push Day", exercises: 6, duration: "45-60 min", lastDone: "2 days ago" },
    { name: "Pull Day", exercises: 6, duration: "45-60 min", lastDone: "Yesterday" },
    { name: "Leg Day", exercises: 7, duration: "50-65 min", lastDone: "3 days ago" },
    { name: "Upper Body", exercises: 8, duration: "55-70 min", lastDone: "5 days ago" },
  ]

  const muscleGroups = [...new Set(exerciseLibrary.map(e => e.muscleGroup))]

  const filteredExercises = exerciseLibrary.filter(e => {
    const matchesSearch = e.name.toLowerCase().includes(exerciseSearch.toLowerCase())
    const matchesMuscle = !selectedMuscleGroup || e.muscleGroup === selectedMuscleGroup
    const notAlreadyAdded = !planExercises.some(pe => pe.exerciseId === e.id)
    return matchesSearch && matchesMuscle && notAlreadyAdded
  })

  const addExerciseToPlan = (exercise: Exercise) => {
    setPlanExercises([...planExercises, {
      exerciseId: exercise.id,
      exercise,
      sets: exercise.isTimeBased ? 1 : 3,
      reps: exercise.isTimeBased ? 1 : 10,
      weight: "",
      duration: exercise.isTimeBased ? 30 : undefined
    }])
    setShowExercisePicker(false)
    setExerciseSearch("")
    setSelectedMuscleGroup(null)
  }

  const removeExerciseFromPlan = (exerciseId: string) => {
    // Also remove any pairings
    setPlanExercises(planExercises
      .filter(pe => pe.exerciseId !== exerciseId)
      .map(pe => pe.pairedWith === exerciseId ? { ...pe, pairedWith: undefined } : pe)
    )
  }

  const updateExerciseSets = (exerciseId: string, sets: number) => {
    setPlanExercises(planExercises.map(pe => 
      pe.exerciseId === exerciseId ? { ...pe, sets: Math.max(1, sets) } : pe
    ))
  }

  const updateExerciseReps = (exerciseId: string, reps: number) => {
    if (reps < 1) return
    setPlanExercises(planExercises.map(pe => 
      pe.exerciseId === exerciseId ? { ...pe, reps } : pe
    ))
  }

  const updateExerciseWeight = (exerciseId: string, weight: string) => {
    setPlanExercises(planExercises.map(pe => 
      pe.exerciseId === exerciseId ? { ...pe, weight } : pe
    ))
  }

  const updateExerciseDuration = (exerciseId: string, duration: number) => {
    setPlanExercises(planExercises.map(pe => 
      pe.exerciseId === exerciseId ? { ...pe, duration: Math.max(5, duration) } : pe
    ))
  }

  const startPairing = (exerciseId: string) => {
    if (pairingMode === exerciseId) {
      setPairingMode(null)
    } else {
      setPairingMode(exerciseId)
    }
  }

  const pairExercises = (targetId: string) => {
    if (!pairingMode) return
    
    setPlanExercises(planExercises.map(pe => {
      if (pe.exerciseId === pairingMode) {
        return { ...pe, pairedWith: targetId }
      }
      if (pe.exerciseId === targetId) {
        return { ...pe, pairedWith: pairingMode }
      }
      return pe
    }))
    setPairingMode(null)
  }

  const unpairExercise = (exerciseId: string) => {
    const exercise = planExercises.find(pe => pe.exerciseId === exerciseId)
    if (!exercise?.pairedWith) return
    
    setPlanExercises(planExercises.map(pe => {
      if (pe.exerciseId === exerciseId || pe.exerciseId === exercise.pairedWith) {
        return { ...pe, pairedWith: undefined }
      }
      return pe
    }))
  }

  const canPairWith = (exercise: PlanExercise) => {
    if (!pairingMode) return false
    const sourceExercise = planExercises.find(pe => pe.exerciseId === pairingMode)?.exercise
    if (!sourceExercise?.antagonistPairsWith) return false
    return sourceExercise.antagonistPairsWith.includes(exercise.exercise.muscleGroup)
  }

  const savePlan = () => {
    if (planName.trim() && planExercises.length > 0) {
      alert(`Plan "${planName}" saved with ${planExercises.length} exercises!`)
      setShowCreateModal(false)
      setPlanName("")
      setPlanExercises([])
    }
  }

  const resetModal = () => {
    setShowCreateModal(false)
    setShowExercisePicker(false)
    setPlanName("")
    setPlanExercises([])
    setExerciseSearch("")
    setSelectedMuscleGroup(null)
    setPairingMode(null)
  }

  return (
    <div className="flex flex-col gap-3">
      {plans.map((plan, i) => (
        <button
          key={i}
          className="bg-card rounded-2xl p-4 border border-border flex items-center gap-4 text-left active:scale-[0.98] transition-transform"
        >
          <div className="size-14 rounded-xl bg-primary/20 flex items-center justify-center">
            <Dumbbell className="size-6 text-primary" />
          </div>
          <div className="flex-1">
            <h4 className="font-medium text-foreground">{plan.name}</h4>
            <p className="text-sm text-muted-foreground">
              {plan.exercises} exercises · {plan.duration}
            </p>
            <p className="text-xs text-muted-foreground/70 mt-1">{plan.lastDone}</p>
          </div>
          <ChevronRight className="size-5 text-muted-foreground" />
        </button>
      ))}

      <button 
        onClick={() => setShowCreateModal(true)}
        className="w-full py-4 rounded-2xl border-2 border-dashed border-border text-muted-foreground font-medium flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
      >
        <Plus className="size-5" />
        Create New Plan
      </button>

      {/* Create Plan Modal */}
      {showCreateModal && !showExercisePicker && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50 p-4 pb-24">
          <div className="bg-card rounded-2xl w-full max-w-md overflow-hidden max-h-[70vh] flex flex-col">
            <div className="p-4 border-b border-border flex items-center justify-between shrink-0">
              <h3 className="font-semibold text-foreground">Create New Plan</h3>
              <button onClick={resetModal} className="p-1 rounded-lg hover:bg-secondary">
                <X className="size-5 text-muted-foreground" />
              </button>
            </div>

            <div className="p-4 flex flex-col gap-4 overflow-y-auto flex-1">
              {/* Plan Name */}
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">Plan Name</label>
                <input
                  type="text"
                  placeholder="e.g., Push Day, Full Body..."
                  value={planName}
                  onChange={(e) => setPlanName(e.target.value)}
                  className="w-full bg-secondary rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              {/* Exercises List */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs text-muted-foreground uppercase tracking-wider">Exercises ({planExercises.length})</label>
                  {pairingMode && (
                    <span className="text-xs text-primary">Select an exercise to pair</span>
                  )}
                </div>

                {planExercises.length === 0 ? (
                  <div className="bg-secondary/50 rounded-xl p-6 text-center border border-dashed border-border">
                    <Dumbbell className="size-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No exercises added yet</p>
                    <p className="text-xs text-muted-foreground mt-1">Tap below to add from the library</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {planExercises.map((pe, index) => {
                      const isPairing = pairingMode === pe.exerciseId
                      const canBePaired = canPairWith(pe) && !pe.pairedWith
                      const pairedExercise = pe.pairedWith ? planExercises.find(p => p.exerciseId === pe.pairedWith) : null

                      return (
                        <div
                          key={pe.exerciseId}
                          className={`bg-secondary/50 rounded-xl p-3 border transition-all ${
                            isPairing ? "border-primary" : canBePaired ? "border-primary/50" : "border-transparent"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">{index + 1}.</span>
                                <span className="text-sm font-medium text-foreground">{pe.exercise.name}</span>
                              </div>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-xs text-muted-foreground">{pe.exercise.muscleGroup}</span>
                                {pairedExercise && (
                                  <span className="px-1.5 py-0.5 rounded bg-primary/20 text-primary text-[9px] font-medium flex items-center gap-1">
                                    <Link2 className="size-2.5" />
                                    {pairedExercise.exercise.name}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              {pe.exercise.antagonistPairsWith && !pe.pairedWith && (
                                <button
                                  onClick={() => startPairing(pe.exerciseId)}
                                  className={`p-1.5 rounded-lg transition-colors ${
                                    isPairing ? "bg-primary text-primary-foreground" : "hover:bg-secondary text-muted-foreground"
                                  }`}
                                  title="Pair with antagonist"
                                >
                                  <Link2 className="size-3.5" />
                                </button>
                              )}
                              {pe.pairedWith && (
                                <button
                                  onClick={() => unpairExercise(pe.exerciseId)}
                                  className="p-1.5 rounded-lg hover:bg-secondary text-primary"
                                  title="Unpair"
                                >
                                  <Link2 className="size-3.5" />
                                </button>
                              )}
                              <button
                                onClick={() => removeExerciseFromPlan(pe.exerciseId)}
                                className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive"
                              >
                                <Trash2 className="size-3.5" />
                              </button>
                            </div>
                          </div>

                          {canBePaired && (
                            <button
                              onClick={() => pairExercises(pe.exerciseId)}
                              className="w-full py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-medium mb-2"
                            >
                              Tap to pair as antagonist
                            </button>
                          )}

                          {/* Time-based exercise controls */}
                          {pe.exercise.isTimeBased ? (
                            <div className="flex gap-2">
                              <div className="flex-1">
                                <label className="text-[10px] text-muted-foreground mb-1 block">Duration</label>
                                <div className="flex items-center bg-background rounded-lg">
                                  <button
                                    onClick={() => updateExerciseDuration(pe.exerciseId, (pe.duration || 30) - 5)}
                                    className="px-2 py-1.5 text-muted-foreground hover:text-foreground"
                                  >
                                    -
                                  </button>
                                  <span className="flex-1 text-center text-sm font-medium">{pe.duration || 30} min</span>
                                  <button
                                    onClick={() => updateExerciseDuration(pe.exerciseId, (pe.duration || 30) + 5)}
                                    className="px-2 py-1.5 text-muted-foreground hover:text-foreground"
                                  >
                                    +
                                  </button>
                                </div>
                              </div>
                              <div className="flex-1">
                                <label className="text-[10px] text-muted-foreground mb-1 block">Est. Calories</label>
                                <div className="bg-background rounded-lg px-2 py-1.5 text-sm text-center text-orange-400 font-medium">
                                  ~{(pe.duration || 30) * (pe.exercise.caloriesPerMinute || 5)} kcal
                                </div>
                              </div>
                            </div>
                          ) : (
                            /* Sets/Reps/Weight controls */
                            <div className="grid grid-cols-3 gap-2">
                              <div>
                                <label className="text-[10px] text-muted-foreground mb-1 block">Sets</label>
                                <div className="flex items-center bg-background rounded-lg">
                                  <button
                                    onClick={() => updateExerciseSets(pe.exerciseId, pe.sets - 1)}
                                    className="px-2 py-1.5 text-muted-foreground hover:text-foreground"
                                  >
                                    -
                                  </button>
                                  <span className="flex-1 text-center text-sm font-medium">{pe.sets}</span>
                                  <button
                                    onClick={() => updateExerciseSets(pe.exerciseId, pe.sets + 1)}
                                    className="px-2 py-1.5 text-muted-foreground hover:text-foreground"
                                  >
                                    +
                                  </button>
                                </div>
                              </div>
                              <div>
                                <label className="text-[10px] text-muted-foreground mb-1 block">Reps</label>
                                <div className="flex items-center bg-background rounded-lg">
                                  <button
                                    onClick={() => updateExerciseReps(pe.exerciseId, pe.reps - 1)}
                                    className="px-2 py-1.5 text-muted-foreground hover:text-foreground"
                                  >
                                    -
                                  </button>
                                  <span className="flex-1 text-center text-sm font-medium">{pe.reps}</span>
                                  <button
                                    onClick={() => updateExerciseReps(pe.exerciseId, pe.reps + 1)}
                                    className="px-2 py-1.5 text-muted-foreground hover:text-foreground"
                                  >
                                    +
                                  </button>
                                </div>
                              </div>
                              <div>
                                <label className="text-[10px] text-muted-foreground mb-1 block">Weight</label>
                                <input
                                  type="text"
                                  value={pe.weight}
                                  onChange={(e) => updateExerciseWeight(pe.exerciseId, e.target.value)}
                                  className="w-full bg-background rounded-lg px-2 py-1.5 text-sm text-center text-foreground focus:outline-none"
                                  placeholder="kg"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}

                <button
                  onClick={() => setShowExercisePicker(true)}
                  className="w-full mt-3 py-2.5 rounded-xl border border-dashed border-border text-muted-foreground text-sm font-medium flex items-center justify-center gap-2"
                >
                  <Plus className="size-4" />
                  Add Exercise from Library
                </button>
              </div>
            </div>

            <div className="p-4 border-t border-border shrink-0">
              <button
                onClick={savePlan}
                disabled={!planName.trim() || planExercises.length === 0}
                className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-medium disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] transition-transform"
              >
                Save Plan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Exercise Picker Modal */}
      {showExercisePicker && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50 p-4 pb-24">
          <div className="bg-card rounded-2xl w-full max-w-md overflow-hidden max-h-[70vh] flex flex-col">
            <div className="p-4 border-b border-border flex items-center justify-between shrink-0">
              <h3 className="font-semibold text-foreground">Add Exercise</h3>
              <button onClick={() => setShowExercisePicker(false)} className="p-1 rounded-lg hover:bg-secondary">
                <X className="size-5 text-muted-foreground" />
              </button>
            </div>

            <div className="p-4 border-b border-border shrink-0">
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search exercises..."
                  value={exerciseSearch}
                  onChange={(e) => setExerciseSearch(e.target.value)}
                  className="w-full bg-secondary rounded-xl pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div className="flex gap-1.5 flex-wrap">
                <button
                  onClick={() => setSelectedMuscleGroup(null)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    !selectedMuscleGroup ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                  }`}
                >
                  All
                </button>
                {muscleGroups.map(group => (
                  <button
                    key={group}
                    onClick={() => setSelectedMuscleGroup(group)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      selectedMuscleGroup === group ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    {group}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4 flex flex-col gap-2 overflow-y-auto flex-1">
              {filteredExercises.map(exercise => (
                <button
                  key={exercise.id}
                  onClick={() => addExerciseToPlan(exercise)}
                  className="bg-secondary/50 rounded-xl p-3 text-left flex items-center gap-3 active:scale-[0.98] transition-transform"
                >
                  <div className="size-10 rounded-lg bg-secondary flex items-center justify-center">
                    <Dumbbell className="size-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{exercise.name}</p>
                    <p className="text-xs text-muted-foreground">{exercise.muscleGroup} · {exercise.equipment}</p>
                  </div>
                  <Plus className="size-5 text-muted-foreground" />
                </button>
              ))}
              {filteredExercises.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground">No exercises found</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ExercisesView() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [newExercise, setNewExercise] = useState({
    name: "",
    muscleGroup: "",
    equipment: "",
    type: "compound" as "compound" | "isolation" | "cardio" | "flexibility"
  })

  const muscleGroups = [...new Set(exerciseLibrary.map(e => e.muscleGroup))]
  const equipmentTypes = [...new Set(exerciseLibrary.map(e => e.equipment))]

  const filteredExercises = exerciseLibrary.filter(e => {
    const matchesSearch = e.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesMuscle = !selectedMuscleGroup || e.muscleGroup === selectedMuscleGroup
    return matchesSearch && matchesMuscle
  })

  const groupedExercises = filteredExercises.reduce((acc, exercise) => {
    if (!acc[exercise.muscleGroup]) {
      acc[exercise.muscleGroup] = []
    }
    acc[exercise.muscleGroup].push(exercise)
    return acc
  }, {} as Record<string, Exercise[]>)

  const handleAddExercise = () => {
    if (newExercise.name && newExercise.muscleGroup && newExercise.equipment) {
      alert(`Exercise "${newExercise.name}" added to library!`)
      setShowAddModal(false)
      setNewExercise({ name: "", muscleGroup: "", equipment: "", type: "compound" })
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Search and Filter */}
      <div className="flex flex-col gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search exercises..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-card rounded-xl pl-10 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground border border-border focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        
        <div className="flex gap-1.5 flex-wrap">
          <button
            onClick={() => setSelectedMuscleGroup(null)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              !selectedMuscleGroup ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
            }`}
          >
            All
          </button>
          {muscleGroups.map(group => (
            <button
              key={group}
              onClick={() => setSelectedMuscleGroup(group)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                selectedMuscleGroup === group ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
              }`}
            >
              {group}
            </button>
          ))}
        </div>
      </div>

      {/* Exercise List */}
      <div className="flex flex-col gap-4">
        {Object.entries(groupedExercises).map(([muscleGroup, exercises]) => (
          <div key={muscleGroup}>
            <h3 className="text-xs text-muted-foreground uppercase tracking-wider mb-2 px-1">{muscleGroup}</h3>
            <div className="flex flex-col gap-2">
              {exercises.map(exercise => {
                const typeColors: Record<string, string> = {
                  compound: "bg-amber-500/20 text-amber-500",
                  isolation: "bg-blue-500/20 text-blue-500",
                  cardio: "bg-rose-500/20 text-rose-500",
                  flexibility: "bg-purple-500/20 text-purple-500"
                }
                const iconBg = exercise.type === "cardio" 
                  ? "bg-rose-500/10" 
                  : exercise.type === "flexibility" 
                    ? "bg-purple-500/10" 
                    : "bg-primary/10"
                const iconColor = exercise.type === "cardio" 
                  ? "text-rose-500" 
                  : exercise.type === "flexibility" 
                    ? "text-purple-500" 
                    : "text-primary"

                return (
                  <div
                    key={exercise.id}
                    className="bg-card rounded-xl p-3 border border-border flex items-center gap-3"
                  >
                    <div className={`size-10 rounded-lg ${iconBg} flex items-center justify-center`}>
                      <Dumbbell className={`size-5 ${iconColor}`} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{exercise.name}</p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="text-xs text-muted-foreground">{exercise.equipment}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium ${typeColors[exercise.type]}`}>
                          {exercise.type}
                        </span>
                        {exercise.isTimeBased && (
                          <span className="text-[9px] text-muted-foreground">
                            ~{exercise.caloriesPerMinute} kcal/min
                          </span>
                        )}
                        {exercise.antagonistPairsWith && (
                          <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-500 text-[9px] font-medium flex items-center gap-0.5">
                            <Link2 className="size-2.5" />
                            {exercise.antagonistPairsWith.join(", ")}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Add Exercise Button */}
      <button
        onClick={() => setShowAddModal(true)}
        className="w-full py-4 rounded-2xl border-2 border-dashed border-border text-muted-foreground font-medium flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
      >
        <Plus className="size-5" />
        Add New Exercise
      </button>

      {/* Add Exercise Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50 p-4 pb-24">
          <div className="bg-card rounded-2xl w-full max-w-md overflow-hidden max-h-[70vh] flex flex-col">
            <div className="p-4 border-b border-border flex items-center justify-between shrink-0">
              <h3 className="font-semibold text-foreground">Add New Exercise</h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 rounded-lg hover:bg-secondary">
                <X className="size-5 text-muted-foreground" />
              </button>
            </div>

            <div className="p-4 flex flex-col gap-4 overflow-y-auto flex-1">
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">Exercise Name</label>
                <input
                  type="text"
                  placeholder="e.g., Bulgarian Split Squats"
                  value={newExercise.name}
                  onChange={(e) => setNewExercise({ ...newExercise, name: e.target.value })}
                  className="w-full bg-secondary rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">Muscle Group</label>
                <div className="flex gap-1.5 flex-wrap">
                  {muscleGroups.map(group => (
                    <button
                      key={group}
                      onClick={() => setNewExercise({ ...newExercise, muscleGroup: group })}
                      className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                        newExercise.muscleGroup === group 
                          ? "bg-primary text-primary-foreground" 
                          : "bg-secondary text-muted-foreground"
                      }`}
                    >
                      {group}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">Equipment</label>
                <div className="flex gap-1.5 flex-wrap">
                  {equipmentTypes.map(eq => (
                    <button
                      key={eq}
                      onClick={() => setNewExercise({ ...newExercise, equipment: eq })}
                      className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                        newExercise.equipment === eq 
                          ? "bg-primary text-primary-foreground" 
                          : "bg-secondary text-muted-foreground"
                      }`}
                    >
                      {eq}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setNewExercise({ ...newExercise, type: "compound" })}
                    className={`py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      newExercise.type === "compound" 
                        ? "bg-amber-500/20 text-amber-500 border border-amber-500/30" 
                        : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    Compound
                  </button>
                  <button
                    onClick={() => setNewExercise({ ...newExercise, type: "isolation" })}
                    className={`py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      newExercise.type === "isolation" 
                        ? "bg-blue-500/20 text-blue-500 border border-blue-500/30" 
                        : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    Isolation
                  </button>
                  <button
                    onClick={() => setNewExercise({ ...newExercise, type: "cardio" })}
                    className={`py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      newExercise.type === "cardio" 
                        ? "bg-rose-500/20 text-rose-500 border border-rose-500/30" 
                        : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    Cardio
                  </button>
                  <button
                    onClick={() => setNewExercise({ ...newExercise, type: "flexibility" })}
                    className={`py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      newExercise.type === "flexibility" 
                        ? "bg-purple-500/20 text-purple-500 border border-purple-500/30" 
                        : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    Flexibility
                  </button>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-border shrink-0">
              <button
                onClick={handleAddExercise}
                disabled={!newExercise.name || !newExercise.muscleGroup || !newExercise.equipment}
                className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-medium disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] transition-transform"
              >
                Add Exercise
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
