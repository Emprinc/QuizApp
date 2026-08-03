// Economy & gamification service — wraps all RPC calls for coins, shop, achievements, challenges.
import { supabase } from '../lib/supabase'

export const COSMETIC_ITEMS = {
  borders: [
    { key: 'bronze_border', name: 'Bronze Border', cost: 500, type: 'border' },
    { key: 'silver_border', name: 'Silver Border', cost: 1200, type: 'border' },
    { key: 'gold_border', name: 'Gold Border', cost: 2500, type: 'border' },
    { key: 'diamond_border', name: 'Diamond Border', cost: 6000, type: 'border' },
  ],
  effects: [
    { key: 'rainbow_effect', name: 'Rainbow Name', cost: 400, type: 'effect' },
    { key: 'neon_effect', name: 'Neon Name', cost: 800, type: 'effect' },
    { key: 'glow_effect', name: 'Glow Name', cost: 1200, type: 'effect' },
  ],
  boosters: [
    { key: 'hint', name: 'Hint Token', cost: 50, type: 'token' },
    { key: 'fifty_fifty', name: '50/50 Token', cost: 100, type: 'token' },
    { key: 'skip', name: 'Skip Token', cost: 150, type: 'token' },
    { key: 'double_coins', name: 'Double Coins (24h)', cost: 300, type: 'booster' },
    { key: 'mystery_box', name: 'Mystery Box', cost: 400, type: 'box' },
  ],
}

export const economyService = {
  async getBalance(userId) {
    const { data, error } = await supabase
      .from('profiles')
      .select('coins, hint_tokens, fifty_fifty_tokens, skip_question_tokens, mystery_boxes, double_coins_expires_at, active_border, active_name_effect, flair, streak_days, last_reward_date')
      .eq('id', userId)
      .maybeSingle()
    if (error) throw error
    return data
  },

  async getTransactions(userId, limit = 20) {
    const { data, error } = await supabase
      .from('coin_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)
    if (error) throw error
    return data ?? []
  },

  async purchaseItem(userId, itemKey, cost, quantity = 1) {
    const { data, error } = await supabase.rpc('purchase_item', {
      p_user_id: userId,
      p_item_key: itemKey,
      p_cost: cost,
      p_quantity: quantity,
    })
    if (error) throw error
    return data
  },

  async transferCoins(senderId, receiverId, amount) {
    const { data, error } = await supabase.rpc('transfer_coins', {
      p_sender_id: senderId,
      p_receiver_id: receiverId,
      p_amount: amount,
    })
    if (error) throw error
    return data
  },

  async openMysteryBox(userId) {
    const { data, error } = await supabase.rpc('open_mystery_box', {
      p_user_id: userId,
    })
    if (error) throw error
    return data
  },

  async claimDailyReward(userId) {
    const { data, error } = await supabase.rpc('claim_daily_reward', {
      p_user_id: userId,
    })
    if (error) throw error
    return data
  },

  async consumeToken(userId, tokenType) {
    const { data, error } = await supabase.rpc('consume_token', {
      p_user_id: userId,
      p_token_type: tokenType,
    })
    if (error) throw error
    return data
  },

  async getAchievements() {
    const { data, error } = await supabase.from('achievements').select('*').order('created_at', { ascending: true })
    if (error) throw error
    return data ?? []
  },

  async getUserAchievements(userId) {
    const { data, error } = await supabase
      .from('user_achievements')
      .select('*, achievement:achievements(*)')
      .eq('user_id', userId)
      .order('earned_at', { ascending: false })
    if (error) throw error
    return data ?? []
  },

  async getActiveChallenges() {
    const { data, error } = await supabase
      .from('challenges')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data ?? []
  },

  async getChallengeProgress(userId) {
    const { data, error } = await supabase
      .from('user_challenge_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('date', new Date().toISOString().split('T')[0])
    if (error) throw error
    return data ?? []
  },

  async updateChallengeProgress(userId, challengeId, progress) {
    const { error } = await supabase.rpc('update_challenge_progress', {
      p_user_id: userId,
      p_challenge_id: challengeId,
      p_progress: progress,
    })
    if (error) throw error
  },

  async equipCosmetic(userId, type, key) {
    const updates = type === 'border' ? { active_border: key } : { active_name_effect: key }
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
    if (error) throw error
  },

  async setFlair(userId, flair) {
    const { error } = await supabase
      .from('profiles')
      .update({ flair })
      .eq('id', userId)
    if (error) throw error
  },
}

export const gamificationService = {
  ...economyService,
}
