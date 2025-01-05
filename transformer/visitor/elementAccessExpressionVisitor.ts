
import ts from 'typescript'
import statement from '../statement'
import reportError from '../function/reportError'
import { CTypeEnum2Bytes } from '../../typedef'
import { StructType } from '../struct'
import relativePath from '../function/relativePath'
import * as constant from '../constant'
import * as nodeUtils from '../util/nodeutil'
import * as typeUtils from '../util/typeutil'


export default function (node: ts.ElementAccessExpression, visitor: ts.Visitor): ts.Node {
  const type = statement.typeChecker.getTypeAtLocation(node.expression)
  // pointer[]
  if (nodeUtils.isPointerElementAccess(node)
    && (!type.aliasSymbol || type.aliasSymbol.escapedName !== constant.typeArray)
  ) {
    return ts.visitNode(
      statement.context.factory.createCallExpression(
        statement.context.factory.createIdentifier(constant.accessof),
        undefined,
        [
          statement.context.factory.createBinaryExpression(
            node.expression,
            ts.SyntaxKind.PlusToken,
            node.argumentExpression
          )
        ]
      ),
      visitor
    )
  }
  else if (nodeUtils.isSmartPointerElementAccess(node)) {
    reportError(statement.currentFile, node, 'smart pointer not support [] operate')
    return node
  }
  // array[]
  else if (ts.isPropertyAccessExpression(node.expression)
      && nodeUtils.isPointerNode(node.expression.expression)
    || ts.isElementAccessExpression(node.expression)
      && nodeUtils.isPointerNode(node.expression)
  ) {
    const type = statement.typeChecker.getTypeAtLocation(node)

    let tree = ts.visitNode(
      statement.context.factory.createCallExpression(
        statement.context.factory.createIdentifier(constant.addressof),
        undefined,
        [
          node.expression
        ]
      ),
      visitor
    )

    if (typeUtils.isStructType(type)) {

      let targetStruct = typeUtils.getStructByType(type)

      let targetSymbol = targetStruct.symbol
      let targetPath = ''

      if (targetStruct.structType === StructType.INLINE_OBJECT) {
        targetSymbol = targetStruct.definedClassParent.symbol
        targetPath = targetStruct.definedClassParent.inlineStructPathMap.get(targetStruct.symbol)
      }

      if (!(ts.isNumericLiteral(node.argumentExpression) && (+node.argumentExpression.text) === 0)) {
        tree = statement.context.factory.createBinaryExpression(
          tree as ts.Expression,
          ts.SyntaxKind.PlusToken,
          ts.isNumericLiteral(node.argumentExpression)
            ? nodeUtils.createPointerOperand(targetStruct.length * (+node.argumentExpression.text))
            : nodeUtils.createPointerOperand(statement.context.factory.createBinaryExpression(
              statement.context.factory.createNumericLiteral(targetStruct.length),
              ts.SyntaxKind.AsteriskToken,
              statement.context.factory.createParenthesizedExpression(node.argumentExpression)
            ))
        )
      }

      const targetSource = targetSymbol.valueDeclaration?.getSourceFile()
      if (targetSource) {
        let key: ts.Expression
        if (targetSource !== statement.currentFile) {
          key = statement.addIdentifierImport(
            targetSymbol.escapedName as string,
            relativePath(statement.currentFile.fileName, targetSource.fileName),
            !statement.typeChecker.getSymbolAtLocation(targetSource).exports?.has(targetSymbol.escapedName)
          )
        }
        else {
          key = statement.context.factory.createIdentifier(targetSymbol.escapedName as string)
        }
        const args = [
          tree as ts.Expression,
          key
        ]
        if (targetPath) {
          args.push(statement.context.factory.createStringLiteral(targetPath))
        }
        return statement.context.factory.createCallExpression(
          statement.addIdentifierImport(constant.structAccess, constant.structAccessPath, true),
          undefined,
          args
        )
      }
    }
    else if (typeUtils.isBuiltinType(type)) {

      if (!(ts.isNumericLiteral(node.argumentExpression) && (+node.argumentExpression.text) === 0)) {
        tree = statement.context.factory.createBinaryExpression(
          tree as ts.Expression,
          ts.SyntaxKind.PlusToken,
          ts.isNumericLiteral(node.argumentExpression)
            ? nodeUtils.createPointerOperand(CTypeEnum2Bytes[typeUtils.getBuiltinByType(type)] * (+node.argumentExpression.text))
            : nodeUtils.createPointerOperand(statement.context.factory.createBinaryExpression(
              statement.context.factory.createNumericLiteral(CTypeEnum2Bytes[typeUtils.getBuiltinByType(type)]),
              ts.SyntaxKind.AsteriskToken,
              statement.context.factory.createParenthesizedExpression(node.argumentExpression)
            ))
        )
      }

      return statement.context.factory.createCallExpression(
        statement.context.factory.createElementAccessExpression(
          statement.addMemoryImport(constant.ctypeEnumRead) as ts.Expression,
          typeUtils.getBuiltinByType(type)
        ),
        undefined,
        [
          tree as ts.Expression
        ]
      )
    }
    else {
      reportError(statement.currentFile, node, 'struct type mismatch')
      return node
    }
  }

  return ts.visitEachChild(node, visitor, statement.context)
}
