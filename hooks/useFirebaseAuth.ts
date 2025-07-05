"use client"

import { useState, useEffect } from "react"
import { getFirebaseServices } from "@/lib/firebase"
import type { User } from "@/types/firebase"

export function useFirebaseAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [firebaseReady, setFirebaseReady] = useState(false)

  // Initialize Firebase on component mount
  useEffect(() => {
    let mounted = true

    const initFirebase = async () => {
      try {
        const services = await getFirebaseServices()

        if (!mounted) return

        if (services.auth && services.db) {
          setFirebaseReady(true)

          // Set up auth state listener
          const { onAuthStateChanged } = await import("firebase/auth")

          const unsubscribe = onAuthStateChanged(services.auth, async (firebaseUser) => {
            if (!mounted) return

            if (firebaseUser) {
              const userData = await getUserData(firebaseUser.uid)
              if (userData && mounted) {
                setUser(userData)
                // Set user online status
                await setUserOnlineStatus(firebaseUser.uid, true)
              }
            } else {
              if (mounted) setUser(null)
            }
            if (mounted) setLoading(false)
          })

          return () => {
            unsubscribe()
          }
        } else {
          if (mounted) setLoading(false)
        }
      } catch (error) {
        console.error("Error initializing Firebase:", error)
        if (mounted) {
          setError("Failed to initialize Firebase")
          setLoading(false)
        }
      }
    }

    initFirebase()

    return () => {
      mounted = false
    }
  }, [])

  const getUserData = async (uid: string): Promise<User | null> => {
    try {
      const services = await getFirebaseServices()
      if (!services.db) return null

      const { doc, getDoc } = await import("firebase/firestore")
      const userDoc = await getDoc(doc(services.db, "users", uid))

      if (userDoc.exists()) {
        const data = userDoc.data()
        return {
          ...data,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
          lastSeen: data.lastSeen?.toDate(),
        } as User
      }
      return null
    } catch (error) {
      console.error("Error getting user data:", error)
      return null
    }
  }

  const setUserOnlineStatus = async (uid: string, isOnline: boolean) => {
    try {
      const services = await getFirebaseServices()
      if (!services.rtdb || !services.db) return

      const { ref, set, onDisconnect } = await import("firebase/database")
      const { doc, updateDoc, serverTimestamp } = await import("firebase/firestore")

      const userStatusRef = ref(services.rtdb, `presence/${uid}`)
      const userDocRef = doc(services.db, "users", uid)

      if (isOnline) {
        await set(userStatusRef, {
          isOnline: true,
          lastSeen: serverTimestamp(),
        })

        // Set up disconnect handler
        onDisconnect(userStatusRef).set({
          isOnline: false,
          lastSeen: serverTimestamp(),
        })

        // Update Firestore
        await updateDoc(userDocRef, {
          isOnline: true,
          lastSeen: serverTimestamp(),
        })
      } else {
        await set(userStatusRef, {
          isOnline: false,
          lastSeen: serverTimestamp(),
        })

        await updateDoc(userDocRef, {
          isOnline: false,
          lastSeen: serverTimestamp(),
        })
      }
    } catch (error) {
      console.error("Error setting user status:", error)
    }
  }

  const signUp = async (email: string, password: string, displayName: string, additionalData?: Partial<User>) => {
    try {
      setError(null)
      setLoading(true)

      const services = await getFirebaseServices()
      if (!services.auth || !services.db) throw new Error("Firebase not initialized")

      const { createUserWithEmailAndPassword, updateProfile } = await import("firebase/auth")
      const { doc, setDoc, serverTimestamp, collection } = await import("firebase/firestore")

      const userCredential = await createUserWithEmailAndPassword(services.auth, email, password)
      const firebaseUser = userCredential.user

      // Update profile
      await updateProfile(firebaseUser, { displayName })

      // Create user document
      const userData: User = {
        uid: firebaseUser.uid,
        email: firebaseUser.email!,
        displayName,
        photoURL: firebaseUser.photoURL || undefined,
        isPremium: false,
        coinBalance: 100, // Welcome bonus
        totalEarnings: 0,
        rating: 5.0,
        totalRatings: 0,
        isOnline: true,
        lastSeen: new Date(),
        callRates: {
          video: 10,
          audio: 5,
          chat: 2,
        },
        earnings: {
          today: 0,
          thisWeek: 0,
          thisMonth: 0,
          total: 0,
        },
        stats: {
          totalMinutesOnCalls: 0,
          totalCallsReceived: 0,
          totalCallsMade: 0,
          totalGiftsSent: 0,
          totalGiftsReceived: 0,
          averageCallDuration: 0,
          averageRating: 5.0,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        ...additionalData,
      }

      await setDoc(doc(services.db, "users", firebaseUser.uid), {
        ...userData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastSeen: serverTimestamp(),
      })

      // Add welcome coin transaction
      await addCoinTransaction(firebaseUser.uid, 100, "add", "Welcome bonus", 0, 100)

      setUser(userData)
      return firebaseUser
    } catch (error: any) {
      setError(error.message)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      setError(null)
      setLoading(true)

      const services = await getFirebaseServices()
      if (!services.auth) throw new Error("Firebase not initialized")

      const { signInWithEmailAndPassword } = await import("firebase/auth")
      const userCredential = await signInWithEmailAndPassword(services.auth, email, password)
      return userCredential.user
    } catch (error: any) {
      setError(error.message)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signInWithGoogle = async () => {
    try {
      setError(null)
      setLoading(true)

      const services = await getFirebaseServices()
      if (!services.auth || !services.googleProvider || !services.db) throw new Error("Firebase not initialized")

      const { signInWithPopup } = await import("firebase/auth")
      const { doc, setDoc, serverTimestamp, collection } = await import("firebase/firestore")

      const result = await signInWithPopup(services.auth, services.googleProvider)
      const firebaseUser = result.user

      // Check if user exists
      const existingUser = await getUserData(firebaseUser.uid)

      if (!existingUser) {
        // Create new user document
        const userData: User = {
          uid: firebaseUser.uid,
          email: firebaseUser.email!,
          displayName: firebaseUser.displayName || "User",
          photoURL: firebaseUser.photoURL || undefined,
          isPremium: false,
          coinBalance: 100,
          totalEarnings: 0,
          rating: 5.0,
          totalRatings: 0,
          isOnline: true,
          lastSeen: new Date(),
          callRates: {
            video: 10,
            audio: 5,
            chat: 2,
          },
          earnings: {
            today: 0,
            thisWeek: 0,
            thisMonth: 0,
            total: 0,
          },
          stats: {
            totalMinutesOnCalls: 0,
            totalCallsReceived: 0,
            totalCallsMade: 0,
            totalGiftsSent: 0,
            totalGiftsReceived: 0,
            averageCallDuration: 0,
            averageRating: 5.0,
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        }

        await setDoc(doc(services.db, "users", firebaseUser.uid), {
          ...userData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          lastSeen: serverTimestamp(),
        })

        await addCoinTransaction(firebaseUser.uid, 100, "add", "Welcome bonus", 0, 100)
        setUser(userData)
      }

      return firebaseUser
    } catch (error: any) {
      setError(error.message)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      const services = await getFirebaseServices()
      if (!services.auth) return

      const { signOut } = await import("firebase/auth")

      if (user) {
        await setUserOnlineStatus(user.uid, false)
      }
      await signOut(services.auth)
      setUser(null)
    } catch (error: any) {
      setError(error.message)
      throw error
    }
  }

  const updateUserProfile = async (updates: Partial<User>) => {
    if (!user) return

    try {
      const services = await getFirebaseServices()
      if (!services.db) return

      const { doc, updateDoc, serverTimestamp } = await import("firebase/firestore")

      const userDocRef = doc(services.db, "users", user.uid)
      await updateDoc(userDocRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      })

      setUser({ ...user, ...updates, updatedAt: new Date() })
    } catch (error) {
      console.error("Error updating user profile:", error)
      throw error
    }
  }

  const addCoinTransaction = async (
    userId: string,
    amount: number,
    type: "add" | "subtract",
    reason: string,
    balanceBefore: number,
    balanceAfter: number,
    relatedId?: string,
  ) => {
    try {
      const services = await getFirebaseServices()
      if (!services.db) return

      const { doc, setDoc, serverTimestamp, collection } = await import("firebase/firestore")

      const transactionData = {
        userId,
        amount,
        type,
        reason,
        balanceBefore,
        balanceAfter,
        relatedId,
        timestamp: serverTimestamp(),
      }

      await setDoc(doc(collection(services.db, "coinTransactions")), transactionData)
    } catch (error) {
      console.error("Error adding coin transaction:", error)
    }
  }

  const updateCoinBalance = async (amount: number, reason: string, relatedId?: string) => {
    if (!user) return

    try {
      const services = await getFirebaseServices()
      if (!services.db) return

      const { doc, updateDoc, serverTimestamp } = await import("firebase/firestore")

      const newBalance = user.coinBalance + amount
      const transactionType = amount > 0 ? "add" : "subtract"

      await updateDoc(doc(services.db, "users", user.uid), {
        coinBalance: newBalance,
        updatedAt: serverTimestamp(),
      })

      await addCoinTransaction(
        user.uid,
        Math.abs(amount),
        transactionType,
        reason,
        user.coinBalance,
        newBalance,
        relatedId,
      )

      setUser({ ...user, coinBalance: newBalance })
    } catch (error) {
      console.error("Error updating coin balance:", error)
      throw error
    }
  }

  return {
    user,
    loading,
    error,
    firebaseReady,
    signUp,
    signIn,
    signInWithGoogle,
    logout,
    updateUserProfile,
    updateCoinBalance,
  }
}
