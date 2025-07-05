"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Coins, CreditCard, ArrowUpRight, ArrowDownLeft, Wallet } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth"
import { useSupabaseTransactions } from "@/hooks/useSupabaseTransactions"
import { useToast } from "@/hooks/use-toast"

export function WalletTab() {
  const [buyAmount, setBuyAmount] = useState("")
  const [sellAmount, setSellAmount] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("")
  const [loading, setLoading] = useState(false)
  const { user, updateCoinBalance } = useSupabaseAuth()
  const { transactions, loading: transactionsLoading } = useSupabaseTransactions(user?.id)
  const { toast } = useToast()

  const coinPackages = [
    { coins: 100, price: 9.99, bonus: 0, popular: false },
    { coins: 500, price: 39.99, bonus: 50, popular: true },
    { coins: 1000, price: 69.99, bonus: 150, popular: false },
    { coins: 2500, price: 149.99, bonus: 500, popular: false },
  ]

  const handleBuyCoins = async (packageData: any) => {
    setLoading(true)
    // Simulate payment processing
    await new Promise((resolve) => setTimeout(resolve, 2000))

    try {
      await updateCoinBalance(
        packageData.coins + packageData.bonus,
        `Coin purchase - ${packageData.coins + packageData.bonus} coins for $${packageData.price}`,
        "purchased",
      )
    } catch (error) {
      toast({
        title: "Purchase failed",
        description: "There was an error processing your payment",
        variant: "destructive",
      })
    }

    setLoading(false)
  }

  const handleSellCoins = async () => {
    if (!sellAmount || !paymentMethod || !user) {
      toast({
        title: "Missing Information",
        description: "Please enter amount and select payment method",
        variant: "destructive",
      })
      return
    }

    const amount = Number.parseInt(sellAmount)
    if (amount > user.coin_balance) {
      toast({
        title: "Insufficient coins",
        description: "You don't have enough coins to withdraw",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 2000))

    try {
      await updateCoinBalance(
        -amount,
        `Withdrawal request - $${(amount * 0.01).toFixed(2)} via ${paymentMethod}`,
        "withdrawn",
      )

      toast({
        title: "Withdrawal Requested! 💰",
        description: `Your request to withdraw $${(amount * 0.01).toFixed(2)} has been submitted`,
      })

      setSellAmount("")
    } catch (error) {
      toast({
        title: "Withdrawal failed",
        description: "There was an error processing your withdrawal",
        variant: "destructive",
      })
    }

    setLoading(false)
  }

  if (!user) return null

  return (
    <div className="p-6 flex items-center justify-center h-full">
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <Wallet className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Wallet</h2>
        <p className="text-gray-400">Manage your coins and transactions</p>
      </div>
      {/* Main Content */}
      <Tabs defaultValue="buy" className="space-y-6 mt-12">
        <TabsList className="bg-black/40 border border-purple-500/20">
          <TabsTrigger value="buy" className="data-[state=active]:bg-purple-500">
            Buy Coins
          </TabsTrigger>
          <TabsTrigger value="sell" className="data-[state=active]:bg-purple-500">
            Sell Coins
          </TabsTrigger>
          <TabsTrigger value="history" className="data-[state=active]:bg-purple-500">
            Transaction History
          </TabsTrigger>
        </TabsList>

        {/* Buy Coins */}
        <TabsContent value="buy" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {coinPackages.map((pkg, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card
                  className={`bg-black/40 backdrop-blur-xl transition-all hover:scale-105 ${
                    pkg.popular
                      ? "border-yellow-500/50 ring-2 ring-yellow-500/20"
                      : "border-purple-500/20 hover:border-purple-400/40"
                  }`}
                >
                  <CardContent className="p-6 text-center">
                    {pkg.popular && (
                      <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white mb-3">
                        Most Popular
                      </Badge>
                    )}
                    <div className="text-3xl font-bold text-yellow-400 mb-2">{pkg.coins}</div>
                    {pkg.bonus > 0 && <div className="text-sm text-green-400 mb-2">+{pkg.bonus} Bonus Coins!</div>}
                    <div className="text-2xl font-bold text-white mb-4">${pkg.price}</div>
                    <Button
                      onClick={() => handleBuyCoins(pkg)}
                      disabled={loading}
                      className={`w-full ${
                        pkg.popular
                          ? "bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
                          : "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                      }`}
                    >
                      {loading ? "Processing..." : "Buy Now"}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Payment Methods */}
          <Card className="bg-black/40 border-purple-500/20 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-white">Payment Methods</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {["PayPal", "Stripe", "Apple Pay", "Google Pay"].map((method) => (
                  <Button
                    key={method}
                    variant="outline"
                    className="border-purple-500/30 text-white bg-transparent hover:bg-purple-500/10"
                  >
                    <CreditCard className="w-4 h-4 mr-2" />
                    {method}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sell Coins */}
        <TabsContent value="sell" className="space-y-6">
          <Card className="bg-black/40 border-purple-500/20 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-white">Convert Coins to Cash</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-white">Coins to Sell</Label>
                  <Input
                    type="number"
                    placeholder="Enter amount"
                    value={sellAmount}
                    onChange={(e) => setSellAmount(e.target.value)}
                    className="bg-white/10 border-purple-500/30 text-white"
                    max={user.coin_balance}
                  />
                  <p className="text-sm text-gray-400">
                    Cash value: ${sellAmount ? (Number.parseInt(sellAmount) * 0.01).toFixed(2) : "0.00"}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="text-white">Payment Method</Label>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger className="bg-white/10 border-purple-500/30 text-white">
                      <SelectValue placeholder="Select method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="paypal">PayPal</SelectItem>
                      <SelectItem value="bank">Bank Transfer</SelectItem>
                      <SelectItem value="crypto">Cryptocurrency</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button
                onClick={handleSellCoins}
                disabled={loading || !sellAmount || !paymentMethod}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
              >
                {loading ? "Processing..." : "Request Withdrawal"}
              </Button>
              <p className="text-xs text-gray-400">
                * Minimum withdrawal: 100 coins ($1.00). Processing time: 1-3 business days.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Transaction History */}
        <TabsContent value="history" className="space-y-4">
          {transactionsLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="w-8 h-8 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
            </div>
          ) : transactions.length > 0 ? (
            transactions.map((transaction, index) => (
              <motion.div
                key={transaction.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="bg-black/40 border-purple-500/20 backdrop-blur-xl hover:border-purple-400/40 transition-all">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div
                          className={`p-2 rounded-full bg-white/10 ${
                            transaction.type === "earned" || transaction.type === "purchased"
                              ? "text-green-400"
                              : "text-red-400"
                          }`}
                        >
                          {transaction.type === "earned" || transaction.type === "purchased" ? (
                            <ArrowUpRight className="w-5 h-5" />
                          ) : (
                            <ArrowDownLeft className="w-5 h-5" />
                          )}
                        </div>
                        <div>
                          <p className="text-white font-medium">{transaction.description}</p>
                          <p className="text-gray-400 text-sm">{new Date(transaction.created_at).toLocaleString()}</p>
                        </div>
                      </div>
                      <div
                        className={`text-lg font-bold ${
                          transaction.type === "spent" || transaction.type === "withdrawn"
                            ? "text-red-400"
                            : "text-green-400"
                        }`}
                      >
                        {transaction.type === "spent" || transaction.type === "withdrawn" ? "-" : "+"}
                        {transaction.amount} coins
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-12">
              <Coins className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No transactions yet</h3>
              <p className="text-gray-400">Your transaction history will appear here</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
