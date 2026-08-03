// Shared math formatting utilities — ported from Python's _get_fraction_latex_code,
// _format_fraction_text, _poly_to_str, _finalize_options, get_question_id.
import { Fraction } from './fraction'
import type { RNG } from '../engine/types'

export function getFractionLatexCode(f: Fraction): string {
  if (f.denominator === 1n) return String(f.numerator)
  return `\\frac{${f.numerator}}{${f.denominator}}`
}

export function formatFractionText(f: Fraction): string {
  if (f.denominator === 1n) return String(f.numerator)
  return `${f.numerator}/${f.denominator}`
}

export function polyToStr(coeffs: number[]): string {
  const parts: string[] = []
  for (let i = 0; i < coeffs.length; i++) {
    const c = coeffs[i]
    if (c === 0) continue
    const power = coeffs.length - 1 - i

    let coeffStr: string
    if (power > 0 && Math.abs(c) === 1) {
      coeffStr = c === -1 ? '-' : ''
    } else {
      if (i === 0) coeffStr = String(c)
      else if (c > 0) coeffStr = `+ ${c}`
      else coeffStr = `- ${Math.abs(c)}`
    }

    let varPart: string
    if (power === 0) varPart = ''
    else if (power === 1) varPart = 'x'
    else varPart = `x^{${power}}`

    parts.push(`${coeffStr}${varPart}`)
  }
  return parts.join(' ').replace(/^\+\s/, '').replace(/\+\s-/g, '- ')
}

export function finalizeOptions(
  optionsSet: Set<string>,
  rng: RNG,
  defaultType: 'int' | 'fraction' | 'set_str' = 'int'
): string[] {
  const unique = new Set<string>()
  for (const o of optionsSet) unique.add(String(o))

  while (unique.size < 4) {
    if (defaultType === 'fraction') {
      unique.add(formatFractionText(new Fraction(rng.int(1, 20), rng.int(2, 20))))
    } else if (defaultType === 'set_str') {
      unique.add(String(new Set(rng.sample(Array.from({ length: 19 }, (_, i) => i + 1), 3))))
    } else {
      unique.add(String(rng.int(1, 100)))
    }
  }

  return rng.shuffle(Array.from(unique))
}

export function getQuestionId(questionText: string): string {
  // Simple hash that mimics md5 for dedup purposes — not cryptographic
  let hash = 0
  for (let i = 0; i < questionText.length; i++) {
    const char = questionText.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash |= 0
  }
  return String(hash)
}

export function formatNumber(n: number, decimals = 2): string {
  return n.toFixed(decimals)
}
