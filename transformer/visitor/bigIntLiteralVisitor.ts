
import type ts from 'typescript'
import statement from '../statement'

export default function (node: ts.BigIntLiteral, visitor: ts.Visitor): ts.Node | ts.Node[] {
  if (statement.cheapCompilerOptions.defined.BIGINT_LITERAL === false) {
    return statement.context.factory.createCallExpression(
      statement.context.factory.createIdentifier('BigInt'),
      undefined,
      [
        statement.context.factory.createNumericLiteral(node.text.replace(/n$/, ''))
      ]
    )
  }
  return node
}
