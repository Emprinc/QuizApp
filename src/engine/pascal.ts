// Pascal's Triangle generator — ported from _generate_pascal_data.

export function generatePascalData(n: number): { triangleStr: string; lastRow: number[] } {
  if (n > 10) n = 10

  const triangle: number[][] = []
  let row: number[] = [1]
  for (let _ = 0; _ <= n; _++) {
    triangle.push(row)
    const next: number[] = []
    const padded = [0, ...row]
    const padded2 = [...row, 0]
    for (let i = 0; i < padded.length; i++) {
      next.push(padded[i] + padded2[i])
    }
    row = next
  }

  const lastRow = triangle[triangle.length - 1]
  const maxLen = lastRow.join(' ').length
  let triangleStr = '```\n'
  for (const r of triangle) {
    const rowStr = r.join(' ')
    const padding = Math.floor((maxLen - rowStr.length) / 2)
    triangleStr += ' '.repeat(padding) + rowStr + '\n'
  }
  triangleStr += '```'

  return { triangleStr, lastRow }
}
