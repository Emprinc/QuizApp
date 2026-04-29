import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Users, Plus, ArrowRightLeft, Copy, Check, Zap, Clock, Target, ChevronDown } from 'lucide-react'
import { useGame } from '../context/GameContext'
import { useAuth } from '../context/AuthContext'
import { Button, Card, Avatar, Modal } from '../components/ui'
import { CATEGORIES, QUESTION_COUNTS, TIME_OPTIONS } from '../lib/constants'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'
import { useNavigate, useLocation } from 'react-router-dom'

export function Lobby() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, profile } = useAuth()
  const { currentRoom, players, createRoom, joinRoom, leaveRoom } = useGame()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showJoinModal, setShowJoinModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [activeRooms, setActiveRooms] = useState([])
  const [copied, setCopied] = useState(false)

  const [createForm, setCreateForm] = useState({
    category: CATEGORIES[0].id,
    questionCount: 10,
    timePerQuestion: 15
  })

  const [joinCode, setJoinCode] = useState('')

  useEffect(() => {
    // Handle challenge state
    if (location.state?.challengeUser) {
      const { challengeUser } = location.state
      setShowCreateModal(true)
      toast(`Challenging ${challengeUser.username}!`, { icon: '⚔️' })
    }

    // Fetch active rooms
    fetchActiveRooms()

    // Subscribe to room updates
    const channel = supabase.channel('lobby_rooms')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'rooms',
        filter: 'status=eq.waiting'
      }, () => {
        fetchActiveRooms()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const fetchActiveRooms = async () => {
    const { data } = await supabase
      .from('rooms')
      .select(`
        *,
        host:profiles!rooms_host_id_fkey(username, avatar_url),
        players:room_players(count)
      `)
      .eq('status', 'waiting')
      .order('created_at', { ascending: false })
      .limit(20)

    if (data) {
      setActiveRooms(data)
    }
  }

  const handleCreateRoom = async () => {
    setLoading(true)
    try {
      const room = await createRoom(createForm.category, createForm.questionCount, createForm.timePerQuestion)
      if (room) {
        setShowCreateModal(false)
        toast.success('Room created!')
        navigate(`/room/${room.code}`)
      }
    } catch (error) {
      toast.error(error.message || 'Failed to create room')
    } finally {
      setLoading(false)
    }
  }

  const handleJoinRoom = async () => {
    if (!joinCode.trim()) {
      toast.error('Please enter a room code')
      return
    }

    setLoading(true)
    try {
      const room = await joinRoom(joinCode.trim())
      if (room) {
        setShowJoinModal(false)
        toast.success('Joined room!')
        navigate(`/room/${room.code}`)
      }
    } catch (error) {
      toast.error(error.message || 'Failed to join room')
    } finally {
      setLoading(false)
    }
  }

  const handleJoinFromList = async (code) => {
    setLoading(true)
    try {
      const room = await joinRoom(code)
      if (room) {
        toast.success('Joined room!')
        navigate(`/room/${room.code}`)
      }
    } catch (error) {
      toast.error(error.message || 'Failed to join room')
    } finally {
      setLoading(false)
    }
  }

  const copyInviteLink = () => {
    if (currentRoom) {
      const link = `${window.location.origin}/join/${currentRoom.code}`
      navigator.clipboard.writeText(link)
      setCopied(true)
      toast.success('Invite link copied!')
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="min-h-screen pb-24 md:pb-6">
      {/* Hero */}
      <section className="relative py-12 px-4">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-transparent to-transparent" />

        <div className="relative max-w-4xl mx-auto text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl md:text-4xl font-bold text-white mb-4"
          >
            Multiplayer Lobby
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-slate-400 mb-8"
          >
            Create a room or join an existing battle
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Button size="lg" onClick={() => setShowCreateModal(true)}>
              <Plus className="w-5 h-5" />
              Create Room
            </Button>
            <Button size="lg" variant="secondary" onClick={() => setShowJoinModal(true)}>
              <ArrowRightLeft className="w-5 h-5" />
              Join Room
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Active Rooms */}
      <section className="max-w-4xl mx-auto px-4">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          Active Rooms
        </h2>

        {activeRooms.length === 0 ? (
          <Card className="text-center py-12">
            <Users className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">No active rooms. Create one to get started!</p>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {activeRooms.map((room, i) => (
              <motion.div
                key={room.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card hover className="relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary/20 to-transparent rounded-bl-full" />

                  <div className="relative">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <Avatar username={room.host?.username} avatarUrl={room.host?.avatar_url} size="sm" />
                        <div>
                          <h3 className="font-bold text-white capitalize">{room.category}</h3>
                          <p className="text-sm text-slate-400">Host: {room.host?.username || 'Unknown'}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-black text-gradient">
                          {room.players?.[0]?.count || 1}
                        </div>
                        <div className="text-xs text-slate-500">players</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-slate-400 mb-4">
                      <span className="flex items-center gap-1">
                        <Target className="w-4 h-4" />
                        {room.question_count} Q
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {room.time_per_question}s
                      </span>
                    </div>

                    <Button
                      size="sm"
                      className="w-full"
                      onClick={() => handleJoinFromList(room.code)}
                    >
                      Join Room
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* Create Room Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create Game Room"
      >
        <div className="space-y-6">
          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Category</label>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setCreateForm({ ...createForm, category: cat.id })}
                  className={`
                    p-3 rounded-xl text-left text-sm font-medium transition-all
                    ${createForm.category === cat.id
                      ? 'bg-primary text-white'
                      : 'bg-surface-light text-slate-300 hover:bg-surface'
                    }
                  `}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Question Count */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Questions</label>
            <div className="flex gap-2">
              {QUESTION_COUNTS.map(count => (
                <button
                  key={count}
                  onClick={() => setCreateForm({ ...createForm, questionCount: count })}
                  className={`
                    flex-1 p-3 rounded-xl text-center font-bold transition-all
                    ${createForm.questionCount === count
                      ? 'bg-primary text-white'
                      : 'bg-surface-light text-slate-300 hover:bg-surface'
                    }
                  `}
                >
                  {count}
                </button>
              ))}
            </div>
          </div>

          {/* Time */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Time per Question</label>
            <div className="flex gap-2">
              {TIME_OPTIONS.map(time => (
                <button
                  key={time}
                  onClick={() => setCreateForm({ ...createForm, timePerQuestion: time })}
                  className={`
                    flex-1 p-3 rounded-xl text-center font-bold transition-all
                    ${createForm.timePerQuestion === time
                      ? 'bg-primary text-white'
                      : 'bg-surface-light text-slate-300 hover:bg-surface'
                    }
                  `}
                >
                  {time}s
                </button>
              ))}
            </div>
          </div>

          <Button
            className="w-full"
            onClick={handleCreateRoom}
            loading={loading}
          >
            <Zap className="w-5 h-5" />
            Create Room
          </Button>
        </div>
      </Modal>

      {/* Join Room Modal */}
      <Modal
        isOpen={showJoinModal}
        onClose={() => setShowJoinModal(false)}
        title="Join Game Room"
      >
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Room Code</label>
            <input
              type="text"
              placeholder="Enter 6-character code"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              maxLength={6}
              className="w-full px-4 py-3 rounded-xl bg-surface border border-surface-light text-white placeholder-slate-500 text-center text-2xl font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all uppercase"
            />
          </div>

          <Button
            className="w-full"
            onClick={handleJoinRoom}
            loading={loading}
          >
            <Users className="w-5 h-5" />
            Join Room
          </Button>
        </div>
      </Modal>
    </div>
  )
}