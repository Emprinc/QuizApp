// Coordinate geometry question generator — ported from _generate_coordinate_geometry_question
import type { Difficulty, RNG, GeneratedQuestion } from '../types'
import { Fraction } from '../../lib/fraction'
import { getFractionLatexCode, formatFractionText, finalizeOptions } from '../../lib/mathFormat'

export function generateCoordinateGeometryQuestion(difficulty: Difficulty, rng: RNG): GeneratedQuestion {
  let qType: string
  if (difficulty === 'Easy') {
    qType = rng.pick(['midpoint', 'gradient'])
  } else if (difficulty === 'Medium') {
    qType = rng.pick(['distance', 'equation_point_slope'])
  } else {
    qType = rng.pick(['equation_two_points', 'parallel_perpendicular'])
  }

  let question = '', answer = '', hint = '', explanation = ''
  let options = new Set<string>()

  let x1 = rng.int(-10, 10)
  let y1 = rng.int(-10, 10)
  let x2 = rng.int(-10, 10)
  let y2 = rng.int(-10, 10)
  while (x1 === x2 && y1 === y2) {
    x2 = rng.int(-10, 10)
    y2 = rng.int(-10, 10)
  }

  if (qType === 'midpoint') {
    const midX = (x1 + x2) / 2
    const midY = (y1 + y2) / 2
    question = `Find the midpoint of the line segment connecting A$(${x1}, ${y1})$ and B$(${x2}, ${y2})$.`
    answer = `(${midX.toFixed(1)}, ${midY.toFixed(1)})`.replace(/\.0/g, '')
    hint = 'The midpoint is the average of the x-coordinates and the average of the y-coordinates.'
    explanation = `Midpoint = $(\\frac{x_1+x_2}{2}, \\frac{y_1+y_2}{2}) = (\\frac{${x1}+${x2}}{2}, \\frac{${y1}+${y2}}{2}) = (${answer})$.`
    options = new Set([answer, `(${(x2 - x1) / 2}, ${(y2 - y1) / 2})`, `(${x1 + x2}, ${y1 + y2})`])
  } else if (qType === 'gradient') {
    question = `Find the gradient (slope) of the line passing through A$(${x1}, ${y1})$ and B$(${x2}, ${y2})$.`
    if (x1 === x2) {
      answer = 'Undefined'
      hint = 'The gradient of a vertical line is undefined.'
      explanation = 'Since the x-coordinates are the same ($x_1 = x_2$), this is a vertical line. The gradient of a vertical line is undefined because the change in x is zero, leading to division by zero in the formula.'
      options = new Set([answer, '0', '1'])
    } else {
      const grad = new Fraction(y2 - y1, x2 - x1)
      answer = formatFractionText(grad)
      hint = 'Use the gradient formula: $m = \\frac{y_2-y_1}{x_2-x_1}$.'
      explanation = `Gradient $m = \\frac{y_2-y_1}{x_2-x_1} = \\frac{${y2}-(${y1})}{${x2}-(${x1})} = \\frac{${y2 - y1}}{${x2 - x1}} = ${getFractionLatexCode(grad)}$.`
      options = new Set([answer, formatFractionText(new Fraction(x2 - x1, y2 - y1)), String(y2 - y1)])
    }
  } else if (qType === 'distance') {
    const distSq = (x2 - x1) ** 2 + (y2 - y1) ** 2
    const dist = Math.sqrt(distSq)
    question = `Find the distance between point A$(${x1}, ${y1})$ and point B$(${x2}, ${y2})$.`
    if (dist === Math.round(dist)) {
      answer = String(Math.round(dist))
    } else {
      answer = `$\\sqrt{${distSq}}$`
    }
    hint = 'Use the distance formula: $d = \\sqrt{(x_2 - x_1)^2 + (y_2 - y_1)^2}$.'
    explanation = `Using the distance formula:\n$d = \\sqrt{(${x2} - (${x1}))^2 + (${y2} - (${y1}))^2} = \\sqrt{(${x2 - x1})^2 + (${y2 - y1})^2} = \\sqrt{${distSq}}$.`
    if (dist !== Math.round(dist)) {
      explanation += ' This is the exact distance in simplified surd form.'
    } else {
      explanation += ` = ${Math.round(dist)}`
    }
    options = new Set([answer, String(Math.round(dist * 100) / 100), String(distSq)])
  } else if (qType === 'equation_point_slope') {
    let mNum = rng.int(-5, 5)
    const mDen = rng.int(1, 3)
    while (mNum === 0) mNum = rng.int(-5, 5)
    const m = new Fraction(mNum, mDen)
    const c = y1 - m.toNumber() * x1
    const cFrac = new Fraction(c)
    question = `Find the equation of the line that passes through the point $(${x1}, ${y1})$ and has a gradient of $${getFractionLatexCode(m)}$.`
    answer = `$y = ${getFractionLatexCode(m)}x ${c >= 0 ? '+' : '-'} ${getFractionLatexCode(new Fraction(Math.abs(c)))}$`
    hint = 'Use the formula $y - y_1 = m(x - x_1)$ and rearrange it into the form $y = mx + c$.'
    explanation =
      `1. Start with $y - y_1 = m(x - x_1)$.\n\n` +
      `2. Substitute values: $y - (${y1}) = ${getFractionLatexCode(m)}(x - (${x1}))$.\n\n` +
      `3. Simplify to find the y-intercept 'c': $c = y_1 - m \\times x_1 = ${getFractionLatexCode(new Fraction(y1))} - ${getFractionLatexCode(m)} \\times ${getFractionLatexCode(new Fraction(x1))} = ${getFractionLatexCode(cFrac)}$.\n\n` +
      `4. The final equation is: ${answer}.`
    const negM = new Fraction(1, 1).div(m).mul(new Fraction(-1, 1))
    options = new Set([answer, `$y = ${getFractionLatexCode(negM)}x + ${c}$`, `$y - ${y1} = ${getFractionLatexCode(m)}(x + ${x1})$`])
  } else if (qType === 'equation_two_points') {
    question = `Find the equation of the line that passes through the points A$(${x1}, ${y1})$ and B$(${x2}, ${y2})$.`
    if (x1 === x2) {
      answer = `$x = ${x1}$`
      hint = "First, find the gradient. If the x-coordinates are the same, it's a special case."
      explanation = `Since the x-coordinates are the same, this is a vertical line. All points on this line have an x-coordinate of ${x1}, so the equation is $x = ${x1}$.`
      options = new Set([answer, `y = ${y1}`, `y = x + ${y1 - x1}`])
    } else {
      const m = new Fraction(y2 - y1, x2 - x1)
      const c = y1 - m.toNumber() * x1
      const cFrac = new Fraction(c)
      answer = `$y = ${getFractionLatexCode(m)}x ${c >= 0 ? '+' : '-'} ${getFractionLatexCode(new Fraction(Math.abs(c)))}$`
      hint = 'First, calculate the gradient between the two points, then use the point-slope formula $y - y_1 = m(x - x_1)$ with one of the points.'
      explanation =
        `1. First, find the gradient: $m = \\frac{${y2 - y1}}{${x2 - x1}} = ${getFractionLatexCode(m)}$.\n\n` +
        `2. Use $y - y_1 = m(x - x_1)$: $y - (${y1}) = ${getFractionLatexCode(m)}(x - (${x1}))$.\n\n` +
        `3. Simplify to $y=mx+c$ form: ${answer}.`
      const negM = new Fraction(1, 1).div(m).mul(new Fraction(-1, 1))
      options = new Set([answer, `$y = ${getFractionLatexCode(negM)}x ${c >= 0 ? '+' : '-'} ${getFractionLatexCode(new Fraction(Math.abs(c)))}$`])
    }
  } else if (qType === 'parallel_perpendicular') {
    let m1 = new Fraction(rng.int(-3, 3), rng.int(1, 2))
    while (m1.isZero) m1 = new Fraction(rng.int(-3, 3), rng.int(1, 2))
    const c1 = rng.int(-5, 5)
    const line1Eq = `$y = ${getFractionLatexCode(m1)}x ${c1 >= 0 ? '+' : '-'} ${getFractionLatexCode(new Fraction(Math.abs(c1)))}$`
    const [relationship, m2] = rng.pick<[string, Fraction]>([
      ['Parallel', m1],
      ['Perpendicular', new Fraction(1, 1).div(m1).mul(new Fraction(-1, 1))],
      ['Neither', m1.add(new Fraction(1, 1))],
    ])
    const line2Eq = `$y = ${getFractionLatexCode(m2)}x + ${c1 + 2}$`
    question = `What is the relationship between the lines ${line1Eq} and ${line2Eq}?`
    answer = relationship
    hint = 'Compare the gradients (m values) of the two lines. Parallel lines have equal gradients. For perpendicular lines, the product of their gradients is -1 (or one is the negative reciprocal of the other).'
    explanation = `The gradient of the first line is $m_1 = ${getFractionLatexCode(m1)}$. The gradient of the second line is $m_2 = ${getFractionLatexCode(m2)}$. Since $m_1$ and $m_2$ meet the condition for being **${answer}**, that is the correct relationship.`
    options = new Set(['Parallel', 'Perpendicular', 'Neither'])
  }

  return { question, options: finalizeOptions(options, rng), answer, hint, explanation, difficulty }
}
