"use client"

import { useState } from "react"
import { useUser } from "@/lib/user-context"
import { Settings, X, Users, User } from "lucide-react"

function WhiteCat() {
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

function BlackCat() {
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

export function TopBar() {
  const { activeUser, setActiveUser } = useUser()
  const [showSettings, setShowSettings] = useState(false)
  const [settingsTab, setSettingsTab] = useState<"couple" | "profile">("couple")
  const [marcinRatio, setMarcinRatio] = useState(2)
  const [patrycjaRatio, setPatrycjaRatio] = useState(1)
  const [restTimerDuration, setRestTimerDuration] = useState(90)

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 bg-card/80 backdrop-blur-xl border-b border-border">
        <div className="flex items-center gap-1 bg-secondary rounded-full p-1">
          <button
            onClick={() => setActiveUser("patrycja")}
            className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
              activeUser === "patrycja"
                ? "bg-primary text-primary-foreground shadow-lg"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <WhiteCat />
            <span>Patrycja</span>
          </button>
          <button
            onClick={() => setActiveUser("marcin")}
            className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
              activeUser === "marcin"
                ? "bg-primary text-primary-foreground shadow-lg"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <BlackCat />
            <span>Marcin</span>
          </button>
        </div>

        <button 
          onClick={() => setShowSettings(true)}
          className="p-2 rounded-full hover:bg-secondary transition-colors"
        >
          <Settings className="size-5 text-foreground" />
        </button>
      </header>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-[60] p-4 pb-24">
          <div className="bg-card rounded-2xl w-full max-w-md overflow-hidden max-h-[70vh] flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-border flex items-center justify-between shrink-0">
              <h3 className="font-semibold text-foreground">Settings</h3>
              <button 
                onClick={() => setShowSettings(false)}
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
                      <div className="flex-1 bg-blue-500/10 rounded-xl p-3 border border-blue-500/20">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="size-6 rounded-full bg-blue-500 flex items-center justify-center">
                            <span className="text-[10px] font-bold text-white">M</span>
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
                      <div className="flex-1 bg-emerald-500/10 rounded-xl p-3 border border-emerald-500/20">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="size-6 rounded-full bg-emerald-500 flex items-center justify-center">
                            <span className="text-[10px] font-bold text-white">P</span>
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
                          className="bg-blue-500 h-full transition-all duration-300" 
                          style={{ width: `${(marcinRatio / (marcinRatio + patrycjaRatio)) * 100}%` }} 
                        />
                        <div 
                          className="bg-emerald-500 h-full transition-all duration-300" 
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
                        <div className="absolute right-0.5 top-0.5 size-5 bg-white rounded-full shadow-sm" />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-5">
                  {/* Profile Info */}
                  <div className="bg-secondary/50 rounded-xl p-4">
                    <h4 className="text-sm font-semibold text-foreground mb-3">Your Profile</h4>
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`size-12 rounded-full flex items-center justify-center ${activeUser === "patrycja" ? "bg-emerald-500" : "bg-blue-500"}`}>
                        {activeUser === "patrycja" ? <WhiteCat /> : <BlackCat />}
                      </div>
                      <div>
                        <p className="font-medium text-foreground capitalize">{activeUser}</p>
                        <p className="text-xs text-muted-foreground">Active profile</p>
                      </div>
                    </div>
                  </div>

                  {/* Daily Goals */}
                  <div className="bg-secondary/50 rounded-xl p-4">
                    <h4 className="text-sm font-semibold text-foreground mb-1">Daily Goals</h4>
                    <p className="text-xs text-muted-foreground mb-3">
                      Set your personal macro targets
                    </p>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-foreground">Calories</span>
                        <span className="text-sm font-medium text-foreground">{activeUser === "patrycja" ? "1,800" : "2,500"} kcal</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-foreground">Protein</span>
                        <span className="text-sm font-medium text-primary">{activeUser === "patrycja" ? "100" : "150"}g</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-foreground">Carbs</span>
                        <span className="text-sm font-medium text-amber-500">{activeUser === "patrycja" ? "180" : "250"}g</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-foreground">Fats</span>
                        <span className="text-sm font-medium text-rose-400">{activeUser === "patrycja" ? "65" : "85"}g</span>
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
                          <div className="absolute right-0.5 top-0.5 size-5 bg-white rounded-full shadow-sm" />
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-foreground">Metric Units</span>
                        <div className="w-11 h-6 bg-primary rounded-full relative cursor-pointer">
                          <div className="absolute right-0.5 top-0.5 size-5 bg-white rounded-full shadow-sm" />
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
      )}
    </>
  )
}
