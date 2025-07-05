"use client"

import { useState, useEffect } from "react"
import { getFirebaseServices } from "@/lib/firebase"
import type { Conversation, Message, User } from "@/types/firebase"

export function useFirebaseChat(currentUserId?: string) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [messages, setMessages] = useState<{ [conversationId: string]: Message[] }>({})
  const [onlineUsers, setOnlineUsers] = useState<{ [uid: string]: boolean }>({})
  const [typingUsers, setTypingUsers] = useState<{ [conversationId: string]: string[] }>({})
  const [loading, setLoading] = useState(true)

  // Listen to conversations
  useEffect(() => {
    if (!currentUserId) {
      setLoading(false)
      return
    }

    let unsubscribe: (() => void) | null = null

    const setupConversationListener = async () => {
      try {
        const services = await getFirebaseServices()
        if (!services.db) {
          setLoading(false)
          return
        }

        const { collection, query, where, orderBy, onSnapshot } = await import("firebase/firestore")

        const conversationsQuery = query(
          collection(services.db, "conversations"),
          where("participants", "array-contains", currentUserId),
          orderBy("lastMessageTime", "desc"),
        )

        unsubscribe = onSnapshot(conversationsQuery, (snapshot) => {
          const conversationData = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            lastMessageTime: doc.data().lastMessageTime?.toDate(),
            createdAt: doc.data().createdAt?.toDate(),
            updatedAt: doc.data().updatedAt?.toDate(),
          })) as Conversation[]

          setConversations(conversationData)
          setLoading(false)
        })
      } catch (error) {
        console.error("Error setting up conversation listener:", error)
        setLoading(false)
      }
    }

    setupConversationListener()

    return () => {
      if (unsubscribe) unsubscribe()
    }
  }, [currentUserId])

  // Listen to online users
  useEffect(() => {
    let unsubscribe: (() => void) | null = null

    const setupPresenceListener = async () => {
      try {
        const services = await getFirebaseServices()
        if (!services.rtdb) return

        const { ref, onValue, off } = await import("firebase/database")

        const presenceRef = ref(services.rtdb, "presence")

        const listener = onValue(presenceRef, (snapshot) => {
          const presenceData = snapshot.val() || {}
          const onlineStatus: { [uid: string]: boolean } = {}

          Object.keys(presenceData).forEach((uid) => {
            onlineStatus[uid] = presenceData[uid]?.isOnline || false
          })

          setOnlineUsers(onlineStatus)
        })

        unsubscribe = () => off(presenceRef, "value", listener)
      } catch (error) {
        console.error("Error setting up presence listener:", error)
      }
    }

    setupPresenceListener()

    return () => {
      if (unsubscribe) unsubscribe()
    }
  }, [])

  // Listen to messages for a conversation
  const subscribeToMessages = (conversationId: string) => {
    return new Promise<() => void>(async (resolve) => {
      try {
        const services = await getFirebaseServices()
        if (!services.db) {
          resolve(() => {})
          return
        }

        const { collection, query, where, orderBy, limit, onSnapshot } = await import("firebase/firestore")

        const messagesQuery = query(
          collection(services.db, "messages"),
          where("conversationId", "==", conversationId),
          orderBy("timestamp", "asc"),
          limit(100),
        )

        const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
          const messageData = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            timestamp: doc.data().timestamp?.toDate(),
            editedAt: doc.data().editedAt?.toDate(),
          })) as Message[]

          setMessages((prev) => ({
            ...prev,
            [conversationId]: messageData,
          }))
        })

        resolve(unsubscribe)
      } catch (error) {
        console.error("Error subscribing to messages:", error)
        resolve(() => {})
      }
    })
  }

  // Listen to typing indicators
  const subscribeToTyping = (conversationId: string) => {
    return new Promise<() => void>(async (resolve) => {
      try {
        const services = await getFirebaseServices()
        if (!services.rtdb) {
          resolve(() => {})
          return
        }

        const { ref, onValue, off } = await import("firebase/database")

        const typingRef = ref(services.rtdb, `typing/${conversationId}`)

        const listener = onValue(typingRef, (snapshot) => {
          const typingData = snapshot.val() || {}
          const typingUserIds = Object.keys(typingData).filter((uid) => typingData[uid] && uid !== currentUserId)

          setTypingUsers((prev) => ({
            ...prev,
            [conversationId]: typingUserIds,
          }))
        })

        resolve(() => off(typingRef, "value", listener))
      } catch (error) {
        console.error("Error subscribing to typing:", error)
        resolve(() => {})
      }
    })
  }

  // Create or get conversation
  const createOrGetConversation = async (participantIds: string[]): Promise<string> => {
    try {
      const services = await getFirebaseServices()
      if (!services.db) throw new Error("Firebase not initialized")

      const { collection, query, where, getDocs, addDoc, doc, getDoc, serverTimestamp } = await import(
        "firebase/firestore"
      )

      // Check if conversation already exists
      const existingQuery = query(
        collection(services.db, "conversations"),
        where("participants", "==", participantIds.sort()),
      )

      const existingDocs = await getDocs(existingQuery)

      if (!existingDocs.empty) {
        return existingDocs.docs[0].id
      }

      // Get participant details
      const participantNames: { [uid: string]: string } = {}
      const participantPhotos: { [uid: string]: string } = {}

      for (const uid of participantIds) {
        const userDoc = await getDoc(doc(services.db, "users", uid))
        if (userDoc.exists()) {
          const userData = userDoc.data() as User
          participantNames[uid] = userData.displayName
          if (userData.photoURL) {
            participantPhotos[uid] = userData.photoURL
          }
        }
      }

      // Create new conversation
      const conversationData: Omit<Conversation, "id"> = {
        participants: participantIds.sort(),
        participantNames,
        participantPhotos,
        lastMessage: "",
        lastMessageTime: new Date(),
        lastMessageSender: "",
        unreadCount: participantIds.reduce((acc, uid) => ({ ...acc, [uid]: 0 }), {}),
        type: participantIds.length > 2 ? "group" : "direct",
        settings: {
          allowMessages: true,
          allowMedia: true,
          allowGifts: true,
          muteNotifications: false,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const docRef = await addDoc(collection(services.db, "conversations"), {
        ...conversationData,
        lastMessageTime: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })

      return docRef.id
    } catch (error) {
      console.error("Error creating conversation:", error)
      throw error
    }
  }

  // Send message
  const sendMessage = async (
    conversationId: string,
    content: string,
    type: Message["type"] = "text",
    fileData?: {
      url: string
      name: string
      size: number
      duration?: number
    },
    giftData?: Message["giftData"],
  ) => {
    if (!currentUserId) return

    try {
      const services = await getFirebaseServices()
      if (!services.db) return

      const { doc, addDoc, collection, getDoc, updateDoc, serverTimestamp } = await import("firebase/firestore")

      // Get current user data
      const userDoc = await getDoc(doc(services.db, "users", currentUserId))
      const userData = userDoc.data() as User

      const messageData: Omit<Message, "id"> = {
        conversationId,
        senderId: currentUserId,
        senderName: userData.displayName,
        senderPhoto: userData.photoURL,
        content,
        type,
        timestamp: new Date(),
        readBy: [currentUserId],
        reactions: {},
        edited: false,
        fileUrl: fileData?.url,
        fileName: fileData?.name,
        fileSize: fileData?.size,
        fileDuration: fileData?.duration,
        giftData,
      }

      // Add message
      await addDoc(collection(services.db, "messages"), {
        ...messageData,
        timestamp: serverTimestamp(),
      })

      // Update conversation
      const conversationRef = doc(services.db, "conversations", conversationId)
      const conversationDoc = await getDoc(conversationRef)

      if (conversationDoc.exists()) {
        const conversationData = conversationDoc.data() as Conversation
        const unreadCount = { ...conversationData.unreadCount }

        // Increment unread count for all participants except sender
        conversationData.participants.forEach((uid) => {
          if (uid !== currentUserId) {
            unreadCount[uid] = (unreadCount[uid] || 0) + 1
          }
        })

        await updateDoc(conversationRef, {
          lastMessage: type === "text" ? content : `${type} message`,
          lastMessageTime: serverTimestamp(),
          lastMessageSender: currentUserId,
          unreadCount,
          updatedAt: serverTimestamp(),
        })
      }

      // Handle gift transaction
      if (type === "gift" && giftData) {
        const conversation = conversations.find((c) => c.id === conversationId)
        if (conversation) {
          const receiverId = conversation.participants.find((uid) => uid !== currentUserId)
          if (receiverId) {
            await handleGiftTransaction(currentUserId, receiverId, giftData, conversationId)
          }
        }
      }
    } catch (error) {
      console.error("Error sending message:", error)
      throw error
    }
  }

  // Handle gift transaction
  const handleGiftTransaction = async (
    senderId: string,
    receiverId: string,
    giftData: Message["giftData"],
    conversationId?: string,
  ) => {
    if (!giftData) return

    try {
      const services = await getFirebaseServices()
      if (!services.db) return

      const { doc, getDoc, updateDoc, addDoc, collection, serverTimestamp, increment } = await import(
        "firebase/firestore"
      )

      // Get user data
      const [senderDoc, receiverDoc] = await Promise.all([
        getDoc(doc(services.db, "users", senderId)),
        getDoc(doc(services.db, "users", receiverId)),
      ])

      const senderData = senderDoc.data() as User
      const receiverData = receiverDoc.data() as User

      // Check if sender has enough coins
      if (senderData.coinBalance < giftData.value) {
        throw new Error("Insufficient coins")
      }

      // Update balances
      const senderNewBalance = senderData.coinBalance - giftData.value
      const receiverNewBalance = receiverData.coinBalance + giftData.value

      await Promise.all([
        updateDoc(doc(services.db, "users", senderId), {
          coinBalance: senderNewBalance,
          "stats.totalGiftsSent": increment(1),
          updatedAt: serverTimestamp(),
        }),
        updateDoc(doc(services.db, "users", receiverId), {
          coinBalance: receiverNewBalance,
          "stats.totalGiftsReceived": increment(1),
          totalEarnings: increment(giftData.value),
          "earnings.today": increment(giftData.value),
          "earnings.thisWeek": increment(giftData.value),
          "earnings.thisMonth": increment(giftData.value),
          "earnings.total": increment(giftData.value),
          updatedAt: serverTimestamp(),
        }),
      ])

      // Add gift transaction
      await addDoc(collection(services.db, "giftTransactions"), {
        senderId,
        senderName: senderData.displayName,
        receiverId,
        receiverName: receiverData.displayName,
        giftName: giftData.name,
        giftValue: giftData.value,
        conversationId,
        timestamp: serverTimestamp(),
      })

      // Add coin transactions
      await Promise.all([
        addDoc(collection(services.db, "coinTransactions"), {
          userId: senderId,
          amount: giftData.value,
          type: "subtract",
          reason: "gift_sent",
          balanceBefore: senderData.coinBalance,
          balanceAfter: senderNewBalance,
          relatedId: conversationId,
          timestamp: serverTimestamp(),
        }),
        addDoc(collection(services.db, "coinTransactions"), {
          userId: receiverId,
          amount: giftData.value,
          type: "add",
          reason: "gift_received",
          balanceBefore: receiverData.coinBalance,
          balanceAfter: receiverNewBalance,
          relatedId: conversationId,
          timestamp: serverTimestamp(),
        }),
      ])
    } catch (error) {
      console.error("Error handling gift transaction:", error)
      throw error
    }
  }

  // Mark messages as read
  const markMessagesAsRead = async (conversationId: string) => {
    if (!currentUserId) return

    try {
      const services = await getFirebaseServices()
      if (!services.db) return

      const { doc, updateDoc, serverTimestamp, collection, query, where, getDocs, arrayUnion } = await import(
        "firebase/firestore"
      )

      // Update unread count
      const conversationRef = doc(services.db, "conversations", conversationId)
      await updateDoc(conversationRef, {
        [`unreadCount.${currentUserId}`]: 0,
        updatedAt: serverTimestamp(),
      })

      // Mark messages as read
      const messagesQuery = query(
        collection(services.db, "messages"),
        where("conversationId", "==", conversationId),
        where("readBy", "not-in", [[currentUserId]]),
      )

      const messageDocs = await getDocs(messagesQuery)
      const updatePromises = messageDocs.docs.map((messageDoc) =>
        updateDoc(messageDoc.ref, {
          readBy: arrayUnion(currentUserId),
        }),
      )

      await Promise.all(updatePromises)
    } catch (error) {
      console.error("Error marking messages as read:", error)
    }
  }

  // Set typing status
  const setTypingStatus = async (conversationId: string, isTyping: boolean) => {
    if (!currentUserId) return

    try {
      const services = await getFirebaseServices()
      if (!services.rtdb) return

      const { ref, set } = await import("firebase/database")

      const typingRef = ref(services.rtdb, `typing/${conversationId}/${currentUserId}`)
      await set(typingRef, isTyping)

      // Auto-clear typing after 3 seconds
      if (isTyping) {
        setTimeout(() => {
          set(typingRef, false)
        }, 3000)
      }
    } catch (error) {
      console.error("Error setting typing status:", error)
    }
  }

  // Add reaction to message
  const addReaction = async (messageId: string, emoji: string) => {
    if (!currentUserId) return

    try {
      const services = await getFirebaseServices()
      if (!services.db) return

      const { doc, updateDoc } = await import("firebase/firestore")

      const messageRef = doc(services.db, "messages", messageId)
      await updateDoc(messageRef, {
        [`reactions.${currentUserId}`]: emoji,
      })
    } catch (error) {
      console.error("Error adding reaction:", error)
    }
  }

  // Remove reaction from message
  const removeReaction = async (messageId: string) => {
    if (!currentUserId) return

    try {
      const services = await getFirebaseServices()
      if (!services.db) return

      const { doc, updateDoc } = await import("firebase/firestore")

      const messageRef = doc(services.db, "messages", messageId)
      await updateDoc(messageRef, {
        [`reactions.${currentUserId}`]: null,
      })
    } catch (error) {
      console.error("Error removing reaction:", error)
    }
  }

  // Delete message
  const deleteMessage = async (messageId: string) => {
    try {
      const services = await getFirebaseServices()
      if (!services.db) return

      const { doc, deleteDoc } = await import("firebase/firestore")

      await deleteDoc(doc(services.db, "messages", messageId))
    } catch (error) {
      console.error("Error deleting message:", error)
    }
  }

  // Edit message
  const editMessage = async (messageId: string, newContent: string) => {
    try {
      const services = await getFirebaseServices()
      if (!services.db) return

      const { doc, updateDoc, serverTimestamp } = await import("firebase/firestore")

      await updateDoc(doc(services.db, "messages", messageId), {
        content: newContent,
        edited: true,
        editedAt: serverTimestamp(),
      })
    } catch (error) {
      console.error("Error editing message:", error)
    }
  }

  return {
    conversations,
    messages,
    onlineUsers,
    typingUsers,
    loading,
    subscribeToMessages,
    subscribeToTyping,
    createOrGetConversation,
    sendMessage,
    markMessagesAsRead,
    setTypingStatus,
    addReaction,
    removeReaction,
    deleteMessage,
    editMessage,
  }
}
