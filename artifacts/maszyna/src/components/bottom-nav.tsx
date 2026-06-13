import { Calendar, Soup, BicepsFlexed, Gauge, Cat } from "lucide-react"

export type Tab = "kitchen" | "planner" | "dashboard" | "workout" | "profile"

interface BottomNavProps {
  activeTab: Tab
  onTabChange: (tab: Tab) => void
}

const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "kitchen",   label: "Fuel",      icon: Soup          },
  { id: "workout",   label: "Gain",      icon: BicepsFlexed  },
  { id: "dashboard", label: "Dashboard", icon: Gauge         },
  { id: "planner",   label: "Plan",      icon: Calendar      },
  { id: "profile",   label: "Track",     icon: Cat           },
]

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-xl border-t border-border pb-safe">
      <div className="flex items-center justify-around px-2 py-2">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onTabChange(id)}
            className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl min-w-[60px] transition-all duration-300 ${
              activeTab === id
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <div
              className={`relative transition-transform duration-300 ${
                activeTab === id ? "scale-110" : ""
              }`}
            >
              <Icon className="size-6" strokeWidth={activeTab === id ? 2.5 : 2} />
              {activeTab === id && (
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 size-1 bg-primary rounded-full" />
              )}
            </div>
            <span
              className={`text-[10px] font-medium ${
                activeTab === id ? "text-primary" : ""
              }`}
            >
              {label}
            </span>
          </button>
        ))}
      </div>
    </nav>
  )
}
