
import ts from 'typescript'
import statement from '../statement'
import * as array from 'common/util/array'
import { isPointerNode } from '../util/nodeutil'
import reportError from '../function/reportError'
import { BuiltinBigInt } from '../defined'
import toString from 'common/function/toString'
import * as typeUtils from '../util/typeutil'
import { CTypeEnum2Bytes } from '../../typedef'

export default function (node: ts.UnaryExpression, visitor: ts.Visitor): ts.Node {

  if (ts.isPrefixUnaryExpression(node) && isPointerNode(node.operand)) {

    const type = statement.typeChecker.getTypeAtLocation(node.operand)

    let step = 1

    if (typeUtils.isPointerType(type)) {
      if (typeUtils.isPointerBuiltinType(type)) {
        step = CTypeEnum2Bytes[typeUtils.getPointerBuiltinByType(type)]
      }
      else if (typeUtils.isPointerStructType(type)) {
        const struct = typeUtils.getPointerStructByType(type)
        step = struct.length
      }
    }

    const stepNode = array.has(BuiltinBigInt, type.aliasSymbol?.escapedName as string)
      ? statement.context.factory.createBigIntLiteral({
        negative: false,
        base10Value: toString(step)
      })
      : statement.context.factory.createNumericLiteral(step)

    if (node.operator === ts.SyntaxKind.PlusPlusToken) {
      if (ts.isExpressionStatement(node.parent)) {
        return ts.visitNode(
          statement.context.factory.createBinaryExpression(
            node.operand,
            ts.SyntaxKind.PlusEqualsToken,
            stepNode
          ),
          visitor
        )
      }
      return ts.visitNode(
        statement.context.factory.createBinaryExpression(
          statement.context.factory.createBinaryExpression(
            node.operand,
            ts.SyntaxKind.PlusEqualsToken,
            stepNode
          ),
          ts.SyntaxKind.CommaToken,
          node.operand
        ),
        visitor
      )
    }
    else if (node.operator === ts.SyntaxKind.MinusMinusToken) {
      if (ts.isExpressionStatement(node.parent)) {
        return ts.visitNode(
          statement.context.factory.createBinaryExpression(
            node.operand,
            ts.SyntaxKind.MinusEqualsToken,
            stepNode
          ),
          visitor
        )
      }
      return ts.visitNode(
        statement.context.factory.createBinaryExpression(
          statement.context.factory.createBinaryExpression(
            node.operand,
            ts.SyntaxKind.MinusEqualsToken,
            stepNode
          ),
          ts.SyntaxKind.CommaToken,
          node.operand
        ),
        visitor
      )
    }
    else if (node.operator !== ts.SyntaxKind.ExclamationToken) {
      reportError(statement.currentFile, node, 'The unary operation width pointer only allowed ++ -- !')
      return node
    }
  }
  else if (ts.isPostfixUnaryExpression(node) && isPointerNode(node.operand)) {

    const type = statement.typeChecker.getTypeAtLocation(node.operand)

    let step = 1

    if (typeUtils.isPointerType(type)) {
      if (typeUtils.isPointerBuiltinType(type)) {
        step = CTypeEnum2Bytes[typeUtils.getPointerBuiltinByType(type)]
      }
      else if (typeUtils.isPointerStructType(type)) {
        const struct = typeUtils.getPointerStructByType(type)
        step = struct.length
      }
    }

    const stepNode = array.has(BuiltinBigInt, typeUtils.getBuiltinNameByType(type))
      ? statement.context.factory.createBigIntLiteral({
        negative: false,
        base10Value: toString(step)
      })
      : statement.context.factory.createNumericLiteral(step)

    if (node.operator === ts.SyntaxKind.PlusPlusToken) {

      if (ts.isExpressionStatement(node.parent)) {
        return ts.visitNode(
          statement.context.factory.createBinaryExpression(
            node.operand,
            ts.SyntaxKind.PlusEqualsToken,
            stepNode
          ),
          visitor
        )
      }

      return ts.visitNode(
        statement.context.factory.createBinaryExpression(
          statement.context.factory.createBinaryExpression(
            node.operand,
            ts.SyntaxKind.PlusEqualsToken,
            stepNode
          ),
          ts.SyntaxKind.CommaToken,
          statement.context.factory.createBinaryExpression(
            node.operand,
            ts.SyntaxKind.MinusToken,
            stepNode
          )
        ),
        visitor
      )
    }
    else if (node.operator === ts.SyntaxKind.MinusMinusToken) {

      if (ts.isExpressionStatement(node.parent)) {
        return ts.visitNode(
          statement.context.factory.createBinaryExpression(
            node.operand,
            ts.SyntaxKind.MinusEqualsToken,
            stepNode
          ),
          visitor
        )
      }

      return ts.visitNode(
        statement.context.factory.createBinaryExpression(
          statement.context.factory.createBinaryExpression(
            node.operand,
            ts.SyntaxKind.MinusEqualsToken,
            stepNode
          ),
          ts.SyntaxKind.CommaToken,
          statement.context.factory.createBinaryExpression(
            node.operand,
            ts.SyntaxKind.PlusToken,
            stepNode
          )
        ),
        visitor
      )
    }
  }
  return ts.visitEachChild(node, visitor, statement.context)
}
