import ts from 'typescript'

export function compute(a: number, b: number, token: ts.SyntaxKind) {
  if (token === ts.SyntaxKind.PlusToken) {
    return a + b
  }
  else if (token === ts.SyntaxKind.MinusToken) {
    return a - b
  }
  else if (token === ts.SyntaxKind.AsteriskToken) {
    return a * b
  }
  else if (token === ts.SyntaxKind.AsteriskAsteriskToken) {
    return a ** b
  }
  else if (token === ts.SyntaxKind.SlashToken) {
    return a / b
  }
  else if (token === ts.SyntaxKind.PercentToken) {
    return a % b
  }
  else if (token === ts.SyntaxKind.LessThanLessThanToken) {
    return a << b
  }
  else if (token === ts.SyntaxKind.GreaterThanGreaterThanToken) {
    return a >> b
  }
  else if (token === ts.SyntaxKind.GreaterThanGreaterThanGreaterThanToken) {
    return a >>> b
  }
  else if (token === ts.SyntaxKind.AmpersandToken) {
    return a & b
  }
  else if (token === ts.SyntaxKind.BarToken) {
    return a | b
  }
}
