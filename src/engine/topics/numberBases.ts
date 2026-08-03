// Number bases question generator — ported from _generate_number_bases_question
import type { Difficulty, RNG, GeneratedQuestion } from '../types'
import { finalizeOptions } from '../../lib/mathFormat'

function baseRepr(n: number, base: number): string {
  return n.toString(base).toUpperCase()
}

export function generateNumberBasesQuestion(difficulty: Difficulty, rng: RNG): GeneratedQuestion {
  let qType: string
  if (difficulty === 'Easy') {
    qType = rng.pick(['to_base_10', 'from_base_10'])
  } else if (difficulty === 'Medium') {
    qType = rng.pick(['addition', 'subtraction'])
  } else {
    qType = 'multiplication'
  }

  let question = '', answer = '', hint = '', explanation = ''
  let options = new Set<string>()
  const base = rng.pick([2, 3, 4, 5, 8])

  if (qType === 'to_base_10') {
    const numBase10 = rng.int(10, 100)
    const numOtherBase = baseRepr(numBase10, base)
    question = `Convert the number $${numOtherBase}_{${base}}$ to base 10.`
    answer = String(numBase10)
    hint = 'Multiply each digit by the base raised to the power of its position (starting from 0 on the right).'
    const digits = numOtherBase.split('').reverse()
    const expParts = digits.map((d, i) => `(${d} \\times ${base}^{${i}})`)
    explanation = `To convert $${numOtherBase}_{${base}}$ to base 10, expand it:\n\n\`${expParts.join(' + ')} = ${numBase10}\`.`
    const sumOfDigits = digits.reduce((acc, d) => acc + parseInt(d, 16), 0) * base
    const distractor1 = base < 16 ? String(parseInt(numOtherBase, 16)) : String(numBase10 + base)
    options = new Set([answer, distractor1, String(sumOfDigits)])
  } else if (qType === 'from_base_10') {
    const numBase10 = rng.int(20, 150)
    const numOtherBase = baseRepr(numBase10, base)
    question = `Convert the number $${numBase10}_{10}$ to base ${base}.`
    answer = String(numOtherBase)
    hint = 'Use repeated division by the target base. The remainders, read from bottom to top, form the new number.'
    let n = numBase10
    const rems: string[] = []
    let exp = `We repeatedly divide ${numBase10} by ${base} and record the remainders:\n`
    while (n > 0) {
      const rem = n % base
      rems.push(String(rem))
      exp += `\n- $${n} \\div ${base} = ${Math.floor(n / base)}$ remainder **${rem}**`
      n = Math.floor(n / base)
    }
    exp += `\n\nReading the remainders from bottom to top gives **${rems.slice().reverse().join('')}**.`
    explanation = exp
    options = new Set([answer, String(numBase10 * base), String(Math.floor(numBase10 / base))])
  } else if (qType === 'addition') {
    const n1 = rng.int(10, 50)
    const n2 = rng.int(10, 50)
    const n1Base = baseRepr(n1, base)
    const n2Base = baseRepr(n2, base)
    const result10 = n1 + n2
    answer = baseRepr(result10, base)
    question = `Calculate the sum in base ${base}: $${n1Base}_{${base}} + ${n2Base}_{${base}}$`
    hint = 'The simplest method is to convert both numbers to base 10, add them normally, then convert the result back to the target base.'
    explanation = `1. Convert to base 10: $${n1Base}_{${base}} = ${n1}_{10}$ and $${n2Base}_{${base}} = ${n2}_{10}$.\n\n2. Add in base 10: $${n1} + ${n2} = ${result10}$.\n\n3. Convert the result back to base ${base}: $${result10}_{10} = ${answer}_{${base}}$.`
    options = new Set([answer, baseRepr(result10 + base, base), baseRepr(n1, base) + baseRepr(n2, base)])
  } else if (qType === 'subtraction') {
    let n1 = rng.int(20, 60)
    let n2 = rng.int(10, 50)
    if (n1 < n2) { const tmp = n1; n1 = n2; n2 = tmp }
    const n1Base = baseRepr(n1, base)
    const n2Base = baseRepr(n2, base)
    const result10 = n1 - n2
    answer = baseRepr(result10, base)
    question = `Calculate the difference in base ${base}: $${n1Base}_{${base}} - ${n2Base}_{${base}}$`
    hint = 'Convert both numbers to base 10, subtract them, then convert the result back to the target base.'
    explanation = `1. Convert to base 10: $${n1Base}_{${base}} = ${n1}_{10}$ and $${n2Base}_{${base}} = ${n2}_{10}$.\n\n2. Subtract in base 10: $${n1} - ${n2} = ${result10}$.\n\n3. Convert the result back to base ${base}: $${result10}_{10} = ${answer}_{${base}}$.`
    options = new Set([answer, baseRepr(result10 + base, base)])
  } else if (qType === 'multiplication') {
    const n1 = rng.int(5, 12)
    const n2 = rng.int(5, 12)
    const n1Base = baseRepr(n1, base)
    const n2Base = baseRepr(n2, base)
    const result10 = n1 * n2
    answer = baseRepr(result10, base)
    question = `Calculate the product in base ${base}: $${n1Base}_{${base}} \\times ${n2Base}_{${base}}$`
    hint = 'Convert both numbers to base 10, multiply them, then convert the final result back to the target base.'
    explanation = `1. Convert to base 10: $${n1Base}_{${base}} = ${n1}_{10}$ and $${n2Base}_{${base}} = ${n2}_{10}$.\n\n2. Multiply in base 10: $${n1} \\times ${n2} = ${result10}$.\n\n3. Convert the result back to base ${base}: $${result10}_{10} = ${answer}_{${base}}$.`
    options = new Set([answer, baseRepr(n1 + n2, base)])
  }

  return { question, options: finalizeOptions(options, rng), answer, hint, explanation, difficulty }
}
