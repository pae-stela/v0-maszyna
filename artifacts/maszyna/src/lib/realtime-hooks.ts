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
  logged: boolean
  fiber?: number
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
  updated_at?: string
}

// Hook for meal logs with real-time updates
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

    // Unikalny identyfikator kanału zapobiega konfliktom przy wielokrotnym montowaniu komponentu
    const uniqueChannelId = `meal-logs-changes-${Math.random().toString(36).substring(2, 9)}`

    const channel: RealtimeChannel = supabase
      .channel(uniqueChannelId)
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
            setMeals(prev => {
              if (prev.some(m => m.id === record.id)) return prev
              return [...prev, record].sort((a, b) => a.time.localeCompare(b.time))
            })
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
    if (!user) return { data: null, error: new Error('Not logged in') }

    const { data, error } = await supabase
      .from('meal_logs')
      .insert({ ...meal, user_id: user.id })
      .select()
      .single()

    if (error) {
      console.error('[addMeal] error:', error.message, error.code, error.details)
      return { data: null, error }
    }

    if (data) {
      // Add immediately for responsive UI; realtime subscription will no-op if already present
      setMeals(prev => {
        if (prev.some(m => m.id === data.id)) return prev
        return [...prev, data].sort((a, b) => a.time.localeCompare(b.time))
      })
    }

    return { data, error }
  }

  const updateMeal = async (id: string, updates: Partial<MealLog>) => {
    const { data, error } = await supabase
      .from('meal_logs')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (!error && data) {
      setMeals(prev => prev.map(m => m.id === id ? data : m))
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

  const toggleMealLogged = async (id: string, currentLogged: boolean) => {
    // Optimistic update — instant visual feedback
    setMeals(prev => prev.map(m => m.id === id ? { ...m, logged: !currentLogged } : m))
    const { data, error } = await supabase
      .from('meal_logs')
      .update({ logged: !currentLogged })
      .eq('id', id)
      .select()
      .single()
    if (error) {
      // Log but do NOT rollback — the calling component tracks override state
      // so the tick stays visible even if the DB update silently fails (RLS)
      console.error('[toggleMealLogged] DB update failed:', error.message, error.code)
    } else if (data) {
      // Sync local state with confirmed DB value
      setMeals(prev => prev.map(m => m.id === id ? data : m))
    }
  }

  return { meals, loading, addMeal, updateMeal, deleteMeal, toggleMealLogged, refetch: fetchMeals }
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

    const uniqueChannelId = `workout-logs-changes-${Math.random().toString(36).substring(2, 9)}`

    const channel = supabase
      .channel(uniqueChannelId)
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

    const uniqueChannelId = `step-logs-changes-${Math.random().toString(36).substring(2, 9)}`

    const channel = supabase
      .channel(uniqueChannelId)
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

    const uniqueChannelId = `planner-events-changes-${Math.random().toString(36).substring(2, 9)}`

    const channel = supabase
      .channel(uniqueChannelId)
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
            setEvents(prev => {
              if (prev.some(e => e.id === record.id)) return prev
              return [...prev, record].sort((a, b) => a.time.localeCompare(b.time))
            })
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

  const addEvent = async (event: Partial<PlannerEvent> & Pick<PlannerEvent, 'date' | 'time' | 'type' | 'name'>) => {
    if (!user) return { data: null, error: new Error('Not logged in') }

    const { data, error } = await supabase
      .from('planner_events')
      .insert({ ...event, user_id: user.id })
      .select()
      .single()

    if (error) {
      console.error('[addEvent] error:', error.message, error.code, error.details)
      return { data: null, error }
    }

    if (data) {
      // Add immediately for responsive UI; realtime subscription will no-op if already present
      setEvents(prev => {
        if (prev.some(e => e.id === data.id)) return prev
        return [...prev, data].sort((a, b) => a.time.localeCompare(b.time))
      })
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

  const toggleEventLogged = async (id: string, currentLogged: boolean) => {
    return updateEvent(id, { logged: !currentLogged })
  }

  return { events, loading, addEvent, updateEvent, deleteEvent, toggleEventLogged, refetch: fetchEvents }
}

// Hook for user workout plans with real-time updates
export function useWorkoutPlans() {
  const { user, partner, loading: authLoading } = useAuth()
  const [plans, setPlans] = useState<WorkoutPlan[]>([])
  const [loading, setLoading] = useState(true)

  const fetchPlans = useCallback(async () => {
    if (authLoading) return
    if (!user) {
      setPlans([])
      setLoading(false)
      return
    }

    const userIds = [user.id]
    if (partner) userIds.push(partner.id)

    const { data, error } = await supabase
      .from('user_workout_plans')
      .select('*')
      .in('user_id', userIds)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Supabase Fetch Error:', error)
      console.error('[useWorkoutPlans] fetch error:', error.message, error.code, error.details)
    }
    setPlans(data || [])
    setLoading(false)
  }, [user, partner, authLoading, supabase])

  useEffect(() => {
    fetchPlans()
  }, [fetchPlans])

  // Real-time subscription — shared between partners
  useEffect(() => {
    if (!user) return

    const userIds = [user.id]
    if (partner) userIds.push(partner.id)

    const uniqueChannelId = `user-workout-plans-changes-${Math.random().toString(36).substring(2, 9)}`

    const channel = supabase
      .channel(uniqueChannelId)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_workout_plans',
        },
        (payload) => {
          const record = payload.new as WorkoutPlan
          if (!userIds.includes(record?.user_id)) return

          if (payload.eventType === 'INSERT') {
            setPlans(prev => prev.some(p => p.id === record.id) ? prev : [record, ...prev])
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
  }, [user, partner, supabase])

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

  const mapIngredient = (item: any): DbIngredient => ({
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
  })

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

    setIngredients(data ? data.map(mapIngredient) : [])
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchIngredients()
  }, [fetchIngredients])

  // Real-time subscription — ingredients are global (shared by both partners)
  useEffect(() => {
    const channel = supabase
      .channel(`ingredients-changes-${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ingredients' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const rec = mapIngredient(payload.new)
          setIngredients(prev => {
            if (prev.some(i => i.id === rec.id)) return prev
            return [...prev, rec].sort((a, b) => a.name.localeCompare(b.name))
          })
        } else if (payload.eventType === 'UPDATE') {
          const rec = mapIngredient(payload.new)
          setIngredients(prev => prev.map(i => i.id === rec.id ? rec : i))
        } else if (payload.eventType === 'DELETE') {
          const del = payload.old as { id: string }
          setIngredients(prev => prev.filter(i => i.id !== del.id))
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [supabase])

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

  const updateIngredient = async (id: string, updates: Partial<DbIngredient>) => {
    const payload: any = { ...updates }
    if (updates.recipe_steps !== undefined) {
      payload.recipe_steps = Array.isArray(updates.recipe_steps) ? updates.recipe_steps : []
    }
    if (updates.sub_ingredients !== undefined) {
      payload.sub_ingredients = Array.isArray(updates.sub_ingredients) ? updates.sub_ingredients : []
    }

    const { data, error } = await supabase
      .from('ingredients')
      .update(payload)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Supabase Update Error:', error)
      console.error('[useIngredients] update error:', error.message, error.code, error.details)
      return { data: null, error }
    }

    if (data) {
      setIngredients(prev => prev.map(i => i.id === id ? data as DbIngredient : i))
    }
    return { data, error }
  }

  return { ingredients, loading, addIngredient, deleteIngredient, updateIngredient, refetch: fetchIngredients }
}

// Dish type from Supabase (recipes table)
export interface DishItem {
  id: string
  user_id?: string
  name: string
  description?: string | null
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
  servings?: number
  prepTime?: number
  cookTime?: number
  isCustom?: boolean
  recipeSteps?: string[] | null
  steps?: string[] | null
  profileImageUrl?: string | null
  galleryImages?: string[] | null
  recipeUrl?: string | null
  owner?: "both" | "marcin" | "patrycja"
}

function mapDishFromDb(dbDish: any): DishItem {
  // Parse owner from description JSON if present
  let owner: "both" | "marcin" | "patrycja" | undefined = undefined
  if (dbDish.description) {
    try {
      const parsed = JSON.parse(dbDish.description)
      if (parsed.owner === "marcin" || parsed.owner === "patrycja" || parsed.owner === "both") {
        owner = parsed.owner
      }
    } catch { /* ignore */ }
  }
  return {
    id: dbDish.id,
    user_id: dbDish.user_id ?? undefined,
    name: dbDish.name ?? '',
    description: dbDish.description ?? null,
    elements: Array.isArray(dbDish.elements) ? dbDish.elements : [],
    totalCalories: dbDish.total_calories ?? 0,
    totalProtein: dbDish.total_protein ?? dbDish.total_proteins ?? dbDish.protein ?? 0,
    totalCarbs: dbDish.total_carbs ?? 0,
    totalFats: dbDish.total_fats ?? 0,
    totalFiber: dbDish.total_fiber ?? 0,
    mainCategory: (dbDish.main_category || "Large") as "Large" | "Light" | "Snacks" | "Drinks",
    subCategory: dbDish.sub_category || "",
    marcinServings: dbDish.marcin_servings ?? undefined,
    patrycjaServings: dbDish.patrycja_servings ?? undefined,
    servings: dbDish.servings ?? undefined,
    prepTime: dbDish.prep_time ?? undefined,
    cookTime: dbDish.cook_time ?? undefined,
    isCustom: dbDish.is_custom ?? false,
    recipeSteps: Array.isArray(dbDish.recipe_steps) ? dbDish.recipe_steps : null,
    steps: Array.isArray(dbDish.steps) ? dbDish.steps : null,
    profileImageUrl: dbDish.profile_image_url ?? null,
    galleryImages: Array.isArray(dbDish.gallery_images) ? dbDish.gallery_images : null,
    recipeUrl: dbDish.recipe_url ?? null,
    owner,
  }
}

function mapDishToDb(dish: Omit<DishItem, 'id' | 'user_id' | 'created_at'>): any {
  return {
    name: dish.name,
    description: dish.description ?? null,
    elements: Array.isArray(dish.elements) ? dish.elements : [],
    total_calories: dish.totalCalories,
    total_protein: dish.totalProtein,
    total_carbs: dish.totalCarbs,
    total_fats: dish.totalFats,
    total_fiber: dish.totalFiber,
    main_category: dish.mainCategory,
    sub_category: dish.subCategory,
    marcin_servings: dish.marcinServings ?? null,
    patrycja_servings: dish.patrycjaServings ?? null,
    servings: dish.servings ?? null,
    prep_time: dish.prepTime ?? null,
    cook_time: dish.cookTime ?? null,
    is_custom: dish.isCustom ?? false,
    recipe_steps: Array.isArray(dish.recipeSteps) ? dish.recipeSteps : null,
    steps: Array.isArray(dish.steps) ? dish.steps : null,
    profile_image_url: dish.profileImageUrl ?? null,
    gallery_images: Array.isArray(dish.galleryImages) ? dish.galleryImages : null,
    recipe_url: dish.recipeUrl ?? null,
  }
}

// Hook for user recipes (fetched from the 'recipes' table)
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

    const { data, error } = await supabase
      .from('recipes')
      .select('*')
      .in('user_id', userIds)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Supabase Fetch Error:', error)
      console.error('[useDishes] fetch error:', error.message, error.code, error.details)
      setDishes([])
      setLoading(false)
      return
    }

    setDishes((data || []).map(mapDishFromDb))
    loading && setLoading(false)
  }, [user, partner, authLoading, supabase])

  useEffect(() => {
    fetchDishes()
  }, [fetchDishes])

  // Real-time subscription — dishes are shared between partners
  useEffect(() => {
    if (!user) return

    const userIds = [user.id]
    if (partner) userIds.push(partner.id)

    const channel = supabase
      .channel(`recipes-changes-${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'recipes' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const rec = payload.new as any
          if (!userIds.includes(rec?.user_id)) return
          const mapped = mapDishFromDb(rec)
          setDishes(prev => prev.some(d => d.id === mapped.id) ? prev : [mapped, ...prev])
        } else if (payload.eventType === 'UPDATE') {
          const rec = payload.new as any
          if (!userIds.includes(rec?.user_id)) return
          setDishes(prev => prev.map(d => d.id === rec.id ? mapDishFromDb(rec) : d))
        } else if (payload.eventType === 'DELETE') {
          const del = payload.old as { id: string }
          setDishes(prev => prev.filter(d => d.id !== del.id))
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [user, partner, supabase])

  const addDish = async (dish: Omit<DishItem, 'id' | 'user_id' | 'created_at'>) => {
    if (!user) return { data: null, error: new Error('Not logged in') }

    const payload = { ...mapDishToDb(dish), user_id: user.id }

    const { data, error } = await supabase
      .from('recipes')
      .insert(payload)
      .select()
      .single()

    if (error) {
      console.error('Supabase Insert Error:', error)
      console.error('[useDishes] add error:', error.message, error.code, error.details)
      return { data: null, error }
    }

    if (data) {
      // Merge in locally-known image/URL data in case the server response is missing these columns
      const mapped = mapDishFromDb(data)
      setDishes(prev => [{
        ...mapped,
        profileImageUrl: mapped.profileImageUrl ?? dish.profileImageUrl ?? null,
        galleryImages: mapped.galleryImages ?? dish.galleryImages ?? null,
        recipeUrl: mapped.recipeUrl ?? dish.recipeUrl ?? null,
      }, ...prev])
    }
    return { data, error }
  }

  const deleteDish = async (id: string) => {
    const { error } = await supabase
      .from('recipes')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Supabase Delete Error:', error)
      console.error('[useDishes] delete error:', error.message, error.code, error.details)
      return { error }
    }

    setDishes(prev => prev.filter(d => d.id !== id))
    return { error }
  }

  const updateDish = async (id: string, updates: Partial<DishItem>) => {
    const payload: any = {}
    if (updates.name !== undefined) payload.name = updates.name
    if (updates.description !== undefined) payload.description = updates.description ?? null
    if (updates.elements !== undefined) payload.elements = Array.isArray(updates.elements) ? updates.elements : []
    if (updates.totalCalories !== undefined) payload.total_calories = updates.totalCalories
    if (updates.totalProtein !== undefined) payload.total_protein = updates.totalProtein
    if (updates.totalCarbs !== undefined) payload.total_carbs = updates.totalCarbs
    if (updates.totalFats !== undefined) payload.total_fats = updates.totalFats
    if (updates.totalFiber !== undefined) payload.total_fiber = updates.totalFiber
    if (updates.mainCategory !== undefined) payload.main_category = updates.mainCategory
    if (updates.subCategory !== undefined) payload.sub_category = updates.subCategory
    if (updates.marcinServings !== undefined) payload.marcin_servings = updates.marcinServings ?? null
    if (updates.patrycjaServings !== undefined) payload.patrycja_servings = updates.patrycjaServings ?? null
    if (updates.servings !== undefined) payload.servings = updates.servings ?? null
    if (updates.prepTime !== undefined) payload.prep_time = updates.prepTime ?? null
    if (updates.cookTime !== undefined) payload.cook_time = updates.cookTime ?? null
    if (updates.isCustom !== undefined) payload.is_custom = updates.isCustom
    if (updates.recipeSteps !== undefined) payload.recipe_steps = Array.isArray(updates.recipeSteps) ? updates.recipeSteps : null
    if (updates.steps !== undefined) payload.steps = Array.isArray(updates.steps) ? updates.steps : null
    if (updates.profileImageUrl !== undefined) payload.profile_image_url = updates.profileImageUrl ?? null
    if (updates.galleryImages !== undefined) payload.gallery_images = Array.isArray(updates.galleryImages) ? updates.galleryImages : null
    if (updates.recipeUrl !== undefined) payload.recipe_url = updates.recipeUrl ?? null

    const { data, error } = await supabase
      .from('recipes')
      .update(payload)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Supabase Update Error:', error)
      console.error('[useDishes] update error:', error.message, error.code, error.details)
      return { data: null, error }
    }

    if (data) {
      setDishes(prev => prev.map(d => d.id === id ? mapDishFromDb(data) : d))
    }
    return { data, error }
  }

  return { dishes, loading, addDish, deleteDish, updateDish, refetch: fetchDishes }
}

// ─── Shopping List (real-time, shared between partners) ───────────────────────

export interface ShoppingListRow {
  id: string
  user_id: string
  name: string
  category: string
  checked: boolean
  quantity: string
  imported_from: { dishName: string; date: string; dishId?: string } | null
  created_at: string
  updated_at: string
}

const SHOPPING_LS_KEY = (userId: string) => `shopping-list-v2-${userId}`

function lsLoad(userId: string): ShoppingListRow[] {
  try {
    const raw = localStorage.getItem(SHOPPING_LS_KEY(userId))
    if (raw) return JSON.parse(raw) as ShoppingListRow[]
  } catch { }
  return []
}

function lsSave(userId: string, items: ShoppingListRow[]) {
  try { localStorage.setItem(SHOPPING_LS_KEY(userId), JSON.stringify(items)) } catch { }
}

export function useShoppingList() {
  const { user, loading: authLoading } = useAuth()
  const [items, setItems] = useState<ShoppingListRow[]>([])
  const [loading, setLoading] = useState(true)
  const [useLocal, setUseLocal] = useState(false) // fallback when table not yet created

  // ── Fetch ────────────────────────────────────────────────────────────────────
  const fetchItems = useCallback(async () => {
    if (authLoading) return
    if (!user) {
      setItems([])
      setLoading(false)
      return
    }

    const { data, error } = await supabase
      .from('shopping_list')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })

    if (error) {
      // Table doesn't exist yet — fall back to localStorage
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        console.warn('[useShoppingList] table not ready, using localStorage')
        setUseLocal(true)
        setItems(lsLoad(user.id))
      } else {
        console.error('[useShoppingList] fetch error:', error.message)
      }
      setLoading(false)
      return
    }

    setUseLocal(false)
    setItems(data || [])
    setLoading(false)
  }, [user, authLoading])

  useEffect(() => { fetchItems() }, [fetchItems])

  // ── Real-time subscription ────────────────────────────────────────────────────
  useEffect(() => {
    if (!user || useLocal) return

    const channel: RealtimeChannel = supabase
      .channel(`shopping-list-${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shopping_list' }, (payload) => {
        const rec = payload.new as ShoppingListRow
        if (rec?.user_id && rec.user_id !== user.id) return

        if (payload.eventType === 'INSERT') {
          setItems(prev => prev.some(i => i.id === rec.id) ? prev : [...prev, rec])
        } else if (payload.eventType === 'UPDATE') {
          setItems(prev => prev.map(i => i.id === rec.id ? rec : i))
        } else if (payload.eventType === 'DELETE') {
          const del = payload.old as { id: string }
          setItems(prev => prev.filter(i => i.id !== del.id))
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [user, useLocal])

  // ── Write helpers ─────────────────────────────────────────────────────────────
  const _localSave = (updated: ShoppingListRow[]) => {
    setItems(updated)
    if (user) lsSave(user.id, updated)
  }

  const addItem = async (item: Omit<ShoppingListRow, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) return
    if (useLocal) {
      const row: ShoppingListRow = {
        ...item, id: crypto.randomUUID(), user_id: user.id,
        created_at: new Date().toISOString(), updated_at: new Date().toISOString()
      }
      _localSave([...items, row])
      return
    }
    const optimisticId = `opt-${Date.now()}`
    const optimistic: ShoppingListRow = {
      ...item, id: optimisticId, user_id: user.id,
      created_at: new Date().toISOString(), updated_at: new Date().toISOString()
    }
    setItems(prev => [...prev, optimistic])
    const { data, error } = await supabase
      .from('shopping_list')
      .insert({ ...item, user_id: user.id })
      .select()
      .single()
    if (error) {
      console.error('[useShoppingList] insert error:', error.message)
      setItems(prev => prev.filter(i => i.id !== optimisticId))
    } else if (data) {
      setItems(prev => prev.map(i => i.id === optimisticId ? (data as ShoppingListRow) : i))
    }
  }

  const updateItem = async (id: string, changes: Partial<Pick<ShoppingListRow, 'name' | 'quantity' | 'category' | 'checked'>>) => {
    if (!user) return
    if (useLocal) {
      _localSave(items.map(i => i.id === id ? { ...i, ...changes } : i))
      return
    }
    const { error } = await supabase.from('shopping_list').update({ ...changes, updated_at: new Date().toISOString() }).eq('id', id).eq('user_id', user.id)
    if (error) console.error('[useShoppingList] update error:', error.message)
  }

  const removeItem = async (id: string) => {
    if (!user) return
    if (useLocal) { _localSave(items.filter(i => i.id !== id)); return }
    const { error } = await supabase.from('shopping_list').delete().eq('id', id).eq('user_id', user.id)
    if (error) console.error('[useShoppingList] delete error:', error.message)
  }

  const clearChecked = async () => {
    if (!user) return
    const checkedIds = items.filter(i => i.checked).map(i => i.id)
    if (!checkedIds.length) return
    if (useLocal) { _localSave(items.filter(i => !i.checked)); return }
    const { error } = await supabase.from('shopping_list').delete().in('id', checkedIds).eq('user_id', user.id)
    if (error) console.error('[useShoppingList] clearChecked error:', error.message)
  }

  const clearAll = async () => {
    if (!user) return
    if (useLocal) { _localSave([]); return }
    const { error } = await supabase.from('shopping_list').delete().eq('user_id', user.id)
    if (error) console.error('[useShoppingList] clearAll error:', error.message)
    else setItems([])
  }

  const toggleItem = (id: string) => {
    const item = items.find(i => i.id === id)
    if (item) updateItem(id, { checked: !item.checked })
  }

  return { items, loading, useLocal, addItem, updateItem, removeItem, toggleItem, clearChecked, clearAll, refetch: fetchItems }
}
