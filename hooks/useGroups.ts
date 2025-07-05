"use client"

import { useState, useEffect } from "react"
import { supabase, type Group } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"

export function useGroups(userId?: string) {
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
      const { data, error } = await supabase.from("groups").select("*").order("member_count", { ascending: false })

      if (error) throw error
      setGroups(data || [])
    } catch (error) {
      console.error("Error fetching groups:", error)
      setGroups([])
    } finally {
      setLoading(false)
    }
  }

  const fetchMyGroups = async () => {
    if (!userId) return

    try {
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
      setMyGroups([])
    }
  }

  const createGroup = async (
    groupData: Omit<Group, "id" | "created_at" | "updated_at" | "member_count" | "online_count">,
  ) => {
    if (!userId) return

    try {
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

  const joinGroup = async (groupId: string) => {
    if (!userId) return

    try {
      // Check if already a member
      const { data: existingMember } = await supabase
        .from("group_members")
        .select("*")
        .eq("group_id", groupId)
        .eq("user_id", userId)
        .single()

      if (existingMember) {
        toast({
          title: "Already a member",
          description: "You're already a member of this group",
          variant: "destructive",
        })
        return
      }

      // Join group
      const { error } = await supabase.from("group_members").insert([
        {
          group_id: groupId,
          user_id: userId,
          status: "approved",
          joined_at: new Date().toISOString(),
        },
      ])

      if (error) throw error

      toast({
        title: "Joined group! 🎉",
        description: "You've successfully joined the group",
      })

      fetchGroups()
      fetchMyGroups()
    } catch (error: any) {
      console.error("Error joining group:", error)
      toast({
        title: "Failed to join group",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  return {
    groups,
    myGroups,
    loading,
    createGroup,
    joinGroup,
    refetch: () => {
      fetchGroups()
      if (userId) fetchMyGroups()
    },
  }
}
