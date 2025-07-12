"use client"

import { createContext, useContext, type ReactNode } from "react"
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth"
import { useFirebaseChat } from "@/hooks/useFirebaseChat"
import { useFirebaseCalls } from "@/hooks/useFirebaseCalls"

interface FirebaseContextType {
  // Auth
  user: ReturnType<typeof useFirebaseAuth>["user"]
  loading: boolean
  error: string | null
  firebaseReady: boolean
  signUp: ReturnType<typeof useFirebaseAuth>["signUp"]
  signIn: ReturnType<typeof useFirebaseAuth>["signIn"]
  signInWithGoogle: ReturnType<typeof useFirebaseAuth>["signInWithGoogle"]
  logout: ReturnType<typeof useFirebaseAuth>["logout"]
  updateUserProfile: ReturnType<typeof useFirebaseAuth>["updateUserProfile"]
  updateCoinBalance: ReturnType<typeof useFirebaseAuth>["updateCoinBalance"]

  // Chat
  conversations: ReturnType<typeof useFirebaseChat>["conversations"]
  messages: ReturnType<typeof useFirebaseChat>["messages"]
  onlineUsers: ReturnType<typeof useFirebaseChat>["onlineUsers"]
  typingUsers: ReturnType<typeof useFirebaseChat>["typingUsers"]
  subscribeToMessages: ReturnType<typeof useFirebaseChat>["subscribeToMessages"]
  subscribeToTyping: ReturnType<typeof useFirebaseChat>["subscribeToTyping"]
  createOrGetConversation: ReturnType<typeof useFirebaseChat>["createOrGetConversation"]
  sendMessage: ReturnType<typeof useFirebaseChat>["sendMessage"]
  markMessagesAsRead: ReturnType<typeof useFirebaseChat>["markMessagesAsRead"]
  setTypingStatus: ReturnType<typeof useFirebaseChat>["setTypingStatus"]
  addReaction: ReturnType<typeof useFirebaseChat>["addReaction"]
  removeReaction: ReturnType<typeof useFirebaseChat>["removeReaction"]
  deleteMessage: ReturnType<typeof useFirebaseChat>["deleteMessage"]
  editMessage: ReturnType<typeof useFirebaseChat>["editMessage"]

  // Calls
  callOffers: ReturnType<typeof useFirebaseCalls>["callOffers"]
  activeCalls: ReturnType<typeof useFirebaseCalls>["activeCalls"]
  callHistory: ReturnType<typeof useFirebaseCalls>["callHistory"]
  initiateCall: ReturnType<typeof useFirebaseCalls>["initiateCall"]
  acceptCall: ReturnType<typeof useFirebaseCalls>["acceptCall"]
  declineCall: ReturnType<typeof useFirebaseCalls>["declineCall"]
  startCall: ReturnType<typeof useFirebaseCalls>["startCall"]
  endCall: ReturnType<typeof useFirebaseCalls>["endCall"]
  sendGiftInCall: ReturnType<typeof useFirebaseCalls>["sendGiftInCall"]
  rateCall: ReturnType<typeof useFirebaseCalls>["rateCall"]
  updateConnectionData: ReturnType<typeof useFirebaseCalls>["updateConnectionData"]
}

const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined)

export function FirebaseProvider({ children }: { children: ReactNode }) {
  const auth = useFirebaseAuth()
  const chat = useFirebaseChat(auth.user?.uid)
  const calls = useFirebaseCalls(auth.user?.uid)

  const value: FirebaseContextType = {
    // Auth
    user: auth.user,
    loading: auth.loading,
    error: auth.error,
    firebaseReady: auth.firebaseReady,
    signUp: auth.signUp,
    signIn: auth.signIn,
    signInWithGoogle: auth.signInWithGoogle,
    logout: auth.logout,
    updateUserProfile: auth.updateUserProfile,
    updateCoinBalance: auth.updateCoinBalance,

    // Chat
    conversations: chat.conversations,
    messages: chat.messages,
    onlineUsers: chat.onlineUsers,
    typingUsers: chat.typingUsers,
    subscribeToMessages: chat.subscribeToMessages,
    subscribeToTyping: chat.subscribeToTyping,
    createOrGetConversation: chat.createOrGetConversation,
    sendMessage: chat.sendMessage,
    markMessagesAsRead: chat.markMessagesAsRead,
    setTypingStatus: chat.setTypingStatus,
    addReaction: chat.addReaction,
    removeReaction: chat.removeReaction,
    deleteMessage: chat.deleteMessage,
    editMessage: chat.editMessage,

    // Calls
    callOffers: calls.callOffers,
    activeCalls: calls.activeCalls,
    callHistory: calls.callHistory,
    initiateCall: calls.initiateCall,
    acceptCall: calls.acceptCall,
    declineCall: calls.declineCall,
    startCall: calls.startCall,
    endCall: calls.endCall,
    sendGiftInCall: calls.sendGiftInCall,
    rateCall: calls.rateCall,
    updateConnectionData: calls.updateConnectionData,
  }

  return <FirebaseContext.Provider value={value}>{children}</FirebaseContext.Provider>
}

export function useFirebase() {
  const context = useContext(FirebaseContext)
  if (context === undefined) {
    throw new Error("useFirebase must be used within a FirebaseProvider")
  }
  return context
}
