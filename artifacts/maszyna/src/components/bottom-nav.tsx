import { ClipboardCheck, Soup, BicepsFlexed, Gauge, Cat } from "lucide-react"
import { useLanguage } from "@/lib/i18n/context"

export type Tab = "kitchen" | "planner" | "dashboard" | "workout" | "profile"

interface BottomNavProps {
  activeTab: Tab
  onTabChange: (tab: Tab) => void
}

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const { t } = useLanguage()

  const tabs: { id: Tab; labelKey: string; icon: React.ElementType }[] = [
    { id: "kitchen",   labelKey: "fuel",   icon: Soup          },
    { id: "workout",   labelKey: "gain",   icon: BicepsFlexed  },
    { id: "dashboard", labelKey: "kokpit", icon: Gauge         },
    { id: "planner",   labelKey: "plan",   icon: ClipboardCheck },
    { id: "profile",   labelKey: "track",  icon: Cat           },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-xl border-t border-border pb-safe">
      <div className="flex items-end justify-around px-2 py-2">
        {tabs.map(({ id, labelKey, icon: Icon }) => {
          const isActive = activeTab === id
          const isDashboard = id === "dashboard"
          return (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              className={`flex flex-col items-center gap-1 px-3 transition-all duration-300 ${
                isDashboard ? "pb-0 -mb-1" : "py-2"
              } ${
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {isDashboard ? (
                <div
                  className={`relative flex items-center justify-center size-12 rounded-2xl shadow-lg transition-all duration-300 ${
                    isActive
                      ? "text-white scale-105"
                      : "bg-secondary text-muted-foreground hover:bg-secondary/70"
                  }`}
                  style={isActive ? { background: 'linear-gradient(135deg, var(--color-olive-light), var(--color-olive-dark))' } : undefined}
                >
                  <Icon className="size-6" strokeWidth={isActive ? 2.5 : 2} />
                </div>
              ) : (
                <div className={`relative transition-transform duration-300 ${isActive ? "scale-110" : ""}`}>
                  <Icon className="size-6" strokeWidth={isActive ? 2.5 : 2} />
                  {isActive && (
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 size-1 bg-primary rounded-full" />
                  )}
                </div>
              )}
              <span className={`text-[10px] font-medium ${isActive && !isDashboard ? "text-primary" : isDashboard ? (isActive ? "text-primary" : "text-muted-foreground") : ""}`}>
                {t(labelKey as any)}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
