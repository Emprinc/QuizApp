// Percentages question generator — ported from _generate_percentages_question
import type { Difficulty, RNG, GeneratedQuestion } from '../types'
import { Fraction } from '../../lib/fraction'
import { getFractionLatexCode, finalizeOptions } from '../../lib/mathFormat'

export function generatePercentagesQuestion(difficulty: Difficulty, rng: RNG): GeneratedQuestion {
  let qType: string
  if (difficulty === 'Easy') {
    qType = rng.pick(['conversion', 'percent_of'])
  } else if (difficulty === 'Medium') {
    qType = rng.pick(['express_as_percent', 'percent_change', 'profit_loss'])
  } else {
    qType = rng.pick(['reverse_percent', 'successive_change', 'percent_error'])
  }

  let question = '', answer = '', hint = '', explanation = ''
  let options = new Set<string>()

  if (qType === 'conversion') {
    const frac = new Fraction(rng.int(1, 4), rng.pick([5, 8, 10, 20, 25]))
    const percent = (Number(frac.numerator) / Number(frac.denominator)) * 100
    const decimal = Number(frac.numerator) / Number(frac.denominator)
    const [startForm, endForm, ansVal] = rng.pick<[string, string, string]>([
      [`$${getFractionLatexCode(frac)}$`, 'a percentage', `${percent.toFixed(0)}%`],
      [`${decimal}`, 'a percentage', `${percent.toFixed(0)}%`],
      [`${percent.toFixed(0)}%`, 'a decimal', `${decimal}`],
    ])
    question = `Express ${startForm} as ${endForm}.`
    answer = String(ansVal)
    hint = 'To convert from a fraction/decimal to a percentage, multiply by 100. To convert from a percentage to a decimal, divide by 100.'
    explanation = `The conversion from ${startForm} to ${endForm} results in ${answer}$.`
    options = new Set([answer, `${(decimal * 10).toFixed(0)}%`, `${percent / 10}`])
  } else if (qType === 'percent_of') {
    const percent = rng.int(1, 19) * 5
    const number = rng.int(10, 50) * 10
    question = `Calculate ${percent}% of GHS ${number.toFixed(2)}.`
    answer = `GHS ${((percent / 100) * number).toFixed(2)}`
    hint = 'Convert the percentage to a decimal (divide by 100) and then multiply.'
    explanation = `${percent}% of ${number} is equivalent to $${percent / 100} \\times ${number} = ${parseFloat(answer.split(' ')[1]).toFixed(2)}$.`
    options = new Set([answer, `GHS ${((percent * number) / 10).toFixed(2)}`, `GHS ${(number / percent).toFixed(2)}`])
  } else if (qType === 'express_as_percent') {
    const part = rng.int(10, 40)
    const whole = rng.int(50, 100)
    question = `In a school in Accra, ${part} students out of ${whole} are boys. What percentage of the students are boys?`
    answer = `${((part / whole) * 100).toFixed(1)}%`
    hint = 'Use the formula: (Part / Whole) * 100%.'
    explanation = `The percentage is calculated as $(\\frac{${part}}{${whole}}) \\times 100\\% = ${answer}$.`
    options = new Set([answer, `${((whole / part) * 100).toFixed(1)}%`, `${((part * 100) / whole).toFixed(0)}%`])
  } else if (qType === 'percent_change') {
    const oldVal = rng.int(50, 200)
    const newVal = rng.int(201, 400)
    question = `The price of a textbook increased from GHS ${oldVal} to GHS ${newVal}. Find the percentage increase.`
    const ansVal = ((newVal - oldVal) / oldVal) * 100
    answer = `${ansVal.toFixed(1)}%`
    hint = 'Use the formula: (New Value - Old Value) / Old Value * 100%.'
    explanation = `Change = $${newVal} - ${oldVal} = ${newVal - oldVal}$.\n\nPercent Change = $(\\frac{${newVal - oldVal}}{${oldVal}}) \\times 100 = ${answer}$.`
    options = new Set([answer, `${(((newVal - oldVal) / newVal) * 100).toFixed(1)}%`, `${ansVal.toFixed(0)}%`])
  } else if (qType === 'profit_loss') {
    const cost = rng.int(100, 200)
    const selling = rng.int(201, 300)
    question = `A trader in Kumasi bought an item for GHS ${cost} and sold it for GHS ${selling}. Calculate the profit percent.`
    const profit = selling - cost
    const ansVal = (profit / cost) * 100
    answer = `${ansVal.toFixed(1)}%`
    hint = 'Profit Percent = (Profit / Cost Price) * 100%.'
    explanation = `Profit = $${selling} - ${cost} = ${profit}$.\n\nProfit Percent = $(\\frac{${profit}}{${cost}}) \\times 100 = ${answer}$.`
    options = new Set([answer, `${((profit / selling) * 100).toFixed(1)}%`, `${ansVal.toFixed(0)}%`])
  } else if (qType === 'reverse_percent') {
    const originalPrice = rng.int(100, 400)
    const discount = rng.int(1, 8) * 5
    const finalPrice = originalPrice * (1 - discount / 100)
    question = `After a ${discount}% discount, a shirt costs GHS ${finalPrice.toFixed(2)}. What was the original price?`
    answer = `GHS ${originalPrice.toFixed(2)}`
    hint = `The final price represents ${100 - discount}% of the original price. Let the original price be P and solve for it.`
    explanation = `Let P be the original price.\n$P \\times (1 - \\frac{${discount}}{100}) = ${finalPrice.toFixed(2)}$.\n$P = \\frac{${finalPrice.toFixed(2)}}{1 - ${discount / 100}} = ${originalPrice.toFixed(2)}$.`
    options = new Set([answer, `GHS ${(finalPrice * (1 + discount / 100)).toFixed(2)}`, `GHS ${(finalPrice / (1 + discount / 100)).toFixed(2)}`])
  } else if (qType === 'successive_change') {
    const initialVal = 1000
    const increase = rng.int(10, 20)
    const decrease = rng.int(5, 9)
    const valAfterIncrease = initialVal * (1 + increase / 100)
    const finalVal = valAfterIncrease * (1 - decrease / 100)
    const netChange = ((finalVal - initialVal) / initialVal) * 100
    question = `A worker's salary of GHS ${initialVal} was increased by ${increase}%, and later decreased by ${decrease}%. What is the net percentage change in their salary?`
    answer = `${netChange.toFixed(2)}%`
    hint = 'Calculate the new salary after the first change, then apply the second change to that new amount. Do not just add or subtract the percentages.'
    explanation = `1. After ${increase}% increase: GHS ${initialVal} * 1.${increase.toString().padStart(2, '0')} = GHS ${valAfterIncrease}.\n2. After ${decrease}% decrease: GHS ${valAfterIncrease} * (1 - 0.0${decrease}) = GHS ${finalVal.toFixed(2)}.\n3. Net Change = ${(finalVal - initialVal).toFixed(2)}.\n4. Net % Change = (\\frac{${(finalVal - initialVal).toFixed(2)}}{${initialVal}}) \\times 100 = ${answer}$.`
    options = new Set([answer, `${increase - decrease}%`, `${(increase - decrease).toFixed(2)}%`])
  } else if (qType === 'percent_error') {
    const actual = rng.int(50, 100)
    const error = rng.int(1, 5)
    const measured = actual + error
    question = `A length was measured as ${measured} cm, but the actual length was ${actual} cm. Calculate the percentage error.`
    const ansVal = (error / actual) * 100
    answer = `${ansVal.toFixed(2)}%`
    hint = 'Percentage Error = (Error / Actual Value) * 100%.'
    explanation = `1. Error = Measured - Actual = ${measured} - ${actual} = ${error}.\n2. Percentage Error = (\\frac{${error}}{${actual}}) \\times 100\\% = ${answer}$.`
    options = new Set([answer, `${((error / measured) * 100).toFixed(2)}%`, `${ansVal.toFixed(1)}%`])
  }

  return { question, options: finalizeOptions(options, rng), answer, hint, explanation, difficulty }
}
