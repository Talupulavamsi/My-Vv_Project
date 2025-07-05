"use client"

import { useState, useEffect } from "react"
import { Navigation } from "@/components/Navigation"
import { HomeTab } from "@/components/HomeTab"
import { GroupsTab } from "@/components/GroupsTab"
import { ProfileTab } from "@/components/ProfileTab"
import { NotificationSystem } from "@/components/NotificationSystem"
import { useAuth } from "@/hooks/useAuth"

export function MainApp() {
  const [activeTab, setActiveTab] = useState("groups")
  const [notifications, setNotifications] = useState<any[]>([])
  const { user, logout } = useAuth()

  useEffect(() => {
    console.log("🎉 MainApp loaded for user:", user?.email)
  }, [user])

  const addNotification = (notification: any) => {
    setNotifications((prev) => [...prev, { ...notification, id: Date.now() }])
  }

  const removeNotification = (id: number) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }

  const renderActiveTab = () => {
    if (!user) return null

    switch (activeTab) {
      case "home":
        return <HomeTab />
      case "groups":
        return <GroupsTab onNotification={addNotification} />
      case "profile":
        return <ProfileTab />
      default:
        return <GroupsTab onNotification={addNotification} />
    }
  }

  if (!user) {
    console.log("❌ MainApp: No user found, this shouldn't happen")
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-white text-lg">Loading user data...</p>
        </div>
      </div>
    )
  }

  console.log("✅ MainApp: Rendering for user:", user.display_name)

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex">
      {/* Sidebar Navigation */}
      <div className="w-64 flex-shrink-0">
        <Navigation activeTab={activeTab} onTabChange={setActiveTab} onLogout={logout} user={user} />
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto">{renderActiveTab()}</div>
      </div>

      {/* Notification System */}
      <NotificationSystem notifications={notifications} onRemove={removeNotification} />
    </div>
  )
}
