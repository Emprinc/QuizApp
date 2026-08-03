// Polynomial functions question generator — ported from _generate_polynomial_functions_question
import type { Difficulty, RNG, GeneratedQuestion } from '../types'
import { finalizeOptions } from '../../lib/mathFormat'

export function generatePolynomialFunctionsQuestion(difficulty: Difficulty, rng: RNG): GeneratedQuestion {
  let qType: string
  if (difficulty === 'Easy') {
    qType = 'remainder_theorem'
  } else if (difficulty === 'Medium') {
    qType = 'factor_theorem'
  } else {
    qType = 'find_all_roots'
  }

  let question = '', answer = '', hint = '', explanation = ''
  let options = new Set<string>()

  if (qType === 'remainder_theorem') {
    let a = rng.int(-5, 5)
    while (a === 0) a = rng.int(-5, 5)
    const b = rng.int(-5, 5)
    const c = rng.int(-5, 5)
    const d = rng.int(-5, 5)
    const divisorRoot = rng.int(-3, 3)
    question = `Find the remainder when the polynomial $P(x) = ${a}x^3 + ${b}x^2 + ${c}x + ${d}$ is divided by $(x - ${divisorRoot})$.`
    const remainder = a * (divisorRoot ** 3) + b * (divisorRoot ** 2) + c * divisorRoot + d
    answer = String(remainder)
    hint = `According to the Remainder Theorem, the remainder when $P(x)$ is divided by $(x-a)$ is simply $P(a)$. In this case, a = ${divisorRoot}.`
    explanation = `We need to evaluate $P(${divisorRoot})$:\n$P(${divisorRoot}) = ${a}(${divisorRoot})^3 + ${b}(${divisorRoot})^2 + ${c}(${divisorRoot}) + ${d} = ${remainder}$.`
    options = new Set([answer, String(d), String(a + b + c + d)])
  } else if (qType === 'factor_theorem') {
    const root = rng.int(1, 3)
    let a = rng.int(1, 3)
    let c = rng.int(1, 5)
    let d = rng.int(1, 10)
    while ((a * (root ** 3) + c * root + d) % (root ** 2) !== 0) {
      a = rng.int(1, 3)
      c = rng.int(1, 5)
      d = rng.int(1, 10)
    }
    const k = -Math.floor((a * (root ** 3) + c * root + d) / (root ** 2))
    if (k === 0) return generatePolynomialFunctionsQuestion(difficulty, rng)
    question = `Given that $(x - ${root})$ is a factor of the polynomial $P(x) = ${a}x^3 + kx^2 + ${c}x + ${d}$, find the value of the constant $k$.`
    answer = String(k)
    hint = `By the Factor Theorem, if $(x-a)$ is a factor of $P(x)$, then $P(a) = 0$. Set $P(${root}) = 0$ and solve for $k$.`
    explanation =
      `Since $(x - ${root})$ is a factor, we know that $P(${root}) = 0$.\n` +
      `$P(${root}) = ${a}(${root})^3 + k(${root})^2 + ${c}(${root}) + ${d} = 0$.\n` +
      `${a * root ** 3} + ${k * root ** 2}k + ${c * root + d} = 0$.\n` +
      `${k * root ** 2}k = -(${a * root ** 3 + c * root + d})$.\n` +
      `k = ${-(a * root ** 3 + c * root + d)} / ${root ** 2} = ${k}.`
    options = new Set([answer, String(-k), String(root), String(a + c + d)])
  } else if (qType === 'find_all_roots') {
    let r1: number, r2: number, r3: number
    do {
      ;[r1, r2, r3] = rng.sample(Array.from({ length: 9 }, (_, i) => i - 4), 3)
    } while (r1 === 0 || r2 === 0 || r3 === 0)
    const b = -(r1 + r2 + r3)
    const c = r1 * r2 + r1 * r3 + r2 * r3
    const d = -(r1 * r2 * r3)
    const polyStr = `x^3 ${b >= 0 ? '+' : ''} ${b}x^2 ${c >= 0 ? '+' : ''} ${c}x ${d >= 0 ? '+' : ''} ${d}`
    const givenFactorRoot = r1
    question = `Given that $(x - ${givenFactorRoot})$ is a factor of the polynomial $P(x) = ${polyStr}$, find all the roots of the equation $P(x) = 0$.`
    const allRoots = [r1, r2, r3].sort((x, y) => x - y)
    answer = `x = ${allRoots[0]}, ${allRoots[1]}, ${allRoots[2]}`
    hint = 'Use the given factor to perform polynomial long division (or synthetic division) on P(x). Then, solve the resulting quadratic equation to find the other two roots.'
    explanation =
      `1. We know $x=${givenFactorRoot}$ is one root.\n` +
      `2. Dividing $P(x)$ by $(x - ${givenFactorRoot})$ gives the quadratic factor $x^2 - (${r2 + r3})x + ${r2 * r3} = 0$.\n` +
      `3. Factoring this quadratic gives $(x - ${r2})(x - ${r3}) = 0$, so the other roots are $x=${r2}$ and $x=${r3}$.\n` +
      `4. The complete set of roots is ${answer}.`
    options = new Set([answer, `x = ${r1}, ${-r2}, ${-r3}`, `x = ${b}, ${c}, ${d}`])
  }

  return { question, options: finalizeOptions(options, rng), answer, hint, explanation, difficulty }
}
