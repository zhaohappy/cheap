
import ts from 'typescript'
import statement from '../statement'
import * as typeUtils from '../util/typeutil'
import * as nodeUtils from '../util/nodeutil'
import reportError from '../function/reportError'
import * as error from '../error'

export default function (node: ts.PropertyAssignment, visitor: ts.Visitor): ts.Node | ts.Node[] {
  if (node.initializer && node.pos > -1) {
    const type = statement.typeChecker.getTypeAtLocation(node.name)
    const initType = statement.typeChecker.getTypeAtLocation(node.initializer)
    if (typeUtils.isPointerType(type)
      && (typeUtils.isBuiltinType(initType) || initType.flags & ts.TypeFlags.NumberLike)
      && !typeUtils.isPointerType(initType)
      && !typeUtils.isNullPointer(initType)
    ) {
      reportError(statement.currentFile, node, `type ${typeUtils.getBuiltinNameByType(initType) || 'number'} is not assignable to property assignment of type ${typeUtils.getBuiltinNameByType(type)}`, error.TYPE_MISMATCH)
      return node
    }
    else if (typeUtils.isSizeType(type, true)) {
      return statement.context.factory.createPropertyAssignment(
        node.name,
        ts.visitNode(nodeUtils.createPointerOperand(node.initializer), statement.visitor) as ts.Expression
      )
    }
  }
  return ts.visitEachChild(node, visitor, statement.context)
}
