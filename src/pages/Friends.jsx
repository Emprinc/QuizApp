import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Users, UserPlus, Check, X, Clock, Sword, Trophy } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { Card, Avatar, Button, EmptyState, LoadingSpinner, Modal, Input } from '../components/ui'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

export function Friends() {
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const [friends, setFriends] = useState([])
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [searchEmail, setSearchEmail] = useState('')
  const [searching, setSearching] = useState(false)
  const [searchResult, setSearchResult] = useState(null)

  useEffect(() => {
    if (user) {
      fetchFriends()
      fetchRequests()
    }
  }, [user])

  const fetchFriends = async () => {
    const { data } = await supabase
      .from('friendships')
      .select(`
        *,
        sender:profiles!friendships_sender_id_fkey(*),
        receiver:profiles!friendships_receiver_id_fkey(*)
      `)
      .or(`sender_id.eq.${user?.id},receiver_id.eq.${user?.id}`)
      .eq('status', 'accepted')

    if (data) {
      const friendList = data.map(f => {
        const friend = f.sender_id === user?.id ? f.receiver : f.sender
        return { ...friend, friendshipId: f.id }
      })
      setFriends(friendList)
    }
    setLoading(false)
  }

  const fetchRequests = async () => {
    const { data } = await supabase
      .from('friendships')
      .select(`
        *,
        sender:profiles!friendships_sender_id_fkey(*)
      `)
      .eq('receiver_id', user?.id)
      .eq('status', 'pending')

    if (data) {
      setRequests(data.map(r => ({ ...r.sender, friendshipId: r.id })))
    }
  }

  const handleSearch = async () => {
    if (!searchEmail.trim()) return

    setSearching(true)
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', searchEmail.trim())
      .single()

    if (data && data.id !== user?.id) {
      setSearchResult(data)
    } else if (data && data.id === user?.id) {
      toast.error("That's you!")
      setSearchResult(null)
    } else {
      toast.error('User not found')
      setSearchResult(null)
    }
    setSearching(false)
  }

  const handleSendRequest = async () => {
    if (!searchResult) return

    const { error } = await supabase
      .from('friendships')
      .insert([{
        sender_id: user?.id,
        receiver_id: searchResult.id,
        status: 'pending'
      }])

    if (error) {
      toast.error('Failed to send friend request')
    } else {
      toast.success('Friend request sent!')
      setSearchResult(null)
      setSearchEmail('')
      setShowAddModal(false)
    }
  }

  const handleAcceptRequest = async (friendshipId) => {
    const { error } = await supabase
      .from('friendships')
      .update({ status: 'accepted' })
      .eq('id', friendshipId)

    if (!error) {
      toast.success('Friend added!')
      fetchFriends()
      fetchRequests()
    }
  }

  const handleRejectRequest = async (friendshipId) => {
    const { error } = await supabase
      .from('friendships')
      .delete()
      .eq('id', friendshipId)

    if (!error) {
      fetchRequests()
    }
  }

  const handleRemoveFriend = async (friendshipId) => {
    const { error } = await supabase
      .from('friendships')
      .delete()
      .eq('id', friendshipId)

    if (!error) {
      toast.success('Friend removed')
      fetchFriends()
    }
  }

  return (
    <div className="min-h-screen pb-24 md:pb-6">
      {/* Header */}
      <section className="py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Friends</h1>
              <p className="text-slate-400">{friends.length} friends</p>
            </div>
            <Button onClick={() => setShowAddModal(true)}>
              <UserPlus className="w-4 h-4" />
              Add Friend
            </Button>
          </div>
        </div>
      </section>

      {/* Pending Requests */}
      {requests.length > 0 && (
        <section className="max-w-4xl mx-auto px-4 mb-6">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-gold" />
            Pending Requests
          </h2>
          <div className="space-y-3">
            {requests.map(request => (
              <Card key={request.id}>
                <div className="flex items-center gap-4">
                  <Avatar username={request.username} size="md" />
                  <div className="flex-1">
                    <div className="font-medium text-white">{request.username}</div>
                  </div>
                  <Button size="sm" onClick={() => handleAcceptRequest(request.friendshipId)}>
                    <Check className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => handleRejectRequest(request.friendshipId)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Friends List */}
      <section className="max-w-4xl mx-auto px-4">
        {loading ? (
          <div className="py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : friends.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No friends yet"
            description="Add friends to challenge them in quizzes!"
            action={
              <Button onClick={() => setShowAddModal(true)}>
                <UserPlus className="w-4 h-4" />
                Add Friend
              </Button>
            }
          />
        ) : (
          <div className="space-y-3">
            {friends.map((friend, i) => (
              <motion.div
                key={friend.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="group">
                  <div className="flex items-center gap-4">
                    <Avatar username={friend.username} size="md" showStatus status="online" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-white truncate">{friend.username}</div>
                      <div className="flex items-center gap-4 text-sm text-slate-400">
                        <span>{friend.total_games || 0} games</span>
                        {friend.total_wins > 0 && (
                          <span className="flex items-center gap-1">
                            <Trophy className="w-3 h-3 text-gold" />
                            {friend.total_wins} wins
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => navigate('/lobby', { state: { challengeUser: friend } })}
                      >
                        <Sword className="w-4 h-4" />
                        Challenge
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleRemoveFriend(friend.friendshipId)}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* Add Friend Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => { setShowAddModal(false); setSearchResult(null); setSearchEmail(''); }}
        title="Add Friend"
      >
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Email Address</label>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="friend@email.com"
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
                className="flex-1 px-4 py-3 rounded-xl bg-surface border border-surface-light text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
              />
              <Button onClick={handleSearch} loading={searching}>
                Search
              </Button>
            </div>
          </div>

          {searchResult && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-xl bg-surface-light"
            >
              <div className="flex items-center gap-4 mb-4">
                <Avatar username={searchResult.username} size="lg" />
                <div>
                  <div className="font-bold text-white">{searchResult.username}</div>
                  <div className="text-sm text-slate-400">{searchResult.email}</div>
                </div>
              </div>
              <Button className="w-full" onClick={handleSendRequest}>
                <UserPlus className="w-4 h-4" />
                Send Friend Request
              </Button>
            </motion.div>
          )}
        </div>
      </Modal>
    </div>
  )
}
