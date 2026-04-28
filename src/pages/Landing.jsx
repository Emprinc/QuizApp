import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Zap, Users, Trophy, TrendingUp, Play, ArrowRight, Sparkles } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { Button, Card, Avatar } from '../components/ui'
import { supabase } from '../lib/supabase'
import { useState, useEffect } from 'react'

export function Landing() {
  const { user, profile } = useAuth()
  const [stats, setStats] = useState({ gamesPlayed: 0, totalPlayers: 0, questionsAnswered: 0, onlinePlayers: 0 })
  const [recentGames, setRecentGames] = useState([])

  useEffect(() => {
    // Fetch user-specific stats
    if (user && profile) {
      setStats(prev => ({
        ...prev,
        gamesPlayed: profile.total_games || 0
      }))
    } else {
      setStats(prev => ({
        ...prev,
        gamesPlayed: 0
      }))
    }

    // Fetch recent games
    const fetchRecentGames = async () => {
      try {
        const { data, error } = await supabase
          .from('rooms')
          .select(`
            *,
            players:room_players(count)
          `)
          .order('created_at', { ascending: false })
          .limit(5)

        if (error) throw error
        if (data) setRecentGames(data)
      } catch (err) {
        console.error('Error fetching recent games:', err.message)
      }
    }

    // Fetch global stats
    const fetchGlobalStats = async () => {
      try {
        // Players count
        const { count: profileCount, error: profileError } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })

        if (!profileError && profileCount !== null) {
          setStats(prev => ({ ...prev, totalPlayers: profileCount }))
        }

        // Questions count
        const { count: questionCount, error: questionError } = await supabase
          .from('questions')
          .select('*', { count: 'exact', head: true })

        if (!questionError && questionCount !== null) {
          setStats(prev => ({ ...prev, questionsAnswered: questionCount }))
        }

        // Online players (last seen in last 5 minutes)
        // Ensure we use a valid timestamp that is not in the future
        const now = new Date()
        const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000).toISOString()

        const { count: onlineCount, error: onlineError } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .gt('last_seen', fiveMinutesAgo)

        if (!onlineError && onlineCount !== null) {
          setStats(prev => ({ ...prev, onlinePlayers: onlineCount }))
        }
      } catch (err) {
        console.warn('Error fetching global stats:', err.message)
      }
    }

    fetchRecentGames()
    fetchGlobalStats()
  }, [user, profile])

  const features = [
    {
      icon: Zap,
      title: 'Real-Time Battles',
      description: 'Challenge friends in live multiplayer quizzes with instant results'
    },
    {
      icon: Users,
      title: 'Multiplayer Lobby',
      description: 'Create or join game rooms and compete with up to 8 players'
    },
    {
      icon: Trophy,
      title: 'Global Leaderboard',
      description: 'Climb the ranks and prove you are the ultimate quiz master'
    },
    {
      icon: TrendingUp,
      title: 'Track Progress',
      description: 'Monitor your performance with detailed stats and achievements'
    }
  ]

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-transparent to-transparent" />
        <div className="absolute top-20 left-1/4 w-72 h-72 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-secondary/20 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-20 md:py-32">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 border border-primary/30 text-primary text-sm font-medium mb-8">
              <Sparkles className="w-4 h-4" />
              Real-time multiplayer quizzes
            </div>

            <h1 className="text-4xl md:text-6xl font-black mb-6 leading-tight">
              <span className="text-gradient">QuizBattle</span>
              <br />
              <span className="text-white">Prove Your Knowledge</span>
            </h1>

            <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto">
              Challenge friends, climb leaderboards, and become the ultimate quiz champion
              in real-time multiplayer battles.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              {user ? (
                <Link to="/lobby">
                  <Button size="xl" className="w-full sm:w-auto">
                    <Play className="w-5 h-5" />
                    Start Playing
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                </Link>
              ) : (
                <>
                  <Link to="/register">
                    <Button size="xl" className="w-full sm:w-auto">
                      <Zap className="w-5 h-5" />
                      Get Started Free
                    </Button>
                  </Link>
                  <Link to="/login">
                    <Button variant="secondary" size="xl" className="w-full sm:w-auto">
                      Sign In
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 max-w-4xl mx-auto mt-16"
          >
            {[
              { value: stats.totalPlayers.toLocaleString(), label: 'Players' },
              { value: stats.onlinePlayers.toLocaleString(), label: 'Online' },
              { value: stats.questionsAnswered.toLocaleString(), label: 'Questions' },
              { value: stats.gamesPlayed.toLocaleString(), label: 'Games Played' }
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-2xl md:text-4xl font-bold text-white">{stat.value}</div>
                <div className="text-sm text-slate-500">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <h2 className="text-3xl font-bold text-center mb-12">Everything You Need</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card hover className="h-full">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
                  <p className="text-slate-400 text-sm">{feature.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Recent Games */}
      {recentGames.length > 0 && (
        <section className="py-20 bg-surface/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <h2 className="text-3xl font-bold text-center mb-12">Recent Battles</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {recentGames.slice(0, 3).map((game, i) => (
                <motion.div
                  key={game.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Card className="text-center">
                    <div className="text-sm text-slate-500 mb-2">
                      {new Date(game.created_at).toLocaleDateString()}
                    </div>
                    <h4 className="font-bold text-white mb-2">{game.category}</h4>
                    <div className="text-3xl font-black text-gradient mb-1">
                      {game.question_count} Questions
                    </div>
                    <div className="text-sm text-slate-400">
                      {game.players?.[0]?.count || 1} players
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="bg-gradient-to-r from-primary/20 to-secondary/20 rounded-3xl p-12 border border-primary/20"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to Battle?
            </h2>
            <p className="text-slate-400 mb-8 max-w-xl mx-auto">
              Join thousands of players competing in real-time quiz battles.
              Free to play, instant matches.
            </p>
            {!user && (
              <Link to="/register">
                <Button size="xl">
                  <Zap className="w-5 h-5" />
                  Create Free Account
                </Button>
              </Link>
            )}
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center text-slate-500">
          <p>QuizBattle - Real-Time Multiplayer Quiz Game</p>
          <p className="mt-2 text-sm">Built with React + Supabase</p>
        </div>
      </footer>
    </div>
  )
}
