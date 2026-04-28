import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, Medal, ChevronLeft, ChevronRight, History, Users, Star, Clock, Zap, Target } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { Card, Avatar, EmptyState, LoadingSpinner, Button } from '../components/ui'
import { supabase } from '../lib/supabase'
import { getRankColor } from '../lib/constants'

export function Leaderboard() {
  const { user, profile } = useAuth()
  const [rankings, setRankings] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('rankings')
  const [period, setPeriod] = useState('all')
  const [page, setPage] = useState(1)
  const [userGlobalRank, setUserGlobalRank] = useState(0)
  const [gameHistory, setGameHistory] = useState([])
  const [friends, setFriends] = useState([])
  const limit = 20

  useEffect(() => {
    if (activeTab === 'rankings') {
      fetchRankings()
    } else if (activeTab === 'history' && user) {
      fetchHistory()
    } else if (activeTab === 'friends' && user) {
      fetchFriends()
    }

    if (user) {
      fetchUserRank()
    }
  }, [activeTab, period, page])

  const fetchUserRank = async () => {
    const { data, error } = await supabase.rpc('get_user_rank', { p_user_id: user.id })
    if (!error && data) {
      setUserGlobalRank(data)
    }
  }

  const fetchRankings = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('profiles')
        .select('*')

      if (period === 'weekly') {
        query = query.order('weekly_score', { ascending: false })
      } else if (period === 'monthly') {
        query = query.order('monthly_score', { ascending: false })
      } else {
        query = query.order('total_score', { ascending: false })
      }

      const { data, error } = await query.range((page - 1) * limit, page * limit - 1)
      if (data) setRankings(data)
    } catch (err) {
      console.error('Error fetching rankings:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchHistory = async () => {
    setLoading(true)
    try {
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
        .limit(20)

      if (data) setGameHistory(data)
    } catch (err) {
      console.error('Error fetching history:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchFriends = async () => {
    setLoading(true)
    try {
      const { data: friendsData } = await supabase
        .from('friendships')
        .select('sender_id, receiver_id')
        .eq('status', 'accepted')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)

      const friendIds = friendsData ? friendsData.map(f =>
        f.sender_id === user.id ? f.receiver_id : f.sender_id
      ) : []

      if (friendIds.length > 0) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .in('id', friendIds)
          .order('total_score', { ascending: false })
        setFriends(data || [])
      } else {
        setFriends([])
      }
    } catch (err) {
      console.error('Error fetching friends:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen pb-24 md:pb-6">
      {/* Hero */}
      <section className="relative py-12 px-4">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-transparent to-transparent" />
        <div className="relative max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-primary to-secondary mb-6"
          >
            <Trophy className="w-10 h-10 text-white" />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-3xl md:text-4xl font-bold text-white mb-2"
          >
            Leaderboard & Activity
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-slate-400"
          >
            Track your progress and compete with the best
          </motion.p>
        </div>
      </section>

      {/* Stats Summary */}
      {user && profile && (
        <section className="max-w-4xl mx-auto px-4 mb-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-surface-light border-none p-4 text-center">
              <div className="text-2xl font-bold text-primary">{userGlobalRank || '-'}</div>
              <div className="text-xs text-slate-500 uppercase tracking-widest mt-1">Global Rank</div>
            </Card>
            <Card className="bg-surface-light border-none p-4 text-center">
              <div className="text-2xl font-bold text-gradient">{profile.total_score.toLocaleString()}</div>
              <div className="text-xs text-slate-500 uppercase tracking-widest mt-1">Total Points</div>
            </Card>
            <Card className="bg-surface-light border-none p-4 text-center">
              <div className="text-2xl font-bold text-white">{profile.total_games || 0}</div>
              <div className="text-xs text-slate-500 uppercase tracking-widest mt-1">Games Played</div>
            </Card>
            <Card className="bg-surface-light border-none p-4 text-center">
              <div className="text-2xl font-bold text-success">{profile.total_wins || 0}</div>
              <div className="text-xs text-slate-500 uppercase tracking-widest mt-1">Wins</div>
            </Card>
          </div>
        </section>
      )}

      {/* Tabs */}
      <section className="max-w-4xl mx-auto px-4 mb-6">
        <div className="flex items-center justify-center gap-2 p-1 bg-surface-light rounded-xl max-w-md mx-auto">
          {[
            { id: 'rankings', label: 'Rankings', icon: Star },
            { id: 'history', label: 'History', icon: History },
            { id: 'friends', label: 'Friends', icon: Users }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setPage(1); }}
              className={`
                flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all
                ${activeTab === tab.id
                  ? 'bg-primary text-white shadow-lg shadow-primary/20'
                  : 'text-slate-400 hover:text-white'
                }
              `}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </section>

      {/* Tab Content */}
      <section className="max-w-4xl mx-auto px-4">
        {activeTab === 'rankings' && (
          <div className="space-y-6">
            <div className="flex items-center justify-center gap-2">
              {['all', 'weekly', 'monthly'].map(p => (
                <button
                  key={p}
                  onClick={() => { setPeriod(p); setPage(1); }}
                  className={`
                    px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all
                    ${period === p
                      ? 'bg-primary/20 text-primary border border-primary/30'
                      : 'bg-surface-light text-slate-500 hover:text-white border border-transparent'
                    }
                  `}
                >
                  {p}
                </button>
              ))}
            </div>

            {loading ? <div className="py-12"><LoadingSpinner size="lg" /></div> : (
              <div className="space-y-3">
                {rankings.map((player, index) => (
                  <motion.div
                    key={player.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card
                      className={`
                        ${player.id === user?.id ? 'border-primary/50 bg-primary/10' : ''}
                      `}
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg"
                          style={{
                            backgroundColor: getRankColor(index + 1 + (page - 1) * limit),
                            color: index + 1 > 3 ? '#0F172A' : '#FFF'
                          }}
                        >
                          {index + 1 + (page - 1) * limit <= 3 ? <Medal className="w-5 h-5" /> : index + 1 + (page - 1) * limit}
                        </div>
                        <Avatar username={player.username} avatarUrl={player.avatar_url} size="md" />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-white truncate">{player.username} {player.id === user?.id && <span className="text-xs text-primary">(You)</span>}</div>
                          <div className="text-xs text-slate-400">{player.total_games || 0} games • {player.total_wins || 0} wins</div>
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-bold text-gradient">
                            {period === 'weekly' ? (player.weekly_score || 0).toLocaleString() :
                             period === 'monthly' ? (player.monthly_score || 0).toLocaleString() :
                             (player.total_score || 0).toLocaleString()}
                          </div>
                          <div className="text-[10px] text-slate-500 uppercase font-bold">points</div>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}

                {/* Pagination */}
                <div className="flex items-center justify-center gap-4 mt-8">
                  <Button variant="secondary" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-slate-400 text-sm">Page {page}</span>
                  <Button variant="secondary" size="sm" onClick={() => setPage(p => p + 1)} disabled={rankings.length < limit}>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-4">
            {loading ? <LoadingSpinner size="lg" /> : gameHistory.length === 0 ? (
              <EmptyState icon={History} title="No games yet" description="Start playing to see your history here!" />
            ) : (
              gameHistory.map((game, i) => (
                <motion.div
                  key={game.room_id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Zap className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <div className="font-bold text-white uppercase text-sm">{game.room?.category}</div>
                          <div className="text-xs text-slate-500">
                            {new Date(game.joined_at).toLocaleDateString()} • {game.room?.question_count} Q
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-gradient">{game.score}</div>
                        <div className="text-[10px] text-slate-500 uppercase font-bold">Points</div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))
            )}
          </div>
        )}

        {activeTab === 'friends' && (
          <div className="space-y-4">
            {loading ? <LoadingSpinner size="lg" /> : friends.length === 0 ? (
              <EmptyState icon={Users} title="No friends yet" description="Add friends to compete with them on the leaderboard!" />
            ) : (
              friends.map((friend, i) => (
                <motion.div
                  key={friend.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card>
                    <div className="flex items-center gap-4">
                      <Avatar username={friend.username} avatarUrl={friend.avatar_url} size="md" />
                      <div className="flex-1">
                        <div className="font-bold text-white">{friend.username}</div>
                        <div className="text-xs text-slate-400">{friend.total_score.toLocaleString()} total points</div>
                      </div>
                      <div className="text-right">
                        <div className="text-success font-bold">{friend.total_wins} wins</div>
                        <div className="text-xs text-slate-500">{friend.total_games} games</div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))
            )}
          </div>
        )}
      </section>
    </div>
  )
}
