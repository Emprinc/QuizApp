import { supabase } from './supabase'

// Question Management
export const adminQuestionUtils = {
  async createQuestion(questionData) {
    const { data, error } = await supabase
      .from('questions')
      .insert([questionData])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async updateQuestion(id, updates) {
    const { data, error } = await supabase
      .from('questions')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async deleteQuestion(id) {
    const { error } = await supabase
      .from('questions')
      .delete()
      .eq('id', id)
    
    if (error) throw error
    return true
  },

  async getAllQuestions(filters = {}) {
    let query = supabase.from('questions').select('*')
    
    if (filters.category) {
      query = query.eq('category', filters.category)
    }
    if (filters.difficulty) {
      query = query.eq('difficulty', filters.difficulty)
    }
    
    query = query.order('created_at', { ascending: false })
    
    const { data, error } = await query
    
    if (error) throw error
    return data
  },

  async bulkImportQuestions(questions) {
    const { data, error } = await supabase
      .from('questions')
      .insert(questions)
      .select()
    
    if (error) throw error
    return data
  },

  async getTotalQuestionsCount() {
    const { count, error } = await supabase
      .from('questions')
      .select('*', { count: 'exact', head: true })

    if (error) throw error
    return count || 0
  }
}

// User Management
export const adminUserUtils = {
  async searchUsers(query) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .or(`username.ilike.%${query}%,email.ilike.%${query}%`)
      .limit(20)
    
    if (error) throw error
    return data
  },

  async getAllUsers(limit = 50, offset = 0) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('total_score', { ascending: false })
      .range(offset, offset + limit - 1)
    
    if (error) throw error
    return data
  },

  async getUserStats(userId) {
    // Separate queries for better reliability and avoiding complex joins
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    
    if (profileError) throw profileError

    const { count: roomsCount } = await supabase
      .from('room_players')
      .select('*', { count: 'exact', head: true })
      .eq('player_id', userId)

    const { count: answersCount } = await supabase
      .from('player_answers')
      .select('*', { count: 'exact', head: true })
      .eq('player_id', userId)

    return {
      ...profile,
      rooms_count: roomsCount || 0,
      answers_count: answersCount || 0
    }
  },

  async updateUserAdmin(userId, isAdmin) {
    const { data, error } = await supabase
      .from('profiles')
      .update({ is_admin: isAdmin })
      .eq('id', userId)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async banUser(userId) {
    // Note: This would require adding a 'banned' column to profiles table
    // For now, we'll mark the user as banned via updating
    const { data, error } = await supabase
      .from('profiles')
      .update({ is_banned: true })
      .eq('id', userId)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async unbanUser(userId) {
    const { data, error } = await supabase
      .from('profiles')
      .update({ is_banned: false })
      .eq('id', userId)
      .select()
      .single()
    
    if (error) throw error
    return data
  }
}

// Room Management
export const adminRoomUtils = {
  async getAllRooms(limit = 50, offset = 0) {
    const { data, error } = await supabase
      .from('rooms')
      .select(`
        *,
        host:profiles(username),
        room_players(count)
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)
    
    if (error) throw error
    return data
  },

  async deleteRoom(roomId) {
    const { error } = await supabase
      .from('rooms')
      .delete()
      .eq('id', roomId)
    
    if (error) throw error
    return true
  },

  async closeRoom(roomId) {
    const { data, error } = await supabase
      .from('rooms')
      .update({ status: 'finished' })
      .eq('id', roomId)
      .select()
      .single()
    
    if (error) throw error
    return data
  }
}

// Analytics
export const adminAnalyticsUtils = {
  async getGameStats() {
    const { data: rooms, error: roomsError } = await supabase
      .from('rooms')
      .select('*')
    
    if (roomsError) throw roomsError

    const { data: answers, error: answersError } = await supabase
      .from('player_answers')
      .select('*')
    
    if (answersError) throw answersError

    const totalGames = rooms.length
    const finishedGames = rooms.filter(r => r.status === 'finished').length
    const totalAnswers = answers.length
    const correctAnswers = answers.filter(a => a.is_correct).length
    const accuracy = correctAnswers / totalAnswers * 100

    return {
      totalGames,
      finishedGames,
      activeGames: rooms.filter(r => r.status === 'playing').length,
      pendingGames: rooms.filter(r => r.status === 'waiting').length,
      totalAnswers,
      correctAnswers,
      accuracy: isNaN(accuracy) ? 0 : accuracy.toFixed(2)
    }
  },

  async getCategoryStats() {
    const { data, error } = await supabase
      .from('questions')
      .select('category, id')
    
    if (error) throw error

    const stats = {}
    data.forEach(q => {
      if (!stats[q.category]) {
        stats[q.category] = 0
      }
      stats[q.category]++
    })

    return Object.entries(stats).map(([category, count]) => ({
      category,
      count
    }))
  },

  async getDifficultyStats() {
    const { data, error } = await supabase
      .from('questions')
      .select('difficulty, id')
    
    if (error) throw error

    const stats = {}
    data.forEach(q => {
      if (!stats[q.difficulty]) {
        stats[q.difficulty] = 0
      }
      stats[q.difficulty]++
    })

    return Object.entries(stats).map(([difficulty, count]) => ({
      difficulty,
      count
    }))
  },

  async getTopQuestions(limit = 10) {
    const { data, error } = await supabase
      .from('player_answers')
      .select('question_id, is_correct')
    
    if (error) throw error

    const questionStats = {}
    data.forEach(answer => {
      if (!questionStats[answer.question_id]) {
        questionStats[answer.question_id] = {
          total: 0,
          correct: 0
        }
      }
      questionStats[answer.question_id].total++
      if (answer.is_correct) {
        questionStats[answer.question_id].correct++
      }
    })

    const questions = Object.entries(questionStats)
      .map(([id, stats]) => ({
        id,
        accuracy: (stats.correct / stats.total * 100).toFixed(2),
        total_answers: stats.total
      }))
      .sort((a, b) => b.total_answers - a.total_answers)
      .slice(0, limit)

    return questions
  },

  async getUserStats() {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, total_games, total_wins, total_score')
    
    if (error) throw error

    const totalUsers = data.length
    const avgGamesPerUser = (data.reduce((sum, u) => sum + u.total_games, 0) / totalUsers).toFixed(2)
    const avgScorePerUser = (data.reduce((sum, u) => sum + u.total_score, 0) / totalUsers).toFixed(2)

    return {
      totalUsers,
      avgGamesPerUser: isNaN(avgGamesPerUser) ? 0 : avgGamesPerUser,
      avgScorePerUser: isNaN(avgScorePerUser) ? 0 : avgScorePerUser
    }
  }
}
