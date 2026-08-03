// Linear algebra question generator — ported from _generate_linear_algebra_question
import type { Difficulty, RNG, GeneratedQuestion } from '../types'
import { finalizeOptions } from '../../lib/mathFormat'

type Mat2 = [[number, number], [number, number]]

function matToLatex(m: Mat2): string {
  return `\\begin{pmatrix} ${m[0][0]} & ${m[0][1]} \\\\ ${m[1][0]} & ${m[1][1]} \\end{pmatrix}`
}

function randMat(rng: RNG): Mat2 {
  return [
    [rng.int(-5, 10), rng.int(-5, 10)],
    [rng.int(-5, 10), rng.int(-5, 10)],
  ]
}

function matAdd(a: Mat2, b: Mat2): Mat2 {
  return [
    [a[0][0] + b[0][0], a[0][1] + b[0][1]],
    [a[1][0] + b[1][0], a[1][1] + b[1][1]],
  ]
}

function matSub(a: Mat2, b: Mat2): Mat2 {
  return [
    [a[0][0] - b[0][0], a[0][1] - b[0][1]],
    [a[1][0] - b[1][0], a[1][1] - b[1][1]],
  ]
}

function matMul(a: Mat2, b: Mat2): Mat2 {
  return [
    [a[0][0] * b[0][0] + a[0][1] * b[1][0], a[0][0] * b[0][1] + a[0][1] * b[1][1]],
    [a[1][0] * b[0][0] + a[1][1] * b[1][0], a[1][0] * b[0][1] + a[1][1] * b[1][1]],
  ]
}

function matDet(a: Mat2): number {
  return a[0][0] * a[1][1] - a[0][1] * a[1][0]
}

function matElemMul(a: Mat2, b: Mat2): Mat2 {
  return [
    [a[0][0] * b[0][0], a[0][1] * b[0][1]],
    [a[1][0] * b[1][0], a[1][1] * b[1][1]],
  ]
}

export function generateLinearAlgebraQuestion(difficulty: Difficulty, rng: RNG): GeneratedQuestion {
  let qType: string
  if (difficulty === 'Easy') {
    qType = rng.pick(['add_sub', 'determinant'])
  } else if (difficulty === 'Medium') {
    qType = 'multiply'
  } else {
    qType = 'inverse'
  }

  let question = '', answer = '', hint = '', explanation = ''
  let options = new Set<string>()
  let matA = randMat(rng)
  let matB = randMat(rng)

  if (qType === 'add_sub') {
    const [op, sym, resMat] = rng.pick<[string, string, Mat2]>([
      ['add', '+', matAdd(matA, matB)],
      ['subtract', '-', matSub(matA, matB)],
    ])
    question = `Given matrices $A = ${matToLatex(matA)}$ and $B = ${matToLatex(matB)}$, find $A ${sym} B$.`
    answer = `$${matToLatex(resMat)}$`
    hint = `To ${op} matrices, simply ${op} their corresponding elements in each position.`
    explanation = `You perform the operation on the element in each position. For example, the top-left element is calculated as: $${matA[0][0]} ${sym} ${matB[0][0]} = ${resMat[0][0]}$.`
    options = new Set([answer, `$${matToLatex(matMul(matA, matB))}$`, `$${matToLatex(matElemMul(matA, matB))}$`])
  } else if (qType === 'determinant') {
    question = `Find the determinant of matrix $A = ${matToLatex(matA)}$.`
    const det = matDet(matA)
    answer = String(det)
    hint = `For a 2x2 matrix $\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}$, the determinant is calculated as $ad - bc$.`
    explanation = `Determinant = $(a \\times d) - (b \\times c) = (${matA[0][0]} \\times ${matA[1][1]}) - (${matA[0][1]} \\times ${matA[1][0]}) = ${answer}$.`
    options = new Set([answer, String(matA[0][0] + matA[1][1]), String(matA[0][0] * matA[0][1] - matA[1][0] * matA[1][1])])
  } else if (qType === 'multiply') {
    question = `Find the product $AB$ for the matrices $A = ${matToLatex(matA)}$ and $B = ${matToLatex(matB)}$.`
    const resMat = matMul(matA, matB)
    answer = `$${matToLatex(resMat)}$`
    hint = "Matrix multiplication is 'row-by-column'. Multiply the elements of each row of the first matrix by the elements of each column of the second matrix and sum the results."
    explanation = `The top-left element of the result is (row 1 of A) ⋅ (col 1 of B) = $(${matA[0][0]} \\times ${matB[0][0]}) + (${matA[0][1]} \\times ${matB[1][0]}) = ${resMat[0][0]}$.`
    options = new Set([answer, `$${matToLatex(matAdd(matA, matB))}$`, `$${matToLatex(matMul(matB, matA))}$`])
  } else if (qType === 'inverse') {
    let det = matDet(matA)
    while (det === 0) {
      matA = randMat(rng)
      det = matDet(matA)
    }
    question = `Find the inverse of the matrix $A = ${matToLatex(matA)}$.`
    const adjMat: Mat2 = [[matA[1][1], -matA[0][1]], [-matA[1][0], matA[0][0]]]
    answer = `$\\frac{1}{${det}}${matToLatex(adjMat)}$`
    hint = `The inverse is $\\frac{1}{\\det(A)} \\times \\text{adj}(A)$, where the adjugate matrix is found by swapping a and d, and negating b and c.`
    explanation = `1. First, find the determinant: $\\det(A) = ${det}$.\n\n2. Next, find the adjugate matrix: swap the main diagonal elements and negate the others to get $${matToLatex(adjMat)}$.\n\n3. The inverse is $\\frac{1}{\\text{determinant}} \\times \\text{adjugate}$, which is ${answer}.`
    options = new Set([answer, `$${matToLatex(adjMat)}$`, `$\\frac{1}{${-det}}${matToLatex(adjMat)}$`])
  }

  return { question, options: finalizeOptions(options, rng), answer, hint, explanation, difficulty }
}
