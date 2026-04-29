import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react'
import toast from 'react-hot-toast'
import { supabase } from '../lib/supabase'
import { generateRoomCode, GAME_STATES } from '../lib/constants'
import { useAuth } from './AuthContext'

const GameContext = createContext(null)

export function GameProvider({ children }) {
  const { user, profile } = useAuth()
  const [currentRoom, setCurrentRoom] = useState(null)
  const [players, setPlayers] = useState([])
  const [currentQuestion, setCurrentQuestion] = useState(null)
  const [currentRound, setCurrentRound] = useState(0)
  const [gameState, setGameState] = useState(GAME_STATES.WAITING)
  const [answers, setAnswers] = useState({})
  const [scores, setScores] = useState({})
  const [roomChannel, setRoomChannel] = useState(null)
  const questionsRef = useRef([])
  const roundTimerRef = useRef(null)

  useEffect(() => {
    // Cleanup if user logs out
    if (!user) {
      if (roomChannel) {
        roomChannel.unsubscribe()
        setRoomChannel(null)
      }
      setCurrentRoom(null)
      setPlayers([])
      setCurrentQuestion(null)
      setCurrentRound(0)
      setGameState(GAME_STATES.WAITING)
      setAnswers({})
      if (roundTimerRef.current) {
        clearTimeout(roundTimerRef.current)
      }
    }
  }, [user])

  useEffect(() => {
    return () => {
      if (roomChannel) {
        roomChannel.unsubscribe()
      }
      if (roundTimerRef.current) {
        clearTimeout(roundTimerRef.current)
      }
    }
  }, [roomChannel])

  const subscribeToRoom = useCallback((roomId) => {
    if (roomChannel) {
      roomChannel.unsubscribe()
    }

    const channel = supabase.channel(`room:${roomId}`)

    channel
      .on('broadcast', { event: 'player_joined' }, ({ payload }) => {
        setPlayers(prev => {
          if (!prev.find(p => p.id === payload.playerId)) {
            return [...prev, {
              id: payload.playerId,
              username: payload.username,
              avatar_url: payload.avatar_url,
              isHost: payload.isHost
            }]
          }
          return prev
        })
      })
      .on('broadcast', { event: 'player_left' }, ({ payload }) => {
        setPlayers(prev => prev.filter(p => p.id !== payload.playerId))
      })
      .on('broadcast', { event: 'game_start' }, () => {
        setGameState(GAME_STATES.PLAYING)
        setCurrentRound(0)
      })
      .on('broadcast', { event: 'question' }, ({ payload }) => {
        setCurrentQuestion(payload.question)
        setCurrentRound(payload.round)
        setAnswers({})
        setScores(prev => ({...prev, [payload.round]: {}}))
      })
      .on('broadcast', { event: 'answer_result' }, ({ payload }) => {
        const { playerId, answer, isCorrect, timeTaken, pointsEarned } = payload

        setAnswers(prev => ({
          ...prev,
          [playerId]: { answer, isCorrect, timeTaken, pointsEarned }
        }))

        setPlayers(prev => prev.map(p =>
          p.id === playerId
            ? { ...p, score: (p.score || 0) + pointsEarned }
            : p
        ))
      })
      .on('broadcast', { event: 'round_end' }, ({ payload }) => {
        // We keep the current question visible so the reveal can be shown in BattleView
        setTimeout(() => {
          setCurrentQuestion(null)
          if (!payload.isLast) {
            broadcastEvent(roomId, 'next_round', { round: payload.nextRound })
          }
        }, 3000)
      })
      .on('broadcast', { event: 'game_end' }, ({ payload }) => {
        setGameState(GAME_STATES.FINISHED)
        setCurrentQuestion(null)
        if (roundTimerRef.current) {
          clearTimeout(roundTimerRef.current)
        }

        // Synchronize final scores from broadcast
        if (payload.finalScores) {
          setPlayers(prev => prev.map(p => ({
            ...p,
            score: payload.finalScores[p.id] !== undefined ? payload.finalScores[p.id] : p.score
          })))

          // Update stats for non-host players who receive this broadcast
          if (user) {
            const myScore = payload.finalScores[user.id] || 0
            const scoresArray = Object.values(payload.finalScores)
            const maxScore = Math.max(...scoresArray, 0)
            const isWinner = myScore === maxScore && myScore > 0

            supabase.rpc('update_player_stats', {
              p_user_id: user.id,
              p_games: 1,
              p_wins: isWinner ? 1 : 0,
              p_score: myScore
            }).catch(err => console.error('Error updating player stats:', err))
          }
        }
      })
      .on('broadcast', { event: 'rematch' }, () => {
        resetGame()
        toast('Rematch starting soon!', { icon: '🎮' })
      })
      .subscribe()

    setRoomChannel(channel)
    return channel
  }, [])

  const broadcastEvent = useCallback((roomId, event, payload) => {
    if (roomChannel && (roomChannel.state === 'joined' || roomChannel.state === 'joining')) {
      // If still joining, we might want to wait or just attempt send as it might succeed if it joins quickly
      // but 'joined' is the safest. However, we'll keep the joined check.
      if (roomChannel.state === 'joined') {
        roomChannel.send({
          type: 'broadcast',
          event,
          payload: { ...payload, timestamp: Date.now() }
        }).catch(err => {
          console.error(`Error broadcasting ${event}:`, err)
        })
      } else {
        // Queue or retry? For now, just log.
        console.warn(`Cannot broadcast ${event}: channel in ${roomChannel.state} state`)
      }
    } else {
      console.warn(`Cannot broadcast ${event}: channel not initialized or in bad state`, roomChannel?.state)
    }
  }, [roomChannel])

  const createRoom = async (category, questionCount, timePerQuestion) => {
    if (!user || !profile) return null

    const code = generateRoomCode()

    const { data: room, error } = await supabase
      .from('rooms')
      .insert([{
        code,
        host_id: user.id,
        category,
        question_count: questionCount,
        time_per_question: timePerQuestion,
        status: GAME_STATES.WAITING
      }])
      .select()
      .single()

    if (error) throw error

    // Add host as player
    await supabase
      .from('room_players')
      .insert([{
        room_id: room.id,
        player_id: user.id,
        score: 0
      }])

    setCurrentRoom(room)
    setPlayers([{
      id: user.id,
      username: profile.username,
      avatar_url: profile.avatar_url,
      isHost: true,
      score: 0
    }])

    subscribeToRoom(room.id)

    return room
  }

  const joinRoom = async (code) => {
    if (!user || !profile) return null

    const { data: room, error } = await supabase
      .from('rooms')
      .select('*, host:profiles!rooms_host_id_fkey(*)')
      .eq('code', code.toUpperCase())
      .single()

    if (error || !room) {
      throw new Error('Room not found')
    }

    if (room.status !== GAME_STATES.WAITING) {
      throw new Error('Game already in progress')
    }

    // Check if already in room
    const { data: existingPlayer } = await supabase
      .from('room_players')
      .select('*')
      .eq('room_id', room.id)
      .eq('player_id', user.id)
      .maybeSingle()

    if (!existingPlayer) {
      await supabase
        .from('room_players')
        .insert([{
          room_id: room.id,
          player_id: user.id,
          score: 0
        }])
    }

    setCurrentRoom(room)
    const channel = subscribeToRoom(room.id)

    // Broadcast player joined using the channel directly to avoid race conditions
    channel.send({
      type: 'broadcast',
      event: 'player_joined',
      payload: {
        playerId: user.id,
        username: profile.username,
        avatar_url: profile.avatar_url,
        isHost: room.host_id === user.id,
        timestamp: Date.now()
      }
    })

    // Fetch existing players
    const { data: roomPlayers } = await supabase
      .from('room_players')
      .select('*, player:profiles(*)')
      .eq('room_id', room.id)

    if (roomPlayers) {
      setPlayers(roomPlayers.map(rp => ({
        id: rp.player_id,
        username: rp.player?.username || 'Unknown',
        avatar_url: rp.player?.avatar_url,
        isHost: rp.player_id === room.host_id,
        score: rp.score || 0,
        answers_correct: rp.answers_correct || 0
      })))
    }

    // Recovery logic if game is already in progress
    if (room.status === GAME_STATES.PLAYING) {
      setGameState(GAME_STATES.PLAYING)
      setCurrentRound(room.current_round || 1)

      // Fetch session questions to ensure consistency
      const { data: sessionQuestions } = await supabase
        .from('game_sessions')
        .select('*, question:questions(*)')
        .eq('room_id', room.id)
        .order('round_number', { ascending: true })

      if (sessionQuestions && sessionQuestions.length > 0) {
        const questions = sessionQuestions.map(sq => sq.question)
        questionsRef.current = questions
        const roundIdx = (room.current_round || 1) - 1
        if (questions[roundIdx]) {
          setCurrentQuestion(questions[roundIdx])
        }
      }
    }

    return room
  }

  const leaveRoom = async () => {
    if (currentRoom && user) {
      broadcastEvent(currentRoom.id, 'player_left', { playerId: user.id })

      // Only delete from room_players if game hasn't started
      // This preserves history for finished games
      if (currentRoom.status === GAME_STATES.WAITING) {
        await supabase
          .from('room_players')
          .delete()
          .eq('room_id', currentRoom.id)
          .eq('player_id', user.id)
      }

      if (roomChannel) {
        roomChannel.unsubscribe()
        setRoomChannel(null)
      }
    }

    setCurrentRoom(null)
    setPlayers([])
    setCurrentQuestion(null)
    setCurrentRound(0)
    setGameState(GAME_STATES.WAITING)
    setAnswers({})
  }

  const startGame = async () => {
    if (!currentRoom || !user) return

    // Fetch a larger pool of questions for better randomization
    const { data: questions } = await supabase
      .from('questions')
      .select('*')
      .eq('category', currentRoom.category)
      .limit(50)

    if (!questions || questions.length === 0) {
      throw new Error('No questions available for this category')
    }

    // Local Fisher-Yates shuffle for better randomness than Array.sort()
    const shuffle = (array) => {
      const newArray = [...array]
      for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]]
      }
      return newArray
    }

    const shuffled = shuffle(questions)
    const selectedQuestions = shuffled.slice(0, Math.min(questions.length, currentRoom.question_count))
    questionsRef.current = selectedQuestions

    if (questionsRef.current.length < currentRoom.question_count) {
      toast.error(`Only ${questionsRef.current.length} questions available in this category.`)
    }

    // Persist questions to game_sessions for sync
    const sessionInserts = selectedQuestions.map((q, idx) => ({
      room_id: currentRoom.id,
      question_id: q.id,
      round_number: idx + 1
    }))

    await supabase.from('game_sessions').insert(sessionInserts)

    // Update room status
    await supabase
      .from('rooms')
      .update({ status: GAME_STATES.PLAYING })
      .eq('id', currentRoom.id)

    setCurrentRoom({ ...currentRoom, status: GAME_STATES.PLAYING })

    // Broadcast game start
    broadcastEvent(currentRoom.id, 'game_start', {})

    // Start first question after short delay
    setTimeout(() => {
      startRound(1)
    }, 2000)
  }

  const startRound = async (roundNumber) => {
    if (!questionsRef.current || roundNumber > questionsRef.current.length) {
      endGame()
      return
    }

    // Update current round in database for refresh resilience
    if (currentRoom) {
      try {
        await supabase
          .from('rooms')
          .update({ current_round: roundNumber })
          .eq('id', currentRoom.id)
      } catch (err) {
        console.warn('Error updating round in DB:', err.message)
      }
    }

    const question = questionsRef.current[roundNumber - 1]
    if (!question) {
      endGame()
      return
    }

    // Correctly handle shuffle and mapping
    const originalOptions = [...question.options]
    const shuffledIndices = [0, 1, 2, 3].sort(() => Math.random() - 0.5)

    // Create new options array based on shuffled indices
    const shuffledOptions = shuffledIndices.map(i => originalOptions[i])

    // Find where the original correct answer ended up
    const remappedCorrect = shuffledIndices.indexOf(question.correct_answer)

    const displayQuestion = {
      ...question,
      options: shuffledOptions,
      correctAnswer: remappedCorrect
    }

    setCurrentQuestion(displayQuestion)
    setCurrentRound(roundNumber)
    setGameState(GAME_STATES.PLAYING)
    setAnswers({})

    // Omit the correct answer from the broadcast to prevent client-side cheating
    const { correctAnswer, ...safeQuestion } = displayQuestion

    broadcastEvent(currentRoom.id, 'question', {
      question: safeQuestion,
      round: roundNumber
    })

    // Set timer for round end
    if (roundTimerRef.current) clearTimeout(roundTimerRef.current)
    roundTimerRef.current = setTimeout(() => {
      endRound(roundNumber)
    }, (currentRoom.time_per_question || 15) * 1000)
  }

  const submitAnswer = async (answerIndex, timeTaken) => {
    if (!currentRoom || !user || !currentQuestion) return

    const isCorrect = answerIndex === currentQuestion.correctAnswer
    const timeBonus = Math.max(
      0,
      100 - Math.floor((timeTaken / 1000) * 8)
    )
    const pointsEarned = isCorrect ? 100 + timeBonus : 0

    // Record answer
    const { error } = await supabase
      .from('player_answers')
      .insert([{
        player_id: user.id,
        room_id: currentRoom.id,
        question_id: currentQuestion.id,
        answer: answerIndex,
        is_correct: isCorrect,
        time_taken_ms: timeTaken,
        score_earned: pointsEarned
      }])

    if (error) console.error('Error recording answer:', error)

    // Update room_players score for persistence across refreshes
    const currentPlayer = players.find(p => p.id === user.id)
    const newScore = (currentPlayer?.score || 0) + pointsEarned

    await supabase
      .from('room_players')
      .update({
        score: newScore,
        answers_correct: isCorrect ? (currentPlayer?.answers_correct || 0) + 1 : (currentPlayer?.answers_correct || 0)
      })
      .eq('room_id', currentRoom.id)
      .eq('player_id', user.id)

    setAnswers(prev => ({
      ...prev,
      [user.id]: { answer: answerIndex, isCorrect, timeTaken, pointsEarned }
    }))

    broadcastEvent(currentRoom.id, 'answer_result', {
      playerId: user.id,
      answer: answerIndex,
      isCorrect,
      timeTaken,
      pointsEarned
    })
  }

  const endRound = (roundNumber) => {
    if (roundTimerRef.current) {
      clearTimeout(roundTimerRef.current)
    }

    const isLast = roundNumber >= questionsRef.current.length
    const currentQ = questionsRef.current[roundNumber - 1]

    broadcastEvent(currentRoom.id, 'round_end', {
      isLast,
      nextRound: roundNumber + 1,
      correctAnswerIndex: currentQuestion?.correctAnswer, // Send the correct index now that round is over
      originalCorrectAnswer: currentQ?.correct_answer
    })

    if (!isLast) {
      setTimeout(() => {
        startRound(roundNumber + 1)
      }, 4000)
    } else {
      endGame()
    }
  }

  const endGame = async () => {
    setGameState(GAME_STATES.FINISHED)
    setCurrentQuestion(null)

    if (currentRoom) {
      try {
        await supabase
          .from('rooms')
          .update({ status: GAME_STATES.FINISHED })
          .eq('id', currentRoom.id)

        // Update currentRoom status locally for leaveRoom logic
        setCurrentRoom(prev => prev ? { ...prev, status: GAME_STATES.FINISHED } : null)

        // Fetch final scores to ensure synchronization
        const { data: finalPlayers } = await supabase
          .from('room_players')
          .select('*, player:profiles(*)')
          .eq('room_id', currentRoom.id)

        if (finalPlayers) {
          const mappedPlayers = finalPlayers.map(rp => ({
            id: rp.player_id,
            username: rp.player?.username || 'Unknown',
            avatar_url: rp.player?.avatar_url,
            isHost: rp.player_id === currentRoom.host_id,
            score: rp.score
          }))
          setPlayers(mappedPlayers)

          const finalScores = mappedPlayers.reduce((acc, p) => {
            acc[p.id] = p.score
            return acc
          }, {})

          broadcastEvent(currentRoom.id, 'game_end', { finalScores })

          // Host also updates their stats here since they don't receive their own broadcast
          if (user) {
            const myScore = finalScores[user.id] || 0
            const scoresArray = Object.values(finalScores)
            const maxScore = Math.max(...scoresArray, 0)
            const isWinner = myScore === maxScore && myScore > 0

            await supabase.rpc('update_player_stats', {
              p_user_id: user.id,
              p_games: 1,
              p_wins: isWinner ? 1 : 0,
              p_score: myScore
            })
          }
        }
      } catch (err) {
        console.error('Error updating room status at end game:', err)
      }
    }
  }

  const resetGame = useCallback(() => {
    setGameState(GAME_STATES.WAITING)
    setCurrentRound(0)
    setCurrentQuestion(null)
    setCurrentRoom(prev => prev ? { ...prev, status: GAME_STATES.WAITING } : null)
    setPlayers(prev => prev.map(p => ({ ...p, score: 0, answers_correct: 0 })))
    setAnswers({})
  }, [])

  const getInviteLink = () => {
    if (!currentRoom) return ''
    const baseUrl = window.location.origin
    return `${baseUrl}/join/${currentRoom.code}`
  }

  return (
    <GameContext.Provider value={{
      currentRoom,
      players,
      currentQuestion,
      currentRound,
      gameState,
      answers,
      scores,
      roomChannel,
      createRoom,
      joinRoom,
      leaveRoom,
      startGame,
      submitAnswer,
      getInviteLink,
      subscribeToRoom,
      resetGame
    }}>
      {children}
    </GameContext.Provider>
  )
}

export function useGame() {
  const context = useContext(GameContext)
  if (!context) {
    throw new Error('useGame must be used within a GameProvider')
  }
  return context
}