
import ts from 'typescript'
import statement from '../statement'
import * as nodeUtil from '../util/nodeutil'
import * as typeUtil from '../util/typeutil'

export default function (node: ts.ConditionalExpression, visitor: ts.Visitor): ts.Node {
  if (ts.visitNode(node.condition, nodeUtil.hasDefined) && ts.visitNode(node.condition, nodeUtil.checkConditionCompile)) {
    if (nodeUtil.checkBool(node.condition, visitor)) {
      if (statement.cheapCompilerOptions.defined.WASM_64) {
        const type = statement.typeChecker.getTypeAtLocation(node.whenFalse)
        if (typeUtil.isSizeType(type)) {
          return nodeUtil.createPointerOperand(ts.visitNode(node.whenTrue, visitor) as ts.Expression)
        }
      }
      return ts.visitNode(node.whenTrue, visitor)
    }
    else {
      if (statement.cheapCompilerOptions.defined.WASM_64) {
        const type = statement.typeChecker.getTypeAtLocation(node.whenTrue)
        if (typeUtil.isSizeType(type)) {
          return nodeUtil.createPointerOperand(ts.visitNode(node.whenFalse, visitor) as ts.Expression)
        }
      }
      return ts.visitNode(node.whenFalse, visitor)
    }
  }
  if (statement.cheapCompilerOptions.defined.WASM_64) {
    const type1 = statement.typeChecker.getTypeAtLocation(node.whenTrue)
    const type2 = statement.typeChecker.getTypeAtLocation(node.whenFalse)
    if (typeUtil.isSizeType(type1) && !typeUtil.isSizeType(type2)) {
      return statement.context.factory.createConditionalExpression(
        ts.visitNode(node.condition, statement.visitor) as ts.Expression,
        node.questionToken,
        ts.visitNode(node.whenTrue, statement.visitor) as ts.Expression,
        node.colonToken,
        nodeUtil.createPointerOperand(ts.visitNode(node.whenFalse, statement.visitor) as ts.Expression)
      )
    }
    else if (!typeUtil.isSizeType(type1) && typeUtil.isSizeType(type2)) {
      return statement.context.factory.createConditionalExpression(
        ts.visitNode(node.condition, statement.visitor) as ts.Expression,
        node.questionToken,
        nodeUtil.createPointerOperand(ts.visitNode(node.whenTrue, statement.visitor) as ts.Expression),
        node.colonToken,
        ts.visitNode(node.whenFalse, statement.visitor) as ts.Expression
      )
    }
  }
  return ts.visitEachChild(node, visitor, statement.context)
}
