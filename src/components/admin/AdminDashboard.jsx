import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Users, HelpCircle, Zap, TrendingUp } from 'lucide-react'
import { adminAnalyticsUtils } from '../../lib/adminUtils'
import { Card, LoadingSpinner } from '../ui'

export function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadDashboardStats()
  }, [])

  const loadDashboardStats = async () => {
    try {
      setLoading(true)
      setError(null)

      const [gameStats, userStats] = await Promise.all([
        adminAnalyticsUtils.getGameStats(),
        adminAnalyticsUtils.getUserStats()
      ])

      setStats({
        ...gameStats,
        ...userStats
      })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <Card className="bg-red-500/10 border-red-500/20 p-6">
        <p className="text-red-400">Error loading dashboard: {error}</p>
      </Card>
    )
  }

  const statCards = [
    {
      icon: Zap,
      label: 'Total Games',
      value: stats?.totalGames || 0,
      color: 'from-primary to-secondary'
    },
    {
      icon: TrendingUp,
      label: 'Finished Games',
      value: stats?.finishedGames || 0,
      color: 'from-green-500 to-emerald-500'
    },
    {
      icon: Users,
      label: 'Total Users',
      value: stats?.totalUsers || 0,
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: HelpCircle,
      label: 'Total Questions',
      value: stats?.['?'] || 'N/A',
      color: 'from-purple-500 to-pink-500'
    }
  ]

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div>
        <h2 className="text-3xl font-bold text-white mb-2">Dashboard</h2>
        <p className="text-slate-400">Overview of QuizBattle platform metrics</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="p-6 hover:border-white/20 transition-colors">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-slate-400 text-sm font-medium mb-2">{stat.label}</p>
                    <p className="text-3xl font-bold text-white">{stat.value}</p>
                  </div>
                  <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </Card>
            </motion.div>
          )
        })}
      </div>

      {/* Quick Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Game Activity</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Playing Now</span>
              <span className="text-xl font-bold text-primary">{stats?.activeGames || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Waiting</span>
              <span className="text-xl font-bold text-secondary">{stats?.pendingGames || 0}</span>
            </div>
            <div className="h-px bg-white/5" />
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Total</span>
              <span className="text-xl font-bold text-white">{stats?.totalGames || 0}</span>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Answer Accuracy</h3>
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400 text-sm">Global Accuracy</span>
                <span className="text-xl font-bold text-primary">{stats?.accuracy || 0}%</span>
              </div>
              <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(stats?.accuracy || 0, 100)}%` }}
                />
              </div>
            </div>
            <div className="h-px bg-white/5" />
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Correct Answers</span>
              <span className="text-white font-semibold">{stats?.correctAnswers || 0}</span>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* User Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4">User Statistics</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <p className="text-slate-400 text-sm font-medium mb-2">Total Users</p>
              <p className="text-2xl font-bold text-white">{stats?.totalUsers || 0}</p>
            </div>
            <div>
              <p className="text-slate-400 text-sm font-medium mb-2">Avg Games/User</p>
              <p className="text-2xl font-bold text-primary">{stats?.avgGamesPerUser || 0}</p>
            </div>
            <div>
              <p className="text-slate-400 text-sm font-medium mb-2">Avg Score/User</p>
              <p className="text-2xl font-bold text-secondary">{stats?.avgScorePerUser || 0}</p>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  )
}
