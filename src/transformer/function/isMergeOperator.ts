import ts from 'typescript'
export default function isMergeOperator(operator: ts.SyntaxKind) {
  return operator === ts.SyntaxKind.PlusEqualsToken
    || operator === ts.SyntaxKind.MinusEqualsToken
    || operator === ts.SyntaxKind.AsteriskEqualsToken
    || operator === ts.SyntaxKind.AsteriskAsteriskEqualsToken
    || operator === ts.SyntaxKind.SlashEqualsToken
    || operator === ts.SyntaxKind.PercentEqualsToken
    || operator === ts.SyntaxKind.LessThanLessThanEqualsToken
    || operator === ts.SyntaxKind.GreaterThanGreaterThanEqualsToken
    || operator === ts.SyntaxKind.GreaterThanGreaterThanGreaterThanEqualsToken
    || operator === ts.SyntaxKind.AmpersandEqualsToken
    || operator === ts.SyntaxKind.BarEqualsToken
    || operator === ts.SyntaxKind.CaretEqualsToken
}
