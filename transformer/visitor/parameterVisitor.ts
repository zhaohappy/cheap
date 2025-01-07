import ts from 'typescript'
import statement, { StageStatus } from '../statement'
import * as typeUtils from '../util/typeutil'
import * as nodeUtils from '../util/nodeutil'

export default function (node: ts.ParameterDeclaration, visitor: ts.Visitor): ts.Node | ts.Node[] {

  statement.pushStage(StageStatus.Parameter)

  if (node.initializer && node.type && node.pos > -1) {
    const type = statement.typeChecker.getTypeAtLocation(node.type)
    if (typeUtils.isSizeType(type)) {
      return ts.visitNode(statement.context.factory.createParameterDeclaration(
        node.modifiers,
        node.dotDotDotToken,
        node.name,
        node.questionToken,
        node.type,
        nodeUtils.createPointerOperand(node.initializer)
      ), statement.visitor)
    }
  }
  const newNode = ts.visitEachChild(node, visitor, statement.context)

  statement.popStage()

  return newNode
}
