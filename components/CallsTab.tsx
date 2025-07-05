"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Phone, Video, Clock, Star, Coins } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth"

export function CallsTab() {
  const { user } = useSupabaseAuth()
  const [activeCallTab, setActiveCallTab] = useState("recent")

  if (!user) return null

  // Mock call history
  const recentCalls = [
    {
      id: "1",
      name: "Sarah Chen",
      photo: "/placeholder.svg?height=100&width=100",
      type: "video",
      duration: "12:34",
      cost: 180,
      earnings: 126,
      rating: 5,
      timestamp: "2 hours ago",
      status: "completed",
    },
    {
      id: "2",
      name: "Alex Rodriguez",
      photo: "/placeholder.svg?height=100&width=100",
      type: "audio",
      duration: "8:15",
      cost: 66,
      earnings: 46,
      rating: 4,
      timestamp: "5 hours ago",
      status: "completed",
    },
    {
      id: "3",
      name: "Emma Wilson",
      photo: "/placeholder.svg?height=100&width=100",
      type: "video",
      duration: "0:00",
      cost: 0,
      earnings: 0,
      rating: 0,
      timestamp: "1 day ago",
      status: "missed",
    },
  ]

  const activeCall = {
    name: "Yuki Tanaka",
    photo: "/placeholder.svg?height=100&width=100",
    type: "video",
    duration: "05:23",
    cost: 75,
  }

  return (
    <div className="p-6 space-y-6 h-full">
      {/* Header */}
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Phone className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Calls</h2>
          <p className="text-gray-400">Your call history will appear here</p>
        </div>
      </div>

      {/* Active Call */}
      {activeCall && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="bg-gradient-to-r from-green-500/20 to-blue-500/20 border-green-500/30 backdrop-blur-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Avatar className="w-16 h-16 ring-2 ring-green-500/50">
                    <AvatarImage src={activeCall.photo || "/placeholder.svg"} />
                    <AvatarFallback className="bg-gradient-to-br from-green-500 to-blue-500 text-white text-lg">
                      {activeCall.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-xl font-semibold text-white">{activeCall.name}</h3>
                    <div className="flex items-center space-x-2 text-green-400">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span>Active {activeCall.type} call</span>
                    </div>
                    <div className="flex items-center space-x-4 mt-2 text-sm text-gray-300">
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span>{activeCall.duration}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Coins className="w-4 h-4 text-yellow-400" />
                        <span>{activeCall.cost} coins</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button className="bg-red-500 hover:bg-red-600 text-white">End Call</Button>
                  <Button variant="outline" className="border-white/30 text-white bg-transparent">
                    Minimize
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Call Tabs */}
      <Tabs value={activeCallTab} onValueChange={setActiveCallTab}>
        <TabsList className="bg-black/40 border border-purple-500/20">
          <TabsTrigger value="recent" className="data-[state=active]:bg-purple-500">
            Recent
          </TabsTrigger>
          <TabsTrigger value="missed" className="data-[state=active]:bg-purple-500">
            Missed
          </TabsTrigger>
          <TabsTrigger value="earnings" className="data-[state=active]:bg-purple-500">
            Earnings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="recent" className="space-y-4">
          {recentCalls.map((call, index) => (
            <motion.div
              key={call.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="bg-black/40 border-purple-500/20 backdrop-blur-xl hover:border-purple-400/40 transition-all">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={call.photo || "/placeholder.svg"} />
                        <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                          {call.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="text-white font-semibold">{call.name}</h4>
                        <div className="flex items-center space-x-2 text-sm text-gray-400">
                          {call.type === "video" ? <Video className="w-4 h-4" /> : <Phone className="w-4 h-4" />}
                          <span>{call.type} call</span>
                          <span>•</span>
                          <span>{call.timestamp}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center space-x-2 mb-1">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-white">{call.duration}</span>
                      </div>
                      {call.earnings > 0 && (
                        <div className="flex items-center space-x-2">
                          <Coins className="w-4 h-4 text-yellow-400" />
                          <span className="text-yellow-400 font-medium">+{call.earnings}</span>
                        </div>
                      )}
                      {call.rating > 0 && (
                        <div className="flex items-center space-x-1 mt-1">
                          <Star className="w-4 h-4 text-yellow-400 fill-current" />
                          <span className="text-yellow-400">{call.rating}</span>
                        </div>
                      )}
                      {call.status === "missed" && (
                        <Badge variant="destructive" className="mt-1">
                          Missed
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </TabsContent>

        <TabsContent value="missed">
          <div className="text-center py-12">
            <Phone className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No missed calls</h3>
            <p className="text-gray-400">You're all caught up!</p>
          </div>
        </TabsContent>

        <TabsContent value="earnings">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-black/40 border-purple-500/20 backdrop-blur-xl">
              <CardContent className="p-6 text-center">
                <Coins className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">125</div>
                <div className="text-gray-400">Today</div>
              </CardContent>
            </Card>
            <Card className="bg-black/40 border-purple-500/20 backdrop-blur-xl">
              <CardContent className="p-6 text-center">
                <Coins className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">890</div>
                <div className="text-gray-400">This Week</div>
              </CardContent>
            </Card>
            <Card className="bg-black/40 border-purple-500/20 backdrop-blur-xl">
              <CardContent className="p-6 text-center">
                <Coins className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">{user.total_earnings}</div>
                <div className="text-gray-400">All Time</div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
