import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { BookOpen, Target, ArrowRight, Search } from 'lucide-react'
import { Button, Card } from '../components/ui'
import { MATH_TOPICS } from '../lib/constants'

const TOPIC_INFO = {
  sets: { desc: 'Unions, intersections, Venn diagrams, and set theory laws', icon: '∪' },
  percentages: { desc: 'Conversions, profit/loss, percentage change, and error', icon: '%' },
  fractions: { desc: 'Operations, BODMAS, mixed numbers, and comparisons', icon: '½' },
  indices: { desc: 'Laws of indices, standard form, and solving exponential equations', icon: 'x²' },
  surds: { desc: 'Simplification, rationalization, and geometric applications', icon: '√' },
  binary_operations: { desc: 'Compositions, identity elements, and operation tables', icon: '⊕' },
  relations_and_functions: { desc: 'Domain, range, composites, inverses, and piecewise functions', icon: 'ƒ(x)' },
  sequence_and_series: { desc: 'Arithmetic and geometric progressions, sigma notation', icon: 'Σ' },
  word_problems: { desc: 'Age, speed, work rate, and investment problems', icon: '📝' },
  shapes: { desc: 'Area, perimeter, and volume of geometric shapes', icon: '△' },
  algebra_basics: { desc: 'Linear equations, factorizing, and simultaneous equations', icon: 'x' },
  linear_algebra: { desc: 'Matrix operations, determinants, and inverses', icon: '[A]' },
  logarithms: { desc: 'Laws, equations, change of base, and simultaneous logs', icon: 'log' },
  probability: { desc: 'Simple, combined, and conditional probability', icon: 'P' },
  binomial_theorem: { desc: 'Pascal\'s triangle, coefficients, and specific terms', icon: 'C(n,k)' },
  polynomial_functions: { desc: 'Remainder theorem, factor theorem, and finding roots', icon: 'P(x)' },
  rational_functions: { desc: 'Asymptotes, domain, holes, and simplification', icon: 'f/g' },
  trigonometry: { desc: 'Identities, equations, and the cosine rule', icon: 'sin' },
  vectors: { desc: 'Algebra, magnitude, and dot product', icon: '→' },
  statistics: { desc: 'Mean, median, mode, range, frequency tables, and standard deviation', icon: 'σ' },
  coordinate_geometry: { desc: 'Midpoint, gradient, distance, and line equations', icon: '(x,y)' },
  intro_to_calculus: { desc: 'Limits, differentiation, and integration', icon: '∫' },
  number_bases: { desc: 'Base conversions and arithmetic in different bases', icon: '₂' },
  modulo_arithmetic: { desc: 'Remainders, congruence, clock arithmetic, and linear congruences', icon: 'mod' },
  advanced_combo: { desc: 'Multi-part questions combining multiple topics', icon: '★' },
}

export default function Learn() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')

  const filtered = MATH_TOPICS.filter(slug => {
    const name = slug.replace(/_/g, ' ')
    return name.toLowerCase().includes(search.toLowerCase()) ||
      (TOPIC_INFO[slug]?.desc || '').toLowerCase().includes(search.toLowerCase())
  })

  return (
    <div className="min-h-screen pb-24 md:pb-6">
      <section className="py-8 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary mb-6"
          >
            <BookOpen className="w-8 h-8 text-white" />
          </motion.div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Learn</h1>
          <p className="text-slate-400 mb-8">Explore WASSCE mathematics topics and practice with quizzes</p>

          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search topics..."
              className="w-full pl-10 pr-3 py-2 bg-surface-light border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filtered.map((slug, i) => {
            const info = TOPIC_INFO[slug] || { desc: 'Practice this topic', icon: '📚' }
            const name = slug.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
            return (
              <motion.div
                key={slug}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <Card hover className="cursor-pointer h-full" onClick={() => navigate('/quiz')}>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center text-xl font-bold text-primary shrink-0">
                      {info.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-white">{name}</h3>
                      <p className="text-sm text-slate-400 mt-1">{info.desc}</p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-slate-600 shrink-0" />
                  </div>
                </Card>
              </motion.div>
            )
          })}
        </div>

        {filtered.length === 0 && (
          <Card className="text-center py-12">
            <p className="text-slate-400">No topics found matching "{search}"</p>
          </Card>
        )}
      </section>

      <section className="max-w-4xl mx-auto px-4 mt-12">
        <Card className="bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                <Target className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-white">Ready to test yourself?</h3>
                <p className="text-sm text-slate-400">Take a quiz on any topic and earn coins</p>
              </div>
            </div>
            <Button onClick={() => navigate('/quiz')}>
              Start Quiz
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </Card>
      </section>
    </div>
  )
}
