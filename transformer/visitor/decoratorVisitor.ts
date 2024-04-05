
import ts from 'typescript'
import * as array from 'common/util/array'
import statement from '../statement'
import { BuiltinDecorator } from '../defined'
import * as nodeUtils from '../util/nodeutil'

export default function (node: ts.Decorator, visitor: ts.Visitor): ts.Node {
  if (ts.isIdentifier(node.expression)) {
    const name = node.expression.escapedText as string
    if (array.has(BuiltinDecorator, name)) {
      return undefined
    }
  }
  else if (ts.isCallExpression(node.expression) && ts.isIdentifier(node.expression.expression)) {
    const name = node.expression.expression.escapedText as string
    if (array.has(BuiltinDecorator, name)) {
      return undefined
    }
  }
  return ts.visitEachChild(node, visitor, statement.context)
}

export function asyncVisitor(node: ts.AsyncKeyword, visitor: ts.Visitor) {
  if (statement.cheapCompilerOptions.defined.ENABLE_SYNCHRONIZE_API
    && node.parent
    && (ts.isFunctionDeclaration(node.parent)
      || ts.isFunctionExpression(node.parent)
      || ts.isArrowFunction(node.parent)
      || ts.isMethodDeclaration(node.parent)
    )
    && nodeUtils.isSynchronizeFunction(node.parent)
  ) {
    return undefined
  }
  return node
}
