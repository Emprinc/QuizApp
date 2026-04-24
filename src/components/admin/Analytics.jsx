import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts'
import { adminAnalyticsUtils } from '../../lib/adminUtils'
import { Card, LoadingSpinner } from '../ui'
import toast from 'react-hot-toast'

const COLORS = ['#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#3B82F6', '#EC4899']

export function Analytics() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadAnalytics()
  }, [])

  const loadAnalytics = async () => {
    try {
      setLoading(true)
      setError(null)

      const [gameStats, categoryStats, difficultyStats, topQuestions, userStats] = await Promise.all([
        adminAnalyticsUtils.getGameStats(),
        adminAnalyticsUtils.getCategoryStats(),
        adminAnalyticsUtils.getDifficultyStats(),
        adminAnalyticsUtils.getTopQuestions(10),
        adminAnalyticsUtils.getUserStats()
      ])

      setStats({
        gameStats,
        categoryStats,
        difficultyStats,
        topQuestions,
        userStats
      })
    } catch (err) {
      setError(err.message)
      toast.error('Failed to load analytics')
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

  if (error || !stats) {
    return (
      <Card className="bg-red-500/10 border-red-500/20 p-6">
        <p className="text-red-400">Error loading analytics: {error}</p>
      </Card>
    )
  }

  const gameDistributionData = [
    { name: 'Playing', value: stats.gameStats.activeGames, fill: COLORS[0] },
    { name: 'Waiting', value: stats.gameStats.pendingGames, fill: COLORS[1] },
    { name: 'Finished', value: stats.gameStats.finishedGames, fill: COLORS[2] }
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-white">Analytics</h2>
        <p className="text-slate-400 mt-1">QuizBattle platform analytics and insights</p>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="p-6">
            <p className="text-slate-400 text-sm font-medium mb-2">Accuracy Rate</p>
            <p className="text-4xl font-bold text-primary mb-2">{stats.gameStats.accuracy}%</p>
            <p className="text-xs text-slate-500">Global average</p>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-6">
            <p className="text-slate-400 text-sm font-medium mb-2">Total Games</p>
            <p className="text-4xl font-bold text-secondary mb-2">{stats.gameStats.totalGames}</p>
            <p className="text-xs text-slate-500">{stats.gameStats.finishedGames} completed</p>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="p-6">
            <p className="text-slate-400 text-sm font-medium mb-2">Active Users</p>
            <p className="text-4xl font-bold text-emerald-400 mb-2">{stats.userStats.totalUsers}</p>
            <p className="text-xs text-slate-500">Registered players</p>
          </Card>
        </motion.div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Questions by Category</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.categoryStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="category" stroke="rgba(255,255,255,0.5)" />
                <YAxis stroke="rgba(255,255,255,0.5)" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1E293B',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="count" fill={COLORS[0]} radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </motion.div>

        {/* Difficulty Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Questions by Difficulty</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stats.difficultyStats}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ difficulty, count }) => `${difficulty}: ${count}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {stats.difficultyStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1E293B',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </motion.div>

        {/* Game Status Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Game Status</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={gameDistributionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {gameDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1E293B',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </motion.div>

        {/* User Engagement */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4">User Engagement</h3>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-400">Avg Games per User</span>
                  <span className="text-lg font-bold text-primary">{stats.userStats.avgGamesPerUser}</span>
                </div>
                <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-secondary rounded-full"
                    style={{ width: `${Math.min((stats.userStats.avgGamesPerUser / 100) * 100, 100)}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-400">Avg Score per User</span>
                  <span className="text-lg font-bold text-secondary">{stats.userStats.avgScorePerUser}</span>
                </div>
                <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-secondary to-primary rounded-full"
                    style={{ width: `${Math.min((stats.userStats.avgScorePerUser / 10000) * 100, 100)}%` }}
                  />
                </div>
              </div>

              <div className="h-px bg-white/5" />

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-slate-400 mb-1">Total Users</p>
                  <p className="text-2xl font-bold text-white">{stats.userStats.totalUsers}</p>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Top Questions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Top Performing Questions</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left py-2 px-2 font-semibold text-slate-300">Question ID</th>
                  <th className="text-right py-2 px-2 font-semibold text-slate-300">Accuracy</th>
                  <th className="text-right py-2 px-2 font-semibold text-slate-300">Answered</th>
                </tr>
              </thead>
              <tbody>
                {stats.topQuestions.slice(0, 5).map((q, idx) => (
                  <tr key={idx} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="py-2 px-2 text-white font-mono text-xs">{q.id?.slice(0, 8)}...</td>
                    <td className="py-2 px-2 text-right">
                      <span className="inline-flex items-center justify-center px-2 py-1 rounded bg-primary/20 text-primary text-xs font-semibold">
                        {q.accuracy}%
                      </span>
                    </td>
                    <td className="py-2 px-2 text-right text-slate-400">{q.total_answers}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </motion.div>
    </div>
  )
}
