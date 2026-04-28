import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { User, Trophy, Target, Zap, Edit2, Save, LogOut, History, ChevronRight, Trash2, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { Card, Avatar, Button, Input, LoadingSpinner } from '../components/ui'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

export function Profile() {
  const { user, profile, signOut, updateProfile } = useAuth()
  const [editing, setEditing] = useState(false)
  const [username, setUsername] = useState(profile?.username || '')
  const [saving, setSaving] = useState(false)
  const [history, setHistory] = useState([])
  const [loadingHistory, setLoadingHistory] = useState(true)
  const [selectedGame, setSelectedGame] = useState(null)
  const [gameDetails, setGameDetails] = useState([])
  const [loadingDetails, setLoadingDetails] = useState(false)

  const handleSave = async () => {
    if (!username.trim()) {
      toast.error('Username cannot be empty')
      return
    }

    setSaving(true)
    try {
      await updateProfile({ username: username.trim() })
      toast.success('Profile updated!')
      setEditing(false)
    } catch (error) {
      toast.error(error.message || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      toast.error('Failed to sign out')
    }
  }

  useEffect(() => {
    if (user) {
      fetchHistory()
    }
  }, [user])

  const fetchHistory = async () => {
    try {
      setLoadingHistory(true)
      const { data, error } = await supabase
        .from('room_players')
        .select(`
          room_id,
          score,
          answers_correct,
          joined_at,
          room:rooms(code, category, question_count, status)
        `)
        .eq('player_id', user.id)
        .order('joined_at', { ascending: false })
        .limit(10)

      if (error) throw error
      setHistory(data || [])
    } catch (err) {
      console.error('Error fetching history:', err)
    } finally {
      setLoadingHistory(false)
    }
  }

  const handleViewGame = async (game) => {
    try {
      setLoadingDetails(true)
      setSelectedGame(game)

      const { data, error } = await supabase
        .from('player_answers')
        .select('*, question:questions(*)')
        .eq('room_id', game.room_id)
        .eq('player_id', user.id)

      if (error) throw error
      setGameDetails(data || [])
    } catch (err) {
      toast.error('Failed to load game details')
    } finally {
      setLoadingDetails(false)
    }
  }

  const handleDeleteHistory = async (roomId) => {
    if (!window.confirm('Are you sure you want to delete this game record?')) return

    try {
      const { error } = await supabase
        .from('room_players')
        .delete()
        .eq('room_id', roomId)
        .eq('player_id', user.id)

      if (error) throw error

      setHistory(history.filter(h => h.room_id !== roomId))
      toast.success('Record deleted')
    } catch (err) {
      toast.error('Failed to delete record')
    }
  }

  const clearAllHistory = async () => {
    if (!window.confirm('Are you sure you want to clear ALL your game history?')) return

    try {
      const { error } = await supabase
        .from('room_players')
        .delete()
        .eq('player_id', user.id)

      if (error) throw error

      setHistory([])
      toast.success('All history cleared')
    } catch (err) {
      toast.error('Failed to clear history')
    }
  }

  const stats = [
    {
      icon: Trophy,
      label: 'Total Score',
      value: profile?.total_score?.toLocaleString() || '0',
      color: 'text-gold'
    },
    {
      icon: Target,
      label: 'Games Played',
      value: profile?.total_games?.toLocaleString() || '0',
      color: 'text-primary'
    },
    {
      icon: Zap,
      label: 'Wins',
      value: profile?.total_wins?.toLocaleString() || '0',
      color: 'text-success'
    }
  ]

  return (
    <div className="min-h-screen pb-24 md:pb-6">
      {/* Profile Header */}
      <section className="relative py-12 px-4">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-transparent to-transparent" />

        <div className="relative max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="relative inline-block mb-6">
              <Avatar username={profile?.username} avatarUrl={profile?.avatar_url} size="xl" />
              {editing && (
                <label className="absolute bottom-0 right-0 w-10 h-10 rounded-full bg-primary flex items-center justify-center cursor-pointer hover:bg-primary/90 transition-colors">
                  <Edit2 className="w-5 h-5 text-white" />
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0]
                      if (!file) return

                      if (file.size > 2 * 1024 * 1024) {
                        toast.error('Image size must be less than 2MB')
                        return
                      }

                      const reader = new FileReader()
                      reader.onloadend = async () => {
                        try {
                          setSaving(true)
                          const dataUrl = reader.result
                          await updateProfile({ avatar_url: dataUrl })
                          toast.success('Avatar updated!')
                        } catch (err) {
                          toast.error('Failed to update avatar')
                        } finally {
                          setSaving(false)
                        }
                      }
                      reader.readAsDataURL(file)
                    }}
                  />
                </label>
              )}
            </div>

            {editing ? (
              <div className="max-w-xs mx-auto mb-4">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-surface border border-surface-light text-white text-center text-xl font-bold focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                />
              </div>
            ) : (
              <h1 className="text-2xl font-bold text-white mb-2">{profile?.username}</h1>
            )}

            <p className="text-slate-400">{user?.email}</p>

            <div className="flex items-center justify-center gap-4 mt-4">
              {editing ? (
                <>
                  <Button onClick={handleSave} loading={saving}>
                    <Save className="w-4 h-4" />
                    Save
                  </Button>
                  <Button variant="ghost" onClick={() => { setEditing(false); setUsername(profile?.username || ''); }}>
                    Cancel
                  </Button>
                </>
              ) : (
                <Button variant="secondary" onClick={() => setEditing(true)}>
                  <Edit2 className="w-4 h-4" />
                  Edit Profile
                </Button>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="max-w-2xl mx-auto px-4 mb-6">
        <h2 className="text-lg font-bold text-white mb-4">Statistics</h2>
        <div className="grid grid-cols-3 gap-4">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="text-center">
                <div className={`w-10 h-10 rounded-xl bg-surface-light flex items-center justify-center mx-auto mb-3 ${stat.color}`}>
                  <stat.icon className="w-5 h-5" />
                </div>
                <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
                <div className="text-sm text-slate-400">{stat.label}</div>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Achievement Preview */}
      <section className="max-w-2xl mx-auto px-4 mb-6">
        <h2 className="text-lg font-bold text-white mb-4">Achievements</h2>
        <Card>
          <div className="flex items-center gap-4 text-slate-400">
            <Trophy className="w-8 h-8 text-gold" />
            <div>
              <div className="font-medium text-white">No achievements yet</div>
              <div className="text-sm">Play games to unlock achievements!</div>
            </div>
          </div>
        </Card>
      </section>

      {/* Game History */}
      <section className="max-w-2xl mx-auto px-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <History className="w-5 h-5 text-primary" />
            Recent Games
          </h2>
          {history.length > 0 && (
            <button
              onClick={clearAllHistory}
              className="text-xs text-slate-500 hover:text-danger transition-colors"
            >
              Clear All
            </button>
          )}
        </div>

        {loadingHistory ? (
          <div className="py-8">
            <LoadingSpinner size="md" />
          </div>
        ) : history.length === 0 ? (
          <Card className="text-center py-8">
            <p className="text-slate-400">No games played yet</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {history.map((game, i) => (
              <Card
                key={i}
                hover
                onClick={() => handleViewGame(game)}
                className="group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-surface-light flex items-center justify-center">
                      <Zap className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <div className="font-bold text-white uppercase">{game.room?.category}</div>
                      <div className="text-xs text-slate-500">
                        {new Date(game.joined_at).toLocaleDateString()} • {game.room?.question_count} Questions
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-lg font-bold text-gradient">{game.score}</div>
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider">Points</div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-white transition-colors" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Game Details Modal */}
      <AnimatePresence>
        {selectedGame && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-surface rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col border border-white/10"
            >
              <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white uppercase">{selectedGame.room?.category}</h3>
                  <p className="text-sm text-slate-400">Played on {new Date(selectedGame.joined_at).toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDeleteHistory(selectedGame.room_id)}
                    className="p-2 rounded-lg hover:bg-danger/20 text-slate-400 hover:text-danger transition-colors"
                    title="Delete record"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setSelectedGame(null)}
                    className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <Card className="bg-surface-light border-none text-center p-4">
                    <div className="text-2xl font-bold text-white">{selectedGame.score}</div>
                    <div className="text-xs text-slate-400 uppercase tracking-widest mt-1">Total Score</div>
                  </Card>
                  <Card className="bg-surface-light border-none text-center p-4">
                    <div className="text-2xl font-bold text-success">
                      {selectedGame.answers_correct}/{selectedGame.room?.question_count}
                    </div>
                    <div className="text-xs text-slate-400 uppercase tracking-widest mt-1">Accuracy</div>
                  </Card>
                </div>

                <div className="space-y-4">
                  <h4 className="font-bold text-white text-sm uppercase tracking-widest">Question Breakdown</h4>
                  {loadingDetails ? (
                    <div className="py-12 flex justify-center">
                      <LoadingSpinner />
                    </div>
                  ) : gameDetails.length === 0 ? (
                    <p className="text-center text-slate-500 py-8 italic">No answer data available for this session</p>
                  ) : (
                    gameDetails.map((item, idx) => (
                      <div key={item.id} className="p-4 rounded-xl bg-surface-light/50 border border-white/5">
                        <div className="flex items-start gap-3 mb-3">
                          <div className={`w-6 h-6 rounded flex items-center justify-center shrink-0 text-xs font-bold ${item.is_correct ? 'bg-success/20 text-success' : 'bg-danger/20 text-danger'}`}>
                            {idx + 1}
                          </div>
                          <p className="text-sm font-medium text-white">{item.question?.question_text}</p>
                        </div>
                        <div className="pl-9 space-y-2">
                          <div className="text-xs flex items-center gap-2">
                            <span className="text-slate-500">Your answer:</span>
                            <span className={item.is_correct ? 'text-success font-medium' : 'text-danger font-medium'}>
                              {item.question?.options[item.answer]}
                            </span>
                          </div>
                          {!item.is_correct && (
                            <div className="text-xs flex items-center gap-2">
                              <span className="text-slate-500">Correct answer:</span>
                              <span className="text-success font-medium">
                                {item.question?.options[item.question.correct_answer]}
                              </span>
                            </div>
                          )}
                          {item.question?.explanation && (
                            <div className="mt-2 text-[11px] text-slate-400 leading-relaxed bg-black/20 p-2 rounded">
                              {item.question.explanation}
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Settings */}
      <section className="max-w-2xl mx-auto px-4">
        <h2 className="text-lg font-bold text-white mb-4">Account</h2>
        <Card>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 p-4 rounded-xl hover:bg-surface-light transition-colors text-danger"
          >
            <LogOut className="w-5 h-5" />
            <span>Sign Out</span>
          </button>
        </Card>
      </section>

      {/* Footer */}
      <footer className="max-w-2xl mx-auto px-4 py-8 text-center text-slate-500 text-sm">
        <p>QuizBattle v1.0.0</p>
        <p className="mt-1">Built with React + Supabase</p>
      </footer>
    </div>
  )
}