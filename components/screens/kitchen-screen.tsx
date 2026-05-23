"use client"

import { useState } from "react"
import { useUser } from "@/lib/user-context"
import { Calculator, BookOpen, Search, Plus } from "lucide-react"

type SubTab = "calculator" | "recipes"

export function KitchenScreen() {
  const [subTab, setSubTab] = useState<SubTab>("calculator")
  const { activeUser } = useUser()

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2 p-1 bg-secondary rounded-xl">
        <button
          onClick={() => setSubTab("calculator")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
            subTab === "calculator"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground"
          }`}
        >
          <Calculator className="size-4" />
          Calculator
        </button>
        <button
          onClick={() => setSubTab("recipes")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
            subTab === "recipes"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground"
          }`}
        >
          <BookOpen className="size-4" />
          Recipes
        </button>
      </div>

      {subTab === "calculator" ? (
        <CalculatorView activeUser={activeUser} />
      ) : (
        <RecipesView />
      )}
    </div>
  )
}

function CalculatorView({ activeUser }: { activeUser: string }) {
  const [splitPercentage, setSplitPercentage] = useState(50)

  return (
    <div className="flex flex-col gap-4">
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

      <div className="bg-card rounded-2xl p-5 border border-border">
        <h3 className="text-base font-semibold mb-4">Quick Calculate</h3>
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="Search ingredient..."
              className="flex-1 bg-secondary rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <button className="size-12 rounded-xl bg-primary text-primary-foreground flex items-center justify-center active:scale-95 transition-transform">
              <Search className="size-5" />
            </button>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="number"
              placeholder="Amount (g)"
              className="flex-1 bg-secondary rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <button className="px-6 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-medium active:scale-95 transition-transform">
              Calculate
            </button>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-2xl p-5 border border-border">
        <h3 className="text-base font-semibold mb-2">Result Preview</h3>
        <p className="text-sm text-muted-foreground">
          Calculate an ingredient to see nutritional breakdown here
        </p>
      </div>
    </div>
  )
}

function RecipesView() {
  const recipes = [
    { name: "Chicken Stir Fry", calories: 450, time: "25 min" },
    { name: "Greek Salad", calories: 280, time: "10 min" },
    { name: "Protein Oatmeal", calories: 380, time: "5 min" },
  ]

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

      <div className="flex flex-col gap-3">
        {recipes.map((recipe, i) => (
          <button
            key={i}
            className="bg-card rounded-2xl p-4 border border-border flex items-center gap-4 text-left active:scale-[0.98] transition-transform"
          >
            <div className="size-14 rounded-xl bg-secondary flex items-center justify-center">
              <span className="text-2xl">🍽️</span>
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-foreground">{recipe.name}</h4>
              <p className="text-sm text-muted-foreground">
                {recipe.calories} kcal · {recipe.time}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
