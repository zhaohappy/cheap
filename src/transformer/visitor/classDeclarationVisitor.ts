
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

    const structNode = ts.visitEachChild(node, visitor, statement.context)

    const newNode: ts.Node[] = [
      statement.context.factory.createClassDeclaration(
        structNode.modifiers,
        structNode.name,
        structNode.typeParameters,
        structNode.heritageClauses,
        [
          ...structNode.members,
          statement.context.factory.createClassStaticBlockDeclaration(statement.context.factory.createBlock([
            statement.context.factory.createVariableStatement(
              undefined,
              statement.context.factory.createVariableDeclarationList([
                statement.context.factory.createVariableDeclaration(
                  statement.context.factory.createIdentifier(constant.prototype),
                  undefined,
                  undefined,
                  statement.context.factory.createPropertyAccessExpression(
                    statement.context.factory.createThis(),
                    statement.context.factory.createIdentifier(constant.prototype)
                  )
                )
              ], ts.NodeFlags.Const)
            ),
            ...generateStruct(struct)
          ], true))
        ]
      )
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
