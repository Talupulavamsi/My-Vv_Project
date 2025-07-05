"use client"

import { useState, useEffect } from "react"
import { supabase, isDemo, mockUsers, type User } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"

export function useSupabaseAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    if (isDemo) {
      // Demo mode - simulate loading
      setTimeout(() => {
        setLoading(false)
      }, 1000)
      return
    }

    // Real Supabase mode
    const getSession = async () => {
      try {
        if (!supabase) {
          throw new Error("Supabase not configured")
        }

        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (session?.user) {
          await fetchUserProfile(session.user.id)
        }
      } catch (error: any) {
        console.error("Error getting session:", error)
        setError(error.message)
      } finally {
        setLoading(false)
      }
    }

    getSession()

    // Listen for auth changes
    if (supabase) {
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(async (event, session) => {
        console.log("Auth state changed:", event, session?.user?.email)

        if (session?.user) {
          await fetchUserProfile(session.user.id)
        } else {
          setUser(null)
        }
        setLoading(false)
      })

      return () => subscription.unsubscribe()
    }
  }, [])

  const fetchUserProfile = async (userId: string) => {
    try {
      if (!supabase) return

      const { data, error } = await supabase.from("users").select("*").eq("id", userId).single()

      if (error) {
        if (error.code === "PGRST116") {
          console.log("User profile not found, might be a new user")
          return
        }
        throw error
      }

      setUser(data)
      await updateOnlineStatus(userId, true)
    } catch (error: any) {
      console.error("Error fetching user profile:", error)
      setError(error.message)
    }
  }

  const updateOnlineStatus = async (userId: string, isOnline: boolean) => {
    try {
      if (!supabase) return

      await supabase
        .from("users")
        .update({
          is_online: isOnline,
          last_seen: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId)
    } catch (error) {
      console.error("Error updating online status:", error)
    }
  }

  const signUp = async (email: string, password: string, userData: Partial<User>) => {
    try {
      setError(null)
      setLoading(true)

      if (isDemo) {
        // Demo mode - simulate signup
        await new Promise((resolve) => setTimeout(resolve, 1500))

        const demoUser: User = {
          id: `demo-${Date.now()}`,
          email,
          display_name: userData.display_name || "Demo User",
          age: userData.age,
          gender: userData.gender,
          location: userData.location,
          languages: userData.languages || [],
          bio: userData.bio || "",
          photo_url: userData.photo_url,
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

        // IMPORTANT: Set user first, then stop loading
        setUser(demoUser)
        setLoading(false)

        toast({
          title: "Welcome to VoiceVibe! 🎉",
          description: "Demo account created successfully! You got 100 welcome coins!",
        })

        return demoUser
      }

      // Real Supabase signup
      if (!supabase) {
        throw new Error("Supabase not configured. Please set up your environment variables.")
      }

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: userData.display_name,
          },
        },
      })

      if (authError) throw authError

      if (authData.user) {
        const newUser: Omit<User, "id"> = {
          email,
          display_name: userData.display_name || "User",
          age: userData.age,
          gender: userData.gender,
          location: userData.location,
          languages: userData.languages || [],
          bio: userData.bio || "",
          photo_url: userData.photo_url,
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

        const { error: profileError } = await supabase.from("users").upsert([{ ...newUser, id: authData.user.id }])

        if (profileError) {
          console.error("Profile creation error:", profileError)
        }

        await supabase.from("transactions").insert([
          {
            user_id: authData.user.id,
            type: "purchased",
            amount: 100,
            description: "Welcome bonus",
            created_at: new Date().toISOString(),
          },
        ])

        toast({
          title: "Welcome to VoiceVibe! 🎉",
          description: "Account created successfully! You got 100 welcome coins!",
        })

        await fetchUserProfile(authData.user.id)
      }

      return authData.user
    } catch (error: any) {
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

      if (isDemo) {
        // Demo mode - simulate signin
        await new Promise((resolve) => setTimeout(resolve, 1500))

        const demoUser = mockUsers[0]
        const loggedInUser = { ...demoUser, email }

        // IMPORTANT: Set user first, then stop loading
        setUser(loggedInUser)
        setLoading(false)

        toast({
          title: "Welcome back! 🚀",
          description: "Successfully signed in to VoiceVibe (Demo Mode)",
        })

        return loggedInUser
      }

      if (!supabase) {
        throw new Error("Supabase not configured. Please set up your environment variables.")
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      toast({
        title: "Welcome back! 🚀",
        description: "Successfully signed in to VoiceVibe",
      })

      return data.user
    } catch (error: any) {
      setError(error.message)
      toast({
        title: "Sign in failed",
        description: error.message,
        variant: "destructive",
      })
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signInWithGoogle = async () => {
    try {
      setError(null)
      setLoading(true)

      if (isDemo) {
        // Demo mode
        await new Promise((resolve) => setTimeout(resolve, 1500))

        const demoUser = mockUsers[0]
        setUser({ ...demoUser, email: "demo.google@example.com" })

        toast({
          title: "Welcome! 🚀",
          description: "Successfully signed in with Google (Demo Mode)",
        })

        return { user: { id: demoUser.id, email: "demo.google@example.com" } }
      }

      if (!supabase) {
        throw new Error("Supabase not configured. Please set up your environment variables.")
      }

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) throw error

      return data
    } catch (error: any) {
      setError(error.message)
      toast({
        title: "Google sign in failed",
        description: error.message,
        variant: "destructive",
      })
      throw error
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      if (isDemo) {
        setUser(null)
        toast({
          title: "Logged out",
          description: "You've been successfully logged out (Demo Mode)",
        })
        return
      }

      if (user && supabase) {
        await updateOnlineStatus(user.id, false)
      }

      if (supabase) {
        const { error } = await supabase.auth.signOut()
        if (error) throw error
      }

      setUser(null)
      toast({
        title: "Logged out",
        description: "You've been successfully logged out",
      })
    } catch (error: any) {
      setError(error.message)
      throw error
    }
  }

  const updateUserProfile = async (updates: Partial<User>) => {
    if (!user) return

    try {
      if (isDemo) {
        // Demo mode - simulate update
        setUser({ ...user, ...updates })
        toast({
          title: "Profile updated",
          description: "Your profile has been updated successfully (Demo Mode)",
        })
        return
      }

      if (!supabase) return

      const { error } = await supabase
        .from("users")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", user.id)

      if (error) throw error

      setUser({ ...user, ...updates })

      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully",
      })
    } catch (error: any) {
      setError(error.message)
      throw error
    }
  }

  const updateCoinBalance = async (
    amount: number,
    description: string,
    type: "earned" | "spent" | "purchased" | "withdrawn",
  ) => {
    if (!user) return

    try {
      const newBalance = user.coin_balance + amount

      if (isDemo) {
        // Demo mode - simulate update
        setUser({ ...user, coin_balance: newBalance })
        toast({
          title: amount > 0 ? "Coins added" : "Coins spent",
          description: `${Math.abs(amount)} coins ${amount > 0 ? "added to" : "deducted from"} your balance (Demo Mode)`,
        })
        return
      }

      if (!supabase) return

      const { error: userError } = await supabase
        .from("users")
        .update({
          coin_balance: newBalance,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id)

      if (userError) throw userError

      const { error: transactionError } = await supabase.from("transactions").insert([
        {
          user_id: user.id,
          type,
          amount: Math.abs(amount),
          description,
          created_at: new Date().toISOString(),
        },
      ])

      if (transactionError) throw transactionError

      setUser({ ...user, coin_balance: newBalance })

      toast({
        title: amount > 0 ? "Coins added" : "Coins spent",
        description: `${Math.abs(amount)} coins ${amount > 0 ? "added to" : "deducted from"} your balance`,
      })
    } catch (error: any) {
      setError(error.message)
      throw error
    }
  }

  return {
    user,
    loading,
    error,
    signUp,
    signIn,
    signInWithGoogle,
    logout,
    updateUserProfile,
    updateCoinBalance,
    isDemo,
  }
}
