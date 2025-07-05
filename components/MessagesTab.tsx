"use client"

import type React from "react"
import { useState } from "react"
import { motion } from "framer-motion"
import { Search, Plus, Send, Smile, Paperclip, Phone, Video } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth"
import { MessageCircle } from "lucide-react"

// Mock conversations for demo
const mockConversations = [
  {
    id: "conv-1",
    participants: ["demo-user-1", "demo-user-2"],
    participantNames: { "demo-user-2": "Sarah Chen" },
    participantPhotos: { "demo-user-2": "/placeholder.svg?height=100&width=100" },
    lastMessage: "Hey! How are you doing?",
    lastMessageTime: new Date(Date.now() - 3600000), // 1 hour ago
    lastMessageSender: "demo-user-2",
    unreadCount: { "demo-user-1": 2 },
    type: "direct" as const,
  },
  {
    id: "conv-2",
    participants: ["demo-user-1", "demo-user-3"],
    participantNames: { "demo-user-3": "Alex Rodriguez" },
    participantPhotos: { "demo-user-3": "/placeholder.svg?height=100&width=100" },
    lastMessage: "Thanks for the call earlier!",
    lastMessageTime: new Date(Date.now() - 7200000), // 2 hours ago
    lastMessageSender: "demo-user-3",
    unreadCount: { "demo-user-1": 0 },
    type: "direct" as const,
  },
]

const mockMessages = {
  "conv-1": [
    {
      id: "msg-1",
      conversationId: "conv-1",
      senderId: "demo-user-2",
      senderName: "Sarah Chen",
      content: "Hey! How are you doing?",
      timestamp: new Date(Date.now() - 3600000),
      type: "text" as const,
    },
    {
      id: "msg-2",
      conversationId: "conv-1",
      senderId: "demo-user-2",
      senderName: "Sarah Chen",
      content: "I wanted to schedule another language practice session",
      timestamp: new Date(Date.now() - 3500000),
      type: "text" as const,
    },
  ],
  "conv-2": [
    {
      id: "msg-3",
      conversationId: "conv-2",
      senderId: "demo-user-3",
      senderName: "Alex Rodriguez",
      content: "Thanks for the call earlier!",
      timestamp: new Date(Date.now() - 7200000),
      type: "text" as const,
    },
  ],
}

export function MessagesTab() {
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [messageText, setMessageText] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [conversations] = useState(mockConversations)
  const [messages, setMessages] = useState(mockMessages)
  const { user: authUser } = useSupabaseAuth()

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!messageText.trim() || !selectedConversation || !authUser) return

    const newMessage = {
      id: `msg-${Date.now()}`,
      conversationId: selectedConversation,
      senderId: authUser.id,
      senderName: authUser.display_name,
      content: messageText.trim(),
      timestamp: new Date(),
      type: "text" as const,
    }

    setMessages((prev) => ({
      ...prev,
      [selectedConversation as keyof typeof prev]: [
        ...(prev[selectedConversation as keyof typeof prev] || []),
        newMessage,
      ],
    }))

    setMessageText("")
  }

  const getOtherParticipant = (conversation: any) => {
    const otherUid = conversation.participants.find((uid: string) => uid !== authUser?.id)
    return otherUid
      ? {
          uid: otherUid,
          name: conversation.participantNames[otherUid],
          photo: conversation.participantPhotos[otherUid],
        }
      : null
  }

  const filteredConversations = conversations.filter((conv) =>
    Object.values(conv.participantNames).some((name) => name.toLowerCase().includes(searchQuery.toLowerCase())),
  )

  const selectedMessages = selectedConversation ? messages[selectedConversation as keyof typeof messages] || [] : []

  return (
    <div className="flex h-full">
      {/* Conversations List */}
      <div className="w-1/3 border-r border-purple-500/20 flex flex-col">
        <div className="p-4 border-b border-purple-500/20">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">Messages</h2>
            <Button size="sm" className="bg-purple-500 hover:bg-purple-600">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-white/10 border-purple-500/30 text-white placeholder-gray-400"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length > 0 ? (
            filteredConversations.map((conversation) => {
              const otherParticipant = getOtherParticipant(conversation)
              const unreadCount = authUser ? conversation.unreadCount[authUser.id] || 0 : 0

              return (
                <motion.div
                  key={conversation.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`p-4 border-b border-purple-500/10 cursor-pointer hover:bg-white/5 transition-colors ${
                    selectedConversation === conversation.id ? "bg-purple-500/20" : ""
                  }`}
                  onClick={() => setSelectedConversation(conversation.id)}
                >
                  <div className="flex items-center space-x-3">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={otherParticipant?.photo || "/placeholder.svg"} />
                      <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                        {otherParticipant?.name?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-white font-medium truncate">{otherParticipant?.name || "Unknown"}</p>
                        {unreadCount > 0 && (
                          <span className="bg-purple-500 text-white text-xs px-2 py-1 rounded-full">{unreadCount}</span>
                        )}
                      </div>
                      <p className="text-gray-400 text-sm truncate">{conversation.lastMessage}</p>
                      <p className="text-gray-500 text-xs">{conversation.lastMessageTime?.toLocaleTimeString()}</p>
                    </div>
                  </div>
                </motion.div>
              )
            })
          ) : (
            <div className="p-6 flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Messages</h2>
                <p className="text-gray-400">Your conversations will appear here</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-purple-500/20 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {(() => {
                  const conversation = conversations.find((c) => c.id === selectedConversation)
                  const otherParticipant = conversation ? getOtherParticipant(conversation) : null
                  return (
                    <>
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={otherParticipant?.photo || "/placeholder.svg"} />
                        <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                          {otherParticipant?.name?.charAt(0) || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-white font-medium">{otherParticipant?.name || "Unknown"}</p>
                        <p className="text-green-400 text-sm">Online</p>
                      </div>
                    </>
                  )
                })()}
              </div>
              <div className="flex space-x-2">
                <Button size="sm" variant="outline" className="border-purple-500/30 text-purple-400 bg-transparent">
                  <Phone className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="outline" className="border-purple-500/30 text-purple-400 bg-transparent">
                  <Video className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {selectedMessages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${message.senderId === authUser?.id ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                      message.senderId === authUser?.id
                        ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                        : "bg-white/10 text-white"
                    }`}
                  >
                    <p>{message.content}</p>
                    <p className="text-xs opacity-70 mt-1">{message.timestamp?.toLocaleTimeString()}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-purple-500/20">
              <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
                <Button type="button" size="sm" variant="ghost" className="text-gray-400 hover:text-white">
                  <Paperclip className="w-4 h-4" />
                </Button>
                <Button type="button" size="sm" variant="ghost" className="text-gray-400 hover:text-white">
                  <Smile className="w-4 h-4" />
                </Button>
                <Input
                  placeholder="Type a message..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  className="flex-1 bg-white/10 border-purple-500/30 text-white placeholder-gray-400"
                />
                <Button type="submit" size="sm" className="bg-purple-500 hover:bg-purple-600">
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Select a conversation</h3>
              <p className="text-gray-400">Choose a conversation to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
