// Modulo arithmetic question generator — ported from _generate_modulo_arithmetic_question
import type { Difficulty, RNG, GeneratedQuestion } from '../types'
import { finalizeOptions } from '../../lib/mathFormat'

export function generateModuloArithmeticQuestion(difficulty: Difficulty, rng: RNG): GeneratedQuestion {
  let qType: string
  if (difficulty === 'Easy') {
    qType = rng.pick(['find_remainder', 'clock_arithmetic'])
  } else if (difficulty === 'Medium') {
    qType = rng.pick(['congruence', 'day_of_week'])
  } else {
    qType = 'solve_linear'
  }

  let question = '', answer = '', hint = '', explanation = ''
  let options = new Set<string>()

  if (qType === 'find_remainder') {
    const n = rng.int(3, 12)
    const a = rng.int(n + 1, n * 10)
    const rem = a % n
    question = `Find the remainder when $${a}$ is divided by $${n}$. (i.e., find $${a} \\pmod ${n}$)`
    answer = String(rem)
    hint = "This is asking for the value of the 'modulo' operation, which is the remainder after division."
    explanation = `To find the remainder, we see how many times $${n}$ fits into $${a}$ completely, and what is left over.\n\n$${a} = ${n} \\times ${Math.floor(a / n)} + ${rem}$.\n\nThe remainder is **${rem}**.`
    options = new Set([answer, String(Math.floor(a / n)), String(n - rem)])
  } else if (qType === 'clock_arithmetic') {
    const currentTime = rng.int(1, 12)
    const hoursPassed = rng.int(15, 100)
    const finalTime = ((currentTime + hoursPassed - 1) % 12) + 1
    question = `A student in Accra looks at a 12-hour clock. It is currently ${currentTime} o'clock. What time will it be in ${hoursPassed} hours?`
    answer = `${finalTime} o'clock`
    hint = 'This problem can be solved using modulo 12. The cycle of a clock repeats every 12 hours.'
    explanation = `We can calculate this using modulo arithmetic:\n\n$(${currentTime} + ${hoursPassed}) \\pmod{12}$.\n\nA remainder of 0 corresponds to 12 o'clock. The calculation is \`(${currentTime} + ${hoursPassed} - 1) % 12 + 1\`, which results in **${finalTime} o'clock**.`
    const naive = (currentTime + hoursPassed) % 12
    const alt = Math.abs(currentTime - hoursPassed) % 12
    options = new Set([answer, `${naive === 0 ? 12 : naive} o'clock`, `${alt === 0 ? 12 : alt} o'clock`])
  } else if (qType === 'congruence') {
    const n = rng.int(3, 9)
    const isTrue = rng.bool()
    let a: number, b: number
    if (isTrue) {
      const rem = rng.int(0, n - 1)
      a = n * rng.int(2, 5) + rem
      b = n * rng.int(1, 4) + rem
      while (a === b) b = n * rng.int(1, 4) + rem
      answer = 'True'
    } else {
      const [rem1, rem2] = rng.sample(Array.from({ length: n }, (_, i) => i), 2)
      a = n * rng.int(2, 5) + rem1
      b = n * rng.int(1, 4) + rem2
      answer = 'False'
    }
    question = `Is the following congruence relation true or false? $${a} \\equiv ${b} \\pmod ${n}$`
    hint = `The relation $a \\equiv b \\pmod n$ is true if and only if $a$ and $b$ have the same remainder when divided by $n$. Alternatively, if $(a - b)$ is a multiple of $n$.`
    explanation = `We check if $(a - b)$ is divisible by $${n}$.\n\n$${a} - ${b} = ${a - b}$.\n\nIs ${a - b} divisible by ${n}? The answer is **${answer.toLowerCase()}**.`
    options = new Set(['True', 'False'])
  } else if (qType === 'day_of_week') {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    const startDayIndex = rng.int(0, 6)
    const daysPassed = rng.int(20, 200)
    const finalDayIndex = (startDayIndex + daysPassed) % 7
    question = `Today is ${days[startDayIndex]}. What day of the week will it be in ${daysPassed} days?`
    answer = days[finalDayIndex]
    hint = 'Use modulo 7 to solve this problem. The cycle of a week repeats every 7 days.'
    explanation = `We can model the days of the week with numbers 0 through 6 (e.g., ${days[startDayIndex]} = ${startDayIndex}).\n\nWe calculate $(${startDayIndex} + ${daysPassed}) \\pmod 7$.\n\n$(${startDayIndex + daysPassed}) \\pmod 7 = ${finalDayIndex}$.\n\nThe number ${finalDayIndex} corresponds to **${answer}**.`
    options = new Set(days)
  } else if (qType === 'solve_linear') {
    const n = rng.pick([3, 5, 7, 11])
    const a = rng.int(2, n - 1)
    const x = rng.int(1, n - 1)
    const b = (a * x) % n
    question = `Find the value of $x$ in the congruence: $${a}x \\equiv ${b} \\pmod ${n}$, where $x$ is an integer from 1 to ${n - 1}.`
    answer = String(x)
    hint = `You can test the integer values from 1 to ${n - 1} for $x$ to see which one satisfies the equation.`
    explanation = `We are looking for an integer $x$ such that $${a}x$ has the same remainder as $${b}$ when divided by $${n}$. By testing values, we find:\n\n- For $x=${x}$, $${a}(${x}) = ${a * x}$.\n- $${a * x} \\div ${n}$ is ${Math.floor((a * x) / n)} with a remainder of ${b}.\n\nSo, **$x=${answer}$** is the solution.`
    options = new Set([answer, String((b - a + n) % n), String((b + a) % n)])
  }

  return { question, options: finalizeOptions(options, rng), answer, hint, explanation, difficulty }
}
