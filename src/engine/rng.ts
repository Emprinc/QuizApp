// Seeded PRNG (mulberry32) so generators are deterministic for testing.
import type { RNG } from './types'

export function createRng(seed: number): RNG {
  let state = seed >>> 0

  const next = (): number => {
    state |= 0
    state = (state + 0x6D2B79F5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }

  const int = (min: number, max: number): number => {
    return Math.floor(next() * (max - min + 1)) + min
  }

  const pick = <T>(arr: T[]): T => {
    return arr[Math.floor(next() * arr.length)]
  }

  const sample = <T>(arr: T[], k: number): T[] => {
    const copy = [...arr]
    const result: T[] = []
    for (let i = 0; i < k && copy.length > 0; i++) {
      const idx = Math.floor(next() * copy.length)
      result.push(copy.splice(idx, 1)[0])
    }
    return result
  }

  const shuffle = <T>(arr: T[]): T[] => {
    const copy = [...arr]
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(next() * (i + 1))
      ;[copy[i], copy[j]] = [copy[j], copy[i]]
    }
    return copy
  }

  const bool = (): boolean => next() > 0.5

  return { next, int, pick, sample, shuffle, bool }
}

// Default RNG using Math.random for production use
export function createRandomRng(): RNG {
  const next = () => Math.random()
  const int = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min
  const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]
  const sample = <T>(arr: T[], k: number): T[] => {
    const copy = [...arr]
    const result: T[] = []
    for (let i = 0; i < k && copy.length > 0; i++) {
      const idx = Math.floor(Math.random() * copy.length)
      result.push(copy.splice(idx, 1)[0])
    }
    return result
  }
  const shuffle = <T>(arr: T[]): T[] => {
    const copy = [...arr]
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[copy[i], copy[j]] = [copy[j], copy[i]]
    }
    return copy
  }
  const bool = () => Math.random() > 0.5
  return { next, int, pick, sample, shuffle, bool }
}
