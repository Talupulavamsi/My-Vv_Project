export interface User {
  uid: string
  email: string
  displayName: string
  photoURL?: string
  age?: number
  gender?: "male" | "female" | "other"
  bio?: string
  location?: string
  languages?: string[]
  interests?: string[]
  isPremium: boolean
  premiumTier?: "basic" | "premium" | "vip"
  coinBalance: number
  totalEarnings: number
  rating: number
  totalRatings: number
  isOnline: boolean
  lastSeen: Date
  callRates: {
    video: number
    audio: number
    chat: number
  }
  earnings: {
    today: number
    thisWeek: number
    thisMonth: number
    total: number
  }
  stats: {
    totalMinutesOnCalls: number
    totalCallsReceived: number
    totalCallsMade: number
    totalGiftsSent: number
    totalGiftsReceived: number
    averageCallDuration: number
    averageRating: number
  }
  subscription?: {
    type: "basic" | "premium" | "vip"
    startDate: Date
    endDate: Date
    autoRenew: boolean
  }
  createdAt: Date
  updatedAt: Date
}

export interface Conversation {
  id: string
  participants: string[]
  participantNames: { [uid: string]: string }
  participantPhotos: { [uid: string]: string }
  lastMessage: string
  lastMessageTime: Date
  lastMessageSender: string
  unreadCount: { [uid: string]: number }
  type: "direct" | "group"
  groupName?: string
  groupPhoto?: string
  groupAdmin?: string
  settings: {
    allowMessages: boolean
    allowMedia: boolean
    allowGifts: boolean
    muteNotifications: boolean
  }
  createdAt: Date
  updatedAt: Date
}

export interface Message {
  id: string
  conversationId: string
  senderId: string
  senderName: string
  senderPhoto?: string
  content: string
  type: "text" | "image" | "audio" | "video" | "file" | "gift"
  timestamp: Date
  readBy: string[]
  reactions: { [uid: string]: string }
  replyTo?: string
  edited: boolean
  editedAt?: Date
  fileUrl?: string
  fileName?: string
  fileSize?: number
  fileDuration?: number
  giftData?: {
    name: string
    value: number
    animation: string
    image: string
  }
}

export interface CallSession {
  id: string
  participants: string[]
  participantNames: { [uid: string]: string }
  participantPhotos: { [uid: string]: string }
  callerId: string
  receiverId: string
  type: "video" | "audio"
  status: "connecting" | "active" | "ended" | "missed" | "declined"
  startTime: Date
  endTime?: Date
  duration: number
  cost: number
  callRate: number
  isPremium: boolean
  quality: "SD" | "HD" | "4K"
  gifts: Gift[]
  callStats: {
    totalMinutes: number
    coinsSpent: number
    coinsEarned: number
    giftsExchanged: number
  }
  connectionData: {
    sdpOffer?: string
    sdpAnswer?: string
    iceCandidates: any[]
  }
  endReason?: "normal" | "timeout" | "error" | "insufficient_coins"
  rating?: number
  feedback?: string
  createdAt: Date
  updatedAt: Date
}

export interface CallOffer {
  id: string
  callerId: string
  callerName: string
  callerPhoto?: string
  receiverId: string
  type: "video" | "audio"
  status: "pending" | "accepted" | "declined" | "expired"
  timestamp: Date
  expiresAt: Date
  callRate: number
  sdpOffer?: string
  iceCandidate?: any
}

export interface Gift {
  id: string
  name: string
  value: number
  image: string
  animation: string
  category: "hearts" | "flowers" | "luxury" | "fun"
  rarity: "common" | "rare" | "epic" | "legendary"
}

export interface CoinTransaction {
  id: string
  userId: string
  amount: number
  type: "add" | "subtract"
  reason: "purchase" | "gift_sent" | "gift_received" | "call_payment" | "call_earning" | "bonus" | "refund"
  balanceBefore: number
  balanceAfter: number
  relatedId?: string
  timestamp: Date
}

export interface GiftTransaction {
  id: string
  senderId: string
  senderName: string
  receiverId: string
  receiverName: string
  giftName: string
  giftValue: number
  callSessionId?: string
  conversationId?: string
  timestamp: Date
}

export interface CallHistory {
  id: string
  participants: string[]
  participantNames: { [uid: string]: string }
  type: "video" | "audio"
  duration: number
  cost: number
  gifts: Gift[]
  rating?: number
  isPremium: boolean
  endReason: "normal" | "timeout" | "error" | "insufficient_coins"
  timestamp: Date
}

export interface Earnings {
  id: string
  userId: string
  amount: number
  source: "call" | "gift" | "bonus" | "referral"
  sourceId: string
  timestamp: Date
}
