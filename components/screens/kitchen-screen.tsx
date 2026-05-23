"use client"

import { useState } from "react"
import { useUser } from "@/lib/user-context"
import { Calculator, BookOpen, Search, Plus, Trash2, Save, Apple, Upload, ChefHat, UtensilsCrossed } from "lucide-react"

type SubTab = "calculator" | "ingredients" | "recipes" | "meals"

type ElementType = "ingredient" | "recipe"

interface FoodElement {
  id: string
  name: string
  type: ElementType
  caloriesPer100g: number
  proteinPer100g: number
  carbsPer100g: number
  fatsPer100g: number
  category?: string
}

interface Ingredient {
  id: string
  name: string
  grams: number
  calories: number
  protein: number
  carbs: number
  fats: number
}

// Mock ingredient database (per 100g)
const ingredientDatabase: Record<string, { calories: number; protein: number; carbs: number; fats: number }> = {
  "chicken breast": { calories: 165, protein: 31, carbs: 0, fats: 3.6 },
  "rice": { calories: 130, protein: 2.7, carbs: 28, fats: 0.3 },
  "broccoli": { calories: 34, protein: 2.8, carbs: 7, fats: 0.4 },
  "olive oil": { calories: 884, protein: 0, carbs: 0, fats: 100 },
  "eggs": { calories: 155, protein: 13, carbs: 1.1, fats: 11 },
  "salmon": { calories: 208, protein: 20, carbs: 0, fats: 13 },
  "oats": { calories: 389, protein: 17, carbs: 66, fats: 7 },
  "banana": { calories: 89, protein: 1.1, carbs: 23, fats: 0.3 },
  "greek yogurt": { calories: 59, protein: 10, carbs: 3.6, fats: 0.7 },
  "almonds": { calories: 579, protein: 21, carbs: 22, fats: 50 },
}

// Initial food elements (ingredients + recipes that can be used as meal components)
const initialFoodElements: FoodElement[] = [
  // Base ingredients
  { id: "1", name: "Chicken Breast", type: "ingredient", caloriesPer100g: 165, proteinPer100g: 31, carbsPer100g: 0, fatsPer100g: 3.6, category: "Protein" },
  { id: "2", name: "Rice", type: "ingredient", caloriesPer100g: 130, proteinPer100g: 2.7, carbsPer100g: 28, fatsPer100g: 0.3, category: "Carbs" },
  { id: "3", name: "Broccoli", type: "ingredient", caloriesPer100g: 34, proteinPer100g: 2.8, carbsPer100g: 7, fatsPer100g: 0.4, category: "Vegetables" },
  { id: "4", name: "Olive Oil", type: "ingredient", caloriesPer100g: 884, proteinPer100g: 0, carbsPer100g: 0, fatsPer100g: 100, category: "Fats" },
  { id: "5", name: "Eggs", type: "ingredient", caloriesPer100g: 155, proteinPer100g: 13, carbsPer100g: 1.1, fatsPer100g: 11, category: "Protein" },
  { id: "6", name: "Salmon", type: "ingredient", caloriesPer100g: 208, proteinPer100g: 20, carbsPer100g: 0, fatsPer100g: 13, category: "Protein" },
  { id: "7", name: "Oats", type: "ingredient", caloriesPer100g: 389, proteinPer100g: 17, carbsPer100g: 66, fatsPer100g: 7, category: "Carbs" },
  { id: "8", name: "Banana", type: "ingredient", caloriesPer100g: 89, proteinPer100g: 1.1, carbsPer100g: 23, fatsPer100g: 0.3, category: "Fruits" },
  { id: "9", name: "Greek Yogurt", type: "ingredient", caloriesPer100g: 59, proteinPer100g: 10, carbsPer100g: 3.6, fatsPer100g: 0.7, category: "Dairy" },
  { id: "10", name: "Almonds", type: "ingredient", caloriesPer100g: 579, proteinPer100g: 21, carbsPer100g: 22, fatsPer100g: 50, category: "Nuts" },
  // Recipes as elements (can be used in meals)
  { id: "r1", name: "Scrambled Eggs", type: "recipe", caloriesPer100g: 148, proteinPer100g: 10, carbsPer100g: 1.6, fatsPer100g: 11, category: "Breakfast" },
  { id: "r2", name: "Chicken Stir Fry", type: "recipe", caloriesPer100g: 120, proteinPer100g: 14, carbsPer100g: 8, fatsPer100g: 4, category: "Main" },
  { id: "r3", name: "Protein Oatmeal", type: "recipe", caloriesPer100g: 145, proteinPer100g: 12, carbsPer100g: 18, fatsPer100g: 4, category: "Breakfast" },
]

export function KitchenScreen() {
  const [subTab, setSubTab] = useState<SubTab>("calculator")
  const { activeUser } = useUser()

  return (
    <div className="flex flex-col gap-4">
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
          onClick={() => setSubTab("recipes")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
            subTab === "recipes"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground"
          }`}
        >
          <BookOpen className="size-4" />
          <span className="hidden xs:inline">Recipes</span>
          <span className="xs:hidden">Rec.</span>
        </button>
        <button
          onClick={() => setSubTab("meals")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
            subTab === "meals"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground"
          }`}
        >
          <UtensilsCrossed className="size-4" />
          Meals
        </button>
      </div>

      {subTab === "calculator" && <CalculatorView activeUser={activeUser} />}
      {subTab === "ingredients" && <IngredientsView />}
      {subTab === "recipes" && <RecipesView />}
      {subTab === "meals" && <MealsView />}
    </div>
  )
}

function CalculatorView({ activeUser }: { activeUser: string }) {
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [grams, setGrams] = useState("")
  const [recipeName, setRecipeName] = useState("")
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [saveType, setSaveType] = useState<"recipe" | "meal">("recipe")

  const suggestions = Object.keys(ingredientDatabase).filter(
    (name) => name.toLowerCase().includes(searchTerm.toLowerCase()) && searchTerm.length > 0
  )

  const addIngredient = (ingredientName: string) => {
    const gramsNum = parseFloat(grams) || 100
    const baseNutrition = ingredientDatabase[ingredientName.toLowerCase()]
    
    if (baseNutrition) {
      const multiplier = gramsNum / 100
      const newIngredient: Ingredient = {
        id: Date.now().toString(),
        name: ingredientName,
        grams: gramsNum,
        calories: Math.round(baseNutrition.calories * multiplier),
        protein: Math.round(baseNutrition.protein * multiplier * 10) / 10,
        carbs: Math.round(baseNutrition.carbs * multiplier * 10) / 10,
        fats: Math.round(baseNutrition.fats * multiplier * 10) / 10,
      }
      setIngredients([...ingredients, newIngredient])
      setSearchTerm("")
      setGrams("")
      setShowSuggestions(false)
    }
  }

  const removeIngredient = (id: string) => {
    setIngredients(ingredients.filter((i) => i.id !== id))
  }

  const totals = ingredients.reduce(
    (acc, ing) => ({
      calories: acc.calories + ing.calories,
      protein: acc.protein + ing.protein,
      carbs: acc.carbs + ing.carbs,
      fats: acc.fats + ing.fats,
    }),
    { calories: 0, protein: 0, carbs: 0, fats: 0 }
  )

  const handleSaveRecipe = () => {
    if (ingredients.length > 0 && recipeName.trim()) {
      // In a real app, this would save to a database
      const typeLabel = saveType === "recipe" ? "Recipe" : "Meal"
      alert(`${typeLabel} "${recipeName}" saved with ${ingredients.length} ingredients!`)
      setRecipeName("")
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Smart Splitter */}
      <div className="bg-card rounded-2xl p-5 border border-border">
        <h3 className="text-base font-semibold mb-4">Smart Splitter</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Split meal portions between Patrycja & Marcin
        </p>
        
        <div className="flex items-center justify-between mb-4">
          <div className="flex flex-col items-center">
            <div className="size-10 rounded-full bg-primary/20 flex items-center justify-center mb-2">
              <span className="text-xs font-bold text-primary">P</span>
            </div>
            <span className="text-2xl font-bold text-foreground">{splitPercentage}%</span>
            <span className="text-xs text-muted-foreground">Patrycja</span>
          </div>
          
          <div className="flex-1 mx-6">
            <input
              type="range"
              min="0"
              max="100"
              value={splitPercentage}
              onChange={(e) => setSplitPercentage(Number(e.target.value))}
              className="w-full h-2 bg-secondary rounded-full appearance-none cursor-pointer accent-primary"
            />
          </div>
          
          <div className="flex flex-col items-center">
            <div className="size-10 rounded-full bg-secondary flex items-center justify-center mb-2">
              <span className="text-xs font-bold text-foreground">M</span>
            </div>
            <span className="text-2xl font-bold text-foreground">{100 - splitPercentage}%</span>
            <span className="text-xs text-muted-foreground">Marcin</span>
          </div>
        </div>
      </div>

      {/* Add Ingredients */}
      <div className="bg-card rounded-2xl p-5 border border-border">
        <h3 className="text-base font-semibold mb-4">Add Ingredients</h3>
        <div className="flex flex-col gap-3">
          <div className="relative">
            <div className="flex items-center gap-3">
              <input
                type="text"
                placeholder="Search ingredient..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setShowSuggestions(true)
                }}
                onFocus={() => setShowSuggestions(true)}
                className="flex-1 bg-secondary rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <input
                type="number"
                placeholder="g"
                value={grams}
                onChange={(e) => setGrams(e.target.value)}
                className="w-20 bg-secondary rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            
            {/* Suggestions dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-20 mt-2 bg-card border border-border rounded-xl overflow-hidden z-10 shadow-lg">
                {suggestions.map((name) => (
                  <button
                    key={name}
                    onClick={() => addIngredient(name)}
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
      {ingredients.length > 0 && (
        <div className="flex flex-col gap-3">
          <h3 className="text-base font-semibold">Meal Breakdown</h3>
          
          {/* Ingredient Cards */}
          {ingredients.map((ing) => (
            <div
              key={ing.id}
              className="bg-card rounded-2xl p-4 border border-border"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-foreground font-medium capitalize">{ing.name}</span>
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
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-secondary rounded-lg px-3 py-2 text-center">
                  <p className="text-xs text-muted-foreground">kcal</p>
                  <p className="text-sm font-semibold text-foreground">{ing.calories}</p>
                </div>
                <div className="flex-1 bg-secondary rounded-lg px-3 py-2 text-center">
                  <p className="text-xs text-muted-foreground">Protein</p>
                  <p className="text-sm font-semibold text-primary">{ing.protein}g</p>
                </div>
                <div className="flex-1 bg-secondary rounded-lg px-3 py-2 text-center">
                  <p className="text-xs text-muted-foreground">Carbs</p>
                  <p className="text-sm font-semibold text-amber-500">{ing.carbs}g</p>
                </div>
                <div className="flex-1 bg-secondary rounded-lg px-3 py-2 text-center">
                  <p className="text-xs text-muted-foreground">Fats</p>
                  <p className="text-sm font-semibold text-rose-400">{ing.fats}g</p>
                </div>
              </div>
            </div>
          ))}
          
          {/* Totals Card */}
          <div className="bg-primary/10 rounded-2xl p-4 border border-primary/30">
            <p className="text-sm font-semibold text-foreground mb-3">Total</p>
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-background/50 rounded-lg px-3 py-2 text-center">
                <p className="text-xs text-muted-foreground">kcal</p>
                <p className="text-sm font-bold text-foreground">{Math.round(totals.calories)}</p>
              </div>
              <div className="flex-1 bg-background/50 rounded-lg px-3 py-2 text-center">
                <p className="text-xs text-muted-foreground">Protein</p>
                <p className="text-sm font-bold text-primary">{Math.round(totals.protein * 10) / 10}g</p>
              </div>
              <div className="flex-1 bg-background/50 rounded-lg px-3 py-2 text-center">
                <p className="text-xs text-muted-foreground">Carbs</p>
                <p className="text-sm font-bold text-amber-500">{Math.round(totals.carbs * 10) / 10}g</p>
              </div>
              <div className="flex-1 bg-background/50 rounded-lg px-3 py-2 text-center">
                <p className="text-xs text-muted-foreground">Fats</p>
                <p className="text-sm font-bold text-rose-400">{Math.round(totals.fats * 10) / 10}g</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Save to Library */}
      {ingredients.length > 0 && (
        <div className="bg-card rounded-2xl p-5 border border-border">
          <h3 className="text-base font-semibold mb-3">Save to Library</h3>
          
          {/* Save Type Toggle */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setSaveType("recipe")}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                saveType === "recipe"
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground"
              }`}
            >
              <ChefHat className="size-4" />
              Recipe
            </button>
            <button
              onClick={() => setSaveType("meal")}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                saveType === "meal"
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground"
              }`}
            >
              <UtensilsCrossed className="size-4" />
              Meal
            </button>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder={saveType === "recipe" ? "Recipe name..." : "Meal name..."}
              value={recipeName}
              onChange={(e) => setRecipeName(e.target.value)}
              className="flex-1 bg-secondary rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <button
              onClick={handleSaveRecipe}
              disabled={!recipeName.trim()}
              className="px-5 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-medium flex items-center gap-2 active:scale-95 transition-transform disabled:opacity-50 disabled:active:scale-100"
            >
              <Save className="size-4" />
              Save
            </button>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            {ingredients.length} ingredient{ingredients.length !== 1 ? "s" : ""} · {Math.round(totals.calories)} kcal total
          </p>
          <p className="text-xs text-muted-foreground/70 mt-1">
            {saveType === "recipe" 
              ? "Recipes can be used as ingredients in meals" 
              : "Meals are complete combinations ready to log"}
          </p>
        </div>
      )}
    </div>
  )
}

type RecipeType = "all" | "one-pot" | "protein" | "vegetables" | "quick" | "meal-prep"

type ElementFilter = "all" | "ingredient" | "recipe"

const elementCategories = ["All", "Protein", "Carbs", "Vegetables", "Fruits", "Dairy", "Fats", "Nuts", "Breakfast", "Main"]

function IngredientsView() {
  const [foodElements, setFoodElements] = useState<FoodElement[]>(initialFoodElements)
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState<ElementFilter>("all")
  const [showAddForm, setShowAddForm] = useState(false)
  const [newElement, setNewElement] = useState({
    name: "",
    type: "ingredient" as ElementType,
    caloriesPer100g: "",
    proteinPer100g: "",
    carbsPer100g: "",
    fatsPer100g: "",
    category: "Protein",
  })

  const filteredElements = foodElements.filter((el) => {
    const matchesSearch = el.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = typeFilter === "all" || el.type === typeFilter
    return matchesSearch && matchesType
  })

  const handleAddElement = () => {
    if (newElement.name.trim()) {
      const element: FoodElement = {
        id: Date.now().toString(),
        name: newElement.name,
        type: newElement.type,
        caloriesPer100g: parseFloat(newElement.caloriesPer100g) || 0,
        proteinPer100g: parseFloat(newElement.proteinPer100g) || 0,
        carbsPer100g: parseFloat(newElement.carbsPer100g) || 0,
        fatsPer100g: parseFloat(newElement.fatsPer100g) || 0,
        category: newElement.category,
      }
      setFoodElements([...foodElements, element])
      setNewElement({
        name: "",
        type: "ingredient",
        caloriesPer100g: "",
        proteinPer100g: "",
        carbsPer100g: "",
        fatsPer100g: "",
        category: "Protein",
      })
      setShowAddForm(false)
    }
  }

  const handleDeleteElement = (id: string) => {
    setFoodElements(foodElements.filter((el) => el.id !== id))
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Search and Actions */}
      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search ingredients & recipes..."
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

      {/* Type Filter */}
      <div className="flex gap-2">
        {(["all", "ingredient", "recipe"] as ElementFilter[]).map((filter) => (
          <button
            key={filter}
            onClick={() => setTypeFilter(filter)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              typeFilter === filter
                ? "bg-primary text-primary-foreground"
                : "bg-card border border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {filter === "all" ? "All" : filter === "ingredient" ? "Ingredients" : "Recipes"}
          </button>
        ))}
      </div>

      {/* Add New Element Form */}
      {showAddForm && (
        <div className="bg-card rounded-2xl p-5 border border-primary/50">
          <h3 className="text-base font-semibold mb-4">Add New Element</h3>
          <div className="flex flex-col gap-3">
            <input
              type="text"
              placeholder="Name"
              value={newElement.name}
              onChange={(e) => setNewElement({ ...newElement, name: e.target.value })}
              className="bg-secondary rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            
            <div className="flex gap-2">
              <button
                onClick={() => setNewElement({ ...newElement, type: "ingredient" })}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                  newElement.type === "ingredient"
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground"
                }`}
              >
                <Apple className="size-4" />
                Ingredient
              </button>
              <button
                onClick={() => setNewElement({ ...newElement, type: "recipe" })}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                  newElement.type === "recipe"
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground"
                }`}
              >
                <ChefHat className="size-4" />
                Recipe
              </button>
            </div>

            <select
              value={newElement.category}
              onChange={(e) => setNewElement({ ...newElement, category: e.target.value })}
              className="bg-secondary rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              {elementCategories.slice(1).map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            <p className="text-xs text-muted-foreground mt-1">Macros per 100g</p>
            <div className="grid grid-cols-4 gap-2">
              <input
                type="number"
                placeholder="kcal"
                value={newElement.caloriesPer100g}
                onChange={(e) => setNewElement({ ...newElement, caloriesPer100g: e.target.value })}
                className="bg-secondary rounded-xl px-3 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <input
                type="number"
                placeholder="P"
                value={newElement.proteinPer100g}
                onChange={(e) => setNewElement({ ...newElement, proteinPer100g: e.target.value })}
                className="bg-secondary rounded-xl px-3 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <input
                type="number"
                placeholder="C"
                value={newElement.carbsPer100g}
                onChange={(e) => setNewElement({ ...newElement, carbsPer100g: e.target.value })}
                className="bg-secondary rounded-xl px-3 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <input
                type="number"
                placeholder="F"
                value={newElement.fatsPer100g}
                onChange={(e) => setNewElement({ ...newElement, fatsPer100g: e.target.value })}
                className="bg-secondary rounded-xl px-3 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            <button
              onClick={handleAddElement}
              disabled={!newElement.name.trim()}
              className="mt-2 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-medium flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-50"
            >
              <Save className="size-4" />
              Save Element
            </button>
          </div>
        </div>
      )}

      {/* Elements List */}
      <div className="flex flex-col gap-2">
        {filteredElements.length === 0 ? (
          <div className="bg-card rounded-2xl p-8 border border-border text-center">
            <p className="text-muted-foreground">No elements found</p>
          </div>
        ) : (
          filteredElements.map((element) => (
            <div
              key={element.id}
              className="bg-card rounded-2xl p-4 border border-border flex items-center gap-3"
            >
              <div className={`size-10 rounded-xl flex items-center justify-center shrink-0 ${
                element.type === "recipe" ? "bg-primary/20" : "bg-secondary"
              }`}>
                {element.type === "recipe" ? (
                  <ChefHat className="size-5 text-primary" />
                ) : (
                  <Apple className="size-5 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium text-foreground truncate">{element.name}</h4>
                  {element.type === "recipe" && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary shrink-0">
                      Recipe
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {element.caloriesPer100g} kcal · P {element.proteinPer100g}g · C {element.carbsPer100g}g · F {element.fatsPer100g}g
                </p>
                {element.category && (
                  <span className="text-xs text-muted-foreground/70">{element.category}</span>
                )}
              </div>
              <button
                onClick={() => handleDeleteElement(element.id)}
                className="size-8 rounded-lg bg-destructive/10 text-destructive flex items-center justify-center shrink-0 active:scale-95 transition-transform"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

const recipeFilters: { value: RecipeType; label: string }[] = [
  { value: "all", label: "All" },
  { value: "one-pot", label: "One-Pot" },
  { value: "protein", label: "Protein" },
  { value: "vegetables", label: "Vegetables" },
  { value: "quick", label: "Quick" },
  { value: "meal-prep", label: "Meal Prep" },
]

const allRecipes = [
  { name: "Chicken Stir Fry", calories: 450, time: "25 min", types: ["one-pot", "protein"] as RecipeType[] },
  { name: "Greek Salad", calories: 280, time: "10 min", types: ["vegetables", "quick"] as RecipeType[] },
  { name: "Protein Oatmeal", calories: 380, time: "5 min", types: ["protein", "quick"] as RecipeType[] },
  { name: "Veggie Curry", calories: 320, time: "30 min", types: ["one-pot", "vegetables", "meal-prep"] as RecipeType[] },
  { name: "Grilled Salmon", calories: 520, time: "20 min", types: ["protein"] as RecipeType[] },
  { name: "Buddha Bowl", calories: 410, time: "15 min", types: ["vegetables", "meal-prep"] as RecipeType[] },
]

function RecipesView() {
  const [activeFilter, setActiveFilter] = useState<RecipeType>("all")

  const filteredRecipes = activeFilter === "all" 
    ? allRecipes 
    : allRecipes.filter(recipe => recipe.types.includes(activeFilter))

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search recipes..."
            className="w-full bg-card rounded-xl pl-11 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground border border-border focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        <button className="size-12 rounded-xl bg-primary text-primary-foreground flex items-center justify-center active:scale-95 transition-transform">
          <Plus className="size-5" />
        </button>
      </div>

      {/* Recipe Type Filters */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
        {recipeFilters.map((filter) => (
          <button
            key={filter.value}
            onClick={() => setActiveFilter(filter.value)}
            className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
              activeFilter === filter.value
                ? "bg-primary text-primary-foreground"
                : "bg-card border border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        {filteredRecipes.length === 0 ? (
          <div className="bg-card rounded-2xl p-8 border border-border text-center">
            <p className="text-muted-foreground">No recipes found for this filter</p>
          </div>
        ) : (
          filteredRecipes.map((recipe, i) => (
            <button
              key={i}
              className="bg-card rounded-2xl p-4 border border-border flex items-center gap-4 text-left active:scale-[0.98] transition-transform"
            >
              <div className="size-14 rounded-xl bg-secondary flex items-center justify-center">
                <BookOpen className="size-6 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-foreground">{recipe.name}</h4>
                <p className="text-sm text-muted-foreground">
                  {recipe.calories} kcal · {recipe.time}
                </p>
                <div className="flex gap-1.5 mt-1.5 flex-wrap">
                  {recipe.types.map((type) => (
                    <span
                      key={type}
                      className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground"
                    >
                      {recipeFilters.find(f => f.value === type)?.label}
                    </span>
                  ))}
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  )
}

// Sample meals data
const initialMeals = [
  { 
    id: "m1", 
    name: "Power Breakfast", 
    elements: ["Scrambled Eggs", "Oats", "Banana"],
    totalCalories: 520,
    totalProtein: 28,
    totalCarbs: 62,
    totalFats: 18,
  },
  { 
    id: "m2", 
    name: "Lunch Bowl", 
    elements: ["Chicken Stir Fry", "Rice", "Broccoli"],
    totalCalories: 680,
    totalProtein: 45,
    totalCarbs: 72,
    totalFats: 12,
  },
  { 
    id: "m3", 
    name: "Evening Snack", 
    elements: ["Greek Yogurt", "Almonds", "Banana"],
    totalCalories: 380,
    totalProtein: 18,
    totalCarbs: 42,
    totalFats: 16,
  },
]

function MealsView() {
  const [meals, setMeals] = useState(initialMeals)
  const [searchTerm, setSearchTerm] = useState("")

  const filteredMeals = meals.filter((meal) =>
    meal.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleDeleteMeal = (id: string) => {
    setMeals(meals.filter((m) => m.id !== id))
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Search */}
      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search meals..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-card rounded-xl pl-11 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground border border-border focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
      </div>

      {/* Info Card */}
      <div className="bg-primary/10 rounded-2xl p-4 border border-primary/30">
        <p className="text-sm text-foreground">
          Meals are saved combinations of ingredients and recipes. Create new meals in the Calculator tab.
        </p>
      </div>

      {/* Meals List */}
      <div className="flex flex-col gap-3">
        {filteredMeals.length === 0 ? (
          <div className="bg-card rounded-2xl p-8 border border-border text-center">
            <UtensilsCrossed className="size-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No meals saved yet</p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              Use the Calculator to create and save meals
            </p>
          </div>
        ) : (
          filteredMeals.map((meal) => (
            <div
              key={meal.id}
              className="bg-card rounded-2xl p-4 border border-border"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-medium text-foreground">{meal.name}</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {meal.elements.join(" + ")}
                  </p>
                </div>
                <button
                  onClick={() => handleDeleteMeal(meal.id)}
                  className="size-8 rounded-lg bg-destructive/10 text-destructive flex items-center justify-center shrink-0 active:scale-95 transition-transform"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
              
              {/* Macros */}
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-secondary rounded-lg px-2 py-2 text-center">
                  <p className="text-xs text-muted-foreground">kcal</p>
                  <p className="text-sm font-semibold text-foreground">{meal.totalCalories}</p>
                </div>
                <div className="flex-1 bg-secondary rounded-lg px-2 py-2 text-center">
                  <p className="text-xs text-muted-foreground">P</p>
                  <p className="text-sm font-semibold text-primary">{meal.totalProtein}g</p>
                </div>
                <div className="flex-1 bg-secondary rounded-lg px-2 py-2 text-center">
                  <p className="text-xs text-muted-foreground">C</p>
                  <p className="text-sm font-semibold text-amber-500">{meal.totalCarbs}g</p>
                </div>
                <div className="flex-1 bg-secondary rounded-lg px-2 py-2 text-center">
                  <p className="text-xs text-muted-foreground">F</p>
                  <p className="text-sm font-semibold text-rose-400">{meal.totalFats}g</p>
                </div>
              </div>

              {/* Quick Log Button */}
              <button className="w-full mt-3 py-2.5 rounded-xl bg-primary/10 text-primary text-sm font-medium active:scale-[0.98] transition-transform">
                Quick Log This Meal
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
