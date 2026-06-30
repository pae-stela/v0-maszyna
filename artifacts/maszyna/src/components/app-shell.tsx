
import { useState } from "react"
import { BottomNav, type Tab } from "@/components/bottom-nav"
import { DashboardScreen } from "@/components/screens/dashboard-screen"
import { KitchenScreen, type EditMode } from "@/components/screens/kitchen-screen"
import { WorkoutScreen } from "@/components/screens/workout-screen"
import { PlannerScreen } from "@/components/screens/planner-screen"
import { ProfileScreen } from "@/components/screens/profile-screen"
import { useLanguage } from "@/lib/i18n/context"
import { useAuth } from "@/lib/auth-context"

export function AppShell() {
  const [activeTab, setActiveTab] = useState<Tab>("dashboard")
  const [kitchenEditDish, setKitchenEditDish] = useState<EditMode | null>(null)
  const { t, language } = useLanguage()
  const { profile } = useAuth()

  const handleNavigateToKitchen = (dish: EditMode) => {
    setKitchenEditDish(dish)
    setActiveTab("kitchen")
  }

  const handleTabChange = (tab: Tab) => {
    if (tab === "kitchen" && activeTab !== "planner") {
      setKitchenEditDish(null)
    }
    if (tab !== "kitchen") {
      setKitchenEditDish(null)
    }
    setActiveTab(tab)
  }

  const handleEditSaveComplete = () => {
    setKitchenEditDish(null)
    setActiveTab("planner")
  }

  const renderScreen = () => {
    switch (activeTab) {
      case "dashboard":
        return <DashboardScreen />
      case "kitchen":
        return (
          <KitchenScreen
            initialEditMode={kitchenEditDish}
            onEditSaveComplete={kitchenEditDish ? handleEditSaveComplete : undefined}
          />
        )
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
    if (activeTab === "dashboard") {
      const hour = new Date().getHours()
      const greeting = hour < 12 ? t('goodMorning') : t('goodEvening')
      const firstName = profile?.name?.split(' ')[0] || ''
      return firstName ? `${greeting}, ${firstName}` : greeting
    }
    switch (activeTab) {
      case "kitchen": return t('fuel')
      case "workout": return t('gain')
      case "planner": return t('plan')
      case "profile": return t('track')
      default: return ""
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
    <div className="min-h-screen bg-background" style={{ background: 'linear-gradient(170deg, var(--color-olive-subtle) 0%, var(--background) 30%)' }}>
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
