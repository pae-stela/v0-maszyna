
import { getT } from "@/lib/i18n";
import { useState, useMemo, useEffect } from "react"
import { useUser } from "@/lib/user-context"
import { useIngredients, useDishes, type DbIngredient } from "@/lib/realtime-hooks"
import { Calculator, Search, Plus, Trash2, Apple, ChefHat, UtensilsCrossed, FileText, ChevronDown } from "lucide-react"

type SubTab = "calculator" | "ingredients" | "dishes"

// Unified type for both raw ingredients and components (bulk preparations)
// Components have recipe steps and sub-ingredients, regular ingredients don't
interface IngredientItem {
  id: string
  name: string
  caloriesPer100g: number
  proteinPer100g: number
  carbsPer100g: number
  fatsPer100g: number
  fiberPer100g: number
  category: string
  // Component-specific fields (only present for category "Component")
  isComponent?: boolean
  subIngredients?: { ingredientId: string; name: string; grams: number }[]
  recipeSteps?: string[]
  yieldGrams?: number
  marcinServings?: number
  patrycjaServings?: number
}

// Dishes - composed of ingredients and/or components
interface DishItem {
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
  recipeSteps?: string[]
  steps?: string[]
}

// Category structure for dishes
const dishCategories: Record<string, string[]> = {
  "Large": ["Pasta & Rice", "Traditional", "Pancakes & Tortillas", "Salads & Veggies", "Fakeaways"],
  "Light": ["Eggs", "Sandwiches & Wraps", "Soups", "Sweet Bakes & Desserts", "Oats & Granola"],
  "Snacks": ["Savoury", "Sweet"],
  "Drinks": ["Shakes & Smoothies", "Cocktails & Mocktails", "Hot drinks", "Cold drinks"],
}

// LoggedMeals would be in the planner/dashboard - dishes assigned to user, date, meal time

interface CalculatorIngredient {
  id: string
  name: string
  grams: number
  calories: number
  protein: number
  carbs: number
  fats: number
  fiber: number
  selected?: boolean
}

// ingredientDatabase removed — now pulling from Supabase 'ingredients' table


interface EditMode {
  type: 'dish' | 'component'
  id: string
  name: string
  elements: { type: "ingredient" | "component"; id: string; name: string; grams: number }[]
  recipeSteps?: string[]
  marcinServings?: number
  patrycjaServings?: number
  mainCategory?: "Large" | "Light" | "Snacks" | "Drinks"
  subCategory?: string
}

export function KitchenScreen() {
  const [subTab, setSubTab] = useState<SubTab>("calculator")
  const [editMode, setEditMode] = useState<EditMode | null>(null)
  const { activeUser } = useUser()

  const handleTabChange = (tab: SubTab) => {
    setSubTab(tab)
    if (tab !== 'calculator') {
      setEditMode(null)
    }
  }

  return (
    <div className="flex flex-col gap-4 pb-24">
      <div className="flex gap-1 p-1 bg-secondary rounded-xl">
        <button
          onClick={() => handleTabChange("calculator")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
            subTab === "calculator"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground"
          }`}
        >
          <Calculator className="size-4" />
          <span className="hidden xs:inline">Calculator</span>
          <span className="xs:hidden">Calc</span>
        </button>
        <button
          onClick={() => handleTabChange("ingredients")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
            subTab === "ingredients"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground"
          }`}
        >
          <Apple className="size-4" />
          <span className="hidden xs:inline">Ingredients</span>
          <span className="xs:hidden">Ingr.</span>
        </button>
        <button
          onClick={() => handleTabChange("dishes")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
            subTab === "dishes"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground"
          }`}
        >
          <UtensilsCrossed className="size-4" />
          Dishes
        </button>
      </div>

      {subTab === "calculator" && (
        <CalculatorView
          activeUser={activeUser}
          editMode={editMode}
          onClearEdit={() => setEditMode(null)}
        />
      )}
      {subTab === "ingredients" && <IngredientsView onEditComponent={(mode) => { setEditMode(mode); setSubTab('calculator') }} />}
      {subTab === "dishes" && <DishesView onEditDish={(mode) => { setEditMode(mode); setSubTab('calculator') }} />}
    </div>
  )
}

function CalculatorView({ activeUser, editMode, onClearEdit }: { activeUser: string; editMode: EditMode | null; onClearEdit: () => void }) {
  const [ingredients, setIngredients] = useState<CalculatorIngredient[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedIngredient, setSelectedIngredient] = useState<string | null>(null)
  const [amount, setAmount] = useState("")
  const [useUnits, setUseUnits] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [saveName, setSaveName] = useState("")
  const [saveMainCategory, setSaveMainCategory] = useState<"Large" | "Light" | "Snacks" | "Drinks">("Large")
  const [saveSubCategory, setSaveSubCategory] = useState("")
  const [saveRecipeSteps, setSaveRecipeSteps] = useState("")
  const [marcinServings, setMarcinServings] = useState(1)
  const [patrycjaServings, setPatrycjaServings] = useState(1)

  const { ingredients: dbIngredients, loading: dbLoading, addIngredient } = useIngredients()
  const { addDish, updateDish } = useDishes()

  // Initialize calculator from editMode
  useEffect(() => {
    if (!editMode) return
    setSaveName(editMode.name)
    setSaveRecipeSteps(editMode.recipeSteps?.join('\n') || "")
    setMarcinServings(editMode.marcinServings || 1)
    setPatrycjaServings(editMode.patrycjaServings || 1)
    if (editMode.mainCategory) setSaveMainCategory(editMode.mainCategory)
    if (editMode.subCategory) setSaveSubCategory(editMode.subCategory)

    // Convert elements to calculator ingredients
    const calcIngredients: CalculatorIngredient[] = editMode.elements.map((el, idx) => {
      const dbIng = dbIngredients.find(d => d.name.toLowerCase() === el.name.toLowerCase())
      const multiplier = el.grams / 100
      return {
        id: `${Date.now()}-${idx}`,
        name: el.name,
        grams: el.grams,
        calories: Math.round((dbIng?.calories || 0) * multiplier),
        protein: Math.round((dbIng?.protein || 0) * multiplier * 10) / 10,
        carbs: Math.round((dbIng?.carbohydrates || 0) * multiplier * 10) / 10,
        fats: Math.round((dbIng?.fat || 0) * multiplier * 10) / 10,
        fiber: Math.round((dbIng?.fiber || 0) * multiplier * 10) / 10,
        selected: false,
      }
    })
    setIngredients(calcIngredients)
  }, [editMode, dbIngredients])

  const dbMap = useMemo(() => {
    const map: Record<string, DbIngredient> = {}
    for (const ing of dbIngredients) {
      map[ing.name.toLowerCase()] = ing
    }
    return map
  }, [dbIngredients])

  const suggestions = Object.keys(dbMap).filter(
    (name) => name.toLowerCase().includes(searchTerm.toLowerCase()) && searchTerm.length > 0
  )

  const selectedIngredientData = selectedIngredient ? dbMap[selectedIngredient.toLowerCase()] : null
  const hasUnits = selectedIngredientData?.average_weight !== null && selectedIngredientData?.average_weight !== undefined

  const selectIngredient = (ingredientName: string) => {
    setSelectedIngredient(ingredientName)
    setSearchTerm(ingredientName)
    setShowSuggestions(false)
    setAmount("")
    setUseUnits(false)
  }

  const addIngredientToRecipe = () => {
    if (!selectedIngredient) return

    const baseNutrition = dbMap[selectedIngredient.toLowerCase()]
    if (!baseNutrition) return

    let gramsNum: number
    if (useUnits && baseNutrition.average_weight) {
      const units = parseFloat(amount) || 1
      gramsNum = units * baseNutrition.average_weight
    } else {
      gramsNum = parseFloat(amount) || 100
    }

    const multiplier = gramsNum / 100
    const newIngredient: CalculatorIngredient = {
      id: Date.now().toString(),
      name: selectedIngredient,
      grams: gramsNum,
      calories: Math.round(baseNutrition.calories * multiplier),
      protein: Math.round(baseNutrition.protein * multiplier * 10) / 10,
      carbs: Math.round(baseNutrition.carbohydrates * multiplier * 10) / 10,
      fats: Math.round(baseNutrition.fat * multiplier * 10) / 10,
      fiber: Math.round(baseNutrition.fiber * multiplier * 10) / 10,
      selected: false,
    }
    setIngredients([...ingredients, newIngredient])
    setSearchTerm("")
    setSelectedIngredient(null)
    setAmount("")
    setUseUnits(false)
    setShowSuggestions(false)
  }

  const removeIngredient = (id: string) => {
    setIngredients(ingredients.filter((i) => i.id !== id))
  }

  const toggleIngredientSelection = (id: string) => {
    setIngredients(ingredients.map((i) => 
      i.id === id ? { ...i, selected: !i.selected } : i
    ))
  }

  const selectedIngredients = ingredients.filter((i) => i.selected)

  const totals = ingredients.reduce(
    (acc, ing) => ({
      calories: acc.calories + ing.calories,
      protein: acc.protein + ing.protein,
      carbs: acc.carbs + ing.carbs,
      fats: acc.fats + ing.fats,
      fiber: acc.fiber + ing.fiber,
    }),
    { calories: 0, protein: 0, carbs: 0, fats: 0, fiber: 0 }
  )

  const selectedTotals = selectedIngredients.reduce(
    (acc, ing) => ({
      calories: acc.calories + ing.calories,
      protein: acc.protein + ing.protein,
      carbs: acc.carbs + ing.carbs,
      fats: acc.fats + ing.fats,
      fiber: acc.fiber + ing.fiber,
    }),
    { calories: 0, protein: 0, carbs: 0, fats: 0, fiber: 0 }
  )

  // Smart Splitter: Independent servings for each person
  // Marcin gets 2 parts, Patrycja gets 1 part per serving
  const totalParts = (marcinServings * 2) + (patrycjaServings * 1)
  
  const marcinPortion = totalParts > 0 ? {
    calories: (totals.calories / totalParts) * marcinServings * 2,
    protein: (totals.protein / totalParts) * marcinServings * 2,
    carbs: (totals.carbs / totalParts) * marcinServings * 2,
    fats: (totals.fats / totalParts) * marcinServings * 2,
    fiber: (totals.fiber / totalParts) * marcinServings * 2,
  } : { calories: 0, protein: 0, carbs: 0, fats: 0, fiber: 0 }
  
  const patrycjaPortion = totalParts > 0 ? {
    calories: (totals.calories / totalParts) * patrycjaServings * 1,
    protein: (totals.protein / totalParts) * patrycjaServings * 1,
    carbs: (totals.carbs / totalParts) * patrycjaServings * 1,
    fats: (totals.fats / totalParts) * patrycjaServings * 1,
    fiber: (totals.fiber / totalParts) * patrycjaServings * 1,
  } : { calories: 0, protein: 0, carbs: 0, fats: 0, fiber: 0 }

  const marcinPerServing = marcinServings > 0 ? {
    calories: marcinPortion.calories / marcinServings,
    protein: marcinPortion.protein / marcinServings,
    carbs: marcinPortion.carbs / marcinServings,
    fats: marcinPortion.fats / marcinServings,
    fiber: marcinPortion.fiber / marcinServings,
  } : { calories: 0, protein: 0, carbs: 0, fats: 0, fiber: 0 }

  const patrycjaPerServing = patrycjaServings > 0 ? {
    calories: patrycjaPortion.calories / patrycjaServings,
    protein: patrycjaPortion.protein / patrycjaServings,
    carbs: patrycjaPortion.carbs / patrycjaServings,
    fats: patrycjaPortion.fats / patrycjaServings,
    fiber: patrycjaPortion.fiber / patrycjaServings,
  } : { calories: 0, protein: 0, carbs: 0, fats: 0, fiber: 0 }

  const handleSaveComponent = async () => {
    if (selectedIngredients.length > 0 && saveName.trim()) {
      const component = await addIngredient({
        name: saveName.trim(),
        category: "Component",
        protein: selectedTotals.protein,
        fat: selectedTotals.fats,
        carbohydrates: selectedTotals.carbs,
        fiber: selectedTotals.fiber,
        calories: selectedTotals.calories,
        average_weight: null,
        recipe_steps: [],
        sub_ingredients: selectedIngredients.map((i) => ({ ingredient_id: i.id, name: i.name, grams: i.grams })),
        yield_grams: selectedIngredients.reduce((acc, i) => acc + i.grams, 0),
        marcin_servings: marcinServings,
        patrycja_servings: patrycjaServings,
      })

      if (component.error) {
        alert("Failed to save component. Check the console for details.")
      } else {
        setSaveName("")
        setIngredients(ingredients.map((i) => ({ ...i, selected: false })))
        alert(`Component "${saveName}" saved successfully!`)
      }
    }
  }

  const handleSaveDish = async (overwriteId?: string) => {
    if (ingredients.length > 0 && saveName.trim()) {
      const steps = saveRecipeSteps.trim()
        ? saveRecipeSteps.split('\n').filter(s => s.trim()).map(s => s.trim())
        : undefined
      const payload = {
        name: saveName.trim(),
        elements: ingredients.map((i) => ({ type: "ingredient" as const, id: i.id, name: i.name, grams: i.grams })),
        totalCalories: totals.calories,
        totalProtein: totals.protein,
        totalCarbs: totals.carbs,
        totalFats: totals.fats,
        totalFiber: totals.fiber,
        mainCategory: saveMainCategory,
        subCategory: saveSubCategory || "Custom",
        marcinServings,
        patrycjaServings,
        recipeSteps: steps,
      }

      if (overwriteId) {
        const dish = await updateDish(overwriteId, payload)
        if (dish.error) {
          alert("Failed to update dish. Check the console for details.")
        } else {
          setSaveName("")
          setSaveSubCategory("")
          setSaveRecipeSteps("")
          onClearEdit()
          alert(`Dish "${saveName}" updated successfully!`)
        }
      } else {
        const dish = await addDish(payload)
        if (dish.error) {
          alert("Failed to save dish. Check the console for details.")
        } else {
          setSaveName("")
          setSaveSubCategory("")
          setSaveRecipeSteps("")
          onClearEdit()
          alert(`Dish "${saveName}" saved successfully!`)
        }
      }
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Step 1: Add Ingredients */}
      <div className="bg-card rounded-2xl border border-border">
        <div className="bg-primary/10 px-5 py-3 border-b border-border flex items-center gap-3">
          <div className="size-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">1</div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Build Your Recipe</h3>
            <p className="text-xs text-muted-foreground">Add ingredients to calculate macros</p>
          </div>
        </div>
        <div className="p-5 flex flex-col gap-3">
          <div className="relative">
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Search ingredient..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setSelectedIngredient(null)
                  setShowSuggestions(true)
                }}
                onFocus={() => setShowSuggestions(true)}
                className="flex-1 min-w-0 bg-secondary rounded-xl px-3 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 capitalize"
              />
              <div className="flex items-center gap-2 shrink-0">
                <input
                  type="number"
                  placeholder={useUnits ? "units" : "g"}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-16 bg-secondary rounded-xl px-2 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-center"
                />
                <button
                  onClick={addIngredientToRecipe}
                  disabled={!selectedIngredient}
                  className="size-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shrink-0 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition-transform"
                >
                  <Plus className="size-5" />
                </button>
              </div>
            </div>

            {/* Unit toggle - only show for ingredients with average_weight */}
            {selectedIngredient && hasUnits && (
              <div className="flex items-center gap-2 mt-2">
                <button
                  onClick={() => setUseUnits(false)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    !useUnits
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground"
                  }`}
                >
                  Grams
                </button>
                <button
                  onClick={() => setUseUnits(true)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    useUnits
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground"
                  }`}
                >
                  Units ({selectedIngredientData?.average_weight}g each)
                </button>
              </div>
            )}

            {/* Suggestions dropdown */}
            {showSuggestions && suggestions.length > 0 && !selectedIngredient && (
              <div className="mt-2 bg-card border border-border rounded-xl overflow-hidden shadow-lg">
                {suggestions.slice(0, 6).map((name) => (
                  <button
                    key={name}
                    onClick={() => selectIngredient(name)}
                    className="w-full px-4 py-3 text-left text-sm text-foreground hover:bg-secondary transition-colors capitalize"
                  >
                    {name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Ingredients List */}
      <div className="flex flex-col gap-3">
        {ingredients.length === 0 ? (
          <div className="bg-card rounded-2xl p-6 border border-dashed border-border text-center">
            <div className="size-12 rounded-full bg-secondary mx-auto mb-3 flex items-center justify-center">
              <Plus className="size-5 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">Your recipe is empty</p>
            <p className="text-xs text-muted-foreground mt-1">Search and add ingredients above</p>
          </div>
        ) : (
          /* Ingredient Cards */
          ingredients.map((ing) => (
            <div
              key={ing.id}
              className={`bg-card rounded-2xl p-4 border transition-colors ${
                ing.selected ? "border-primary" : "border-border"
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => toggleIngredientSelection(ing.id)}
                    className={`size-5 rounded-md border-2 flex items-center justify-center transition-colors ${
                      ing.selected 
                        ? "bg-primary border-primary" 
                        : "border-muted-foreground"
                    }`}
                  >
                    {ing.selected && (
                      <svg className="size-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                  <span className="text-foreground font-medium capitalize">{ing.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">{ing.grams}g</span>
                  <button
                    onClick={() => removeIngredient(ing.id)}
                    className="size-7 rounded-lg bg-destructive/10 text-destructive flex items-center justify-center shrink-0 active:scale-95 transition-transform"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-5 gap-2">
                <div className="bg-secondary rounded-lg px-2 py-2 text-center">
                  <p className="text-[10px] text-muted-foreground">kcal</p>
                  <p className="text-sm font-semibold text-foreground">{ing.calories}</p>
                </div>
                <div className="bg-secondary rounded-lg px-2 py-2 text-center">
                  <p className="text-[10px] text-muted-foreground">P</p>
                  <p className="text-sm font-semibold text-primary">{ing.protein}g</p>
                </div>
                <div className="bg-secondary rounded-lg px-2 py-2 text-center">
                  <p className="text-[10px] text-muted-foreground">C</p>
                  <p className="text-sm font-semibold text-wheat">{ing.carbs}g</p>
                </div>
                <div className="bg-secondary rounded-lg px-2 py-2 text-center">
                  <p className="text-[10px] text-muted-foreground">F</p>
                  <p className="text-sm font-semibold text-terracotta/70">{ing.fats}g</p>
                </div>
                <div className="bg-secondary rounded-lg px-2 py-2 text-center">
                  <p className="text-[10px] text-muted-foreground">Fib</p>
                  <p className="text-sm font-semibold text-sage/70">{ing.fiber}g</p>
                </div>
              </div>
            </div>
          ))
        )}
        
        {/* Totals Card */}
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-2xl p-4 border border-primary/20">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Recipe Total</p>
          <div className="grid grid-cols-5 gap-2">
            <div className="bg-background/50 rounded-lg px-2 py-2 text-center">
              <p className="text-[10px] text-muted-foreground">kcal</p>
              <p className="text-sm font-bold text-foreground">{Math.round(totals.calories)}</p>
            </div>
            <div className="bg-background/50 rounded-lg px-2 py-2 text-center">
              <p className="text-[10px] text-muted-foreground">P</p>
              <p className="text-sm font-bold text-primary">{Math.round(totals.protein * 10) / 10}g</p>
            </div>
            <div className="bg-background/50 rounded-lg px-2 py-2 text-center">
              <p className="text-[10px] text-muted-foreground">C</p>
              <p className="text-sm font-bold text-wheat">{Math.round(totals.carbs * 10) / 10}g</p>
            </div>
            <div className="bg-background/50 rounded-lg px-2 py-2 text-center">
              <p className="text-[10px] text-muted-foreground">F</p>
              <p className="text-sm font-bold text-terracotta/70">{Math.round(totals.fats * 10) / 10}g</p>
            </div>
            <div className="bg-background/50 rounded-lg px-2 py-2 text-center">
              <p className="text-[10px] text-muted-foreground">Fib</p>
              <p className="text-sm font-bold text-sage/70">{Math.round(totals.fiber * 10) / 10}g</p>
            </div>
          </div>
        </div>
      </div>

      {/* Step 2: Smart Splitter */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="bg-secondary/50 px-5 py-3 border-b border-border flex items-center gap-3">
          <div className="size-7 rounded-full bg-foreground text-background flex items-center justify-center text-sm font-bold">2</div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Split Into Portions</h3>
            <p className="text-xs text-muted-foreground">Divide between Marcin and Patrycja</p>
          </div>
        </div>

        <div className="p-5">
          {/* Serving Controls */}
          <div className="grid grid-cols-2 gap-4 mb-5">
            {/* Marcin Servings */}
            <div className="bg-navy/10 rounded-xl p-3 border border-navy/20">
              <div className="flex items-center gap-2 mb-2">
                <div className="size-6 rounded-full bg-navy flex items-center justify-center">
                  <span className="text-[10px] font-bold text-background">M</span>
                </div>
                <span className="text-xs font-medium text-foreground">Marcin</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground">Servings</span>
                <div className="flex items-center bg-background rounded-lg">
                  <button
                    onClick={() => setMarcinServings(Math.max(0, marcinServings - 1))}
                    className="px-2 py-1 text-muted-foreground hover:text-foreground transition-colors text-sm"
                  >
                    -
                  </button>
                  <span className="w-6 text-center text-sm font-semibold text-foreground">{marcinServings}</span>
                  <button
                    onClick={() => setMarcinServings(marcinServings + 1)}
                    className="px-2 py-1 text-muted-foreground hover:text-foreground transition-colors text-sm"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Patrycja Servings */}
            <div className="bg-sage/10 rounded-xl p-3 border border-sage/20">
              <div className="flex items-center gap-2 mb-2">
                <div className="size-6 rounded-full bg-sage flex items-center justify-center">
                  <span className="text-[10px] font-bold text-background">P</span>
                </div>
                <span className="text-xs font-medium text-foreground">Patrycja</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground">Servings</span>
                <div className="flex items-center bg-background rounded-lg">
                  <button
                    onClick={() => setPatrycjaServings(Math.max(0, patrycjaServings - 1))}
                    className="px-2 py-1 text-muted-foreground hover:text-foreground transition-colors text-sm"
                  >
                    -
                  </button>
                  <span className="w-6 text-center text-sm font-semibold text-foreground">{patrycjaServings}</span>
                  <button
                    onClick={() => setPatrycjaServings(patrycjaServings + 1)}
                    className="px-2 py-1 text-muted-foreground hover:text-foreground transition-colors text-sm"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Visual Split Bar */}
          {totalParts > 0 && (
            <div className="mb-5">
              <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                <span>Distribution</span>
                <span>{Math.round((marcinServings * 2 / totalParts) * 100)}% / {Math.round((patrycjaServings * 1 / totalParts) * 100)}%</span>
              </div>
              <div className="h-2.5 rounded-full overflow-hidden flex bg-secondary">
                {marcinServings > 0 && (
                  <div 
                    className="bg-navy h-full transition-all duration-300" 
                    style={{ width: `${(marcinServings * 2 / totalParts) * 100}%` }} 
                  />
                )}
                {patrycjaServings > 0 && (
                  <div 
                    className="bg-sage h-full transition-all duration-300" 
                    style={{ width: `${(patrycjaServings * 1 / totalParts) * 100}%` }} 
                  />
                )}
              </div>
            </div>
          )}

          {/* Portion Details */}
          <div className="grid grid-cols-2 gap-3">
            {/* Marcin's Portion */}
            <div className="bg-navy/5 rounded-xl p-3 border border-navy/10">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">
                {marcinServings > 1 ? `Per serving (${marcinServings}x)` : "Total"}
              </p>
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Calories</span>
                  <span className="text-sm font-bold text-foreground">{Math.round(marcinServings > 1 ? marcinPerServing.calories : marcinPortion.calories)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Protein</span>
                  <span className="text-xs font-semibold text-primary">{Math.round((marcinServings > 1 ? marcinPerServing.protein : marcinPortion.protein) * 10) / 10}g</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Carbs</span>
                  <span className="text-xs font-semibold text-wheat">{Math.round((marcinServings > 1 ? marcinPerServing.carbs : marcinPortion.carbs) * 10) / 10}g</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Fats</span>
                  <span className="text-xs font-semibold text-terracotta/70">{Math.round((marcinServings > 1 ? marcinPerServing.fats : marcinPortion.fats) * 10) / 10}g</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Fiber</span>
                  <span className="text-xs font-semibold text-sage/70">{Math.round((marcinServings > 1 ? marcinPerServing.fiber : marcinPortion.fiber) * 10) / 10}g</span>
                </div>
              </div>
              {marcinServings > 1 && (
                <div className="mt-2 pt-2 border-t border-navy/10">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-muted-foreground">All {marcinServings} servings</span>
                    <span className="text-xs font-bold text-foreground">{Math.round(marcinPortion.calories)} kcal</span>
                  </div>
                </div>
              )}
            </div>

            {/* Patrycja's Portion */}
            <div className="bg-sage/5 rounded-xl p-3 border border-sage/10">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">
                {patrycjaServings > 1 ? `Per serving (${patrycjaServings}x)` : "Total"}
              </p>
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Calories</span>
                  <span className="text-sm font-bold text-foreground">{Math.round(patrycjaServings > 1 ? patrycjaPerServing.calories : patrycjaPortion.calories)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Protein</span>
                  <span className="text-xs font-semibold text-primary">{Math.round((patrycjaServings > 1 ? patrycjaPerServing.protein : patrycjaPortion.protein) * 10) / 10}g</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Carbs</span>
                  <span className="text-xs font-semibold text-wheat">{Math.round((patrycjaServings > 1 ? patrycjaPerServing.carbs : patrycjaPortion.carbs) * 10) / 10}g</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Fats</span>
                  <span className="text-xs font-semibold text-terracotta/70">{Math.round((patrycjaServings > 1 ? patrycjaPerServing.fats : patrycjaPortion.fats) * 10) / 10}g</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Fiber</span>
                  <span className="text-xs font-semibold text-sage/70">{Math.round((patrycjaServings > 1 ? patrycjaPerServing.fiber : patrycjaPortion.fiber) * 10) / 10}g</span>
                </div>
              </div>
              {patrycjaServings > 1 && (
                <div className="mt-2 pt-2 border-t border-sage/10">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-muted-foreground">All {patrycjaServings} servings</span>
                    <span className="text-xs font-bold text-foreground">{Math.round(patrycjaPortion.calories)} kcal</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <p className="text-[10px] text-muted-foreground text-center mt-4">
            Ratio: Marcin gets 2 parts, Patrycja gets 1 part per serving
          </p>
        </div>
      </div>

      {/* Step 3: Save Options */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="bg-sage/10 px-5 py-3 border-b border-border flex items-center gap-3">
          <div className="size-7 rounded-full bg-sage text-background flex items-center justify-center text-sm font-bold">3</div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Save Your Creation</h3>
            <p className="text-xs text-muted-foreground">Store as a dish or reusable component</p>
          </div>
        </div>
        
        <div className="p-5">
          <div className="mb-5">
            <label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">Recipe Name</label>
            <input
              type="text"
              placeholder="Give your creation a name..."
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              className="w-full bg-secondary rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          {/* Category & Subcategory */}
          <div className="mb-4 grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5 block">Category</label>
              <select
                value={saveMainCategory}
                onChange={(e) => {
                  const v = e.target.value as "Large" | "Light" | "Snacks" | "Drinks"
                  setSaveMainCategory(v)
                  setSaveSubCategory("")
                }}
                className="w-full bg-secondary rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="Large">Large</option>
                <option value="Light">Light</option>
                <option value="Snacks">Snacks</option>
                <option value="Drinks">Drinks</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5 block">Subcategory</label>
              <select
                value={saveSubCategory}
                onChange={(e) => setSaveSubCategory(e.target.value)}
                className="w-full bg-secondary rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="">Select...</option>
                {(dishCategories[saveMainCategory] || []).map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
                <option value="Custom">Custom</option>
              </select>
            </div>
          </div>

          {/* Recipe Steps (for dishes) */}
          <div className="mb-4">
            <label className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5 block">
              Recipe Steps (optional, one per line)
            </label>
            <textarea
              placeholder="Step 1: Preheat oven...&#10;Step 2: Mix ingredients..."
              value={saveRecipeSteps}
              onChange={(e) => setSaveRecipeSteps(e.target.value)}
              rows={3}
              className="w-full bg-secondary rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
            />
          </div>

          <div className="flex flex-col gap-3">
            {/* Save Selected as Component */}
            <div className="bg-secondary/50 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="size-9 rounded-lg bg-secondary flex items-center justify-center">
                  <ChefHat className="size-4 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">Save as Component</p>
                  <p className="text-[10px] text-muted-foreground">Reusable building block for dishes</p>
                </div>
              </div>
              <button
                onClick={handleSaveComponent}
                disabled={selectedIngredients.length === 0 || !saveName.trim()}
                className="w-full py-2.5 rounded-lg bg-secondary text-foreground text-sm font-medium flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:opacity-40 disabled:active:scale-100 mt-2"
              >
                Save {selectedIngredients.length} selected ingredient{selectedIngredients.length !== 1 ? "s" : ""}
              </button>
              {selectedIngredients.length > 0 && (
                <p className="text-[10px] text-muted-foreground text-center mt-2">
                  {Math.round(selectedTotals.calories)} kcal total
                </p>
              )}
            </div>

            {/* Save All as Dish */}
            <div className="bg-primary/10 rounded-xl p-4 border border-primary/20">
              <div className="flex items-center gap-3 mb-2">
                <div className="size-9 rounded-lg bg-primary/20 flex items-center justify-center">
                  <UtensilsCrossed className="size-4 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">Save as Dish</p>
                  <p className="text-[10px] text-muted-foreground">Complete meal ready to log</p>
                </div>
              </div>
              <button
                onClick={handleSaveDish}
                disabled={ingredients.length === 0 || !saveName.trim()}
                className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-40 disabled:active:scale-100 mt-2"
              >
                Save entire recipe
              </button>
              {ingredients.length > 0 && (
                <p className="text-[10px] text-muted-foreground text-center mt-2">
                  {Math.round(totals.calories)} kcal total
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const ingredientCategories = ["All", "Protein", "Carbs", "Vegetables", "Fruits", "Dairy", "Fats", "Nuts", "Component"]

function IngredientsView({ onEditComponent }: { onEditComponent: (mode: EditMode) => void }) {
  const { ingredients: dbIngredients, loading, addIngredient, deleteIngredient, updateIngredient } = useIngredients()
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("All")
  const [showAddForm, setShowAddForm] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({
    name: "",
    caloriesPer100g: "",
    proteinPer100g: "",
    carbsPer100g: "",
    fatsPer100g: "",
    fiberPer100g: "",
    category: "Protein",
    instructions: "",
  })
  const [newIngredient, setNewIngredient] = useState({
    name: "",
    caloriesPer100g: "",
    proteinPer100g: "",
    carbsPer100g: "",
    fatsPer100g: "",
    fiberPer100g: "",
    category: "Protein",
    instructions: "",
  })

  const ingredientsList = useMemo(() => dbIngredients.map((db): IngredientItem => ({
    id: db.id,
    name: db.name,
    caloriesPer100g: db.calories,
    proteinPer100g: db.protein,
    carbsPer100g: db.carbohydrates,
    fatsPer100g: db.fat,
    fiberPer100g: db.fiber,
    category: db.category,
    isComponent: db.category === "Component",
    recipeSteps: db.recipe_steps || undefined,
    subIngredients: db.sub_ingredients?.map((si) => ({
      ingredientId: si.ingredient_id,
      name: si.name,
      grams: si.grams,
    })),
    yieldGrams: db.yield_grams || undefined,
    marcinServings: db.marcin_servings || undefined,
    patrycjaServings: db.patrycja_servings || undefined,
  })), [dbIngredients])

  const filteredIngredients = ingredientsList.filter((el) => {
    const matchesSearch = el.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === "All" || el.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  const handleAddIngredient = async () => {
    if (!newIngredient.name.trim()) return
    const isComponent = newIngredient.category === "Component"
    const result = await addIngredient({
      name: newIngredient.name,
      category: newIngredient.category,
      protein: parseFloat(newIngredient.proteinPer100g) || 0,
      fat: parseFloat(newIngredient.fatsPer100g) || 0,
      carbohydrates: parseFloat(newIngredient.carbsPer100g) || 0,
      fiber: parseFloat(newIngredient.fiberPer100g) || 0,
      calories: parseFloat(newIngredient.caloriesPer100g) || 0,
      average_weight: null,
      recipe_steps: isComponent ? newIngredient.instructions.split('\n').filter(s => s.trim()) : null,
      sub_ingredients: null,
      yield_grams: null,
      marcin_servings: null,
      patrycja_servings: null,
    })
    if (!result.error) {
      setNewIngredient({
        name: "",
        caloriesPer100g: "",
        proteinPer100g: "",
        carbsPer100g: "",
        fatsPer100g: "",
        fiberPer100g: "",
        category: "Protein",
        instructions: "",
      })
      setShowAddForm(false)
    }
  }

  const handleDeleteIngredient = async (id: string) => {
    await deleteIngredient(id)
  }

  const startEdit = (ingredient: IngredientItem) => {
    setEditingId(ingredient.id)
    setEditForm({
      name: ingredient.name,
      caloriesPer100g: String(ingredient.caloriesPer100g),
      proteinPer100g: String(ingredient.proteinPer100g),
      carbsPer100g: String(ingredient.carbsPer100g),
      fatsPer100g: String(ingredient.fatsPer100g),
      fiberPer100g: String(ingredient.fiberPer100g),
      category: ingredient.category,
      instructions: ingredient.recipeSteps?.join('\n') || "",
    })
    setExpandedId(ingredient.id)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditForm({
      name: "",
      caloriesPer100g: "",
      proteinPer100g: "",
      carbsPer100g: "",
      fatsPer100g: "",
      fiberPer100g: "",
      category: "Protein",
      instructions: "",
    })
  }

  const handleSaveEdit = async (id: string) => {
    const isComponent = editForm.category === "Component"
    const result = await updateIngredient(id, {
      name: editForm.name,
      category: editForm.category,
      calories: parseFloat(editForm.caloriesPer100g) || 0,
      protein: parseFloat(editForm.proteinPer100g) || 0,
      fat: parseFloat(editForm.fatsPer100g) || 0,
      carbohydrates: parseFloat(editForm.carbsPer100g) || 0,
      fiber: parseFloat(editForm.fiberPer100g) || 0,
      recipe_steps: isComponent ? editForm.instructions.split('\n').filter(s => s.trim()).map(s => s.trim()) : [],
    })
    if (!result.error) {
      setEditingId(null)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Search and Actions */}
      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search ingredients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-card rounded-xl pl-11 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground border border-border focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="size-12 rounded-xl bg-primary text-primary-foreground flex items-center justify-center active:scale-95 transition-transform"
        >
          <Plus className="size-5" />
        </button>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
        {ingredientCategories.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
              categoryFilter === cat
                ? "bg-primary text-primary-foreground"
                : "bg-card border border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Add New Ingredient Form */}
      {showAddForm && (
        <div className="bg-card rounded-2xl p-5 border border-primary/50">
          <h3 className="text-base font-semibold mb-4">Add New Ingredient</h3>
          <div className="flex flex-col gap-3">
            <input
              type="text"
              placeholder="Name"
              value={newIngredient.name}
              onChange={(e) => setNewIngredient({ ...newIngredient, name: e.target.value })}
              className="bg-secondary rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />

            <select
              value={newIngredient.category}
              onChange={(e) => setNewIngredient({ ...newIngredient, category: e.target.value })}
              className="bg-secondary rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              {ingredientCategories.slice(1).map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            {/* Instructions field for Components */}
            {newIngredient.category === "Component" && (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-muted-foreground">Instructions (one step per line)</label>
                <textarea
                  placeholder="Step 1...&#10;Step 2...&#10;Step 3..."
                  value={newIngredient.instructions}
                  onChange={(e) => setNewIngredient({ ...newIngredient, instructions: e.target.value })}
                  rows={4}
                  className="bg-secondary rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                />
              </div>
            )}

            <p className="text-xs text-muted-foreground mt-1">Macros per 100g</p>
            <div className="grid grid-cols-5 gap-2">
              <input
                type="number"
                placeholder="kcal"
                value={newIngredient.caloriesPer100g}
                onChange={(e) => setNewIngredient({ ...newIngredient, caloriesPer100g: e.target.value })}
                className="bg-secondary rounded-xl px-2 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <input
                type="number"
                placeholder="P"
                value={newIngredient.proteinPer100g}
                onChange={(e) => setNewIngredient({ ...newIngredient, proteinPer100g: e.target.value })}
                className="bg-secondary rounded-xl px-2 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <input
                type="number"
                placeholder="C"
                value={newIngredient.carbsPer100g}
                onChange={(e) => setNewIngredient({ ...newIngredient, carbsPer100g: e.target.value })}
                className="bg-secondary rounded-xl px-2 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <input
                type="number"
                placeholder="F"
                value={newIngredient.fatsPer100g}
                onChange={(e) => setNewIngredient({ ...newIngredient, fatsPer100g: e.target.value })}
                className="bg-secondary rounded-xl px-2 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <input
                type="number"
                placeholder="Fib"
                value={newIngredient.fiberPer100g}
                onChange={(e) => setNewIngredient({ ...newIngredient, fiberPer100g: e.target.value })}
                className="bg-secondary rounded-xl px-2 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            <button
              onClick={handleAddIngredient}
              disabled={!newIngredient.name.trim()}
              className="mt-2 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-medium flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-50"
            >
              <Plus className="size-4" />
              Add Ingredient
            </button>
          </div>
        </div>
      )}

      {/* Ingredients List */}
      <div className="flex flex-col gap-2">
        {filteredIngredients.length === 0 ? (
          <div className="bg-card rounded-2xl p-8 border border-border text-center">
            <p className="text-muted-foreground">No ingredients found</p>
          </div>
        ) : (
          filteredIngredients.map((ingredient) => (
            <div
              key={ingredient.id}
              className="bg-card rounded-2xl border border-border overflow-hidden cursor-pointer"
              onClick={() => setExpandedId(expandedId === ingredient.id ? null : ingredient.id)}
            >
              {/* Main row */}
              <div className="p-4 flex items-center gap-3 active:bg-secondary/50">
                <div className={`size-10 rounded-xl flex items-center justify-center shrink-0 ${
                  ingredient.isComponent 
                    ? "bg-primary/20" 
                    : "bg-secondary"
                }`}>
                  {ingredient.isComponent ? (
                    <ChefHat className="size-5 text-primary" />
                  ) : (
                    <Apple className="size-5 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-foreground truncate">{ingredient.name}</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {ingredient.caloriesPer100g} kcal · P {ingredient.proteinPer100g}g · C {ingredient.carbsPer100g}g · F {ingredient.fatsPer100g}g · Fib {ingredient.fiberPer100g}g
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-muted-foreground/70">{ingredient.category}</span>
                    {ingredient.isComponent && (ingredient.marcinServings || ingredient.patrycjaServings) && (
                      <div className="flex items-center gap-1">
                        {ingredient.marcinServings && (
                          <span className="px-1.5 py-0.5 rounded bg-navy/20 text-navy text-[9px] font-medium">
                            M:{ingredient.marcinServings}
                          </span>
                        )}
                        {ingredient.patrycjaServings && (
                          <span className="px-1.5 py-0.5 rounded bg-sage/20 text-sage text-[9px] font-medium">
                            P:{ingredient.patrycjaServings}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <ChevronDown className={`size-5 text-muted-foreground shrink-0 transition-transform ${expandedId === ingredient.id ? "rotate-180" : ""}`} />
              </div>

              {/* Expanded Details with Actions */}
              {expandedId === ingredient.id && (
                <div className="px-4 pb-4 border-t border-border pt-3">
                  {/* Sub-ingredients (for components only) */}
                  {ingredient.isComponent && ingredient.subIngredients && ingredient.subIngredients.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs font-medium text-muted-foreground mb-2">Ingredients</p>
                      <div className="flex flex-wrap gap-1.5">
                        {ingredient.subIngredients.map((ing, i) => (
                          <span key={i} className="text-xs px-2 py-1 rounded-lg bg-secondary text-foreground">
                            {ing.name} ({ing.grams}g)
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recipe Steps / Instructions (for components only) */}
                  {ingredient.isComponent && ingredient.recipeSteps && ingredient.recipeSteps.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs font-medium text-muted-foreground mb-2">Instructions</p>
                      <ol className="list-decimal list-inside space-y-1.5">
                        {ingredient.recipeSteps.map((step, i) => (
                          <li key={i} className="text-sm text-foreground">{step}</li>
                        ))}
                      </ol>
                    </div>
                  )}

                  {ingredient.isComponent && ingredient.yieldGrams && (
                    <p className="text-xs text-muted-foreground mb-4">
                      Yields approximately {ingredient.yieldGrams}g
                    </p>
                  )}

                  {/* Inline Edit Form */}
                  {editingId === ingredient.id ? (
                    <div className="flex flex-col gap-3 mb-4">
                      <input
                        type="text"
                        placeholder="Name"
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className="bg-secondary rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                      <select
                        value={editForm.category}
                        onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                        className="bg-secondary rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                      >
                        {ingredientCategories.slice(1).map((cat) => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                      {editForm.category === "Component" && (
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs text-muted-foreground">Instructions (one step per line)</label>
                          <textarea
                            value={editForm.instructions}
                            onChange={(e) => setEditForm({ ...editForm, instructions: e.target.value })}
                            rows={3}
                            className="bg-secondary rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                          />
                        </div>
                      )}
                      <div className="grid grid-cols-5 gap-2">
                        <div>
                          <label className="text-[10px] text-muted-foreground mb-1 block">kcal</label>
                          <input type="number" placeholder="0" value={editForm.caloriesPer100g} onClick={(e) => e.stopPropagation()} onChange={(e) => setEditForm({ ...editForm, caloriesPer100g: e.target.value })} className="w-full bg-secondary rounded-xl px-2 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
                        </div>
                        <div>
                          <label className="text-[10px] text-muted-foreground mb-1 block">Protein</label>
                          <input type="number" placeholder="0" value={editForm.proteinPer100g} onClick={(e) => e.stopPropagation()} onChange={(e) => setEditForm({ ...editForm, proteinPer100g: e.target.value })} className="w-full bg-secondary rounded-xl px-2 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
                        </div>
                        <div>
                          <label className="text-[10px] text-muted-foreground mb-1 block">Carbs</label>
                          <input type="number" placeholder="0" value={editForm.carbsPer100g} onClick={(e) => e.stopPropagation()} onChange={(e) => setEditForm({ ...editForm, carbsPer100g: e.target.value })} className="w-full bg-secondary rounded-xl px-2 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
                        </div>
                        <div>
                          <label className="text-[10px] text-muted-foreground mb-1 block">Fats</label>
                          <input type="number" placeholder="0" value={editForm.fatsPer100g} onClick={(e) => e.stopPropagation()} onChange={(e) => setEditForm({ ...editForm, fatsPer100g: e.target.value })} className="w-full bg-secondary rounded-xl px-2 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
                        </div>
                        <div>
                          <label className="text-[10px] text-muted-foreground mb-1 block">Fiber</label>
                          <input type="number" placeholder="0" value={editForm.fiberPer100g} onClick={(e) => e.stopPropagation()} onChange={(e) => setEditForm({ ...editForm, fiberPer100g: e.target.value })} className="w-full bg-secondary rounded-xl px-2 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
                        </div>
                      </div>
                      <div className="flex gap-2 mt-1">
                        <button onClick={(e) => { e.stopPropagation(); handleSaveEdit(ingredient.id) }} className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium active:scale-[0.98] transition-transform">Save</button>
                        <button onClick={(e) => { e.stopPropagation(); cancelEdit() }} className="flex-1 py-2.5 rounded-xl bg-secondary text-foreground text-sm font-medium active:scale-[0.98] transition-transform">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    /* Action Buttons */
                    <div className="flex gap-2">
                      {ingredient.isComponent ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            onEditComponent({
                              type: 'component',
                              id: ingredient.id,
                              name: ingredient.name,
                              elements: ingredient.subIngredients?.map(si => ({
                                type: 'ingredient' as const,
                                id: si.ingredientId,
                                name: si.name,
                                grams: si.grams,
                              })) || [],
                              recipeSteps: ingredient.recipeSteps,
                            })
                          }}
                          className="flex-1 py-2.5 rounded-xl bg-secondary text-foreground text-sm font-medium flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
                        >
                          <Calculator className="size-4" />
                          Edit
                        </button>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            startEdit(ingredient)
                          }}
                          className="flex-1 py-2.5 rounded-xl bg-secondary text-foreground text-sm font-medium flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
                        >
                          Edit
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteIngredient(ingredient.id)
                        }}
                        className="flex-1 py-2.5 rounded-xl bg-destructive/10 text-destructive text-sm font-medium flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
                      >
                        <Trash2 className="size-4" />
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function DishesView({ onEditDish }: { onEditDish: (mode: EditMode) => void }) {
  const { dishes, loading, deleteDish } = useDishes()
  const [searchTerm, setSearchTerm] = useState("")
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [mainCategoryFilter, setMainCategoryFilter] = useState<string>("All")
  const [subCategoryFilter, setSubCategoryFilter] = useState<string>("All")

  const mainCategories = ["All", "Large", "Light", "Snacks", "Drinks"]
  const subCategories = mainCategoryFilter === "All"
    ? ["All"]
    : ["All", ...(dishCategories[mainCategoryFilter] || [])]

  const filteredDishes = dishes.filter((dish) => {
    const matchesSearch = dish.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesMain = mainCategoryFilter === "All" || dish.mainCategory === mainCategoryFilter
    const matchesSub = subCategoryFilter === "All" || dish.subCategory === subCategoryFilter
    return matchesSearch && matchesMain && matchesSub
  })

  const handleDeleteDish = async (id: string) => {
    await deleteDish(id)
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Search */}
      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search dishes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-card rounded-xl pl-11 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground border border-border focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
      </div>

      {/* Main Category Filter */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
        {mainCategories.map((cat) => (
          <button
            key={cat}
            onClick={() => {
              setMainCategoryFilter(cat)
              setSubCategoryFilter("All")
            }}
            className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
              mainCategoryFilter === cat
                ? "bg-primary text-primary-foreground"
                : "bg-card border border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Sub Category Filter */}
      {mainCategoryFilter !== "All" && (
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
          {subCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSubCategoryFilter(cat)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                subCategoryFilter === cat
                  ? "bg-secondary text-foreground border border-primary/50"
                  : "bg-secondary/50 border border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Dishes List */}
      <div className="flex flex-col gap-3">
        {filteredDishes.length === 0 ? (
          <div className="bg-card rounded-2xl p-8 border border-border text-center">
            <UtensilsCrossed className="size-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No dishes saved yet</p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              Use the Calculator to create and save dishes
            </p>
          </div>
        ) : (
          filteredDishes.map((dish) => (
            <div
              key={dish.id}
              className="bg-card rounded-2xl border border-border overflow-hidden"
            >
              <button
                onClick={() => setExpandedId(expandedId === dish.id ? null : dish.id)}
                className="w-full p-4 flex items-start justify-between text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="size-12 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                    <UtensilsCrossed className="size-6 text-muted-foreground" />
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground">{dish.name}</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {dish.elements.length} elements · {dish.totalCalories} kcal
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground/70">{dish.mainCategory} · {dish.subCategory}</span>
                      {(dish.marcinServings || dish.patrycjaServings) && (
                        <div className="flex items-center gap-1">
                          {dish.marcinServings && (
                            <span className="px-1.5 py-0.5 rounded bg-navy/20 text-navy text-[9px] font-medium">
                              M:{dish.marcinServings}
                            </span>
                          )}
                          {dish.patrycjaServings && (
                            <span className="px-1.5 py-0.5 rounded bg-sage/20 text-sage text-[9px] font-medium">
                              P:{dish.patrycjaServings}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </button>

              {expandedId === dish.id && (
                <div className="px-4 pb-4 border-t border-border pt-3">
                  {/* Macros */}
                  <div className="grid grid-cols-5 gap-2 mb-4">
                    <div className="bg-secondary rounded-lg px-2 py-2 text-center">
                      <p className="text-[10px] text-muted-foreground">kcal</p>
                      <p className="text-sm font-semibold text-foreground">{dish.totalCalories}</p>
                    </div>
                    <div className="bg-secondary rounded-lg px-2 py-2 text-center">
                      <p className="text-[10px] text-muted-foreground">P</p>
                      <p className="text-sm font-semibold text-primary">{dish.totalProtein}g</p>
                    </div>
                    <div className="bg-secondary rounded-lg px-2 py-2 text-center">
                      <p className="text-[10px] text-muted-foreground">C</p>
                      <p className="text-sm font-semibold text-wheat">{dish.totalCarbs}g</p>
                    </div>
                    <div className="bg-secondary rounded-lg px-2 py-2 text-center">
                      <p className="text-[10px] text-muted-foreground">F</p>
                      <p className="text-sm font-semibold text-terracotta/70">{dish.totalFats}g</p>
                    </div>
                    <div className="bg-secondary rounded-lg px-2 py-2 text-center">
                      <p className="text-[10px] text-muted-foreground">Fib</p>
                      <p className="text-sm font-semibold text-sage/70">{dish.totalFiber}g</p>
                    </div>
                  </div>

                  {/* Elements */}
                  <div className="mb-4">
                    <p className="text-xs font-medium text-muted-foreground mb-2">Elements</p>
                    <div className="flex flex-col gap-2">
                      {dish.elements.map((el, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm">
                          <div className={`size-6 rounded-lg flex items-center justify-center ${
                            el.type === "component" ? "bg-primary/20" : "bg-secondary"
                          }`}>
                            {el.type === "component" ? (
                              <ChefHat className="size-3.5 text-primary" />
                            ) : (
                              <Apple className="size-3.5 text-muted-foreground" />
                            )}
                          </div>
                          <span className="text-foreground">{el.name}</span>
                          <span className="text-muted-foreground">({el.grams}g)</span>
                          {el.type === "component" && (
                            <button className="ml-auto p-1 rounded-md hover:bg-secondary">
                              <FileText className="size-3.5 text-muted-foreground" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recipe Steps (if any) */}
                  {(dish.recipeSteps && dish.recipeSteps.length > 0) && (
                    <div className="mb-4">
                      <p className="text-xs font-medium text-muted-foreground mb-2">Instructions</p>
                      <ol className="list-decimal list-inside space-y-1.5">
                        {dish.recipeSteps.map((step, i) => (
                          <li key={i} className="text-sm text-foreground">{step}</li>
                        ))}
                      </ol>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => onEditDish({
                        type: 'dish',
                        id: dish.id,
                        name: dish.name,
                        elements: dish.elements,
                        recipeSteps: dish.recipeSteps,
                        marcinServings: dish.marcinServings,
                        patrycjaServings: dish.patrycjaServings,
                        mainCategory: dish.mainCategory,
                        subCategory: dish.subCategory,
                      })}
                      className="flex-1 py-2.5 rounded-xl bg-secondary text-foreground text-sm font-medium flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
                    >
                      <Calculator className="size-4" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteDish(dish.id)}
                      className="flex-1 py-2.5 rounded-xl bg-destructive/10 text-destructive text-sm font-medium flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
                    >
                      <Trash2 className="size-4" />
                      Delete
                    </button>
                    <button className="flex-[1.5] py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium active:scale-[0.98] transition-transform">
                      Quick Log
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
