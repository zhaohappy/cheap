import ts from 'typescript'

export function compute<T extends number | bigint>(a: T, b: T, token: ts.SyntaxKind): T {
  if (token === ts.SyntaxKind.PlusToken) {
    return ((a as number) + (b as number)) as T
  }
  else if (token === ts.SyntaxKind.MinusToken) {
    return (a - b) as T
  }
  else if (token === ts.SyntaxKind.AsteriskToken) {
    return (a * b) as T
  }
  else if (token === ts.SyntaxKind.AsteriskAsteriskToken) {
    return (a ** b) as T
  }
  else if (token === ts.SyntaxKind.SlashToken) {
    return (a / b) as T
  }
  else if (token === ts.SyntaxKind.PercentToken) {
    return (a % b) as T
  }
  else if (token === ts.SyntaxKind.LessThanLessThanToken) {
    return (a << b) as T
  }
  else if (token === ts.SyntaxKind.GreaterThanGreaterThanToken) {
    return (a >> b) as T
  }
  else if (token === ts.SyntaxKind.GreaterThanGreaterThanGreaterThanToken) {
    return (a >>> b) as T
  }
  else if (token === ts.SyntaxKind.AmpersandToken) {
    return (a & b) as T
  }
  else if (token === ts.SyntaxKind.BarToken) {
    return (a | b) as T
  }
}
