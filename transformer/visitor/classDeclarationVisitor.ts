
import ts from 'typescript'
import statement from '../statement'
import * as constant from '../constant'
import * as typeUtils from '../util/typeutil'
import generateStruct from './function/generateStruct'

export default function (node: ts.ClassDeclaration, visitor: ts.Visitor): ts.Node[] | ts.Node {
  const type = statement.typeChecker.getTypeAtLocation(node)
  const struct = typeUtils.getStructByType(type)
  if (struct && (!node.modifiers || !node.modifiers.some((modifier) => modifier.kind === ts.SyntaxKind.DeclareKeyword))) {

    const structName = node.name.escapedText as string

    if (!statement.hasStruct(structName)) {
      statement.addStruct(structName)
    }

    const newNode: ts.Node[] = [
      ts.visitEachChild(node, visitor, statement.context),
      statement.context.factory.createExpressionStatement(statement.context.factory.createCallExpression(
        statement.context.factory.createParenthesizedExpression(statement.context.factory.createFunctionExpression(
          undefined,
          undefined,
          undefined,
          undefined,
          [
            statement.context.factory.createParameterDeclaration(
              undefined,
              undefined,
              statement.context.factory.createIdentifier(constant.prototype)
            )
          ],
          undefined,
          statement.context.factory.createBlock(generateStruct(struct), true)
        )),
        undefined,
        [
          statement.context.factory.createPropertyAccessExpression(
            statement.context.factory.createIdentifier(structName),
            statement.context.factory.createIdentifier('prototype')
          )
        ]
      ))
    ]

    const item = statement.getDeclaration(structName)

    if (item) {
      newNode.push(statement.context.factory.createExpressionStatement(statement.context.factory.createBinaryExpression(
        statement.context.factory.createIdentifier(item.formatName),
        ts.SyntaxKind.EqualsToken,
        statement.context.factory.createIdentifier(item.name)
      )))
    }
    return newNode
  }

  return ts.visitEachChild(node, visitor, statement.context)
}
