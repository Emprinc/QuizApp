import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ShoppingBag, Coins, Gift, Sparkles, Zap, Eye, SkipForward, Box, Star, Send, Lightbulb } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { Button, Card, LoadingSpinner } from '../components/ui'
import { economyService, COSMETIC_ITEMS } from '../services/economyService'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

export default function Shop() {
  const { user, profile, updateProfile } = useAuth()
  const [balance, setBalance] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [purchasing, setPurchasing] = useState(null)
  const [showTransfer, setShowTransfer] = useState(false)
  const [transferTo, setTransferTo] = useState('')
  const [transferAmount, setTransferAmount] = useState('')

  useEffect(() => {
    if (user) {
      loadData()
    }
  }, [user?.id])

  const loadData = async () => {
    setLoading(true)
    try {
      const [bal, txns] = await Promise.all([
        economyService.getBalance(user.id),
        economyService.getTransactions(user.id, 10),
      ])
      setBalance(bal)
      setTransactions(txns)
    } catch (err) {
      console.error('Error loading shop data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handlePurchase = async (item) => {
    setPurchasing(item.key)
    try {
      await economyService.purchaseItem(user.id, item.key, item.cost)
      toast.success(`Purchased ${item.name}!`)
      const bal = await economyService.getBalance(user.id)
      setBalance(bal)
      if (updateProfile) {
        updateProfile({ coins: bal.coins })
      }
    } catch (err) {
      toast.error(err.message || 'Purchase failed')
    } finally {
      setPurchasing(null)
    }
  }

  const handleOpenMysteryBox = async () => {
    setPurchasing('open_box')
    try {
      const reward = await economyService.openMysteryBox(user.id)
      toast.success(`You won ${reward} coins!`)
      const bal = await economyService.getBalance(user.id)
      setBalance(bal)
      if (updateProfile) {
        updateProfile({ coins: bal.coins })
      }
    } catch (err) {
      toast.error(err.message || 'Failed to open mystery box')
    } finally {
      setPurchasing(null)
    }
  }

  const handleClaimDaily = async () => {
    setPurchasing('daily')
    try {
      const reward = await economyService.claimDailyReward(user.id)
      toast.success(`Daily reward: +${reward} coins!`)
      const bal = await economyService.getBalance(user.id)
      setBalance(bal)
      if (updateProfile) {
        updateProfile({ coins: bal.coins })
      }
    } catch (err) {
      toast.error(err.message || 'Failed to claim reward')
    } finally {
      setPurchasing(null)
    }
  }

  const handleEquip = async (type, key) => {
    try {
      await economyService.equipCosmetic(user.id, type, key)
      toast.success('Cosmetic equipped!')
    } catch (err) {
      toast.error('Failed to equip cosmetic')
    }
  }

  const handleTransfer = async () => {
    const amount = parseInt(transferAmount)
    if (!transferTo.trim() || !amount || amount <= 0) {
      toast.error('Enter a valid username and amount')
      return
    }
    try {
      const { data: recipient } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', transferTo.trim())
        .maybeSingle()

      if (!recipient) {
        toast.error('User not found')
        return
      }

      await economyService.transferCoins(user.id, recipient.id, amount)
      toast.success(`Sent ${amount} coins to ${transferTo}!`)
      setShowTransfer(false)
      setTransferTo('')
      setTransferAmount('')
      const bal = await economyService.getBalance(user.id)
      setBalance(bal)
      if (updateProfile) updateProfile({ coins: bal.coins })
    } catch (err) {
      toast.error(err.message || 'Transfer failed')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  const coins = balance?.coins ?? 0
  const canClaimDaily = balance?.last_reward_date !== new Date().toISOString().split('T')[0]

  const itemIcons = {
    hint: Lightbulb,
    fifty_fifty: Eye,
    skip: SkipForward,
    double_coins: Zap,
    mystery_box: Box,
  }

  return (
    <div className="min-h-screen pb-24 md:pb-6">
      {/* Header */}
      <section className="py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <ShoppingBag className="w-6 h-6 text-primary" />
                Shop
              </h1>
              <p className="text-slate-400">Spend your coins on power-ups and cosmetics</p>
            </div>
            <div className="flex items-center gap-2 bg-gold/10 px-4 py-2 rounded-xl border border-gold/20">
              <Coins className="w-5 h-5 text-gold" />
              <span className="text-xl font-bold text-gold">{coins}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Daily Reward */}
      <section className="max-w-4xl mx-auto px-4 mb-6">
        <Card className="bg-gradient-to-r from-gold/10 to-primary/10 border-gold/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gold/20 flex items-center justify-center">
                <Gift className="w-6 h-6 text-gold" />
              </div>
              <div>
                <h3 className="font-bold text-white">Daily Reward</h3>
                <p className="text-sm text-slate-400">
                  {canClaimDaily ? 'Claim your daily coins!' : `Streak: ${balance?.streak_days || 0} days - Come back tomorrow!`}
                </p>
              </div>
            </div>
            {canClaimDaily && (
              <Button onClick={handleClaimDaily} loading={purchasing === 'daily'}>
                Claim
              </Button>
            )}
          </div>
        </Card>
      </section>

      {/* Boosters & Tokens */}
      <section className="max-w-4xl mx-auto px-4 mb-6">
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-primary" />
          Power-Ups
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {COSMETIC_ITEMS.boosters.map((item, i) => {
            const Icon = itemIcons[item.key] || Sparkles
            const owned = item.key === 'hint' ? balance?.hint_tokens :
                          item.key === 'fifty_fifty' ? balance?.fifty_fifty_tokens :
                          item.key === 'skip' ? balance?.skip_question_tokens :
                          item.key === 'mystery_box' ? balance?.mystery_boxes : 0
            return (
              <motion.div key={item.key} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Card className="h-full">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    {owned > 0 && (
                      <span className="text-xs bg-surface-light px-2 py-1 rounded-full text-slate-400">Owned: {owned}</span>
                    )}
                  </div>
                  <h3 className="font-bold text-white mb-1">{item.name}</h3>
                  <div className="flex items-center gap-1 text-gold font-bold mb-3">
                    <Coins className="w-4 h-4" />
                    {item.cost}
                  </div>
                  {item.key === 'mystery_box' && owned > 0 ? (
                    <Button size="sm" className="w-full" onClick={handleOpenMysteryBox} loading={purchasing === 'open_box'}>
                      <Box className="w-4 h-4" />
                      Open Box
                    </Button>
                  ) : (
                    <Button size="sm" className="w-full" onClick={() => handlePurchase(item)} loading={purchasing === item.key} disabled={coins < item.cost}>
                      Buy
                    </Button>
                  )}
                </Card>
              </motion.div>
            )
          })}
        </div>
      </section>

      {/* Cosmetics */}
      <section className="max-w-4xl mx-auto px-4 mb-6">
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Star className="w-5 h-5 text-secondary" />
          Cosmetics
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {COSMETIC_ITEMS.borders.map((item, i) => (
            <motion.div key={item.key} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className="h-full">
                <h3 className="font-bold text-white mb-1">{item.name}</h3>
                <p className="text-xs text-slate-500 mb-3">Avatar border</p>
                <div className="flex items-center gap-1 text-gold font-bold mb-3">
                  <Coins className="w-4 h-4" />
                  {item.cost}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" className="flex-1" onClick={() => handlePurchase(item)} disabled={coins < item.cost}>
                    Buy
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => handleEquip('border', item.key)}>
                    Equip
                  </Button>
                </div>
              </Card>
            </motion.div>
          ))}
          {COSMETIC_ITEMS.effects.map((item, i) => (
            <motion.div key={item.key} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: (i + 4) * 0.05 }}>
              <Card className="h-full">
                <h3 className="font-bold text-white mb-1">{item.name}</h3>
                <p className="text-xs text-slate-500 mb-3">Name effect</p>
                <div className="flex items-center gap-1 text-gold font-bold mb-3">
                  <Coins className="w-4 h-4" />
                  {item.cost}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" className="flex-1" onClick={() => handlePurchase(item)} disabled={coins < item.cost}>
                    Buy
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => handleEquip('effect', item.key)}>
                    Equip
                  </Button>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Transfer & Recent Transactions */}
      <section className="max-w-4xl mx-auto px-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Coins className="w-5 h-5 text-gold" />
            Recent Transactions
          </h2>
          <Button size="sm" variant="secondary" onClick={() => setShowTransfer(!showTransfer)}>
            <Send className="w-4 h-4" />
            Transfer
          </Button>
        </div>

        {showTransfer && (
          <Card className="mb-4">
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Recipient username"
                value={transferTo}
                onChange={(e) => setTransferTo(e.target.value)}
                className="w-full px-4 py-2 rounded-xl bg-surface-light border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <input
                type="number"
                placeholder="Amount"
                value={transferAmount}
                onChange={(e) => setTransferAmount(e.target.value)}
                className="w-full px-4 py-2 rounded-xl bg-surface-light border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <Button className="w-full" onClick={handleTransfer}>Send Coins</Button>
            </div>
          </Card>
        )}

        {transactions.length === 0 ? (
          <Card className="text-center py-8">
            <p className="text-slate-400">No transactions yet</p>
          </Card>
        ) : (
          <div className="space-y-2">
            {transactions.map((txn) => (
              <Card key={txn.id} className="flex items-center justify-between py-3">
                <div>
                  <div className="text-sm text-white">{txn.description}</div>
                  <div className="text-xs text-slate-500">{new Date(txn.created_at).toLocaleString()}</div>
                </div>
                <div className={`font-bold ${txn.amount > 0 ? 'text-success' : 'text-danger'}`}>
                  {txn.amount > 0 ? '+' : ''}{txn.amount}
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
