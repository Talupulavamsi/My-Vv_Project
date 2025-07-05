"use client"

import { Home, Users, User, Settings, LogOut, Crown, Coins } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

interface NavigationProps {
  activeTab: string
  onTabChange: (tab: string) => void
  onLogout: () => void
  user: any
}

export function Navigation({ activeTab, onTabChange, onLogout, user }: NavigationProps) {
  const navItems = [
    { id: "home", icon: Home, label: "Discover" },
    { id: "groups", icon: Users, label: "Groups" },
    { id: "profile", icon: User, label: "Profile" },
  ]

  return (
    <div className="bg-black/40 backdrop-blur-xl border-r border-purple-500/20 h-full flex flex-col">
      {/* User Profile Section */}
      <div className="p-4 border-b border-purple-500/20">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Avatar className="w-12 h-12 ring-2 ring-purple-500/50">
              <AvatarImage src={user.photo_url || "/placeholder.svg"} />
              <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                {user.display_name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            {user.is_premium && (
              <div className="absolute -top-1 -right-1">
                <Crown className="w-5 h-5 text-yellow-400 fill-current" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <p className="text-white font-semibold truncate">{user.display_name}</p>
              {user.is_premium && (
                <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs px-1 py-0">
                  VIP
                </Badge>
              )}
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <Coins className="w-4 h-4 text-yellow-400" />
              <span className="text-yellow-400 font-medium">{user.coin_balance}</span>
              <span className="text-gray-400">coins</span>
            </div>
            <div className="flex items-center space-x-1 text-xs text-gray-400">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span>Online</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 p-4">
        <div className="space-y-2">
          {navItems.map((item) => (
            <Button
              key={item.id}
              variant={activeTab === item.id ? "default" : "ghost"}
              className={`w-full justify-start space-x-3 ${
                activeTab === item.id
                  ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                  : "text-gray-300 hover:text-white hover:bg-white/10"
              }`}
              onClick={() => onTabChange(item.id)}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Button>
          ))}
        </div>
      </nav>

      {/* Bottom Actions */}
      <div className="p-4 border-t border-purple-500/20 space-y-2">
        <Button
          variant="ghost"
          className="w-full justify-start space-x-3 text-gray-300 hover:text-white hover:bg-white/10"
          onClick={() => onTabChange("settings")}
        >
          <Settings className="w-5 h-5" />
          <span>Settings</span>
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start space-x-3 text-red-400 hover:text-red-300 hover:bg-red-500/10"
          onClick={onLogout}
        >
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </Button>
      </div>
    </div>
  )
}
