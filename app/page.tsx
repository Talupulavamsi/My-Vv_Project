"use client"

import { AuthPage } from "@/components/AuthPage"
import { MainApp } from "@/components/MainApp"
import { useAuth } from "@/hooks/useAuth"

export default function App() {
  const { user, loading, error } = useAuth()

  console.log("🎯 App render state:", {
    hasUser: !!user,
    userEmail: user?.email,
    loading,
    error,
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading VoiceVibe...</p>
          <p className="text-gray-400 text-sm mt-2">Checking authentication...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-lg mb-4">Authentication Error</div>
          <p className="text-gray-400">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  // Show MainApp if user is logged in, otherwise show AuthPage
  if (user) {
    console.log("✅ Rendering MainApp for user:", user.email)
    return <MainApp />
  }

  console.log("❌ Rendering AuthPage - no user found")
  return <AuthPage />
}
