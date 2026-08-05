import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Search, TrendingUp, Award, Target } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { Card, LoadingSpinner } from '../ui'
import { MATH_TOPICS } from '../../lib/constants'

export function StudentProgress() {
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [skillLevels, setSkillLevels] = useState([])
  const [attempts, setAttempts] = useState([])

  useEffect(() => {
    loadStudents()
  }, [])

  const loadStudents = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, total_score, games_played, wins, losses, coins')
        .order('total_score', { ascending: false })
        .limit(100)
      if (error) throw error
      setStudents(data || [])
    } catch (err) {
      console.error('Error loading students:', err)
    } finally {
      setLoading(false)
    }
  }

  const viewStudent = async (student) => {
    setSelectedStudent(student)
    try {
      const [skills, quizData] = await Promise.all([
        supabase.from('user_skill_levels').select('*').eq('user_id', student.id),
        supabase.from('quiz_attempts').select('*').eq('user_id', student.id).order('finished_at', { ascending: false }).limit(10),
      ])
      setSkillLevels(skills.data || [])
      setAttempts(quizData.data || [])
    } catch (err) {
      console.error('Error loading student data:', err)
    }
  }

  const filtered = students.filter(s => s.username?.toLowerCase().includes(search.toLowerCase()))

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (selectedStudent) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <button onClick={() => setSelectedStudent(null)} className="text-slate-400 hover:text-white text-sm mb-2">&larr; Back to students</button>
            <h2 className="text-2xl font-bold text-white">{selectedStudent.username}</h2>
            <p className="text-slate-400 text-sm">Total score: {selectedStudent.total_score?.toLocaleString() || 0} • Games: {selectedStudent.games_played || 0} • W/L: {selectedStudent.wins || 0}/{selectedStudent.losses || 0}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-primary" /> Skill Levels by Topic</h3>
            {skillLevels.length === 0 ? (
              <p className="text-slate-400 text-sm">No skill data yet</p>
            ) : (
              <div className="space-y-2">
                {skillLevels.map(s => (
                  <div key={s.topic_slug} className="flex items-center justify-between">
                    <span className="text-sm text-slate-300 capitalize">{s.topic_slug.replace(/_/g, ' ')}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-primary to-secondary rounded-full" style={{ width: `${s.skill_score}%` }} />
                      </div>
                      <span className="text-sm font-bold text-white w-8 text-right">{s.skill_score}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><Target className="w-5 h-5 text-secondary" /> Recent Quiz Attempts</h3>
            {attempts.length === 0 ? (
              <p className="text-slate-400 text-sm">No quiz attempts yet</p>
            ) : (
              <div className="space-y-2">
                {attempts.map(a => (
                  <div key={a.id} className="flex items-center justify-between text-sm">
                    <div>
                      <div className="text-white capitalize">{a.topic_slug?.replace(/_/g, ' ')}</div>
                      <div className="text-xs text-slate-500">{a.finished_at ? new Date(a.finished_at).toLocaleDateString() : ''} • {a.difficulty}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-gradient">{a.score}</div>
                      <div className="text-xs text-slate-500">{a.questions_correct}/{a.questions_answered}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-white">Student Progress</h2>
        <p className="text-slate-400 mt-1">View individual student performance and skill levels</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search students..."
          className="w-full pl-10 pr-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500"
        />
      </div>

      {filtered.length === 0 ? (
        <Card className="text-center py-12">
          <p className="text-slate-400">No students found</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((student, i) => (
            <motion.div key={student.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
              <Card hover className="cursor-pointer" onClick={() => viewStudent(student)}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary">
                    {student.username?.[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-white truncate">{student.username}</div>
                    <div className="text-xs text-slate-400">{student.total_score?.toLocaleString() || 0} pts • {student.games_played || 0} games</div>
                  </div>
                  <Award className="w-4 h-4 text-slate-600" />
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
