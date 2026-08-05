import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, Trash2, Target, Coins, Calendar } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { Card, Button, LoadingSpinner } from '../ui'
import { MATH_TOPICS } from '../../lib/constants'
import toast from 'react-hot-toast'

export function ChallengeManager() {
  const [challenges, setChallenges] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    description: '',
    topic_slug: '',
    target_count: 10,
    coin_reward: 50,
  })

  useEffect(() => {
    loadChallenges()
  }, [])

  const loadChallenges = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('challenges')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      setChallenges(data || [])
    } catch (err) {
      toast.error('Failed to load challenges')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!formData.description.trim()) {
      toast.error('Description is required')
      return
    }
    try {
      const { data, error } = await supabase
        .from('challenges')
        .insert({
          description: formData.description,
          topic_slug: formData.topic_slug || null,
          target_count: formData.target_count,
          coin_reward: formData.coin_reward,
          is_active: true,
        })
        .select()
        .single()
      if (error) throw error
      setChallenges([data, ...challenges])
      toast.success('Challenge created!')
      setFormData({ description: '', topic_slug: '', target_count: 10, coin_reward: 50 })
      setShowForm(false)
    } catch (err) {
      toast.error('Failed to create challenge')
    }
  }

  const toggleActive = async (id, currentActive) => {
    try {
      const { error } = await supabase
        .from('challenges')
        .update({ is_active: !currentActive })
        .eq('id', id)
      if (error) throw error
      setChallenges(challenges.map(c => c.id === id ? { ...c, is_active: !currentActive } : c))
    } catch (err) {
      toast.error('Failed to update challenge')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this challenge?')) return
    try {
      const { error } = await supabase.from('challenges').delete().eq('id', id)
      if (error) throw error
      setChallenges(challenges.filter(c => c.id !== id))
      toast.success('Challenge deleted')
    } catch (err) {
      toast.error('Failed to delete challenge')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white">Challenge Manager</h2>
          <p className="text-slate-400 mt-1">Create daily challenges for students</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4" />
          New Challenge
        </Button>
      </div>

      {showForm && (
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Create New Challenge</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500"
                  placeholder="e.g., Answer 10 fractions questions correctly"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Topic (optional)</label>
                  <select
                    value={formData.topic_slug}
                    onChange={(e) => setFormData({ ...formData, topic_slug: e.target.value })}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
                  >
                    <option value="">Any topic</option>
                    {MATH_TOPICS.map(slug => (
                      <option key={slug} value={slug}>{slug.replace(/_/g, ' ')}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Target Count</label>
                  <input
                    type="number"
                    value={formData.target_count}
                    onChange={(e) => setFormData({ ...formData, target_count: parseInt(e.target.value) || 10 })}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Coin Reward</label>
                  <input
                    type="number"
                    value={formData.coin_reward}
                    onChange={(e) => setFormData({ ...formData, coin_reward: parseInt(e.target.value) || 50 })}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
                    min="1"
                  />
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg border border-white/10 text-slate-300 hover:bg-white/5">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-white font-medium">Create</button>
              </div>
            </form>
          </Card>
        </motion.div>
      )}

      {challenges.length === 0 ? (
        <Card className="text-center py-12">
          <Target className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400">No challenges yet. Create one to engage your students!</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {challenges.map((ch, i) => (
            <motion.div key={ch.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className="flex items-center justify-between p-4">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${ch.is_active ? 'bg-primary/20' : 'bg-slate-700/20'}`}>
                    <Target className={`w-5 h-5 ${ch.is_active ? 'text-primary' : 'text-slate-500'}`} />
                  </div>
                  <div>
                    <div className="font-bold text-white">{ch.description}</div>
                    <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                      {ch.topic_slug && <span className="capitalize">{ch.topic_slug.replace(/_/g, ' ')}</span>}
                      <span className="flex items-center gap-1"><Target className="w-3 h-3" /> {ch.target_count} target</span>
                      <span className="flex items-center gap-1"><Coins className="w-3 h-3 text-gold" /> {ch.coin_reward} coins</span>
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(ch.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleActive(ch.id, ch.is_active)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold ${ch.is_active ? 'bg-success/20 text-success' : 'bg-slate-700/20 text-slate-400'}`}
                  >
                    {ch.is_active ? 'Active' : 'Inactive'}
                  </button>
                  <button onClick={() => handleDelete(ch.id)} className="p-2 rounded-lg hover:bg-danger/10 text-slate-400 hover:text-danger">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
