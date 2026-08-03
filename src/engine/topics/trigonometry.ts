// Trigonometry question generator — ported from _generate_trigonometry_question
import type { Difficulty, RNG, GeneratedQuestion } from '../types'
import { finalizeOptions } from '../../lib/mathFormat'

export function generateTrigonometryQuestion(difficulty: Difficulty, rng: RNG): GeneratedQuestion {
  let qType: string
  if (difficulty === 'Easy') {
    qType = 'identity'
  } else if (difficulty === 'Medium') {
    qType = 'solve_equation'
  } else {
    qType = 'cosine_rule'
  }

  let question = '', answer = '', hint = '', explanation = ''
  let options = new Set<string>()

  if (qType === 'identity') {
    question = 'Simplify the expression $\\frac{\\sin^2\\theta}{1 - \\cos\\theta}$.'
    answer = '$1 + \\cos\\theta$'
    hint = 'Use the fundamental Pythagorean identity $\\sin^2\\theta + \\cos^2\\theta = 1$ and then factorize the numerator as a difference of two squares.'
    explanation =
      '1. Rewrite the numerator using the identity: $\\sin^2\\theta = 1 - \\cos^2\\theta$.\n' +
      '2. Factor the numerator: $1 - \\cos^2\\theta = (1 - \\cos\\theta)(1 + \\cos\\theta)$.\n' +
      '3. The expression becomes $\\frac{(1 - \\cos\\theta)(1 + \\cos\\theta)}{1 - \\cos\\theta}$.\n' +
      '4. Cancel the common term $(1 - \\cos\\theta)$, leaving **$1 + \\cos\\theta$**.'
    options = new Set([answer, '$1 - \\cos\\theta$', '$\\cos\\theta$', '$\\sin\\theta$'])
  } else if (qType === 'solve_equation') {
    const trigValues: Record<string, [string, number][]> = {
      sin: [['1/2', 30], ['\\sqrt{3}/2', 60], ['1/\\sqrt{2}', 45]],
      cos: [['1/2', 60], ['\\sqrt{3}/2', 30], ['1/\\sqrt{2}', 45]],
      tan: [['1', 45], ['\\sqrt{3}', 60], ['1/\\sqrt{3}', 30]],
    }
    const funcName = rng.pick(['sin', 'cos', 'tan'])
    const [valStr, principalVal] = rng.pick(trigValues[funcName])
    let quadrants: number[]
    let sol2: number
    if (funcName === 'sin') {
      quadrants = [1, 2]
      sol2 = 180 - principalVal
    } else if (funcName === 'cos') {
      quadrants = [1, 4]
      sol2 = 360 - principalVal
    } else {
      quadrants = [1, 3]
      sol2 = 180 + principalVal
    }
    question = `Solve the equation $${funcName}(\\theta) = ${valStr}$ for $0^\\circ \\le \\theta \\le 360^\\circ$.`
    answer = `${principalVal}°, ${sol2}°`
    hint = `Find the principal value (the acute angle). Then use the CAST rule to find the second solution in the range. ${funcName} is positive in Quadrants ${quadrants[0]} and ${quadrants[1]}.`
    const quadStr = funcName === 'sin' ? '180° - ' : funcName === 'cos' ? '360° - ' : '180° + '
    explanation =
      `1. The principal (acute) angle for which $${funcName}(\\theta) = ${valStr}$ is $\\theta = ${principalVal}^\\circ$.\n` +
      `2. Since $${funcName}(\\theta)$ is positive, we look for solutions in Quadrant 1 and Quadrant ${quadrants[1]}.\n` +
      `3. Quadrant 1 solution is ${principalVal}°.\n` +
      `4. Quadrant ${quadrants[1]} solution is $${quadStr}${principalVal}° = ${sol2}°$.\n` +
      `5. The two solutions are **${answer}**.`
    options = new Set([answer, `${principalVal}°`, `${principalVal}°, ${180 + principalVal}°`])
  } else if (qType === 'cosine_rule') {
    const a = rng.int(5, 25)
    const b = rng.int(5, 25)
    const CDeg = rng.pick([30, 45, 60, 120])
    const cSq = a ** 2 + b ** 2 - 2 * a * b * Math.cos((CDeg * Math.PI) / 180)
    const c = Math.round(Math.sqrt(cSq) * 100) / 100
    question = `In triangle ABC, side $a = ${a}$ m, side $b = ${b}$ m, and the included angle $C = ${CDeg}^\\circ$. Find the length of the third side, $c$, to two decimal places.`
    answer = `${c} m`
    hint = 'When you have two sides and the angle between them (SAS), use the Cosine Rule: $c^2 = a^2 + b^2 - 2ab\\cos(C)$.'
    const cosRounded = Math.round(Math.cos((CDeg * Math.PI) / 180) * 1000) / 1000
    const cSqRounded = Math.round(cSq * 100) / 100
    explanation =
      `1. $c^2 = ${a}^2 + ${b}^2 - 2(${a})(${b})\\cos(${CDeg}^\\circ)$.\n` +
      `2. $c^2 = ${a ** 2} + ${b ** 2} - 2(${a})(${b})(${cosRounded}) \\approx ${cSqRounded}$.\n` +
      `3. $c = \\sqrt{${cSqRounded}} \\approx ${c}$ m.`
    const sqrtA2B2 = Math.round(Math.sqrt(a ** 2 + b ** 2) * 100) / 100
    const aPlusBMinusC = Math.round((a + b - CDeg) * 100) / 100
    options = new Set([answer, `${sqrtA2B2} m`, `${aPlusBMinusC} m`])
  }

  return { question, options: finalizeOptions(options, rng), answer, hint, explanation, difficulty }
}
