import ts from 'typescript'
import statement from '../statement'
import * as nodeUtils from '../util/nodeutil'

import callVisitor from './callVisitor'
import propertyAccessExpressionVisitor from './propertyAccessExpressionVisitor'
import binaryExpressionVisitor from './binaryExpressionVisitor'
import unaryExpressionVisitor from './unaryExpressionVisitor'
import elementAccessExpressionVisitor from './elementAccessExpressionVisitor'
import taggedTemplateExpressionVisitor from './taggedTemplateExpressionVisitor'
import conditionalExpressionVisitor from './conditionalExpressionVisitor'

export default function (node: ts.Expression, visitor: ts.Visitor): ts.Node {
  if (ts.isBinaryExpression(node)) {
    return binaryExpressionVisitor(node, visitor)
  }
  else if (ts.isPrefixUnaryExpression(node) || ts.isPostfixUnaryExpression(node)) {
    return unaryExpressionVisitor(node, visitor)
  }
  else if (ts.isCallExpression(node)) {
    return callVisitor(node, visitor)
  }
  else if (ts.isPropertyAccessExpression(node)) {
    return propertyAccessExpressionVisitor(node, visitor)
  }
  else if (ts.isElementAccessExpression(node)) {
    return elementAccessExpressionVisitor(node, visitor)
  }
  else if (statement.cheapCompilerOptions.defined.ENABLE_SYNCHRONIZE_API
    && ts.isAwaitExpression(node)
    && node.expression
    && ts.isCallExpression(node.expression)
    && (statement.lookupSynchronized()
      || nodeUtils.isSynchronizeFunction(statement.typeChecker.getSymbolAtLocation(ts.isPropertyAccessExpression(node.expression.expression)
        ? node.expression.expression.name
        : node.expression.expression)?.valueDeclaration as ts.FunctionDeclaration)
    )
  ) {
    return ts.visitEachChild(node.expression, visitor, statement.context)
  }
  else if (ts.isTaggedTemplateExpression(node)) {
    return taggedTemplateExpressionVisitor(node, visitor)
  }
  else if (ts.isConditionalExpression(node)) {
    return conditionalExpressionVisitor(node, visitor)
  }

  return ts.visitEachChild(node, visitor, statement.context)
}
