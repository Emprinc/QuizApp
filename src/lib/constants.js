export const CATEGORIES = [
  { id: 'general', name: 'General Knowledge', icon: 'Lightbulb', color: '#F59E0B' },
  { id: 'science', name: 'Science', icon: 'Beaker', color: '#10B981' },
  { id: 'history', name: 'History', icon: 'Clock', color: '#6366F1' },
  { id: 'sports', name: 'Sports', icon: 'Trophy', color: '#EC4899' },
  { id: 'entertainment', name: 'Entertainment', icon: 'Film', color: '#8B5CF6' },
  { id: 'tech', name: 'Technology', icon: 'Cpu', color: '#06B6D4' }
]

export const DIFFICULTIES = ['easy', 'medium', 'hard']

export const QUESTION_COUNTS = [5, 10, 15, 20]

export const TIME_OPTIONS = [10, 15, 20, 30]

export const GAME_STATES = {
  WAITING: 'waiting',
  PLAYING: 'playing',
  FINISHED: 'finished'
}

export const ANSWER_TIME_BONUS = {
  max: 100,  // Bonus for instant answer
  min: 10     // Minimum bonus for last second answer
}

export const CORRECT_ANSWER_POINTS = 100

export const generateRoomCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

export const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export const getOrdinal = (n) => {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return n + (s[(v - 20) % 10] || s[v] || s[0])
}

export const getRankColor = (rank) => {
  switch (rank) {
    case 1: return '#F59E0B' // Gold
    case 2: return '#9CA3AF' // Silver
    case 3: return '#D97706' // Bronze
    default: return '#94A3B8'
  }
}