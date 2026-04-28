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
        setCurrentQuestion(null)
        setTimeout(() => {
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
      })
      .subscribe()

    setRoomChannel(channel)
    return channel
  }, [])

  const broadcastEvent = useCallback((roomId, event, payload) => {
    if (roomChannel && roomChannel.state === 'joined') {
      roomChannel.send({
        type: 'broadcast',
        event,
        payload: { ...payload, timestamp: Date.now() }
      })
    } else {
      console.warn(`Cannot broadcast ${event}: channel not joined`, roomChannel?.state)
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
      .single()

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
        isHost: rp.room_id === room.host_id,
        score: rp.score
      })))
    }

    return room
  }

  const leaveRoom = async () => {
    if (currentRoom && user) {
      broadcastEvent(currentRoom.id, 'player_left', { playerId: user.id })

      await supabase
        .from('room_players')
        .delete()
        .eq('room_id', currentRoom.id)
        .eq('player_id', user.id)

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

    // Fetch questions
    const { data: questions } = await supabase
      .from('questions')
      .select('*')
      .eq('category', currentRoom.category)
      .order('created_at', { ascending: false })
      .limit(currentRoom.question_count)

    if (!questions || questions.length === 0) {
      throw new Error('No questions available for this category')
    }

    if (questions.length < currentRoom.question_count) {
      toast.error(`Only ${questions.length} questions available in this category.`)
    }

    // Shuffle and store questions
    const shuffled = [...questions].sort(() => Math.random() - 0.5)
    questionsRef.current = shuffled.slice(0, currentRoom.question_count)

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

  const startRound = (roundNumber) => {
    if (roundNumber > questionsRef.current.length) {
      endGame()
      return
    }

    const question = questionsRef.current[roundNumber - 1]
    const shuffledOptions = [...question.options]
    const correctIndex = question.correct_answer

    // Shuffle options for this round
    const shuffledIndices = [0, 1, 2, 3].sort(() => Math.random() - 0.5)
    const remappedCorrect = shuffledIndices.indexOf(correctIndex)

    const displayQuestion = {
      ...question,
      options: shuffledIndices.map(i => question.options[i]),
      correctAnswer: remappedCorrect,
      shuffledCorrectIndex: correctIndex
    }

    setCurrentQuestion(displayQuestion)
    setCurrentRound(roundNumber)
    setGameState(GAME_STATES.PLAYING)

    broadcastEvent(currentRoom.id, 'question', {
      question: displayQuestion,
      round: roundNumber
    })

    // Set timer for round end
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
        question_id: currentQuestion.id,
        answer: answerIndex,
        is_correct: isCorrect,
        time_taken_ms: timeTaken,
        score_earned: pointsEarned
      }])

    if (error) console.error('Error recording answer:', error)

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

    broadcastEvent(currentRoom.id, 'round_end', {
      isLast,
      nextRound: roundNumber + 1
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
            isHost: rp.room_id === currentRoom.host_id,
            score: rp.score
          }))
          setPlayers(mappedPlayers)

          broadcastEvent(currentRoom.id, 'game_end', {
            finalScores: mappedPlayers.reduce((acc, p) => {
              acc[p.id] = p.score
              return acc
            }, {})
          })
        }
      } catch (err) {
        console.error('Error updating room status at end game:', err)
      }
    }

    // Update player stats
    if (user) {
      try {
        const winner = players.reduce((a, b) => (a.score > b.score ? a : b))
        const isWinner = winner?.id === user.id

        await supabase.rpc('update_player_stats', {
          p_user_id: user.id,
          p_games: 1,
          p_wins: isWinner ? 1 : 0
        })
      } catch (err) {
        console.error('Error updating player stats:', err)
      }
    }
  }

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
      createRoom,
      joinRoom,
      leaveRoom,
      startGame,
      submitAnswer,
      getInviteLink,
      subscribeToRoom
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