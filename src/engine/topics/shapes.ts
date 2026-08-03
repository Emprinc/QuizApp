// Shapes question generator — ported from _generate_shapes_question
import type { Difficulty, RNG, GeneratedQuestion } from '../types'
import { Fraction } from '../../lib/fraction'
import { getFractionLatexCode, formatFractionText, finalizeOptions } from '../../lib/mathFormat'

export function generateShapesQuestion(difficulty: Difficulty, rng: RNG): GeneratedQuestion {
  let qType: string
  if (difficulty === 'Easy') {
    qType = rng.pick(['triangle_area', 'rectangle_perimeter', 'circle_area'])
  } else if (difficulty === 'Medium') {
    qType = rng.pick(['trapezoid_area', 'sector_area', 'pythagoras'])
  } else {
    qType = rng.pick(['cone_volume', 'sphere_surface', 'cylinder_volume'])
  }

  let question = '', answer = '', hint = '', explanation = ''
  let options = new Set<string>()

  if (qType === 'triangle_area') {
    const base = rng.int(3, 15)
    const height = rng.int(4, 12)
    const area = (base * height) / 2
    question = `Find the area of a triangle with base ${base} cm and height ${height} cm.`
    answer = `${area} cm$^2$`
    hint = 'Use the formula: Area = ½ × base × height.'
    explanation = `Area = $\\frac{1}{2} \\times ${base} \\times ${height} = \\frac{${base * height}}{2} = ${area}$ cm$^2$.`
    options = new Set([answer, `${base * height} cm$^2$`, `${(base + height) / 2} cm$^2$`, `${base * height * 2} cm$^2$`])
  } else if (qType === 'rectangle_perimeter') {
    const length = rng.int(5, 20)
    const width = rng.int(3, 15)
    const perimeter = 2 * (length + width)
    question = `Find the perimeter of a rectangle with length ${length} cm and width ${width} cm.`
    answer = `${perimeter} cm`
    hint = 'Use the formula: Perimeter = 2 × (length + width).'
    explanation = `Perimeter = $2 \\times (${length} + ${width}) = 2 \\times ${length + width} = ${perimeter}$ cm.`
    options = new Set([answer, `${length * width} cm`, `${length + width} cm`, `${2 * length * width} cm`])
  } else if (qType === 'circle_area') {
    const radius = rng.int(3, 10)
    const area = Math.PI * radius * radius
    question = `Find the area of a circle with radius ${radius} cm. Give your answer in terms of $\\pi$.`
    answer = `${radius * radius}$\\pi$ cm$^2$`
    hint = 'Use the formula: Area = π × radius².'
    explanation = `Area = $\\pi \\times ${radius}^2 = ${radius * radius}\\pi$ cm$^2$.`
    options = new Set([answer, `${2 * radius}$\\pi$ cm$^2$`, `${radius}$\\pi$ cm$^2$`, `${2 * radius * radius}$\\pi$ cm$^2$`])
  } else if (qType === 'trapezoid_area') {
    const a = rng.int(3, 10)
    const b = rng.int(5, 15)
    const height = rng.int(4, 10)
    const area = ((a + b) / 2) * height
    question = `Find the area of a trapezoid with parallel sides ${a} cm and ${b} cm, and height ${height} cm.`
    answer = `${area} cm$^2$`
    hint = 'Use the formula: Area = ½ × (a + b) × height, where a and b are the parallel sides.'
    explanation = `Area = $\\frac{${a} + ${b}}{2} \\times ${height} = \\frac{${a + b}}{2} \\times ${height} = ${area}$ cm$^2$.`
    options = new Set([answer, `${(a + b) * height} cm$^2$`, `${(a * b) / 2} cm$^2$`, `${a + b + height} cm$^2$`])
  } else if (qType === 'sector_area') {
    const radius = rng.int(5, 12)
    const angle = rng.pick([60, 90, 120, 150])
    const area = (angle / 360) * Math.PI * radius * radius
    question = `Find the area of a sector of a circle with radius ${radius} cm and central angle ${angle}°. Give your answer in terms of $\\pi$.`
    const piCoeff = (angle * radius * radius) / 360
    answer = `${piCoeff}$\\pi$ cm$^2$`
    hint = 'Use the formula: Area of sector = (θ/360) × π × r².'
    explanation = `Area = $\\frac{${angle}}{360} \\times \\pi \\times ${radius}^2 = \\frac{${angle}}{360} \\times ${radius * radius}\\pi = ${piCoeff}\\pi$ cm$^2$.`
    options = new Set([answer, `${radius * radius}$\\pi$ cm$^2$`, `${(angle / 360) * radius}$\\pi$ cm$^2$`, `${2 * piCoeff}$\\pi$ cm$^2$`])
  } else if (qType === 'pythagoras') {
    const a = rng.int(3, 8)
    const b = rng.int(4, 10)
    const c = Math.sqrt(a * a + b * b)
    const cRounded = c.toFixed(2)
    question = `Find the length of the hypotenuse of a right-angled triangle with legs ${a} cm and ${b} cm. Give your answer to 2 decimal places.`
    answer = `${cRounded} cm`
    hint = 'Use the Pythagorean theorem: c² = a² + b².'
    explanation = `$c = \\sqrt{${a}^2 + ${b}^2} = \\sqrt{${a * a} + ${b * b}} = \\sqrt{${a * a + b * b}} \\approx ${cRounded}$ cm.`
    options = new Set([answer, `${(a + b).toFixed(2)} cm`, `${Math.sqrt(Math.abs(a * a - b * b)).toFixed(2)} cm`, `${(a * b).toFixed(2)} cm`])
  } else if (qType === 'cone_volume') {
    const radius = rng.int(3, 8)
    const height = rng.int(5, 12)
    const volCoeff = (radius * radius * height) / 3
    question = `Find the volume of a cone with radius ${radius} cm and height ${height} cm. Give your answer in terms of $\\pi$.`
    answer = `${volCoeff}$\\pi$ cm$^3$`
    hint = 'Use the formula: Volume = ⅓ × π × r² × h.'
    explanation = `Volume = $\\frac{1}{3} \\times \\pi \\times ${radius}^2 \\times ${height} = \\frac{1}{3} \\times ${radius * radius} \\times ${height} \\times \\pi = ${volCoeff}\\pi$ cm$^3$.`
    options = new Set([answer, `${radius * radius * height}$\\pi$ cm$^3$`, `${(radius * radius * height) / 2}$\\pi$ cm$^3$`, `${2 * volCoeff}$\\pi$ cm$^3$`])
  } else if (qType === 'sphere_surface') {
    const radius = rng.int(3, 10)
    const saCoeff = 4 * radius * radius
    question = `Find the surface area of a sphere with radius ${radius} cm. Give your answer in terms of $\\pi$.`
    answer = `${saCoeff}$\\pi$ cm$^2$`
    hint = 'Use the formula: Surface Area = 4 × π × r².'
    explanation = `Surface Area = $4 \\times \\pi \\times ${radius}^2 = 4 \\times ${radius * radius} \\times \\pi = ${saCoeff}\\pi$ cm$^2$.`
    options = new Set([answer, `${2 * radius * radius}$\\pi$ cm$^2$`, `${radius * radius}$\\pi$ cm$^2$`, `${(4 / 3) * radius * radius * radius}$\\pi$ cm$^2$`])
  } else if (qType === 'cylinder_volume') {
    const radius = rng.int(3, 8)
    const height = rng.int(5, 12)
    const volCoeff = radius * radius * height
    question = `Find the volume of a cylinder with radius ${radius} cm and height ${height} cm. Give your answer in terms of $\\pi$.`
    answer = `${volCoeff}$\\pi$ cm$^3$`
    hint = 'Use the formula: Volume = π × r² × h.'
    explanation = `Volume = $\\pi \\times ${radius}^2 \\times ${height} = ${radius * radius} \\times ${height} \\times \\pi = ${volCoeff}\\pi$ cm$^3$.`
    options = new Set([answer, `${2 * volCoeff}$\\pi$ cm$^3$`, `${(volCoeff / 2)}$\\pi$ cm$^3$`, `${radius * height}$\\pi$ cm$^3$`])
  }

  return { question, options: finalizeOptions(options, rng), answer, hint, explanation, difficulty }
}
