// Quiz service — handles solo quiz attempts, skill scores, and seen questions.
import { supabase } from '../lib/supabase'
import { generateAdaptiveQuestion, generateNonRepeatingQuestion } from '../engine'
import { createRandomRng } from '../engine/rng'
import { difficultyFor, INITIAL_SKILL_SCORE } from '../engine/adaptive'
import { getQuestionId } from '../lib/mathFormat'
import { QUIZ_LENGTH } from '../lib/constants'

export const quizService = {
  async getSkillScore(userId, topicSlug) {
    const { data, error } = await supabase.rpc('get_skill_score', {
      p_user_id: userId,
      p_topic_slug: topicSlug,
    })
    if (error) {
      console.error('Error fetching skill score:', error)
      return INITIAL_SKILL_SCORE
    }
    return data ?? INITIAL_SKILL_SCORE
  },

  async getSeenQuestionIds(userId, topicSlug) {
    let query = supabase.from('seen_questions').select('question_hash').eq('user_id', userId)
    if (topicSlug) query = query.eq('topic_slug', topicSlug)
    const { data, error } = await query.limit(500)
    if (error) {
      console.error('Error fetching seen questions:', error)
      return new Set()
    }
    return new Set(data?.map(r => r.question_hash) ?? [])
  },

  async markQuestionSeen(userId, questionHash, topicSlug) {
    const { error } = await supabase
      .from('seen_questions')
      .insert({ user_id: userId, question_hash: questionHash, topic_slug: topicSlug })
    if (error && !error.message.includes('duplicate')) {
      console.error('Error marking question seen:', error)
    }
  },

  generateQuestionForUser(topicSlug, skillScore, seenIds, rng = createRandomRng()) {
    if (topicSlug === 'advanced_combo') {
      return generateAdaptiveQuestion(topicSlug, skillScore, rng)
    }
    const difficulty = difficultyFor(skillScore)
    return generateNonRepeatingQuestion(topicSlug, difficulty, seenIds, rng)
  },

  async startAttempt(userId, topicSlug, difficulty) {
    const { data, error } = await supabase
      .from('quiz_attempts')
      .insert({
        user_id: userId,
        topic_slug: topicSlug,
        difficulty,
        score: 0,
        questions_answered: 0,
        questions_correct: 0,
        coins_earned: 0,
        mode: 'solo',
      })
      .select('id')
      .single()

    if (error) {
      console.error('Error starting attempt:', error)
      return null
    }
    return data.id
  },

  async saveAnswer(attemptId, userId, questionData, selectedAnswer, correctAnswer, isCorrect, timeTakenMs, scoreEarned) {
    const { error } = await supabase.from('quiz_answers').insert({
      attempt_id: attemptId,
      user_id: userId,
      question_text: questionData.question,
      question_data: questionData,
      selected_answer: selectedAnswer,
      correct_answer: correctAnswer,
      is_correct: isCorrect,
      time_taken_ms: timeTakenMs,
      score_earned: scoreEarned,
    })
    if (error) console.error('Error saving answer:', error)
  },

  async submitAttempt(userId, topicSlug, difficulty, score, questionsAnswered, questionsCorrect, coinsEarned) {
    const { data, error } = await supabase.rpc('submit_quiz_attempt', {
      p_user_id: userId,
      p_topic_slug: topicSlug,
      p_difficulty: difficulty,
      p_score: score,
      p_questions_answered: questionsAnswered,
      p_questions_correct: questionsCorrect,
      p_coins_earned: coinsEarned,
    })
    if (error) {
      console.error('Error submitting attempt:', error)
      return null
    }
    return data
  },

  async getAttemptAnswers(attemptId, userId) {
    const { data, error } = await supabase
      .from('quiz_answers')
      .select('*')
      .eq('attempt_id', attemptId)
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
    if (error) {
      console.error('Error fetching answers:', error)
      return []
    }
    return data ?? []
  },

  getQuizLength(mode = 'solo') {
    return mode === 'wassce' ? 40 : QUIZ_LENGTH
  },
}
