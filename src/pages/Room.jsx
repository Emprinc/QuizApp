import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Copy, Check, Users, Zap, Clock, Play, LogOut, Trophy } from 'lucide-react'
import { useGame } from '../context/GameContext'
import { useAuth } from '../context/AuthContext'
import { Button, Card, Avatar, LoadingSpinner } from '../components/ui'
import { GAME_STATES, getRankColor } from '../lib/constants'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

export function Room() {
  const { code } = useParams()
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const {
    currentRoom,
    players,
    gameState,
    currentQuestion,
    currentRound,
    createRoom,
    joinRoom,
    leaveRoom,
    startGame
  } = useGame()

  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showResults, setShowResults] = useState(false)

  useEffect(() => {
    if (!currentRoom || currentRoom.code !== code) {
      // Try to join the room
      joinRoom(code).catch(() => {
        toast.error('Room not found')
        navigate('/lobby')
      }).finally(() => setLoading(false))
    } else {
      setLoading(false)
    }

    return () => {
      // Cleanup on unmount
    }
  }, [code])

  const copyInviteLink = () => {
    const link = `${window.location.origin}/join/${code}`
    navigator.clipboard.writeText(link)
    setCopied(true)
    toast.success('Invite link copied!')
    setTimeout(() => setCopied(false), 2000)
  }

  const handleLeave = async () => {
    await leaveRoom()
    navigate('/lobby')
  }

  const handleStart = async () => {
    try {
      await startGame()
    } catch (error) {
      toast.error(error.message || 'Failed to start game')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!currentRoom) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="text-center p-12">
          <p className="text-slate-400 mb-4">Room not found</p>
          <Link to="/lobby">
            <Button>Back to Lobby</Button>
          </Link>
        </Card>
      </div>
    )
  }

  const isHost = currentRoom.host_id === user?.id
  const sortedPlayers = [...players].sort((a, b) => (b.score || 0) - (a.score || 0))

  // Results screen
  if (gameState === GAME_STATES.FINISHED || showResults) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md"
        >
          <Card className="p-8 text-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gold to-amber-500 flex items-center justify-center mx-auto mb-6 animate-pulse-glow">
              <Trophy className="w-10 h-10 text-white" />
            </div>

            <h2 className="text-2xl font-bold text-white mb-2">Game Over!</h2>
            <p className="text-slate-400 mb-8">Final Results</p>

            <div className="space-y-3 mb-8">
              {sortedPlayers.map((player, index) => (
                <motion.div
                  key={player.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`
                    flex items-center gap-4 p-4 rounded-xl
                    ${player.id === user?.id ? 'bg-primary/20 border border-primary/30' : 'bg-surface-light'}
                  `}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center font-bold"
                    style={{ backgroundColor: getRankColor(index + 1), color: index > 2 ? '#0F172A' : '#FFF' }}
                  >
                    {index + 1}
                  </div>
                  <Avatar username={player.username} size="sm" />
                  <div className="flex-1 text-left">
                    <div className="font-medium text-white">
                      {player.username}
                      {player.id === user?.id && ' (You)'}
                    </div>
                  </div>
                  <div className="text-xl font-bold text-gradient">
                    {player.score || 0}
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={handleLeave}>
                <LogOut className="w-4 h-4" />
                Leave Room
              </Button>
              <Button className="flex-1" onClick={() => navigate('/lobby')}>
                Play Again
              </Button>
            </div>
          </Card>
        </motion.div>
      </div>
    )
  }

  // Game in progress
  if (gameState === GAME_STATES.PLAYING && currentQuestion) {
    return <BattleView />
  }

  // Waiting room
  return (
    <div className="min-h-screen p-4 pb-24 md:pb-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Room: {code}</h1>
            <p className="text-slate-400">{currentRoom.category} - {currentRoom.question_count} Questions</p>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLeave}>
            <LogOut className="w-4 h-4" />
            Leave
          </Button>
        </div>

        {/* Invite Card */}
        <Card className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-white mb-1">Invite Players</h3>
              <p className="text-sm text-slate-400">Share this code or link</p>
            </div>
            <Button variant="secondary" size="sm" onClick={copyInviteLink}>
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied!' : 'Copy Link'}
            </Button>
          </div>
          <div className="mt-4 text-center">
            <div className="inline-block px-8 py-4 bg-surface-light rounded-xl">
              <span className="text-4xl font-mono font-bold tracking-widest text-gradient">
                {code}
              </span>
            </div>
          </div>
        </Card>

        {/* Players */}
        <Card className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-primary" />
            <h3 className="font-bold text-white">Players ({players.length}/8)</h3>
          </div>

          <div className="space-y-3">
            {players.map((player, index) => (
              <motion.div
                key={player.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center gap-3 p-3 rounded-xl bg-surface-light"
              >
                <Avatar username={player.username} size="md" />
                <div className="flex-1">
                  <div className="font-medium text-white">
                    {player.username}
                    {player.isHost && (
                      <span className="ml-2 text-xs bg-primary/30 text-primary px-2 py-0.5 rounded-full">Host</span>
                    )}
                    {player.id === user?.id && (
                      <span className="ml-2 text-xs bg-surface text-slate-400 px-2 py-0.5 rounded-full">You</span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}

            {players.length < 8 && (
              <div className="text-center py-4 text-slate-500">
                Waiting for more players...
              </div>
            )}
          </div>
        </Card>

        {/* Settings */}
        <Card className="mb-6">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-white">{currentRoom.question_count}</div>
              <div className="text-sm text-slate-400">Questions</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{currentRoom.time_per_question}s</div>
              <div className="text-sm text-slate-400">Per Question</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{currentRoom.category}</div>
              <div className="text-sm text-slate-400">Category</div>
            </div>
          </div>
        </Card>

        {/* Start Button (Host only) */}
        {isHost && (
          <Button size="lg" className="w-full" onClick={handleStart}>
            <Play className="w-5 h-5" />
            Start Game
          </Button>
        )}

        {!isHost && (
          <div className="text-center py-4 text-slate-400">
            Waiting for host to start the game...
          </div>
        )}
      </div>
    </div>
  )
}

// Battle View Component
function BattleView() {
  const { user } = useAuth()
  const { currentRoom, players, currentQuestion, currentRound, submitAnswer, gameState } = useGame()
  const [selectedAnswer, setSelectedAnswer] = useState(null)
  const [timeLeft, setTimeLeft] = useState(currentRoom?.time_per_question || 15)
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false)
  const [scoreGained, setScoreGained] = useState(0)
  const startTimeRef = useState(Date.now())[0]

  useEffect(() => {
    if (!currentQuestion) return

    setTimeLeft(currentRoom?.time_per_question || 15)
    setSelectedAnswer(null)
    setIsAnswerRevealed(false)
    setScoreGained(0)

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [currentQuestion, currentRound])

  const handleAnswer = async (index) => {
    if (selectedAnswer !== null || isAnswerRevealed) return

    const timeTaken = Date.now() - startTimeRef
    setSelectedAnswer(index)

    await submitAnswer(index, timeTaken)
  }

  useEffect(() => {
    // Check if answer is revealed
    if (selectedAnswer !== null) {
      setIsAnswerRevealed(true)
      const myAnswer = selectedAnswer === currentQuestion?.correctAnswer
      if (myAnswer) {
        const timeBonus = Math.max(0, 100 - Math.floor((Date.now() - startTimeRef) / 1000 * 8))
        setScoreGained(100 + timeBonus)
      }
    }
  }, [selectedAnswer, currentQuestion])

  const sortedPlayers = [...players].sort((a, b) => (b.score || 0) - (a.score || 0))
  const userRank = sortedPlayers.findIndex(p => p.id === user?.id) + 1

  const timerColor = timeLeft <= 5 ? 'bg-danger' : timeLeft <= 10 ? 'bg-gold' : 'bg-primary'

  return (
    <div className="min-h-screen p-4 pb-24 md:pb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-slate-400">Question</span>
          <span className="text-xl font-bold text-white">
            {currentRound}/{currentRoom?.question_count}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-sm text-slate-400">Your Rank</div>
            <div className="text-xl font-bold" style={{ color: getRankColor(userRank) }}>#{userRank}</div>
          </div>
        </div>
      </div>

      {/* Timer Bar */}
      <div className="w-full h-2 bg-surface-light rounded-full mb-6 overflow-hidden">
        <motion.div
          className={`h-full ${timerColor}`}
          initial={{ width: '100%' }}
          animate={{ width: `${(timeLeft / (currentRoom?.time_per_question || 15)) * 100}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>

      {/* Question */}
      <div className="max-w-2xl mx-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion?.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-surface rounded-2xl p-6 mb-6"
          >
            <h2 className="text-xl md:text-2xl font-bold text-white text-center leading-relaxed">
              {currentQuestion?.question_text}
            </h2>
          </motion.div>
        </AnimatePresence>

        {/* Answer Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {currentQuestion?.options.map((option, index) => {
            const isSelected = selectedAnswer === index
            const isCorrect = index === currentQuestion?.correctAnswer
            const showCorrect = isAnswerRevealed

            let bgClass = 'bg-surface-light hover:bg-surface'
            let borderClass = 'border-transparent'

            if (showCorrect) {
              if (isCorrect) {
                bgClass = 'bg-success/20 border-success'
              } else if (isSelected && !isCorrect) {
                bgClass = 'bg-danger/20 border-danger'
              }
            } else if (isSelected) {
              bgClass = 'bg-primary/20 border-primary'
            }

            return (
              <motion.button
                key={index}
                whileHover={{ scale: isAnswerRevealed ? 1 : 1.02 }}
                whileTap={{ scale: isAnswerRevealed ? 1 : 0.98 }}
                onClick={() => handleAnswer(index)}
                disabled={isAnswerRevealed}
                className={`
                  p-4 md:p-6 rounded-xl border-2 text-left transition-all
                  ${bgClass} ${borderClass}
                  disabled:cursor-not-allowed
                `}
              >
                <div className="flex items-center gap-3">
                  <div className={`
                    w-8 h-8 rounded-lg flex items-center justify-center font-bold
                    ${isAnswerRevealed && isCorrect ? 'bg-success text-white' :
                      isAnswerRevealed && isSelected && !isCorrect ? 'bg-danger text-white' :
                      'bg-surface text-slate-400'}
                  `}>
                    {showCorrect && isCorrect ? '✓' :
                     showCorrect && isSelected && !isCorrect ? '✗' :
                     String.fromCharCode(65 + index)}
                  </div>
                  <span className="text-white font-medium">{option}</span>
                </div>
              </motion.button>
            )
          })}
        </div>

        {/* Score Animation */}
        <AnimatePresence>
          {scoreGained > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              className="text-center mb-6"
            >
              <span className="text-4xl font-black text-success">+{scoreGained}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Players Scoreboard */}
        <Card className="mt-6">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-primary" />
            <h3 className="font-bold text-white">Live Scores</h3>
          </div>

          <div className="space-y-2">
            {sortedPlayers.map((player, index) => (
              <div
                key={player.id}
                className={`
                  flex items-center gap-3 p-3 rounded-xl
                  ${player.id === user?.id ? 'bg-primary/20 border border-primary/30' : 'bg-surface-light'}
                `}
              >
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ backgroundColor: getRankColor(index + 1), color: index > 2 ? '#0F172A' : '#FFF' }}
                >
                  {index + 1}
                </div>
                <Avatar username={player.username} size="sm" />
                <div className="flex-1 text-sm font-medium text-white">
                  {player.username}
                  {player.id === user?.id && ' (You)'}
                </div>
                <div className="text-lg font-bold text-gradient">
                  {player.score || 0}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}