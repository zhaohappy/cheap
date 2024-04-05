
import ts from 'typescript'
import statement, { StageStatus } from '../statement'
import { CTypeEnum2Type, Type2CTypeEnum } from '../defined'
import { CTypeEnum } from '../../typedef'
import * as is from 'common/util/is'

export default function (node: ts.Identifier, visitor: ts.Visitor): ts.Node | ts.Node[] {
  if ((statement.lookupStage(StageStatus.Parameter) || statement.lookupStage(StageStatus.VariableDeclaration))
    && node.parent
    && (
      ts.isVariableDeclaration(node.parent) && node.parent.name === node
      || ts.isBindingElement(node.parent) && node.parent.name === node
      || ts.isParameter(node.parent) && node.parent.name === node
    )
  ) {
    statement.getCurrentStack().locals.set(node.escapedText as string, statement.typeChecker.getSymbolAtLocation(node))
  }

  let parent = node.parent

  if (parent && ts.isAsExpression(parent)) {
    parent = node.parent.parent
  }

  if (node.escapedText === CTypeEnum2Type[CTypeEnum.null]
    && !statement.lookupLocal(node.escapedText)
    && parent && ((parent as ts.VariableDeclaration).initializer === node
      || ts.isBinaryExpression(parent)
      || ts.isCallExpression(parent)
      || ts.isReturnStatement(parent)
      || ts.isConditionalExpression(parent)
      || ts.isCaseClause(parent)
      || ts.isComputedPropertyName(parent)
      || ts.isArrayLiteralExpression(parent)
      || statement.getCurrentStage()?.stage === StageStatus.SingleArrowRight && !ts.isTypeReferenceNode(parent)
  )
  ) {
    return statement.context.factory.createNumericLiteral(0)
  }
  else if (is.number(Type2CTypeEnum[node.escapedText as string])
    && !statement.lookupLocal(node.escapedText as string)
    && parent && (
    (parent as ts.VariableDeclaration).initializer === node
        || ts.isBinaryExpression(parent)
        || ts.isCallExpression(parent)
        || ts.isReturnStatement(parent)
        || ts.isConditionalExpression(parent)
        || ts.isCaseClause(parent)
        || ts.isComputedPropertyName(parent)
        || ts.isElementAccessExpression(parent) && parent.argumentExpression === node
        || statement.getCurrentStage()?.stage === StageStatus.SingleArrowRight && !ts.isTypeReferenceNode(parent)
  )
  ) {
    return statement.context.factory.createNumericLiteral(Type2CTypeEnum[node.escapedText as string])
  }
  return ts.visitEachChild(node, visitor, statement.context)
}
