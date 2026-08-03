// Engine registry — maps topic slugs to their generator functions.
// This is the single entry point for question generation.

import type { Difficulty, RNG, GeneratedQuestion, ComboQuestion } from './types'
import { generateSetsQuestion } from './topics/sets'
import { generatePercentagesQuestion } from './topics/percentages'
import { generateFractionsQuestion } from './topics/fractions'
import { generateIndicesQuestion } from './topics/indices'
import { generateSurdsQuestion } from './topics/surds'
import { generateBinaryOpsQuestion } from './topics/binaryOperations'
import { generateRelationsFunctionsQuestion } from './topics/relationsFunctions'
import { generateSequenceSeriesQuestion } from './topics/sequenceSeries'
import { generateWordProblemsQuestion } from './topics/wordProblems'
import { generateShapesQuestion } from './topics/shapes'
import { generateAlgebraBasicsQuestion } from './topics/algebraBasics'
import { generateLinearAlgebraQuestion } from './topics/linearAlgebra'
import { generateLogarithmsQuestion } from './topics/logarithms'
import { generateProbabilityQuestion } from './topics/probability'
import { generateBinomialTheoremQuestion } from './topics/binomialTheorem'
import { generatePolynomialFunctionsQuestion } from './topics/polynomialFunctions'
import { generateRationalFunctionsQuestion } from './topics/rationalFunctions'
import { generateTrigonometryQuestion } from './topics/trigonometry'
import { generateVectorsQuestion } from './topics/vectors'
import { generateStatisticsQuestion } from './topics/statistics'
import { generateCoordinateGeometryQuestion } from './topics/coordinateGeometry'
import { generateCalculusQuestion } from './topics/calculus'
import { generateNumberBasesQuestion } from './topics/numberBases'
import { generateModuloArithmeticQuestion } from './topics/moduloArithmetic'
import { generateAdvancedComboQuestion } from './combo'
import { difficultyFor } from './adaptive'
import { createRandomRng } from './rng'
import { getQuestionId } from '../lib/mathFormat'

type TopicGenerator = (difficulty: Difficulty, rng: RNG) => GeneratedQuestion

const registry: Record<string, TopicGenerator> = {
  sets: generateSetsQuestion,
  percentages: generatePercentagesQuestion,
  fractions: generateFractionsQuestion,
  indices: generateIndicesQuestion,
  surds: generateSurdsQuestion,
  binary_operations: generateBinaryOpsQuestion,
  relations_and_functions: generateRelationsFunctionsQuestion,
  sequence_and_series: generateSequenceSeriesQuestion,
  word_problems: generateWordProblemsQuestion,
  shapes: generateShapesQuestion,
  algebra_basics: generateAlgebraBasicsQuestion,
  linear_algebra: generateLinearAlgebraQuestion,
  logarithms: generateLogarithmsQuestion,
  probability: generateProbabilityQuestion,
  binomial_theorem: generateBinomialTheoremQuestion,
  polynomial_functions: generatePolynomialFunctionsQuestion,
  rational_functions: generateRationalFunctionsQuestion,
  trigonometry: generateTrigonometryQuestion,
  vectors: generateVectorsQuestion,
  statistics: generateStatisticsQuestion,
  coordinate_geometry: generateCoordinateGeometryQuestion,
  intro_to_calculus: generateCalculusQuestion,
  number_bases: generateNumberBasesQuestion,
  modulo_arithmetic: generateModuloArithmeticQuestion,
}

export function generateQuestion(topic: string, difficulty: Difficulty, rng?: RNG): GeneratedQuestion | ComboQuestion {
  const r = rng ?? createRandomRng()

  if (topic === 'advanced_combo') {
    return generateAdvancedComboQuestion(r)
  }

  const generator = registry[topic]
  if (!generator) {
    return {
      question: `Questions for **${topic}** are coming soon!`,
      options: ['OK'],
      answer: 'OK',
      hint: 'Under development.',
      explanation: '',
      difficulty
    }
  }

  return generator(difficulty, r)
}

export function generateAdaptiveQuestion(topic: string, skillScore: number, rng?: RNG): GeneratedQuestion | ComboQuestion {
  if (topic === 'advanced_combo') {
    return generateAdvancedComboQuestion(rng ?? createRandomRng())
  }
  const difficulty = difficultyFor(skillScore)
  return generateQuestion(topic, difficulty, rng)
}

export function generateNonRepeatingQuestion(
  topic: string,
  difficulty: Difficulty,
  seenIds: Set<string>,
  rng?: RNG
): GeneratedQuestion | ComboQuestion {
  const r = rng ?? createRandomRng()

  for (let i = 0; i < 10; i++) {
    const q = generateQuestion(topic, difficulty, r)
    const text = (q as ComboQuestion).stem ?? (q as GeneratedQuestion).question ?? ''
    const qId = getQuestionId(text)
    if (!seenIds.has(qId)) {
      return q
    }
  }

  return generateQuestion(topic, difficulty, r)
}

export const AVAILABLE_TOPICS = Object.keys(registry)
