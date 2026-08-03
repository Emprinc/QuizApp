// Word problems question generator — ported from _generate_word_problems_question
import type { Difficulty, RNG, GeneratedQuestion } from '../types'
import { Fraction } from '../../lib/fraction'
import { getFractionLatexCode, formatFractionText, finalizeOptions } from '../../lib/mathFormat'

export function generateWordProblemsQuestion(difficulty: Difficulty, rng: RNG): GeneratedQuestion {
  let qType: string
  if (difficulty === 'Easy') {
    qType = rng.pick(['age_simple', 'speed_distance_time', 'mixture'])
  } else if (difficulty === 'Medium') {
    qType = rng.pick(['work_rate', 'profit_word', 'ratio_word'])
  } else {
    qType = rng.pick(['age_complex', 'investment', 'combined_work'])
  }

  let question = '', answer = '', hint = '', explanation = ''
  let options = new Set<string>()

  if (qType === 'age_simple') {
    const age = rng.int(10, 30)
    const yearsAhead = rng.int(5, 15)
    question = `Kwame is ${age} years old now. How old will he be in ${yearsAhead} years?`
    answer = String(age + yearsAhead)
    hint = 'Add the number of years to the current age.'
    explanation = `Kwame's age in ${yearsAhead} years = ${age} + ${yearsAhead} = ${age + yearsAhead}.`
    options = new Set([answer, String(age - yearsAhead), String(age + yearsAhead + 1)])
  } else if (qType === 'speed_distance_time') {
    const speed = rng.int(40, 120)
    const time = rng.int(2, 6)
    const distance = speed * time
    question = `A car travels at a constant speed of ${speed} km/h for ${time} hours. What distance does it cover?`
    answer = `${distance} km`
    hint = 'Use the formula: Distance = Speed × Time.'
    explanation = `Distance = ${speed} km/h × ${time} h = ${distance} km.`
    options = new Set([answer, `${distance + speed} km`, `${distance - speed} km`, `${speed + time} km`])
  } else if (qType === 'mixture') {
    const total = rng.int(50, 200)
    const percentA = rng.int(10, 40)
    const amountA = Math.round((total * percentA) / 100)
    question = `A mixture of ${total} kg of rice and beans contains ${percentA}% rice. How many kg of rice are in the mixture?`
    answer = `${amountA} kg`
    hint = 'Find the percentage of the total that is rice.'
    explanation = `Amount of rice = ${percentA}% of ${total} = \\frac{${percentA}}{100} \\times ${total} = ${amountA} kg.`
    options = new Set([answer, `${total - amountA} kg`, `${amountA + 10} kg`, `${amountA - 10} kg`])
  } else if (qType === 'work_rate') {
    const time1 = rng.int(3, 8)
    const time2 = rng.int(4, 12)
    while (time2 === time1) { /* ensure different */ }
    const rate1 = new Fraction(1, time1)
    const rate2 = new Fraction(1, time2)
    const combinedRate = rate1.add(rate2)
    const timeTogether = new Fraction(1, 1).div(combinedRate)
    question = `Ama can paint a room in ${time1} days and Kofi can paint the same room in ${time2} days. How long will it take them to paint the room together?`
    answer = formatFractionText(timeTogether)
    hint = 'Add their work rates, then take the reciprocal to find the time together.'
    explanation = `Ama's rate = $\\frac{1}{${time1}}$ rooms/day. Kofi's rate = $\\frac{1}{${time2}}$ rooms/day.\nCombined rate = $\\frac{1}{${time1}} + \\frac{1}{${time2}} = ${getFractionLatexCode(combinedRate)}$ rooms/day.\nTime together = $\\frac{1}{${getFractionLatexCode(combinedRate)}} = ${formatFractionText(timeTogether)}$ days.`
    options = new Set([answer, formatFractionText(new Fraction(time1 + time2, 2)), formatFractionText(new Fraction(time1 * time2, time1 + time2))])
  } else if (qType === 'profit_word') {
    const cost = rng.int(100, 500)
    const profitPercent = rng.int(10, 40)
    const profit = (cost * profitPercent) / 100
    const selling = cost + profit
    question = `A shopkeeper bought an item for GHS ${cost} and wants to make a profit of ${profitPercent}%. At what price should he sell the item?`
    answer = `GHS ${selling.toFixed(2)}`
    hint = 'Profit = Cost × Profit%. Selling Price = Cost + Profit.'
    explanation = `Profit = ${profitPercent}% of GHS ${cost} = GHS ${profit.toFixed(2)}.\nSelling Price = GHS ${cost} + GHS ${profit.toFixed(2)} = GHS ${selling.toFixed(2)}.`
    options = new Set([answer, `GHS ${cost.toFixed(2)}`, `GHS ${(selling + profit).toFixed(2)}`, `GHS ${(selling - profit).toFixed(2)}`])
  } else if (qType === 'ratio_word') {
    const total = rng.int(60, 200)
    const ratioA = rng.int(2, 5)
    const ratioB = rng.int(2, 5)
    const totalParts = ratioA + ratioB
    const shareA = (total * ratioA) / totalParts
    question = `GHS ${total} is shared between Ama and Kofi in the ratio ${ratioA}:${ratioB}. How much does Ama receive?`
    answer = `GHS ${shareA.toFixed(2)}`
    hint = 'Find the total number of parts, then divide the total by the parts to find one part.'
    explanation = `Total parts = ${ratioA} + ${ratioB} = ${totalParts}.\nAma's share = $\\frac{${ratioA}}{${totalParts}} \\times ${total} = ${shareA.toFixed(2)}$.`
    options = new Set([answer, `GHS ${(total - shareA).toFixed(2)}`, `GHS ${(shareA + 10).toFixed(2)}`, `GHS ${(shareA - 10).toFixed(2)}`])
  } else if (qType === 'age_complex') {
    const ageNow = rng.int(10, 25)
    const factor = rng.int(2, 4)
    const yearsAgo = rng.int(3, 10)
    const pastAge = ageNow - yearsAgo
    const parentPastAge = factor * pastAge
    const parentNow = parentPastAge + yearsAgo
    question = `Ama is ${ageNow} years old. ${yearsAgo} years ago, her father was ${factor} times as old as she was. How old is her father now?`
    answer = String(parentNow)
    hint = 'Find Ama\'s age ${yearsAgo} years ago, then find her father\'s age at that time, and add ${yearsAgo} to get his current age.'
    explanation = `${yearsAgo} years ago, Ama was ${pastAge} years old.\nHer father was ${factor} × ${pastAge} = ${parentPastAge} years old.\nNow, her father is ${parentPastAge} + ${yearsAgo} = ${parentNow} years old.`
    options = new Set([answer, String(parentNow + yearsAgo), String(parentNow - yearsAgo), String(ageNow * factor)])
  } else if (qType === 'investment') {
    const principal = rng.int(1000, 5000)
    const rate = rng.int(3, 10)
    const time = rng.int(2, 5)
    const interest = (principal * rate * time) / 100
    const total = principal + interest
    question = `A businessman invests GHS ${principal} at a simple interest rate of ${rate}% per annum for ${time} years. What is the total amount he will receive?`
    answer = `GHS ${total.toFixed(2)}`
    hint = 'Use Simple Interest = (Principal × Rate × Time) / 100. Total Amount = Principal + Interest.'
    explanation = `Interest = $\\frac{${principal} \\times ${rate} \\times ${time}}{100} = GHS ${interest.toFixed(2)}$.\nTotal Amount = GHS ${principal} + GHS ${interest.toFixed(2)} = GHS ${total.toFixed(2)}.`
    options = new Set([answer, `GHS ${interest.toFixed(2)}`, `GHS ${(total + interest).toFixed(2)}`, `GHS ${(principal).toFixed(2)}`])
  } else if (qType === 'combined_work') {
    const time1 = rng.int(4, 10)
    const time2 = rng.int(3, 8)
    const time3 = rng.int(6, 15)
    const rate1 = new Fraction(1, time1)
    const rate2 = new Fraction(1, time2)
    const rate3 = new Fraction(1, time3)
    const combinedRate = rate1.add(rate2).add(rate3)
    const timeTogether = new Fraction(1, 1).div(combinedRate)
    question = `Three pipes can fill a tank in ${time1}, ${time2}, and ${time3} hours respectively. If all three pipes are opened together, how long will it take to fill the tank?`
    answer = formatFractionText(timeTogether)
    hint = 'Add the rates of all three pipes, then take the reciprocal to find the time.'
    explanation = `Rates: $\\frac{1}{${time1}} + \\frac{1}{${time2}} + \\frac{1}{${time3}} = ${getFractionLatexCode(combinedRate)}$ tanks/hour.\nTime together = $\\frac{1}{${getFractionLatexCode(combinedRate)}} = ${formatFractionText(timeTogether)}$ hours.`
    options = new Set([answer, formatFractionText(new Fraction(time1 + time2 + time3, 3)), formatFractionText(new Fraction(time1 * time2 * time3, time1 + time2 + time3))])
  }

  return { question, options: finalizeOptions(options, rng), answer, hint, explanation, difficulty }
}
