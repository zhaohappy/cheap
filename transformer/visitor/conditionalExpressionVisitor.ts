
import ts from 'typescript'
import statement from '../statement'
import * as nodeUtil from '../util/nodeutil'

export default function (node: ts.ConditionalExpression, visitor: ts.Visitor): ts.Node {
  if (ts.visitNode(node.condition, nodeUtil.hasDefined) && ts.visitNode(node.condition, nodeUtil.checkConditionCompile)) {
    if (nodeUtil.checkBool(node.condition, visitor)) {
      return ts.visitNode(node.whenTrue, visitor)
    }
    else {
      return ts.visitNode(node.whenFalse, visitor)
    }
  }
  return ts.visitEachChild(node, visitor, statement.context)
}
