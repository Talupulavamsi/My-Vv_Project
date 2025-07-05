"use client"

import { useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, CheckCircle, AlertCircle, Info, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Notification {
  id: number
  type: "success" | "error" | "info" | "warning"
  title: string
  message: string
}

interface NotificationSystemProps {
  notifications: Notification[]
  onRemove: (id: number) => void
}

export function NotificationSystem({ notifications, onRemove }: NotificationSystemProps) {
  useEffect(() => {
    notifications.forEach((notification) => {
      const timer = setTimeout(() => {
        onRemove(notification.id)
      }, 5000) // Auto remove after 5 seconds

      return () => clearTimeout(timer)
    })
  }, [notifications, onRemove])

  const getIcon = (type: string) => {
    switch (type) {
      case "success":
        return <CheckCircle className="w-5 h-5 text-green-400" />
      case "error":
        return <XCircle className="w-5 h-5 text-red-400" />
      case "warning":
        return <AlertCircle className="w-5 h-5 text-yellow-400" />
      default:
        return <Info className="w-5 h-5 text-blue-400" />
    }
  }

  const getColors = (type: string) => {
    switch (type) {
      case "success":
        return "border-green-500/30 bg-green-500/10"
      case "error":
        return "border-red-500/30 bg-red-500/10"
      case "warning":
        return "border-yellow-500/30 bg-yellow-500/10"
      default:
        return "border-blue-500/30 bg-blue-500/10"
    }
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      <AnimatePresence>
        {notifications.map((notification) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, x: 300, scale: 0.3 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 300, scale: 0.5, transition: { duration: 0.2 } }}
            className={`max-w-sm w-full backdrop-blur-xl border rounded-lg p-4 shadow-lg ${getColors(
              notification.type,
            )}`}
          >
            <div className="flex items-start space-x-3">
              {getIcon(notification.type)}
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-white">{notification.title}</h4>
                <p className="text-sm text-gray-300 mt-1">{notification.message}</p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onRemove(notification.id)}
                className="text-gray-400 hover:text-white p-1 h-auto"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
