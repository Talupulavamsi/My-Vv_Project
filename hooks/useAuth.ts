"use client"

import { useState, useEffect } from "react"
import { supabase, type User } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    // Get initial session
    const getSession = async () => {
      try {
        console.log("🔍 Checking initial session...")
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (session?.user) {
          console.log("✅ Found existing session for:", session.user.email)
          await fetchUserProfile(session.user.id)
        } else {
          console.log("❌ No existing session found")
        }
      } catch (error: any) {
        console.error("❌ Error getting session:", error)
        setError(error.message)
      } finally {
        setLoading(false)
      }
    }

    getSession()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("🔄 Auth state changed:", event, session?.user?.email)

      if (session?.user) {
        console.log("✅ User authenticated, fetching profile...")
        await fetchUserProfile(session.user.id)
      } else {
        console.log("❌ User logged out")
        setUser(null)
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const fetchUserProfile = async (userId: string) => {
    try {
      console.log("🔍 Fetching user profile for:", userId)

      const { data, error } = await supabase.from("users").select("*").eq("id", userId).single()

      if (error) {
        console.error("❌ Error fetching profile:", error)

        if (error.code === "PGRST116") {
          console.log("⚠️ User profile not found, creating new profile...")
          await createUserProfile(userId)
          return
        }
        throw error
      }

      console.log("✅ User profile fetched successfully:", data.display_name)
      setUser(data)
    } catch (error: any) {
      console.error("❌ Error in fetchUserProfile:", error)
      setError(error.message)
    }
  }

  const createUserProfile = async (userId: string) => {
    try {
      console.log("🔨 Creating user profile for:", userId)

      // Get user info from auth
      const { data: authUser } = await supabase.auth.getUser()

      if (!authUser.user) {
        throw new Error("No authenticated user found")
      }

      const newUser: Omit<User, "id"> = {
        email: authUser.user.email || "",
        display_name: authUser.user.user_metadata?.display_name || authUser.user.email?.split("@")[0] || "User",
        age: undefined,
        gender: undefined,
        location: "",
        languages: [],
        bio: "",
        photo_url: authUser.user.user_metadata?.avatar_url,
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

      const { data, error } = await supabase
        .from("users")
        .insert([{ ...newUser, id: userId }])
        .select()
        .single()

      if (error) {
        console.error("❌ Error creating profile:", error)
        throw error
      }

      // Add welcome transaction
      await supabase.from("transactions").insert([
        {
          user_id: userId,
          type: "purchased",
          amount: 100,
          description: "Welcome bonus",
          created_at: new Date().toISOString(),
        },
      ])

      console.log("✅ User profile created successfully:", data.display_name)
      setUser(data)

      toast({
        title: "Profile created! 🎉",
        description: "Welcome to VoiceVibe! You got 100 welcome coins!",
      })
    } catch (error: any) {
      console.error("❌ Error creating user profile:", error)
      setError(error.message)
    }
  }

  const signUp = async (email: string, password: string, userData: Partial<User>) => {
    try {
      setError(null)
      setLoading(true)
      console.log("🚀 Starting signup for:", email)

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: userData.display_name,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (authError) {
        console.error("❌ Signup error:", authError)
        throw authError
      }

      if (authData.user) {
        console.log("✅ User signed up:", authData.user.email)

        // Check if email confirmation is required
        if (!authData.session) {
          console.log("📧 Email confirmation required")
          toast({
            title: "Check your email! 📧",
            description:
              "We've sent you a confirmation link. Please check your email and click the link to activate your account.",
          })
          return authData.user
        }

        // If we have a session, create the profile
        await createUserProfile(authData.user.id)
      }

      return authData.user
    } catch (error: any) {
      console.error("❌ Signup failed:", error)
      setError(error.message)
      toast({
        title: "Sign up failed",
        description: error.message,
        variant: "destructive",
      })
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      setError(null)
      setLoading(true)
      console.log("🚀 Starting signin for:", email)

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.error("❌ Signin error:", error)

        // Handle specific error cases
        if (error.message.includes("Email not confirmed")) {
          toast({
            title: "Email not confirmed",
            description: "Please check your email and click the confirmation link before signing in.",
            variant: "destructive",
          })
        } else if (error.message.includes("Invalid login credentials")) {
          toast({
            title: "Invalid credentials",
            description: "Please check your email and password and try again.",
            variant: "destructive",
          })
        } else {
          toast({
            title: "Sign in failed",
            description: error.message,
            variant: "destructive",
          })
        }
        throw error
      }

      console.log("✅ User signed in successfully:", data.user?.email)

      // The auth state change listener will handle fetching the profile
      toast({
        title: "Welcome back! 🚀",
        description: "Successfully signed in to VoiceVibe",
      })

      return data.user
    } catch (error: any) {
      console.error("❌ Signin failed:", error)
      setError(error.message)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      console.log("🚪 Logging out user...")
      const { error } = await supabase.auth.signOut()
      if (error) throw error

      setUser(null)
      console.log("✅ User logged out successfully")

      toast({
        title: "Logged out",
        description: "You've been successfully logged out",
      })
    } catch (error: any) {
      console.error("❌ Logout error:", error)
      setError(error.message)
      throw error
    }
  }

  const updateUserProfile = async (updates: Partial<User>) => {
    if (!user) return

    try {
      console.log("🔄 Updating user profile...")

      const { error } = await supabase
        .from("users")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", user.id)

      if (error) throw error

      setUser({ ...user, ...updates })
      console.log("✅ Profile updated successfully")

      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully",
      })
    } catch (error: any) {
      console.error("❌ Profile update error:", error)
      setError(error.message)
      throw error
    }
  }

  // Debug info
  console.log("🔍 Auth State:", {
    hasUser: !!user,
    userEmail: user?.email,
    loading,
    error,
  })

  return {
    user,
    loading,
    error,
    signUp,
    signIn,
    logout,
    updateUserProfile,
  }
}
