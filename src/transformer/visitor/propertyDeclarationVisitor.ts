
import ts from 'typescript'
import statement from '../statement'
import * as typeUtils from '../util/typeutil'
import * as nodeUtils from '../util/nodeutil'
import reportError from '../function/reportError'
import * as error from '../error'

export default function (node: ts.PropertyDeclaration, visitor: ts.Visitor): ts.Node | ts.Node[] {
  if (node.initializer && node.type && node.pos > -1) {
    const type = statement.typeChecker.getTypeAtLocation(node.type)
    const initType = statement.typeChecker.getTypeAtLocation(node.initializer)
    if (typeUtils.isPointerType(type, null)
      && (typeUtils.isBuiltinType(initType, node.initializer) || initType.flags & ts.TypeFlags.NumberLike)
      && !typeUtils.isPointerType(initType, node.initializer)
      && !typeUtils.isNullPointer(initType, node.initializer)
    ) {
      reportError(statement.currentFile, node, `type ${typeUtils.getBuiltinNameByType(initType) || 'number'} is not assignable to property declaration of type ${typeUtils.getBuiltinNameByType(type)}`, error.TYPE_MISMATCH)
      return node
    }
    else if (typeUtils.isSizeType(type)) {
      return ts.visitNode(statement.context.factory.createPropertyDeclaration(
        node.modifiers,
        node.name,
        node.questionToken || node.exclamationToken,
        node.type,
        nodeUtils.createPointerOperand(node.initializer)
      ), statement.visitor)
    }
  }
  return ts.visitEachChild(node, visitor, statement.context)
}
