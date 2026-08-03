// Binary operations question generator — ported from _generate_binary_ops_question
import type { Difficulty, RNG, GeneratedQuestion } from '../types'
import { Fraction } from '../../lib/fraction'
import { getFractionLatexCode, formatFractionText, finalizeOptions } from '../../lib/mathFormat'

function toBinary(n: number): string {
  return n.toString(2)
}

function toOctal(n: number): string {
  return n.toString(8)
}

function toHex(n: number): string {
  return n.toString(16).toUpperCase()
}

export function generateBinaryOpsQuestion(difficulty: Difficulty, rng: RNG): GeneratedQuestion {
  let qType: string
  if (difficulty === 'Easy') {
    qType = rng.pick(['dec_to_bin', 'bin_to_dec'])
  } else if (difficulty === 'Medium') {
    qType = rng.pick(['dec_to_oct', 'dec_to_hex', 'bin_arithmetic'])
  } else {
    qType = rng.pick(['bin_to_hex', 'hex_to_dec', 'bin_operations'])
  }

  let question = '', answer = '', hint = '', explanation = ''
  let options = new Set<string>()

  if (qType === 'dec_to_bin') {
    const num = rng.int(5, 31)
    question = `Convert the decimal number ${num} to binary.`
    answer = toBinary(num)
    hint = 'Repeatedly divide by 2 and record the remainders. Read from bottom to top.'
    explanation = `${num} in binary is ${answer}.\n${num} ÷ 2 = ${Math.floor(num / 2)} remainder ${num % 2}, and so on.`
    options = new Set([answer, toBinary(num + 1), toBinary(num - 1)])
  } else if (qType === 'bin_to_dec') {
    const num = rng.int(5, 31)
    const bin = toBinary(num)
    question = `Convert the binary number $${bin}$ to decimal.`
    answer = String(num)
    hint = 'Multiply each bit by its corresponding power of 2 and add them up.'
    explanation = `$${bin} = ${bin.split('').map((b, i) => b === '1' ? `2^{${bin.length - 1 - i}}` : '').filter(Boolean).join(' + ')} = ${num}$.`
    options = new Set([answer, String(num + 1), String(num - 1)])
  } else if (qType === 'dec_to_oct') {
    const num = rng.int(20, 200)
    question = `Convert the decimal number ${num} to octal.`
    answer = toOctal(num)
    hint = 'Repeatedly divide by 8 and record the remainders. Read from bottom to top.'
    explanation = `${num} in octal is ${answer}.\n${num} ÷ 8 = ${Math.floor(num / 8)} remainder ${num % 8}, and so on.`
    options = new Set([answer, toOctal(num + 8), toOctal(num - 8)])
  } else if (qType === 'dec_to_hex') {
    const num = rng.int(100, 500)
    question = `Convert the decimal number ${num} to hexadecimal.`
    answer = toHex(num)
    hint = 'Repeatedly divide by 16 and record the remainders. Read from bottom to top. Use A-F for 10-15.'
    explanation = `${num} in hexadecimal is ${answer}.\n${num} ÷ 16 = ${Math.floor(num / 16)} remainder ${num % 16}, and so on.`
    options = new Set([answer, toHex(num + 16), toHex(num - 16)])
  } else if (qType === 'bin_arithmetic') {
    const a = rng.int(2, 15)
    const b = rng.int(2, 15)
    const [op, sym] = rng.pick<[string, string]>([['add', '+'], ['subtract', '-']])
    const res = op === 'add' ? a + b : Math.abs(a - b)
    question = `Calculate $${toBinary(a)} ${sym} ${toBinary(b)}$ in binary. Give your answer in binary.`
    answer = toBinary(res)
    hint = `Convert to decimal, perform the ${op}, then convert back to binary.`
    explanation = `$${toBinary(a)} = ${a}$, $${toBinary(b)} = ${b}$. ${a} ${sym} ${b} = ${res}. ${res} in binary is ${answer}.`
    options = new Set([answer, toBinary(res + 1), toBinary(res - 1)])
  } else if (qType === 'bin_to_hex') {
    const num = rng.int(16, 255)
    const bin = toBinary(num)
    question = `Convert the binary number $${bin}$ to hexadecimal.`
    answer = toHex(num)
    hint = 'Group the binary digits into sets of 4 from the right, then convert each group to its hex equivalent.'
    explanation = `$${bin} = ${num}$ in decimal. ${num} in hexadecimal is ${answer}.`
    options = new Set([answer, toHex(num + 1), toHex(num - 1)])
  } else if (qType === 'hex_to_dec') {
    const num = rng.int(50, 500)
    const hex = toHex(num)
    question = `Convert the hexadecimal number $${hex}$ to decimal.`
    answer = String(num)
    hint = 'Multiply each digit by its corresponding power of 16 and add them up. Remember A=10, B=11, ..., F=15.'
    explanation = `$${hex}$ in decimal is ${num}.`
    options = new Set([answer, String(num + 16), String(num - 16)])
  } else if (qType === 'bin_operations') {
    const a = rng.int(10, 50)
    const b = rng.int(10, 50)
    const [op, sym, opName] = rng.pick<[string, string, string]>([
      ['and', '\\land', 'AND'],
      ['or', '\\lor', 'OR'],
      ['xor', '\\oplus', 'XOR'],
    ])
    let res: number
    if (op === 'and') res = a & b
    else if (op === 'or') res = a | b
    else res = a ^ b
    question = `Calculate $${toBinary(a)} ${sym} ${toBinary(b)}$ in binary. Give your answer in binary.`
    answer = toBinary(res)
    hint = `The binary ${opName} operation compares corresponding bits. For AND: both must be 1. For OR: either can be 1. For XOR: exactly one must be 1.`
    explanation = `$${toBinary(a)} = ${a}$, $${toBinary(b)} = ${b}$. ${a} ${opName} ${b} = ${res}. ${res} in binary is ${answer}.`
    options = new Set([answer, toBinary(res + 1), toBinary(a & b | 0)])
  }

  return { question, options: finalizeOptions(options, rng), answer, hint, explanation, difficulty }
}
