"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, ExternalLink, Database } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { isDemo } from "@/lib/supabase"

export function DemoModeIndicator() {
  const [isVisible, setIsVisible] = useState(isDemo)

  if (!isDemo || !isVisible) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -100 }}
        className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50"
      >
        <Card className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-yellow-500/30 backdrop-blur-xl shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <Database className="w-5 h-5 text-yellow-400" />
              <div className="flex-1">
                <p className="text-yellow-400 font-semibold text-sm">Demo Mode Active</p>
                <p className="text-yellow-300 text-xs">Connect to Supabase for full functionality</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10 bg-transparent text-xs"
                onClick={() => window.open("https://supabase.com", "_blank")}
              >
                <ExternalLink className="w-3 h-3 mr-1" />
                Setup
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsVisible(false)}
                className="text-yellow-400 hover:text-yellow-300 p-1"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  )
}
