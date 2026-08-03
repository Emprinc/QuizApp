// Logarithms question generator — ported from _generate_logarithms_question
import type { Difficulty, RNG, GeneratedQuestion } from '../types'
import { finalizeOptions } from '../../lib/mathFormat'

export function generateLogarithmsQuestion(difficulty: Difficulty, rng: RNG): GeneratedQuestion {
  let qType: string
  if (difficulty === 'Easy') {
    qType = rng.pick(['conversion', 'solve_simple_base', 'evaluate_power'])
  } else if (difficulty === 'Medium') {
    qType = rng.pick(['variable_laws', 'evaluate_combined'])
  } else {
    qType = rng.pick(['solve_combine', 'log_quadratic', 'log_simultaneous'])
  }

  let question = '', answer = '', hint = '', explanation = ''
  let options = new Set<string>()

  if (qType === 'conversion') {
    const base = rng.pick([3, 4, 5, 'b', 'x'])
    const exponent = rng.int(2, 4)
    let resultNum: number | string
    if (base === 'b' || base === 'x') {
      const varBase = base
      const resultSym = rng.next() > 0.5 ? 'R' : String(rng.int(10, 50))
      resultNum = resultSym
      const formA = `$${varBase}^{${exponent}} = ${resultSym}$`
      const formB = `$\\log_{${varBase}}(${resultSym}) = ${exponent}$`
      const questionType = rng.pick(['logarithmic', 'exponential'])
      question = questionType === 'logarithmic'
        ? `Express the equation ${formA} in ${questionType} form.`
        : `Express the equation ${formB} in ${questionType} form.`
      answer = questionType === 'logarithmic' ? formB : formA
    } else {
      const numBase = base as number
      const result = numBase ** exponent
      resultNum = result
      const formA = `$${numBase}^{${exponent}} = ${result}$`
      const formB = `$\\log_{${numBase}}(${result}) = ${exponent}$`
      const questionType = rng.pick(['logarithmic', 'exponential'])
      question = questionType === 'logarithmic'
        ? `Express the equation ${formA} in ${questionType} form.`
        : `Express the equation ${formB} in ${questionType} form.`
      answer = questionType === 'logarithmic' ? formB : formA
    }
    hint = 'Remember the relationship: $\\log_b N = x \\iff b^x = N$.'
    explanation = 'The base of the logarithm becomes the base of the power, and the result of the power becomes the argument of the log.'
    options = new Set([answer, `$\\log_{${exponent}}(${resultNum}) = ${base}$`])
  } else if (qType === 'solve_simple_base') {
    const base = rng.int(2, 4)
    const exponent = rng.int(2, 4)
    const result = base ** exponent
    const solveFor = rng.pick(['x', 'Base'])
    if (solveFor === 'x') {
      question = `Solve for x: $\\log_{${base}}(x) = ${exponent}$`
      answer = String(result)
    } else {
      question = `Find the value of the base $x$: $\\log_x(${result}) = ${exponent}$`
      answer = String(base)
    }
    hint = 'Convert the logarithmic equation to its equivalent exponential form to solve.'
    explanation = `Using $x^n = R$, we have $x^{${exponent}} = ${result}$. Solving for $x$ gives **${answer}**.`
    options = new Set([answer, String(result), String(exponent)])
  } else if (qType === 'evaluate_power') {
    const base = rng.pick([2, 3])
    const power = rng.int(2, 4)
    const n = rng.int(2, 4)
    const arg = base ** n
    question = `Evaluate: $\\log_{${base}}(${arg}^{${power}})$`
    answer = String(n * power)
    hint = 'Use the Power Law: $\\log_b x^n = n \\log_b x$. Remember that $\\log_b b = 1$.'
    explanation = `1. Apply Power Law: $\\log_{${base}}(${arg}^{${power}}) = ${power} \\log_{${base}}(${arg})$.\n2. Since ${arg} = ${base}^{${n}}, we have ${power} \\log_{${base}}(${base}^{${n}}) = ${power} \\times ${n} = ${n * power}.`
    options = new Set([answer, String(n + power), String(n)])
  } else if (qType === 'variable_laws') {
    const [op, sym, resArg, ruleName] = rng.pick<[string, string, string, string]>([
      ['add', '+', 'xy', 'Product Rule'],
      ['subtract', '-', '\\frac{x}{y}', 'Quotient Rule'],
    ])
    question = `Use the laws of logarithms to simplify the expression: $\\log_b x ${sym} \\log_b y$`
    answer = `$\\log_b(${resArg})$`
    hint = `Recall the ${ruleName} for logarithms: $\\log_b A ${sym} \\log_b B = \\log_b(A ${op === 'add' ? ' \\times' : ' \\div'} B)$.`
    explanation = `Using the ${ruleName}, the expression simplifies directly to ${answer}.`
    options = new Set([answer, `$\\log_b(x ${sym} y)$`, '$\\log_b(x + y)$'])
  } else if (qType === 'evaluate_combined') {
    const base1 = rng.pick([2, 3, 5])
    const base2Exp = rng.int(2, 4)
    const base2 = base1 ** base2Exp
    question = `Evaluate the expression: $\\frac{\\log_{10}(${base2})}{\\log_{10}(${base1})}$`
    answer = String(base2Exp)
    hint = 'Use the Change of Base formula: $\\frac{\\log_a b}{\\log_a c} = \\log_c b$. Then evaluate the resulting log.'
    explanation = `1. Apply the Change of Base formula: $\\frac{\\log_{10}(${base2})}{\\log_{10}(${base1})} = \\log_{${base1}}(${base2})$.\n2. Since ${base1}^{${base2Exp}} = ${base2}, the value of $\\log_{${base1}}(${base2})$ is **${base2Exp}**.`
    options = new Set([answer, String(base2 / base1), String(base2 - base1)])
  } else if (qType === 'solve_combine') {
    const xVal = rng.int(3, 8)
    const b = rng.int(1, xVal - 1)
    const result = xVal * (xVal - b)
    question = `Solve for x: $\\log(x) + \\log(x - ${b}) = \\log(${result})$`
    answer = String(xVal)
    hint = 'First, use the product rule to combine the logarithms on the left side into a single logarithm.'
    explanation =
      `1. Combine the logs on the left: $\\log(x(x-${b})) = \\log(${result})$.\n\n` +
      `2. Since the logs (with the same base) are equal, their arguments must be equal: $x^2 - ${b}x = ${result}$.\n\n` +
      `3. Rearrange into a quadratic equation: $x^2 - ${b}x - ${result} = 0$.\n\n` +
      `4. Factor the quadratic: $(x - ${xVal})(x + ${xVal - b}) = 0$.\n\n` +
      `5. The possible solutions are $x=${xVal}$ and $x=${-(xVal - b)}$. Since the logarithm of a negative number is undefined in this context, the only valid solution is $x=${xVal}$.`
    options = new Set([answer, String(-(xVal - b)), String(result + b)])
  } else if (qType === 'log_quadratic') {
    const base = rng.pick([2, 3, 5])
    let y1Val = rng.int(1, 3)
    let y2Val = rng.int(1, 3)
    while (y1Val === y2Val) y2Val = rng.int(1, 3)
    const B = y1Val + y2Val
    const C = y1Val * y2Val
    const x1Val = base ** y1Val
    const x2Val = base ** y2Val
    question = `Solve for x: $(\\log_{${base}}x)^2 - ${B}(\\log_{${base}}x) + ${C} = 0$`
    answer = `x = ${x1Val} or x = ${x2Val}`
    hint = `Let $y = \\log_{${base}}x$. The equation becomes a quadratic: $y^2 - ${B}y + ${C} = 0$. Solve for $y$ first.`
    explanation =
      `1. Let $y = \\log_{${base}}x$. The quadratic equation is $y^2 - ${B}y + ${C} = 0$.\n` +
      `2. Factorizing gives $(y - ${y1Val})(y - ${y2Val}) = 0$, so $y = ${y1Val}$ or $y = ${y2Val}$.\n` +
      `3. Substituting back: $x = ${base}^{${y1Val}} = ${x1Val}$ and $x = ${base}^{${y2Val}} = ${x2Val}$.\n` +
      `4. The solutions are **x = ${x1Val} or x = ${x2Val}**.`
    options = new Set([answer, `x = ${y1Val} or x = ${y2Val}`, String(x1Val + x2Val), String(x1Val)])
  } else if (qType === 'log_simultaneous') {
    const xExp = rng.int(2, 4)
    const yExp = rng.int(1, 3)
    const base = rng.pick([2, 3])
    const sumLogResultExp = xExp + yExp
    const diffLogResultExp = xExp - yExp
    const sumLogVal = base ** sumLogResultExp
    const diffLogVal = base ** diffLogResultExp
    const finalX = base ** xExp
    const finalY = base ** yExp
    question = `Solve for $x$ and $y$ that satisfy the system of equations (all to base ${base}):\n\n**(1)** $\\log x + \\log y = \\log (${sumLogVal})$\n\n**(2)** $\\log x - \\log y = \\log (${diffLogVal})$`
    answer = `x = ${finalX}, y = ${finalY}`
    hint = 'Use the laws of logarithms (Product and Quotient rules) to convert the equations into a system of linear simultaneous equations for $\\log x$ and $\\log y$. Then solve.'
    explanation =
      `1. Simplify (1) using the Product Rule: $\\log(xy) = \\log(${sumLogVal}) \\implies xy = ${sumLogVal}$.\n` +
      `2. Simplify (2) using the Quotient Rule: $\\log(\\frac{x}{y}) = \\log(${diffLogVal}) \\implies \\frac{x}{y} = ${diffLogVal}$.\n` +
      `3. Solving the simultaneous equations gives the solutions: $x=${finalX}$ and $y=${finalY}$.`
    options = new Set([answer, `x = ${finalY}, y = ${finalX}`, `x = ${sumLogVal}, y = ${diffLogVal}`])
  }

  return { question, options: finalizeOptions(options, rng), answer, hint, explanation, difficulty }
}
