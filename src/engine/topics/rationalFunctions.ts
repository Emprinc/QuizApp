// Rational functions question generator — ported from _generate_rational_functions_question
import type { Difficulty, RNG, GeneratedQuestion } from '../types'
import { Fraction } from '../../lib/fraction'
import { getFractionLatexCode, finalizeOptions, polyToStr } from '../../lib/mathFormat'

export function generateRationalFunctionsQuestion(difficulty: Difficulty, rng: RNG): GeneratedQuestion {
  let qType: string
  if (difficulty === 'Easy') {
    qType = rng.pick(['simplify_expression', 'solve_equation'])
  } else if (difficulty === 'Medium') {
    qType = rng.pick(['domain', 'vertical_asymptotes', 'horizontal_asymptotes'])
  } else {
    qType = rng.pick(['find_holes', 'slant_asymptotes'])
  }

  let question = '', answer = '', hint = '', explanation = ''
  let options = new Set<string>()

  if (qType === 'simplify_expression') {
    let holeRoot: number, numRoot: number, denRoot: number
    do {
      ;[holeRoot, numRoot, denRoot] = rng.sample(Array.from({ length: 11 }, (_, i) => i - 5), 3)
    } while (holeRoot === 0 || numRoot === 0 || denRoot === 0)
    const numPoly = [1, -(holeRoot + numRoot), holeRoot * numRoot]
    const denPoly = [1, -(holeRoot + denRoot), holeRoot * denRoot]
    const funcStr = `f(x) = \\frac{${polyToStr(numPoly)}}{${polyToStr(denPoly)}}`
    question = `Simplify the rational expression completely: $${funcStr}$`
    answer = `$\\frac{x ${numRoot > 0 ? '-' : '+'} ${Math.abs(numRoot)}}{x ${denRoot > 0 ? '-' : '+'} ${Math.abs(denRoot)}}$`
    hint = 'Factor both the numerator and the denominator, then cancel any common factors.'
    explanation = `1. Factored form: $f(x) = \\frac{(x - ${holeRoot})(x - ${numRoot})}{(x - ${holeRoot})(x - ${denRoot})}$.\n\n2. Cancel the common factor $(x - ${holeRoot})$.\n\n3. The simplified expression is **${answer}**.`
    options = new Set([answer, `$\\frac{x - ${holeRoot}}{x - ${denRoot}}$`])
  } else if (qType === 'solve_equation') {
    const b = rng.int(-5, 5)
    const c = rng.int(-5, 5)
    let xSol = rng.int(-5, 5)
    while (xSol === b) xSol = rng.int(-5, 6)
    const a = c * (xSol - b)
    if (a === 0 || c === 0) return generateRationalFunctionsQuestion(difficulty, rng)
    question = `Solve for x: $\\frac{${a}}{x - ${b}} = ${c}$`
    answer = String(xSol)
    hint = 'Multiply both sides by the denominator to eliminate the fraction, then solve the resulting linear equation.'
    explanation = `1. Multiply both sides by $(x - ${b})$: $${a} = ${c}(x - ${b})$.\n\n2. Distribute: $${a} = ${c}x - ${c * b}$.\n\n3. Solve for x: $${c}x = ${a + c * b} \\implies x = \\frac{${a + c * b}}{${c}} = ${xSol}$.`
    options = new Set([answer, String(b), String(xSol + 1)])
  } else if (qType === 'domain' || qType === 'vertical_asymptotes') {
    const [r1, r2] = rng.sample(Array.from({ length: 11 }, (_, i) => i - 5), 2)
    const nR = r1 !== r2 - 1 ? r1 + 1 : r1 + 2
    const numPoly = [1, -nR]
    const denPoly = [1, -(r1 + r2), r1 * r2]
    const funcStr = `f(x) = \\frac{${polyToStr(numPoly)}}{${polyToStr(denPoly)}}`
    if (qType === 'domain') {
      question = `Find the domain of the function: $${funcStr}$`
      answer = `All real numbers except $x=${r1}$ and $x=${r2}$`
      hint = 'The domain includes all real numbers except for the values of x that make the denominator equal to zero.'
      explanation = `1. Set the denominator to zero: $${polyToStr(denPoly)} = 0$.\n\n2. Factor: $(x - ${r1})(x - ${r2}) = 0$.\n\n3. The function is undefined at $x=${r1}$ and $x=${r2}$.`
      options = new Set([answer, `All real numbers except $x=${nR}$`, 'All real numbers'])
    } else {
      question = `Find the equations of the vertical asymptotes for the function: $${funcStr}$`
      answer = `$x=${r1}, x=${r2}$`
      hint = 'Vertical asymptotes occur at the x-values where the denominator is zero (and the factor does not cancel).'
      explanation = `1. Since no factors cancel, we set the denominator to zero: $(x - ${r1})(x - ${r2}) = 0$.\n\n2. The vertical asymptotes are the lines $x=${r1}$ and $x=${r2}$.`
      options = new Set([answer, `$y=${r1}, y=${r2}$`, `$x=${nR}$`])
    }
  } else if (qType === 'horizontal_asymptotes') {
    const caseType = rng.pick(['top_less', 'equal', 'top_greater'])
    let numPoly: number[], denPoly: number[]
    if (caseType === 'top_less') {
      numPoly = [rng.int(1, 5)]
      denPoly = [rng.int(1, 3), rng.int(1, 5), rng.int(1, 5)]
      answer = '$y=0$'
      hint = "If the denominator's degree is greater, the horizontal asymptote is y=0."
    } else if (caseType === 'equal') {
      const c1 = rng.int(1, 6)
      const c2 = rng.int(1, 6)
      numPoly = [c1, rng.int(1, 5)]
      denPoly = [c2, rng.int(1, 5)]
      const ha = new Fraction(c1, c2)
      answer = `$y = ${getFractionLatexCode(ha)}$`
      hint = 'If degrees are equal, the asymptote is the ratio of the leading coefficients.'
    } else {
      numPoly = [rng.int(1, 3), rng.int(1, 5), rng.int(1, 5)]
      denPoly = [rng.int(1, 5), rng.int(1, 5)]
      answer = 'None'
      hint = "If the numerator's degree is greater, there is no horizontal asymptote (but there may be a slant one)."
    }
    const funcStr = `f(x) = \\frac{${polyToStr(numPoly)}}{${polyToStr(denPoly)}}`
    question = `Find the equation of the horizontal asymptote for the function: $${funcStr}$`
    explanation = `We compare the degree of the numerator and the denominator. ${hint} Therefore, the horizontal asymptote is **${answer}**.`
    options = new Set(['$y=0$', '$y=1$', 'None', answer])
  } else if (qType === 'find_holes') {
    const [holeRoot, numRoot, denRoot] = rng.sample(Array.from({ length: 11 }, (_, i) => i - 5), 3)
    const numPoly = [1, -(holeRoot + numRoot), holeRoot * numRoot]
    const denPoly = [1, -(holeRoot + denRoot), holeRoot * denRoot]
    const funcStr = `f(x) = \\frac{${polyToStr(numPoly)}}{${polyToStr(denPoly)}}`
    const yHole = new Fraction(holeRoot - numRoot, holeRoot - denRoot)
    question = `Find the coordinates of the hole (removable discontinuity) in the graph of: $${funcStr}$`
    answer = `$(${holeRoot}, ${getFractionLatexCode(yHole)})$`
    hint = 'Factor the numerator and denominator. The cancelled factor gives the x-coordinate of the hole. Plug this x-value into the simplified function to find the y-coordinate.'
    explanation =
      `1. Factor: $f(x) = \\frac{(x - ${holeRoot})(x - ${numRoot})}{(x - ${holeRoot})(x - ${denRoot})}$.\n\n` +
      `2. The common factor $(x-${holeRoot})$ creates a hole at $x=${holeRoot}$.\n\n` +
      `3. Use the simplified function $g(x) = \\frac{x - ${numRoot}}{x - ${denRoot}}$ to find the y-coordinate: $g(${holeRoot}) = \\frac{${holeRoot - numRoot}}{${holeRoot - denRoot}} = ${getFractionLatexCode(yHole)}$.\n\n` +
      `4. The hole is at **${answer}**.`
    options = new Set([answer, `$x = ${holeRoot}$`, `$x = ${denRoot}$`])
  } else if (qType === 'slant_asymptotes') {
    const r1 = rng.int(-4, 4)
    const a = rng.int(1, 3)
    const b = rng.int(-3, 3)
    const k = rng.int(1, 5)
    const denPoly = [1, -r1]
    const quotientPoly = [a, b]
    const numPoly = [a, b - a * r1, -b * r1 + k]
    const funcStr = `f(x) = \\frac{${polyToStr(numPoly)}}{${polyToStr(denPoly)}}`
    question = `Find the equation of the slant (oblique) asymptote for the function: $${funcStr}$`
    answer = `$y = ${polyToStr(quotientPoly)}$`
    hint = 'A slant asymptote exists when the degree of the numerator is exactly one greater than the denominator. Use polynomial long division to find it.'
    explanation = `To find the slant asymptote, we divide the numerator by the denominator.\n\n$(${polyToStr(numPoly)}) \\div (${polyToStr(denPoly)})$ gives a quotient of $(${polyToStr(quotientPoly)})$ and a remainder of $${k}$.\n\nThe slant asymptote is the quotient part: **${answer}**.`
    options = new Set([answer, `$y = ${polyToStr([a, b + 1])}$`, `y = ${a}x`])
  }

  return { question, options: finalizeOptions(options, rng), answer, hint, explanation, difficulty }
}
