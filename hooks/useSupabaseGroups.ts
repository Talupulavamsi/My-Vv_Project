"use client"

import { useState, useEffect } from "react"
import { supabase, isDemo, mockGroups, type Group } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"

export function useSupabaseGroups(userId?: string) {
  const [groups, setGroups] = useState<Group[]>([])
  const [myGroups, setMyGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetchGroups()
    if (userId) {
      fetchMyGroups()
    }
  }, [userId])

  const fetchGroups = async () => {
    try {
      if (isDemo) {
        // Demo mode - use mock data
        setGroups(mockGroups)
        setLoading(false)
        return
      }

      if (!supabase) {
        setGroups([])
        setLoading(false)
        return
      }

      const { data, error } = await supabase.from("groups").select("*").order("member_count", { ascending: false })

      if (error) throw error
      setGroups(data || [])
    } catch (error) {
      console.error("Error fetching groups:", error)
      // Fallback to mock data on error
      setGroups(mockGroups)
    } finally {
      setLoading(false)
    }
  }

  const fetchMyGroups = async () => {
    if (!userId) return

    try {
      if (isDemo) {
        // Demo mode - simulate user groups
        setMyGroups(mockGroups.slice(0, 2))
        return
      }

      if (!supabase) return

      const { data, error } = await supabase
        .from("group_members")
        .select(`
          *,
          groups (*)
        `)
        .eq("user_id", userId)
        .eq("status", "approved")

      if (error) throw error

      const userGroups = data?.map((member) => member.groups).filter(Boolean) || []
      setMyGroups(userGroups as Group[])
    } catch (error) {
      console.error("Error fetching user groups:", error)
      // Fallback to demo data
      setMyGroups(mockGroups.slice(0, 2))
    }
  }

  const joinGroup = async (groupId: string) => {
    if (!userId) return

    try {
      if (isDemo) {
        // Demo mode - simulate joining
        await new Promise((resolve) => setTimeout(resolve, 1000))

        toast({
          title: "Join Request Sent! 📨",
          description: "Your request to join the group has been sent to the admins (Demo Mode)",
        })
        return
      }

      if (!supabase) return

      // Check if already a member or has pending request
      const { data: existingMember } = await supabase
        .from("group_members")
        .select("*")
        .eq("group_id", groupId)
        .eq("user_id", userId)
        .single()

      if (existingMember) {
        if (existingMember.status === "pending") {
          toast({
            title: "Request already sent",
            description: "Your join request is pending approval",
            variant: "destructive",
          })
          return
        } else if (existingMember.status === "approved") {
          toast({
            title: "Already a member",
            description: "You're already a member of this group",
            variant: "destructive",
          })
          return
        }
      }

      // Create join request
      const { error } = await supabase.from("group_members").insert([
        {
          group_id: groupId,
          user_id: userId,
          status: "pending",
          joined_at: new Date().toISOString(),
        },
      ])

      if (error) throw error

      toast({
        title: "Join Request Sent! 📨",
        description: "Your request to join the group has been sent to the admins",
      })
    } catch (error: any) {
      console.error("Error joining group:", error)
      toast({
        title: "Failed to join group",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const createGroup = async (
    groupData: Omit<Group, "id" | "created_at" | "updated_at" | "member_count" | "online_count">,
  ) => {
    if (!userId) return

    try {
      if (isDemo) {
        // Demo mode - simulate group creation
        await new Promise((resolve) => setTimeout(resolve, 1500))

        const newGroup: Group = {
          ...groupData,
          id: `demo-group-${Date.now()}`,
          member_count: 1,
          online_count: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }

        setGroups((prev) => [newGroup, ...prev])
        setMyGroups((prev) => [newGroup, ...prev])

        toast({
          title: "Group created! 🎉",
          description: `${groupData.name} has been created successfully (Demo Mode)`,
        })

        return newGroup
      }

      if (!supabase) return

      const { data, error } = await supabase
        .from("groups")
        .insert([
          {
            ...groupData,
            created_by: userId,
            member_count: 1,
            online_count: 1,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ])
        .select()
        .single()

      if (error) throw error

      // Add creator as approved member
      await supabase.from("group_members").insert([
        {
          group_id: data.id,
          user_id: userId,
          status: "approved",
          joined_at: new Date().toISOString(),
        },
      ])

      toast({
        title: "Group created! 🎉",
        description: `${groupData.name} has been created successfully`,
      })

      fetchGroups()
      fetchMyGroups()

      return data
    } catch (error: any) {
      console.error("Error creating group:", error)
      toast({
        title: "Failed to create group",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  return {
    groups,
    myGroups,
    loading,
    joinGroup,
    createGroup,
    refetch: () => {
      fetchGroups()
      if (userId) fetchMyGroups()
    },
    isDemo,
  }
}
