

import { useState } from "react"
import { BottomNav, type Tab } from "@/components/bottom-nav"
import { DashboardScreen } from "@/components/screens/dashboard-screen"
import { KitchenScreen, type EditMode } from "@/components/screens/kitchen-screen"
import { WorkoutScreen } from "@/components/screens/workout-screen"
import { PlannerScreen } from "@/components/screens/planner-screen"
import { ProfileScreen } from "@/components/screens/profile-screen"
import { useLanguage } from "@/lib/i18n/context"

export function AppShell() {
  const [activeTab, setActiveTab] = useState<Tab>("dashboard")
  const [kitchenEditDish, setKitchenEditDish] = useState<EditMode | null>(null)
  const { t, language } = useLanguage()

  const handleNavigateToKitchen = (dish: EditMode) => {
    setKitchenEditDish(dish)
    setActiveTab("kitchen")
  }

  const handleTabChange = (tab: Tab) => {
    // Clear dish edit mode when navigating to kitchen manually (not via "edit in kitchen")
    if (tab === "kitchen" && activeTab !== "planner") {
      setKitchenEditDish(null)
    }
    if (tab !== "kitchen") {
      setKitchenEditDish(null)
    }
    setActiveTab(tab)
  }

  const renderScreen = () => {
    switch (activeTab) {
      case "dashboard":
        return <DashboardScreen />
      case "kitchen":
        return <KitchenScreen initialEditMode={kitchenEditDish} />
      case "workout":
        return <WorkoutScreen />
      case "planner":
        return <PlannerScreen onNavigateToKitchen={handleNavigateToKitchen} />
      case "profile":
        return <ProfileScreen />
      default:
        return <DashboardScreen />
    }
  }

  const getScreenTitle = () => {
    switch (activeTab) {
      case "dashboard":
        return t('dashboard')
      case "kitchen":
        return t('kitchen')
      case "workout":
        return t('workout')
      case "planner":
        return t('planner')
      case "profile":
        return t('profile')
      default:
        return ""
    }
  }

  const getScreenSubtitle = () => {
    if (activeTab === "dashboard") {
      const locale = language === 'pl' ? 'pl-PL' : 'en-US'
      return new Date().toLocaleDateString(locale, { weekday: 'long', month: 'long', day: 'numeric' })
    }
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="pt-6 pb-[100px] px-4 overflow-y-auto h-[100dvh]">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">{getScreenTitle()}</h1>
          {getScreenSubtitle() && (
            <p className="text-sm text-muted-foreground mt-0.5">{getScreenSubtitle()}</p>
          )}
        </div>
        <div className="transition-all duration-300">
          {renderScreen()}
        </div>
      </main>
      
      <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />
    </div>
  )
}
