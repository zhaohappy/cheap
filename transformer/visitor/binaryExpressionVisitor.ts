
import ts from 'typescript'
import * as is from 'common/util/is'
import * as array from 'common/util/array'
import statement, { StageStatus } from '../statement'
import reportError from '../function/reportError'
import { KeyMetaExt, Struct, hasStruct } from '../struct'
import * as constant from '../constant'
import { CTypeEnum, CTypeEnum2Bytes, KeyMetaKey } from '../../typedef'
import { getEqualsBinaryExpressionRight, isPointerNode } from '../util/nodeutil'
import isMergeOperator from '../function/isMergeOperator'
import mergeOperator2Operator from '../function/mergeOperator2Operator'
import { BuiltinNumber } from '../defined'
import * as nodeUtils from '../util/nodeutil'
import * as typeUtils from '../util/typeutil'
import { compute } from '../function/compute'
import getStructMeta from '../function/getStructMeta'
import * as error from '../error'

function visitorLeft(node: ts.Node, visitor: ts.Visitor, operatorToken: ts.SyntaxKind): ts.Node {
  let push = false
  if (operatorToken === ts.SyntaxKind.EqualsToken) {
    statement.pushStage(StageStatus.EqualLeft)
    push = true
  }

  const newNode = ts.visitNode(node, visitor)

  if (push) {
    statement.popStage()
  }
  return newNode
}

function visitorRight(node: ts.Node, visitor: ts.Visitor, operatorToken: ts.SyntaxKind): ts.Node {
  let push = false
  if (operatorToken === ts.SyntaxKind.EqualsToken) {
    statement.pushStage(StageStatus.EqualRight)
    push = true
  }
  const newNode = ts.visitNode(node, visitor)

  if (push) {
    statement.popStage()
  }

  return newNode
}

function generateWritePropertyNode(address: ts.Expression, value: ts.Expression, meta: KeyMetaExt) {
  if (meta[KeyMetaKey.BitField]) {
    let mask1 = 0
    let len = CTypeEnum2Bytes[meta[KeyMetaKey.Type] as number] * 8
    for (let i = 0; i < meta[KeyMetaKey.BitFieldLength]; i++) {
      mask1 |= (1 << (len - 1 - (i + meta[KeyMetaKey.BaseBitOffset])))
    }
    let oldValue: ts.Expression = statement.context.factory.createCallExpression(
      statement.context.factory.createElementAccessExpression(
        statement.addMemoryImport(constant.ctypeEnumRead) as ts.Expression,
        meta[KeyMetaKey.Type] as number
      ),
      undefined,
      [
        address
      ]
    )
    const mask2 = (Math.pow(2, meta[KeyMetaKey.BitFieldLength]) - 1)
    const shift = len - meta[KeyMetaKey.BaseBitOffset] - meta[KeyMetaKey.BitFieldLength]

    value = statement.context.factory.createParenthesizedExpression(statement.context.factory.createBinaryExpression(
      value,
      ts.SyntaxKind.AmpersandToken,
      statement.context.factory.createNumericLiteral(mask2)
    ))

    value = statement.context.factory.createParenthesizedExpression(statement.context.factory.createBinaryExpression(
      value,
      ts.SyntaxKind.LessThanLessThanToken,
      statement.context.factory.createNumericLiteral(shift)
    ))

    oldValue = statement.context.factory.createParenthesizedExpression(statement.context.factory.createBinaryExpression(
      oldValue,
      ts.SyntaxKind.AmpersandToken,
      statement.context.factory.createPrefixUnaryExpression(
        ts.SyntaxKind.TildeToken,
        statement.context.factory.createNumericLiteral(mask1)
      )
    ))

    value = statement.context.factory.createBinaryExpression(
      oldValue,
      ts.SyntaxKind.BarToken,
      value
    )
  }

  return statement.context.factory.createCallExpression(
    statement.context.factory.createElementAccessExpression(
      statement.addMemoryImport(constant.ctypeEnumWrite) as ts.Expression,
      meta[KeyMetaKey.Pointer] ? CTypeEnum.pointer : meta[KeyMetaKey.Type] as number
    ),
    undefined,
    [
      address as ts.Expression,
      value
    ]
  )
}

function singleArrowVisitor(node: ts.BinaryExpression, visitor: ts.Visitor): ts.Node {
  if (ts.isPrefixUnaryExpression(node.right)) {
    if (node.parent && ts.isExpressionStatement(node.parent) && ((ts.isCallExpression(node.left)
      && (ts.isIdentifier(node.left.expression) && node.left.expression.escapedText === constant.accessof
        || ts.isPropertyAccessExpression(node.left.expression)
          && node.left.expression.name.escapedText === constant.indexOf
          && isPointerNode(node.left.expression.expression)
      ))
      || ts.isElementAccessExpression(node.left) && nodeUtils.isPointerElementAccess(node.left))
    ) {
      const type1 = statement.typeChecker.getTypeAtLocation(node.left)
      const type2 = statement.typeChecker.getTypeAtLocation(node.right.operand)

      if (typeUtils.isTypeEquals(type1, type2) || typeUtils.isPointerType(type1) && typeUtils.isNullPointer(type2)) {

        let left = ts.visitNode(statement.context.factory.createCallExpression(
          statement.context.factory.createIdentifier(constant.addressof),
          undefined,
          [
            node.left
          ]
        ), visitor)

        if (typeUtils.isStructType(type1)) {
          const struct = typeUtils.getStructByType(type1)

          statement.pushStage(StageStatus.SingleArrowRight)

          const right = ts.visitNode(statement.context.factory.createCallExpression(
            statement.context.factory.createIdentifier(constant.addressof),
            undefined,
            [
              node.right.operand
            ]
          ), visitor) as ts.Expression

          statement.popStage()

          return statement.context.factory.createCallExpression(
            statement.addMemoryImport(constant.memcpy),
            undefined,
            [
              left as ts.Expression,
              right,
              statement.context.factory.createNumericLiteral(struct.length)
            ]
          )
        }
        else if (typeUtils.isBuiltinType(type1)) {
          const type = typeUtils.getBuiltinByType(type1)
          statement.pushStage(StageStatus.SingleArrowRight)

          const right = ts.visitNode(
            node.right.operand,
            visitor
          ) as ts.Expression

          statement.popStage()

          return statement.context.factory.createCallExpression(
            statement.context.factory.createElementAccessExpression(
              statement.addMemoryImport(constant.ctypeEnumWrite),
              type
            ),
            undefined,
            [
              left as ts.Expression,
              right
            ]
          )
        }
        else {
          reportError(
            statement.currentFile,
            node,
            'operator \'<-\' only allowed between two builtin type or struct type'
          )
          return node
        }
      }
      else {
        reportError(statement.currentFile, node, 'The types on the left and right sides of the operator \'<-\' are not equal')
        return node
      }
    }
    else {

      const type1 = statement.typeChecker.getTypeAtLocation(node.left)
      const type2 = statement.typeChecker.getTypeAtLocation(node.right.operand)

      if (typeUtils.isStructType(type1) && typeUtils.isTypeEquals(type1, type2)) {
        const struct = typeUtils.getStructByType(type1)

        statement.pushStage(StageStatus.SingleArrowRight)

        const right = ts.visitNode(statement.context.factory.createCallExpression(
          statement.context.factory.createIdentifier(constant.addressof),
          undefined,
          [
            node.right.operand
          ]
        ), visitor) as ts.Expression

        statement.popStage()

        const left = ts.visitNode(statement.context.factory.createCallExpression(
          statement.context.factory.createIdentifier(constant.addressof),
          undefined,
          [
            node.left as ts.Expression
          ]
        ), visitor) as ts.Expression

        return statement.context.factory.createCallExpression(
          statement.addMemoryImport(constant.memcpy),
          undefined,
          [
            left,
            right,
            statement.context.factory.createNumericLiteral(struct.length)
          ]
        )
      }
    }
  }
  return ts.visitEachChild(node, visitor, statement.context)
}

function equalVisitor(node: ts.BinaryExpression, visitor: ts.Visitor): ts.Node {

  const leftType = statement.typeChecker.getTypeAtLocation(node.left)
  const rightType = statement.typeChecker.getTypeAtLocation(node.right)

  if (typeUtils.isPointerType(leftType)
      && typeUtils.isBuiltinType(rightType)
      && !typeUtils.isPointerType(rightType)
      && !typeUtils.isNullPointer(rightType)
    || typeUtils.isBuiltinType(leftType)
      && !typeUtils.isPointerType(leftType)
      && !typeUtils.isNullPointer(leftType)
      && typeUtils.isPointerType(rightType)
  ) {
    reportError(statement.currentFile, node, `type ${typeUtils.getBuiltinNameByType(leftType)} is not assignable to parameter of type ${typeUtils.getBuiltinNameByType(rightType)}`, error.TYPE_MISMATCH)
  }

  if (ts.isIdentifier(node.left) && ts.isIdentifier(node.right)) {
    return ts.visitEachChild(node, visitor, statement.context)
  }
  else {
    if (ts.isPropertyAccessExpression(node.left)
      && nodeUtils.isExpressionPointer(node.left)
      && ts.isObjectLiteralExpression(node.right)
      && typeUtils.isStructType(statement.typeChecker.getTypeAtLocation(node.left))
    ) {
      const list: ts.Expression[] = []

      const addr = ts.visitNode(statement.context.factory.createCallExpression(
        statement.context.factory.createIdentifier(constant.addressof),
        undefined,
        [
          node.left
        ]
      ), visitor) as ts.Expression

      function each(base: number, struct: Struct, properties: ts.NodeArray<ts.ObjectLiteralElementLike>) {
        properties.forEach((ele) => {
          if (ts.isPropertyAssignment(ele) && ts.isIdentifier(ele.name)) {
            const meta = getStructMeta(struct, ele.name.escapedText as string)
            if (ts.isObjectLiteralExpression(ele.initializer) && meta.getTypeMeta) {
              each(
                base + meta[KeyMetaKey.BaseAddressOffset],
                meta.getTypeMeta(),
                ele.initializer.properties
              )
            }
            else if (is.number(meta[KeyMetaKey.Type])) {
              list.push(generateWritePropertyNode(
                (ts.isBinaryExpression(addr)
                  && ts.isNumericLiteral(addr.right)
                  && addr.operatorToken.kind === ts.SyntaxKind.PlusToken)
                  ? statement.context.factory.createBinaryExpression(
                    addr.left,
                    ts.SyntaxKind.PlusToken,
                    statement.context.factory.createNumericLiteral((meta[KeyMetaKey.BaseAddressOffset] + base) + (+addr.right.text))
                  )
                  : statement.context.factory.createBinaryExpression(
                    addr,
                    ts.SyntaxKind.PlusToken,
                    statement.context.factory.createNumericLiteral(meta[KeyMetaKey.BaseAddressOffset] + base)
                  ),
                ele.initializer,
                meta
              ))
            }
            else {
              reportError(statement.currentFile, ele, 'struct found invalid property value')
            }
          }
          else {
            reportError(statement.currentFile, ele, 'struct found invalid property ')
          }
        })
      }

      each(0, typeUtils.getStructByType(statement.typeChecker.getTypeAtLocation(node.left)), node.right.properties)

      if (list.length === 0) {
        return undefined
      }
      if (list.length === 1) {
        return list[0]
      }
      else {
        let left = list[0]
        for (let i = 1; i < list.length; i++) {
          left = statement.context.factory.createBinaryExpression(
            left,
            ts.SyntaxKind.CommaToken,
            list[i]
          )
        }
        return left
      }
    }

    if (ts.isPropertyAccessExpression(node.left)
      || ts.isElementAccessExpression(node.left)
    ) {
      const hasPointer = nodeUtils.isExpressionPointer(node.left.expression as ts.Identifier)
      if (hasPointer) {
        const type1 = statement.typeChecker.getTypeAtLocation(node.left)
        const type2 = statement.typeChecker.getTypeAtLocation(node.right)

        statement.pushStage(StageStatus.AddressOf)
        const address = ts.visitNode(
          statement.context.factory.createCallExpression(
            statement.context.factory.createIdentifier(constant.addressof),
            undefined,
            [
              node.left as ts.Expression
            ]
          ),
          visitor
        ) as ts.Expression
        statement.popStage()
        if (typeUtils.isStructType(type1) && typeUtils.isTypeEquals(type1, type2)
          || type1.aliasSymbol && (
            type1.aliasSymbol.escapedName === constant.typeStruct
            || (type1.aliasSymbol.escapedName === constant.typeUnion)
          )
          && type1.aliasTypeArguments
          && type2.aliasTypeArguments
          && hasStruct(type1.aliasTypeArguments[0].symbol)
          && typeUtils.isTypeEquals(type1.aliasTypeArguments[0], type2.aliasTypeArguments[0])
        ) {
          const struct = typeUtils.getStructByType(type1)
          const valueAddress = ts.visitNode(
            statement.context.factory.createCallExpression(
              statement.context.factory.createIdentifier(constant.addressof),
              undefined,
              [
                node.right as ts.Expression
              ]
            ),
            visitor
          )
          return statement.context.factory.createCallExpression(
            statement.addMemoryImport(constant.memcpy),
            undefined,
            [
              address as ts.Expression,
              valueAddress as ts.Expression,
              statement.context.factory.createNumericLiteral(struct.length)
            ]
          )
        }
        else if (typeUtils.isBuiltinType(type1)
          || (type1.aliasSymbol
            && type1.aliasSymbol.escapedName === constant.typeBit
          )
          || (type1.symbol?.valueDeclaration
            && (
              ts.isEnumDeclaration(type1.symbol.valueDeclaration)
              || ts.isEnumMember(type1.symbol.valueDeclaration)
            )
          )
          || (type1.isUnion() && type1.types[0]?.symbol?.valueDeclaration
            && (ts.isEnumDeclaration(type1.types[0]?.symbol?.valueDeclaration)
              || ts.isEnumMember(type1.types[0]?.symbol?.valueDeclaration)
            )
          )
        ) {
          let newValue = visitorRight(node.right, visitor, node.operatorToken.kind) as ts.Expression

          if (ts.isPropertyAccessExpression(node.left)) {
            const type = statement.typeChecker.getTypeAtLocation(node.left.expression)
            const struct = typeUtils.getStructByType(type)

            if (struct === null) {
              reportError(statement.currentFile, node, `${node.left.expression.getText()} is not struct`)
              return node
            }

            const meta = getStructMeta(struct, node.left.name.escapedText as string)

            if (!meta) {
              reportError(statement.currentFile, node, `struct ${struct.symbol.escapedName} not has property ${node.left.name.escapedText}`)
              return node
            }
            return generateWritePropertyNode(address, newValue, meta)
          }
          else if (ts.isElementAccessExpression(node.left)) {
            if (typeUtils.isBuiltinType(type1)) {
              return statement.context.factory.createCallExpression(
                statement.context.factory.createElementAccessExpression(
                  statement.addMemoryImport(constant.ctypeEnumWrite) as ts.Expression,
                  typeUtils.getBuiltinByType(type1)
                ),
                undefined,
                [
                  address as ts.Expression,
                  newValue
                ]
              )
            }
          }
        }

      }
    }

    return statement.context.factory.createBinaryExpression(
      visitorLeft(node.left, visitor, node.operatorToken.kind) as ts.Expression,
      ts.SyntaxKind.EqualsToken,
      visitorRight(node.right, visitor, node.operatorToken.kind) as ts.Expression
    )
  }
}


export function handle(node: ts.BinaryExpression, visitor: ts.Visitor): ts.Node  {
  /**
   * 将多个等号变成逗号运算符
   */
  if ( node.operatorToken.kind === ts.SyntaxKind.EqualsToken
    && ts.isBinaryExpression(node.right)
    && node.right.operatorToken.kind === ts.SyntaxKind.EqualsToken
    && (isPointerNode(node.right)
      || isPointerNode(node.left)
    )
  ) {
    const right = getEqualsBinaryExpressionRight(node)
    let tree: ts.Node = statement.context.factory.createBinaryExpression(node.left, ts.SyntaxKind.EqualsToken, right)
    let next: ts.Node = node.right
    while (next && ts.isBinaryExpression(next) && next.operatorToken.kind === ts.SyntaxKind.EqualsToken) {
      tree = statement.context.factory.createBinaryExpression(
        tree as ts.Expression,
        ts.SyntaxKind.CommaToken,
        statement.context.factory.createBinaryExpression(next.left, ts.SyntaxKind.EqualsToken, right)
      )
      next = next.right
    }
    return ts.visitEachChild(tree, visitor, statement.context)
  }
  // 指针复合运算
  else if (isPointerNode(node.left) && isMergeOperator(node.operatorToken.kind)) {
    return ts.visitNode(
      statement.context.factory.createBinaryExpression(
        node.left,
        ts.SyntaxKind.EqualsToken,
        statement.context.factory.createBinaryExpression(
          node.left,
          mergeOperator2Operator(node.operatorToken.kind),
          node.right
        )
      ),
      visitor
    )
  }
  // 赋值运算
  else if (node.operatorToken.kind === ts.SyntaxKind.EqualsToken) {
    return equalVisitor(node, visitor)
  }
  // 单箭头运算
  else if (node.operatorToken.kind === ts.SyntaxKind.LessThanToken
    && ts.isPrefixUnaryExpression(node.right)
    && node.right.operator === ts.SyntaxKind.MinusToken
  ) {
    return singleArrowVisitor(node, visitor)
  }
  // 指针加减运算
  else if ((node.operatorToken.kind === ts.SyntaxKind.PlusToken || node.operatorToken.kind === ts.SyntaxKind.MinusToken)
    && !statement.lookupStage(StageStatus.PointerPlusMinusIgnore)
  ) {
    const type1 = statement.typeChecker.getTypeAtLocation(node.left)
    const type2 = statement.typeChecker.getTypeAtLocation(node.right)

    if (typeUtils.isPointerType(type1)
      && (ts.isNumericLiteral(node.right)
        || type2.flags & ts.TypeFlags.Number
        || array.has(BuiltinNumber, typeUtils.getBuiltinNameByType(type2))
      )
    ) {
      let step = 1

      if (typeUtils.isPointerStructType(type1)) {
        const struct = typeUtils.getPointerStructByType(type1)
        step = struct.length
      }
      else if (typeUtils.isPointerBuiltinType(type1)) {
        step = CTypeEnum2Bytes[typeUtils.getPointerBuiltinByType(type1)]
      }

      if (step > 1) {

        const right = visitorRight(node.right, visitor, node.operatorToken.kind) as ts.NumericLiteral

        return statement.context.factory.createBinaryExpression(
          visitorLeft(node.left, visitor, node.operatorToken.kind) as ts.Expression,
          node.operatorToken.kind,
          ts.isNumericLiteral(node.right)
            ? statement.context.factory.createNumericLiteral(+right.text * step)
            : statement.context.factory.createParenthesizedExpression(statement.context.factory.createBinaryExpression(
              right,
              ts.SyntaxKind.AsteriskToken,
              statement.context.factory.createNumericLiteral(step)
            ))
        )
      }
    }

    else if (typeUtils.isPointerType(type2)
      && (ts.isNumericLiteral(node.left)
        || type1.flags & ts.TypeFlags.Number
        || array.has(BuiltinNumber, type1.aliasSymbol?.escapedName)
      )
    ) {
      let step = 1

      if (typeUtils.isPointerBuiltinType(type2)) {
        step = CTypeEnum2Bytes[typeUtils.getPointerBuiltinByType(type2)]
      }
      else if (typeUtils.isPointerStructType(type2)) {
        const struct = typeUtils.getPointerStructByType(type2)
        step = struct.length
      }

      if (step > 1) {
        const left = visitorRight(node.left, visitor, node.operatorToken.kind) as ts.NumericLiteral

        return statement.context.factory.createBinaryExpression(
          ts.isNumericLiteral(node.right)
            ? statement.context.factory.createNumericLiteral(+left.text * step)
            : statement.context.factory.createParenthesizedExpression(statement.context.factory.createBinaryExpression(
              left,
              ts.SyntaxKind.AsteriskToken,
              statement.context.factory.createNumericLiteral(step)
            )),
          node.operatorToken.kind,
          visitorLeft(node.right, visitor, node.operatorToken.kind) as ts.Expression
        )
      }
    }
    else if (typeUtils.isPointerType(type1) && typeUtils.isPointerType(type2)) {
      if (node.operatorToken.kind === ts.SyntaxKind.MinusToken && typeUtils.isTypeEquals(type1, type2)) {

        let step = 1

        if (typeUtils.isPointerBuiltinType(type1)) {
          step = CTypeEnum2Bytes[typeUtils.getPointerBuiltinByType(type1)]
        }
        else if (typeUtils.isPointerStructType(type1)) {
          const struct = typeUtils.getPointerStructByType(type1)
          step = struct.length
        }
        if (step > 1) {
          if (step & (step - 1)) {
            return statement.context.factory.createBinaryExpression(
              statement.context.factory.createParenthesizedExpression(statement.context.factory.createBinaryExpression(
                statement.context.factory.createParenthesizedExpression(statement.context.factory.createBinaryExpression(
                  visitorLeft(node.left, visitor, node.operatorToken.kind) as ts.Expression,
                  node.operatorToken.kind,
                  visitorRight(node.right, visitor, node.operatorToken.kind) as ts.Expression
                )),
                ts.SyntaxKind.SlashToken,
                statement.context.factory.createNumericLiteral(step)
              )),
              ts.SyntaxKind.GreaterThanGreaterThanGreaterThanToken,
              statement.context.factory.createNumericLiteral(0)
            )
          }
          else {
            let exponent = 0
            while (step > 1) {
              exponent++
              step >>>= 1
            }
            return statement.context.factory.createBinaryExpression(
              statement.context.factory.createParenthesizedExpression(statement.context.factory.createBinaryExpression(
                visitorLeft(node.left, visitor, node.operatorToken.kind) as ts.Expression,
                node.operatorToken.kind,
                visitorRight(node.right, visitor, node.operatorToken.kind) as ts.Expression
              )),
              ts.SyntaxKind.GreaterThanGreaterThanGreaterThanToken,
              statement.context.factory.createNumericLiteral(exponent)
            )
          }
        }
      }
      else {
        reportError(statement.currentFile, node, 'The operation between two pointer types only allowed subtraction')
      }
    }
  }

  return ts.visitEachChild(node, visitor, statement.context)
}

function computeVisitor(node: ts.BinaryExpression): ts.Node {
  if (ts.isBinaryExpression(node)) {
    if (ts.isNumericLiteral(node.left) && ts.isNumericLiteral(node.right)) {
      const r = compute(+node.left.text, +node.right.text, node.operatorToken.kind)
      if (is.number(r)) {
        return statement.context.factory.createNumericLiteral(r)
      }
    }
    if (node.operatorToken.kind === ts.SyntaxKind.PlusToken) {
      if (ts.isNumericLiteral(node.right) && node.right.text === '0') {
        return node.left
      }
      else if (ts.isNumericLiteral(node.left) && node.left.text === '0') {
        return node.right
      }
    }
    if (node.operatorToken.kind === ts.SyntaxKind.MinusToken) {
      if (ts.isNumericLiteral(node.right) && node.right.text === '0') {
        return node.left
      }
    }
    if (node.operatorToken.kind === ts.SyntaxKind.AsteriskToken) {
      if (ts.isNumericLiteral(node.right) && node.right.text === '1') {
        return node.left
      }
      else if (ts.isNumericLiteral(node.left) && node.left.text === '1') {
        return node.right
      }
      if (ts.isNumericLiteral(node.right) && node.right.text === '0') {
        return node.right
      }
      else if (ts.isNumericLiteral(node.left) && node.left.text === '0') {
        return node.left
      }
    }
    if (node.operatorToken.kind === ts.SyntaxKind.SlashToken) {
      if (ts.isNumericLiteral(node.right) && node.right.text === '1') {
        return node.left
      }
      if (ts.isNumericLiteral(node.left) && node.left.text === '0') {
        return node.left
      }
    }
  }
  return ts.visitEachChild(node, computeVisitor, statement.context)
}

export default function (node: ts.BinaryExpression, visitor: ts.Visitor): ts.Node {
  let result = handle(node, visitor)
  return ts.isBinaryExpression(result) ? computeVisitor(result) : result
}
