import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { HelpCircle, ChevronDown, Zap, Target, Trophy, Coins, Users, ShoppingBag, BookOpen } from 'lucide-react'
import { Card } from '../components/ui'

const FAQS = [
  {
    icon: Target,
    q: 'How do I start a quiz?',
    a: 'Go to the Quiz page from the navigation bar, pick a topic, and choose Solo (10 questions) or WASSCE (40 questions) mode. Questions adapt to your skill level automatically.',
  },
  {
    icon: Zap,
    q: 'How does adaptive difficulty work?',
    a: 'Your skill score starts at 50. After each quiz, it updates based on your accuracy. Below 40 is Easy, below 75 is Medium, and 75+ is Hard. The better you do, the harder the questions get.',
  },
  {
    icon: Coins,
    q: 'How do I earn coins?',
    a: 'You earn coins from quiz scores (1 coin per 10 points), daily rewards (streak bonuses up to 100 coins/day), achievements, and mystery boxes. Coins can be spent in the Shop on power-ups and cosmetics.',
  },
  {
    icon: Users,
    q: 'How do duels work?',
    a: 'Go to the Lobby and click Quick Duel to create a 2-player room, or go to Friends and challenge a friend directly. They\'ll get a notification with a Join button.',
  },
  {
    icon: Trophy,
    q: 'What are skill scores and leaderboards?',
    a: 'Each topic tracks your skill score (1-100). The Topics tab on the Leaderboard page shows who has the highest skill in each subject. The Rankings tab shows overall scores.',
  },
  {
    icon: ShoppingBag,
    q: 'What can I buy in the Shop?',
    a: 'Hint tokens (reveal the hint), 50/50 tokens (remove wrong options), Skip tokens, Double Coins boosters, Mystery Boxes (random 50-500 coins), and cosmetic avatar borders and name effects.',
  },
  {
    icon: BookOpen,
    q: 'What topics are available?',
    a: '25 WASSCE mathematics topics including Sets, Fractions, Algebra, Calculus, Trigonometry, Statistics, and more. Visit the Learn page for a full list with descriptions.',
  },
]

export default function Help() {
  const [openIdx, setOpenIdx] = useState(null)

  return (
    <div className="min-h-screen pb-24 md:pb-6">
      <section className="py-8 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary mb-6"
          >
            <HelpCircle className="w-8 h-8 text-white" />
          </motion.div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Help Center</h1>
          <p className="text-slate-400 mb-8">Everything you need to know about QuizBattle</p>
        </div>
      </section>

      <section className="max-w-2xl mx-auto px-4">
        <div className="space-y-3">
          {FAQS.map((faq, i) => {
            const Icon = faq.icon
            const isOpen = openIdx === i
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="overflow-hidden">
                  <button
                    onClick={() => setOpenIdx(isOpen ? null : i)}
                    className="w-full flex items-center gap-4 p-4 text-left"
                  >
                    <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <span className="flex-1 font-bold text-white">{faq.q}</span>
                    <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="px-4 pb-4 pl-18">
                          <p className="text-sm text-slate-400 leading-relaxed pl-14">{faq.a}</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              </motion.div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
