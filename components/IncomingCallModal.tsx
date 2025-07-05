"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Phone, PhoneOff, Video, VideoOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useFirebase } from "@/contexts/FirebaseContext"

export function IncomingCallModal() {
  const { callOffers, acceptCall, declineCall } = useFirebase()
  const [currentOffer, setCurrentOffer] = useState(callOffers[0] || null)

  useEffect(() => {
    setCurrentOffer(callOffers[0] || null)
  }, [callOffers])

  const handleAccept = async () => {
    if (currentOffer) {
      try {
        await acceptCall(currentOffer.id)
        setCurrentOffer(null)
      } catch (error) {
        console.error("Error accepting call:", error)
      }
    }
  }

  const handleDecline = async () => {
    if (currentOffer) {
      try {
        await declineCall(currentOffer.id)
        setCurrentOffer(null)
      } catch (error) {
        console.error("Error declining call:", error)
      }
    }
  }

  return (
    <AnimatePresence>
      {currentOffer && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-8 rounded-3xl shadow-2xl border border-purple-500/20 max-w-sm w-full mx-4"
          >
            <div className="text-center space-y-6">
              <div className="relative">
                <Avatar className="w-24 h-24 mx-auto ring-4 ring-purple-500/50">
                  <AvatarImage src={currentOffer.callerPhoto || "/placeholder.svg"} />
                  <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-2xl">
                    {currentOffer.callerName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                  className="absolute -inset-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 opacity-20"
                />
              </div>

              <div>
                <h3 className="text-2xl font-bold text-white mb-2">{currentOffer.callerName}</h3>
                <p className="text-purple-200 mb-1">Incoming {currentOffer.type} call</p>
                <p className="text-sm text-purple-300">{currentOffer.callRate} coins/min</p>
              </div>

              <div className="flex justify-center space-x-6">
                <Button
                  onClick={handleDecline}
                  size="lg"
                  className="bg-red-500 hover:bg-red-600 text-white rounded-full w-16 h-16 p-0"
                >
                  {currentOffer.type === "video" ? <VideoOff className="w-6 h-6" /> : <PhoneOff className="w-6 h-6" />}
                </Button>

                <Button
                  onClick={handleAccept}
                  size="lg"
                  className="bg-green-500 hover:bg-green-600 text-white rounded-full w-16 h-16 p-0"
                >
                  {currentOffer.type === "video" ? <Video className="w-6 h-6" /> : <Phone className="w-6 h-6" />}
                </Button>
              </div>

              <p className="text-xs text-purple-400">Call will expire in 30 seconds</p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
