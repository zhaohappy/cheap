
import ts from 'typescript'
import * as constant from '../constant'
import statement from '../statement'
import * as nodeUtil from '../util/nodeutil'

function check(node: ts.Node) {
  if (ts.isParenthesizedExpression(node)) {
    return ts.visitNode(node.expression, check)
  }
  else if (ts.isPrefixUnaryExpression(node)) {
    return ts.visitNode(node.operand, check)
  }
  else if (ts.isBinaryExpression(node)) {
    const left = ts.visitNode(node.left, check)
    if (!left) {
      return false
    }
    return ts.visitNode(node.right, check)
  }
  if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && (node.expression.escapedText as string) === constant.defined
    || node.kind === ts.SyntaxKind.TrueKeyword
    || node.kind === ts.SyntaxKind.FalseKeyword
  ) {
    return true
  }
  else {
    return false
  }
}

function hasDefined(node: ts.Node) {
  if (ts.isParenthesizedExpression(node)) {
    return ts.visitNode(node.expression, hasDefined)
  }
  else if (ts.isPrefixUnaryExpression(node)) {
    return ts.visitNode(node.operand, hasDefined)
  }
  else if (ts.isBinaryExpression(node)) {
    return ts.visitNode(node.left, hasDefined) || ts.visitNode(node.right, hasDefined)
  }
  if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && (node.expression.escapedText as string) === constant.defined) {
    return true
  }
  else {
    return false
  }
}

export default function (node: ts.IfStatement, visitor: ts.Visitor): ts.Node {
  if (ts.visitNode(node.expression, hasDefined) && ts.visitNode(node.expression, check)) {
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
