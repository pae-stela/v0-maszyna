
import { useState, useEffect } from "react"
import { useUser } from "@/lib/user-context"
import { useAuth } from "@/lib/auth-context"
import { useLanguage } from "@/lib/i18n/context"
import { 
  TrendingUp, TrendingDown, Minus, Ruler, Scale, Utensils, Dumbbell, 
  ChevronRight, Clock, Flame, Plus, X, Trophy, Zap,
  Calendar, Settings, Copy, Check, Link, Unlink, UserPlus
} from "lucide-react"
import { SettingsModal, WhiteCat, BlackCat } from "@/components/top-bar"

type ProfileTab = "measurements" | "logs" | "achievements"

const LS = (user: string, type: string) => `maszyna-${type}-${user}`

function loadWeightHistory(user: string): number[] {
  try { return JSON.parse(localStorage.getItem(LS(user, 'weight')) || '[]') }
  catch { return [] }
}

interface Measurement { id: string; label: string; values: number[]; unit: string }

const DEFAULT_MEASUREMENTS: Measurement[] = [
  { id: "waist", label: "Talia", values: [], unit: "cm" },
  { id: "hips", label: "Biodra", values: [], unit: "cm" },
  { id: "chest", label: "Klatka", values: [], unit: "cm" },
  { id: "bicep", label: "Biceps", values: [], unit: "cm" },
  { id: "thigh", label: "Udo", values: [], unit: "cm" },
]

function loadMeasurements(user: string): Measurement[] {
  try {
    const raw = localStorage.getItem(LS(user, 'measurements'))
    if (raw) return JSON.parse(raw)
  } catch {}
  return DEFAULT_MEASUREMENTS.map(m => ({ ...m }))
}

function saveWeightHistory(user: string, history: number[]) {
  localStorage.setItem(LS(user, 'weight'), JSON.stringify(history))
}

function saveMeasurements(user: string, data: Measurement[]) {
  localStorage.setItem(LS(user, 'measurements'), JSON.stringify(data))
}

export function ProfileScreen() {
  const { activeUser, mealLogs, workoutLogs } = useUser()
  const { profile, partner, linkPartner, unlinkPartner } = useAuth()
  const { language } = useLanguage()
  const isPl = language === "pl"
  const [activeTab, setActiveTab] = useState<ProfileTab>("measurements")
  const [logsSubTab, setLogsSubTab] = useState<"meals" | "workouts">("meals")
  const [expandedLog, setExpandedLog] = useState<string | null>(null)
  const [showSettings, setShowSettings] = useState(false)

  const [partnerCodeInput, setPartnerCodeInput] = useState("")
  const [partnerLinkLoading, setPartnerLinkLoading] = useState(false)
  const [partnerLinkError, setPartnerLinkError] = useState<string | null>(null)
  const [partnerLinkSuccess, setPartnerLinkSuccess] = useState(false)
  const [copiedCode, setCopiedCode] = useState(false)

  const [weightHistory, setWeightHistory] = useState<number[]>([])
  const [showWeightForm, setShowWeightForm] = useState(false)
  const [weightInput, setWeightInput] = useState("")

  const [measurements, setMeasurements] = useState<Measurement[]>([])
  const [showMeasurementModal, setShowMeasurementModal] = useState(false)
  const [measurementInputs, setMeasurementInputs] = useState<Record<string, string>>({})

  useEffect(() => {
    setWeightHistory(loadWeightHistory(activeUser))
    setMeasurements(loadMeasurements(activeUser))
    setShowWeightForm(false)
    setShowMeasurementModal(false)
  }, [activeUser])

  const logWeight = () => {
    const val = parseFloat(weightInput)
    if (isNaN(val) || val <= 0) return
    const next = [...weightHistory, val]
    saveWeightHistory(activeUser, next)
    setWeightHistory(next)
    setShowWeightForm(false)
    setWeightInput("")
  }

  const saveMeasurementInputs = () => {
    const updated = measurements.map(m => {
      const v = parseFloat(measurementInputs[m.id] || '')
      return !isNaN(v) && v > 0 ? { ...m, values: [...m.values, v] } : m
    })
    saveMeasurements(activeUser, updated)
    setMeasurements(updated)
    setShowMeasurementModal(false)
    setMeasurementInputs({})
  }

  const userMealLogs = mealLogs.filter(log => log.user === activeUser)
  const userWorkoutLogs = workoutLogs.filter(log => log.user === activeUser)

  const currentWeight = weightHistory.at(-1) ?? 0
  const previousWeight = weightHistory.at(-2) ?? 0
  const weightChange = currentWeight - previousWeight
  const weightTrend = weightChange > 0 ? "up" : weightChange < 0 ? "down" : "stable"

  const displayHistory = weightHistory.length > 1 ? weightHistory.slice(-7) : [0, 0]
  const minW = Math.min(...displayHistory)
  const maxW = Math.max(...displayHistory)
  const rangeW = maxW - minW || 1

  const totalCaloriesThisWeek = userMealLogs.filter(log => {
    const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7)
    return new Date(log.date) >= weekAgo
  }).reduce((sum, log) => sum + log.totalCalories, 0)

  const avgCaloriesPerDay = Math.round(totalCaloriesThisWeek / 7)
  const totalProteinThisWeek = userMealLogs.filter(log => {
    const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7)
    return new Date(log.date) >= weekAgo
  }).reduce((sum, log) => sum + log.totalProtein, 0)

  return (
    <div className="flex flex-col gap-4 pb-24">
      {/* Profile Header */}
      <div className="flex items-center justify-between -mt-2 mb-2">
        <div className="flex items-center gap-3">
          <div className={`size-12 rounded-full flex items-center justify-center ${activeUser === "patrycja" ? "bg-sage" : "bg-navy"}`}>
            {activeUser === "patrycja" ? <WhiteCat /> : <BlackCat />}
          </div>
          <div>
            <p className="text-lg font-semibold text-foreground capitalize">{profile?.name || activeUser}</p>
            <p className="text-xs text-muted-foreground">{isPl ? "Członek od sty 2024" : "Member since Jan 2024"}</p>
          </div>
        </div>
        <button onClick={() => setShowSettings(true)} className="p-2.5 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors">
          <Settings className="size-5 text-foreground" />
        </button>
      </div>

      {/* Partner Section */}
      <div className="bg-card rounded-2xl p-4 border border-border">
        {partner ? (
          /* Already connected */
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-full bg-sage/20 flex items-center justify-center">
                <Link className="size-4 text-sage" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground capitalize">{partner.name}</p>
                <p className="text-xs text-muted-foreground">{isPl ? "Połączony partner" : "Connected partner"}</p>
              </div>
            </div>
            <button
              onClick={unlinkPartner}
              className="p-2 rounded-lg hover:bg-secondary transition-colors"
              title={isPl ? "Rozłącz" : "Unlink"}
            >
              <Unlink className="size-4 text-muted-foreground" />
            </button>
          </div>
        ) : (
          /* Not connected — show own code + input to enter partner's code */
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <UserPlus className="size-4 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground">
                {isPl ? "Połącz z partnerem" : "Connect partner"}
              </p>
            </div>

            {/* Your own invite code */}
            {profile?.partner_invite_code && (
              <div className="flex flex-col gap-1">
                <p className="text-xs text-muted-foreground">{isPl ? "Twój kod — udostępnij partnerowi:" : "Your code — share with your partner:"}</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 px-3 py-2 bg-secondary rounded-lg text-sm font-mono tracking-widest text-foreground">
                    {profile.partner_invite_code}
                  </code>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(profile.partner_invite_code!)
                      setCopiedCode(true)
                      setTimeout(() => setCopiedCode(false), 2000)
                    }}
                    className="p-2 rounded-lg bg-secondary hover:bg-secondary/60 transition-colors"
                  >
                    {copiedCode ? <Check className="size-4 text-sage" /> : <Copy className="size-4 text-muted-foreground" />}
                  </button>
                </div>
              </div>
            )}

            {/* Enter partner's code */}
            <div className="flex flex-col gap-1">
              <p className="text-xs text-muted-foreground">{isPl ? "Wpisz kod partnera:" : "Enter partner's code:"}</p>
              <div className="flex gap-2">
                <input
                  value={partnerCodeInput}
                  onChange={e => { setPartnerCodeInput(e.target.value.trim()); setPartnerLinkError(null) }}
                  placeholder={isPl ? "np. ABC123" : "e.g. ABC123"}
                  className="flex-1 px-3 py-2 bg-secondary rounded-lg text-sm font-mono tracking-widest text-foreground placeholder:text-muted-foreground border border-transparent focus:border-border outline-none"
                  maxLength={20}
                />
                <button
                  disabled={!partnerCodeInput || partnerLinkLoading}
                  onClick={async () => {
                    setPartnerLinkLoading(true)
                    setPartnerLinkError(null)
                    const result = await linkPartner(partnerCodeInput)
                    setPartnerLinkLoading(false)
                    if (result.success) {
                      setPartnerLinkSuccess(true)
                      setPartnerCodeInput("")
                    } else {
                      setPartnerLinkError(isPl ? "Nieprawidłowy kod. Spróbuj ponownie." : "Invalid code. Please try again.")
                    }
                  }}
                  className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-40 transition-opacity"
                >
                  {partnerLinkLoading ? "..." : (isPl ? "Połącz" : "Link")}
                </button>
              </div>
              {partnerLinkError && <p className="text-xs text-destructive">{partnerLinkError}</p>}
              {partnerLinkSuccess && <p className="text-xs text-sage">{isPl ? "Połączono!" : "Connected!"}</p>}
            </div>
          </div>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 p-1 bg-secondary rounded-xl">
        {[
          { id: "measurements" as const, label: isPl ? "Ciało" : "Body", icon: Scale },
          { id: "logs" as const, label: isPl ? "Dziennik" : "Logs", icon: Calendar },
          { id: "achievements" as const, label: isPl ? "Odznaki" : "Badges", icon: Trophy },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1.5 ${
              activeTab === tab.id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
            }`}
          >
            <tab.icon className="size-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Measurements Tab */}
      {activeTab === "measurements" && (
        <div className="flex flex-col gap-4 animate-in fade-in-0 slide-in-from-bottom-2 duration-200">
          {/* Weight Card */}
          <div className="bg-card rounded-2xl p-4 border border-border">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="size-9 rounded-xl bg-primary/20 flex items-center justify-center">
                  <Scale className="size-5 text-primary" />
                </div>
                <div>
                <p className="text-xs text-muted-foreground">{isPl ? "Aktualna waga" : "Current Weight"}</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-foreground">{currentWeight || "—"}</span>
                    <span className="text-sm text-muted-foreground">kg</span>
                  </div>
                </div>
              </div>
              {currentWeight > 0 && previousWeight > 0 && (
                <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                  weightTrend === "up" ? "bg-terracotta/20 text-red-400"
                  : weightTrend === "down" ? "bg-sage/20 text-sage/70"
                  : "bg-secondary text-muted-foreground"
                }`}>
                  {weightTrend === "up" ? <TrendingUp className="size-3" /> : weightTrend === "down" ? <TrendingDown className="size-3" /> : <Minus className="size-3" />}
                  {Math.abs(weightChange).toFixed(1)}kg
                </div>
              )}
            </div>

            {/* Weight Chart */}
            <div className="h-20 bg-secondary/50 rounded-xl p-3 relative overflow-hidden mb-3">
              {weightHistory.length > 1 ? (
                <svg className="w-full h-full" viewBox="0 0 100 50" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="weightGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="oklch(0.75 0.18 145)" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="oklch(0.75 0.18 145)" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path
                    d={`M 0,${50 - ((displayHistory[0] - minW) / rangeW) * 40} ${displayHistory.map((w, i) =>
                      `L ${(i / (displayHistory.length - 1)) * 100},${50 - ((w - minW) / rangeW) * 40}`
                    ).join(' ')} L 100,50 L 0,50 Z`}
                    fill="url(#weightGradient)"
                  />
                  <path
                    d={`M 0,${50 - ((displayHistory[0] - minW) / rangeW) * 40} ${displayHistory.map((w, i) =>
                      `L ${(i / (displayHistory.length - 1)) * 100},${50 - ((w - minW) / rangeW) * 40}`
                    ).join(' ')}`}
                    fill="none" stroke="oklch(0.75 0.18 145)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  />
                </svg>
              ) : (
                <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
                  {currentWeight > 0 ? (isPl ? "Dodaj więcej wpisów, aby zobaczyć trend" : "Log more entries to see trend") : (isPl ? "Brak wagi" : "No weight logged yet")}
                </div>
              )}
              {weightHistory.length > 1 && (
                <div className="absolute bottom-1.5 left-3 right-3 flex justify-between text-[9px] text-muted-foreground">
                  <span>{Math.min(displayHistory.length, 7)}{isPl ? "d temu" : "d ago"}</span>
                  <span>{isPl ? "Dziś" : "Today"}</span>
                </div>
              )}
            </div>

            {/* Log Weight */}
            {showWeightForm ? (
              <div className="flex gap-2 animate-in fade-in-0 slide-in-from-top-1 duration-150">
                <input
                  type="number"
                  step="0.1"
                  placeholder="68.5"
                  value={weightInput}
                  onChange={e => setWeightInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && logWeight()}
                  autoFocus
                  className="flex-1 bg-secondary rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <span className="flex items-center text-sm text-muted-foreground shrink-0">kg</span>
                <button onClick={logWeight} className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium active:scale-[0.98] transition-transform">
                  Save
                </button>
                <button onClick={() => { setShowWeightForm(false); setWeightInput("") }} className="p-2.5 rounded-xl bg-secondary text-muted-foreground">
                  <X className="size-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowWeightForm(true)}
                className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium active:scale-[0.98] transition-transform"
              >
                {isPl ? "Zapisz" : "Save"}
              </button>
            )}
          </div>

          {/* Body Measurements */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-foreground">{isPl ? "Pomiary" : "Measurements"}</h3>
              <button
                onClick={() => {
                  const inputs: Record<string, string> = {}
                  measurements.forEach(m => { inputs[m.id] = m.values.at(-1)?.toString() ?? "" })
                  setMeasurementInputs(inputs)
                  setShowMeasurementModal(true)
                }}
                className="text-xs text-primary font-medium flex items-center gap-1 hover:opacity-80 transition-opacity"
              >
                <Plus className="size-3.5" />
                {isPl ? "Aktualizuj" : "Update"}
              </button>
            </div>
            <div className="flex flex-col gap-2">
              {measurements.map((m) => {
                const current = m.values.at(-1) ?? 0
                const previous = m.values.at(-2) ?? 0
                const change = current - previous
                const trend = current > 0 && previous > 0 ? (change > 0 ? "up" : change < 0 ? "down" : "stable") : "stable"
                return (
                  <div key={m.id} className="bg-card rounded-xl p-3 border border-border flex items-center gap-3">
                    <div className="size-9 rounded-lg bg-secondary flex items-center justify-center">
                      <Ruler className="size-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{m.label}</p>
                      <div className="flex items-center gap-1.5">
                        <span className="text-lg font-bold text-foreground">{current || "—"}</span>
                        <span className="text-xs text-muted-foreground">{m.unit}</span>
                        {current > 0 && previous > 0 && trend !== "stable" && (
                          <span className={`text-[10px] font-medium ${trend === "up" ? "text-terracotta/70" : "text-sage"}`}>
                            {trend === "up" ? "+" : ""}{change.toFixed(1)}
                          </span>
                        )}
                      </div>
                    </div>
                    {current > 0 && (
                      <div className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                        {m.values.slice(-3).map((v, i) => (
                          <span key={i} className="px-1">{v}</span>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Logs Tab */}
      {activeTab === "logs" && (
        <div className="flex flex-col gap-4 animate-in fade-in-0 slide-in-from-bottom-2 duration-200">
          <div className="bg-card rounded-2xl p-4 border border-border">
            <h3 className="font-semibold text-foreground mb-3">{isPl ? "Ten tydzień" : "This Week"}</h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-secondary/50 rounded-xl p-3 text-center">
                <p className="text-xl font-bold text-foreground">{avgCaloriesPerDay}</p>
                <p className="text-[10px] text-muted-foreground">{isPl ? "Śr. kcal/dzień" : "Avg Cal/Day"}</p>
              </div>
              <div className="bg-secondary/50 rounded-xl p-3 text-center">
                <p className="text-xl font-bold text-primary">{Math.round(totalProteinThisWeek / 7)}g</p>
                <p className="text-[10px] text-muted-foreground">{isPl ? "Śr. białko" : "Avg Protein"}</p>
              </div>
              <div className="bg-secondary/50 rounded-xl p-3 text-center">
                <p className="text-xl font-bold text-terracotta/70">{userWorkoutLogs.length}</p>
                <p className="text-[10px] text-muted-foreground">{isPl ? "Treningi" : "Workouts"}</p>
              </div>
            </div>
          </div>

          <div className="flex gap-2 p-1 bg-secondary rounded-xl">
            <button
              onClick={() => setLogsSubTab("meals")}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1.5 ${
                logsSubTab === "meals" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
              }`}
            >
              <Utensils className="size-3.5" />
              {isPl ? "Posiłki" : "Meals"}
            </button>
            <button
              onClick={() => setLogsSubTab("workouts")}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1.5 ${
                logsSubTab === "workouts" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
              }`}
            >
              <Dumbbell className="size-3.5" />
              {isPl ? "Treningi" : "Workouts"}
            </button>
          </div>

          {logsSubTab === "meals" && (
            <div className="flex flex-col gap-2">
              {userMealLogs.length === 0 ? (
                <div className="bg-card rounded-2xl p-6 border border-dashed border-border text-center">
                  <Utensils className="size-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">{isPl ? "Brak zalogowanych posiłków" : "No meals logged yet"}</p>
                </div>
              ) : userMealLogs.map((log) => (
                <div key={log.id} className="bg-card rounded-xl border border-border overflow-hidden">
                  <button
                    onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                    className="w-full p-3 flex items-center gap-3 text-left"
                  >
                    <div className={`size-9 rounded-lg flex items-center justify-center ${
                      log.type === "breakfast" ? "bg-wheat/20 text-wheat" :
                      log.type === "lunch" ? "bg-navy/20 text-navy" :
                      log.type === "dinner" ? "bg-sand/20 text-sand" :
                      "bg-sage/20 text-sage"
                    }`}>
                      <Utensils className="size-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground capitalize">
                          {isPl
                            ? ({ breakfast: "Śniadanie", lunch: "Obiad", dinner: "Kolacja", snack: "Przekąska" }[log.type] ?? log.type)
                            : log.type}
                        </span>
                        <span className="text-[10px] text-muted-foreground">{log.date}</span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Clock className="size-3 text-muted-foreground" />
                        <span className="text-[10px] text-muted-foreground">{log.time}</span>
                        <span className="text-[10px] text-muted-foreground">·</span>
                        <span className="text-[10px] font-medium text-primary">{log.totalCalories} kcal</span>
                      </div>
                    </div>
                    <ChevronRight className={`size-4 text-muted-foreground transition-transform duration-200 ${expandedLog === log.id ? "rotate-90" : ""}`} />
                  </button>
                  {expandedLog === log.id && (
                    <div className="px-3 pb-3 border-t border-border pt-2 animate-in fade-in-0 slide-in-from-top-1 duration-150">
                      <div className="grid grid-cols-4 gap-1.5 mb-2">
                        <div className="bg-secondary rounded-lg p-1.5 text-center"><p className="text-[10px] font-semibold text-primary">{log.totalProtein}g</p><p className="text-[8px] text-muted-foreground">{isPl ? "Białko" : "Protein"}</p></div>
                        <div className="bg-secondary rounded-lg p-1.5 text-center"><p className="text-[10px] font-semibold text-wheat">{log.totalCarbs}g</p><p className="text-[8px] text-muted-foreground">{isPl ? "Węgle" : "Carbs"}</p></div>
                        <div className="bg-secondary rounded-lg p-1.5 text-center"><p className="text-[10px] font-semibold text-terracotta/70">{log.totalFats}g</p><p className="text-[8px] text-muted-foreground">{isPl ? "Tłuszcze" : "Fats"}</p></div>
                        <div className="bg-secondary rounded-lg p-1.5 text-center"><p className="text-[10px] font-semibold text-sage">{log.totalFiber}g</p><p className="text-[8px] text-muted-foreground">{isPl ? "Błonnik" : "Fiber"}</p></div>
                      </div>
                      <div className="flex flex-col gap-1">
                        {log.items.map((item) => (
                          <div key={item.id} className="flex items-center justify-between text-[10px]">
                            <span className="text-foreground">{item.name}</span>
                            <span className="text-muted-foreground">{item.grams}g · {item.calories} kcal</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {logsSubTab === "workouts" && (
            <div className="flex flex-col gap-2">
              {userWorkoutLogs.length === 0 ? (
                <div className="bg-card rounded-2xl p-6 border border-dashed border-border text-center">
                  <Dumbbell className="size-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No workouts logged yet</p>
                </div>
              ) : userWorkoutLogs.map((log) => (
                <div key={log.id} className="bg-card rounded-xl border border-border overflow-hidden">
                  <button
                    onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                    className="w-full p-3 flex items-center gap-3 text-left"
                  >
                    <div className="size-9 rounded-lg bg-primary/20 flex items-center justify-center">
                      <Dumbbell className="size-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground">{log.planName}</span>
                        <span className="text-[10px] text-muted-foreground">{log.date}</span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Clock className="size-3 text-muted-foreground" />
                        <span className="text-[10px] text-muted-foreground">{log.startTime} - {log.endTime}</span>
                        <span className="text-[10px] text-muted-foreground">·</span>
                        <Flame className="size-3 text-terracotta/70" />
                        <span className="text-[10px] font-medium text-terracotta/70">{log.estimatedCalories}</span>
                      </div>
                    </div>
                    <ChevronRight className={`size-4 text-muted-foreground transition-transform duration-200 ${expandedLog === log.id ? "rotate-90" : ""}`} />
                  </button>
                  {expandedLog === log.id && (
                    <div className="px-3 pb-3 border-t border-border pt-2 animate-in fade-in-0 slide-in-from-top-1 duration-150">
                      <div className="grid grid-cols-3 gap-1.5 mb-2">
                        <div className="bg-secondary rounded-lg p-1.5 text-center"><p className="text-[10px] font-semibold text-foreground">{log.exercises.length}</p><p className="text-[8px] text-muted-foreground">Exercises</p></div>
                        <div className="bg-secondary rounded-lg p-1.5 text-center"><p className="text-[10px] font-semibold text-foreground">{log.totalSets}</p><p className="text-[8px] text-muted-foreground">Sets</p></div>
                        <div className="bg-secondary rounded-lg p-1.5 text-center"><p className="text-[10px] font-semibold text-foreground">{log.totalReps}</p><p className="text-[8px] text-muted-foreground">Reps</p></div>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        {log.exercises.map((exercise) => (
                          <div key={exercise.exerciseId} className="bg-secondary/50 rounded-lg p-2">
                            <p className="text-[10px] font-medium text-foreground mb-1">{exercise.name}</p>
                            <div className="flex flex-wrap gap-1">
                              {exercise.sets.map((set, i) => {
                                const diffColors = ["bg-sage", "bg-navy", "bg-wheat", "bg-terracotta", "bg-terracotta"]
                                return (
                                  <div key={i} className="flex items-center gap-0.5">
                                    <span className="text-[9px] text-muted-foreground">{set.reps}×{set.weight}</span>
                                    <span className={`size-1.5 rounded-full ${diffColors[(set.difficulty ?? 1) - 1]}`} />
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Achievements Tab */}
      {activeTab === "achievements" && (
        <div className="flex flex-col gap-4 animate-in fade-in-0 slide-in-from-bottom-2 duration-200">
          <div className="bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl p-4 border border-primary/20">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Zap className="size-5 text-primary" />
                  <span className="text-sm font-medium text-foreground">Current Streak</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-primary">0</span>
                  <span className="text-sm text-muted-foreground">days</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground mb-0.5">Best Streak</p>
                <p className="text-lg font-bold text-foreground">0 days</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-card rounded-xl p-3 border border-border text-center">
              <UtensilsCrossed className="size-5 text-wheat mx-auto mb-1" />
              <p className="text-2xl font-bold text-foreground">{userMealLogs.length}</p>
              <p className="text-[10px] text-muted-foreground">Meals Logged</p>
            </div>
            <div className="bg-card rounded-xl p-3 border border-border text-center">
              <Dumbbell className="size-5 text-primary mx-auto mb-1" />
              <p className="text-2xl font-bold text-foreground">{userWorkoutLogs.length}</p>
              <p className="text-[10px] text-muted-foreground">Workouts</p>
            </div>
          </div>

          <div className="bg-card rounded-2xl p-6 border border-dashed border-border text-center">
            <Trophy className="size-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Keep logging to earn badges!</p>
          </div>
        </div>
      )}

      {/* Update Measurements Modal */}
      {showMeasurementModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-end justify-center z-50 p-4 pb-24"
          onClick={() => setShowMeasurementModal(false)}
        >
          <div
            className="bg-card rounded-2xl w-full max-w-md overflow-hidden shadow-xl border border-border animate-in slide-in-from-bottom-4 duration-250"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h3 className="font-semibold text-foreground">Update Measurements</h3>
              <button onClick={() => setShowMeasurementModal(false)} className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
                <X className="size-4 text-muted-foreground" />
              </button>
            </div>
            <div className="p-4 flex flex-col gap-3 max-h-[60vh] overflow-y-auto">
              {measurements.map((m) => (
                <div key={m.id} className="flex items-center gap-3">
                  <label className="text-sm font-medium text-foreground w-16 shrink-0">{m.label}</label>
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      type="number"
                      step="0.1"
                      placeholder={m.values.at(-1)?.toString() ?? "0"}
                      value={measurementInputs[m.id] ?? ""}
                      onChange={e => setMeasurementInputs(prev => ({ ...prev, [m.id]: e.target.value }))}
                      className="flex-1 bg-secondary rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                    <span className="text-xs text-muted-foreground w-6 shrink-0">{m.unit}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-border flex gap-2">
              <button onClick={() => setShowMeasurementModal(false)} className="flex-1 py-2.5 rounded-xl border border-border bg-background text-sm font-medium text-muted-foreground hover:bg-secondary transition-colors">
                Cancel
              </button>
              <button onClick={saveMeasurementInputs} className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium active:scale-[0.98] transition-transform">
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
    </div>
  )
}
