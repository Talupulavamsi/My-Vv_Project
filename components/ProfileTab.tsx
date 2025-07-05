"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Edit, Star, Coins, Phone, Gift, Crown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/hooks/useAuth"

export function ProfileTab() {
  const [isEditing, setIsEditing] = useState(false)
  const { user, updateUserProfile } = useAuth()
  const [profileData, setProfileData] = useState({
    display_name: user?.display_name || "",
    bio: user?.bio || "",
    location: user?.location || "",
  })

  if (!user) return null

  const stats = [
    { label: "Total Calls", value: user.stats?.total_calls || 0, icon: Phone },
    { label: "Rating", value: user.rating.toFixed(1), icon: Star },
    { label: "Earnings", value: user.total_earnings, icon: Coins },
    { label: "Gifts Received", value: user.stats?.total_gifts || 0, icon: Gift },
  ]

  const handleSave = async () => {
    try {
      await updateUserProfile(profileData)
      setIsEditing(false)
    } catch (error) {
      console.error("Error updating profile:", error)
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Profile</h1>
          <p className="text-gray-400">Manage your profile settings</p>
        </div>
        <Button
          onClick={isEditing ? handleSave : () => setIsEditing(true)}
          variant="outline"
          className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10 bg-transparent"
        >
          <Edit className="w-4 h-4 mr-2" />
          {isEditing ? "Save" : "Edit Profile"}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="lg:col-span-1">
          <Card className="bg-black/40 border-purple-500/20 backdrop-blur-xl">
            <CardContent className="p-6 text-center">
              <div className="relative mb-4">
                <Avatar className="w-32 h-32 mx-auto ring-4 ring-purple-500/50">
                  <AvatarImage src={user.photo_url || "/placeholder.svg"} />
                  <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-4xl">
                    {user.display_name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                {user.is_premium && (
                  <div className="absolute -top-2 -right-2">
                    <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white">
                      <Crown className="w-3 h-3 mr-1" />
                      VIP
                    </Badge>
                  </div>
                )}
                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                  <div className="w-6 h-6 bg-green-500 rounded-full border-2 border-black"></div>
                </div>
              </div>

              {isEditing ? (
                <div className="space-y-4 text-left">
                  <div>
                    <Label className="text-white">Display Name</Label>
                    <Input
                      value={profileData.display_name}
                      onChange={(e) => setProfileData({ ...profileData, display_name: e.target.value })}
                      className="bg-white/10 border-purple-500/30 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-white">Bio</Label>
                    <Textarea
                      value={profileData.bio}
                      onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                      className="bg-white/10 border-purple-500/30 text-white"
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label className="text-white">Location</Label>
                    <Input
                      value={profileData.location}
                      onChange={(e) => setProfileData({ ...profileData, location: e.target.value })}
                      className="bg-white/10 border-purple-500/30 text-white"
                    />
                  </div>
                </div>
              ) : (
                <>
                  <h2 className="text-2xl font-bold text-white mb-2">{user.display_name}</h2>
                  <p className="text-gray-400 mb-4">{user.bio || "No bio available"}</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-center space-x-2">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span className="text-yellow-400 font-medium">{user.rating}</span>
                      <span className="text-gray-400">({user.total_ratings} reviews)</span>
                    </div>
                    <p className="text-gray-400">📍 {user.location || "Location not set"}</p>
                  </div>
                </>
              )}

              {/* Call Rates */}
              <div className="mt-6 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Video Call:</span>
                  <span className="text-yellow-400 font-medium">{user.call_rates?.video || 10} coins/min</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Audio Call:</span>
                  <span className="text-yellow-400 font-medium">{user.call_rates?.audio || 5} coins/min</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Chat:</span>
                  <span className="text-yellow-400 font-medium">{user.call_rates?.chat || 2} coins/min</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stats and Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="bg-black/40 border-purple-500/20 backdrop-blur-xl">
                  <CardContent className="p-4 text-center">
                    <stat.icon className="w-6 h-6 text-purple-400 mx-auto mb-2" />
                    <div className="text-xl font-bold text-white">{stat.value}</div>
                    <div className="text-xs text-gray-400">{stat.label}</div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Languages */}
          <Card className="bg-black/40 border-purple-500/20 backdrop-blur-xl">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Languages</h3>
              <div className="flex flex-wrap gap-2">
                {user.languages && user.languages.length > 0 ? (
                  user.languages.map((lang: string) => (
                    <Badge key={lang} className="bg-purple-500/20 text-purple-300">
                      {lang}
                    </Badge>
                  ))
                ) : (
                  <p className="text-gray-400">No languages added</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Account Info */}
          <Card className="bg-black/40 border-purple-500/20 backdrop-blur-xl">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Account Information</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Email:</span>
                  <span className="text-white">{user.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Member since:</span>
                  <span className="text-white">{new Date(user.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Account type:</span>
                  <span className={user.is_premium ? "text-yellow-400" : "text-gray-300"}>
                    {user.is_premium ? "VIP Member" : "Standard Member"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
