// Relations and functions question generator — ported from _generate_relations_functions_question
import type { Difficulty, RNG, GeneratedQuestion } from '../types'
import { Fraction } from '../../lib/fraction'
import { getFractionLatexCode, formatFractionText, finalizeOptions } from '../../lib/mathFormat'

export function generateRelationsFunctionsQuestion(difficulty: Difficulty, rng: RNG): GeneratedQuestion {
  let qType: string
  if (difficulty === 'Easy') {
    qType = rng.pick(['domain_range', 'evaluate_function', 'identify_relation_type'])
  } else if (difficulty === 'Medium') {
    qType = rng.pick(['composite_function', 'inverse_function', 'function_notation'])
  } else {
    qType = rng.pick(['piecewise', 'quadratic_function', 'function_composition_hard'])
  }

  let question = '', answer = '', hint = '', explanation = ''
  let options = new Set<string>()

  if (qType === 'domain_range') {
    const [funcType, funcExpr] = rng.pick<[string, string]>([
      ['linear', 'f(x) = 2x + 3'],
      ['quadratic', 'f(x) = x^2'],
      ['reciprocal', 'f(x) = \\frac{1}{x}'],
    ])
    question = `Find the domain of the function $${funcExpr}$.`
    if (funcType === 'linear') {
      answer = 'All real numbers ($\\mathbb{R}$)'
      hint = 'A linear function has no restrictions on its input.'
      explanation = `The function $${funcExpr}$ is linear, so there are no values of $x$ that make it undefined. The domain is all real numbers.`
    } else if (funcType === 'quadratic') {
      answer = 'All real numbers ($\\mathbb{R}$)'
      hint = 'A polynomial function has no restrictions on its input.'
      explanation = `The function $${funcExpr}$ is a polynomial, so there are no values of $x$ that make it undefined. The domain is all real numbers.`
    } else {
      answer = '$x \\neq 0$'
      hint = 'Look for values of x that would make the denominator zero.'
      explanation = `The function $${funcExpr}$ is undefined when $x = 0$ (division by zero). So the domain is all real numbers except 0.`
    }
    options = new Set([answer, '$x > 0$', '$x \\geq 0$', '$x \\neq 1$'])
  } else if (qType === 'evaluate_function') {
    const a = rng.int(1, 5)
    const b = rng.int(1, 5)
    const x = rng.int(-5, 5)
    question = `If $f(x) = ${a}x + ${b}$, find $f(${x})$.`
    answer = String(a * x + b)
    hint = 'Substitute the given value of x into the function.'
    explanation = `$f(${x}) = ${a}(${x}) + ${b} = ${a * x} + ${b} = ${a * x + b}$.`
    options = new Set([answer, String(a * x - b), String(a + b * x)])
  } else if (qType === 'identify_relation_type') {
    const [relType, relExpr] = rng.pick<[string, string]>([
      ['one-to-one', 'f(x) = 2x + 1'],
      ['many-to-one', 'f(x) = x^2'],
      ['one-to-many', 'x = y^2'],
    ])
    question = `What type of relation is $${relExpr}$?`
    answer = relType
    hint = 'Check if each input maps to exactly one output (function) and how inputs/outputs relate.'
    explanation = `The relation $${relExpr}$ is ${relType}.`
    options = new Set([answer, 'one-to-many', 'many-to-one', 'one-to-one'].filter((x) => x !== relType))
  } else if (qType === 'composite_function') {
    const a = rng.int(1, 5)
    const b = rng.int(1, 5)
    const c = rng.int(1, 5)
    const d = rng.int(1, 5)
    question = `If $f(x) = ${a}x + ${b}$ and $g(x) = ${c}x + ${d}$, find $fg(x)$ (the composite function).`
    const newCoeff = a * c
    const newConst = a * d + b
    answer = `$${newCoeff}x + ${newConst}$`
    hint = 'Substitute g(x) into f(x): f(g(x)).'
    explanation = `$fg(x) = f(g(x)) = f(${c}x + ${d}) = ${a}(${c}x + ${d}) + ${b} = ${a * c}x + ${a * d} + ${b} = ${newCoeff}x + ${newConst}$.`
    options = new Set([answer, `$${a + c}x + ${b + d}$`, `$${a * c}x + ${b * d}$`])
  } else if (qType === 'inverse_function') {
    const a = rng.int(2, 6)
    const b = rng.int(1, 10)
    question = `Find the inverse of the function $f(x) = ${a}x - ${b}$.`
    const invCoeff = new Fraction(1, a)
    const invConst = new Fraction(b, a)
    answer = `$f^{-1}(x) = \\frac{x + ${b}}{${a}}$`
    hint = 'Replace f(x) with y, swap x and y, then solve for y.'
    explanation = `Let $y = ${a}x - ${b}$. Swap: $x = ${a}y - ${b}$. Solve: $x + ${b} = ${a}y$, so $y = \\frac{x + ${b}}{${a}}$.`
    options = new Set([answer, `$f^{-1}(x) = \\frac{x - ${b}}{${a}}$`, `$f^{-1}(x) = ${a}x + ${b}$`])
  } else if (qType === 'function_notation') {
    const a = rng.int(2, 6)
    const b = rng.int(1, 10)
    const x1 = rng.int(1, 5)
    const x2 = rng.int(1, 5)
    question = `If $f(x) = ${a}x + ${b}$, find the value of $f(${x1}) - f(${x2})$.`
    answer = String(a * (x1 - x2))
    hint = 'Evaluate f at each value separately, then subtract.'
    explanation = `$f(${x1}) = ${a * x1 + b}$ and $f(${x2}) = ${a * x2 + b}$. $f(${x1}) - f(${x2}) = ${a * x1 + b} - ${a * x2 + b} = ${a * (x1 - x2)}$.`
    options = new Set([answer, String(a * (x1 + x2)), String(a * x1 + b - a * x2)])
  } else if (qType === 'piecewise') {
    const a = rng.int(1, 5)
    const b = rng.int(1, 5)
    const c = rng.int(2, 6)
    const x = rng.int(1, 5)
    question = `A function is defined as $f(x) = \\begin{cases} ${a}x + ${b} & \\text{if } x \\geq 0 \\\\ ${c}x & \\text{if } x < 0 \\end{cases}$. Find $f(${x})$.`
    answer = String(a * x + b)
    hint = 'Determine which piece of the function applies based on the value of x.'
    explanation = `Since $${x} \\geq 0$, we use the first piece: $f(${x}) = ${a}(${x}) + ${b} = ${a * x + b}$.`
    options = new Set([answer, String(c * x), String(a * x)])
  } else if (qType === 'quadratic_function') {
    const a = rng.int(1, 3)
    const b = rng.int(-5, 5)
    const c = rng.int(-5, 5)
    question = `Find the vertex of the parabola $f(x) = ${a}x^2 + ${b}x + ${c}$.`
    const h = new Fraction(-b, 2 * a)
    const k = a * h.toNumber() * h.toNumber() + b * h.toNumber() + c
    answer = `($${formatFractionText(h)}$, ${k.toFixed(2)})`
    hint = 'Use the formula $x = -\\frac{b}{2a}$ to find the x-coordinate, then substitute to find y.'
    explanation = `$x = -\\frac{${b}}{2(${a})} = ${formatFractionText(h)}$. Substituting: $f(${formatFractionText(h)}) = ${k.toFixed(2)}$. The vertex is $(${formatFractionText(h)}, ${k.toFixed(2)})$.`
    options = new Set([answer, `($${formatFractionText(h)}$, ${(-k).toFixed(2)})`, `($${(2 * Number(h.numerator) / Number(h.denominator)).toFixed(2)}$, ${k.toFixed(2)})`])
  } else if (qType === 'function_composition_hard') {
    const a = rng.int(2, 5)
    const b = rng.int(1, 5)
    const c = rng.int(2, 5)
    question = `If $f(x) = x^2 + ${a}$ and $g(x) = ${b}x - ${c}$, find $gf(x)$.`
    const coeff = b * b
    const linCoeff = -2 * b * c
    const const1 = a + c * c
    answer = `$${coeff}x^2 ${linCoeff >= 0 ? '+' : '-'} ${Math.abs(linCoeff)}x ${const1 >= 0 ? '+' : '-'} ${Math.abs(const1)}$`
    hint = 'Substitute f(x) into g: g(f(x)) = g(x^2 + a).'
    explanation = `$gf(x) = g(f(x)) = g(x^2 + ${a}) = ${b}(x^2 + ${a}) - ${c} = ${b}x^2 + ${a * b} - ${c}$.`
    options = new Set([answer, `$${b}x^2 + ${a} - ${c}$`, `$${coeff}x^2 + ${const1}$`])
  }

  return { question, options: finalizeOptions(options, rng), answer, hint, explanation, difficulty }
}
