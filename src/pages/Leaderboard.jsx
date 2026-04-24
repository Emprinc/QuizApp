import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Trophy, TrendingUp, Clock, Medal, ChevronLeft, ChevronRight } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { Card, Avatar, EmptyState, LoadingSpinner, Button } from '../components/ui'
import { supabase } from '../lib/supabase'
import { getRankColor } from '../lib/constants'

export function Leaderboard() {
  const { user, profile } = useAuth()
  const [rankings, setRankings] = useState([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('all')
  const [page, setPage] = useState(1)
  const limit = 20

  useEffect(() => {
    fetchRankings()
  }, [period])

  const fetchRankings = async () => {
    setLoading(true)

    let query = supabase
      .from('profiles')
      .select('*')
      .order('total_score', { ascending: false })
      .range((page - 1) * limit, page * limit)

    if (period === 'daily' || period === 'weekly') {
      // For demo purposes, show all-time since we don't track period-specific scores
      query = supabase
        .from('profiles')
        .select('*')
        .order('total_score', { ascending: false })
        .range((page - 1) * limit, page * limit)
    }

    const { data, error } = await query

    if (data) {
      setRankings(data)
    }

    setLoading(false)
  }

  const userRank = rankings.findIndex(r => r.id === user?.id) + 1 + (page - 1) * limit

  return (
    <div className="min-h-screen pb-24 md:pb-6">
      {/* Hero */}
      <section className="relative py-12 px-4">
        <div className="absolute inset-0 bg-gradient-to-b from-gold/10 via-transparent to-transparent" />

        <div className="relative max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-gold to-amber-500 mb-6"
          >
            <Trophy className="w-10 h-10 text-white" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-3xl md:text-4xl font-bold text-white mb-2"
          >
            Leaderboard
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-slate-400"
          >
            Top quiz warriors worldwide
          </motion.p>
        </div>
      </section>

      {/* User's Rank Card */}
      {user && profile && (
        <section className="max-w-4xl mx-auto px-4 mb-6">
          <Card className="bg-gradient-to-r from-primary/20 to-secondary/20 border-primary/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold"
                  style={{ backgroundColor: getRankColor(userRank), color: userRank > 3 ? '#0F172A' : '#FFF' }}
                >
                  {userRank}
                </div>
                <div>
                  <div className="font-bold text-white">Your Ranking</div>
                  <div className="text-sm text-slate-400">{profile.username}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gradient">{profile.total_score.toLocaleString()}</div>
                <div className="text-sm text-slate-400">points</div>
              </div>
            </div>
          </Card>
        </section>
      )}

      {/* Period Filter */}
      <section className="max-w-4xl mx-auto px-4 mb-6">
        <div className="flex items-center justify-center gap-2">
          {['daily', 'weekly', 'all'].map(p => (
            <button
              key={p}
              onClick={() => { setPeriod(p); setPage(1); }}
              className={`
                px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize
                ${period === p
                  ? 'bg-primary text-white'
                  : 'bg-surface-light text-slate-400 hover:text-white'
                }
              `}
            >
              {p}
            </button>
          ))}
        </div>
      </section>

      {/* Rankings List */}
      <section className="max-w-4xl mx-auto px-4">
        {loading ? (
          <div className="py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : rankings.length === 0 ? (
          <EmptyState
            icon={Trophy}
            title="No rankings yet"
            description="Be the first to climb the leaderboard!"
          />
        ) : (
          <>
            <div className="space-y-3">
              {rankings.map((player, index) => (
                <motion.div
                  key={player.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                >
                  <Card
                    hover={player.id !== user?.id}
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
                        {index + 1 + (page - 1) * limit <= 3 ? (
                          <Medal className="w-5 h-5" />
                        ) : (
                          index + 1 + (page - 1) * limit
                        )}
                      </div>

                      <Avatar username={player.username} size="md" />

                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-white truncate">
                          {player.username}
                          {player.id === user?.id && (
                            <span className="ml-2 text-xs text-primary">(You)</span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-slate-400">
                          <span>{player.total_games || 0} games</span>
                          <span>{player.total_wins || 0} wins</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-xl font-bold text-gradient">
                          {player.total_score?.toLocaleString() || 0}
                        </div>
                        <div className="text-xs text-slate-500">points</div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-center gap-4 mt-8">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-slate-400">Page {page}</span>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPage(p => p + 1)}
                disabled={rankings.length < limit}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </>
        )}
      </section>
    </div>
  )
}
