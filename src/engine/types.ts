// Canonical types for the mathematics question engine.
// src/engine/** must import nothing from react, @supabase/supabase-js, or src/services/**.

export type Difficulty = 'Easy' | 'Medium' | 'Hard'

export type RNG = {
  next: () => number  // returns [0, 1)
  int: (min: number, max: number) => number  // inclusive
  pick: <T>(arr: T[]) => T
  sample: <T>(arr: T[], k: number) => T[]
  shuffle: <T>(arr: T[]) => T[]
  bool: () => boolean
}

export type GeneratedQuestion = {
  question: string
  options: string[]
  answer: string
  hint: string
  explanation: string
  difficulty: Difficulty
  graphData?: unknown
}

export type ComboPart = {
  question: string
  options: string[]
  answer: string
  hint: string
  explanation: string
}

export type ComboQuestion = {
  isMultipart: boolean
  stem?: string
  question?: string
  options?: string[]
  answer?: string
  hint?: string
  explanation?: string
  parts?: ComboPart[]
  difficulty: Difficulty
}

export type TopicGenerator = (difficulty: Difficulty, rng: RNG) => GeneratedQuestion
export type ComboGenerator = (rng: RNG) => ComboQuestion
