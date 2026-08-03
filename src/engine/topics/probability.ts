// Probability question generator — ported from _generate_probability_question
import type { Difficulty, RNG, GeneratedQuestion } from '../types'
import { Fraction } from '../../lib/fraction'
import { getFractionLatexCode, formatFractionText, finalizeOptions } from '../../lib/mathFormat'

export function generateProbabilityQuestion(difficulty: Difficulty, rng: RNG): GeneratedQuestion {
  let qType: string
  if (difficulty === 'Easy') {
    qType = 'simple'
  } else if (difficulty === 'Medium') {
    qType = 'combined'
  } else {
    qType = 'conditional'
  }

  let question = '', answer = '', hint = '', explanation = ''
  let options = new Set<string>()

  if (qType === 'simple') {
    const red = rng.int(3, 8)
    const blue = rng.int(3, 8)
    const total = red + blue
    const chosenColor = rng.bool() ? 'red' : 'blue'
    const numChosen = chosenColor === 'red' ? red : blue
    question = `A bag contains ${red} red balls and ${blue} blue balls. If one ball is picked at random, what is the probability that it is ${chosenColor}?`
    const answerFrac = new Fraction(numChosen, total)
    answer = formatFractionText(answerFrac)
    hint = 'Probability = (Number of favorable outcomes) / (Total number of possible outcomes).'
    explanation = `There are ${numChosen} ${chosenColor} balls and a total of ${total} balls in the bag. So, the probability of picking a ${chosenColor} ball is P(${chosenColor}) = $${getFractionLatexCode(answerFrac)}$.`
    const otherColorNum = chosenColor === 'blue' ? red : blue
    options = new Set([answer, formatFractionText(new Fraction(otherColorNum, total)), '1/2'])
  } else if (qType === 'combined') {
    const evens = new Set([2, 4, 6])
    const greaterThan4 = new Set([5, 6])
    const union = new Set([...evens, ...greaterThan4])
    question = 'A fair six-sided die is rolled once. What is the probability of rolling an even number or a number greater than 4?'
    const answerFrac = new Fraction(union.size, 6)
    answer = formatFractionText(answerFrac)
    hint = 'Find the set of outcomes for each event, then find their union. Be careful not to double-count outcomes that satisfy both conditions.'
    explanation = `Event A (even) = {${[...evens].join(', ')}}. Event B (>4) = {${[...greaterThan4].join(', ')}}.\nThe combined event 'A or B' is the union of these sets: {${[...union].join(', ')}}, which has ${union.size} favorable outcomes.\nSince there are 6 total outcomes on a die, the probability is $${getFractionLatexCode(answerFrac)}$.`
    options = new Set([answer, formatFractionText(new Fraction(evens.size + greaterThan4.size, 6)), formatFractionText(new Fraction(evens.size, 6))])
  } else if (qType === 'conditional') {
    const black = rng.int(3, 6)
    const white = rng.int(3, 6)
    const total = black + white
    question = `A box in a shop in Kumasi contains ${black} black pens and ${white} white pens. Two pens are drawn one after the other **without replacement**. What is the probability that both are white?`
    const probFrac = new Fraction(white, total).mul(new Fraction(white - 1, total - 1))
    answer = formatFractionText(probFrac)
    hint = 'Calculate the probability of the first event, then the probability of the second event *given the first has occurred*, and multiply them.'
    explanation =
      `The probability that the first pen is white is P(1st is white) = $\\frac{${white}}{${total}}$.\n` +
      `After drawing one white pen, there are now ${white - 1} white pens and ${total - 1} total pens left.\n` +
      `The probability that the second pen is also white is P(2nd is white) = $\\frac{${white - 1}}{${total - 1}}$.\n` +
      `The total probability is the product of these two: $\\frac{${white}}{${total}} \\times \\frac{${white - 1}}{${total - 1}} = ${getFractionLatexCode(probFrac)}$.`
    options = new Set([
      answer,
      formatFractionText(new Fraction(white, total).mul(new Fraction(white, total))),
      formatFractionText(new Fraction(white - 1, total - 1)),
    ])
  }

  return { question, options: finalizeOptions(options, rng, 'fraction'), answer, hint, explanation, difficulty }
}
