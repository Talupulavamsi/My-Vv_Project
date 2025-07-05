"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function TestPage() {
  const [connectionStatus, setConnectionStatus] = useState("Testing...")
  const [authStatus, setAuthStatus] = useState("Checking...")
  const [userProfile, setUserProfile] = useState<any>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [logs, setLogs] = useState<string[]>([])

  const addLog = (message: string) => {
    console.log(message)
    setLogs((prev) => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  useEffect(() => {
    runTests()
  }, [])

  const runTests = async () => {
    addLog("🔍 Starting connection tests...")

    // Test 1: Database Connection
    try {
      const { data, error } = await supabase.from("users").select("count").limit(1)
      if (error) throw error
      setConnectionStatus("✅ Connected to Supabase")
      addLog("✅ Database connection successful")
    } catch (error: any) {
      setConnectionStatus(`❌ Connection failed: ${error.message}`)
      addLog(`❌ Database connection failed: ${error.message}`)
    }

    // Test 2: Check Current Auth Session
    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession()
      if (error) throw error

      if (session?.user) {
        setCurrentUser(session.user)
        setAuthStatus(`✅ Authenticated as: ${session.user.email}`)
        addLog(`✅ Found authenticated user: ${session.user.email}`)

        // Test 3: Check User Profile
        await checkUserProfile(session.user.id)
      } else {
        setAuthStatus("❌ Not authenticated")
        addLog("❌ No authenticated user found")
      }
    } catch (error: any) {
      setAuthStatus(`❌ Auth error: ${error.message}`)
      addLog(`❌ Auth check failed: ${error.message}`)
    }
  }

  const checkUserProfile = async (userId: string) => {
    try {
      addLog(`🔍 Checking user profile for: ${userId}`)
      const { data, error } = await supabase.from("users").select("*").eq("id", userId).single()

      if (error) {
        if (error.code === "PGRST116") {
          addLog("⚠️ User profile not found in database")
          setUserProfile("Profile not found - needs to be created")
        } else {
          throw error
        }
      } else {
        setUserProfile(data)
        addLog(`✅ User profile found: ${data.display_name}`)
      }
    } catch (error: any) {
      addLog(`❌ Profile check failed: ${error.message}`)
      setUserProfile(`Error: ${error.message}`)
    }
  }

  const createUserProfile = async () => {
    if (!currentUser) {
      addLog("❌ No current user to create profile for")
      return
    }

    try {
      addLog("🔨 Creating user profile...")

      const newUser = {
        id: currentUser.id,
        email: currentUser.email,
        display_name: currentUser.user_metadata?.display_name || currentUser.email?.split("@")[0] || "User",
        age: null,
        gender: null,
        location: "",
        languages: [],
        bio: "",
        photo_url: currentUser.user_metadata?.avatar_url,
        is_premium: false,
        coin_balance: 100,
        total_earnings: 0,
        rating: 5.0,
        total_ratings: 0,
        is_online: true,
        last_seen: new Date().toISOString(),
        call_rates: { video: 10, audio: 5, chat: 2 },
        stats: { total_calls: 0, total_minutes: 0, total_gifts: 0 },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      const { data, error } = await supabase.from("users").insert([newUser]).select().single()

      if (error) throw error

      // Add welcome transaction
      await supabase.from("transactions").insert([
        {
          user_id: currentUser.id,
          type: "purchased",
          amount: 100,
          description: "Welcome bonus",
          created_at: new Date().toISOString(),
        },
      ])

      setUserProfile(data)
      addLog(`✅ User profile created successfully: ${data.display_name}`)
    } catch (error: any) {
      addLog(`❌ Profile creation failed: ${error.message}`)
    }
  }

  const testLogin = async () => {
    const email = prompt("Enter your email:")
    const password = prompt("Enter your password:")

    if (!email || !password) return

    try {
      addLog(`🚀 Testing login for: ${email}`)

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      addLog(`✅ Login successful for: ${data.user?.email}`)

      // Refresh tests
      setTimeout(() => {
        runTests()
      }, 1000)
    } catch (error: any) {
      addLog(`❌ Login failed: ${error.message}`)
    }
  }

  const logout = async () => {
    try {
      addLog("🚪 Logging out...")
      await supabase.auth.signOut()
      addLog("✅ Logged out successfully")

      // Reset states
      setCurrentUser(null)
      setUserProfile(null)
      setAuthStatus("❌ Not authenticated")
    } catch (error: any) {
      addLog(`❌ Logout failed: ${error.message}`)
    }
  }

  const goToMainApp = () => {
    window.location.href = "/"
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card className="bg-black/40 border-purple-500/20 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-white">🔧 VoiceVibe Debug Panel</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <h3 className="text-white font-semibold">Database Connection</h3>
                <p className="text-sm text-gray-300">{connectionStatus}</p>
              </div>
              <div className="space-y-2">
                <h3 className="text-white font-semibold">Authentication</h3>
                <p className="text-sm text-gray-300">{authStatus}</p>
              </div>
              <div className="space-y-2">
                <h3 className="text-white font-semibold">User Profile</h3>
                <p className="text-sm text-gray-300">
                  {userProfile
                    ? typeof userProfile === "string"
                      ? userProfile
                      : `✅ ${userProfile.display_name}`
                    : "Not checked"}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button onClick={runTests} className="bg-blue-500 hover:bg-blue-600">
                🔄 Refresh Tests
              </Button>
              <Button onClick={testLogin} className="bg-green-500 hover:bg-green-600">
                🔑 Test Login
              </Button>
              {currentUser && !userProfile && (
                <Button onClick={createUserProfile} className="bg-yellow-500 hover:bg-yellow-600">
                  🔨 Create Profile
                </Button>
              )}
              {currentUser && (
                <Button onClick={logout} className="bg-red-500 hover:bg-red-600">
                  🚪 Logout
                </Button>
              )}
              {currentUser && userProfile && typeof userProfile === "object" && (
                <Button onClick={goToMainApp} className="bg-purple-500 hover:bg-purple-600">
                  🚀 Go to Main App
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Current User Info */}
        {currentUser && (
          <Card className="bg-black/40 border-purple-500/20 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-white">👤 Current User</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-sm text-gray-300 overflow-auto">{JSON.stringify(currentUser, null, 2)}</pre>
            </CardContent>
          </Card>
        )}

        {/* User Profile Info */}
        {userProfile && typeof userProfile === "object" && (
          <Card className="bg-black/40 border-purple-500/20 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-white">📋 User Profile</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-sm text-gray-300 overflow-auto">{JSON.stringify(userProfile, null, 2)}</pre>
            </CardContent>
          </Card>
        )}

        {/* Debug Logs */}
        <Card className="bg-black/40 border-purple-500/20 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-white">📝 Debug Logs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-black/60 p-4 rounded-lg max-h-64 overflow-y-auto">
              {logs.map((log, index) => (
                <div key={index} className="text-sm text-gray-300 font-mono">
                  {log}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
