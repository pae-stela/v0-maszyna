

import { useState } from "react"
import { useUser } from "@/lib/user-context"
import { Settings, X, Users, User, Calculator, Sparkles, Footprints, Globe } from "lucide-react"
import { useLanguage } from "@/lib/i18n/context"

export function WhiteCat() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="none">
      <ellipse cx="12" cy="13" rx="8" ry="7" fill="#f5f5f5" />
      <ellipse cx="12" cy="14" rx="6" ry="5" fill="#fafafa" />
      <path d="M4.5 8 C4 4, 7 5, 8 8" fill="#f5f5f5" />
      <path d="M19.5 8 C20 4, 17 5, 16 8" fill="#f5f5f5" />
      <circle cx="9" cy="12" r="1.5" fill="#1a1a1a" />
      <circle cx="15" cy="12" r="1.5" fill="#1a1a1a" />
      <ellipse cx="12" cy="14.5" rx="1" ry="0.6" fill="#ffb6c1" />
      <path d="M11 15.5 Q12 16.5 13 15.5" stroke="#888" strokeWidth="0.5" fill="none" />
    </svg>
  )
}

export function BlackCat() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="none">
      <ellipse cx="12" cy="13" rx="8" ry="7" fill="#1a1a1a" />
      <ellipse cx="12" cy="14" rx="6" ry="5" fill="#2a2a2a" />
      <path d="M4.5 8 C4 4, 7 5, 8 8" fill="#1a1a1a" />
      <path d="M19.5 8 C20 4, 17 5, 16 8" fill="#1a1a1a" />
      <circle cx="9" cy="12" r="1.5" fill="#a8e6cf" />
      <circle cx="15" cy="12" r="1.5" fill="#a8e6cf" />
      <circle cx="9" cy="12" r="0.5" fill="#1a1a1a" />
      <circle cx="15" cy="12" r="0.5" fill="#1a1a1a" />
      <ellipse cx="12" cy="14.5" rx="1" ry="0.6" fill="#ffb6c1" />
      <path d="M11 15.5 Q12 16.5 13 15.5" stroke="#666" strokeWidth="0.5" fill="none" />
    </svg>
  )
}

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { activeUser, setActiveUser, getWeeklyAvgSteps } = useUser()
  const { language, setLanguage, t } = useLanguage()
  const [settingsTab, setSettingsTab] = useState<"couple" | "profile">("couple")
  const [marcinRatio, setMarcinRatio] = useState(2)
  const [patrycjaRatio, setPatrycjaRatio] = useState(1)
  const [restTimerDuration, setRestTimerDuration] = useState(90)
  const [showMacroCalculator, setShowMacroCalculator] = useState(false)
  
  // Macro goals state (per user)
  const [macroGoals, setMacroGoals] = useState({
    patrycja: { calories: 1800, protein: 100, carbs: 180, fats: 65 },
    marcin: { calories: 2500, protein: 150, carbs: 250, fats: 85 }
  })
  
  // Calculator inputs
  const [calcGoal, setCalcGoal] = useState<"maintain" | "cut" | "bulk">("maintain")
  const [useStepData, setUseStepData] = useState(true)
  const [activityLevel, setActivityLevel] = useState<number>(1.55) // Moderate
  
  const weeklyAvgSteps = getWeeklyAvgSteps()
  
  // Get measurements from profile (simplified - would come from context in real app)
  const measurements = {
    patrycja: { weight: 62, height: 168, age: 28, sex: "female" as const },
    marcin: { weight: 85, height: 183, age: 32, sex: "male" as const }
  }
  
  const calculateMacros = () => {
    const m = measurements[activeUser]
    
    // Mifflin-St Jeor BMR
    let bmr: number
    if (m.sex === "male") {
      bmr = 10 * m.weight + 6.25 * m.height - 5 * m.age + 5
    } else {
      bmr = 10 * m.weight + 6.25 * m.height - 5 * m.age - 161
    }
    
    // TDEE - use steps or manual activity level
    let tdee: number
    if (useStepData && weeklyAvgSteps > 0) {
      // Base activity (1.2) + step-based calories
      const stepCalories = weeklyAvgSteps * 0.04 * m.weight
      tdee = bmr * 1.2 + stepCalories
    } else {
      tdee = bmr * activityLevel
    }
    
    // Adjust for goal
    if (calcGoal === "cut") tdee -= 400
    else if (calcGoal === "bulk") tdee += 300
    
    const calories = Math.round(tdee)
    
    // Protein: 1.8-2.2g per kg for active people
    const protein = Math.round(m.weight * 2)
    
    // Fats: 25-30% of calories
    const fats = Math.round((calories * 0.28) / 9)
    
    // Carbs: remaining calories
    const carbs = Math.round((calories - protein * 4 - fats * 9) / 4)
    
    return { calories, protein, carbs, fats }
  }
  
  const applyCalculatedMacros = () => {
    const calculated = calculateMacros()
    setMacroGoals(prev => ({
      ...prev,
      [activeUser]: calculated
    }))
    setShowMacroCalculator(false)
  }
  
  const updateMacroGoal = (macro: "calories" | "protein" | "carbs" | "fats", delta: number) => {
    setMacroGoals(prev => ({
      ...prev,
      [activeUser]: {
        ...prev[activeUser],
        [macro]: Math.max(0, prev[activeUser][macro] + delta)
      }
    }))
  }
  
  const currentGoals = macroGoals[activeUser]

  if (!isOpen) return null

  return (
    <>
      {/* Settings Modal */}
      <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-[60] p-4 pb-24">
        <div className="bg-card rounded-2xl w-full max-w-md overflow-hidden max-h-[70vh] flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-border flex items-center justify-between shrink-0">
            <h3 className="font-semibold text-foreground">Settings</h3>
            <button 
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-secondary"
            >
              <X className="size-5 text-muted-foreground" />
            </button>
          </div>

            {/* Tab Toggle */}
            <div className="p-4 border-b border-border shrink-0">
              <div className="flex gap-2 p-1 bg-secondary rounded-xl">
                <button
                  onClick={() => setSettingsTab("couple")}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                    settingsTab === "couple"
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground"
                  }`}
                >
                  <Users className="size-4" />
                  Couple
                </button>
                <button
                  onClick={() => setSettingsTab("profile")}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                    settingsTab === "profile"
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground"
                  }`}
                >
                  <User className="size-4" />
                  Profile
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 overflow-y-auto flex-1">
              {settingsTab === "couple" ? (
                <div className="flex flex-col gap-5">
                  {/* Smart Splitter Ratio */}
                  <div className="bg-secondary/50 rounded-xl p-4">
                    <h4 className="text-sm font-semibold text-foreground mb-1">Smart Splitter Ratio</h4>
                    <p className="text-xs text-muted-foreground mb-4">
                      Adjust how recipes are split between you two
                    </p>

                    <div className="flex gap-4 mb-4">
                      {/* Marcin Ratio */}
                      <div className="flex-1 bg-navy/10 rounded-xl p-3 border border-navy/20">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="size-6 rounded-full bg-navy flex items-center justify-center">
                            <span className="text-[10px] font-bold text-background">M</span>
                          </div>
                          <span className="text-xs font-medium text-foreground">Marcin</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-muted-foreground">Parts</span>
                          <div className="flex items-center bg-background rounded-lg">
                            <button
                              onClick={() => setMarcinRatio(Math.max(1, marcinRatio - 1))}
                              className="px-2 py-1 text-muted-foreground hover:text-foreground transition-colors text-sm"
                            >
                              -
                            </button>
                            <span className="w-6 text-center text-sm font-semibold text-foreground">{marcinRatio}</span>
                            <button
                              onClick={() => setMarcinRatio(marcinRatio + 1)}
                              className="px-2 py-1 text-muted-foreground hover:text-foreground transition-colors text-sm"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Patrycja Ratio */}
                      <div className="flex-1 bg-sage/10 rounded-xl p-3 border border-sage/20">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="size-6 rounded-full bg-sage flex items-center justify-center">
                            <span className="text-[10px] font-bold text-background">P</span>
                          </div>
                          <span className="text-xs font-medium text-foreground">Patrycja</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-muted-foreground">Parts</span>
                          <div className="flex items-center bg-background rounded-lg">
                            <button
                              onClick={() => setPatrycjaRatio(Math.max(1, patrycjaRatio - 1))}
                              className="px-2 py-1 text-muted-foreground hover:text-foreground transition-colors text-sm"
                            >
                              -
                            </button>
                            <span className="w-6 text-center text-sm font-semibold text-foreground">{patrycjaRatio}</span>
                            <button
                              onClick={() => setPatrycjaRatio(patrycjaRatio + 1)}
                              className="px-2 py-1 text-muted-foreground hover:text-foreground transition-colors text-sm"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Ratio Preview */}
                    <div className="bg-background rounded-lg p-3">
                      <div className="flex justify-between text-[10px] text-muted-foreground mb-1.5">
                        <span>Distribution Preview</span>
                        <span>
                          {Math.round((marcinRatio / (marcinRatio + patrycjaRatio)) * 100)}% / {Math.round((patrycjaRatio / (marcinRatio + patrycjaRatio)) * 100)}%
                        </span>
                      </div>
                      <div className="h-2.5 rounded-full overflow-hidden flex bg-secondary">
                        <div 
                          className="bg-navy h-full transition-all duration-300" 
                          style={{ width: `${(marcinRatio / (marcinRatio + patrycjaRatio)) * 100}%` }} 
                        />
                        <div 
                          className="bg-sage h-full transition-all duration-300" 
                          style={{ width: `${(patrycjaRatio / (marcinRatio + patrycjaRatio)) * 100}%` }} 
                        />
                      </div>
                      <p className="text-[10px] text-muted-foreground text-center mt-2">
                        For every {marcinRatio + patrycjaRatio} parts: Marcin gets {marcinRatio}, Patrycja gets {patrycjaRatio}
                      </p>
                    </div>
                  </div>

                  {/* Shared Goals */}
                  <div className="bg-secondary/50 rounded-xl p-4">
                    <h4 className="text-sm font-semibold text-foreground mb-1">Shared Meal Planning</h4>
                    <p className="text-xs text-muted-foreground mb-3">
                      Sync planner between accounts
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-foreground">Enabled</span>
                      <div className="w-11 h-6 bg-primary rounded-full relative cursor-pointer">
                        <div className="absolute right-0.5 top-0.5 size-5 bg-background rounded-full shadow-sm" />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-5">
                  {/* Profile Selector */}
                  <div className="bg-secondary/50 rounded-xl p-4">
                    <h4 className="text-sm font-semibold text-foreground mb-3">Active Profile</h4>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setActiveUser("patrycja")}
                        className={`flex-1 p-3 rounded-xl flex items-center gap-3 transition-all ${
                          activeUser === "patrycja"
                            ? "bg-sage/20 border-2 border-sage"
                            : "bg-background border-2 border-transparent hover:border-border"
                        }`}
                      >
                        <div className="size-10 rounded-full bg-sage flex items-center justify-center">
                          <WhiteCat />
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-medium text-foreground">Patrycja</p>
                          {activeUser === "patrycja" && (
                            <p className="text-[10px] text-sage">Active</p>
                          )}
                        </div>
                      </button>
                      <button
                        onClick={() => setActiveUser("marcin")}
                        className={`flex-1 p-3 rounded-xl flex items-center gap-3 transition-all ${
                          activeUser === "marcin"
                            ? "bg-navy/20 border-2 border-navy"
                            : "bg-background border-2 border-transparent hover:border-border"
                        }`}
                      >
                        <div className="size-10 rounded-full bg-navy flex items-center justify-center">
                          <BlackCat />
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-medium text-foreground">Marcin</p>
                          {activeUser === "marcin" && (
                            <p className="text-[10px] text-navy">Active</p>
                          )}
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Language Setting */}
                  <div className="bg-secondary/50 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Globe className="size-4 text-muted-foreground" />
                      <h4 className="text-sm font-semibold text-foreground">{t('language')}</h4>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setLanguage('en')}
                        className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                          language === 'en'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-background text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {t('english')}
                      </button>
                      <button
                        onClick={() => setLanguage('pl')}
                        className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                          language === 'pl'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-background text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {t('polish')}
                      </button>
                    </div>
                  </div>

                  {/* Daily Goals */}
                  <div className="bg-secondary/50 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-sm font-semibold text-foreground">Daily Goals</h4>
                      <button
                        onClick={() => setShowMacroCalculator(true)}
                        className="flex items-center gap-1 text-xs text-primary font-medium"
                      >
                        <Sparkles className="size-3" />
                        Calculate
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">
                      Set your personal macro targets
                    </p>
                    <div className="space-y-2.5">
                      {/* Calories */}
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-foreground">Calories</span>
                        <div className="flex items-center bg-background rounded-lg">
                          <button
                            onClick={() => updateMacroGoal("calories", -50)}
                            className="px-2 py-1 text-muted-foreground hover:text-foreground text-sm"
                          >-</button>
                          <span className="w-14 text-center text-sm font-medium text-foreground">{currentGoals.calories}</span>
                          <button
                            onClick={() => updateMacroGoal("calories", 50)}
                            className="px-2 py-1 text-muted-foreground hover:text-foreground text-sm"
                          >+</button>
                        </div>
                      </div>
                      {/* Protein */}
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-primary">Protein</span>
                        <div className="flex items-center bg-background rounded-lg">
                          <button
                            onClick={() => updateMacroGoal("protein", -5)}
                            className="px-2 py-1 text-muted-foreground hover:text-foreground text-sm"
                          >-</button>
                          <span className="w-12 text-center text-sm font-medium text-primary">{currentGoals.protein}g</span>
                          <button
                            onClick={() => updateMacroGoal("protein", 5)}
                            className="px-2 py-1 text-muted-foreground hover:text-foreground text-sm"
                          >+</button>
                        </div>
                      </div>
                      {/* Carbs */}
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-wheat">Carbs</span>
                        <div className="flex items-center bg-background rounded-lg">
                          <button
                            onClick={() => updateMacroGoal("carbs", -10)}
                            className="px-2 py-1 text-muted-foreground hover:text-foreground text-sm"
                          >-</button>
                          <span className="w-12 text-center text-sm font-medium text-wheat">{currentGoals.carbs}g</span>
                          <button
                            onClick={() => updateMacroGoal("carbs", 10)}
                            className="px-2 py-1 text-muted-foreground hover:text-foreground text-sm"
                          >+</button>
                        </div>
                      </div>
                      {/* Fats */}
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-terracotta/70">Fats</span>
                        <div className="flex items-center bg-background rounded-lg">
                          <button
                            onClick={() => updateMacroGoal("fats", -5)}
                            className="px-2 py-1 text-muted-foreground hover:text-foreground text-sm"
                          >-</button>
                          <span className="w-12 text-center text-sm font-medium text-terracotta/70">{currentGoals.fats}g</span>
                          <button
                            onClick={() => updateMacroGoal("fats", 5)}
                            className="px-2 py-1 text-muted-foreground hover:text-foreground text-sm"
                          >+</button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Preferences */}
                  <div className="bg-secondary/50 rounded-xl p-4">
                    <h4 className="text-sm font-semibold text-foreground mb-3">Preferences</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-foreground">Dark Mode</span>
                        <div className="w-11 h-6 bg-primary rounded-full relative cursor-pointer">
                          <div className="absolute right-0.5 top-0.5 size-5 bg-background rounded-full shadow-sm" />
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-foreground">Metric Units</span>
                        <div className="w-11 h-6 bg-primary rounded-full relative cursor-pointer">
                          <div className="absolute right-0.5 top-0.5 size-5 bg-background rounded-full shadow-sm" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Workout Settings */}
                  <div className="bg-secondary/50 rounded-xl p-4">
                    <h4 className="text-sm font-semibold text-foreground mb-1">Workout Settings</h4>
                    <p className="text-xs text-muted-foreground mb-3">
                      Customize your workout experience
                    </p>
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-sm text-foreground">Rest Timer</span>
                        <p className="text-[10px] text-muted-foreground">Between sets</p>
                      </div>
                      <div className="flex items-center bg-background rounded-lg">
                        <button
                          onClick={() => setRestTimerDuration(Math.max(15, restTimerDuration - 15))}
                          className="px-2.5 py-1.5 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          -
                        </button>
                        <span className="w-10 text-center text-sm font-medium text-foreground">{restTimerDuration}s</span>
                        <button
                          onClick={() => setRestTimerDuration(Math.min(300, restTimerDuration + 15))}
                          className="px-2.5 py-1.5 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

      {/* Macro Calculator Modal */}
      {showMacroCalculator && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70] p-4">
          <div className="bg-card rounded-2xl w-full max-w-sm overflow-hidden">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calculator className="size-5 text-primary" />
                <h3 className="font-semibold text-foreground">Macro Calculator</h3>
              </div>
              <button 
                onClick={() => setShowMacroCalculator(false)}
                className="p-1 rounded-lg hover:bg-secondary"
              >
                <X className="size-5 text-muted-foreground" />
              </button>
            </div>

            <div className="p-4 flex flex-col gap-4">
              <p className="text-xs text-muted-foreground">
                Based on your measurements ({measurements[activeUser].weight}kg, {measurements[activeUser].height}cm, age {measurements[activeUser].age})
              </p>

              {/* Goal Selection */}
              <div>
                <label className="text-xs text-muted-foreground mb-2 block">Goal</label>
                <div className="flex gap-2">
                  {[
                    { value: "cut", label: "Cut", desc: "-400 kcal" },
                    { value: "maintain", label: "Maintain", desc: "TDEE" },
                    { value: "bulk", label: "Bulk", desc: "+300 kcal" },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setCalcGoal(option.value as typeof calcGoal)}
                      className={`flex-1 py-2.5 rounded-xl text-center transition-all ${
                        calcGoal === option.value
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-muted-foreground"
                      }`}
                    >
                      <p className="text-sm font-medium">{option.label}</p>
                      <p className="text-[10px] opacity-70">{option.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Activity Level */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs text-muted-foreground">Activity Level</label>
                  {weeklyAvgSteps > 0 && (
                    <button
                      onClick={() => setUseStepData(!useStepData)}
                      className={`text-[10px] px-2 py-1 rounded-lg transition-all ${
                        useStepData 
                          ? "bg-sage/20 text-sage" 
                          : "bg-secondary text-muted-foreground"
                      }`}
                    >
                      {useStepData ? `Using ${weeklyAvgSteps.toLocaleString()} avg steps` : "Use step data"}
                    </button>
                  )}
                </div>
                {!useStepData && (
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: 1.2, label: "Sedentary", desc: "Desk job" },
                      { value: 1.375, label: "Light", desc: "1-2x/week" },
                      { value: 1.55, label: "Moderate", desc: "3-4x/week" },
                      { value: 1.725, label: "Active", desc: "5-6x/week" },
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setActivityLevel(option.value)}
                        className={`py-2 rounded-xl text-center transition-all ${
                          activityLevel === option.value
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary text-muted-foreground"
                        }`}
                      >
                        <p className="text-xs font-medium">{option.label}</p>
                        <p className="text-[10px] opacity-70">{option.desc}</p>
                      </button>
                    ))}
                  </div>
                )}
                {useStepData && weeklyAvgSteps > 0 && (
                  <div className="bg-sage/10 rounded-xl p-3 flex items-center gap-3">
                    <div className="size-10 rounded-full bg-sage/20 flex items-center justify-center">
                      <Footprints className="size-5 text-sage" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{weeklyAvgSteps.toLocaleString()} steps/day</p>
                      <p className="text-[10px] text-muted-foreground">Based on your weekly average</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Preview */}
              <div className="bg-secondary/50 rounded-xl p-3">
                <p className="text-[10px] text-muted-foreground mb-2">Calculated targets:</p>
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div>
                    <p className="text-sm font-bold text-foreground">{calculateMacros().calories}</p>
                    <p className="text-[9px] text-muted-foreground">kcal</p>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-primary">{calculateMacros().protein}g</p>
                    <p className="text-[9px] text-muted-foreground">protein</p>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-wheat">{calculateMacros().carbs}g</p>
                    <p className="text-[9px] text-muted-foreground">carbs</p>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-terracotta/70">{calculateMacros().fats}g</p>
                    <p className="text-[9px] text-muted-foreground">fats</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-border">
              <button
                onClick={applyCalculatedMacros}
                className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-medium active:scale-[0.98] transition-transform"
              >
                Apply These Goals
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
