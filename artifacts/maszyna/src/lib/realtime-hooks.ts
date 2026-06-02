

import { useEffect, useState, useCallback } from 'react'
import { supabase } from './supabase/client'
import { useAuth } from '@/lib/auth-context'
import { RealtimeChannel } from '@supabase/supabase-js'

// Types
export interface MealLog {
  id: string
  user_id: string
  date: string
  time: string
  name: string
  details: string | null
  calories: number
  protein: number
  carbs: number
  fats: number
  created_at: string
}

export interface WorkoutLog {
  id: string
  user_id: string
  date: string
  start_time: string | null
  end_time: string | null
  plan_name: string
  exercises: unknown[]
  total_sets: number
  total_reps: number
  estimated_calories: number
  notes: string | null
  created_at: string
}

export interface StepLog {
  id: string
  user_id: string
  date: string
  steps: number
}

export interface WorkoutPlan {
  id: string
  user_id: string
  name: string
  type: 'weights' | 'cardio' | 'flexibility'
  exercises: unknown[]
  created_at: string
}

export interface PlannerEvent {
  id: string
  user_id: string
  date: string
  time: string
  type: 'meal' | 'training' | 'supplements'
  name: string
  details: string | null
  logged: boolean
  shared_with_partner: boolean
  created_at: string
}

// Hook for meal logs with real-time updates
export function useMealLogs(date?: string) {
  const { user, partner, loading: authLoading } = useAuth()
  const [meals, setMeals] = useState<MealLog[]>([])
  const [loading, setLoading] = useState(true)

  const fetchMeals = useCallback(async () => {
    if (authLoading) return
    if (!user) {
      setMeals([])
      setLoading(false)
      return
    }

    let query = supabase
      .from('meal_logs')
      .select('*')
      .order('time', { ascending: true })

    // Filter by date if provided
    if (date) {
      query = query.eq('date', date)
    }

    // Get own meals and partner's meals
    const userIds = [user.id]
    if (partner) userIds.push(partner.id)
    query = query.in('user_id', userIds)

    const { data, error } = await query
    if (error) {
      console.error('Supabase Fetch Error:', error)
      console.error('[useMealLogs] fetch error:', error.message, error.code, error.details)
    }
    setMeals(data || [])
    setLoading(false)
  }, [user, partner, date, authLoading, supabase])

  useEffect(() => {
    fetchMeals()
  }, [fetchMeals])

  // Real-time subscription
  useEffect(() => {
    if (!user) return

    const userIds = [user.id]
    if (partner) userIds.push(partner.id)

    const channel: RealtimeChannel = supabase
      .channel('meal-logs-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'meal_logs',
        },
        (payload) => {
          const record = payload.new as MealLog
          if (!userIds.includes(record?.user_id)) return

          if (payload.eventType === 'INSERT') {
            setMeals(prev => [...prev, record].sort((a, b) => a.time.localeCompare(b.time)))
          } else if (payload.eventType === 'UPDATE') {
            setMeals(prev => prev.map(m => m.id === record.id ? record : m))
          } else if (payload.eventType === 'DELETE') {
            const deleted = payload.old as { id: string }
            setMeals(prev => prev.filter(m => m.id !== deleted.id))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, partner, supabase])

  const addMeal = async (meal: Omit<MealLog, 'id' | 'user_id' | 'created_at'>) => {
    if (!user) return

    const { data, error } = await supabase
      .from('meal_logs')
      .insert({ ...meal, user_id: user.id })
      .select()
      .single()

    if (!error && data) {
      setMeals(prev => [...prev, data].sort((a, b) => a.time.localeCompare(b.time)))
    }

    return { data, error }
  }

  const deleteMeal = async (id: string) => {
    const { error } = await supabase
      .from('meal_logs')
      .delete()
      .eq('id', id)

    if (!error) {
      setMeals(prev => prev.filter(m => m.id !== id))
    }

    return { error }
  }

  return { meals, loading, addMeal, deleteMeal, refetch: fetchMeals }
}

// Hook for workout logs with real-time updates
export function useWorkoutLogs(date?: string) {
  const { user, partner, loading: authLoading } = useAuth()
  const [workouts, setWorkouts] = useState<WorkoutLog[]>([])
  const [loading, setLoading] = useState(true)
  const fetchWorkouts = useCallback(async () => {
    if (authLoading) return
    if (!user) {
      setWorkouts([])
      setLoading(false)
      return
    }

    let query = supabase
      .from('workout_logs')
      .select('*')
      .order('date', { ascending: false })

    if (date) {
      query = query.eq('date', date)
    }

    const userIds = [user.id]
    if (partner) userIds.push(partner.id)
    query = query.in('user_id', userIds)

    const { data, error } = await query
    if (error) {
      console.error('Supabase Fetch Error:', error)
      console.error('[useWorkoutLogs] fetch error:', error.message, error.code, error.details)
    }
    setWorkouts(data || [])
    setLoading(false)
  }, [user, partner, date, authLoading, supabase])

  useEffect(() => {
    fetchWorkouts()
  }, [fetchWorkouts])

  // Real-time subscription
  useEffect(() => {
    if (!user) return

    const userIds = [user.id]
    if (partner) userIds.push(partner.id)

    const channel = supabase
      .channel('workout-logs-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'workout_logs',
        },
        (payload) => {
          const record = payload.new as WorkoutLog
          if (!userIds.includes(record?.user_id)) return

          if (payload.eventType === 'INSERT') {
            setWorkouts(prev => [record, ...prev])
          } else if (payload.eventType === 'UPDATE') {
            setWorkouts(prev => prev.map(w => w.id === record.id ? record : w))
          } else if (payload.eventType === 'DELETE') {
            const deleted = payload.old as { id: string }
            setWorkouts(prev => prev.filter(w => w.id !== deleted.id))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, partner, supabase])

  const addWorkout = async (workout: Omit<WorkoutLog, 'id' | 'user_id' | 'created_at'>) => {
    if (!user) return

    const { data, error } = await supabase
      .from('workout_logs')
      .insert({ ...workout, user_id: user.id })
      .select()
      .single()

    if (!error && data) {
      setWorkouts(prev => [data, ...prev])
    }

    return { data, error }
  }

  return { workouts, loading, addWorkout, refetch: fetchWorkouts }
}

// Hook for step logs with real-time updates
export function useStepLogs() {
  const { user, partner, loading: authLoading } = useAuth()
  const [steps, setSteps] = useState<StepLog[]>([])
  const [loading, setLoading] = useState(true)

  const fetchSteps = useCallback(async () => {
    if (authLoading) return
    if (!user) {
      setSteps([])
      setLoading(false)
      return
    }

    const userIds = [user.id]
    if (partner) userIds.push(partner.id)

    const { data, error } = await supabase
      .from('step_logs')
      .select('*')
      .in('user_id', userIds)
      .order('date', { ascending: false })
      .limit(30)

    if (error) {
      console.error('Supabase Fetch Error:', error)
      console.error('[useStepLogs] fetch error:', error.message, error.code, error.details)
    }
    setSteps(data || [])
    setLoading(false)
  }, [user, partner, authLoading, supabase])

  useEffect(() => {
    fetchSteps()
  }, [fetchSteps])

  // Real-time subscription
  useEffect(() => {
    if (!user) return

    const userIds = [user.id]
    if (partner) userIds.push(partner.id)

    const channel = supabase
      .channel('step-logs-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'step_logs',
        },
        (payload) => {
          const record = payload.new as StepLog
          if (!userIds.includes(record?.user_id)) return

          if (payload.eventType === 'INSERT') {
            setSteps(prev => [record, ...prev])
          } else if (payload.eventType === 'UPDATE') {
            setSteps(prev => prev.map(s => s.id === record.id ? record : s))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, partner, supabase])

  const updateSteps = async (date: string, stepCount: number) => {
    if (!user) return

    // Upsert - update if exists, insert if not
    const { data, error } = await supabase
      .from('step_logs')
      .upsert(
        { user_id: user.id, date, steps: stepCount },
        { onConflict: 'user_id,date' }
      )
      .select()
      .single()

    if (!error && data) {
      setSteps(prev => {
        const existing = prev.findIndex(s => s.date === date && s.user_id === user.id)
        if (existing >= 0) {
          const updated = [...prev]
          updated[existing] = data
          return updated
        }
        return [data, ...prev]
      })
    }

    return { data, error }
  }

  const getTodaySteps = () => {
    if (!user) return 0
    const today = new Date().toISOString().split('T')[0]
    return steps.find(s => s.date === today && s.user_id === user.id)?.steps || 0
  }

  const getWeeklyAvgSteps = () => {
    if (!user) return 0
    const userSteps = steps.filter(s => s.user_id === user.id)
    if (userSteps.length === 0) return 0
    const total = userSteps.reduce((sum, s) => sum + s.steps, 0)
    return Math.round(total / userSteps.length)
  }

  return { steps, loading, updateSteps, getTodaySteps, getWeeklyAvgSteps, refetch: fetchSteps }
}

// Hook for planner events with real-time updates
export function usePlannerEvents(date?: string) {
  const { user, partner, loading: authLoading } = useAuth()
  const [events, setEvents] = useState<PlannerEvent[]>([])
  const [loading, setLoading] = useState(true)

  const fetchEvents = useCallback(async () => {
    if (authLoading) return
    if (!user) {
      setEvents([])
      setLoading(false)
      return
    }

    let query = supabase
      .from('planner_events')
      .select('*')
      .order('time', { ascending: true })

    if (date) {
      query = query.eq('date', date)
    }

    const userIds = [user.id]
    if (partner) userIds.push(partner.id)
    query = query.in('user_id', userIds)

    const { data, error } = await query
    if (error) {
      console.error('Supabase Fetch Error:', error)
      console.error('[usePlannerEvents] fetch error:', error.message, error.code, error.details)
    }
    setEvents(data || [])
    setLoading(false)
  }, [user, partner, date, authLoading, supabase])

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  // Real-time subscription
  useEffect(() => {
    if (!user) return

    const userIds = [user.id]
    if (partner) userIds.push(partner.id)

    const channel = supabase
      .channel('planner-events-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'planner_events',
        },
        (payload) => {
          const record = payload.new as PlannerEvent
          if (!userIds.includes(record?.user_id)) return

          if (payload.eventType === 'INSERT') {
            setEvents(prev => [...prev, record].sort((a, b) => a.time.localeCompare(b.time)))
          } else if (payload.eventType === 'UPDATE') {
            setEvents(prev => prev.map(e => e.id === record.id ? record : e))
          } else if (payload.eventType === 'DELETE') {
            const deleted = payload.old as { id: string }
            setEvents(prev => prev.filter(e => e.id !== deleted.id))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, partner, supabase])

  const addEvent = async (event: Omit<PlannerEvent, 'id' | 'user_id' | 'created_at'>) => {
    if (!user) return

    const { data, error } = await supabase
      .from('planner_events')
      .insert({ ...event, user_id: user.id })
      .select()
      .single()

    if (!error && data) {
      setEvents(prev => [...prev, data].sort((a, b) => a.time.localeCompare(b.time)))
    }

    return { data, error }
  }

  const updateEvent = async (id: string, updates: Partial<PlannerEvent>) => {
    const { data, error } = await supabase
      .from('planner_events')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (!error && data) {
      setEvents(prev => prev.map(e => e.id === id ? data : e))
    }

    return { data, error }
  }

  const deleteEvent = async (id: string) => {
    const { error } = await supabase
      .from('planner_events')
      .delete()
      .eq('id', id)

    if (!error) {
      setEvents(prev => prev.filter(e => e.id !== id))
    }

    return { error }
  }

  return { events, loading, addEvent, updateEvent, deleteEvent, refetch: fetchEvents }
}

// Hook for user workout plans with real-time updates
export function useWorkoutPlans() {
  const { user, loading: authLoading } = useAuth()
  const [plans, setPlans] = useState<WorkoutPlan[]>([])
  const [loading, setLoading] = useState(true)

  const fetchPlans = useCallback(async () => {
    if (authLoading) return
    if (!user) {
      setPlans([])
      setLoading(false)
      return
    }

    const { data, error } = await supabase
      .from('user_workout_plans')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Supabase Fetch Error:', error)
      console.error('[useWorkoutPlans] fetch error:', error.message, error.code, error.details)
    }
    setPlans(data || [])
    setLoading(false)
  }, [user, authLoading, supabase])

  useEffect(() => {
    fetchPlans()
  }, [fetchPlans])

  // Real-time subscription
  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel('user-workout-plans-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_workout_plans',
        },
        (payload) => {
          const record = payload.new as WorkoutPlan
          if (record?.user_id !== user.id) return

          if (payload.eventType === 'INSERT') {
            setPlans(prev => [record, ...prev])
          } else if (payload.eventType === 'UPDATE') {
            setPlans(prev => prev.map(p => p.id === record.id ? record : p))
          } else if (payload.eventType === 'DELETE') {
            const deleted = payload.old as { id: string }
            setPlans(prev => prev.filter(p => p.id !== deleted.id))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, supabase])

  const addPlan = async (plan: Omit<WorkoutPlan, 'id' | 'user_id' | 'created_at'>) => {
    if (!user) return

    const { data, error } = await supabase
      .from('user_workout_plans')
      .insert({ ...plan, user_id: user.id })
      .select()
      .single()

    if (!error && data) {
      setPlans(prev => [data, ...prev])
    }

    return { data, error }
  }

  const deletePlan = async (id: string) => {
    const { error } = await supabase
      .from('user_workout_plans')
      .delete()
      .eq('id', id)

    if (!error) {
      setPlans(prev => prev.filter(p => p.id !== id))
    }

    return { error }
  }

  return { plans, loading, addPlan, deletePlan, refetch: fetchPlans }
}

// Ingredient from Supabase
export interface DbIngredient {
  id: string
  name: string
  category: string
  protein: number
  fat: number
  carbohydrates: number
  fiber: number
  calories: number
  average_weight: number | null
  recipe_steps?: string[] | null
  sub_ingredients?: { ingredient_id: string; name: string; grams: number }[] | null
  yield_grams?: number | null
  marcin_servings?: number | null
  patrycja_servings?: number | null
}

// Hook for global ingredients (no user filter, RLS disabled)
export function useIngredients() {
  const [ingredients, setIngredients] = useState<DbIngredient[]>([])
  const [loading, setLoading] = useState(true)

  const fetchIngredients = useCallback(async () => {
    const { data, error } = await supabase
      .from('ingredients')
      .select('*')
      .order('name', { ascending: true })

    if (error) {
      console.error('Supabase Fetch Error:', error)
      console.error('[useIngredients] fetch error:', error.message, error.code, error.details)
      setIngredients([])
      setLoading(false)
      return
    }

    if (data) {
      const mapped = data.map((item: any) => ({
        id: item.id,
        name: item.name,
        category: item.category,
        protein: item.protein ?? item.total_protein ?? 0,
        fat: item.fat ?? item.total_fat ?? 0,
        carbohydrates: item.carbohydrates ?? item.carbs ?? item.total_carbs ?? 0,
        fiber: item.fiber ?? item.total_fiber ?? 0,
        calories: item.calories ?? item.total_calories ?? 0,
        average_weight: item.average_weight ?? null,
        recipe_steps: Array.isArray(item.recipe_steps) ? item.recipe_steps : [],
        sub_ingredients: Array.isArray(item.sub_ingredients) ? item.sub_ingredients : [],
        yield_grams: item.yield_grams ?? null,
        marcin_servings: item.marcin_servings ?? null,
        patrycja_servings: item.patrycja_servings ?? null,
      }))
      setIngredients(mapped)
    } else {
      setIngredients([])
    }
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchIngredients()
  }, [fetchIngredients])

  const addIngredient = async (ingredient: Omit<DbIngredient, 'id'>) => {
    const payload = {
      ...ingredient,
      recipe_steps: Array.isArray(ingredient.recipe_steps) ? ingredient.recipe_steps : [],
      sub_ingredients: Array.isArray(ingredient.sub_ingredients) ? ingredient.sub_ingredients : [],
    }

    const { data, error } = await supabase
      .from('ingredients')
      .insert(payload)
      .select()
      .single()

    if (error) {
      console.error('Supabase Insert Error:', error)
      console.error('[useIngredients] add error:', error.message, error.code, error.details)
      return { data: null, error }
    }

    if (data) {
      setIngredients(prev => [...prev, data as DbIngredient].sort((a, b) => a.name.localeCompare(b.name)))
    }
    return { data, error }
  }

  const deleteIngredient = async (id: string) => {
    const { error } = await supabase
      .from('ingredients')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Supabase Delete Error:', error)
      console.error('[useIngredients] delete error:', error.message, error.code, error.details)
      return { error }
    }

    setIngredients(prev => prev.filter(i => i.id !== id))
    return { error }
  }

  return { ingredients, loading, addIngredient, deleteIngredient, refetch: fetchIngredients }
}

// Dish type from Supabase
export interface DishItem {
  id: string
  name: string
  elements: { type: "ingredient" | "component"; id: string; name: string; grams: number }[]
  totalCalories: number
  totalProtein: number
  totalCarbs: number
  totalFats: number
  totalFiber: number
  mainCategory: "Large" | "Light" | "Snacks" | "Drinks"
  subCategory: string
  marcinServings?: number
  patrycjaServings?: number
}

function mapDishFromDb(dbDish: any): DishItem {
  return {
    id: dbDish.id,
    name: dbDish.name,
    elements: Array.isArray(dbDish.elements) ? dbDish.elements : [],
    totalCalories: dbDish.total_calories ?? dbDish.calories ?? 0,
    totalProtein: dbDish.total_protein ?? dbDish.protein ?? 0,
    totalCarbs: dbDish.total_carbs ?? dbDish.carbs ?? dbDish.carbohydrates ?? 0,
    totalFats: dbDish.total_fats ?? dbDish.fats ?? dbDish.fat ?? 0,
    totalFiber: dbDish.total_fiber ?? dbDish.fiber ?? 0,
    mainCategory: (dbDish.main_category || dbDish.category || "Large") as "Large" | "Light" | "Snacks" | "Drinks",
    subCategory: dbDish.sub_category || dbDish.subCategory || "Custom",
    marcinServings: dbDish.marcin_servings ?? dbDish.marcinServings ?? undefined,
    patrycjaServings: dbDish.patrycja_servings ?? dbDish.patrycjaServings ?? undefined,
  }
}

function mapDishToDb(dish: Omit<DishItem, 'id' | 'user_id' | 'created_at'>): any {
  return {
    name: dish.name,
    elements: Array.isArray(dish.elements) ? dish.elements : [],
    total_calories: dish.totalCalories,
    total_protein: dish.totalProtein,
    total_carbs: dish.totalCarbs,
    total_fats: dish.totalFats,
    total_fiber: dish.totalFiber,
    main_category: dish.mainCategory,
    sub_category: dish.subCategory,
    marcin_servings: dish.marcinServings,
    patrycja_servings: dish.patrycjaServings,
  }
}

// Hook for user dishes (fetched with user_id filter)
// Tries 'recipes' table first, then falls back to 'dishes'
export function useDishes() {
  const { user, partner, loading: authLoading } = useAuth()
  const [dishes, setDishes] = useState<DishItem[]>([])
  const [loading, setLoading] = useState(true)

  const fetchDishes = useCallback(async () => {
    if (authLoading) return
    if (!user) {
      setDishes([])
      setLoading(false)
      return
    }

    const userIds = [user.id]
    if (partner) userIds.push(partner.id)

    let tableName = 'recipes'
    let { data, error } = await supabase
      .from(tableName)
      .select('*')
      .in('user_id', userIds)
      .order('created_at', { ascending: false })

    if (error && error.code === '42P01') {
      console.warn('[useDishes] Table "recipes" not found, trying "dishes"...')
      tableName = 'dishes'
      const fallback = await supabase
        .from(tableName)
        .select('*')
        .in('user_id', userIds)
        .order('created_at', { ascending: false })
      data = fallback.data
      error = fallback.error
    }

    if (error) {
      console.error('Supabase Fetch Error:', error)
      console.error('[useDishes] fetch error:', error.message, error.code, error.details)
      setDishes([])
      setLoading(false)
      return
    }

    setDishes((data || []).map(mapDishFromDb))
    setLoading(false)
  }, [user, partner, authLoading, supabase])

  useEffect(() => {
    fetchDishes()
  }, [fetchDishes])

  const addDish = async (dish: Omit<DishItem, 'id' | 'user_id' | 'created_at'>) => {
    if (!user) return { data: null, error: new Error('Not logged in') }

    const payload = { ...mapDishToDb(dish), user_id: user.id }

    let tableName = 'recipes'
    let { data, error } = await supabase
      .from(tableName)
      .insert(payload)
      .select()
      .single()

    if (error && error.code === '42P01') {
      console.warn('[useDishes] Table "recipes" not found for insert, trying "dishes"...')
      tableName = 'dishes'
      const fallback = await supabase
        .from(tableName)
        .insert(payload)
        .select()
        .single()
      data = fallback.data
      error = fallback.error
    }

    if (error) {
      console.error('Supabase Insert Error:', error)
      console.error('[useDishes] add error:', error.message, error.code, error.details)
      return { data: null, error }
    }

    if (data) {
      setDishes(prev => [mapDishFromDb(data), ...prev])
    }
    return { data, error }
  }

  const deleteDish = async (id: string) => {
    let tableName = 'recipes'
    let { error } = await supabase
      .from(tableName)
      .delete()
      .eq('id', id)

    if (error && error.code === '42P01') {
      tableName = 'dishes'
      const fallback = await supabase
        .from(tableName)
        .delete()
        .eq('id', id)
      error = fallback.error
    }

    if (error) {
      console.error('Supabase Delete Error:', error)
      console.error('[useDishes] delete error:', error.message, error.code, error.details)
      return { error }
    }

    setDishes(prev => prev.filter(d => d.id !== id))
    return { error }
  }

  return { dishes, loading, addDish, deleteDish, refetch: fetchDishes }
}
