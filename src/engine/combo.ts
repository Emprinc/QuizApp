// Combo question generators — ported from the 9 _combo_* functions.
import type { RNG, ComboQuestion, ComboGenerator } from './types'
import { Fraction } from '../lib/fraction'
import { getFractionLatexCode, formatFractionText, finalizeOptions } from '../lib/mathFormat'
import { generatePascalData } from './pascal'

function binomial(n: number, k: number): number {
  if (k < 0 || k > n) return 0
  let result = 1
  for (let i = 0; i < k; i++) {
    result = (result * (n - i)) / (i + 1)
  }
  return Math.round(result)
}

function comboGeometryAlgebra(rng: RNG): ComboQuestion {
  let l = rng.int(5, 10), w = rng.int(11, 15)
  let area = l * w
  let k = rng.int(5, 20)
  let x = Math.sqrt(area - k)
  while (x < 1 || x !== Math.floor(x)) {
    l = rng.int(5, 10); w = rng.int(11, 15); area = l * w
    if (area <= 5) continue
    k = rng.int(5, area - 2)
    x = Math.sqrt(area - k)
  }
  x = Math.floor(x)
  return {
    isMultipart: true,
    stem: `A rectangular field in the Ashanti Region has a length of **${l} metres** and a width of **${w} metres**.`,
    parts: [
      {
        question: 'a) What is the area of the field in square metres?',
        options: finalizeOptions(new Set([String(area), String(2 * (l + w))]), rng),
        answer: String(area),
        hint: 'Area = length × width.',
        explanation: `Area = $l \\times w = ${l} \\times ${w} = ${area}\\ m^2$.`
      },
      {
        question: `b) The square of a positive number, $x$, when increased by ${k}, is equal to the area. Find $x$.`,
        options: finalizeOptions(new Set([String(x), String(area - k)]), rng),
        answer: String(x),
        hint: `Set up the equation $x^2 + ${k} = Area$ and solve for $x$.`,
        explanation: `1. $x^2 + ${k} = ${area}$.\n\n2. $x^2 = ${area} - ${k} = ${area - k}$.\n\n3. $x = \\sqrt{${area - k}} = ${x}$.`
      }
    ],
    difficulty: 'Medium'
  }
}

function comboSurdsGeometry(rng: RNG): ComboQuestion {
  const [aVal, bVal] = rng.pick([[5, 11], [7, 18], [3, 13], [6, 10]] as [number, number][])
  const answer = String(aVal + bVal)
  return {
    isMultipart: false,
    question: `A right-angled triangle has shorter sides of length $\\sqrt{${aVal}}$ cm and $\\sqrt{${bVal}}$ cm. Find the **square** of the length of the hypotenuse.`,
    options: finalizeOptions(new Set([answer, String(aVal * bVal), String(Math.floor(Math.sqrt(aVal + bVal)))]), rng),
    answer,
    hint: 'Use Pythagoras\' theorem: $a^2 + b^2 = c^2$. Remember that $(\\sqrt{x})^2 = x$.',
    explanation: `Let the sides be $a = \\sqrt{${aVal}}$ and $b = \\sqrt{${bVal}}$.\n\n1. By Pythagoras' theorem, the square of the hypotenuse, $c^2$, is $a^2 + b^2$.\n\n2. $c^2 = (\\sqrt{${aVal}})^2 + (\\sqrt{${bVal}})^2$.\n\n3. $c^2 = ${aVal} + ${bVal} = ${answer}$.\nThe square of the hypotenuse is ${answer} $cm^2$.`,
    difficulty: 'Medium'
  }
}

function comboTrigVectors(rng: RNG): ComboQuestion {
  let a = [rng.int(-5, 5), rng.int(-5, 5)]
  let b = [rng.int(-5, 5), rng.int(-5, 5)]
  let magA = Math.sqrt(a[0] ** 2 + a[1] ** 2)
  let magB = Math.sqrt(b[0] ** 2 + b[1] ** 2)
  while (magA === 0 || magB === 0) {
    a = [rng.int(-5, 5), rng.int(-5, 5)]
    b = [rng.int(-5, 5), rng.int(-5, 5)]
    magA = Math.sqrt(a[0] ** 2 + a[1] ** 2)
    magB = Math.sqrt(b[0] ** 2 + b[1] ** 2)
  }
  const dotProduct = a[0] * b[0] + a[1] * b[1]
  const cosTheta = dotProduct / (magA * magB)
  const angleDeg = Math.round((Math.acos(Math.max(-1, Math.min(1, cosTheta))) * 180) / Math.PI)
  const answer = `${angleDeg}°`
  return {
    isMultipart: false,
    question: `Find the angle between the vectors $\\mathbf{a} = \\binom{${a[0]}}{${a[1]}}$ and $\\mathbf{b} = \\binom{${b[0]}}{${b[1]}}$ to the nearest degree.`,
    options: finalizeOptions(new Set([answer, `${Math.round(dotProduct)}°`]), rng),
    answer,
    hint: 'Use the dot product formula: $\\cos\\theta = \\frac{\\mathbf{a} \\cdot \\mathbf{b}}{|\\mathbf{a}| |\\mathbf{b}|}$.',
    explanation: `1. Dot Product: $\\mathbf{a} \\cdot \\mathbf{b} = (${a[0]})(${b[0]}) + (${a[1]})(${b[1]}) = ${dotProduct}$.\n2. Magnitudes: $|\\mathbf{a}| \\approx ${magA.toFixed(2)}$, $|\\mathbf{b}| \\approx ${magB.toFixed(2)}$.\n3. $\\cos\\theta = \\frac{${dotProduct}}{${magA.toFixed(2)} \\times ${magB.toFixed(2)}} \\approx ${cosTheta.toFixed(2)}$.\n4. $\\theta = \\cos^{-1}(${cosTheta.toFixed(2)}) \\approx ${answer}$.`,
    difficulty: 'Hard'
  }
}

function comboProbBinomial(rng: RNG): ComboQuestion {
  const men = rng.int(5, 7)
  const women = rng.int(4, 6)
  const totalPeople = men + women
  const committeeSize = 5
  const menInCommittee = 3
  const womenInCommittee = committeeSize - menInCommittee
  const favorable = binomial(men, menInCommittee) * binomial(women, womenInCommittee)
  const total = binomial(totalPeople, committeeSize)
  const prob = new Fraction(favorable, total)
  const answer = formatFractionText(prob)
  return {
    isMultipart: false,
    question: `A committee of ${committeeSize} people is to be chosen from a group of ${men} men and ${women} women. What is the probability that the committee consists of exactly ${menInCommittee} men?`,
    options: finalizeOptions(new Set([answer]), rng, 'fraction'),
    answer,
    hint: 'Prob = (Favorable Outcomes) / (Total Outcomes). Use combinations $\\binom{n}{k}$ to find the number of ways to choose.',
    explanation: `1. Favorable Outcomes: Ways to choose ${menInCommittee} men from ${men} AND ${womenInCommittee} women from ${women}.\n   - $\\binom{${men}}{${menInCommittee}} \\times \\binom{${women}}{${womenInCommittee}} = ${binomial(men, menInCommittee)} \\times ${binomial(women, womenInCommittee)} = ${favorable}$.\n2. Total Outcomes: Ways to choose any ${committeeSize} people from ${totalPeople}.\n   - $\\binom{${totalPeople}}{${committeeSize}} = ${total}$.\n3. Probability = $\\frac{${favorable}}{${total}} = ${getFractionLatexCode(prob)}$`,
    difficulty: 'Hard'
  }
}

function comboPolynomialFunctions(rng: RNG): ComboQuestion {
  let a = rng.int(-5, 5), b = rng.int(-5, 5), c = rng.int(-5, 5), d = rng.int(-5, 5)
  while (a === 0) a = rng.int(-5, 5)
  const divisorRoot = rng.int(-3, 3)
  const remainder = a * (divisorRoot ** 3) + b * (divisorRoot ** 2) + c * divisorRoot + d
  const fA = rng.int(2, 5), fB = rng.int(1, 10)
  const fOfR = fA * remainder + fB
  return {
    isMultipart: true,
    stem: `The polynomial $P(x) = ${a}x^3 + ${b}x^2 + ${c}x + ${d}$ is divided by $(x - ${divisorRoot})$ to give a remainder, $R$.`,
    parts: [
      {
        question: 'a) Find the value of the remainder, $R$.',
        options: finalizeOptions(new Set([String(remainder), String(d), String(a + b + c + d)]), rng),
        answer: String(remainder),
        hint: `By the Remainder Theorem, the remainder is $P(${divisorRoot})$.`,
        explanation: `To find the remainder, evaluate the polynomial at $x=${divisorRoot}$.\n$P(${divisorRoot}) = ${a}(${divisorRoot})^3 + ${b}(${divisorRoot})^2 + ${c}(${divisorRoot}) + ${d} = ${remainder}$.`
      },
      {
        question: `b) Given that $f(y) = ${fA}y + ${fB}$, find the value of $f(R)$.`,
        options: finalizeOptions(new Set([String(fOfR), String(fA * remainder), String(remainder + fB)]), rng),
        answer: String(fOfR),
        hint: 'Substitute the value of R you found in Part (a) into the function f(y).',
        explanation: `From Part (a), we know $R=${remainder}$.\nWe need to find $f(R) = f(${remainder})$.\n$f(${remainder}) = ${fA}(${remainder}) + ${fB} = ${fOfR}$.`
      }
    ],
    difficulty: 'Hard'
  }
}

function comboStatsProbability(rng: RNG): ComboQuestion {
  const k = 5
  const data = rng.sample(Array.from({ length: 40 }, (_, i) => i + 10), k).sort((a, b) => a - b)
  const meanVal = data.reduce((a, b) => a + b, 0) / data.length
  const countGreater = data.filter(x => x > meanVal).length
  const probFrac = new Fraction(countGreater, data.length)
  return {
    isMultipart: true,
    stem: `A student in Kumasi has the following scores in a test: \`${data}\`.`,
    parts: [
      {
        question: 'a) What is the mean of the scores?',
        options: finalizeOptions(new Set([meanVal.toFixed(2), String(data[Math.floor(data.length / 2)])]), rng),
        answer: meanVal.toFixed(2),
        hint: 'The mean is the sum of the values divided by the count of the values.',
        explanation: `Sum = \`${data.reduce((a, b) => a + b, 0)}\`. Count = \`${data.length}\`. Mean = \`${data.reduce((a, b) => a + b, 0)} / ${data.length} \\approx ${meanVal.toFixed(2)}\`.`
      },
      {
        question: 'b) If a score is picked at random, what is the probability that it is greater than the mean calculated in part (a)?',
        options: finalizeOptions(new Set([formatFractionText(probFrac)]), rng, 'fraction'),
        answer: formatFractionText(probFrac),
        hint: 'Count how many scores in the original list are greater than the mean, then divide by the total number of scores.',
        explanation: `The scores greater than ${meanVal.toFixed(2)} are \`${data.filter(x => x > meanVal)}\`. There are ${countGreater} such scores out of a total of ${data.length}. Probability = ${getFractionLatexCode(probFrac)}.`
      }
    ],
    difficulty: 'Hard'
  }
}

function comboCalculusCoordGeometry(rng: RNG): ComboQuestion {
  const a = rng.int(2, 5), c = rng.int(1, 10)
  const xVal = rng.int(1, 4)
  const polyStr = `${a}x^2 + ${c}`
  const derivStr = `${2 * a}x`
  const yVal = a * xVal ** 2 + c
  const gradient = 2 * a * xVal
  const cTangent = yVal - gradient * xVal
  return {
    isMultipart: true,
    stem: `Consider the curve defined by the equation $y = ${polyStr}$.`,
    parts: [
      {
        question: `a) Find the gradient of the curve at the point where $x = ${xVal}$.`,
        options: finalizeOptions(new Set([String(gradient), String(yVal)]), rng),
        answer: String(gradient),
        hint: 'Find the derivative of the function, then substitute the x-value into the derivative.',
        explanation: `1. The derivative is $\\frac{dy}{dx} = ${derivStr}$.\n\n2. At $x=${xVal}$, the gradient is $${2 * a}(${xVal}) = ${gradient}$.`
      },
      {
        question: 'b) Using your answer from part (a), find the equation of the tangent line to the curve at this point.',
        options: finalizeOptions(new Set([`$y = ${gradient}x ${cTangent >= 0 ? '+' : '-'} ${Math.abs(cTangent)}$`]), rng),
        answer: `$y = ${gradient}x ${cTangent >= 0 ? '+' : '-'} ${Math.abs(cTangent)}$`,
        hint: 'First, find the y-coordinate of the point. Then use the formula $y - y_1 = m(x - x_1)$.',
        explanation: `1. The gradient $m = ${gradient}$.\n\n2. The point is $(${xVal}, ${yVal})$.\n\n3. The equation is $y - ${yVal} = ${gradient}(x - ${xVal})$, which simplifies to $y = ${gradient}x ${cTangent >= 0 ? '+' : '-'} ${Math.abs(cTangent)}$.`
      }
    ],
    difficulty: 'Hard'
  }
}

function comboNumberBasesModulo(rng: RNG): ComboQuestion {
  const base = rng.pick([2, 3, 4, 5])
  const numBase10 = rng.int(20, 100)
  const numOtherBase = numBase10.toString(base).toUpperCase()
  const modN = rng.int(3, 9)
  const resultMod = numBase10 % modN
  return {
    isMultipart: true,
    stem: `Consider the number $${numOtherBase}_{${base}}$.`,
    parts: [
      {
        question: `a) Convert the number from base ${base} to base 10.`,
        options: finalizeOptions(new Set([String(numBase10)]), rng),
        answer: String(numBase10),
        hint: 'Multiply each digit by the base raised to the power of its position, starting from 0 on the right.',
        explanation: `Converting $${numOtherBase}_{${base}}$ to base 10 results in the number **${numBase10}**.`
      },
      {
        question: `b) Using your base 10 answer from part (a), calculate its value modulo ${modN}.`,
        options: finalizeOptions(new Set([String(resultMod)]), rng),
        answer: String(resultMod),
        hint: `Find the remainder when ${numBase10} is divided by ${modN}.`,
        explanation: `We need to calculate $${numBase10} \\pmod{${modN}}$.\n\n$${numBase10} \\div ${modN} = ${Math.floor(numBase10 / modN)}$ with a remainder of **${resultMod}**.`
      }
    ],
    difficulty: 'Hard'
  }
}

function comboCoordGeometryAlgebra(rng: RNG): ComboQuestion {
  const x1 = 1, y1 = 2, x2 = 4, y2 = 6
  const dist = 5
  const area = dist ** 2
  return {
    isMultipart: true,
    stem: `Two points on a grid are A$(${x1}, ${y1})$ and B$(${x2}, ${y2})$.`,
    parts: [
      {
        question: 'a) Find the distance between points A and B.',
        options: finalizeOptions(new Set([String(dist)]), rng),
        answer: String(dist),
        hint: 'Use the distance formula: $d = \\sqrt{(x_2 - x_1)^2 + (y_2 - y_1)^2}$.',
        explanation: `$d = \\sqrt{(${x2} - ${x1})^2 + (${y2} - ${y1})^2} = \\sqrt{3^2 + 4^2} = \\sqrt{25} = 5$.`
      },
      {
        question: 'b) If the distance calculated in part (a) represents the side length of a square, what is the area of the square?',
        options: finalizeOptions(new Set([String(area)]), rng),
        answer: String(area),
        hint: 'The area of a square is the side length squared.',
        explanation: `The side length is ${dist}. Area = $side^2 = ${dist}^2 = ${area}$.`
      }
    ],
    difficulty: 'Hard'
  }
}

const combos: ComboGenerator[] = [
  comboGeometryAlgebra,
  comboSurdsGeometry,
  comboTrigVectors,
  comboProbBinomial,
  comboPolynomialFunctions,
  comboStatsProbability,
  comboCalculusCoordGeometry,
  comboNumberBasesModulo,
  comboCoordGeometryAlgebra,
]

export function generateAdvancedComboQuestion(rng: RNG): ComboQuestion {
  return rng.pick(combos)(rng)
}
