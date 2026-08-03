// Surds question generator — ported from _generate_surds_question
import type { Difficulty, RNG, GeneratedQuestion } from '../types'
import { Fraction } from '../../lib/fraction'
import { getFractionLatexCode, formatFractionText, finalizeOptions } from '../../lib/mathFormat'

// Helper: find the largest perfect square factor of n
function largestSquareFactor(n: number): [number, number] {
  let largest = 1
  let root = 1
  for (let i = 2; i * i <= n; i++) {
    if (n % (i * i) === 0) {
      largest = i
      root = n / (i * i)
    }
  }
  return [largest, root === 1 ? n : root]
}

// Helper: simplify a surd a*sqrt(b)
function simplifySurd(n: number): [number, number] {
  let coeff = 1
  let rad = n
  for (let i = 2; i * i <= rad; i++) {
    while (rad % (i * i) === 0) {
      coeff *= i
      rad = rad / (i * i)
    }
  }
  return [coeff, rad]
}

export function generateSurdsQuestion(difficulty: Difficulty, rng: RNG): GeneratedQuestion {
  let qType: string
  if (difficulty === 'Easy') {
    qType = rng.pick(['identify', 'simplify_single', 'ops_like_surds'])
  } else if (difficulty === 'Medium') {
    qType = rng.pick(['ops_unlike_surds', 'expand_single_bracket', 'rationalize_monomial', 'geometry_context'])
  } else {
    qType = rng.pick(['rationalize_complex', 'nested_square_root', 'equality_of_surds', 'quadratic_roots', 'geometry_hard'])
  }

  let question = '', answer = '', hint = '', explanation = ''
  let options = new Set<string>()

  if (qType === 'identify') {
    const allNumbers = rng.sample(Array.from({ length: 20 }, (_, i) => i + 2), 5)
    const surdIdx = rng.int(0, 4)
    const surdNum = allNumbers[surdIdx]
    question = `Which of the following is a surd (irrational number)?`
    answer = `$\\sqrt{${surdNum}}$`
    hint = 'A surd is an irrational root. If the square root of a number is not a whole number, it is a surd.'
    const sqrtVal = Math.sqrt(surdNum)
    explanation = `$\\sqrt{${surdNum}} \\approx ${sqrtVal.toFixed(4)}$, which is not a whole number, so it is a surd. The others have exact square roots.`
    options = new Set([answer, ...allNumbers.filter((_, i) => i !== surdIdx).map((n) => `$\\sqrt{${n * n}}$`)])
  } else if (qType === 'simplify_single') {
    const factors = [2, 3, 5, 6, 7, 10, 12, 15]
    const rad = rng.pick(factors)
    const [coeff, simpRad] = simplifySurd(rad * rng.int(2, 6) ** 2)
    const fullRad = rad * rng.int(2, 6) ** 2
    const [c, r] = simplifySurd(fullRad)
    question = `Simplify $\\sqrt{${fullRad}}$.`
    answer = r === 1 ? String(c) : `$${c}\\sqrt{${r}}$`
    hint = 'Look for the largest perfect square that divides the number under the root.'
    explanation = `$\\sqrt{${fullRad}} = \\sqrt{${c * c} \\times ${r}} = ${c}\\sqrt{${r}}$.`
    options = new Set([answer, `$\\sqrt{${fullRad / 2}}$`, `$${c * 2}\\sqrt{${r}}$`])
  } else if (qType === 'ops_like_surds') {
    const rad = rng.pick([2, 3, 5, 7])
    const a = rng.int(1, 9)
    const b = rng.int(1, 9)
    const [op, sym] = rng.pick<[string, string]>([['add', '+'], ['subtract', '-']])
    question = `Simplify $${a}\\sqrt{${rad}} ${sym} ${b}\\sqrt{${rad}}$.`
    const res = op === 'add' ? a + b : Math.abs(a - b)
    answer = `$${res}\\sqrt{${rad}}$`
    hint = 'Like surds (same number under the root) can be added or subtracted by combining their coefficients.'
    explanation = `Since both surds have the same radical part ($\\sqrt{${rad}}$), we ${op} the coefficients: $${a} ${sym} ${b} = ${res}$. So the answer is $${res}\\sqrt{${rad}}$.`
    options = new Set([answer, `$${a + b}\\sqrt{${rad * 2}}$`, `$${a * b}\\sqrt{${rad}}$`])
  } else if (qType === 'ops_unlike_surds') {
    const rad1 = rng.pick([2, 3])
    const rad2 = rad1 === 2 ? 3 : 2
    const a = rng.int(1, 6)
    const b = rng.int(1, 6)
    question = `Simplify $${a}\\sqrt{${rad1}} + ${b}\\sqrt{${rad2}}$.`
    answer = `$${a}\\sqrt{${rad1}} + ${b}\\sqrt{${rad2}}$`
    hint = 'Unlike surds (different numbers under the root) cannot be combined. The expression is already in its simplest form.'
    explanation = `Since $\\sqrt{${rad1}}$ and $\\sqrt{${rad2}}$ are different surds, they cannot be combined. The expression $${a}\\sqrt{${rad1}} + ${b}\\sqrt{${rad2}}$ is already simplified.`
    options = new Set([answer, `$${a + b}\\sqrt{${rad1 + rad2}}$`, `$${a + b}\\sqrt{${rad1}}$`])
  } else if (qType === 'expand_single_bracket') {
    const a = rng.int(2, 6)
    const b = rng.int(2, 10)
    const rad = rng.pick([2, 3, 5])
    question = `Expand and simplify $${a}\\sqrt{${rad}}(${a}\\sqrt{${rad}} + ${b})$.`
    const term1 = a * a * rad
    const term2 = a * b
    answer = `$${term1} + ${term2}\\sqrt{${rad}}$`
    hint = 'Use the distributive law: multiply the term outside by each term inside the bracket.'
    explanation = `$${a}\\sqrt{${rad}} \\times ${a}\\sqrt{${rad}} = ${a * a} \\times ${rad} = ${term1}$.\n$${a}\\sqrt{${rad}} \\times ${b} = ${term2}\\sqrt{${rad}}$.\nSo the result is $${term1} + ${term2}\\sqrt{${rad}}$.`
    options = new Set([answer, `$${term1 + term2}\\sqrt{${rad}}$`, `$${a * a}\\sqrt{${rad}} + ${b}\\sqrt{${rad}}$`])
  } else if (qType === 'rationalize_monomial') {
    const rad = rng.pick([2, 3, 5, 7])
    const num = rng.int(1, 9)
    question = `Rationalize the denominator and simplify $\\frac{${num}}{\\sqrt{${rad}}}$.`
    answer = `$\\frac{${num}\\sqrt{${rad}}}{${rad}}$`
    hint = 'Multiply both numerator and denominator by the surd in the denominator.'
    explanation = `Multiply by $\\frac{\\sqrt{${rad}}}{\\sqrt{${rad}}}$: $\\frac{${num}}{\\sqrt{${rad}}} \\times \\frac{\\sqrt{${rad}}}{\\sqrt{${rad}}} = \\frac{${num}\\sqrt{${rad}}}{${rad}}$.`
    options = new Set([answer, `$\\frac{${num}\\sqrt{${rad}}}{${rad * rad}}$`, `$\\frac{\\sqrt{${rad}}}{${num}}$`])
  } else if (qType === 'geometry_context') {
    const side = rng.int(3, 10)
    question = `A square has a side length of $${side}\\sqrt{2}$ cm. Find the exact area of the square.`
    answer = `$${side * side * 2}$ cm$^2$`
    hint = 'The area of a square is side × side. Remember that $\\sqrt{a} \\times \\sqrt{a} = a$.'
    explanation = `Area $= (${side}\\sqrt{2})^2 = ${side}^2 \\times (\\sqrt{2})^2 = ${side * side} \\times 2 = ${side * side * 2}$ cm$^2$.`
    options = new Set([answer, `$${side * side}\\sqrt{2}$ cm$^2$`, `$${side * 2}$ cm$^2$`])
  } else if (qType === 'rationalize_complex') {
    const a = rng.int(1, 5)
    const b = rng.pick([2, 3, 5])
    const c = rng.int(1, 5)
    const d = rng.pick([2, 3, 5])
    while (d === b) { /* ensure different */ }
    question = `Rationalize the denominator of $\\frac{${a}}{${c} + \\sqrt{${b}}}$.`
    const numer = a * (c - Math.sqrt(b))
    const denom = c * c - b
    answer = `$\\frac{${a * c} - ${a}\\sqrt{${b}}}{${denom}}$`
    hint = 'Multiply both numerator and denominator by the conjugate of the denominator.'
    explanation = `Multiply by $\\frac{${c} - \\sqrt{${b}}}{${c} - \\sqrt{${b}}}$:\nNumerator: $${a}(${c} - \\sqrt{${b}}) = ${a * c} - ${a}\\sqrt{${b}}$\nDenominator: $(${c})^2 - (\\sqrt{${b}})^2 = ${c * c} - ${b} = ${denom}$\nResult: $\\frac{${a * c} - ${a}\\sqrt{${b}}}{${denom}}$.`
    options = new Set([answer, `$\\frac{${a * c} + ${a}\\sqrt{${b}}}{${denom}}$`, `$\\frac{${a}(${c} - \\sqrt{${b}})}{${c * c + b}}$`])
  } else if (qType === 'nested_square_root') {
    const inner = rng.pick([2, 3, 5])
    const outer = rng.int(2, 5)
    const fullVal = inner * outer * outer
    question = `Simplify $\\sqrt{${fullVal} + \\sqrt{${inner * inner * outer * outer * 4}}}$.`
    // Simpler: simplify sqrt(a) where a has a nice form
    const a = rng.int(2, 6)
    const b = rng.int(2, 6)
    question = `Express $\\sqrt{${a} + \\sqrt{${b}}}$ in the form $\\sqrt{x} + \\sqrt{y}$.`
    // This is hard; let's use a simpler version
    const x = rng.int(2, 8)
    const y = rng.int(2, 8)
    question = `Simplify $\\sqrt{${x * x} + 2\\sqrt{${x * x * y * y}} + ${y * y}}$.`
    answer = `$${x} + ${y}$`
    hint = 'Recognize this as a perfect square: $(\\sqrt{a} + \\sqrt{b})^2 = a + 2\\sqrt{ab} + b$.'
    explanation = `$${x * x} + 2\\sqrt{${x * x * y * y}} + ${y * y} = (${x})^2 + 2(${x})(${y}) + (${y})^2 = (${x} + ${y})^2$.\nSo $\\sqrt{${x * x} + 2\\sqrt{${x * x * y * y}} + ${y * y}} = ${x} + ${y}$.`
    options = new Set([answer, `$${x * y}$`, `$${x + y}\\sqrt{${x * y}}$`])
  } else if (qType === 'equality_of_surds') {
    const a = rng.int(2, 9)
    const b = rng.int(2, 9)
    const c = rng.int(2, 9)
    question = `If $${a}\\sqrt{${b}} = \\sqrt{${c}}$, find the value of $c$.`
    answer = String(a * a * b)
    hint = 'Square both sides to remove the square roots, then solve for the unknown.'
    explanation = `Squaring both sides: $(${a}\\sqrt{${b}})^2 = (\\sqrt{c})^2$\n$${a * a} \\times ${b} = c$\n$c = ${a * a * b}$.`
    options = new Set([answer, String(a * b), String(a + b)])
  } else if (qType === 'quadratic_roots') {
    const a = rng.pick([1, 2, 3])
    const b = rng.int(1, 6)
    const root1 = `\\sqrt{${b}}`
    const root2 = `-\\sqrt{${b}}`
    question = `Find the roots of the equation $${a}x^2 - ${a * b} = 0$. Express your answer in surd form.`
    answer = `$x = \\pm\\sqrt{${b}}$`
    hint = 'Rearrange to isolate $x^2$, then take the square root of both sides.'
    explanation = `$${a}x^2 = ${a * b}$\n$x^2 = ${b}$\n$x = \\pm\\sqrt{${b}}$.`
    options = new Set([answer, `$x = \\pm\\sqrt{${a * b}}$`, `$x = \\pm ${b}$`])
  } else if (qType === 'geometry_hard') {
    const side = rng.int(2, 8)
    const diag = side * Math.sqrt(2)
    question = `A square has a diagonal of length $${side}\\sqrt{2}$ cm. Find the exact perimeter of the square.`
    answer = `$${side * 4}$ cm`
    hint = 'The diagonal of a square with side $s$ is $s\\sqrt{2}$. Use this to find the side length.'
    explanation = `If the diagonal is $${side}\\sqrt{2}$, then the side length is $${side}$ cm.\nPerimeter $= 4 \\times ${side} = ${side * 4}$ cm.`
    options = new Set([answer, `$${side * 2}\\sqrt{2}$ cm`, `$${side * 4}\\sqrt{2}$ cm`])
  }

  return { question, options: finalizeOptions(options, rng), answer, hint, explanation, difficulty }
}
