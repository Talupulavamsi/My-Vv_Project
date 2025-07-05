"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Users, Plus, Search, MessageCircle, Phone, Crown, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/hooks/useAuth"
import { useGroups } from "@/hooks/useGroups"

interface GroupsTabProps {
  onNotification: (notification: any) => void
}

export function GroupsTab({ onNotification }: GroupsTabProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [createLoading, setCreateLoading] = useState(false)
  const { user } = useAuth()
  const { groups, myGroups, loading, createGroup, joinGroup } = useGroups(user?.id)

  const [newGroup, setNewGroup] = useState({
    name: "",
    description: "",
    category: "",
    is_premium: false,
    features: [] as string[],
  })

  const filteredGroups = groups.filter(
    (group) =>
      group.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !myGroups.some((myGroup) => myGroup.id === group.id),
  )

  const handleCreateGroup = async () => {
    if (!newGroup.name || !newGroup.description || !newGroup.category) {
      onNotification({
        type: "error",
        title: "Missing Information",
        message: "Please fill in all required fields",
      })
      return
    }

    setCreateLoading(true)
    try {
      await createGroup(newGroup)
      setShowCreateDialog(false)
      setNewGroup({
        name: "",
        description: "",
        category: "",
        is_premium: false,
        features: [],
      })
    } catch (error) {
      console.error("Error creating group:", error)
    } finally {
      setCreateLoading(false)
    }
  }

  const handleJoinGroup = async (group: any) => {
    if (group.is_premium && !user?.is_premium) {
      onNotification({
        type: "error",
        title: "Premium Required",
        message: `You need VIP membership to join ${group.name}`,
      })
      return
    }

    await joinGroup(group.id)
  }

  const GroupCard = ({ group, showJoinButton = false }: { group: any; showJoinButton?: boolean }) => (
    <Card className="bg-black/40 border-purple-500/20 backdrop-blur-xl hover:border-purple-400/40 transition-all">
      <CardContent className="p-6">
        <div className="flex items-start space-x-4 mb-4">
          <div className="relative">
            <Avatar className="w-16 h-16 ring-2 ring-purple-500/50">
              <AvatarImage src={group.photo_url || "/placeholder.svg"} />
              <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-lg">
                {group.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            {group.is_premium && (
              <div className="absolute -top-1 -right-1">
                <Crown className="w-5 h-5 text-yellow-400 fill-current" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <h3 className="text-lg font-semibold text-white truncate">{group.name}</h3>
              {group.is_premium && (
                <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs">VIP</Badge>
              )}
            </div>
            <p className="text-gray-400 text-sm mb-2">{group.description}</p>
            <div className="flex items-center space-x-4 text-sm text-gray-300 mb-2">
              <div className="flex items-center space-x-1">
                <Users className="w-4 h-4" />
                <span>{group.member_count?.toLocaleString() || 0}</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span>{group.online_count || 0} online</span>
              </div>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="mb-4">
          <div className="flex flex-wrap gap-1">
            {group.features?.slice(0, 3).map((feature: string) => (
              <Badge key={feature} variant="secondary" className="text-xs bg-purple-500/20 text-purple-300">
                {feature}
              </Badge>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <Badge variant="secondary" className="bg-blue-500/20 text-blue-300">
            {group.category}
          </Badge>
          <div className="flex space-x-2">
            {showJoinButton ? (
              <Button
                size="sm"
                onClick={() => handleJoinGroup(group)}
                className={
                  group.is_premium && !user?.is_premium
                    ? "bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
                    : "bg-purple-500 hover:bg-purple-600"
                }
                disabled={group.is_premium && !user?.is_premium}
              >
                {group.is_premium && !user?.is_premium ? (
                  <>
                    <Lock className="w-3 h-3 mr-1" />
                    VIP Only
                  </>
                ) : (
                  "Join Group"
                )}
              </Button>
            ) : (
              <>
                <Button size="sm" variant="outline" className="border-purple-500/30 text-purple-400 bg-transparent">
                  <MessageCircle className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="outline" className="border-purple-500/30 text-purple-400 bg-transparent">
                  <Phone className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )

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
          <h1 className="text-3xl font-bold text-white mb-2">Groups</h1>
          <p className="text-gray-400">Connect with communities worldwide</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
              <Plus className="w-4 h-4 mr-2" />
              Create Group
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-black/90 border-purple-500/20 text-white">
            <DialogHeader>
              <DialogTitle>Create New Group</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Group Name</Label>
                <Input
                  value={newGroup.name}
                  onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                  className="bg-white/10 border-purple-500/30 text-white"
                  placeholder="Enter group name"
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={newGroup.description}
                  onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
                  className="bg-white/10 border-purple-500/30 text-white"
                  placeholder="Describe your group"
                  rows={3}
                />
              </div>
              <div>
                <Label>Category</Label>
                <Select
                  value={newGroup.category}
                  onValueChange={(value) => setNewGroup({ ...newGroup, category: value })}
                >
                  <SelectTrigger className="bg-white/10 border-purple-500/30 text-white">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Education">Education</SelectItem>
                    <SelectItem value="Technology">Technology</SelectItem>
                    <SelectItem value="Entertainment">Entertainment</SelectItem>
                    <SelectItem value="Health">Health</SelectItem>
                    <SelectItem value="Business">Business</SelectItem>
                    <SelectItem value="Art">Art</SelectItem>
                    <SelectItem value="Sports">Sports</SelectItem>
                    <SelectItem value="Gaming">Gaming</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={handleCreateGroup}
                disabled={createLoading}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              >
                {createLoading ? "Creating..." : "Create Group"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <Input
          placeholder="Search groups..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-white/10 border-purple-500/30 text-white placeholder-gray-400"
        />
      </div>

      {/* Groups Tabs */}
      <Tabs defaultValue="my-groups" className="space-y-6">
        <TabsList className="bg-black/40 border border-purple-500/20">
          <TabsTrigger value="my-groups" className="data-[state=active]:bg-purple-500">
            My Groups ({myGroups.length})
          </TabsTrigger>
          <TabsTrigger value="discover" className="data-[state=active]:bg-purple-500">
            Discover ({filteredGroups.length})
          </TabsTrigger>
        </TabsList>

        {/* My Groups */}
        <TabsContent value="my-groups" className="space-y-4">
          {myGroups.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myGroups.map((group, index) => (
                <motion.div
                  key={group.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <GroupCard group={group} />
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No groups joined yet</h3>
              <p className="text-gray-400 mb-4">Create your first group or discover amazing communities!</p>
              <Button onClick={() => setShowCreateDialog(true)} className="bg-purple-500 hover:bg-purple-600">
                Create Your First Group
              </Button>
            </div>
          )}
        </TabsContent>

        {/* Discover Groups */}
        <TabsContent value="discover" className="space-y-4">
          {filteredGroups.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredGroups.map((group, index) => (
                <motion.div
                  key={group.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <GroupCard group={group} showJoinButton />
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No groups found</h3>
              <p className="text-gray-400 mb-4">Be the first to create a group in this category!</p>
              <Button onClick={() => setShowCreateDialog(true)} className="bg-purple-500 hover:bg-purple-600">
                Create New Group
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
