
import ts from 'typescript'
import statement from '../statement'
import * as nodeUtil from '../util/nodeutil'

export default function (node: ts.IfStatement, visitor: ts.Visitor): ts.Node {
  if (ts.visitNode(node.expression, nodeUtil.hasDefined) && ts.visitNode(node.expression, nodeUtil.checkConditionCompile)) {
    if (nodeUtil.checkBool(node.expression, visitor)) {
      return ts.visitNode(node.thenStatement, visitor)
    }
    else if (node.elseStatement) {
      return ts.visitNode(node.elseStatement, visitor)
    }
    else {
      return undefined
    }
  }
  return ts.visitEachChild(node, visitor, statement.context)
}
