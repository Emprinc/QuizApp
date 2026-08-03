// Vectors question generator — ported from _generate_vectors_question
import type { Difficulty, RNG, GeneratedQuestion } from '../types'
import { finalizeOptions } from '../../lib/mathFormat'

function norm(x: number, y: number): number {
  return Math.sqrt(x * x + y * y)
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

export function generateVectorsQuestion(difficulty: Difficulty, rng: RNG): GeneratedQuestion {
  let qType: string
  if (difficulty === 'Easy') {
    qType = 'algebra'
  } else if (difficulty === 'Medium') {
    qType = 'magnitude'
  } else {
    qType = 'dot_product'
  }

  let question = '', answer = '', hint = '', explanation = ''
  let options = new Set<string>()

  if (qType === 'algebra') {
    const a = [rng.int(-5, 5), rng.int(-5, 5)]
    const b = [rng.int(-5, 5), rng.int(-5, 5)]
    const s1 = rng.int(2, 4)
    const s2 = rng.int(2, 4)
    question = `Given vectors $\\mathbf{a} = \\binom{${a[0]}}{${a[1]}}$ and $\\mathbf{b} = \\binom{${b[0]}}{${b[1]}}$, find the resulting vector from the operation $${s1}\\mathbf{a} - ${s2}\\mathbf{b}$.`
    const resultVec = [s1 * a[0] - s2 * b[0], s1 * a[1] - s2 * b[1]]
    answer = `$\\binom{${resultVec[0]}}{${resultVec[1]}}$`
    hint = 'First, multiply each vector by its scalar. Then, subtract the corresponding components of the resulting vectors.'
    explanation =
      `1. $${s1}\\mathbf{a} = ${s1}\\binom{${a[0]}}{${a[1]}} = \\binom{${s1 * a[0]}}{${s1 * a[1]}}$.\n` +
      `2. $${s2}\\mathbf{b} = ${s2}\\binom{${b[0]}}{${b[1]}} = \\binom{${s2 * b[0]}}{${s2 * b[1]}}$.\n` +
      `3. Subtract the results: $\\binom{${s1 * a[0]}}{${s1 * a[1]}} - \\binom{${s2 * b[0]}}{${s2 * b[1]}} = \\binom{${s1 * a[0] - s2 * b[0]}}{${s1 * a[1] - s2 * b[1]}} = ${answer}$.`
    options = new Set([
      answer,
      `$\\binom{${a[0] - b[0]}}{${a[1] - b[1]}}$`,
      `$\\binom{${s1 * a[0] + s2 * b[0]}}{${s1 * a[1] + s2 * b[1]}}$`,
    ])
  } else if (qType === 'magnitude') {
    const v = [rng.int(2, 12), rng.int(2, 12)]
    question = `Find the magnitude (or length) of the vector $\\mathbf{v} = ${v[0]}\\mathbf{i} + ${v[1]}\\mathbf{j}$.`
    const magnitude = round2(norm(v[0], v[1]))
    answer = String(magnitude)
    hint = 'The magnitude of a vector $x\\mathbf{i} + y\\mathbf{j}$ is found using the formula $|\\mathbf{v}| = \\sqrt{x^2 + y^2}$.'
    explanation = `Magnitude $|\\mathbf{v}| = \\sqrt{(${v[0]})^2 + (${v[1]})^2} = \\sqrt{${v[0] ** 2} + ${v[1] ** 2}} = \\sqrt{${v[0] ** 2 + v[1] ** 2}} \\approx ${answer}$.`
    options = new Set([answer, String(v[0] + v[1]), String(v[0] ** 2 + v[1] ** 2)])
  } else if (qType === 'dot_product') {
    let a = [rng.int(-5, 5), rng.int(-5, 5)]
    let b = [rng.int(-5, 5), rng.int(-5, 5)]
    while (norm(a[0], a[1]) === 0 || norm(b[0], b[1]) === 0) {
      a = [rng.int(-5, 5), rng.int(-5, 5)]
      b = [rng.int(-5, 5), rng.int(-5, 5)]
    }
    question = `Find the angle between the vectors $\\mathbf{a} = \\binom{${a[0]}}{${a[1]}}$ and $\\mathbf{b} = \\binom{${b[0]}}{${b[1]}}$ to the nearest degree.`
    const dotProduct = a[0] * b[0] + a[1] * b[1]
    const magA = norm(a[0], a[1])
    const magB = norm(b[0], b[1])
    const cosTheta = dotProduct / (magA * magB)
    const clampedCos = Math.max(-1, Math.min(1, cosTheta))
    const angleRad = Math.acos(clampedCos)
    const angleDeg = Math.round((angleRad * 180) / Math.PI)
    answer = `${angleDeg}°`
    hint = 'Use the dot product formula: $\\cos\\theta = \\frac{\\mathbf{a} \\cdot \\mathbf{b}}{|\\mathbf{a}| |\\mathbf{b}|}$.'
    const magAR = round2(magA)
    const magBR = round2(magB)
    const cosR = Math.round(clampedCos * 1000) / 1000
    explanation =
      `1. Dot Product: $\\mathbf{a} \\cdot \\mathbf{b} = (${a[0]})(${b[0]}) + (${a[1]})(${b[1]}) = ${dotProduct}$.\n` +
      `2. Magnitudes: $|\\mathbf{a}| \\approx ${magAR}$, $|\\mathbf{b}| \\approx ${magBR}$.\n` +
      `3. $\\cos\\theta = \\frac{${dotProduct}}{${magAR} \\times ${magBR}} \\approx ${cosR}$.\n` +
      `4. $\\theta = \\arccos(${cosR}) \\approx ${answer}.`
    options = new Set([answer, `${Math.round(dotProduct)}°`, '90°'])
  }

  return { question, options: finalizeOptions(options, rng), answer, hint, explanation, difficulty }
}
