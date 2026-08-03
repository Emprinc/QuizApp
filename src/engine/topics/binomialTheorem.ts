// Binomial theorem question generator — ported from _generate_binomial_theorem_question
import type { Difficulty, RNG, GeneratedQuestion } from '../types'
import { finalizeOptions } from '../../lib/mathFormat'
import { generatePascalData } from '../pascal'

function binomial(n: number, k: number): number {
  if (k < 0 || k > n) return 0
  if (k === 0 || k === n) return 1
  let result = 1
  for (let i = 0; i < k; i++) {
    result = (result * (n - i)) / (i + 1)
  }
  return Math.round(result)
}

export function generateBinomialTheoremQuestion(difficulty: Difficulty, rng: RNG): GeneratedQuestion {
  let qType: string
  if (difficulty === 'Easy') {
    qType = 'pascal_read'
  } else if (difficulty === 'Medium') {
    qType = 'find_coefficient'
  } else {
    qType = 'find_term'
  }

  let question = '', answer = '', hint = '', explanation = ''
  let options = new Set<string>()

  if (qType === 'pascal_read') {
    const n = rng.int(3, 5)
    const { triangleStr, lastRow } = generatePascalData(n)
    const k = rng.int(1, n - 1)
    const termOrd = ({ 1: '2nd', 2: '3rd', 3: '4th', 4: '5th' } as Record<number, string>)[k] ?? `${k + 1}th`
    question = `Using Pascal's Triangle, what is the **${termOrd}** coefficient in the expansion of $(a+b)^{${n}}$?`
    answer = String(lastRow[k])
    hint = 'The coefficients for the expansion of $(a+b)^n$ are found in the row of Pascal\'s Triangle that starts with 1, n, ...'
    explanation = `Pascal's Triangle up to row ${n} is:\n${triangleStr}\nThe row for n=${n} is \`${lastRow}\`. The ${termOrd} number in that list is **${answer}**.`
    options = new Set(lastRow.map((c) => String(c)))
    options.add(answer)
  } else if (qType === 'find_coefficient') {
    const n = rng.int(4, 7)
    const a = rng.int(1, 4)
    const b = rng.int(1, 4)
    const k = rng.int(2, n - 2)
    question = `Find the coefficient of the $x^{${k}}$ term in the expansion of $(${a}x + ${b})^{${n}}$.`
    const coefficient = binomial(n, k) * (a ** k) * (b ** (n - k))
    answer = String(coefficient)
    hint = `Use the binomial formula for a specific term: $\\binom{n}{k} (ax)^k b^{n-k}$. Here, n=${n} and k=${k}.`
    explanation =
      `The term containing $x^{${k}}$ is given by the formula $T_{k+1} = \\binom{n}{k} (ax)^k b^{n-k}$.\n` +
      `The coefficient part is $\\binom{${n}}{${k}} a^k b^{n-k}$.\n` +
      `$= ${binomial(n, k)} \\times ${a}^{${k}} \\times ${b}^{${n - k}} = ${answer}$.`
    const distractor1 = String(binomial(n, k) * (a ** k))
    const distractor2 = String(binomial(n, k))
    options = new Set([answer, distractor1, distractor2])
  } else if (qType === 'find_term') {
    const n = rng.int(5, 8)
    const a = rng.int(1, 4)
    const b = rng.int(1, 4)
    const r = rng.int(2, n - 1)
    const k = r - 1
    question = `Find the **${r}th term** in the expansion of $(${a}x + ${b})^{${n}}$.`
    const termCoeff = binomial(n, k) * (a ** k) * (b ** (n - k))
    answer = `$${termCoeff}x^{${k}}$`
    hint = `The r-th term is given by the formula $T_r = \\binom{n}{r-1} (ax)^{r-1} b^{n-(r-1)}$.`
    explanation =
      `To find the ${r}th term, we use an index of $k = r-1 = ${k}$.\n` +
      `The term is given by the formula $T_{${r}} = \\binom{n}{k}(ax)^{k}(b)^{n-k}$.\n` +
      `$= \\binom{${n}}{${k}} (${a}x)^{${k}} (${b})^{${n - k}}$\n` +
      `$= ${binomial(n, k)} \\times ${a ** k}x^{${k}} \\times ${b ** (n - k)}$\n` +
      `$= ${termCoeff}x^{${k}}$.`
    const distractorCoeff = r < n ? binomial(n, r) * (a ** r) * (b ** (n - r)) : binomial(n, k) * (a ** k)
    const distractor = `$${distractorCoeff}x^{${r}}$`
    options = new Set([answer, distractor, `$${termCoeff}x^{${r}}$`])
  }

  return { question, options: finalizeOptions(options, rng), answer, hint, explanation, difficulty }
}
