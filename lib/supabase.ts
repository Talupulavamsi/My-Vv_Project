import { createClient } from "@supabase/supabase-js"

const supabaseUrl = "https://gsiwaehfhirkwmvxufds.supabase.co"
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzaXdhZWhmaGlya3dtdnh1ZmRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE2NDM3MDEsImV4cCI6MjA2NzIxOTcwMX0.04IstKgMP760qNJZlxRmK6KCbE3sgxmUZf3Y-x1iRqU"

export const supabase = createClient(supabaseUrl, supabaseKey)

// Database Types
export interface User {
  id: string
  email: string
  display_name: string
  age?: number
  gender?: "male" | "female" | "other"
  location?: string
  languages?: string[]
  bio?: string
  photo_url?: string
  is_premium: boolean
  coin_balance: number
  total_earnings: number
  rating: number
  total_ratings: number
  is_online: boolean
  last_seen: string
  call_rates: {
    video: number
    audio: number
    chat: number
  }
  stats: {
    total_calls: number
    total_minutes: number
    total_gifts: number
  }
  created_at: string
  updated_at: string
}

export interface Group {
  id: string
  name: string
  description: string
  photo_url?: string
  category: string
  is_premium: boolean
  features: string[]
  member_count: number
  online_count: number
  created_by: string
  created_at: string
  updated_at: string
}

export interface GroupMember {
  id: string
  group_id: string
  user_id: string
  status: "pending" | "approved" | "rejected"
  joined_at: string
}

export interface Transaction {
  id: string
  user_id: string
  type: "earned" | "spent" | "purchased" | "withdrawn"
  amount: number
  description: string
  created_at: string
}
