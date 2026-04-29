import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, Edit2, Trash2, Search, ChevronLeft, ChevronRight } from 'lucide-react'
import { adminQuestionUtils } from '../../lib/adminUtils'
import { Card, Button, LoadingSpinner } from '../ui'
import { CATEGORIES, DIFFICULTIES } from '../../lib/constants'
import toast from 'react-hot-toast'

export function QuestionManager() {
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedDifficulty, setSelectedDifficulty] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [currentPage, setCurrentPage] = useState(0)
  const itemsPerPage = 10

  const [formData, setFormData] = useState({
    category: CATEGORIES[0].id,
    difficulty: 'medium',
    question_text: '',
    options: ['', '', '', ''],
    correct_answer: 0,
    explanation: ''
  })

  useEffect(() => {
    loadQuestions()
  }, [selectedCategory, selectedDifficulty])

  const loadQuestions = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await adminQuestionUtils.getAllQuestions({
        category: selectedCategory || undefined,
        difficulty: selectedDifficulty || undefined
      })
      setQuestions(data)
      setCurrentPage(0)
    } catch (err) {
      setError(err.message)
      toast.error('Failed to load questions')
    } finally {
      setLoading(false)
    }
  }

  const handleAddQuestion = async (e) => {
    e.preventDefault()
    
    if (!formData.question_text.trim()) {
      toast.error('Question text is required')
      return
    }
    
    if (formData.options.some(opt => !opt.trim())) {
      toast.error('All options must be filled')
      return
    }

    try {
      const newQuestion = {
        ...formData,
        options: formData.options
      }
      
      if (editingId) {
        const updated = await adminQuestionUtils.updateQuestion(editingId, newQuestion)
        setQuestions(questions.map(q => q.id === editingId ? updated : q))
        toast.success('Question updated successfully')
        setEditingId(null)
      } else {
        const created = await adminQuestionUtils.createQuestion(newQuestion)
        setQuestions([created, ...questions])
        toast.success('Question created successfully')
      }

      resetForm()
      setShowForm(false)
    } catch (err) {
      toast.error(editingId ? 'Failed to update question' : 'Failed to create question')
    }
  }

  const handleDeleteQuestion = async (id) => {
    if (!window.confirm('Are you sure you want to delete this question?')) return

    try {
      await adminQuestionUtils.deleteQuestion(id)
      setQuestions(questions.filter(q => q.id !== id))
      toast.success('Question deleted successfully')
    } catch (err) {
      toast.error('Failed to delete question')
    }
  }

  const handleEditQuestion = (question) => {
    setFormData({
      category: question.category,
      difficulty: question.difficulty,
      question_text: question.question_text,
      options: question.options,
      correct_answer: question.correct_answer,
      explanation: question.explanation || ''
    })
    setEditingId(question.id)
    setShowForm(true)
  }

  const resetForm = () => {
    setFormData({
      category: CATEGORIES[0].id,
      difficulty: 'medium',
      question_text: '',
      options: ['', '', '', ''],
      correct_answer: 0,
      explanation: ''
    })
    setEditingId(null)
  }

  const handleCancelEdit = () => {
    resetForm()
    setShowForm(false)
  }

  const filteredQuestions = questions.filter(q =>
    q.question_text.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const paginatedQuestions = filteredQuestions.slice(
    currentPage * itemsPerPage,
    (currentPage + 1) * itemsPerPage
  )
  const totalPages = Math.ceil(filteredQuestions.length / itemsPerPage)

  if (loading && questions.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white">Question Manager</h2>
          <p className="text-slate-400 mt-1">Manage quiz questions and categories</p>
        </div>
        <Button
          onClick={() => {
            resetForm()
            setShowForm(true)
          }}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Question
        </Button>
      </div>

      {/* Form */}
      {showForm && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              {editingId ? 'Edit Question' : 'Create New Question'}
            </h3>
            
            <form onSubmit={handleAddQuestion} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Difficulty</label>
                  <select
                    value={formData.difficulty}
                    onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
                  >
                    {DIFFICULTIES.map(diff => (
                      <option key={diff} value={diff}>{diff}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Question</label>
                <textarea
                  value={formData.question_text}
                  onChange={(e) => setFormData({ ...formData, question_text: e.target.value })}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500"
                  rows="3"
                  placeholder="Enter the question text..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Options</label>
                <div className="space-y-2">
                  {formData.options.map((option, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="correct"
                        checked={formData.correct_answer === idx}
                        onChange={() => setFormData({ ...formData, correct_answer: idx })}
                        className="w-4 h-4 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={option}
                        onChange={(e) => {
                          const newOptions = [...formData.options]
                          newOptions[idx] = e.target.value
                          setFormData({ ...formData, options: newOptions })
                        }}
                        className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500"
                        placeholder={`Option ${idx + 1}`}
                      />
                    </div>
                  ))}
                </div>
                <p className="text-xs text-slate-400 mt-2">Select the radio button for the correct answer</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Explanation (Optional)</label>
                <textarea
                  value={formData.explanation}
                  onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500"
                  rows="2"
                  placeholder="Explain the correct answer..."
                />
              </div>

              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="px-4 py-2 rounded-lg border border-white/10 text-slate-300 hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-white font-medium transition-colors"
                >
                  {editingId ? 'Update' : 'Create'} Question
                </button>
              </div>
            </form>
          </Card>
        </motion.div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setCurrentPage(0)
            }}
            placeholder="Search questions..."
            className="w-full pl-10 pr-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500"
          />
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
        >
          <option value="">All Categories</option>
          {CATEGORIES.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>

        <select
          value={selectedDifficulty}
          onChange={(e) => setSelectedDifficulty(e.target.value)}
          className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
        >
          <option value="">All Difficulties</option>
          {DIFFICULTIES.map(diff => (
            <option key={diff} value={diff}>{diff}</option>
          ))}
        </select>
      </div>

      {/* Questions List */}
      <Card className="overflow-hidden">
        {paginatedQuestions.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-slate-400">No questions found</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {paginatedQuestions.map(question => (
              <motion.div
                key={question.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-4 hover:bg-white/5 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium mb-1">{question.question_text}</p>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="px-2 py-1 bg-primary/20 text-primary rounded">
                        {question.category}
                      </span>
                      <span className={`px-2 py-1 rounded ${
                        question.difficulty === 'easy' ? 'bg-green-500/20 text-green-400' :
                        question.difficulty === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {question.difficulty}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEditQuestion(question)}
                      className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteQuestion(question.id)}
                      className="p-2 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-white/5">
            <button
              onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
              disabled={currentPage === 0}
              className="p-2 rounded-lg hover:bg-white/5 text-slate-400 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm text-slate-400">
              Page {currentPage + 1} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
              disabled={currentPage === totalPages - 1}
              className="p-2 rounded-lg hover:bg-white/5 text-slate-400 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </Card>

      <p className="text-sm text-slate-400">
        Showing {paginatedQuestions.length} of {filteredQuestions.length} questions
      </p>
    </div>
  )
}
