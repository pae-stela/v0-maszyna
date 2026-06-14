import { ClipboardCheck, Soup, BicepsFlexed, Gauge, Cat } from "lucide-react"

export type Tab = "kitchen" | "planner" | "dashboard" | "workout" | "profile"

interface BottomNavProps {
  activeTab: Tab
  onTabChange: (tab: Tab) => void
}

const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "kitchen",   label: "Fuel",      icon: Soup          },
  { id: "workout",   label: "Gain",      icon: BicepsFlexed  },
  { id: "dashboard", label: "Dashboard", icon: Gauge         },
  { id: "planner",   label: "Plan",      icon: ClipboardCheck },
  { id: "profile",   label: "Track",     icon: Cat           },
]

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-xl border-t border-border pb-safe">
      <div className="flex items-end justify-around px-2 py-2">
        {tabs.map(({ id, label, icon: Icon }) => {
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
                /* Dashboard — elevated centre button */
                <div
                  className={`relative flex items-center justify-center size-12 rounded-2xl shadow-lg transition-all duration-300 ${
                    isActive
                      ? "bg-primary text-primary-foreground scale-105"
                      : "bg-secondary text-muted-foreground hover:bg-secondary/70"
                  }`}
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
                {label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
