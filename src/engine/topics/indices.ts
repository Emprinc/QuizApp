// Indices question generator — ported from _generate_indices_question
import type { Difficulty, RNG, GeneratedQuestion } from '../types'
import { Fraction } from '../../lib/fraction'
import { formatFractionText, finalizeOptions } from '../../lib/mathFormat'

export function generateIndicesQuestion(difficulty: Difficulty, rng: RNG): GeneratedQuestion {
  let qType: string
  if (difficulty === 'Easy') {
    qType = rng.pick(['laws', 'standard_form'])
  } else if (difficulty === 'Medium') {
    qType = rng.pick(['fractional', 'solve_same_base'])
  } else {
    qType = 'solve_different_base'
  }

  let question = '', answer = '', hint = '', explanation = ''
  let options = new Set<string>()

  if (qType === 'laws') {
    const base = rng.int(2, 7)
    const p1 = rng.int(5, 10)
    const p2 = rng.int(2, 4)
    const [op, sym, resP, rule] = rng.pick<[string, string, number, string]>([
      ['multiply', '\\times', p1 + p2, 'a^m \\times a^n = a^{m+n}'],
      ['divide', '\\div', p1 - p2, 'a^m \\div a^n = a^{m-n}'],
      ['power', ')', p1 * p2, '(a^m)^n = a^{mn}'],
    ])
    if (op === 'power') {
      question = `Simplify the expression: $(${base}^{${p1}})^{${p2}}$`
      explanation = `Using the power of a power rule, $(x^a)^b = x^{ab}$, we get $(${base}^{${p1}})^{${p2}} = ${base}^{${p1 * p2}}$.`
    } else {
      question = `Simplify the expression: $${base}^{${p1}} ${sym} ${base}^{${p2}}$`
      explanation = `Using the ${op} rule, $${rule}$, we get $${base}^{${p1}} ${sym} ${base}^{${p2}} = ${base}^{${resP}}$.`
    }
    answer = `$${base}^{${resP}}$`
    hint = `Recall the laws of indices for '${op}' operations.`
    options = new Set([answer, `$${base}^{${p1 + p2}}$`, `$${base}^{${p1 > p2 ? p1 - p2 : p2 - p1}}$`])
  } else if (qType === 'standard_form') {
    const num = Number((Math.random() * (9.9 - 1.0) + 1.0).toFixed(rng.int(2, 4)))
    const power = rng.int(3, 6)
    const intPartLen = String(Math.floor(num)).length
    const decimalForm = (num / Math.pow(10, power)).toFixed(power + intPartLen)
    answer = `$${num} \\times 10^{-${power}}$`
    const distractors = new Set([
      `$${num} \\times 10^{${power}}$`,
      `$${Number((num * 10).toFixed(2))} \\times 10^{-${power + 1}}$`,
    ])
    question = `A measurement is recorded as ${decimalForm} metres. Express this number in standard form.`
    hint = 'Standard form is written as $A \\times 10^n$, where $1 \\le A < 10$. Count how many places the decimal point must move.'
    explanation = `To get the number ${num} (which is between 1 and 10), we must move the decimal point ${power} places to the right. Moving to the right corresponds to a negative exponent. Thus, the standard form is ${answer}.`
    options = new Set([answer, ...distractors])
  } else if (qType === 'fractional') {
    const baseNum = rng.pick([4, 8, 9, 16, 27, 64])
    const root = [4, 9, 16].includes(baseNum) ? 2 : 3
    const power = rng.int(2, 3)
    question = `Evaluate: $${baseNum}^{\\frac{${power}}{${root}}}$`
    const res = Math.round(Math.pow(Math.pow(baseNum, 1 / root), power))
    answer = String(res)
    hint = 'First, find the root of the base number (denominator of the fraction), then apply the power (numerator of the fraction).'
    explanation = `The expression $${baseNum}^{\\frac{${power}}{${root}}}$ means $(\\sqrt[${root}]{${baseNum}})^{${power}}$.\n1. $\\sqrt[${root}]{${baseNum}} = ${Math.floor(Math.pow(baseNum, 1 / root))}$.\n2. $(${Math.floor(Math.pow(baseNum, 1 / root))})^{${power}} = ${res}$.`
    options = new Set([answer, String(Math.floor((baseNum * power) / root)), String(Math.floor(baseNum + power / root))])
  } else if (qType === 'solve_same_base') {
    const base = rng.int(2, 5)
    let power = rng.int(2, 4)
    const a = 2
    let b = -1
    while ((power - b) % a !== 0) power = rng.int(2, 5)
    question = `Solve for the variable $x$: $${base}^{${a}x + (${b})} = ${Math.pow(base, power)}$`
    answer = formatFractionText(new Fraction(power - b, a))
    hint = 'If the bases on both sides of an equation are the same, you can set the exponents equal to each other.'
    explanation = `1. The equation is $${base}^{${a}x + (${b})} = ${Math.pow(base, power)}$.\n2. Since the bases are equal, equate the exponents: $${a}x + (${b}) = ${power}$.\n3. $${a}x = ${power - b}$.\n4. $x = \\frac{${power - b}}{${a}}$.`
    options = new Set([answer, String(power), String(power - b)])
  } else if (qType === 'solve_different_base') {
    const problems: [number, number, number, number, number][] = [
      [4, 2, 8, 3, 2],
      [9, 2, 27, 3, 3],
      [8, 3, 4, 2, 2],
    ]
    const [base1, p1, base2, p2, commonBase] = rng.pick(problems)
    const k = rng.int(1, 4)
    const xValFrac = new Fraction(-p2 * k, p1 - p2)
    if (Number(xValFrac.denominator) !== 1) {
      return generateIndicesQuestion(difficulty, rng)
    }
    const xVal = Number(xValFrac.numerator)
    question = `Solve for x in the equation: $${base1}^x = ${base2}^{x-${k}}$`
    answer = String(xVal)
    hint = 'Express both sides of the equation as powers of the same common base.'
    explanation =
      `1. The common base for ${base1} and ${base2} is ${commonBase}.\n` +
      `2. Rewrite the equation: $(${commonBase}^{${p1}})^x = (${commonBase}^{${p2}})^{x-${k}}$.\n` +
      `3. Simplify exponents: $${commonBase}^{${p1}x} = ${commonBase}^{${p2}(x-${k})}$.\n` +
      `4. Equate exponents: $${p1}x = ${p2}x - ${p2 * k}$.\n` +
      `5. Solve for x: $(${p1 - p2})x = ${-p2 * k} \\implies x = ${xVal}$.`
    options = new Set([answer, String(k), String(xVal + 1), String(xVal - 1)])
  }

  return { question, options: finalizeOptions(options, rng), answer, hint, explanation, difficulty }
}
