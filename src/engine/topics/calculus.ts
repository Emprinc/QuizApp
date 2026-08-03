// Calculus question generator — ported from _generate_calculus_question
import type { Difficulty, RNG, GeneratedQuestion } from '../types'
import { finalizeOptions, polyToStr } from '../../lib/mathFormat'

export function generateCalculusQuestion(difficulty: Difficulty, rng: RNG): GeneratedQuestion {
  let qType: string
  if (difficulty === 'Easy') {
    qType = rng.pick(['limits_substitution', 'diff_power_rule'])
  } else if (difficulty === 'Medium') {
    qType = rng.pick(['gradient_of_curve', 'indefinite_integration'])
  } else {
    qType = rng.pick(['find_constant_c', 'definite_integration'])
  }

  let question = '', answer = '', hint = '', explanation = ''
  let options = new Set<string>()

  if (qType === 'limits_substitution') {
    const coeffs = [rng.int(1, 5), rng.int(-5, 5), rng.int(-5, 5)]
    const polyStr = polyToStr(coeffs)
    const xVal = rng.int(-3, 3)
    const limitVal = coeffs[0] * xVal ** 2 + coeffs[1] * xVal + coeffs[2]
    question = `Evaluate the limit: $\\lim_{x \\to ${xVal}} (${polyStr})$`
    answer = String(limitVal)
    hint = 'Since this is a polynomial function, you can find the limit by direct substitution of the value x is approaching.'
    explanation = `Substitute $x = ${xVal}$ directly into the expression:\n\n$(${coeffs[0]})(${xVal})^2 + (${coeffs[1]})(${xVal}) + (${coeffs[2]}) = ${limitVal}$.`
    options = new Set([answer, String(limitVal + 1), String(limitVal - 1)])
  } else if (qType === 'diff_power_rule') {
    const coeffs = [rng.int(2, 6), rng.int(-5, 5), rng.int(2, 10)]
    const polyStr = polyToStr(coeffs)
    const derivCoeffs = [coeffs[0] * 2, coeffs[1]]
    const derivStr = polyToStr(derivCoeffs)
    question = `Find the derivative of $f(x) = ${polyStr}$ with respect to x.`
    answer = `$${derivStr}$`
    hint = 'Apply the power rule, $\\frac{d}{dx}(ax^n) = anx^{n-1}$, to each term of the polynomial. The derivative of a constant is zero.'
    explanation = `Differentiating term by term:\n\n$\\frac{d}{dx}(${coeffs[0]}x^2) = ${coeffs[0] * 2}x$\n\n$\\frac{d}{dx}(${coeffs[1]}x) = ${coeffs[1]}$\n\n$\\frac{d}{dx}(${coeffs[2]}) = 0$\n\nAdding these together, the derivative is ${answer}.`
    options = new Set([answer, `$${polyToStr(coeffs)}$`, `$${polyToStr([coeffs[0] * 2, coeffs[1], coeffs[2]])}$`])
  } else if (qType === 'gradient_of_curve') {
    const coeffs = [rng.int(2, 5), rng.int(-5, 5)]
    const constTerm = rng.int(1, 10)
    const polyStr = `${polyToStr(coeffs)} + ${constTerm}`
    const xVal = rng.int(1, 4)
    const gradientVal = coeffs[0] * 2 * xVal + coeffs[1]
    question = `Find the gradient of the curve $y = ${polyStr}$ at the point where $x=${xVal}$.`
    answer = String(gradientVal)
    hint = 'First, find the derivative of the function (which represents the gradient at any point), then substitute the given x-value into the derivative.'
    explanation = `1. Find the derivative: $\\frac{dy}{dx} = ${polyToStr([coeffs[0] * 2, coeffs[1]])}$.\n\n2. Substitute $x=${xVal}$ into the derivative: $${coeffs[0] * 2}(${xVal}) + (${coeffs[1]}) = ${gradientVal}$.`
    options = new Set([answer, String(gradientVal + xVal), String(coeffs[0] * xVal ** 2 + coeffs[1] * xVal)])
  } else if (qType === 'indefinite_integration') {
    const derivCoeffs = [rng.int(1, 4) * 2, rng.int(2, 10)]
    const derivStr = polyToStr(derivCoeffs)
    const origCoeffs = [derivCoeffs[0] / 2, derivCoeffs[1]]
    const origStr = polyToStr(origCoeffs)
    question = `Find the indefinite integral: $\\int (${derivStr}) \\,dx$.`
    answer = `$${origStr} + C$`
    hint = 'Apply the reverse power rule, $\\int ax^n \\,dx = \\frac{a}{n+1}x^{n+1} + C$, to each term. Don\'t forget the constant of integration, C.'
    explanation = `Integrating term by term:\n\n$\\int ${derivCoeffs[0]}x \\,dx = \\frac{${derivCoeffs[0]}}{2}x^2 = ${origCoeffs[0]}x^2$\n\n$\\int ${derivCoeffs[1]} \\,dx = ${origCoeffs[1]}x$\n\nAdding these and the constant of integration gives ${answer}.`
    options = new Set([answer, `$${derivStr} + C$`, `$${polyToStr([origCoeffs[0] * 2, origCoeffs[1]])} + C$`])
  } else if (qType === 'find_constant_c') {
    const derivCoeffs = [rng.int(1, 4) * 2, rng.int(-5, 5)]
    const derivStr = polyToStr(derivCoeffs)
    const px = rng.int(1, 3)
    const py = rng.int(5, 20)
    const integralValAtPx = (derivCoeffs[0] / 2) * px ** 2 + derivCoeffs[1] * px
    const constC = py - integralValAtPx
    const origStr = `${polyToStr([derivCoeffs[0] / 2, derivCoeffs[1]])} ${constC >= 0 ? '+' : '-'} ${Math.abs(constC)}`
    question = `Given that $\\frac{dy}{dx} = ${derivStr}$ and the curve passes through the point $(${px}, ${py})$, find the specific equation of the curve.`
    answer = `$y = ${origStr}$`
    hint = 'First, integrate the derivative to get the general form $y = ... + C$. Then, substitute the x and y coordinates of the given point to solve for C.'
    explanation =
      `1. Integrate: $y = \\int (${derivStr}) \\,dx = ${polyToStr([derivCoeffs[0] / 2, derivCoeffs[1]])} + C$.\n\n` +
      `2. Substitute the point $(${px}, ${py})$: $${py} = ${derivCoeffs[0] / 2}(${px})^2 + ${derivCoeffs[1]}(${px}) + C$.\n\n` +
      `3. Solve for C: $${py} = ${integralValAtPx} + C \\implies C = ${py} - ${integralValAtPx} = ${constC}$.\n\n` +
      `4. The final equation is ${answer}.`
    options = new Set([answer, `$y = ${polyToStr([derivCoeffs[0] / 2, derivCoeffs[1]])}$`, `$y = ${derivStr} + ${constC}$`])
  } else if (qType === 'definite_integration') {
    const coeffs = [rng.int(1, 4) * 2, rng.int(2, 8)]
    const polyStr = polyToStr(coeffs)
    const a = rng.int(1, 3)
    const b = rng.int(4, 5)
    const integralCoeffs = [coeffs[0] / 2, coeffs[1]]
    const Fb = integralCoeffs[0] * b ** 2 + integralCoeffs[1] * b
    const Fa = integralCoeffs[0] * a ** 2 + integralCoeffs[1] * a
    const result = Fb - Fa
    question = `Evaluate the definite integral: $\\int_{${a}}^{${b}} (${polyStr}) \\,dx$.`
    answer = String(result)
    hint = "First find the indefinite integral, F(x). Then calculate F(b) - F(a), where 'b' is the upper limit and 'a' is the lower limit."
    explanation =
      `1. The integral is $F(x) = ${polyToStr(integralCoeffs)}$.\n\n` +
      `2. Evaluate at the upper limit: $F(${b}) = ${integralCoeffs[0]}(${b})^2 + ${integralCoeffs[1]}(${b}) = ${Fb}$.\n\n` +
      `3. Evaluate at the lower limit: $F(${a}) = ${integralCoeffs[0]}(${a})^2 + ${integralCoeffs[1]}(${a}) = ${Fa}$.\n\n` +
      `4. The result is $F(${b}) - F(${a}) = ${Fb} - ${Fa} = ${result}$.`
    options = new Set([answer, String(Fb + Fa), String(Fb)])
  }

  return { question, options: finalizeOptions(options, rng), answer, hint, explanation, difficulty }
}
