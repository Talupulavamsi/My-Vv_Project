"use client"

import { useState, useEffect } from "react"
import { supabase, isDemo, type Transaction } from "@/lib/supabase"

const mockTransactions: Transaction[] = [
  {
    id: "demo-tx-1",
    user_id: "demo-user-1",
    type: "purchased",
    amount: 100,
    description: "Welcome bonus",
    created_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
  },
  {
    id: "demo-tx-2",
    user_id: "demo-user-1",
    type: "earned",
    amount: 25,
    description: "Video call earnings",
    created_at: new Date(Date.now() - 43200000).toISOString(), // 12 hours ago
  },
  {
    id: "demo-tx-3",
    user_id: "demo-user-1",
    type: "spent",
    amount: 15,
    description: "Gift sent to Sarah",
    created_at: new Date(Date.now() - 21600000).toISOString(), // 6 hours ago
  },
]

export function useSupabaseTransactions(userId?: string) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (userId) {
      fetchTransactions()
    }
  }, [userId])

  const fetchTransactions = async () => {
    if (!userId) return

    try {
      if (isDemo) {
        // Demo mode - use mock data
        setTransactions(mockTransactions)
        setLoading(false)
        return
      }

      if (!supabase) {
        setTransactions([])
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(50)

      if (error) throw error
      setTransactions(data || [])
    } catch (error) {
      console.error("Error fetching transactions:", error)
      // Fallback to mock data
      setTransactions(mockTransactions)
    } finally {
      setLoading(false)
    }
  }

  const addTransaction = async (transaction: Omit<Transaction, "id" | "created_at">) => {
    try {
      if (isDemo) {
        // Demo mode - simulate adding transaction
        const newTransaction: Transaction = {
          ...transaction,
          id: `demo-tx-${Date.now()}`,
          created_at: new Date().toISOString(),
        }
        setTransactions((prev) => [newTransaction, ...prev])
        return
      }

      if (!supabase) return

      const { error } = await supabase.from("transactions").insert([
        {
          ...transaction,
          created_at: new Date().toISOString(),
        },
      ])

      if (error) throw error
      fetchTransactions() // Refresh list
    } catch (error) {
      console.error("Error adding transaction:", error)
    }
  }

  return {
    transactions,
    loading,
    addTransaction,
    refetch: fetchTransactions,
    isDemo,
  }
}
