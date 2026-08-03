// Sets question generator — ported from _generate_sets_question
import type { Difficulty, RNG, GeneratedQuestion } from '../types'
import { Fraction } from '../../lib/fraction'
import { getFractionLatexCode, formatFractionText, finalizeOptions } from '../../lib/mathFormat'

export function generateSetsQuestion(difficulty: Difficulty, rng: RNG): GeneratedQuestion {
  let qType: string
  if (difficulty === 'Easy') {
    qType = rng.pick(['notation_cardinality', 'basic_ops', 'total_subsets'])
  } else if (difficulty === 'Medium') {
    qType = rng.pick(['complement_difference', 'proper_subsets', 'venn_two', 'symmetric_difference'])
  } else {
    qType = rng.pick(['set_laws', 'venn_three', 'power_sets', 'sets_probability'])
  }

  let question = '', answer = '', hint = '', explanation = ''
  let options = new Set<string>()
  const universalSet = new Set<number>(Array.from({ length: 20 }, (_, i) => i + 1))

  if (qType === 'notation_cardinality') {
    const setA = new Set(rng.sample(Array.from({ length: 29 }, (_, i) => i + 1), rng.int(4, 7)))
    const phrasings = [
      `What is the cardinality of the set $A = {setStr(setA)}$?`,
      `For the set $A = {setStr(setA)}$, find $n(A)$.`,
      `How many distinct elements are in the set $A = {setStr(setA)}$?`
    ]
    question = rng.pick(phrasings)
    answer = String(setA.size)
    hint = 'The cardinality of a set, denoted n(A) or |A|, is the number of elements in the set.'
    explanation = `To find the cardinality, we count the number of distinct elements in the set A. The set has **${answer}** elements.`
    options = new Set([answer, String(setA.size + 1), String(setA.size - 1), String([...setA].reduce((a, b) => a + b, 0))])
  } else if (qType === 'basic_ops') {
    const setA = new Set(rng.sample(Array.from({ length: 14 }, (_, i) => i + 1), rng.int(3, 5)))
    const setB = new Set(rng.sample(Array.from({ length: 14 }, (_, i) => i + 1), rng.int(3, 5)))
    const [op, sym] = rng.pick([['union', '\\cup'], ['intersection', '\\cap']] as const)
    question = `Given $A = {setStr(setA)}$ and $B = {setStr(setB)}$, find $A ${sym} B$.`
    const res = op === 'union' ? new Set([...setA, ...setB]) : new Set([...setA].filter(x => setB.has(x)))
    answer = res.size > 0 ? setStr(res) : '$\\emptyset$'
    hint = 'Union (∪) means \'all elements combined\'. Intersection (∩) means \'only elements in common\'.'
    explanation = `The ${op} of sets A and B results in the set **${answer}**.`
    options = new Set([answer, setStr(new Set([...setA].filter(x => !setB.has(x)))), setStr(new Set([...setB].filter(x => !setA.has(x))))])
  } else if (qType === 'total_subsets') {
    const numElements = rng.int(3, 6)
    const s = new Set(rng.sample(Array.from({ length: 99 }, (_, i) => i + 1), numElements))
    question = `How many subsets can be formed from the set $S = {setStr(s)}$?`
    answer = String(2 ** numElements)
    hint = 'The formula for the total number of subsets of a set with \'n\' elements is $2^n$.'
    explanation = `The set has ${numElements} elements. The total number of subsets is $2^{${numElements}} = ${answer}$.`
    options = new Set([answer, String(2 ** numElements - 1), String(numElements ** 2)])
  } else if (qType === 'complement_difference') {
    const setA = new Set(rng.sample(Array.from({ length: 19 }, (_, i) => i + 1), rng.int(5, 8)))
    const setB = new Set(rng.sample(Array.from({ length: 19 }, (_, i) => i + 1), rng.int(5, 8)))
    const op = rng.pick(['complement', 'difference'])
    if (op === 'complement') {
      question = `Given the universal set $\\mathcal{U} = \\{1, 2, ..., 20\\}$ and $A = ${setStr(setA)}$, find the complement, $A'$.`
      const res = new Set([...universalSet].filter(x => !setA.has(x)))
      answer = res.size > 0 ? setStr(res) : '$\\emptyset$'
      hint = 'The complement contains all elements in the universal set that are NOT in set A.'
      explanation = `$A' = \\mathcal{U} - A = ${answer}$.`
      options = new Set([answer, setStr(setA), setStr(universalSet)])
    } else {
      question = `Given $A = ${setStr(setA)}$ and $B = ${setStr(setB)}$, find the set difference $A - B$.`
      const res = new Set([...setA].filter(x => !setB.has(x)))
      answer = res.size > 0 ? setStr(res) : '$\\emptyset$'
      hint = 'The difference A - B contains all elements that are in A but NOT in B.'
      explanation = `We take all the elements of set A and remove any that also appear in set B. The result is ${answer}.`
      options = new Set([answer, setStr(new Set([...setB].filter(x => !setA.has(x)))), setStr(new Set([...setA].filter(x => setB.has(x))))])
    }
  } else if (qType === 'proper_subsets') {
    const numElements = rng.int(3, 6)
    const s = new Set(rng.sample(Array.from({ length: 99 }, (_, i) => i + 1), numElements))
    question = `How many **proper** subsets does the set $S = ${setStr(s)}$ have?`
    answer = String(2 ** numElements - 1)
    hint = 'The number of proper subsets is one less than the total number of subsets ($2^n - 1$).'
    explanation = `The total number of subsets is $2^{${numElements}} = ${2 ** numElements}$. A proper subset is any subset except the set itself, so we subtract 1, giving **${answer}**.`
    options = new Set([answer, String(2 ** numElements), String(numElements - 1)])
  } else if (qType === 'venn_two') {
    const total = rng.int(80, 120)
    const aVal = rng.int(30, 50)
    const bVal = rng.int(30, 50)
    const both = rng.int(10, 25)
    const union = aVal + bVal - both
    const neither = total - union
    if (neither < 0) return generateSetsQuestion(difficulty, rng)

    const studentNames = ['Joana', 'Happy', 'Doris', 'Gladys', 'Grace', 'Wassado', 'Jemima', 'Clementina', 'Bertha', 'Delight', 'Ampofo', 'Julia', 'Albert', 'Confidence', 'David', 'Edmond', 'Nuzrat', 'Rawlings', 'Georgina', 'Isaac', 'Korbey', 'Wisdom', 'Stephen', 'Nnyibi', 'Martin', 'Yussif', 'Awake', 'Ferguson', 'Bernice', 'Lazarus', 'Agbey', 'Emic', 'Melody', 'Christable', 'Benedicta', 'Irene']
    const localSchools = ['Ho Mawuli', 'Mawuko Girls', 'Prang SHS', 'Sunyani SHS', 'Keta SHTS', 'Jinijini SHS', 'Krachi SHS', 'Ola Girls', 'Kajaji SHS', 'Bassa Community SHS', 'Kwame Danso SHS', 'Atebubu SHS']
    const [student1, student2] = rng.sample(studentNames, 2)
    const [school1, school2] = rng.sample(localSchools, 2)

    const contexts = [
      [`like ${student1}'s favourite food, Waakye`, `like ${student2}'s favourite, Jollof rice`, 'customers', 'at a chop bar in Kojokrom'],
      ['play football', 'play volleyball', 'students', `at ${school1}`],
      ['speak Twi', 'speak Bono', 'traders', 'at the Kajaji Market'],
      ['passed Elective Maths', 'passed Core Maths', 'WASSCE candidates', 'at a learning center in the Bono East Region'],
      ['study Chemistry', 'study Physics', 'SHS students', `in ${school2}`],
      ['use Instagram', 'use TikTok', 'teenagers', 'in a focus group in Atebubu'],
      ['eat Banku', 'eat Kenkey', 'patrons', 'at a restaurant in Kwame Danso'],
      ['listen to Afrobeats', 'listen to Highlife music', 'music fans', 'at a local festival'],
      ['use MTN', 'use Vodafone', 'mobile phone users', 'in a small town near Kajaji'],
      ['take a Trotro', 'take an Uber', 'commuters', 'in Kumasi'],
      ['own a cat', 'own a dog', 'pet owners', 'in a neighborhood in Accra'],
      ['watch Ghanaian movies', 'watch Nigerian movies', 'viewers', 'surveyed last month'],
      ['shop at Melcom', 'shop at Shoprite', 'customers', 'at the mall'],
      [`support ${student1}'s team, Asante Kotoko`, `support ${student2}'s team, Hearts of Oak`, 'football fans', 'in a survey']
    ]
    const [itemA, itemB, group, context] = rng.pick(contexts)

    const [phrasing, unknown] = rng.pick([
      [`Of ${total} ${group} ${context}, ${aVal} ${itemA} and ${bVal} ${itemB}. If ${both} do both, how many do neither?`, 'neither'],
      [`Of ${total} ${group} ${context}, ${aVal} ${itemA} and ${bVal} ${itemB}. If ${neither} do neither, how many do both?`, 'both']
    ] as const)

    question = phrasing
    answer = String(unknown === 'neither' ? neither : both)
    hint = 'Use the formula $n(Total) = n(A) + n(B) - n(A \\cap B) + n(Neither)$ or draw a Venn diagram.'
    explanation = `We have $n(A) = ${aVal}$, $n(B) = ${bVal}$, and $n(A \\cap B) = ${both}$.\nThe number who are in at least one set is $n(A \\cup B) = n(A) + n(B) - n(A \\cap B) = ${aVal} + ${bVal} - ${both} = ${union}$.\nThe number in neither set is $n(Total) - n(A \\cup B) = ${total} - ${union} = ${neither}$.`

    const aOnly = aVal - both
    const bOnly = bVal - both
    return { question, options: [String(neither), String(both), String(aOnly), String(bOnly)], answer, hint, explanation, difficulty }
  } else if (qType === 'symmetric_difference') {
    const setA = new Set(rng.sample(Array.from({ length: 19 }, (_, i) => i + 1), rng.int(4, 6)))
    const setB = new Set(rng.sample(Array.from({ length: 19 }, (_, i) => i + 1), rng.int(4, 6)))
    question = `Given $A = ${setStr(setA)}$ and $B = ${setStr(setB)}$, find the symmetric difference $A \\Delta B$.`
    const res = new Set([...setA, ...setB].filter(x => setA.has(x) !== setB.has(x)))
    answer = res.size > 0 ? setStr(res) : '$\\emptyset$'
    hint = 'Symmetric difference contains elements in A or in B, but NOT in both. It can be calculated as $(A \\cup B) - (A \\cap B)$.'
    explanation = `The union is $A \\cup B = ${setStr(new Set([...setA, ...setB]))}$.\nThe intersection is $A \\cap B = ${setStr(new Set([...setA].filter(x => setB.has(x))))}$.\nThe difference between these two sets is **${answer}**.`
    options = new Set([answer, setStr(new Set([...setA, ...setB])), setStr(new Set([...setA].filter(x => setB.has(x)))), setStr(new Set([...setA].filter(x => !setB.has(x))))])
  } else if (qType === 'set_laws') {
    const [law, ans] = rng.pick([
      ["De Morgan's Law states that $(A \\cup B)'$ is equivalent to:", "$A' \\cap B'$"],
      ['The Distributive Law states that $A \\cap (B \\cup C)$ is equivalent to:', '$(A \\cap B) \\cup (A \\cap C)$'],
      ['The Complement Law states that $A \\cup A\'$ is equal to:', '$\\mathcal{U}$ (the universal set)'],
      ['The Associative Law states that $(A \\cup B) \\cup C$ is equivalent to:', '$A \\cup (B \\cup C)$']
    ] as const)
    question = law
    hint = 'Recall the fundamental laws governing set operations.'
    explanation = `This is a direct application of the standard laws of the algebra of sets. The correct identity is **${ans}**.`
    if (law.includes('De Morgan')) options = new Set(["$A' \\cap B'$", "$A' \\cup B'$", '$A \\cap B$'])
    else if (law.includes('Distributive')) options = new Set(['$(A \\cap B) \\cup (A \\cap C)$', '$(A \\cup B) \\cap (A \\cup C)$', '$A \\cup (B \\cap C)$'])
    else options = new Set(['$\\mathcal{U}$ (the universal set)', '$\\emptyset$', 'A'])
    answer = ans
  } else if (qType === 'venn_three') {
    const regions = Array.from({ length: 7 }, () => rng.int(5, 15))
    const [r1, r2, r3, r12, r23, r13, r123] = regions

    const totalA = r1 + r12 + r13 + r123
    const totalB = r2 + r12 + r23 + r123
    const totalC = r3 + r13 + r23 + r123

    const [askedFor, answerVal] = rng.pick([
      ['liked **only** Maths', r1],
      ['liked **only** Science', r2],
      ['liked **only** English', r3]
    ] as const)

    question = `A survey of students at a school found the following:\n- ${totalA} liked Maths\n- ${totalB} liked Science\n- ${totalC} liked English\n- ${r12 + r123} liked Maths and Science\n- ${r13 + r123} liked Maths and English\n- ${r23 + r123} liked Science and English\n- ${r123} liked all three.\n\nHow many students ${askedFor}?`
    answer = String(answerVal)
    hint = 'Draw a three-circle Venn diagram. Start by filling in the center region (all three items) and work your way outwards by subtracting.'
    explanation = `1. Start with the intersection of all three: $${r123}$.\n2. Find the 'two-item only' regions by subtracting the center.\n3. Finally, find the 'only' regions by subtracting all other overlaps from the total for that item.`
    options = new Set([String(r1), String(r2), String(r3), String(r12), String(r13), String(r23), String(r123)])
    return { question, options: finalizeOptions(options, rng, 'set_str'), answer, hint, explanation, difficulty }
  } else if (qType === 'power_sets') {
    const sElements = rng.sample(Array.from({ length: 9 }, (_, i) => i + 1), 3).sort((a, b) => a - b)
    const s = new Set(sElements)
    answer = `$\\{\\emptyset, \\{${sElements[0]}\\}, \\{${sElements[1]}\\}, \\{${sElements[2]}\\}, \\{${sElements[0]}, ${sElements[1]}\\}, \\{${sElements[0]}, ${sElements[2]}\\}, \\{${sElements[1]}, ${sElements[2]}\\}, \\{${sElements[0]}, ${sElements[1]}, ${sElements[2]}\\}\\}$`
    question = `What is the Power Set, $\\mathcal{P}(S)$, of the set $S = ${setStr(s)}$?`
    hint = 'The Power Set is the set of all possible subsets of S, including the empty set and the set S itself.'
    explanation = `A set with 3 elements has $2^3 = 8$ subsets. We must list all of them, from the empty set to the full set, to form the Power Set. The correct listing is **${answer}**.`
    options = new Set([answer, `$${2 ** s.size}$`, `$\\{\\{${sElements[0]}\\}, \\{${sElements[1]}\\}, \\{${sElements[2]}\\}\\}$`])
  } else if (qType === 'sets_probability') {
    const total = 100
    const a = rng.int(30, 50)
    const b = rng.int(20, 40)
    const intersection = rng.int(10, 20)
    const probA = new Fraction(a, total)
    const probB = new Fraction(b, total)
    const probIntersect = new Fraction(intersection, total)
    const probUnion = probA.add(probB).sub(probIntersect)
    question = `In a group of students, the probability that a student speaks Twi is $${probA.numerator}/${probA.denominator}$ and the probability that a student speaks Ga is $${probB.numerator}/${probB.denominator}$. If the probability that a student speaks both is $${probIntersect.numerator}/${probIntersect.denominator}$, what is the probability that a student speaks either Twi or Ga?`
    answer = `$${getFractionLatexCode(probUnion)}$`
    hint = 'Use the formula for the probability of the union of two events: $P(A \\cup B) = P(A) + P(B) - P(A \\cap B)$.'
    explanation = `Let T be the event of speaking Twi and G be the event of speaking Ga.\n$P(T \\cup G) = P(T) + P(G) - P(T \\cap G)$\n$P(T \\cup G) = ${getFractionLatexCode(probA)} + ${getFractionLatexCode(probB)} - ${getFractionLatexCode(probIntersect)} = ${getFractionLatexCode(probUnion)}$.`
    options = new Set([answer, `$${getFractionLatexCode(probA.add(probB))}$`, `$${getFractionLatexCode(probIntersect)}$`])
  }

  return { question, options: finalizeOptions(options, rng, 'set_str'), answer, hint, explanation, difficulty }
}

function setStr(s: Set<number>): string {
  const arr = [...s].sort((a, b) => a - b)
  return `{${arr.join(', ')}}`
}
