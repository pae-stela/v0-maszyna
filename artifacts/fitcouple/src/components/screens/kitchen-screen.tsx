

import { useState } from "react"
import { useUser } from "@/lib/user-context"
import { Calculator, Search, Plus, Trash2, Apple, Upload, ChefHat, UtensilsCrossed, FileText, ChevronDown } from "lucide-react"

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

// Mock ingredient database (per 100g) - gramsPerUnit is optional for countable items
const ingredientDatabase: Record<string, { calories: number; protein: number; carbs: number; fats: number; fiber: number; gramsPerUnit?: number }> = {
  "chicken breast": { calories: 165, protein: 31, carbs: 0, fats: 3.6, fiber: 0, gramsPerUnit: 170 },
  "rice": { calories: 130, protein: 2.7, carbs: 28, fats: 0.3, fiber: 0.4 },
  "broccoli": { calories: 34, protein: 2.8, carbs: 7, fats: 0.4, fiber: 2.6 },
  "olive oil": { calories: 884, protein: 0, carbs: 0, fats: 100, fiber: 0 },
  "eggs": { calories: 155, protein: 13, carbs: 1.1, fats: 11, fiber: 0, gramsPerUnit: 50 },
  "salmon": { calories: 208, protein: 20, carbs: 0, fats: 13, fiber: 0, gramsPerUnit: 150 },
  "oats": { calories: 389, protein: 17, carbs: 66, fats: 7, fiber: 10.6 },
  "banana": { calories: 89, protein: 1.1, carbs: 23, fats: 0.3, fiber: 2.6, gramsPerUnit: 120 },
  "greek yogurt": { calories: 59, protein: 10, carbs: 3.6, fats: 0.7, fiber: 0 },
  "almonds": { calories: 579, protein: 21, carbs: 22, fats: 50, fiber: 12.5 },
  "avocado": { calories: 160, protein: 2, carbs: 9, fats: 15, fiber: 7, gramsPerUnit: 200 },
  "tomato": { calories: 18, protein: 0.9, carbs: 3.9, fats: 0.2, fiber: 1.2, gramsPerUnit: 120 },
  "onion": { calories: 40, protein: 1.1, carbs: 9, fats: 0.1, fiber: 1.7, gramsPerUnit: 150 },
  "lime juice": { calories: 25, protein: 0.4, carbs: 8, fats: 0, fiber: 0.4 },
}

// Initial ingredients list (includes both raw ingredients and components)
const initialIngredients: IngredientItem[] = [
  // Raw ingredients
  { id: "1", name: "Chicken Breast", caloriesPer100g: 165, proteinPer100g: 31, carbsPer100g: 0, fatsPer100g: 3.6, fiberPer100g: 0, category: "Protein" },
  { id: "2", name: "Rice", caloriesPer100g: 130, proteinPer100g: 2.7, carbsPer100g: 28, fatsPer100g: 0.3, fiberPer100g: 0.4, category: "Carbs" },
  { id: "3", name: "Broccoli", caloriesPer100g: 34, proteinPer100g: 2.8, carbsPer100g: 7, fatsPer100g: 0.4, fiberPer100g: 2.6, category: "Vegetables" },
  { id: "4", name: "Olive Oil", caloriesPer100g: 884, proteinPer100g: 0, carbsPer100g: 0, fatsPer100g: 100, fiberPer100g: 0, category: "Fats" },
  { id: "5", name: "Eggs", caloriesPer100g: 155, proteinPer100g: 13, carbsPer100g: 1.1, fatsPer100g: 11, fiberPer100g: 0, category: "Protein" },
  { id: "6", name: "Salmon", caloriesPer100g: 208, proteinPer100g: 20, carbsPer100g: 0, fatsPer100g: 13, fiberPer100g: 0, category: "Protein" },
  { id: "7", name: "Oats", caloriesPer100g: 389, proteinPer100g: 17, carbsPer100g: 66, fatsPer100g: 7, fiberPer100g: 10.6, category: "Carbs" },
  { id: "8", name: "Banana", caloriesPer100g: 89, proteinPer100g: 1.1, carbsPer100g: 23, fatsPer100g: 0.3, fiberPer100g: 2.6, category: "Fruits" },
  { id: "9", name: "Greek Yogurt", caloriesPer100g: 59, proteinPer100g: 10, carbsPer100g: 3.6, fatsPer100g: 0.7, fiberPer100g: 0, category: "Dairy" },
  { id: "10", name: "Almonds", caloriesPer100g: 579, proteinPer100g: 21, carbsPer100g: 22, fatsPer100g: 50, fiberPer100g: 12.5, category: "Nuts" },
  { id: "11", name: "Avocado", caloriesPer100g: 160, proteinPer100g: 2, carbsPer100g: 9, fatsPer100g: 15, fiberPer100g: 7, category: "Vegetables" },
  { id: "12", name: "Tomato", caloriesPer100g: 18, proteinPer100g: 0.9, carbsPer100g: 3.9, fatsPer100g: 0.2, fiberPer100g: 1.2, category: "Vegetables" },
  // Components (bulk preparations with recipe steps)
  { 
    id: "c1", 
    name: "Guacamole", 
    caloriesPer100g: 129, 
    proteinPer100g: 1.7, 
    carbsPer100g: 8.1, 
    fatsPer100g: 10.8, 
    fiberPer100g: 5.4, 
    category: "Component",
    isComponent: true,
    subIngredients: [
      { ingredientId: "11", name: "Avocado", grams: 200 },
      { ingredientId: "12", name: "Tomato", grams: 50 },
      { ingredientId: "onion", name: "Onion", grams: 30 },
      { ingredientId: "lime", name: "Lime juice", grams: 15 },
    ],
    recipeSteps: [
      "Mash avocados in a bowl until desired consistency",
      "Dice tomato and onion finely",
      "Mix vegetables into avocado",
      "Add lime juice and salt to taste",
      "Refrigerate for 30 min before serving"
    ],
    yieldGrams: 295,
    marcinServings: 2,
    patrycjaServings: 2
  },
  { 
    id: "c2", 
    name: "Scrambled Eggs", 
    caloriesPer100g: 200, 
    proteinPer100g: 12.5, 
    carbsPer100g: 1.3, 
    fatsPer100g: 16.3, 
    fiberPer100g: 0, 
    category: "Component",
    isComponent: true,
    subIngredients: [
      { ingredientId: "5", name: "Eggs", grams: 150 },
      { ingredientId: "4", name: "Olive Oil", grams: 10 },
    ],
    recipeSteps: [
      "Crack eggs into a bowl and whisk",
      "Heat olive oil in a non-stick pan over medium heat",
      "Pour eggs into pan and stir gently",
      "Remove from heat while still slightly wet"
    ],
    yieldGrams: 160,
    marcinServings: 1,
    patrycjaServings: 1
  },
]

// Initial dishes (composed of ingredients and/or components)
const initialDishes: DishItem[] = [
  {
    id: "d1",
    name: "Power Breakfast",
    elements: [
      { type: "component", id: "c2", name: "Scrambled Eggs", grams: 160 },
      { type: "ingredient", id: "7", name: "Oats", grams: 50 },
      { type: "ingredient", id: "8", name: "Banana", grams: 100 },
    ],
    totalCalories: 560,
    totalProtein: 30,
    totalCarbs: 62,
    totalFats: 20,
    totalFiber: 8,
    mainCategory: "Light",
    subCategory: "Oats & Granola",
    marcinServings: 1,
    patrycjaServings: 1
  },
  {
    id: "d2",
    name: "Lunch Bowl",
    elements: [
      { type: "ingredient", id: "1", name: "Chicken Breast", grams: 150 },
      { type: "ingredient", id: "2", name: "Rice", grams: 150 },
      { type: "ingredient", id: "3", name: "Broccoli", grams: 100 },
      { type: "component", id: "c1", name: "Guacamole", grams: 50 },
    ],
    totalCalories: 580,
    totalProtein: 55,
    totalCarbs: 52,
    totalFats: 14,
    totalFiber: 6,
    mainCategory: "Large",
    subCategory: "Salads & Veggies",
    marcinServings: 2,
    patrycjaServings: 2
  },
  {
    id: "d3",
    name: "Protein Shake",
    elements: [
      { type: "ingredient", id: "8", name: "Banana", grams: 120 },
      { type: "ingredient", id: "9", name: "Greek Yogurt", grams: 150 },
      { type: "ingredient", id: "10", name: "Almonds", grams: 20 },
    ],
    totalCalories: 310,
    totalProtein: 19,
    totalCarbs: 38,
    totalFats: 12,
    totalFiber: 5,
    mainCategory: "Drinks",
    subCategory: "Shakes & Smoothies",
    marcinServings: 1,
    patrycjaServings: 1
  },
  {
    id: "d4",
    name: "Trail Mix Bites",
    elements: [
      { type: "ingredient", id: "10", name: "Almonds", grams: 30 },
      { type: "ingredient", id: "7", name: "Oats", grams: 20 },
    ],
    totalCalories: 250,
    totalProtein: 8,
    totalCarbs: 18,
    totalFats: 16,
    totalFiber: 4,
    mainCategory: "Snacks",
    subCategory: "Sweet",
    marcinServings: 3,
    patrycjaServings: 2
  },
]

export function KitchenScreen() {
  const [subTab, setSubTab] = useState<SubTab>("calculator")
  const { activeUser } = useUser()

  return (
    <div className="flex flex-col gap-4 pb-24">
      <div className="flex gap-1 p-1 bg-secondary rounded-xl">
        <button
          onClick={() => setSubTab("calculator")}
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
          onClick={() => setSubTab("ingredients")}
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
          onClick={() => setSubTab("dishes")}
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

      {subTab === "calculator" && <CalculatorView activeUser={activeUser} />}
      {subTab === "ingredients" && <IngredientsView />}
      {subTab === "dishes" && <DishesView />}
    </div>
  )
}

function CalculatorView({ activeUser }: { activeUser: string }) {
  const [ingredients, setIngredients] = useState<CalculatorIngredient[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedIngredient, setSelectedIngredient] = useState<string | null>(null)
  const [amount, setAmount] = useState("")
  const [useUnits, setUseUnits] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [saveName, setSaveName] = useState("")
  const [marcinServings, setMarcinServings] = useState(1)
  const [patrycjaServings, setPatrycjaServings] = useState(1)

  const suggestions = Object.keys(ingredientDatabase).filter(
    (name) => name.toLowerCase().includes(searchTerm.toLowerCase()) && searchTerm.length > 0
  )

  const selectedIngredientData = selectedIngredient ? ingredientDatabase[selectedIngredient.toLowerCase()] : null
  const hasUnits = selectedIngredientData?.gramsPerUnit !== undefined

  const selectIngredient = (ingredientName: string) => {
    setSelectedIngredient(ingredientName)
    setSearchTerm(ingredientName)
    setShowSuggestions(false)
    setAmount("")
    setUseUnits(false)
  }

  const addIngredient = () => {
    if (!selectedIngredient) return
    
    const baseNutrition = ingredientDatabase[selectedIngredient.toLowerCase()]
    if (!baseNutrition) return

    let gramsNum: number
    if (useUnits && baseNutrition.gramsPerUnit) {
      const units = parseFloat(amount) || 1
      gramsNum = units * baseNutrition.gramsPerUnit
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
      carbs: Math.round(baseNutrition.carbs * multiplier * 10) / 10,
      fats: Math.round(baseNutrition.fats * multiplier * 10) / 10,
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

  const handleSaveComponent = () => {
    if (selectedIngredients.length > 0 && saveName.trim()) {
      const servingInfo = `Servings: Marcin ${marcinServings}x (${Math.round(marcinPortion.calories)} kcal each), Patrycja ${patrycjaServings}x (${Math.round(patrycjaPortion.calories)} kcal each)`
      alert(`Component "${saveName}" saved!\n\n${selectedIngredients.length} ingredients\n${servingInfo}\n\nYou can add recipe steps in the Components tab.`)
      setSaveName("")
      setIngredients(ingredients.map((i) => ({ ...i, selected: false })))
    }
  }

  const handleSaveDish = () => {
    if (ingredients.length > 0 && saveName.trim()) {
      const servingInfo = `Servings: Marcin ${marcinServings}x (${Math.round(marcinPortion.calories)} kcal each), Patrycja ${patrycjaServings}x (${Math.round(patrycjaPortion.calories)} kcal each)`
      alert(`Dish "${saveName}" saved!\n\n${ingredients.length} ingredients\n${servingInfo}`)
      setSaveName("")
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Step 1: Add Ingredients */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
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
                className="flex-1 bg-secondary rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 capitalize"
              />
              <input
                type="number"
                placeholder={useUnits ? "units" : "g"}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-20 bg-secondary rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <button
                onClick={addIngredient}
                disabled={!selectedIngredient}
                className="size-12 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shrink-0 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition-transform"
              >
                <Plus className="size-5" />
              </button>
            </div>
            
            {/* Unit toggle - only show for ingredients with gramsPerUnit */}
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
                  Units ({selectedIngredientData?.gramsPerUnit}g each)
                </button>
              </div>
            )}
            
            {/* Suggestions dropdown */}
            {showSuggestions && suggestions.length > 0 && !selectedIngredient && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl overflow-hidden z-10 shadow-lg">
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
                  <p className="text-sm font-semibold text-amber-500">{ing.carbs}g</p>
                </div>
                <div className="bg-secondary rounded-lg px-2 py-2 text-center">
                  <p className="text-[10px] text-muted-foreground">F</p>
                  <p className="text-sm font-semibold text-rose-400">{ing.fats}g</p>
                </div>
                <div className="bg-secondary rounded-lg px-2 py-2 text-center">
                  <p className="text-[10px] text-muted-foreground">Fib</p>
                  <p className="text-sm font-semibold text-emerald-400">{ing.fiber}g</p>
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
              <p className="text-sm font-bold text-amber-500">{Math.round(totals.carbs * 10) / 10}g</p>
            </div>
            <div className="bg-background/50 rounded-lg px-2 py-2 text-center">
              <p className="text-[10px] text-muted-foreground">F</p>
              <p className="text-sm font-bold text-rose-400">{Math.round(totals.fats * 10) / 10}g</p>
            </div>
            <div className="bg-background/50 rounded-lg px-2 py-2 text-center">
              <p className="text-[10px] text-muted-foreground">Fib</p>
              <p className="text-sm font-bold text-emerald-400">{Math.round(totals.fiber * 10) / 10}g</p>
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
            <div className="bg-blue-500/10 rounded-xl p-3 border border-blue-500/20">
              <div className="flex items-center gap-2 mb-2">
                <div className="size-6 rounded-full bg-blue-500 flex items-center justify-center">
                  <span className="text-[10px] font-bold text-white">M</span>
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
            <div className="bg-emerald-500/10 rounded-xl p-3 border border-emerald-500/20">
              <div className="flex items-center gap-2 mb-2">
                <div className="size-6 rounded-full bg-emerald-500 flex items-center justify-center">
                  <span className="text-[10px] font-bold text-white">P</span>
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
                    className="bg-blue-500 h-full transition-all duration-300" 
                    style={{ width: `${(marcinServings * 2 / totalParts) * 100}%` }} 
                  />
                )}
                {patrycjaServings > 0 && (
                  <div 
                    className="bg-emerald-500 h-full transition-all duration-300" 
                    style={{ width: `${(patrycjaServings * 1 / totalParts) * 100}%` }} 
                  />
                )}
              </div>
            </div>
          )}

          {/* Portion Details */}
          <div className="grid grid-cols-2 gap-3">
            {/* Marcin's Portion */}
            <div className="bg-blue-500/5 rounded-xl p-3 border border-blue-500/10">
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
                  <span className="text-xs font-semibold text-amber-500">{Math.round((marcinServings > 1 ? marcinPerServing.carbs : marcinPortion.carbs) * 10) / 10}g</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Fats</span>
                  <span className="text-xs font-semibold text-rose-400">{Math.round((marcinServings > 1 ? marcinPerServing.fats : marcinPortion.fats) * 10) / 10}g</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Fiber</span>
                  <span className="text-xs font-semibold text-emerald-400">{Math.round((marcinServings > 1 ? marcinPerServing.fiber : marcinPortion.fiber) * 10) / 10}g</span>
                </div>
              </div>
              {marcinServings > 1 && (
                <div className="mt-2 pt-2 border-t border-blue-500/10">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-muted-foreground">All {marcinServings} servings</span>
                    <span className="text-xs font-bold text-foreground">{Math.round(marcinPortion.calories)} kcal</span>
                  </div>
                </div>
              )}
            </div>

            {/* Patrycja's Portion */}
            <div className="bg-emerald-500/5 rounded-xl p-3 border border-emerald-500/10">
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
                  <span className="text-xs font-semibold text-amber-500">{Math.round((patrycjaServings > 1 ? patrycjaPerServing.carbs : patrycjaPortion.carbs) * 10) / 10}g</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Fats</span>
                  <span className="text-xs font-semibold text-rose-400">{Math.round((patrycjaServings > 1 ? patrycjaPerServing.fats : patrycjaPortion.fats) * 10) / 10}g</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Fiber</span>
                  <span className="text-xs font-semibold text-emerald-400">{Math.round((patrycjaServings > 1 ? patrycjaPerServing.fiber : patrycjaPortion.fiber) * 10) / 10}g</span>
                </div>
              </div>
              {patrycjaServings > 1 && (
                <div className="mt-2 pt-2 border-t border-emerald-500/10">
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
        <div className="bg-emerald-500/10 px-5 py-3 border-b border-border flex items-center gap-3">
          <div className="size-7 rounded-full bg-emerald-500 text-white flex items-center justify-center text-sm font-bold">3</div>
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

function IngredientsView() {
  const [ingredientsList, setIngredientsList] = useState<IngredientItem[]>(initialIngredients)
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("All")
  const [showAddForm, setShowAddForm] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
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

  const filteredIngredients = ingredientsList.filter((el) => {
    const matchesSearch = el.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === "All" || el.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  const handleAddIngredient = () => {
    if (newIngredient.name.trim()) {
      const isComponent = newIngredient.category === "Component"
      const ingredient: IngredientItem = {
        id: Date.now().toString(),
        name: newIngredient.name,
        caloriesPer100g: parseFloat(newIngredient.caloriesPer100g) || 0,
        proteinPer100g: parseFloat(newIngredient.proteinPer100g) || 0,
        carbsPer100g: parseFloat(newIngredient.carbsPer100g) || 0,
        fatsPer100g: parseFloat(newIngredient.fatsPer100g) || 0,
        fiberPer100g: parseFloat(newIngredient.fiberPer100g) || 0,
        category: newIngredient.category,
        ...(isComponent && {
          isComponent: true,
          recipeSteps: newIngredient.instructions.split('\n').filter(s => s.trim()),
        }),
      }
      setIngredientsList([...ingredientsList, ingredient])
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

  const handleDeleteIngredient = (id: string) => {
    setIngredientsList(ingredientsList.filter((el) => el.id !== id))
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

      {/* Import from Excel */}
      <button className="bg-card rounded-2xl p-4 border border-border border-dashed flex items-center justify-center gap-3 text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors active:scale-[0.98]">
        <Upload className="size-5" />
        <span className="text-sm font-medium">Import from Excel</span>
      </button>

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
                          <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-500 text-[9px] font-medium">
                            M:{ingredient.marcinServings}
                          </span>
                        )}
                        {ingredient.patrycjaServings && (
                          <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-500 text-[9px] font-medium">
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

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        alert("Edit functionality coming soon")
                      }}
                      className="flex-1 py-2.5 rounded-xl bg-secondary text-foreground text-sm font-medium flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
                    >
                      Edit
                    </button>
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
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function DishesView() {
  const [dishes, setDishes] = useState<DishItem[]>(initialDishes)
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

  const handleDeleteDish = (id: string) => {
    setDishes(dishes.filter((d) => d.id !== id))
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

      {/* Info Card */}
      <div className="bg-primary/10 rounded-2xl p-4 border border-primary/30">
        <p className="text-sm text-foreground">
          <span className="font-medium">Dishes</span> are complete meals composed of ingredients and components. Create new dishes in the Calculator tab.
        </p>
      </div>

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
                            <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-500 text-[9px] font-medium">
                              M:{dish.marcinServings}
                            </span>
                          )}
                          {dish.patrycjaServings && (
                            <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-500 text-[9px] font-medium">
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
                      <p className="text-sm font-semibold text-amber-500">{dish.totalCarbs}g</p>
                    </div>
                    <div className="bg-secondary rounded-lg px-2 py-2 text-center">
                      <p className="text-[10px] text-muted-foreground">F</p>
                      <p className="text-sm font-semibold text-rose-400">{dish.totalFats}g</p>
                    </div>
                    <div className="bg-secondary rounded-lg px-2 py-2 text-center">
                      <p className="text-[10px] text-muted-foreground">Fib</p>
                      <p className="text-sm font-semibold text-emerald-400">{dish.totalFiber}g</p>
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

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDeleteDish(dish.id)}
                      className="flex-1 py-2.5 rounded-xl bg-destructive/10 text-destructive text-sm font-medium flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
                    >
                      <Trash2 className="size-4" />
                      Delete
                    </button>
                    <button className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium active:scale-[0.98] transition-transform">
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
