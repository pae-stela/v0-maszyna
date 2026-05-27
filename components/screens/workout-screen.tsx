"use client"

import { useState } from "react"
import { useUser } from "@/lib/user-context"
import { Play, Plus, ChevronRight, Timer, Flame, Dumbbell, Search, X, Check, Link2, Trash2 } from "lucide-react"

type SubTab = "journal" | "plans" | "exercises"

interface Exercise {
  id: string
  name: string
  muscleGroup: string
  equipment: string
  type: "compound" | "isolation"
  antagonistPairsWith?: string[] // muscle groups it pairs well with
}

interface PlanExercise {
  exerciseId: string
  exercise: Exercise
  sets: number
  reps: string
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

function JournalView() {
  const { activeUser } = useUser()
  const [exercises] = useState([
    { name: "Bench Press", sets: 3, reps: "8-10", weight: activeUser === "patrycja" ? "40kg" : "80kg" },
    { name: "Incline DB Press", sets: 3, reps: "10-12", weight: activeUser === "patrycja" ? "12kg" : "26kg" },
    { name: "Cable Flyes", sets: 3, reps: "12-15", weight: activeUser === "patrycja" ? "10kg" : "20kg" },
  ])

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-card rounded-2xl p-5 border border-border">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-foreground">Current Workout</h3>
            <p className="text-sm text-muted-foreground">Push Day - Chest Focus</p>
          </div>
          <div className="flex items-center gap-2 text-primary">
            <Timer className="size-4" />
            <span className="text-sm font-medium">32:45</span>
          </div>
        </div>
        
        <div className="flex gap-4 mb-4">
          <div className="flex-1 bg-secondary rounded-xl p-3 text-center">
            <span className="text-lg font-bold text-foreground">3</span>
            <p className="text-xs text-muted-foreground">Exercises</p>
          </div>
          <div className="flex-1 bg-secondary rounded-xl p-3 text-center">
            <span className="text-lg font-bold text-foreground">9</span>
            <p className="text-xs text-muted-foreground">Sets Done</p>
          </div>
          <div className="flex-1 bg-secondary rounded-xl p-3 text-center">
            <div className="flex items-center justify-center gap-1">
              <Flame className="size-4 text-orange-400" />
              <span className="text-lg font-bold text-foreground">245</span>
            </div>
            <p className="text-xs text-muted-foreground">Calories</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {exercises.map((exercise, i) => (
          <div
            key={i}
            className="bg-card rounded-2xl p-4 border border-border"
          >
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-foreground">{exercise.name}</h4>
              <span className="text-xs text-muted-foreground">{exercise.weight}</span>
            </div>
            <div className="flex gap-2">
              {Array.from({ length: exercise.sets }).map((_, setIndex) => (
                <button
                  key={setIndex}
                  className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all ${
                    setIndex < 2
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {exercise.reps}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <button className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform">
        <Plus className="size-5" />
        Add Exercise
      </button>
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
      sets: 3,
      reps: "8-12"
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

  const updateExerciseReps = (exerciseId: string, reps: string) => {
    setPlanExercises(planExercises.map(pe => 
      pe.exerciseId === exerciseId ? { ...pe, reps } : pe
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

                          <div className="flex gap-2">
                            <div className="flex-1">
                              <label className="text-[10px] text-muted-foreground mb-1 block">Sets</label>
                              <div className="flex items-center bg-background rounded-lg">
                                <button
                                  onClick={() => updateExerciseSets(pe.exerciseId, pe.sets - 1)}
                                  className="px-2.5 py-1.5 text-muted-foreground hover:text-foreground"
                                >
                                  -
                                </button>
                                <span className="flex-1 text-center text-sm font-medium">{pe.sets}</span>
                                <button
                                  onClick={() => updateExerciseSets(pe.exerciseId, pe.sets + 1)}
                                  className="px-2.5 py-1.5 text-muted-foreground hover:text-foreground"
                                >
                                  +
                                </button>
                              </div>
                            </div>
                            <div className="flex-1">
                              <label className="text-[10px] text-muted-foreground mb-1 block">Reps</label>
                              <input
                                type="text"
                                value={pe.reps}
                                onChange={(e) => updateExerciseReps(pe.exerciseId, e.target.value)}
                                className="w-full bg-background rounded-lg px-3 py-1.5 text-sm text-center text-foreground focus:outline-none"
                                placeholder="8-12"
                              />
                            </div>
                          </div>
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
    type: "compound" as "compound" | "isolation"
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
              {exercises.map(exercise => (
                <div
                  key={exercise.id}
                  className="bg-card rounded-xl p-3 border border-border flex items-center gap-3"
                >
                  <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Dumbbell className="size-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{exercise.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-muted-foreground">{exercise.equipment}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium ${
                        exercise.type === "compound" 
                          ? "bg-amber-500/20 text-amber-500" 
                          : "bg-blue-500/20 text-blue-500"
                      }`}>
                        {exercise.type}
                      </span>
                      {exercise.antagonistPairsWith && (
                        <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-500 text-[9px] font-medium flex items-center gap-0.5">
                          <Link2 className="size-2.5" />
                          {exercise.antagonistPairsWith.join(", ")}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
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
                <div className="flex gap-2">
                  <button
                    onClick={() => setNewExercise({ ...newExercise, type: "compound" })}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      newExercise.type === "compound" 
                        ? "bg-amber-500/20 text-amber-500 border border-amber-500/30" 
                        : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    Compound
                  </button>
                  <button
                    onClick={() => setNewExercise({ ...newExercise, type: "isolation" })}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      newExercise.type === "isolation" 
                        ? "bg-blue-500/20 text-blue-500 border border-blue-500/30" 
                        : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    Isolation
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
