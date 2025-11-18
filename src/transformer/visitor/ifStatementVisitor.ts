
import ts from 'typescript'
import statement from '../statement'
import * as nodeUtil from '../util/nodeutil'

function check(node: ts.Node) {
  if (ts.isBlock(node)
    && !node.statements.some((n) => !ts.isImportDeclaration(n))
  ) {
    if (node.statements.length === 1) {
      return node.statements[0]
    }
    return node.statements
  }
  return node
}

export default function (node: ts.IfStatement, visitor: ts.Visitor): ts.Node | ts.Node[] {
  if (ts.visitNode(node.expression, nodeUtil.hasDefined) && ts.visitNode(node.expression, nodeUtil.checkConditionCompile)) {
    if (nodeUtil.checkBool(node.expression, visitor)) {
      return check(ts.visitNode(node.thenStatement, visitor)) as ts.Node
    }
    else if (node.elseStatement) {
      return check(ts.visitNode(node.elseStatement, visitor)) as ts.Node
    }
    else {
      return undefined
    }
  }
  return ts.visitEachChild(node, visitor, statement.context)
}
