"use client"

import { useState } from "react"
import { TopBar } from "@/components/top-bar"
import { BottomNav, type Tab } from "@/components/bottom-nav"
import { DashboardScreen } from "@/components/screens/dashboard-screen"
import { KitchenScreen } from "@/components/screens/kitchen-screen"
import { WorkoutScreen } from "@/components/screens/workout-screen"
import { PlannerScreen } from "@/components/screens/planner-screen"
import { ProfileScreen } from "@/components/screens/profile-screen"

export function AppShell() {
  const [activeTab, setActiveTab] = useState<Tab>("dashboard")

  const renderScreen = () => {
    switch (activeTab) {
      case "dashboard":
        return <DashboardScreen />
      case "kitchen":
        return <KitchenScreen />
      case "workout":
        return <WorkoutScreen />
      case "planner":
        return <PlannerScreen />
      case "profile":
        return <ProfileScreen />
      default:
        return <DashboardScreen />
    }
  }

  const getScreenTitle = () => {
    switch (activeTab) {
      case "dashboard":
        return "Dashboard"
      case "kitchen":
        return "Kitchen"
      case "workout":
        return "Workout"
      case "planner":
        return "Planner"
      case "profile":
        return "Profile"
      default:
        return ""
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      
      <main className="pt-[72px] pb-[100px] px-4">
        <h1 className="text-2xl font-bold text-foreground mb-6">{getScreenTitle()}</h1>
        <div className="transition-all duration-300">
          {renderScreen()}
        </div>
      </main>
      
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  )
}
