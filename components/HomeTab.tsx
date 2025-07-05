"use client"

import { Search, Filter, Video, Phone, MessageCircle, Star, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useState, useEffect } from "react"
import { supabase, type User } from "@/lib/supabase"

export function HomeTab() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase.from("users").select("*").eq("is_online", true).limit(20)

      if (error) throw error
      setUsers(data || [])
    } catch (error) {
      console.error("Error fetching users:", error)
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Discover People</h1>
          <p className="text-gray-400">Connect with amazing people worldwide</p>
        </div>
        <Button
          variant="outline"
          className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10 bg-transparent"
        >
          <Filter className="w-4 h-4 mr-2" />
          Filters
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <Input
          placeholder="Search people..."
          className="pl-10 bg-white/10 border-purple-500/30 text-white placeholder-gray-400"
        />
      </div>

      {/* Users Grid */}
      {users.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {users.map((user) => (
            <Card
              key={user.id}
              className="bg-black/40 border-purple-500/20 backdrop-blur-xl hover:border-purple-400/40 transition-all duration-300"
            >
              <CardContent className="p-6">
                <div className="flex items-start space-x-4 mb-4">
                  <div className="relative">
                    <Avatar className="w-16 h-16 ring-2 ring-purple-500/50">
                      <AvatarImage src={user.photo_url || "/placeholder.svg"} />
                      <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-lg">
                        {user.display_name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-black bg-green-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="text-lg font-semibold text-white truncate">{user.display_name}</h3>
                      {user.is_premium && (
                        <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs">VIP</Badge>
                      )}
                    </div>
                    <div className="flex items-center space-x-1 mb-2">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span className="text-yellow-400 font-medium">{user.rating}</span>
                    </div>
                    {user.location && (
                      <div className="flex items-center space-x-1 text-gray-400 text-sm">
                        <MapPin className="w-3 h-3" />
                        <span>{user.location}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Languages */}
                {user.languages && user.languages.length > 0 && (
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-1">
                      {user.languages.slice(0, 3).map((lang) => (
                        <Badge key={lang} variant="secondary" className="text-xs bg-purple-500/20 text-purple-300">
                          {lang}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Call Rates */}
                <div className="mb-4 space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Video Call:</span>
                    <span className="text-yellow-400 font-medium">{user.call_rates?.video || 10} coins/min</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Audio Call:</span>
                    <span className="text-yellow-400 font-medium">{user.call_rates?.audio || 5} coins/min</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-2">
                  <Button size="sm" className="flex-1 bg-blue-500 hover:bg-blue-600 text-white">
                    <Video className="w-4 h-4 mr-1" />
                    Video
                  </Button>
                  <Button size="sm" className="flex-1 bg-green-500 hover:bg-green-600 text-white">
                    <Phone className="w-4 h-4 mr-1" />
                    Audio
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10 bg-transparent"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-gray-400 text-lg mb-2">No users online</div>
          <p className="text-gray-500">Check back later to discover people</p>
        </div>
      )}
    </div>
  )
}
