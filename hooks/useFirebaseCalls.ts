"use client"

import { useState, useEffect } from "react"
import { getFirebaseServices } from "@/lib/firebase"
import type { CallSession, CallOffer, User, Gift } from "@/types/firebase"

export function useFirebaseCalls(currentUserId?: string) {
  const [callOffers, setCallOffers] = useState<CallOffer[]>([])
  const [activeCalls, setActiveCalls] = useState<CallSession[]>([])
  const [callHistory, setCallHistory] = useState<CallSession[]>([])
  const [loading, setLoading] = useState(true)

  // Listen to incoming call offers
  useEffect(() => {
    if (!currentUserId) {
      setLoading(false)
      return
    }

    let unsubscribe: (() => void) | null = null

    const setupCallOffersListener = async () => {
      try {
        const services = await getFirebaseServices()
        if (!services.db) {
          setLoading(false)
          return
        }

        const { collection, query, where, orderBy, onSnapshot } = await import("firebase/firestore")

        const offersQuery = query(
          collection(services.db, "callOffers"),
          where("receiverId", "==", currentUserId),
          where("status", "==", "pending"),
          orderBy("timestamp", "desc"),
        )

        unsubscribe = onSnapshot(offersQuery, (snapshot) => {
          const offerData = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            timestamp: doc.data().timestamp?.toDate(),
            expiresAt: doc.data().expiresAt?.toDate(),
          })) as CallOffer[]

          setCallOffers(offerData)
        })
      } catch (error) {
        console.error("Error setting up call offers listener:", error)
        setLoading(false)
      }
    }

    setupCallOffersListener()

    return () => {
      if (unsubscribe) unsubscribe()
    }
  }, [currentUserId])

  // Listen to active calls
  useEffect(() => {
    if (!currentUserId) return

    let unsubscribe: (() => void) | null = null

    const setupActiveCallsListener = async () => {
      try {
        const services = await getFirebaseServices()
        if (!services.db) return

        const { collection, query, where, orderBy, onSnapshot } = await import("firebase/firestore")

        const callsQuery = query(
          collection(services.db, "callSessions"),
          where("participants", "array-contains", currentUserId),
          where("status", "in", ["connecting", "active"]),
          orderBy("startTime", "desc"),
        )

        unsubscribe = onSnapshot(callsQuery, (snapshot) => {
          const callData = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            startTime: doc.data().startTime?.toDate(),
            endTime: doc.data().endTime?.toDate(),
            createdAt: doc.data().createdAt?.toDate(),
            updatedAt: doc.data().updatedAt?.toDate(),
          })) as CallSession[]

          setActiveCalls(callData)
          setLoading(false)
        })
      } catch (error) {
        console.error("Error setting up active calls listener:", error)
        setLoading(false)
      }
    }

    setupActiveCallsListener()

    return () => {
      if (unsubscribe) unsubscribe()
    }
  }, [currentUserId])

  // Listen to call history
  useEffect(() => {
    if (!currentUserId) return

    let unsubscribe: (() => void) | null = null

    const setupCallHistoryListener = async () => {
      try {
        const services = await getFirebaseServices()
        if (!services.db) return

        const { collection, query, where, orderBy, limit, onSnapshot } = await import("firebase/firestore")

        const historyQuery = query(
          collection(services.db, "callSessions"),
          where("participants", "array-contains", currentUserId),
          where("status", "==", "ended"),
          orderBy("startTime", "desc"),
          limit(50),
        )

        unsubscribe = onSnapshot(historyQuery, (snapshot) => {
          const historyData = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            startTime: doc.data().startTime?.toDate(),
            endTime: doc.data().endTime?.toDate(),
            createdAt: doc.data().createdAt?.toDate(),
            updatedAt: doc.data().updatedAt?.toDate(),
          })) as CallSession[]

          setCallHistory(historyData)
        })
      } catch (error) {
        console.error("Error setting up call history listener:", error)
      }
    }

    setupCallHistoryListener()

    return () => {
      if (unsubscribe) unsubscribe()
    }
  }, [currentUserId])

  const initiateCall = async (receiverId: string, type: "video" | "audio", sdpOffer?: string): Promise<string> => {
    if (!currentUserId) throw new Error("User not authenticated")

    try {
      const services = await getFirebaseServices()
      if (!services.db) throw new Error("Firebase not initialized")

      const { doc, getDoc, addDoc, collection, updateDoc, serverTimestamp } = await import("firebase/firestore")

      // Get caller and receiver data
      const [callerDoc, receiverDoc] = await Promise.all([
        getDoc(doc(services.db, "users", currentUserId)),
        getDoc(doc(services.db, "users", receiverId)),
      ])

      const callerData = callerDoc.data() as User
      const receiverData = receiverDoc.data() as User

      // Check if caller has enough coins
      const callRate = receiverData.callRates[type]
      if (callerData.coinBalance < callRate) {
        throw new Error("Insufficient coins for this call")
      }

      // Create call offer
      const offerData: Omit<CallOffer, "id"> = {
        callerId: currentUserId,
        callerName: callerData.displayName,
        callerPhoto: callerData.photoURL,
        receiverId,
        type,
        status: "pending",
        timestamp: new Date(),
        expiresAt: new Date(Date.now() + 30000), // 30 seconds
        callRate,
        sdpOffer,
      }

      const offerRef = await addDoc(collection(services.db, "callOffers"), {
        ...offerData,
        timestamp: serverTimestamp(),
        expiresAt: new Date(Date.now() + 30000),
      })

      // Auto-expire offer after 30 seconds
      setTimeout(async () => {
        try {
          const offerDoc = await getDoc(offerRef)
          if (offerDoc.exists() && offerDoc.data().status === "pending") {
            await updateDoc(offerRef, {
              status: "expired",
            })
          }
        } catch (error) {
          console.error("Error expiring call offer:", error)
        }
      }, 30000)

      return offerRef.id
    } catch (error) {
      console.error("Error initiating call:", error)
      throw error
    }
  }

  const acceptCall = async (offerId: string, sdpAnswer?: string): Promise<string> => {
    if (!currentUserId) throw new Error("User not authenticated")

    try {
      const services = await getFirebaseServices()
      if (!services.db) throw new Error("Firebase not initialized")

      const { doc, getDoc, updateDoc, addDoc, collection, serverTimestamp } = await import("firebase/firestore")

      const offerDoc = await getDoc(doc(services.db, "callOffers", offerId))
      if (!offerDoc.exists()) {
        throw new Error("Call offer not found")
      }

      const offerData = offerDoc.data() as CallOffer

      // Update offer status
      await updateDoc(doc(services.db, "callOffers", offerId), {
        status: "accepted",
      })

      // Get participant data
      const [callerDoc, receiverDoc] = await Promise.all([
        getDoc(doc(services.db, "users", offerData.callerId)),
        getDoc(doc(services.db, "users", offerData.receiverId)),
      ])

      const callerData = callerDoc.data() as User
      const receiverData = receiverDoc.data() as User

      // Create call session
      const sessionData: Omit<CallSession, "id"> = {
        participants: [offerData.callerId, offerData.receiverId],
        participantNames: {
          [offerData.callerId]: callerData.displayName,
          [offerData.receiverId]: receiverData.displayName,
        },
        participantPhotos: {
          [offerData.callerId]: callerData.photoURL || "",
          [offerData.receiverId]: receiverData.photoURL || "",
        },
        callerId: offerData.callerId,
        receiverId: offerData.receiverId,
        type: offerData.type,
        status: "connecting",
        startTime: new Date(),
        duration: 0,
        cost: 0,
        callRate: offerData.callRate,
        isPremium: callerData.isPremium || receiverData.isPremium,
        quality: "HD",
        gifts: [],
        callStats: {
          totalMinutes: 0,
          coinsSpent: 0,
          coinsEarned: 0,
          giftsExchanged: 0,
        },
        connectionData: {
          sdpOffer: offerData.sdpOffer,
          sdpAnswer,
          iceCandidates: [],
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const sessionRef = await addDoc(collection(services.db, "callSessions"), {
        ...sessionData,
        startTime: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })

      return sessionRef.id
    } catch (error) {
      console.error("Error accepting call:", error)
      throw error
    }
  }

  const declineCall = async (offerId: string) => {
    try {
      const services = await getFirebaseServices()
      if (!services.db) return

      const { doc, updateDoc } = await import("firebase/firestore")

      await updateDoc(doc(services.db, "callOffers", offerId), {
        status: "declined",
      })
    } catch (error) {
      console.error("Error declining call:", error)
      throw error
    }
  }

  const startCall = async (sessionId: string) => {
    try {
      const services = await getFirebaseServices()
      if (!services.db) return

      const { doc, updateDoc, serverTimestamp } = await import("firebase/firestore")

      await updateDoc(doc(services.db, "callSessions", sessionId), {
        status: "active",
        updatedAt: serverTimestamp(),
      })
    } catch (error) {
      console.error("Error starting call:", error)
      throw error
    }
  }

  const endCall = async (sessionId: string, endReason: CallSession["endReason"] = "normal") => {
    if (!currentUserId) return

    try {
      const services = await getFirebaseServices()
      if (!services.db) return

      const { doc, getDoc, updateDoc, serverTimestamp, increment } = await import("firebase/firestore")

      const sessionDoc = await getDoc(doc(services.db, "callSessions", sessionId))
      if (!sessionDoc.exists()) return

      const sessionData = sessionDoc.data() as CallSession
      const endTime = new Date()
      const duration = Math.floor((endTime.getTime() - sessionData.startTime.getTime()) / 1000)
      const cost = Math.ceil(duration / 60) * sessionData.callRate

      // Update call session
      await updateDoc(doc(services.db, "callSessions", sessionId), {
        status: "ended",
        endTime: serverTimestamp(),
        duration,
        cost,
        endReason,
        "callStats.totalMinutes": Math.ceil(duration / 60),
        "callStats.coinsSpent": sessionData.callerId === currentUserId ? cost : 0,
        "callStats.coinsEarned": sessionData.receiverId === currentUserId ? cost : 0,
        updatedAt: serverTimestamp(),
      })

      // Handle payment if call duration > 0
      if (duration > 0 && cost > 0) {
        await handleCallPayment(sessionData.callerId, sessionData.receiverId, cost, sessionId)
      }

      // Update user stats
      await Promise.all([
        updateDoc(doc(services.db, "users", sessionData.callerId), {
          "stats.totalCallsMade": increment(1),
          "stats.totalMinutesOnCalls": increment(Math.ceil(duration / 60)),
          updatedAt: serverTimestamp(),
        }),
        updateDoc(doc(services.db, "users", sessionData.receiverId), {
          "stats.totalCallsReceived": increment(1),
          "stats.totalMinutesOnCalls": increment(Math.ceil(duration / 60)),
          updatedAt: serverTimestamp(),
        }),
      ])
    } catch (error) {
      console.error("Error ending call:", error)
      throw error
    }
  }

  const handleCallPayment = async (callerId: string, receiverId: string, cost: number, sessionId: string) => {
    try {
      const services = await getFirebaseServices()
      if (!services.db) return

      const { doc, getDoc, updateDoc, addDoc, collection, serverTimestamp, increment } = await import(
        "firebase/firestore"
      )

      // Get user data
      const [callerDoc, receiverDoc] = await Promise.all([
        getDoc(doc(services.db, "users", callerId)),
        getDoc(doc(services.db, "users", receiverId)),
      ])

      const callerData = callerDoc.data() as User
      const receiverData = receiverDoc.data() as User

      // Calculate earnings (70% to receiver, 30% platform fee)
      const receiverEarnings = Math.floor(cost * 0.7)
      const platformFee = cost - receiverEarnings

      // Update balances
      const callerNewBalance = Math.max(0, callerData.coinBalance - cost)
      const receiverNewBalance = receiverData.coinBalance + receiverEarnings

      await Promise.all([
        // Update caller balance
        updateDoc(doc(services.db, "users", callerId), {
          coinBalance: callerNewBalance,
          updatedAt: serverTimestamp(),
        }),
        // Update receiver balance and earnings
        updateDoc(doc(services.db, "users", receiverId), {
          coinBalance: receiverNewBalance,
          totalEarnings: increment(receiverEarnings),
          "earnings.today": increment(receiverEarnings),
          "earnings.thisWeek": increment(receiverEarnings),
          "earnings.thisMonth": increment(receiverEarnings),
          "earnings.total": increment(receiverEarnings),
          updatedAt: serverTimestamp(),
        }),
      ])

      // Add transactions
      await Promise.all([
        // Caller payment
        addDoc(collection(services.db, "coinTransactions"), {
          userId: callerId,
          amount: cost,
          type: "subtract",
          reason: "call_payment",
          balanceBefore: callerData.coinBalance,
          balanceAfter: callerNewBalance,
          relatedId: sessionId,
          timestamp: serverTimestamp(),
        }),
        // Receiver earnings
        addDoc(collection(services.db, "coinTransactions"), {
          userId: receiverId,
          amount: receiverEarnings,
          type: "add",
          reason: "call_earning",
          balanceBefore: receiverData.coinBalance,
          balanceAfter: receiverNewBalance,
          relatedId: sessionId,
          timestamp: serverTimestamp(),
        }),
        // Earnings record
        addDoc(collection(services.db, "earnings"), {
          userId: receiverId,
          amount: receiverEarnings,
          source: "call",
          sourceId: sessionId,
          timestamp: serverTimestamp(),
        }),
      ])
    } catch (error) {
      console.error("Error handling call payment:", error)
    }
  }

  const sendGiftInCall = async (sessionId: string, receiverId: string, gift: Gift) => {
    if (!currentUserId) return

    try {
      const services = await getFirebaseServices()
      if (!services.db) return

      const { doc, getDoc, updateDoc, addDoc, collection, serverTimestamp, increment } = await import(
        "firebase/firestore"
      )

      // Get user data
      const [senderDoc, receiverDoc] = await Promise.all([
        getDoc(doc(services.db, "users", currentUserId)),
        getDoc(doc(services.db, "users", receiverId)),
      ])

      const senderData = senderDoc.data() as User
      const receiverData = receiverDoc.data() as User

      // Check if sender has enough coins
      if (senderData.coinBalance < gift.value) {
        throw new Error("Insufficient coins")
      }

      // Update balances
      const senderNewBalance = senderData.coinBalance - gift.value
      const receiverNewBalance = receiverData.coinBalance + gift.value

      await Promise.all([
        updateDoc(doc(services.db, "users", currentUserId), {
          coinBalance: senderNewBalance,
          "stats.totalGiftsSent": increment(1),
          updatedAt: serverTimestamp(),
        }),
        updateDoc(doc(services.db, "users", receiverId), {
          coinBalance: receiverNewBalance,
          "stats.totalGiftsReceived": increment(1),
          totalEarnings: increment(gift.value),
          "earnings.today": increment(gift.value),
          "earnings.thisWeek": increment(gift.value),
          "earnings.thisMonth": increment(gift.value),
          "earnings.total": increment(gift.value),
          updatedAt: serverTimestamp(),
        }),
      ])

      // Update call session with gift
      const sessionRef = doc(services.db, "callSessions", sessionId)
      const sessionDoc = await getDoc(sessionRef)

      if (sessionDoc.exists()) {
        const sessionData = sessionDoc.data() as CallSession
        const updatedGifts = [...sessionData.gifts, gift]

        await updateDoc(sessionRef, {
          gifts: updatedGifts,
          "callStats.giftsExchanged": increment(1),
          updatedAt: serverTimestamp(),
        })
      }

      // Add gift transaction
      await addDoc(collection(services.db, "giftTransactions"), {
        senderId: currentUserId,
        senderName: senderData.displayName,
        receiverId,
        receiverName: receiverData.displayName,
        giftName: gift.name,
        giftValue: gift.value,
        callSessionId: sessionId,
        timestamp: serverTimestamp(),
      })

      // Add coin transactions
      await Promise.all([
        addDoc(collection(services.db, "coinTransactions"), {
          userId: currentUserId,
          amount: gift.value,
          type: "subtract",
          reason: "gift_sent",
          balanceBefore: senderData.coinBalance,
          balanceAfter: senderNewBalance,
          relatedId: sessionId,
          timestamp: serverTimestamp(),
        }),
        addDoc(collection(services.db, "coinTransactions"), {
          userId: receiverId,
          amount: gift.value,
          type: "add",
          reason: "gift_received",
          balanceBefore: receiverData.coinBalance,
          balanceAfter: receiverNewBalance,
          relatedId: sessionId,
          timestamp: serverTimestamp(),
        }),
      ])
    } catch (error) {
      console.error("Error sending gift in call:", error)
      throw error
    }
  }

  const rateCall = async (sessionId: string, rating: number, feedback?: string) => {
    try {
      const services = await getFirebaseServices()
      if (!services.db) return

      const { doc, updateDoc, getDoc, serverTimestamp } = await import("firebase/firestore")

      await updateDoc(doc(services.db, "callSessions", sessionId), {
        rating,
        feedback,
        updatedAt: serverTimestamp(),
      })

      // Update receiver's rating
      const sessionDoc = await getDoc(doc(services.db, "callSessions", sessionId))
      if (sessionDoc.exists()) {
        const sessionData = sessionDoc.data() as CallSession
        const receiverId = sessionData.receiverId

        const receiverDoc = await getDoc(doc(services.db, "users", receiverId))
        if (receiverDoc.exists()) {
          const receiverData = receiverDoc.data() as User
          const newTotalRatings = receiverData.totalRatings + 1
          const newRating = (receiverData.rating * receiverData.totalRatings + rating) / newTotalRatings

          await updateDoc(doc(services.db, "users", receiverId), {
            rating: newRating,
            totalRatings: newTotalRatings,
            "stats.averageRating": newRating,
            updatedAt: serverTimestamp(),
          })
        }
      }
    } catch (error) {
      console.error("Error rating call:", error)
      throw error
    }
  }

  const updateConnectionData = async (sessionId: string, connectionData: Partial<CallSession["connectionData"]>) => {
    try {
      const services = await getFirebaseServices()
      if (!services.db) return

      const { doc, updateDoc, serverTimestamp } = await import("firebase/firestore")

      const updates: any = {}

      if (connectionData.sdpOffer) {
        updates["connectionData.sdpOffer"] = connectionData.sdpOffer
      }
      if (connectionData.sdpAnswer) {
        updates["connectionData.sdpAnswer"] = connectionData.sdpAnswer
      }
      if (connectionData.iceCandidates) {
        updates["connectionData.iceCandidates"] = connectionData.iceCandidates
      }

      updates.updatedAt = serverTimestamp()

      await updateDoc(doc(services.db, "callSessions", sessionId), updates)
    } catch (error) {
      console.error("Error updating connection data:", error)
      throw error
    }
  }

  return {
    callOffers,
    activeCalls,
    callHistory,
    loading,
    initiateCall,
    acceptCall,
    declineCall,
    startCall,
    endCall,
    sendGiftInCall,
    rateCall,
    updateConnectionData,
  }
}
