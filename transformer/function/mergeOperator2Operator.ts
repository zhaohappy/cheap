import ts from 'typescript'
export default function mergeOperator2Operator(operator: ts.SyntaxKind) {
  switch (operator) {
    case ts.SyntaxKind.PlusEqualsToken:
      return ts.SyntaxKind.PlusToken
    case ts.SyntaxKind.MinusEqualsToken:
      return ts.SyntaxKind.MinusToken
    case ts.SyntaxKind.AsteriskEqualsToken:
      return ts.SyntaxKind.AsteriskToken
    case ts.SyntaxKind.AsteriskAsteriskEqualsToken:
      return ts.SyntaxKind.AsteriskAsteriskToken
    case ts.SyntaxKind.SlashEqualsToken:
      return ts.SyntaxKind.SlashToken
    case ts.SyntaxKind.PercentEqualsToken:
      return ts.SyntaxKind.PercentToken
    case ts.SyntaxKind.LessThanLessThanEqualsToken:
      return ts.SyntaxKind.LessThanLessThanToken
    case ts.SyntaxKind.GreaterThanGreaterThanEqualsToken:
      return ts.SyntaxKind.GreaterThanGreaterThanToken
    case ts.SyntaxKind.GreaterThanGreaterThanGreaterThanEqualsToken:
      return ts.SyntaxKind.GreaterThanGreaterThanGreaterThanToken
    case ts.SyntaxKind.AmpersandEqualsToken:
      return ts.SyntaxKind.AmpersandToken
    case ts.SyntaxKind.BarEqualsToken:
      return ts.SyntaxKind.BarToken
    case ts.SyntaxKind.CaretEqualsToken:
      return ts.SyntaxKind.CaretToken
    default:
      return ts.SyntaxKind.EqualsToken
  }
}
