import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap, Target, Trophy, ArrowRight, Lightbulb, RotateCcw, Home } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { Button, Card, LoadingSpinner } from '../components/ui'
import { MathText } from '../components/ui/MathText'
import { quizService } from '../services/quizService'
import { MATH_TOPICS, QUIZ_LENGTH, WASSCE_QUIZ_LENGTH } from '../lib/constants'
import { createRandomRng } from '../engine/rng'
import { difficultyFor, INITIAL_SKILL_SCORE } from '../engine/adaptive'
import { getQuestionId } from '../lib/mathFormat'
import toast from 'react-hot-toast'

export default function Quiz() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [phase, setPhase] = useState('select')
  const [topic, setTopic] = useState('')
  const [mode, setMode] = useState('solo')
  const [questions, setQuestions] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState(null)
  const [isRevealed, setIsRevealed] = useState(false)
  const [score, setScore] = useState(0)
  const [correctCount, setCorrectCount] = useState(0)
  const [timeLeft, setTimeLeft] = useState(15)
  const [skillScore, setSkillScore] = useState(INITIAL_SKILL_SCORE)
  const [attemptId, setAttemptId] = useState(null)
  const [loading, setLoading] = useState(false)
  const [answers, setAnswers] = useState([])
  const startTimeRef = useRef(Date.now())
  const timerRef = useRef(null)
  const seenIdsRef = useRef(new Set())

  const quizLength = mode === 'wassce' ? WASSCE_QUIZ_LENGTH : QUIZ_LENGTH

  const startQuiz = async (topicSlug, quizMode) => {
    if (!user) return
    setLoading(true)
    setTopic(topicSlug)
    setMode(quizMode)

    try {
      const ss = await quizService.getSkillScore(user.id, topicSlug)
      setSkillScore(ss)
      seenIdsRef.current = await quizService.getSeenQuestionIds(user.id, topicSlug)

      const difficulty = difficultyFor(ss)
      const newAttemptId = await quizService.startAttempt(user.id, topicSlug, difficulty)
      setAttemptId(newAttemptId)

      const rng = createRandomRng()
      const generated = []
      const localSeen = new Set(seenIdsRef.current)

      for (let i = 0; i < quizLength; i++) {
        const q = quizService.generateQuestionForUser(topicSlug, ss, localSeen, rng)
        generated.push(q)
        const text = q.stem ?? q.question ?? ''
        localSeen.add(getQuestionId(text))
        quizService.markQuestionSeen(user.id, getQuestionId(text), topicSlug)
      }

      setQuestions(generated)
      setCurrentIndex(0)
      setScore(0)
      setCorrectCount(0)
      setAnswers([])
      setSelectedAnswer(null)
      setIsRevealed(false)
      setTimeLeft(15)
      setPhase('playing')
      startTimeRef.current = Date.now()
    } catch (err) {
      console.error('Error starting quiz:', err)
      toast.error('Failed to start quiz')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (phase !== 'playing' || isRevealed) return

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current)
          handleTimeout()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [phase, isRevealed, currentIndex])

  const handleAnswer = (optionIndex) => {
    if (selectedAnswer !== null || isRevealed) return

    const timeTaken = Date.now() - startTimeRef.current
    setSelectedAnswer(optionIndex)

    const currentQ = questions[currentIndex]
    const correctIdx = currentQ.options.indexOf(currentQ.answer)
    const isCorrect = optionIndex === correctIdx
    const timeBonus = Math.max(0, 100 - Math.floor((timeTaken / 1000) * 8))
    const points = isCorrect ? 100 + timeBonus : 0

    setScore(prev => prev + points)
    if (isCorrect) setCorrectCount(prev => prev + 1)
    setIsRevealed(true)
    if (timerRef.current) clearInterval(timerRef.current)

    setAnswers(prev => [...prev, {
      question: currentQ,
      selected: optionIndex,
      correct: correctIdx,
      isCorrect,
      timeMs: timeTaken,
      points,
    }])

    if (attemptId && user) {
      quizService.saveAnswer(attemptId, user.id, currentQ, optionIndex, correctIdx, isCorrect, timeTaken, points)
    }
  }

  const handleTimeout = () => {
    if (selectedAnswer !== null || isRevealed) return

    const currentQ = questions[currentIndex]
    const correctIdx = currentQ.options.indexOf(currentQ.answer)
    const timeTaken = Date.now() - startTimeRef.current

    setSelectedAnswer(null)
    setIsRevealed(true)

    setAnswers(prev => [...prev, {
      question: currentQ,
      selected: null,
      correct: correctIdx,
      isCorrect: false,
      timeMs: timeTaken,
      points: 0,
    }])

    if (attemptId && user) {
      quizService.saveAnswer(attemptId, user.id, currentQ, null, correctIdx, false, timeTaken, 0)
    }
  }

  const nextQuestion = () => {
    if (currentIndex + 1 >= quizLength) {
      finishQuiz()
      return
    }

    setCurrentIndex(prev => prev + 1)
    setSelectedAnswer(null)
    setIsRevealed(false)
    setTimeLeft(15)
    startTimeRef.current = Date.now()
  }

  const finishQuiz = async () => {
    if (!user || !attemptId) return

    const coinsEarned = Math.floor(score / 10)
    const difficulty = difficultyFor(skillScore)

    try {
      await quizService.submitAttempt(
        user.id,
        topic,
        difficulty,
        score,
        quizLength,
        correctCount,
        coinsEarned
      )
      setPhase('summary')
    } catch (err) {
      console.error('Error finishing quiz:', err)
      toast.error('Failed to save results')
      setPhase('summary')
    }
  }

  const restartQuiz = () => {
    setPhase('select')
    setTopic('')
    setQuestions([])
    setAnswers([])
    setScore(0)
    setCorrectCount(0)
  }

  // Topic selection screen
  if (phase === 'select') {
    return (
      <div className="min-h-screen pb-24 md:pb-6">
        <section className="relative py-12 px-4">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-transparent to-transparent" />
          <div className="relative max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary mb-6"
            >
              <Zap className="w-8 h-8 text-white" />
            </motion.div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Solo Quiz</h1>
            <p className="text-slate-400 mb-8">Choose a topic and test your knowledge</p>

            <div className="flex items-center justify-center gap-2 mb-8">
              <button
                onClick={() => setMode('solo')}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${mode === 'solo' ? 'bg-primary text-white' : 'bg-surface-light text-slate-400'}`}
              >
                Solo ({QUIZ_LENGTH} Q)
              </button>
              <button
                onClick={() => setMode('wassce')}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${mode === 'wassce' ? 'bg-primary text-white' : 'bg-surface-light text-slate-400'}`}
              >
                WASSCE ({WASSCE_QUIZ_LENGTH} Q)
              </button>
            </div>
          </div>
        </section>

        <section className="max-w-4xl mx-auto px-4">
          {loading ? (
            <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {MATH_TOPICS.map((topicSlug, i) => {
                const topicName = topicSlug.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
                return (
                  <motion.div
                    key={topicSlug}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                  >
                    <Card hover className="cursor-pointer" onClick={() => startQuiz(topicSlug, mode)}>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                          <Target className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-bold text-white text-sm">{topicName}</h3>
                          <p className="text-xs text-slate-500">{mode === 'wassce' ? WASSCE_QUIZ_LENGTH : QUIZ_LENGTH} questions</p>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                )
              })}
            </div>
          )}
        </section>
      </div>
    )
  }

  // Quiz playing screen
  if (phase === 'playing' && questions.length > 0) {
    const currentQ = questions[currentIndex]
    const correctIdx = currentQ.options.indexOf(currentQ.answer)
    const timerColor = timeLeft <= 5 ? 'bg-danger' : timeLeft <= 10 ? 'bg-gold' : 'bg-primary'

    return (
      <div className="min-h-screen p-4 pb-24 md:pb-6">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Question</span>
              <span className="text-xl font-bold text-white">{currentIndex + 1}/{quizLength}</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-sm text-slate-400">Score</div>
                <div className="text-xl font-bold text-gradient">{score}</div>
              </div>
            </div>
          </div>

          {/* Timer */}
          <div className="w-full h-2 bg-surface-light rounded-full mb-6 overflow-hidden">
            <motion.div
              className={`h-full ${timerColor}`}
              initial={{ width: '100%' }}
              animate={{ width: `${(timeLeft / 15) * 100}%` }}
              transition={{ duration: 1, ease: 'linear' }}
            />
          </div>

          {/* Question */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-surface rounded-2xl p-6 mb-6"
            >
              <MathText text={currentQ.question} className="text-xl md:text-2xl font-bold text-white text-center leading-relaxed" />
            </motion.div>
          </AnimatePresence>

          {/* Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {currentQ.options.map((option, index) => {
              const isSelected = selectedAnswer === index
              const isCorrect = index === correctIdx
              let bgClass = 'bg-surface-light hover:bg-surface'
              let borderClass = 'border-transparent'

              if (isRevealed) {
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
                  whileHover={{ scale: isRevealed ? 1 : 1.02 }}
                  whileTap={{ scale: isRevealed ? 1 : 0.98 }}
                  onClick={() => handleAnswer(index)}
                  disabled={isRevealed}
                  className={`p-4 md:p-6 rounded-xl border-2 text-left transition-all ${bgClass} ${borderClass} disabled:cursor-not-allowed`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold ${isRevealed && isCorrect ? 'bg-success text-white' : isRevealed && isSelected && !isCorrect ? 'bg-danger text-white' : 'bg-surface text-slate-400'}`}>
                      {isRevealed && isCorrect ? '\u2713' : isRevealed && isSelected && !isCorrect ? '\u2717' : String.fromCharCode(65 + index)}
                    </div>
                    <MathText text={option} className="text-white font-medium" />
                  </div>
                </motion.button>
              )
            })}
          </div>

          {/* Hint */}
          {isRevealed && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              <Card className="bg-primary/5 border-primary/20">
                <div className="flex items-start gap-3">
                  <Lightbulb className="w-5 h-5 text-primary shrink-0 mt-1" />
                  <div>
                    <p className="text-sm text-slate-300 mb-2">{currentQ.hint}</p>
                    <MathText text={currentQ.explanation} className="text-sm text-slate-400" />
                  </div>
                </div>
              </Card>
            </motion.div>
          )}

          {/* Next button */}
          {isRevealed && (
            <Button size="lg" className="w-full" onClick={nextQuestion}>
              {currentIndex + 1 >= quizLength ? (
                <>Finish Quiz <Trophy className="w-5 h-5" /></>
              ) : (
                <>Next Question <ArrowRight className="w-5 h-5" /></>
              )}
            </Button>
          )}
        </div>
      </div>
    )
  }

  // Summary screen
  if (phase === 'summary') {
    const accuracy = quizLength > 0 ? Math.round((correctCount / quizLength) * 100) : 0
    const coinsEarned = Math.floor(score / 10)

    return (
      <div className="min-h-screen flex items-center justify-center p-4 pb-24 md:pb-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md"
        >
          <Card className="p-8 text-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center mx-auto mb-6">
              <Trophy className="w-10 h-10 text-white" />
            </div>

            <h2 className="text-2xl font-bold text-white mb-2">Quiz Complete!</h2>
            <p className="text-slate-400 mb-8 capitalize">{topic.replace(/_/g, ' ')}</p>

            <div className="grid grid-cols-3 gap-4 mb-8">
              <div>
                <div className="text-3xl font-bold text-gradient">{score}</div>
                <div className="text-xs text-slate-500 uppercase tracking-widest mt-1">Points</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-success">{correctCount}/{quizLength}</div>
                <div className="text-xs text-slate-500 uppercase tracking-widest mt-1">Correct</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-gold">{accuracy}%</div>
                <div className="text-xs text-slate-500 uppercase tracking-widest mt-1">Accuracy</div>
              </div>
            </div>

            {coinsEarned > 0 && (
              <div className="mb-6 p-4 bg-gold/10 rounded-xl border border-gold/20">
                <div className="flex items-center justify-center gap-2">
                  <span className="text-2xl font-bold text-gold">+{coinsEarned}</span>
                  <span className="text-slate-400">coins earned!</span>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-3">
              <Button onClick={restartQuiz}>
                <RotateCcw className="w-4 h-4" />
                New Quiz
              </Button>
              <Button variant="secondary" onClick={() => navigate('/leaderboard')}>
                <Trophy className="w-4 h-4" />
                View Leaderboard
              </Button>
              <Button variant="ghost" onClick={() => navigate('/lobby')}>
                <Home className="w-4 h-4" />
                Back to Lobby
              </Button>
            </div>
          </Card>
        </motion.div>
      </div>
    )
  }

  return null
}
