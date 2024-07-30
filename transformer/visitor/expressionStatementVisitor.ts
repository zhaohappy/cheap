import ts from 'typescript'
import * as constant from '../constant'
import statement from '../statement'

export default function (node: ts.ExpressionStatement, visitor: ts.Visitor): ts.Node {

  if (ts.isCallExpression(node.expression)
    && ts.isIdentifier(node.expression.expression)
    && node.expression.expression.escapedText === constant.assert
  ) {
    if (statement.cheapCompilerOptions.defined['DEBUG'] && node.expression.arguments.length >= 1) {
      const newNode = ts.visitEachChild(node.expression, visitor, statement.context)

      const list: ts.Statement[] = []

      const { line } = ts.getLineAndCharacterOfPosition(statement.currentFile, node.getStart())

      const args: ts.Expression[] = [
        statement.context.factory.createStringLiteral(`[${statement.currentFilePath} line: ${line + 1}]`),
        statement.context.factory.createStringLiteral(`Assertion failed: ${node.expression.arguments[0].getText()}`)
      ]

      if (newNode.arguments[1]) {
        args.push(newNode.arguments[1])
      }

      list.push(statement.context.factory.createExpressionStatement(statement.context.factory.createCallExpression(
        statement.context.factory.createPropertyAccessExpression(
          statement.context.factory.createIdentifier('console'),
          statement.context.factory.createIdentifier('error')
        ),
        undefined,
        args
      )))

      list.push(statement.context.factory.createDebuggerStatement())

      return statement.context.factory.createIfStatement(
        statement.context.factory.createPrefixUnaryExpression(
          ts.SyntaxKind.ExclamationToken,
          statement.context.factory.createParenthesizedExpression(newNode.arguments[0])
        ),
        statement.context.factory.createBlock(
          list,
          true
        )
      )
    }
    else {
      return undefined
    }
  }

  return ts.visitEachChild(node, visitor, statement.context)
}
