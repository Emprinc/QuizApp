// Adaptive learning algorithm — pure functions only.
// Ported from Python's get_skill_score / update_skill_score / get_adaptive_question.
// Algorithm must be preserved exactly: skill starts at 50;
// new = clamp(1,100, round(current*0.75 + accuracy*0.25))
// where accuracy = score/questions*100;
// difficulty banding: <40 Easy, <75 Medium, else Hard.

import type { Difficulty } from './types'

export const INITIAL_SKILL_SCORE = 50

export function difficultyFor(skillScore: number): Difficulty {
  if (skillScore < 40) return 'Easy'
  if (skillScore < 75) return 'Medium'
  return 'Hard'
}

export function nextSkill(current: number, score: number, questions: number): number {
  const accuracy = questions > 0 ? (score / questions) * 100 : 0
  const raw = Math.round(current * 0.75 + accuracy * 0.25)
  return Math.max(1, Math.min(100, raw))
}
