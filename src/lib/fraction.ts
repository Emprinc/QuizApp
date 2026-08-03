// Exact rational arithmetic shim — replaces Python's fractions.Fraction.
// Uses bigint numerator/denominator with gcd reduction.

export class Fraction {
  readonly numerator: bigint
  readonly denominator: bigint

  constructor(num: bigint | number, den: bigint | number = 1n) {
    let n = typeof num === 'number' ? BigInt(num) : num
    let d = typeof den === 'number' ? BigInt(den) : den

    if (d === 0n) throw new Error('Division by zero in Fraction')

    // Normalize sign: keep denominator positive
    if (d < 0n) {
      n = -n
      d = -d
    }

    const g = Fraction.gcd(n < 0n ? -n : n, d)
    this.numerator = n / g
    this.denominator = d / g
  }

  static gcd(a: bigint, b: bigint): bigint {
    a = a < 0n ? -a : a
    b = b < 0n ? -b : b
    while (b) {
      ;[a, b] = [b, a % b]
    }
    return a || 1n
  }

  add(other: Fraction): Fraction {
    return new Fraction(
      this.numerator * other.denominator + other.numerator * this.denominator,
      this.denominator * other.denominator
    )
  }

  sub(other: Fraction): Fraction {
    return new Fraction(
      this.numerator * other.denominator - other.numerator * this.denominator,
      this.denominator * other.denominator
    )
  }

  mul(other: Fraction): Fraction {
    return new Fraction(this.numerator * other.numerator, this.denominator * other.denominator)
  }

  div(other: Fraction): Fraction {
    if (other.numerator === 0n) throw new Error('Division by zero')
    return new Fraction(this.numerator * other.denominator, this.denominator * other.numerator)
  }

  get isZero(): boolean { return this.numerator === 0n }
  get isOne(): boolean { return this.numerator === 1n && this.denominator === 1n }

  equals(other: Fraction): boolean {
    return this.numerator === other.numerator && this.denominator === other.denominator
  }

  greaterThan(other: Fraction): boolean {
    return this.numerator * other.denominator > other.numerator * this.denominator
  }

  lessThan(other: Fraction): boolean {
    return this.numerator * other.denominator < other.numerator * this.denominator
  }

  toNumber(): number {
    return Number(this.numerator) / Number(this.denominator)
  }

  toString(): string {
    return this.denominator === 1n ? String(this.numerator) : `${this.numerator}/${this.denominator}`
  }
}
