// Statistics question generator — ported from _generate_statistics_question
import type { Difficulty, RNG, GeneratedQuestion } from '../types'
import { finalizeOptions } from '../../lib/mathFormat'

function mean(arr: number[]): number {
  return arr.reduce((a, b) => a + b, 0) / arr.length
}

function median(arr: number[]): number {
  const sorted = [...arr].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid]
}

function variance(arr: number[]): number {
  const m = mean(arr)
  return arr.reduce((acc, x) => acc + (x - m) ** 2, 0) / arr.length
}

function stdDev(arr: number[]): number {
  return Math.sqrt(variance(arr))
}

export function generateStatisticsQuestion(difficulty: Difficulty, rng: RNG): GeneratedQuestion {
  let qType: string
  if (difficulty === 'Easy') {
    qType = rng.pick(['mode', 'range'])
  } else if (difficulty === 'Medium') {
    qType = rng.pick(['mean', 'median'])
  } else {
    qType = rng.pick(['frequency_tables', 'std_dev'])
  }

  let question = '', answer = '', hint = '', explanation = ''
  let options = new Set<string>()

  if (qType === 'mode') {
    const k = rng.int(4, 5)
    const baseData = rng.sample(Array.from({ length: 40 }, (_, i) => i + 10), k)
    const modeVal = rng.pick(baseData)
    const data = rng.shuffle([...baseData, modeVal, modeVal])
    question = `What is the mode of the following set of numbers representing daily sales at a stall in Kejetia Market? \`${data}\``
    answer = String(modeVal)
    hint = 'The mode is the number that appears most frequently in a data set.'
    const sortedData = [...data].sort((a, b) => a - b)
    explanation = `By counting the occurrences of each number in the sorted list \`${sortedData}\`, we can see that **${answer}** appears most often (3 times).`
    options = new Set([answer, String(Math.round(mean(data))), String(median(data))])
  } else if (qType === 'range') {
    const k = rng.int(5, 7)
    const data = rng.sample(Array.from({ length: 140 }, (_, i) => i + 10), k)
    const rangeVal = Math.max(...data) - Math.min(...data)
    question = `Calculate the range of the following daily temperatures recorded in Kumasi: \`${data}\``
    answer = String(rangeVal)
    hint = 'The range is the difference between the highest and lowest values in the dataset.'
    explanation = `1. The highest value (Maximum) is \`${Math.max(...data)}\`.\n\n2. The lowest value (Minimum) is \`${Math.min(...data)}\`.\n\n3. Range = Maximum - Minimum = \`${Math.max(...data)} - ${Math.min(...data)} = ${answer}\`.`
    options = new Set([answer, String(Math.max(...data) + Math.min(...data)), String(Math.max(...data))])
  } else if (qType === 'mean') {
    const k = rng.int(5, 7)
    const data = rng.sample(Array.from({ length: 95 }, (_, i) => i + 5), k).sort((a, b) => a - b)
    const meanVal = mean(data)
    question = `A student in Accra recorded the following scores on their quizzes: \`${data}\`. What is the mean score, rounded to one decimal place?`
    answer = meanVal.toFixed(1)
    hint = 'The mean is the sum of all values divided by the number of values.'
    explanation = `1. Sum of values: \`${data.join('+')} = ${data.reduce((a, b) => a + b, 0)}\`\n\n2. Number of values: \`${data.length}\`\n\n3. Mean = Sum / Count = \`${data.reduce((a, b) => a + b, 0)} / ${data.length} \\approx ${answer}\`.`
    options = new Set([answer, median(data).toFixed(1), String(Math.max(...data) - Math.min(...data))])
  } else if (qType === 'median') {
    const k = rng.pick([5, 6, 7])
    const data = rng.sample(Array.from({ length: 95 }, (_, i) => i + 5), k).sort((a, b) => a - b)
    const medianVal = median(data)
    question = `Find the median of the following dataset: \`${data}\``
    answer = String(medianVal)
    hint = "First, sort the data. The median is the middle value. If there are two middle values, it's their average."
    explanation = `1. The data must be sorted: \`${data}\`.\n\n2. Since there are ${k} values, the median is the middle value. The calculated median is **${answer}**.`
    options = new Set([answer, (sum(data) / data.length).toFixed(1), String(data[0])])
  } else if (qType === 'frequency_tables') {
    const scores = [1, 2, 3, 4, 5]
    const freqs = Array.from({ length: 5 }, () => rng.int(2, 10))
    let tableMd = '| Score (x) | Frequency (f) |\n|---|---|\n'
    const fxCalcs: string[] = []
    for (let i = 0; i < scores.length; i++) {
      tableMd += `| ${scores[i]} | ${freqs[i]} |\n`
      fxCalcs.push(`${scores[i]}x${freqs[i]}=${scores[i] * freqs[i]}`)
    }
    const totalItems = freqs.reduce((a, b) => a + b, 0)
    const totalSum = scores.reduce((acc, s, i) => acc + s * freqs[i], 0)
    const meanVal = totalSum / totalItems
    question = `The table below shows the results of a quiz. What is the mean score?\n\n${tableMd}`
    answer = meanVal.toFixed(2)
    hint = 'To find the mean from a frequency table, calculate the sum of (score × frequency) for each row, then divide by the total frequency.'
    explanation = `1. Calculate \`fx\` for each row and sum them: \`${fxCalcs.join(', ')}\`. The sum is $\\sum fx = ${totalSum}$.\n\n2. Sum the frequencies: $\\sum f = ${totalItems}$.\n\n3. Mean = $\\frac{\\sum fx}{\\sum f} = \\frac{${totalSum}}{${totalItems}} \\approx ${answer}$.`
    options = new Set([answer, (totalItems / scores.length).toFixed(2), (totalSum / 5).toFixed(2)])
  } else if (qType === 'std_dev') {
    const k = rng.int(4, 5)
    const data = rng.sample(Array.from({ length: 20 }, (_, i) => i + 10), k)
    const stdDevVal = stdDev(data)
    question = `Calculate the population standard deviation of the dataset: \`${data}\`. Round to two decimal places.`
    answer = stdDevVal.toFixed(2)
    hint = '1. Find the mean. 2. For each number, subtract the mean and square the result. 3. Find the average of those squared differences (the variance). 4. Take the square root of the variance.'
    const meanVal = mean(data)
    const varVal = variance(data)
    explanation = `1. Mean (\`μ\`) = \`${meanVal.toFixed(2)}\`.\n\n2. Variance (\`σ²\`) = Average of squared differences from the mean ≈ \`${varVal.toFixed(2)}\`.\n\n3. Standard Deviation (\`σ\`) = \`√Variance\` ≈ \`${answer}\`.`
    options = new Set([answer, varVal.toFixed(2), (Math.max(...data) - Math.min(...data)).toFixed(2)])
  }

  return { question, options: finalizeOptions(options, rng), answer, hint, explanation, difficulty }
}

function sum(arr: number[]): number {
  return arr.reduce((a, b) => a + b, 0)
}
