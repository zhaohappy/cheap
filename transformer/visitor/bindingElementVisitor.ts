
import ts from 'typescript'
import statement from '../statement'
import * as typeUtils from '../util/typeutil'
import * as nodeUtils from '../util/nodeutil'

export default function (node: ts.BindingElement, visitor: ts.Visitor): ts.Node | ts.Node[] {
  if (node.initializer && node.pos > -1) {
    const type = statement.typeChecker.getTypeAtLocation(node.name)
    if (typeUtils.isSizeType(type), true) {
      return statement.context.factory.createBindingElement(
        node.dotDotDotToken,
        node.propertyName,
        node.name,
        ts.visitNode(nodeUtils.createPointerOperand(node.initializer), statement.visitor) as ts.Expression
      )
    }
  }
  return ts.visitEachChild(node, visitor, statement.context)
}
