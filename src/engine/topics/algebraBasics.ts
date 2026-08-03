// Algebra basics question generator — ported from _generate_algebra_basics_question
import type { Difficulty, RNG, GeneratedQuestion } from '../types'
import { Fraction } from '../../lib/fraction'
import { getFractionLatexCode, formatFractionText, finalizeOptions, polyToStr } from '../../lib/mathFormat'

export function generateAlgebraBasicsQuestion(difficulty: Difficulty, rng: RNG): GeneratedQuestion {
  let qType: string
  if (difficulty === 'Easy') {
    qType = rng.pick(['solve_linear', 'collect_like_terms', 'substitution'])
  } else if (difficulty === 'Medium') {
    qType = rng.pick(['expand_brackets', 'factor_quadratic_simple', 'solve_linear_brackets'])
  } else {
    qType = rng.pick(['factor_quadratic_hard', 'simultaneous_equations', 'algebraic_fractions'])
  }

  let question = '', answer = '', hint = '', explanation = ''
  let options = new Set<string>()

  if (qType === 'solve_linear') {
    const a = rng.int(2, 9)
    const b = rng.int(1, 10)
    const c = rng.int(1, 20)
    const xVal = (c - b) / a
    if (xVal !== Math.round(xVal)) {
      return generateAlgebraBasicsQuestion(difficulty, rng)
    }
    question = `Solve for $x$: $${a}x + ${b} = ${c}$.`
    answer = `x = ${xVal}`
    hint = 'Move the constant to the right side, then divide by the coefficient of x.'
    explanation = `$${a}x = ${c} - ${b} = ${c - b}$\n$x = \\frac{${c - b}}{${a}} = ${xVal}$.`
    options = new Set([answer, `x = ${xVal + 1}`, `x = ${xVal - 1}`, `x = ${(c + b) / a}`])
  } else if (qType === 'collect_like_terms') {
    const a = rng.int(2, 9)
    const b = rng.int(2, 9)
    const c = rng.int(2, 9)
    const d = rng.int(2, 9)
    question = `Simplify the expression: $${a}x + ${b} - ${c}x + ${d}$.`
    answer = `$${a - c}x + ${b + d}$`
    hint = 'Combine the x terms and the constant terms separately.'
    explanation = `x terms: $${a}x - ${c}x = ${a - c}x$.\nConstants: $${b} + ${d} = ${b + d}$.\nResult: $${a - c}x + ${b + d}$.`
    options = new Set([answer, `$${a + c}x + ${b + d}$`, `$${a - c}x - ${b + d}$`, `$${a + c}x - ${b + d}$`])
  } else if (qType === 'substitution') {
    const a = rng.int(2, 9)
    const b = rng.int(1, 9)
    const x = rng.int(-5, 5)
    question = `If $f(x) = ${a}x - ${b}$, find $f(${x})$.`
    answer = String(a * x - b)
    hint = 'Substitute the value of x into the expression and evaluate.'
    explanation = `$f(${x}) = ${a}(${x}) - ${b} = ${a * x} - ${b} = ${a * x - b}$.`
    options = new Set([answer, String(a * x + b), String(a * x - b + 1), String(a + b * x)])
  } else if (qType === 'expand_brackets') {
    const a = rng.int(2, 6)
    const b = rng.int(2, 6)
    const c = rng.int(2, 6)
    question = `Expand and simplify: $${a}(x + ${b}) - ${c}(x - ${b})$.`
    const xCoeff = a - c
    const constTerm = a * b + c * b
    answer = `$${xCoeff}x + ${constTerm}$`
    hint = 'Use the distributive law to multiply each bracket, then combine like terms.'
    explanation = `$${a}(x + ${b}) = ${a}x + ${a * b}$\n$${c}(x - ${b}) = ${c}x - ${c * b}$\n${a}x + ${a * b} - ${c}x + ${c * b} = ${xCoeff}x + ${constTerm}$.`
    options = new Set([answer, `$${a + c}x + ${constTerm}$`, `$${a - c}x - ${constTerm}$`, `$${a + c}x - ${constTerm}$`])
  } else if (qType === 'factor_quadratic_simple') {
    const root1 = rng.int(1, 5)
    const root2 = rng.int(1, 5)
    const b = -(root1 + root2)
    const c = root1 * root2
    question = `Factorize: $x^2 ${b >= 0 ? '+' : '-'} ${Math.abs(b)}x ${c >= 0 ? '+' : '-'} ${Math.abs(c)}$.`
    answer = `$(x ${root1 === -root1 ? '' : ''} - ${root1})(x - ${root2})$`
    // Fix: roots are positive, so factors are (x - root1)(x - root2)
    answer = `$(x - ${root1})(x - ${root2})$`
    hint = 'Find two numbers that multiply to give the constant term and add to give the coefficient of x.'
    explanation = `We need two numbers that multiply to ${c} and add to ${b}. These are $-${root1}$ and $-${root2}$.\nSo $x^2 ${b >= 0 ? '+' : '-'} ${Math.abs(b)}x ${c >= 0 ? '+' : '-'} ${Math.abs(c)} = (x - ${root1})(x - ${root2})$.`
    options = new Set([answer, `$(x + ${root1})(x + ${root2})$`, `$(x - ${root1})(x + ${root2})$`, `$(x + ${root1})(x - ${root2})$`])
  } else if (qType === 'solve_linear_brackets') {
    const a = rng.int(2, 5)
    const b = rng.int(1, 5)
    const c = rng.int(1, 5)
    const d = rng.int(10, 20)
    // a(x + b) = c(x + d) => ax + ab = cx + cd => (a-c)x = cd - ab
    const xCoeff = a - c
    const rhs = c * d - a * b
    if (xCoeff === 0 || rhs % xCoeff !== 0) {
      return generateAlgebraBasicsQuestion(difficulty, rng)
    }
    const xVal = rhs / xCoeff
    question = `Solve for $x$: $${a}(x + ${b}) = ${c}(x + ${d})$.`
    answer = `x = ${xVal}`
    hint = 'Expand both brackets, then collect like terms and solve for x.'
    explanation = `$${a}x + ${a * b} = ${c}x + ${c * d}$\n$${a - c}x = ${c * d} - ${a * b}$\n$${a - c}x = ${rhs}$\n$x = \\frac{${rhs}}{${a - c}} = ${xVal}$.`
    options = new Set([answer, `x = ${xVal + 1}`, `x = ${xVal - 1}`, `x = ${rhs / (a + c)}`])
  } else if (qType === 'factor_quadratic_hard') {
    const a = rng.pick([2, 3, 4])
    const root1 = rng.int(1, 4)
    const root2 = rng.int(1, 4)
    // ax^2 + bx + c = a(x - root1)(x - root2)
    // = a(x^2 - (root1+root2)x + root1*root2)
    // = ax^2 - a(root1+root2)x + a*root1*root2
    const b = -a * (root1 + root2)
    const c = a * root1 * root2
    question = `Factorize: $${a}x^2 ${b >= 0 ? '+' : '-'} ${Math.abs(b)}x ${c >= 0 ? '+' : '-'} ${Math.abs(c)}$.`
    answer = `$${a}(x - ${root1})(x - ${root2})$`
    hint = 'First factor out the leading coefficient, then find two numbers that multiply and add correctly.'
    explanation = `Factor out ${a}: $${a}(x^2 ${(-root1 - root2) >= 0 ? '+' : '-'} ${root1 + root2}x ${root1 * root2 >= 0 ? '+' : '-'} ${Math.abs(root1 * root2)})$.\nThe two numbers that multiply to ${root1 * root2} and add to ${-(root1 + root2)} are $-${root1}$ and $-${root2}$.\nSo the factorization is $${a}(x - ${root1})(x - ${root2})$.`
    options = new Set([answer, `$${a}(x + ${root1})(x + ${root2})$`, `$(x - ${root1})(x - ${root2})$`, `$${a}(x - ${root1 * 2})(x - ${root2})$`])
  } else if (qType === 'simultaneous_equations') {
    const a1 = rng.int(2, 5)
    const b1 = rng.int(2, 5)
    const x = rng.int(1, 5)
    const y = rng.int(1, 5)
    const c1 = a1 * x + b1 * y
    const a2 = rng.int(2, 5)
    const b2 = rng.int(2, 5)
    const c2 = a2 * x + b2 * y
    // Ensure unique solution
    if (a1 * b2 === a2 * b1) {
      return generateAlgebraBasicsQuestion(difficulty, rng)
    }
    question = `Solve the simultaneous equations:\n$${a1}x + ${b1}y = ${c1}$\n$${a2}x + ${b2}y = ${c2}$`
    answer = `x = ${x}, y = ${y}`
    hint = 'Use elimination or substitution to solve for one variable, then substitute back.'
    explanation = `By elimination or substitution, we find $x = ${x}$ and $y = ${y}$.\nCheck: $${a1}(${x}) + ${b1}(${y}) = ${a1 * x + b1 * y} = ${c1}$ ✓\n$${a2}(${x}) + ${b2}(${y}) = ${a2 * x + b2 * y} = ${c2}$ ✓`
    options = new Set([answer, `x = ${y}, y = ${x}`, `x = ${x + 1}, y = ${y}`, `x = ${x}, y = ${y + 1}`])
  } else if (qType === 'algebraic_fractions') {
    const a = rng.int(2, 6)
    const b = rng.int(2, 6)
    const c = rng.int(2, 6)
    question = `Simplify the algebraic fraction: $\\frac{${a}x + ${a * b}}{${a}}$.`
    answer = `$x + ${b}$`
    hint = 'Factor the numerator, then cancel the common factor.'
    explanation = `$\\frac{${a}x + ${a * b}}{${a}} = \\frac{${a}(x + ${b})}{${a}} = x + ${b}$.`
    options = new Set([answer, `$x + ${a}$`, `$x + ${c}$`, `$${b}x + ${b}$`])
  }

  return { question, options: finalizeOptions(options, rng), answer, hint, explanation, difficulty }
}
