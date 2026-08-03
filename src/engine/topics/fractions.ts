// Fractions question generator — ported from _generate_fractions_question
import type { Difficulty, RNG, GeneratedQuestion } from '../types'
import { Fraction } from '../../lib/fraction'
import { getFractionLatexCode, formatFractionText, finalizeOptions } from '../../lib/mathFormat'

export function generateFractionsQuestion(difficulty: Difficulty, rng: RNG): GeneratedQuestion {
  let qType: string
  if (difficulty === 'Easy') {
    qType = rng.pick(['operation_simple', 'equivalent'])
  } else if (difficulty === 'Medium') {
    qType = rng.pick(['operation_complex', 'bodmas', 'word_problem'])
  } else {
    qType = rng.pick(['convert_mixed', 'compare', 'complex_fraction'])
  }

  let question = '', answer = '', hint = '', explanation = ''
  let options = new Set<string>()

  if (qType === 'operation_simple') {
    const f1 = new Fraction(rng.int(1, 5), rng.int(2, 6))
    const f2 = new Fraction(rng.int(1, 5), rng.int(2, 6))
    const [op, sym] = rng.pick<[string, string]>([['add', '+'], ['subtract', '-']])
    question = `Calculate: $${getFractionLatexCode(f1)} ${sym} $${getFractionLatexCode(f2)}$`
    const res = op === 'add' ? f1.add(f2) : f1.sub(f2)
    answer = formatFractionText(res)
    hint = 'To add or subtract fractions, you must first find a common denominator.'
    explanation = `After finding a common denominator and performing the operation, the result is $${getFractionLatexCode(res)}$.`
    options = new Set([answer, formatFractionText(f1.mul(f2))])
  } else if (qType === 'equivalent') {
    const num = rng.int(2, 5)
    const den = rng.int(6, 11)
    const multiplier = rng.int(2, 5)
    question = `Find the missing value: $\\frac{${num}}{${den}} = \\frac{?}{${den * multiplier}}$`
    answer = String(num * multiplier)
    hint = 'To find an equivalent fraction, whatever you multiply the denominator by, you must also multiply the numerator by.'
    explanation = `The denominator was multiplied by ${multiplier} (since $${den} \\times ${multiplier} = ${den * multiplier}$). Therefore, the numerator must also be multiplied by ${multiplier}. The missing value is $${num} \\times ${multiplier} = ${answer}$.`
    options = new Set([answer, String(num + multiplier), String(den * multiplier)])
  } else if (qType === 'operation_complex') {
    let f1 = new Fraction(rng.int(1, 10), rng.int(2, 10))
    let f2 = new Fraction(rng.int(1, 10), rng.int(2, 10))
    const [op, sym] = rng.pick<[string, string]>([['multiply', '\\times'], ['divide', '\\div']])
    if (op === 'divide' && Number(f2.numerator) === 0) f2 = new Fraction(1, Number(f2.denominator))
    question = `Calculate: $${getFractionLatexCode(f1)} ${sym} ${getFractionLatexCode(f2)}$`
    const res = op === 'multiply' ? f1.mul(f2) : f1.div(f2)
    answer = formatFractionText(res)
    hint = 'To multiply, multiply straight across. To divide, invert the second fraction and multiply.'
    explanation = `The result of the calculation is $${getFractionLatexCode(res)}$.`
    options = new Set([answer, formatFractionText(f1.add(f2))])
  } else if (qType === 'bodmas') {
    const a = rng.int(2, 6)
    const b = rng.int(2, 6)
    const c = rng.int(2, 6)
    question = `Evaluate the expression: $ (\\frac{1}{${a}} + \\frac{1}{${b}}) \\times ${c} $`
    const res = new Fraction(1, a).add(new Fraction(1, b)).mul(new Fraction(c))
    answer = formatFractionText(res)
    hint = 'Follow BODMAS/PEMDAS. Solve the operation inside the brackets first.'
    explanation = `1. Solve the bracket: $\\frac{1}{${a}} + \\frac{1}{${b}} = \\frac{${b + a}}{${a * b}}$.\n\n2. Multiply by the constant: $\\frac{${a + b}}{${a * b}} \\times ${c} = ${getFractionLatexCode(res)}$.`
    const distractor = formatFractionText(new Fraction(1, a).add(new Fraction(1, b).mul(new Fraction(c))))
    options = new Set([answer, distractor])
  } else if (qType === 'word_problem') {
    const den = rng.pick([3, 4, 5, 8])
    const num = rng.int(1, den - 1)
    const quantity = rng.int(10, 20) * den
    question = `A student in Accra had ${quantity} oranges and gave away $\\frac{${num}}{${den}}$ of them. How many oranges did the student have left?`
    answer = String(Math.floor(quantity * (1 - num / den)))
    hint = 'First, find the fraction of oranges remaining. Then, multiply that fraction by the total number of oranges.'
    explanation = `1. Fraction remaining = $1 - \\frac{${num}}{${den}} = \\frac{${den - num}}{${den}}$.\n2. Oranges left = $\\frac{${den - num}}{${den}} \\times ${quantity} = ${answer}$.`
    options = new Set([answer, String(Math.floor(quantity * (num / den)))])
  } else if (qType === 'convert_mixed') {
    const whole = rng.int(1, 5)
    const num = rng.int(1, 5)
    const den = rng.int(6, 10)
    const improperNum = whole * den + num
    const improperFrac = new Fraction(improperNum, den)
    const mixedNumLatex = `${whole}\\frac{${num}}{${den}}`
    if (rng.bool()) {
      question = `Convert the mixed number $${mixedNumLatex}$ to an improper fraction.`
      answer = formatFractionText(improperFrac)
      hint = 'Multiply the whole number by the denominator, then add the numerator. Keep the same denominator.'
      explanation = `Calculation: $(${whole} \\times ${den}) + ${num} = ${improperNum}$. The improper fraction is $${getFractionLatexCode(improperFrac)}$.`
    } else {
      question = `Convert the improper fraction $${getFractionLatexCode(improperFrac)}$ to a mixed number.`
      answer = `$${mixedNumLatex}$`
      hint = 'Divide the numerator by the denominator. The quotient is the whole number, and the remainder is the new numerator.'
      explanation = `$${improperNum} \\div ${den} = ${whole}$ with a remainder of $${num}$. The mixed number is $${mixedNumLatex}$.`
    }
    options = new Set([answer, `${whole * num + den}/${den}`, `${improperNum}/${num}`])
  } else if (qType === 'compare') {
    let f1 = new Fraction(rng.int(1, 4), rng.int(5, 10))
    let f2 = new Fraction(rng.int(1, 4), rng.int(5, 10))
    while (f1.equals(f2)) f2 = new Fraction(rng.int(1, 4), rng.int(5, 10))
    question = `Which of the following statements is true?`
    answer = f1.greaterThan(f2) ? `$${getFractionLatexCode(f1)} > ${getFractionLatexCode(f2)}$` : `$${getFractionLatexCode(f1)} < ${getFractionLatexCode(f2)}$`
    hint = 'To compare fractions, you can find a common denominator or convert them to decimals.'
    explanation = `$${getFractionLatexCode(f1)} \\approx ${f1.toNumber().toFixed(3)}$ and $${getFractionLatexCode(f2)} \\approx ${f2.toNumber().toFixed(3)}$. Therefore, the statement '${answer}' is true.`
    options = new Set([
      answer,
      `$${getFractionLatexCode(f1)} = ${getFractionLatexCode(f2)}$`,
      f1.greaterThan(f2) ? `$${getFractionLatexCode(f1)} < ${getFractionLatexCode(f2)}$` : `$${getFractionLatexCode(f1)} > ${getFractionLatexCode(f2)}$`,
    ])
  } else if (qType === 'complex_fraction') {
    const f1 = new Fraction(rng.int(1, 5), rng.int(2, 6))
    const f2 = new Fraction(rng.int(1, 5), rng.int(2, 6))
    question = `Simplify the complex fraction: $\\frac{${getFractionLatexCode(f1)}}{${getFractionLatexCode(f2)}}$`
    answer = formatFractionText(f1.div(f2))
    hint = 'This is simply a division problem. Rewrite the complex fraction as (top fraction) ÷ (bottom fraction).'
    const invertedF2Latex = getFractionLatexCode(new Fraction(Number(f2.denominator), Number(f2.numerator)))
    explanation = `This is equivalent to $${getFractionLatexCode(f1)} \\div ${getFractionLatexCode(f2)}$, which becomes $${getFractionLatexCode(f1)} \\times ${invertedF2Latex} = ${getFractionLatexCode(f1.div(f2))}$.`
    options = new Set([answer, formatFractionText(f1.mul(f2)), formatFractionText(f1.add(f2))])
  }

  return { question, options: finalizeOptions(options, rng, 'fraction'), answer, hint, explanation, difficulty }
}
