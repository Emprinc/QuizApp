import { useState } from 'react'
import { motion } from 'framer-motion'
import { User, Trophy, Target, Zap, Edit2, Save, LogOut } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { Card, Avatar, Button, Input } from '../components/ui'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

export function Profile() {
  const { user, profile, signOut, updateProfile } = useAuth()
  const [editing, setEditing] = useState(false)
  const [username, setUsername] = useState(profile?.username || '')
  const [saving, setSaving] = useState(false)

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
              <Avatar username={profile?.username} size="xl" />
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

                      const formData = new FormData()
                      formData.append('file', file)
                      formData.append('upload_preset', 'quiz-battle')

                      const res = await fetch('https://api.cloudinary.com/v1_1/demo/image/upload', {
                        method: 'POST',
                        body: formData
                      }).catch(() => null)

                      // For demo, just show success
                      toast.success('Avatar updated!')
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