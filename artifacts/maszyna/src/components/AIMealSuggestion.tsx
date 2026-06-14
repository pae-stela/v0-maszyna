import { useState } from "react"
import { Sparkles, ChevronDown, Loader2, RefreshCw } from "lucide-react"
import { useLanguage } from "@/lib/i18n/context"

interface Macros { calories: number; protein: number; carbs: number; fats: number }

interface MealSuggestion {
  name: string
  description: string
  ingredients: string[]
  macros: Macros
}

interface Props {
  remaining: Macros
  targets: Macros
}

export function AIMealSuggestion({ remaining, targets }: Props) {
  const { t, language } = useLanguage()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [suggestion, setSuggestion] = useState<MealSuggestion | null>(null)
  const [error, setError] = useState<string | null>(null)

  const hasEnoughRemaining = remaining.calories > 150

  const getSuggestion = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/ai/meal-suggestion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ remaining, targets, lang: language }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setError(body.error || `Error ${res.status}`)
        return
      }
      const data = await res.json()
      setSuggestion(data)
    } catch (e) {
      setError("Network error")
    } finally {
      setLoading(false)
    }
  }

  if (!hasEnoughRemaining) return null

  return (
    <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl border border-primary/20 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full p-4 flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-primary/20 flex items-center justify-center">
            <Sparkles className="size-5 text-primary" />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-foreground">{t('aiMealSuggestion')}</p>
            <p className="text-xs text-muted-foreground">
              {remaining.calories} kcal · {remaining.protein}g białka pozostało
            </p>
          </div>
        </div>
        <ChevronDown className={`size-5 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="px-4 pb-4 flex flex-col gap-3">
          <p className="text-xs text-muted-foreground">{t('basedOnPlanned')}</p>

          {!suggestion && !loading && !error && (
            <button
              onClick={getSuggestion}
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
            >
              <Sparkles className="size-4" />
              {t('getMealIdea')}
            </button>
          )}

          {loading && (
            <div className="flex items-center justify-center gap-2 py-4 text-muted-foreground">
              <Loader2 className="size-5 animate-spin" />
              <span className="text-sm">{t('loadingSuggestion')}</span>
            </div>
          )}

          {error && (
            <div className="bg-destructive/10 rounded-xl p-3 text-center">
              <p className="text-xs text-destructive mb-2">
                {error.includes("OPENAI_API_KEY") ? t('noKeyConfigured') : error}
              </p>
              <button
                onClick={getSuggestion}
                className="text-xs text-primary font-medium flex items-center gap-1 mx-auto"
              >
                <RefreshCw className="size-3" /> {t('tryAgain')}
              </button>
            </div>
          )}

          {suggestion && !loading && (
            <div className="bg-card rounded-xl border border-border p-4 flex flex-col gap-3">
              <div>
                <h4 className="text-sm font-bold text-foreground">{suggestion.name}</h4>
                <p className="text-xs text-muted-foreground mt-0.5">{suggestion.description}</p>
              </div>

              {suggestion.ingredients.length > 0 && (
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1.5">Składniki</p>
                  <div className="flex flex-col gap-1">
                    {suggestion.ingredients.map((ing, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-foreground">
                        <span className="size-1.5 rounded-full bg-primary/50 shrink-0" />
                        {ing}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-2 border-t border-border/50 text-[10px] font-mono">
                <span className="text-foreground font-semibold">{suggestion.macros.calories} kcal</span>
                <span className="text-moss">{suggestion.macros.protein}g B</span>
                <span className="text-wheat">{suggestion.macros.carbs}g W</span>
                <span className="text-terracotta/80">{suggestion.macros.fats}g T</span>
              </div>

              <button
                onClick={getSuggestion}
                className="text-xs text-primary font-medium flex items-center gap-1 self-end"
              >
                <RefreshCw className="size-3" /> {t('tryAgain')}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
