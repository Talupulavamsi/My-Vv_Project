"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"

export default function AuthCallback() {
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession()

        if (error) {
          console.error("Auth callback error:", error)
          toast({
            title: "Authentication failed",
            description: error.message,
            variant: "destructive",
          })
          router.push("/auth/login")
          return
        }

        if (data.session) {
          toast({
            title: "Email confirmed! 🎉",
            description: "Your account has been activated successfully.",
          })
          router.push("/")
        } else {
          router.push("/auth/login")
        }
      } catch (error: any) {
        console.error("Unexpected error:", error)
        toast({
          title: "Something went wrong",
          description: "Please try signing in again.",
          variant: "destructive",
        })
        router.push("/auth/login")
      }
    }

    handleAuthCallback()
  }, [router, toast])

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="bg-black/40 backdrop-blur-xl rounded-3xl p-8 border border-purple-500/20 shadow-2xl text-center">
        <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <h1 className="text-2xl font-bold text-white mb-2">Confirming your account...</h1>
        <p className="text-gray-400">Please wait while we verify your email.</p>
      </div>
    </div>
  )
}
