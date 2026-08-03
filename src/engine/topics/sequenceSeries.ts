// Sequence and series question generator — ported from _generate_sequence_series_question
import type { Difficulty, RNG, GeneratedQuestion } from '../types'
import { Fraction } from '../../lib/fraction'
import { getFractionLatexCode, formatFractionText, finalizeOptions } from '../../lib/mathFormat'

function binomialCoeff(n: number, k: number): number {
  if (k < 0 || k > n) return 0
  if (k === 0 || k === n) return 1
  let result = 1
  for (let i = 0; i < k; i++) {
    result = (result * (n - i)) / (i + 1)
  }
  return Math.round(result)
}

export function generateSequenceSeriesQuestion(difficulty: Difficulty, rng: RNG): GeneratedQuestion {
  let qType: string
  if (difficulty === 'Easy') {
    qType = rng.pick(['arithmetic_basic', 'geometric_basic', 'find_next_term'])
  } else if (difficulty === 'Medium') {
    qType = rng.pick(['arithmetic_sum', 'geometric_sum', 'arithmetic_nth_term'])
  } else {
    qType = rng.pick(['geometric_nth_term', 'sigma_notation', 'arithmetic_geometric_mean'])
  }

  let question = '', answer = '', hint = '', explanation = ''
  let options = new Set<string>()

  if (qType === 'arithmetic_basic') {
    const a = rng.int(2, 10)
    const d = rng.int(2, 8)
    question = `Find the common difference of the arithmetic sequence: ${a}, ${a + d}, ${a + 2 * d}, ${a + 3 * d}, ...`
    answer = String(d)
    hint = 'The common difference is the difference between consecutive terms.'
    explanation = `The common difference $d = ${a + d} - ${a} = ${d}$.`
    options = new Set([answer, String(d + 1), String(d - 1), String(a)])
  } else if (qType === 'geometric_basic') {
    const a = rng.int(2, 5)
    const r = rng.int(2, 4)
    question = `Find the common ratio of the geometric sequence: ${a}, ${a * r}, ${a * r * r}, ${a * r * r * r}, ...`
    answer = String(r)
    hint = 'The common ratio is found by dividing any term by the previous term.'
    explanation = `The common ratio $r = \\frac{${a * r}}{${a}} = ${r}$.`
    options = new Set([answer, String(r + 1), String(r - 1), String(a)])
  } else if (qType === 'find_next_term') {
    const isArithmetic = rng.bool()
    if (isArithmetic) {
      const a = rng.int(2, 10)
      const d = rng.int(2, 8)
      const terms = [a, a + d, a + 2 * d, a + 3 * d]
      question = `Find the next term in the sequence: ${terms.join(', ')}, ...`
      answer = String(a + 4 * d)
      hint = 'Find the pattern between consecutive terms.'
      explanation = `This is an arithmetic sequence with common difference $d = ${d}$. The next term is ${a + 3 * d} + ${d} = ${a + 4 * d}.`
      options = new Set([answer, String(a + 3 * d + d + 1), String(a + 3 * d + d - 1)])
    } else {
      const a = rng.int(2, 5)
      const r = rng.int(2, 3)
      const terms = [a, a * r, a * r * r, a * r * r * r]
      question = `Find the next term in the sequence: ${terms.join(', ')}, ...`
      answer = String(a * Math.pow(r, 4))
      hint = 'Find the pattern between consecutive terms.'
      explanation = `This is a geometric sequence with common ratio $r = ${r}$. The next term is ${a * Math.pow(r, 3)} × ${r} = ${a * Math.pow(r, 4)}.`
      options = new Set([answer, String(a * Math.pow(r, 4) + 1), String(a * Math.pow(r, 4) - 1)])
    }
  } else if (qType === 'arithmetic_sum') {
    const a = rng.int(2, 10)
    const d = rng.int(2, 8)
    const n = rng.int(5, 15)
    const lastTerm = a + (n - 1) * d
    const sum = (n / 2) * (2 * a + (n - 1) * d)
    question = `Find the sum of the first ${n} terms of the arithmetic sequence with first term ${a} and common difference ${d}.`
    answer = String(sum)
    hint = 'Use the formula $S_n = \\frac{n}{2}(2a + (n-1)d)$ or $S_n = \\frac{n}{2}(a + l)$.'
    explanation = `$S_{${n}} = \\frac{${n}}{2}(2(${a}) + (${n}-1)(${d})) = \\frac{${n}}{2}(${2 * a + (n - 1) * d}) = ${sum}$.`
    options = new Set([answer, String(sum + d), String(sum - d), String(n * lastTerm)])
  } else if (qType === 'geometric_sum') {
    const a = rng.int(2, 5)
    const r = rng.int(2, 3)
    const n = rng.int(4, 8)
    const sum = a * (Math.pow(r, n) - 1) / (r - 1)
    question = `Find the sum of the first ${n} terms of the geometric sequence with first term ${a} and common ratio ${r}.`
    answer = String(sum)
    hint = 'Use the formula $S_n = \\frac{a(r^n - 1)}{r - 1}$.'
    explanation = `$S_{${n}} = \\frac{${a}(${r}^{${n}} - 1)}{${r} - 1} = \\frac{${a}(${Math.pow(r, n)} - 1)}{${r - 1}} = \\frac{${a} \\times ${Math.pow(r, n) - 1}}{${r - 1}} = ${sum}$.`
    options = new Set([answer, String(sum + a), String(sum - a), String(a * Math.pow(r, n))])
  } else if (qType === 'arithmetic_nth_term') {
    const a = rng.int(2, 10)
    const d = rng.int(2, 8)
    const n = rng.int(10, 30)
    const nthTerm = a + (n - 1) * d
    question = `Find the ${n}th term of the arithmetic sequence with first term ${a} and common difference ${d}.`
    answer = String(nthTerm)
    hint = 'Use the formula $a_n = a + (n-1)d$.'
    explanation = `$a_{${n}} = ${a} + (${n}-1)(${d}) = ${a} + ${(n - 1) * d} = ${nthTerm}$.`
    options = new Set([answer, String(nthTerm + d), String(nthTerm - d), String(a + n * d)])
  } else if (qType === 'geometric_nth_term') {
    const a = rng.int(2, 5)
    const r = rng.int(2, 3)
    const n = rng.int(5, 10)
    const nthTerm = a * Math.pow(r, n - 1)
    question = `Find the ${n}th term of the geometric sequence with first term ${a} and common ratio ${r}.`
    answer = String(nthTerm)
    hint = 'Use the formula $a_n = ar^{n-1}$.'
    explanation = `$a_{${n}} = ${a} \\times ${r}^{${n}-1} = ${a} \\times ${Math.pow(r, n - 1)} = ${nthTerm}$.`
    options = new Set([answer, String(nthTerm + r), String(nthTerm - r), String(a * Math.pow(r, n))])
  } else if (qType === 'sigma_notation') {
    const a = rng.int(1, 5)
    const d = rng.int(2, 6)
    const n = rng.int(5, 12)
    const sum = (n / 2) * (2 * a + (n - 1) * d)
    question = `Evaluate $\\sum_{i=1}^{${n}} (${a} + ${d}i)$.`
    answer = String(sum + d * n * (n + 1) / 2 - d * n)
    // Actually: sum of (a + d*i) for i=1..n = n*a + d*sum(i) = n*a + d*n*(n+1)/2
    const actualSum = n * a + d * n * (n + 1) / 2
    answer = String(actualSum)
    hint = 'Split the sum: $\\sum (a + di) = na + d\\sum i$. Use $\\sum_{i=1}^{n} i = \\frac{n(n+1)}{2}$.'
    explanation = `$\\sum_{i=1}^{${n}} (${a} + ${d}i) = ${n}(${a}) + ${d} \\times \\frac{${n}(${n}+1)}{2} = ${n * a} + ${d * n * (n + 1) / 2} = ${actualSum}$.`
    options = new Set([answer, String(actualSum + d), String(actualSum - d), String(n * a + d * n)])
  } else if (qType === 'arithmetic_geometric_mean') {
    const a = rng.int(2, 10)
    const d = rng.int(2, 8)
    const n = rng.int(5, 12)
    const nth = a + (n - 1) * d
    const am = (a + nth) / 2
    question = `Find the arithmetic mean between the first and ${n}th term of the arithmetic sequence ${a}, ${a + d}, ${a + 2 * d}, ...`
    answer = String(am)
    hint = 'The arithmetic mean of two numbers is their average.'
    explanation = `The ${n}th term is $a_{${n}} = ${a} + (${n}-1)(${d}) = ${nth}$. The arithmetic mean is $\\frac{${a} + ${nth}}{2} = ${am}$.`
    options = new Set([answer, String(am + d), String(am - d), String(a + nth)])
  }

  return { question, options: finalizeOptions(options, rng), answer, hint, explanation, difficulty }
}
