
import ts from 'typescript'
import * as is from 'common/util/is'
import * as array from 'common/util/array'
import statement, { StageStatus } from '../statement'
import reportError from '../function/reportError'
import { CTypeEnum, CTypeEnum2Bytes, KeyMetaKey } from '../../typedef'
import relativePath from '../function/relativePath'
import * as nodeUtils from '../util/nodeutil'
import * as typeUtils from '../util/typeutil'
import * as constant from '../constant'
import { KeyMetaExt, StructType } from '../struct'
import getStructMeta from '../function/getStructMeta'
import { BuiltinBigInt, CTypeEnum2Type } from '../defined'

function createPlusExpress(tree: ts.Node, right: ts.Node) {
  // 合并 a + 2 + 3
  if (ts.isBinaryExpression(tree)
    && tree.operatorToken.kind === ts.SyntaxKind.PlusToken
    && (ts.isNumericLiteral(tree.right) || nodeUtils.isBigIntNode(tree.right)
      || ts.isNumericLiteral(tree.left) || nodeUtils.isBigIntNode(tree.left)
    )
    && (ts.isNumericLiteral(right) || nodeUtils.isBigIntNode(right))
  ) {
    if (ts.isNumericLiteral(tree.right)) {
      return statement.context.factory.createBinaryExpression(
        tree.left,
        ts.SyntaxKind.PlusToken,
        statement.context.factory.createNumericLiteral((+tree.right.text) + (+(right as ts.NumericLiteral).text))
      )
    }
    else if (nodeUtils.isBigIntNode(tree.right)) {
      return statement.context.factory.createBinaryExpression(
        tree.left,
        ts.SyntaxKind.PlusToken,
        nodeUtils.createBitInt(Number(nodeUtils.getBigIntValue(tree.right as ts.BigIntLiteral)
              + nodeUtils.getBigIntValue(right as ts.BigIntLiteral)))
      )
    }
    else if (ts.isNumericLiteral(tree.left)) {
      return statement.context.factory.createBinaryExpression(
        statement.context.factory.createNumericLiteral((+tree.left.text) + (+(right as ts.NumericLiteral).text)),
        ts.SyntaxKind.PlusToken,
        tree.right
      )
    }
    else if (nodeUtils.isBigIntNode(tree.left)) {
      return statement.context.factory.createBinaryExpression(
        nodeUtils.createBitInt(Number(nodeUtils.getBigIntValue(tree.left as ts.BigIntLiteral)
              + nodeUtils.getBigIntValue(right as ts.BigIntLiteral))),
        ts.SyntaxKind.PlusToken,
        tree.right
      )
    }
  }
  return statement.context.factory.createBinaryExpression(
    tree as ts.Expression,
    ts.SyntaxKind.PlusToken,
    nodeUtils.createPointerOperand(right as ts.Expression)
  )
}

function handleMeta(node: ts.Node, tree: ts.Node, meta: KeyMetaExt) {
  if (meta[KeyMetaKey.Pointer]) {
    tree = statement.context.factory.createCallExpression(
      statement.context.factory.createElementAccessExpression(
        statement.addMemoryImport(constant.ctypeEnumRead),
        CTypeEnum.pointer
      ),
      undefined,
      [
        meta[KeyMetaKey.BaseAddressOffset]
          ? createPlusExpress(
            tree as ts.Expression,
            nodeUtils.createPointerOperand(meta[KeyMetaKey.BaseAddressOffset])
          )
          : tree as ts.Expression
      ]
    )
    return tree
  }
  else if (is.number(meta[KeyMetaKey.Type]) && !is.func(meta.getTypeMeta)) {
    tree = statement.context.factory.createCallExpression(
      statement.context.factory.createElementAccessExpression(
        statement.addMemoryImport(constant.ctypeEnumRead),
        meta[KeyMetaKey.Type] as number
      ),
      undefined,
      [
        meta[KeyMetaKey.BaseAddressOffset]
          ? createPlusExpress(
            tree as ts.Expression,
            nodeUtils.createPointerOperand(meta[KeyMetaKey.BaseAddressOffset])
          )
          : tree as ts.Expression
      ]
    )

    if (meta[KeyMetaKey.BitField] && !statement.lookupStage(StageStatus.AddressOf)) {
      const shift = CTypeEnum2Bytes[meta[KeyMetaKey.Type] as number] * 8 - meta[KeyMetaKey.BaseBitOffset] - meta[KeyMetaKey.BitFieldLength]
      let isBigInt = array.has(BuiltinBigInt, CTypeEnum2Type[meta[KeyMetaKey.Type]])
      if (statement.cheapCompilerOptions.defined.WASM_64) {
        if (meta[KeyMetaKey.Type] === CTypeEnum.pointer
          || meta[KeyMetaKey.Type] === CTypeEnum.size
        ) {
          isBigInt = true
        }
      }
      const mask = Math.pow(2, meta[KeyMetaKey.BitFieldLength]) - 1
      tree = statement.context.factory.createBinaryExpression(
        statement.context.factory.createParenthesizedExpression(statement.context.factory.createBinaryExpression(
          tree as ts.Expression,
          ts.SyntaxKind.GreaterThanGreaterThanGreaterThanToken,
          isBigInt
            ? nodeUtils.createBitInt(shift)
            : statement.context.factory.createNumericLiteral(shift)
        )),
        ts.SyntaxKind.AmpersandToken,
        isBigInt
          ? nodeUtils.createBitInt(shift)
          : statement.context.factory.createNumericLiteral(mask)
      )
    }

    return tree
  }
  else if (is.func(meta.getTypeMeta)) {
    const targetStruct = meta.getTypeMeta()

    let targetSymbol = targetStruct.symbol
    let targetPath = ''

    if (targetStruct.structType === StructType.INLINE_OBJECT) {
      targetSymbol = targetStruct.definedClassParent.symbol
      targetPath = targetStruct.definedClassParent.inlineStructPathMap.get(targetStruct.symbol)
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
        meta[KeyMetaKey.BaseAddressOffset]
          ? createPlusExpress(
            tree as ts.Expression,
            nodeUtils.createPointerOperand(meta[KeyMetaKey.BaseAddressOffset])
          )
          : tree as ts.Expression,
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
  else {
    reportError(statement.currentFile, node, 'struct type mismatch')
    return node
  }
}

export default function (node: ts.PropertyAccessExpression, visitor: ts.Visitor): ts.Node {
  if (nodeUtils.isPointerNode(node)
    && !(array.has(constant.smartPointerProperty, node.name.escapedText as string) && nodeUtils.isSmartPointerNode(node.expression))
  ) {
    if (statement.getCurrentStage()?.stage !== StageStatus.EqualLeft) {
      let root: ts.Node = nodeUtils.getPropertyAccessExpressionRootNode(node)
      let tree: ts.Node = root

      let next = root.parent as ts.PropertyAccessExpression | ts.CallExpression | ts.ElementAccessExpression
      let lastIsIndexOf = false
      let hasPointerIndex = nodeUtils.isPointerNode(root)

      while (next !== node) {
        const type = statement.typeChecker.getTypeAtLocation(root)
        if (lastIsIndexOf
          || typeUtils.isPointerType(type, root)
          || typeUtils.isSmartPointerType(type)
          || type.aliasSymbol?.escapedName === constant.typeArray
        ) {
          let struct = lastIsIndexOf
            ? typeUtils.getStructByType(type)
            : (
              typeUtils.isSmartPointerType(type)
                ? typeUtils.getSmartPointerStructByType(type)
                : (
                  typeUtils.isPointerType(type, root)
                    ? typeUtils.getPointerStructByType(type, root)
                    : (
                      typeUtils.isPointerType(type.aliasTypeArguments[0], null)
                        ? null
                        : typeUtils.getStructByType(type.aliasTypeArguments[0])
                    )
                )
            )

          if (struct) {
            if (ts.isPropertyAccessExpression(next)) {
              if (ts.isCallExpression(next.parent)) {
                next = next.parent as ts.PropertyAccessExpression | ts.CallExpression | ts.ElementAccessExpression
                continue
              }
              else {
                const meta = getStructMeta(struct, next.name.escapedText as string)

                if (!meta) {
                  reportError(statement.currentFile, node, `struct ${struct.symbol.escapedName} not has property ${next.name.escapedText}`)
                  return node
                }

                if (typeUtils.isSmartPointerType(type)) {
                  tree = statement.context.factory.createCallExpression(
                    statement.context.factory.createPropertyAccessExpression(
                      tree as ts.Expression,
                      statement.context.factory.createIdentifier('get')
                    ),
                    undefined,
                    []
                  )
                }

                if (meta[KeyMetaKey.Pointer] && !meta[KeyMetaKey.Array]) {
                  tree = statement.context.factory.createCallExpression(
                    statement.context.factory.createElementAccessExpression(
                      statement.addMemoryImport(constant.ctypeEnumRead) as ts.Expression,
                      CTypeEnum.pointer
                    ),
                    undefined,
                    [
                      meta[KeyMetaKey.BaseAddressOffset]
                        ? createPlusExpress(
                          tree,
                          nodeUtils.createPointerOperand(meta[KeyMetaKey.BaseAddressOffset])
                        )
                        : tree as ts.Expression
                    ]
                  )
                }
                else if (meta[KeyMetaKey.BaseAddressOffset]) {
                  tree = createPlusExpress(
                    tree as ts.Expression,
                    nodeUtils.createPointerOperand(meta[KeyMetaKey.BaseAddressOffset])
                  )
                }
              }
              lastIsIndexOf = false
            }
            else if (ts.isCallExpression(next)) {
              if (ts.isNumericLiteral(next.arguments[0]) && +next.arguments[0].text !== 0) {
                tree = createPlusExpress(
                  tree as ts.Expression,
                  nodeUtils.createPointerOperand(+next.arguments[0].text * struct.length)
                )
              }
              else if (!ts.isNumericLiteral(next.arguments[0])) {
                tree = statement.context.factory.createBinaryExpression(
                  tree as ts.Expression,
                  ts.SyntaxKind.PlusToken,
                  nodeUtils.createPointerOperand(statement.context.factory.createBinaryExpression(
                    next.arguments[0],
                    ts.SyntaxKind.AsteriskToken,
                    statement.context.factory.createNumericLiteral(struct.length)
                  ))
                )
              }
              lastIsIndexOf = true
              hasPointerIndex = true
            }
            else if (ts.isElementAccessExpression(next)) {
              if (ts.isNumericLiteral(next.argumentExpression) && +next.argumentExpression.text !== 0) {
                tree = createPlusExpress(
                  tree as ts.Expression,
                  nodeUtils.createPointerOperand(+next.argumentExpression.text * struct.length)
                )
              }
              else if (!ts.isNumericLiteral(next.argumentExpression)) {
                tree = statement.context.factory.createBinaryExpression(
                  tree as ts.Expression,
                  ts.SyntaxKind.PlusToken,
                  nodeUtils.createPointerOperand(statement.context.factory.createBinaryExpression(
                    next.argumentExpression,
                    ts.SyntaxKind.AsteriskToken,
                    statement.context.factory.createNumericLiteral(struct.length)
                  ))
                )
              }
              lastIsIndexOf = true
              hasPointerIndex = true
            }
          }
          // [] 操作
          else if ((type.aliasSymbol?.escapedName === constant.typeArray || typeUtils.isPointerType(type, root))
            && typeUtils.isPointerType(type.aliasTypeArguments[0], null)
            && ts.isElementAccessExpression(next)
          ) {
            if (ts.isNumericLiteral(next.argumentExpression) && +next.argumentExpression.text !== 0) {
              tree = createPlusExpress(
                tree as ts.Expression,
                nodeUtils.createPointerOperand(+next.argumentExpression.text * CTypeEnum2Bytes[CTypeEnum.pointer])
              )
            }
            else if (!ts.isNumericLiteral(next.argumentExpression)) {
              tree = statement.context.factory.createBinaryExpression(
                tree as ts.Expression,
                ts.SyntaxKind.PlusToken,
                nodeUtils.createPointerOperand(statement.context.factory.createBinaryExpression(
                  next.argumentExpression,
                  ts.SyntaxKind.AsteriskToken,
                  statement.context.factory.createNumericLiteral(CTypeEnum2Bytes[CTypeEnum.pointer])
                ))
              )
            }

            tree = statement.context.factory.createCallExpression(
              statement.context.factory.createElementAccessExpression(
                statement.addMemoryImport(constant.ctypeEnumRead) as ts.Expression,
                CTypeEnum.pointer
              ),
              undefined,
              [
                tree as ts.Expression
              ]
            )
            hasPointerIndex = true
          }
          // 指针的 indexOf
          else if (typeUtils.isPointerType(type, root)
            && ts.isPropertyAccessExpression(next) && next.name.escapedText === constant.indexOf
            && ts.isCallExpression(next.parent)
          ) {
            next = next.parent as ts.CallExpression

            let step = 0
            if (typeUtils.isPointerType(type.aliasTypeArguments[0], null)) {
              step = CTypeEnum2Bytes[CTypeEnum.pointer]
            }
            else {
              const struct = typeUtils.getStructByType(type.aliasTypeArguments[0])
              if (struct) {
                step = struct.length
              }
              else {
                reportError(statement.currentFile, node, 'the pointer type only allowed in builtin type or struct type')
                return node
              }
            }

            if (ts.isNumericLiteral(next.arguments[0]) && +next.arguments[0].text !== 0) {
              tree = createPlusExpress(
                tree as ts.Expression,
                nodeUtils.createPointerOperand(+next.arguments[0].text * step)
              )
            }
            else if (!ts.isNumericLiteral(next.arguments[0])) {
              tree = statement.context.factory.createBinaryExpression(
                tree as ts.Expression,
                ts.SyntaxKind.PlusToken,
                nodeUtils.createPointerOperand(statement.context.factory.createBinaryExpression(
                  next.arguments[0],
                  ts.SyntaxKind.AsteriskToken,
                  statement.context.factory.createNumericLiteral(step)
                ))
              )
            }
            // 二级指针
            if (typeUtils.isPointerType(type.aliasTypeArguments[0], null)) {
              tree = statement.context.factory.createCallExpression(
                statement.context.factory.createElementAccessExpression(
                  statement.addMemoryImport(constant.ctypeEnumRead) as ts.Expression,
                  CTypeEnum.pointer
                ),
                undefined,
                [
                  tree as ts.Expression
                ]
              )
            }

            lastIsIndexOf = true
            hasPointerIndex = true
          }
          else {
            reportError(statement.currentFile, node, 'invalid pointer operate')
            return node
          }
        }
        else {
          let struct = typeUtils.getStructByType(type)
          // pointer.struct.xx
          if (struct && hasPointerIndex && ts.isPropertyAccessExpression(next)) {
            const meta = getStructMeta(struct, next.name.escapedText as string)

            if (!meta) {
              reportError(statement.currentFile, node, `struct ${struct.symbol.escapedName} not has property ${next.name.escapedText}`)
              return node
            }

            if (meta[KeyMetaKey.Pointer] && !meta[KeyMetaKey.Array]) {
              tree = statement.context.factory.createCallExpression(
                statement.context.factory.createElementAccessExpression(
                  statement.addMemoryImport(constant.ctypeEnumRead) as ts.Expression,
                  CTypeEnum.pointer
                ),
                undefined,
                [
                  meta[KeyMetaKey.BaseAddressOffset]
                    ? createPlusExpress(
                      tree,
                      nodeUtils.createPointerOperand(meta[KeyMetaKey.BaseAddressOffset])
                    )
                    : tree as ts.Expression
                ]
              )
            }
            else if (meta[KeyMetaKey.BaseAddressOffset]) {
              tree = createPlusExpress(
                tree as ts.Expression,
                nodeUtils.createPointerOperand(meta[KeyMetaKey.BaseAddressOffset])
              )
            }
            lastIsIndexOf = false
          }
          else {
            tree = next
          }
        }
        root = next
        next = next.parent as ts.PropertyAccessExpression | ts.CallExpression | ts.ElementAccessExpression
      }

      if (!nodeUtils.isPointerNode(root) && !hasPointerIndex) {
        return node
      }

      const type = statement.typeChecker.getTypeAtLocation(root)
      let struct = typeUtils.isPointerType(type, root) ? typeUtils.getPointerStructByType(type, root) : typeUtils.getStructByType(type)

      if (!struct) {
        reportError(statement.currentFile, node, 'struct type mismatch')
        return node
      }

      const meta = getStructMeta(struct, node.name.escapedText as string)

      if (!meta) {
        reportError(statement.currentFile, node, `struct ${struct.symbol.escapedName} not has property ${node.name.escapedText}`)
        return node
      }

      statement.pushStage(StageStatus.PointerPlusMinusIgnore)
      tree = ts.visitNode(tree, visitor)
      statement.popStage()

      return handleMeta(node, tree, meta)
    }
  }
  else if (nodeUtils.isSmartPointerNode(node)) {
    const expressionType = statement.typeChecker.getTypeAtLocation(node.expression)
    if (typeUtils.isSmartPointerType(expressionType)
      && ts.isIdentifier(node.name)
      && !array.has(constant.smartPointerProperty, node.name.escapedText as string)
      && expressionType.aliasTypeArguments?.length === 1
    ) {
      const struct = typeUtils.getStructByType(expressionType)
      if (!struct) {
        reportError(statement.currentFile, node, 'struct type mismatch')
        return node
      }

      const meta = getStructMeta(struct, node.name.escapedText as string)

      if (!meta) {
        reportError(statement.currentFile, node, `struct ${struct.symbol.escapedName} not has property ${node.name.escapedText}`)
        return node
      }

      let tree = ts.visitNode(node.expression, visitor)

      tree = statement.context.factory.createCallExpression(
        statement.context.factory.createPropertyAccessExpression(
          tree as ts.Expression,
          statement.context.factory.createIdentifier('get')
        ),
        undefined,
        []
      )

      return handleMeta(node, tree, meta)
    }
  }
  return ts.visitEachChild(node, visitor, statement.context)
}
