
import ts from 'typescript'
import * as is from 'common/util/is'
import * as array from 'common/util/array'
import statement from '../statement'
import { BuiltinBigInt, BuiltinFloat, BuiltinNumber, BuiltinUint, Type2CTypeEnum } from '../defined'
import reportError from '../function/reportError'
import { CTypeEnum, CTypeEnum2Bytes, KeyMetaKey } from '../../typedef'
import { Struct, StructType, getStruct, hasStruct } from '../struct'
import { isPointerNode } from '../util/nodeutil'
import relativePath from '../function/relativePath'
import isDef from 'common/function/isDef'
import * as constant from '../constant'
import * as nodeUtils from '../util/nodeutil'
import * as typeUtils from '../util/typeutil'
import toString from 'common/function/toString'
import getStructMeta from '../function/getStructMeta'

function definedReplace(name: string, node: ts.Node) {
  if (name === constant.LINE || name === constant.LINE_2) {
    const { line } = ts.getLineAndCharacterOfPosition(statement.currentFile, node.getStart())
    return statement.context.factory.createNumericLiteral(line + 1)
  }
  else if (name === constant.FILE || name === constant.FILE_2) {
    const { formatName } = statement.addModuleDeclaration('fileName', statement.context.factory.createStringLiteral(statement.currentFilePath))
    return statement.context.factory.createIdentifier(formatName)
  }
  else if (isDef(statement.cheapCompilerOptions.defined[name])) {
    const value = statement.cheapCompilerOptions.defined[name]
    if (is.boolean(value)) {
      return value ? statement.context.factory.createTrue() : statement.context.factory.createFalse()
    }
    else if (is.number(value)) {
      return statement.context.factory.createNumericLiteral(value)
    }
    else if (is.string(value)) {
      return statement.context.factory.createStringLiteral(value)
    }
    else if (node) {
      reportError(statement.currentFile, node, `the type(${typeof value}) of defined not support`)
      return node
    }
  }
  else if (node) {
    reportError(statement.currentFile, node, `cannot found the defined(${name})`)
    return node
  }
}

function definedString(name: string, node: ts.Node) {
  if (name === constant.LINE || name === constant.LINE_2) {
    const { line } = ts.getLineAndCharacterOfPosition(statement.currentFile, node.getStart())
    return toString(line + 1)
  }
  else if (name === constant.FILE || name === constant.FILE_2) {
    return statement.currentFilePath
  }
  else if (isDef(statement.cheapCompilerOptions.defined[name])) {
    const value = statement.cheapCompilerOptions.defined[name]
    return toString(value, '')
  }
  return ''
}

function hasTypeArgs(args: ts.NodeArray<ts.TypeParameterDeclaration>) {
  if (!args) {
    return false
  }
  for (let i = 0; i < args.length; i++) {
    const node = args[i]
    if (node.name.escapedText === constant.args) {
      return true
    }
  }

  return false
}

function getTypeArgs(target: ts.NodeArray<ts.TypeParameterDeclaration>, sig: ts.NodeArray<ts.TypeNode>) {
  let index = -1
  for (let i = 0; i < target.length; i++) {
    const node = target[i]
    if (node.name.escapedText === constant.args) {
      index = i
      break
    }
  }

  if (index > -1) {
    return sig[index]
  }
}

function isArgsEnable(target: ts.NodeArray<ts.TypeParameterDeclaration>, sig: ts.NodeArray<ts.TypeNode>, call: ts.CallExpression) {
  for (let i = 0; i < target.length; i++) {
    const node = target[i]
    if (node.name.escapedText === constant.enableArgs && node.default) {
      const args: ts.Node[] = []
      addArgs(args, sig[i], call)
      if (args[0].kind === ts.SyntaxKind.FalseKeyword
        || ts.isStringLiteral(args[0]) && args[0].text === ''
        || ts.isNumericLiteral(args[0]) && args[0].text === '0'
      ) {
        return false
      }
      break
    }
  }
  return true
}

function addArgs(args: ts.Node[], node: ts.Node, call: ts.CallExpression) {
  if (ts.isTypeReferenceNode(node)) {
    // @ts-ignore
    if (ts.isIdentifier(node.typeName) && node.typeName.symbol) {
      // @ts-ignore
      const type = statement.typeChecker.getTypeOfSymbol(node.typeName.symbol)
      if (typeUtils.isBuiltinType(type)) {
        args.push(statement.context.factory.createNumericLiteral(typeUtils.getBuiltinByType(type)))
      }
      else if (type.aliasSymbol) {
        const name = type.aliasSymbol.escapedName as string
        args.push(statement.context.factory.createIdentifier(name))
      }
      else if (type.symbol && type.symbol.valueDeclaration && ts.isClassDeclaration(type.symbol.valueDeclaration)) {
        let key: ts.Expression
        const targetSource = type.symbol.valueDeclaration?.getSourceFile()
        if (targetSource !== statement.currentFile) {
          key = statement.addIdentifierImport(
            type.symbol.escapedName as string,
            relativePath(statement.currentFile.fileName, targetSource.fileName),
            !statement.typeChecker.getSymbolAtLocation(targetSource).exports?.has(type.symbol.escapedName)
          )
        }
        else {
          key = statement.context.factory.createIdentifier(type.symbol.escapedName as string)
        }
        args.push(key)
      }
      else {
        args.push(statement.context.factory.createIdentifier(type.symbol.escapedName as string))
      }
    }
    else {
      args.push(statement.context.factory.createIdentifier('undefined'))
    }
  }
  else if (ts.isLiteralTypeNode(node)) {
    if (ts.isNumericLiteral(node.literal)) {
      args.push(statement.context.factory.createNumericLiteral(+node.literal.text))
    }
    else if (ts.isStringLiteral(node.literal)) {
      if (/^defined\(([a-zA-Z_$][a-zA-Z0-9_$]*)\)$/.test(node.literal.text)) {
        const match = node.literal.text.match(/^defined\(([a-zA-Z_$][a-zA-Z0-9_$]*)\)$/)
        const newNode = definedReplace(match[1], call)
        if (newNode) {
          args.push(newNode)
        }
        else {
          args.push(statement.context.factory.createIdentifier('undefined'))
        }
      }
      else if (/^moduleId\(([0-9]+)\)$/.test(node.literal.text)) {
        const match = node.literal.text.match(/^moduleId\(([0-9]+)\)$/)
        const index = +match[1]
        const arg = call.arguments[index]
        if (arg) {
          const type = statement.typeChecker.getTypeAtLocation(arg)
          const targetSource = type.symbol.valueDeclaration?.getSourceFile()
          if (targetSource) {

            const callType = statement.typeChecker.getTypeAtLocation(call.expression)
            const callPath = callType?.symbol?.valueDeclaration?.getSourceFile().fileName

            if (statement.cheapCompilerOptions.defined.ENABLE_THREADS
              && statement.cheapCompilerOptions.defined.ENABLE_THREADS_SPLIT
              && callPath.indexOf(constant.cheapThreadPath) >= 0
              && (
                callType.symbol.escapedName === constant.createThreadFromClass
                  || callType.symbol.escapedName === constant.createThreadFromFunction
                  || callType.symbol.escapedName === constant.createThreadFromModule
              )
            ) {
              const initType = callType.symbol.escapedName === constant.createThreadFromClass
                ? 'class'
                : ( callType.symbol.escapedName === constant.createThreadFromModule ? 'module' : 'function')

              let point = ts.isIdentifier(call.arguments[0]) ? call.arguments[0].escapedText
                : (ts.isPropertyAccessExpression(call.arguments[0]) ? call.arguments[0].name.escapedText : 'unknown')

              if (initType === 'class' || initType === 'function') {
                let type: ts.Type
                if (ts.isIdentifier(call.arguments[0])) {
                  type = statement.typeChecker.getTypeAtLocation(call.arguments[0])
                }
                else if (ts.isPropertyAccessExpression(call.arguments[0])) {
                  type = statement.typeChecker.getTypeAtLocation(call.arguments[0].name)
                }
                if (type?.symbol?.valueDeclaration) {
                  if (ts.isClassDeclaration(type.symbol.valueDeclaration)) {
                    if (type.symbol.valueDeclaration.name) {
                      point = type.symbol.valueDeclaration.name.escapedText
                    }
                    else {
                      reportError(statement.currentFile, node, 'The thread class must have a class name')
                      return node
                    }
                  }
                  else if (ts.isFunctionDeclaration(type.symbol.valueDeclaration)) {
                    if (type.symbol.valueDeclaration.name) {
                      point = type.symbol.valueDeclaration.name.escapedText
                    }
                    else {
                      reportError(statement.currentFile, node, 'The thread function must has a function name')
                      return node
                    }
                  }
                }
              }

              let name = `${point}Thread`

              if (call.arguments[1] && ts.isObjectLiteralExpression(call.arguments[1])) {
                call.arguments[1].properties.forEach((node) => {
                  if (ts.isPropertyAssignment(node) && ts.isIdentifier(node.name) && node.name.escapedText === 'name') {
                    let text = node.initializer.getText()
                    if (text) {
                      text = text.replace(/^['|"]/, '')
                      text = text.replace(/['|"]$/, '')

                      if (text) {
                        name = text
                      }
                    }
                  }
                })
              }
              const loader = `cheap-worker-loader?type=${initType}&point=${point}&name=${name}`
              const identifier = statement.addIdentifierImport('worker', `${loader}!${relativePath(statement.currentFile.fileName, targetSource.fileName)}`, true)
              args.push(statement.context.factory.createNewExpression(
                identifier,
                undefined,
                []
              ))
            }
            else {
              args.push(statement.context.factory.createCallExpression(
                statement.context.factory.createPropertyAccessExpression(
                  statement.context.factory.createIdentifier('require'),
                  statement.context.factory.createIdentifier('resolve')
                ),
                undefined,
                [
                  statement.context.factory.createStringLiteral(relativePath(statement.currentFile.fileName, targetSource.fileName))
                ]
              ))
            }
          }
        }
      }
      else {
        let text = node.literal.text.replace(/defined\(([a-zA-Z_$][a-zA-Z0-9_$]*)\)/g, (s1: string, s2: string) => {
          return definedString(s2, call)
        })
        args.push(statement.context.factory.createStringLiteral(text))
      }
    }
    else if (node.literal.kind === ts.SyntaxKind.TrueKeyword) {
      args.push(statement.context.factory.createTrue())
    }
    else if (node.literal.kind === ts.SyntaxKind.FalseKeyword) {
      args.push(statement.context.factory.createFalse())
    }
  }
}

function accessCType(pointer: ts.Node, type: CTypeEnum) {
  return statement.context.factory.createCallExpression(
    statement.context.factory.createElementAccessExpression(
      statement.addMemoryImport(constant.ctypeEnumRead) as ts.Expression,
      type
    ),
    undefined,
    [
      pointer as ts.Expression
    ]
  )
}

function accessStruct(pointer: ts.Node, struct: Struct) {

  const targetStruct = struct
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
      pointer as ts.Expression,
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

function getTypeSize(nameType: ts.Type) {
  if (typeUtils.isStructType(nameType)) {
    const struct = typeUtils.getStructByType(nameType)
    if (struct) {
      return struct.length
    }
  }
  else if (typeUtils.isBuiltinType(nameType)) {
    return CTypeEnum2Bytes[typeUtils.getBuiltinByType(nameType)]
  }
  else if (nameType.aliasSymbol) {
    const type = nameType.aliasSymbol.escapedName as string
    if (type === constant.typeArray && nameType.aliasTypeArguments[1]?.isNumberLiteral()) {
      return getTypeSize(nameType.aliasTypeArguments[0]) * nameType.aliasTypeArguments[1].value
    }
    else if (type === constant.typeBit && nameType.aliasTypeArguments[1]?.isNumberLiteral()) {
      return nameType.aliasTypeArguments[1].value
    }
  }
  return 0
}

export default function (node: ts.CallExpression, visitor: ts.Visitor): ts.Node {
  let callName: string = ''
  if (ts.isIdentifier(node.expression)) {
    callName = node.expression.escapedText as string
  }
  else if (ts.isPropertyAccessExpression(node.expression)) {
    callName = node.expression.name.escapedText as string
  }

  const signature = statement.typeChecker.getResolvedSignature(node)
  const target = signature?.getDeclaration()
  if (target && hasTypeArgs(target.typeParameters)) {
    const sig = statement.typeChecker.signatureToSignatureDeclaration(
      signature,
      ts.SyntaxKind.CallSignature,
      nodeUtils.getParseTreeNode(nodeUtils.getContainerNode(node)),
      ts.NodeBuilderFlags.WriteTypeArgumentsOfSignature
        | ts.NodeBuilderFlags.IgnoreErrors
        | ts.NodeBuilderFlags.WriteTypeParametersInQualifiedName
        | ts.NodeBuilderFlags.UseAliasDefinedOutsideCurrentScope
        | ts.NodeBuilderFlags.MultilineObjectLiterals
        | ts.NodeBuilderFlags.OmitParameterModifiers
    )
    if (sig?.typeArguments) {
      const typeNode = getTypeArgs(target.typeParameters, sig.typeArguments)
      if (typeNode && isArgsEnable(target.typeParameters, sig.typeArguments, node)) {
        const args: ts.Expression[] = []

        let padding = (target.parameters?.length || 0) - node.arguments.length
        while (padding > 0) {
          args.push(nodeUtils.getParameterDefaultValue(
            statement.typeChecker.getSymbolAtLocation(target.name),
            node.arguments.length + args.length
          ) ?? statement.context.factory.createIdentifier('undefined'))
          padding--
        }

        if (ts.isTupleTypeNode(typeNode)) {
          typeNode.elements.forEach((item) => {
            if (padding < 0) {
              padding++
            }
            else {
              addArgs(args, item, node)
            }
          })
        }
        else {
          if (padding < 0) {
            padding++
          }
          else {
            addArgs(args, typeNode, node)
          }
        }
        return ts.visitNode(statement.context.factory.createCallExpression(
          node.expression,
          undefined,
          [
            ...node.arguments,
            ...args
          ]
        ), visitor)
      }
    }
  }

  // 全局函数
  if (ts.isIdentifier(node.expression)) {
    if (callName === constant.sizeof && !statement.lookupFunc(constant.sizeof)) {
      const arg = node.arguments[0]

      let nameType: ts.Type = statement.typeChecker.getTypeAtLocation(arg)

      if (nameType) {
        const size = getTypeSize(nameType)
        if (size) {
          return statement.context.factory.createNumericLiteral(size)
        }
        else {
          return statement.context.factory.createCallExpression(
            statement.addIdentifierImport(constant.sizeof, constant.sizeofPath, true),
            undefined,
            node.arguments
          )
        }
      }
    }
    else if (callName === constant.addressof && !statement.lookupFunc(constant.addressof)) {
      const arg = node.arguments[0]
      if (ts.isCallExpression(arg)
      // addressof(accessof(p))
        && (ts.isIdentifier(arg.expression) && arg.expression.escapedText === constant.accessof
          // addressof(CTypeEnumRead[type](p))
          || ts.isElementAccessExpression(arg.expression)
            && ts.isIdentifier(arg.expression.expression)
            && statement.isIdentifier(arg.expression.expression.escapedText as string, constant.ctypeEnumRead)
          // addressof(structAccess(p, A))
          || ts.isIdentifier(arg.expression) && statement.isIdentifier(arg.expression.escapedText as string, constant.structAccess)
        )
      ) {
        return ts.visitNode(arg.arguments[0], visitor)
      }

      // addressof(struct)
      if (ts.isIdentifier(arg)) {
        // 只支持 struct 取地址
        if (!hasStruct(statement.typeChecker.getTypeAtLocation(arg)?.symbol)) {
          reportError(statement.currentFile, arg, 'addressof only support with struct instance Identifier')
          return node
        }
        return statement.context.factory.createElementAccessExpression(
          ts.visitNode(arg, visitor) as ts.Expression,
          statement.addSymbolImport(constant.symbolStructAddress)
        )
      }
      // addressof(struct.p)
      else if (ts.isPropertyAccessExpression(arg)
        || ts.isCallExpression(arg) && nodeUtils.isPointerIndexOfCall(arg)
        // pointer[x]
        || ts.isElementAccessExpression(arg) && typeUtils.isPointerType(statement.typeChecker.getTypeAtLocation(arg.expression))
      ) {
        const newArg = ts.visitNode(arg, visitor) as ts.Expression
        if (ts.isCallExpression(newArg)
          && (ts.isIdentifier(newArg.expression)
              && statement.isIdentifier(newArg.expression.escapedText as string, constant.structAccess)
            || ts.isPropertyAccessExpression(newArg.expression)
              && statement.isIdentifier(newArg.expression.name.escapedText as string, constant.structAccess)
          )
        ) {
          return newArg.arguments[0]
        }
        else if (ts.isCallExpression(newArg)
          && ts.isElementAccessExpression(newArg.expression)
          && (ts.isIdentifier(newArg.expression.expression)
              && statement.isIdentifier(newArg.expression.expression.escapedText as string, constant.ctypeEnumRead)
            || ts.isPropertyAccessExpression(newArg.expression.expression)
              && statement.isIdentifier(newArg.expression.expression.name.escapedText as string, constant.ctypeEnumRead)
          )
        ) {
          return newArg.arguments[0]
        }
        else if (ts.isPropertyAccessExpression(newArg)) {
          let type = statement.typeChecker.getTypeAtLocation(arg.expression)
          let struct = typeUtils.getStructByType(type)

          if (!struct) {
            type = statement.typeChecker.getTypeAtLocation(arg)
            struct = typeUtils.getStructByType(type)
            if (struct) {
              return statement.context.factory.createElementAccessExpression(
                newArg as ts.Expression,
                statement.addSymbolImport(constant.symbolStructAddress)
              )
            }
            reportError(statement.currentFile, arg, 'addressof only support with struct instance or struct property')
            return node
          }

          const meta = getStructMeta(struct, newArg.name.escapedText as string)

          if (!meta) {
            reportError(statement.currentFile, node, `struct ${struct.symbol.escapedName} not has property ${newArg.name.escapedText}`)
            return node
          }

          if (meta[KeyMetaKey.BitField]) {
            reportError(statement.currentFile, arg, 'addressof not support with bit field property')
            return node
          }

          if (meta[KeyMetaKey.BaseAddressOffset]) {
            return statement.context.factory.createBinaryExpression(
              statement.context.factory.createElementAccessExpression(
                newArg.expression,
                statement.addSymbolImport(constant.symbolStructAddress)
              ),
              ts.SyntaxKind.PlusToken,
              statement.context.factory.createNumericLiteral(meta[KeyMetaKey.BaseAddressOffset])
            )
          }
          else {
            return statement.context.factory.createElementAccessExpression(
              newArg.expression,
              statement.addSymbolImport(constant.symbolStructAddress)
            )
          }
        }
        else {
          reportError(statement.currentFile, arg, 'invalid operation')
          return node
        }
      }
      // addressof(struct.p[x])
      else if (ts.isElementAccessExpression(arg)) {
        const address = ts.visitNode(
          statement.context.factory.createCallExpression(
            statement.context.factory.createIdentifier(constant.addressof),
            undefined,
            [
              arg.expression
            ]
          ),
          visitor
        )

        let offset: ts.Expression
        let size = 0
        const type = statement.typeChecker.getTypeAtLocation(arg)
        if (typeUtils.isBuiltinType(type)) {
          size = CTypeEnum2Bytes[typeUtils.getBuiltinByType(type)]
        }
        else if (typeUtils.isStructType(type)) {
          const struct = typeUtils.getStructByType(type)
          size = struct.length
        }
        else if (typeUtils.isArrayType(type)) {
          size = getTypeSize(type.aliasTypeArguments[0]) * (type.aliasTypeArguments[1] as ts.NumberLiteralType).value
        }

        if (!size) {
          reportError(statement.currentFile, arg, 'type mismatch')
          return node
        }

        if (ts.isNumericLiteral(arg.argumentExpression)) {
          if (+arg.argumentExpression.text) {
            offset = statement.context.factory.createNumericLiteral(+arg.argumentExpression.text * size)
          }
        }
        else {
          offset = statement.context.factory.createBinaryExpression(
            ts.visitNode(arg.argumentExpression, visitor) as ts.Expression,
            ts.SyntaxKind.AsteriskToken,
            statement.context.factory.createNumericLiteral(size)
          )
        }

        return statement.context.factory.createBinaryExpression(
          address as ts.Expression,
          ts.SyntaxKind.PlusToken,
          offset
        )
      }
      else {
        const type = statement.typeChecker.getTypeAtLocation(arg)
        if (type.symbol && hasStruct(type.symbol)) {
          return statement.context.factory.createElementAccessExpression(
            ts.visitNode(arg, visitor) as ts.Expression,
            statement.addSymbolImport(constant.symbolStructAddress)
          )
        }
        reportError(statement.currentFile, arg, 'addressof only support in related to struct')
        return node
      }
    }
    else if (callName === constant.accessof && !statement.lookupFunc(constant.accessof) && isPointerNode(node.arguments[0])) {
      const arg = node.arguments[0]
      if (ts.isCallExpression(arg) && ts.isIdentifier(arg.expression) && arg.expression.escapedText === constant.addressof) {
        return ts.visitNode(arg.arguments[0], visitor)
      }
      const type = nodeUtils.getPointerExpressionType(arg)
      if (typeUtils.isPointerType(type)) {
        const newArg = ts.visitNode(arg, visitor) as ts.Expression
        if (typeUtils.isPointerStructType(type)) {
          const struct = typeUtils.getPointerStructByType(type)
          return accessStruct(newArg, struct)
        }
        else if (typeUtils.isPointerBuiltinType(type)) {
          return statement.context.factory.createCallExpression(
            statement.context.factory.createElementAccessExpression(
              statement.addMemoryImport(constant.ctypeEnumRead) as ts.Expression,
              typeUtils.getPointerBuiltinByType(type)
            ),
            undefined,
            [
              newArg as ts.Expression
            ]
          )
        }
        else {
          reportError(statement.currentFile, node, 'accessof only support in cheap builtin type or struct type')
          return node
        }
      }
      else {
        reportError(statement.currentFile, node, `the type of ${arg.getText()} is not pointer`)
        return node
      }
    }
    else if (callName === constant.offsetof && !statement.lookupFunc(constant.offsetof)) {
      if (node.arguments.length === 2) {
        const type = statement.typeChecker.getTypeAtLocation(node.arguments[0])
        if (typeUtils.isStructType(type) && ts.isStringLiteral(node.arguments[1])) {
          const struct = getStruct(type.symbol)
          const meta = getStructMeta(struct, node.arguments[1].text)
          if (meta) {
            return statement.context.factory.createNumericLiteral(meta[KeyMetaKey.BaseAddressOffset])
          }
          else {
            reportError(statement.currentFile, node, `struct ${struct.name} has not property ${node.arguments[1].text}`)
            return node
          }
        }
        else {
          reportError(statement.currentFile, node, 'offsetof invalid arguments')
          return node
        }
      }
      else {
        reportError(statement.currentFile, node, 'offsetof invalid arguments')
        return node
      }
    }
    else if (callName === constant.staticCast && !statement.lookupFunc(constant.staticCast)) {
      const newNode = ts.visitNode(node.arguments[0], visitor)
      let sourceType = nodeUtils.getBinaryBuiltinTypeName(node.arguments[0])
      const targetType = node.typeArguments[0]
        && statement.typeChecker.getTypeAtLocation(node.typeArguments[0])?.aliasSymbol?.escapedName as string || ''

      const argType = statement.typeChecker.getTypeAtLocation(node.arguments[0])
      // uint 字面量直接不做转换
      if (array.has(BuiltinUint, sourceType)
        && (argType.flags & ts.TypeFlags.BigIntLiteral || argType.flags & ts.TypeFlags.NumberLiteral)
        && CTypeEnum2Bytes[Type2CTypeEnum[targetType]] === CTypeEnum2Bytes[Type2CTypeEnum[sourceType]]
      ) {
        sourceType = targetType
      }

      if (array.has(BuiltinNumber, targetType)) {
        let exp = newNode as ts.Expression
        // float double -> int32
        // a >> 0
        if (array.has(BuiltinFloat, sourceType)) {
          exp = statement.context.factory.createParenthesizedExpression(statement.context.factory.createBinaryExpression(
            statement.context.factory.createParenthesizedExpression(newNode as ts.Expression),
            ts.SyntaxKind.GreaterThanGreaterThanToken,
            statement.context.factory.createNumericLiteral(0)
          ))
          sourceType = 'int32'
        }
        // uint64 int64, bigint -> int32 uint32, number
        // Number(a)
        else if (array.has(BuiltinBigInt, sourceType)) {

          let bits = CTypeEnum2Bytes[Type2CTypeEnum[targetType]] * 8

          exp = statement.context.factory.createCallExpression(
            statement.context.factory.createIdentifier('Number'),
            undefined,
            [
              statement.context.factory.createBinaryExpression(
                newNode as ts.Expression,
                ts.SyntaxKind.AmpersandToken,
                statement.context.factory.createBigIntLiteral(`0x${new Array(bits >>> 2).fill('f').join('')}n`)
              )
            ]
          ) as ts.Expression

          sourceType = `uint${bits}`
        }

        // 8 bit
        // a & 0xff
        if (CTypeEnum2Bytes[Type2CTypeEnum[sourceType]] > 1
          && CTypeEnum2Bytes[Type2CTypeEnum[targetType]] === 1
        ) {
          exp = statement.context.factory.createParenthesizedExpression(statement.context.factory.createBinaryExpression(
            exp,
            ts.SyntaxKind.AmpersandToken,
            statement.context.factory.createNumericLiteral('0xff', ts.TokenFlags.HexSpecifier)
          ))
          sourceType = 'uint8'
        }
        // 16 bit
        // a & 0xffff
        else if (CTypeEnum2Bytes[Type2CTypeEnum[sourceType]] > 2
          && CTypeEnum2Bytes[Type2CTypeEnum[targetType]] === 2
        ) {
          exp = statement.context.factory.createParenthesizedExpression(statement.context.factory.createBinaryExpression(
            exp,
            ts.SyntaxKind.AmpersandToken,
            statement.context.factory.createNumericLiteral('0xffff', ts.TokenFlags.HexSpecifier)
          ))
          sourceType = 'uint16'
        }

        if (array.has(BuiltinUint, sourceType) && !array.has(BuiltinUint, targetType)) {
          // uint -> int
          // a >> 0
          if (CTypeEnum2Bytes[Type2CTypeEnum[targetType]] === 1) {
            exp = statement.context.factory.createConditionalExpression(
              statement.context.factory.createParenthesizedExpression(statement.context.factory.createBinaryExpression(
                exp,
                ts.SyntaxKind.AmpersandToken,
                statement.context.factory.createNumericLiteral('0x80', ts.TokenFlags.HexSpecifier)
              )),
              statement.context.factory.createToken(ts.SyntaxKind.QuestionToken),
              statement.context.factory.createPrefixUnaryExpression(
                ts.SyntaxKind.MinusToken,
                statement.context.factory.createParenthesizedExpression(statement.context.factory.createBinaryExpression(
                  statement.context.factory.createNumericLiteral('0x100', ts.TokenFlags.HexSpecifier),
                  ts.SyntaxKind.MinusToken,
                  exp
                ))
              ),
              statement.context.factory.createToken(ts.SyntaxKind.ColonToken),
              exp
            )
          }
          else if (CTypeEnum2Bytes[Type2CTypeEnum[targetType]] === 2) {
            exp = statement.context.factory.createConditionalExpression(
              statement.context.factory.createParenthesizedExpression(statement.context.factory.createBinaryExpression(
                exp,
                ts.SyntaxKind.AmpersandToken,
                statement.context.factory.createNumericLiteral('0x80000', ts.TokenFlags.HexSpecifier)
              )),
              statement.context.factory.createToken(ts.SyntaxKind.QuestionToken),
              statement.context.factory.createPrefixUnaryExpression(
                ts.SyntaxKind.MinusToken,
                statement.context.factory.createParenthesizedExpression(statement.context.factory.createBinaryExpression(
                  statement.context.factory.createNumericLiteral('0x10000', ts.TokenFlags.HexSpecifier),
                  ts.SyntaxKind.MinusToken,
                  exp
                ))
              ),
              statement.context.factory.createToken(ts.SyntaxKind.ColonToken),
              exp
            )
          }
          else {
            exp = statement.context.factory.createParenthesizedExpression(statement.context.factory.createBinaryExpression(
              exp,
              ts.SyntaxKind.GreaterThanGreaterThanToken,
              statement.context.factory.createNumericLiteral(0)
            ))
          }
        }
        else if (!array.has(BuiltinUint, sourceType) && array.has(BuiltinUint, targetType)) {
          // int -> uint
          // a >>> 0
          if (CTypeEnum2Bytes[Type2CTypeEnum[targetType]] === 1) {
            exp = statement.context.factory.createParenthesizedExpression(statement.context.factory.createBinaryExpression(
              exp,
              ts.SyntaxKind.AmpersandToken,
              statement.context.factory.createNumericLiteral('0xff', ts.TokenFlags.HexSpecifier)
            ))
          }
          else if (CTypeEnum2Bytes[Type2CTypeEnum[targetType]] === 2) {
            exp = statement.context.factory.createParenthesizedExpression(statement.context.factory.createBinaryExpression(
              exp,
              ts.SyntaxKind.AmpersandToken,
              statement.context.factory.createNumericLiteral('0xffff', ts.TokenFlags.HexSpecifier)
            ))
          }
          else {
            exp = statement.context.factory.createParenthesizedExpression(statement.context.factory.createBinaryExpression(
              exp,
              ts.SyntaxKind.GreaterThanGreaterThanGreaterThanToken,
              statement.context.factory.createNumericLiteral(0)
            ))
          }
        }

        if (ts.isBinaryExpression(exp)) {
          exp = statement.context.factory.createParenthesizedExpression(exp)
        }

        return exp
      }
      else if (array.has(BuiltinBigInt, targetType)) {

        let exp = newNode as ts.Expression
        const sourceBytes = CTypeEnum2Bytes[Type2CTypeEnum[sourceType]]

        // float double -> int32
        if (array.has(BuiltinFloat, sourceType)) {
          exp = statement.context.factory.createCallExpression(
            statement.context.factory.createPropertyAccessExpression(
              statement.context.factory.createIdentifier('Math'),
              statement.context.factory.createIdentifier('floor'),
            ),
            undefined,
            [
              exp
            ]
          )
          exp = statement.context.factory.createCallExpression(
            statement.context.factory.createIdentifier('BigInt'),
            undefined,
            [
              exp
            ]
          )
          sourceType = 'int64'
        }
        // int32 uint32 -> bigint
        if (array.has(BuiltinNumber, sourceType)) {
          if (!array.has(BuiltinUint, sourceType)) {
            exp = statement.context.factory.createBinaryExpression(
              exp,
              ts.SyntaxKind.GreaterThanGreaterThanGreaterThanToken,
              statement.context.factory.createNumericLiteral(0)
            )
          }
          exp = statement.context.factory.createCallExpression(
            statement.context.factory.createIdentifier('BigInt'),
            undefined,
            [
              exp
            ]
          )
          sourceType = 'uint64'
        }

        if (array.has(BuiltinUint, sourceType) && !array.has(BuiltinUint, targetType) && sourceBytes === 8) {
          // uint64 -> int64
          exp = statement.context.factory.createCallExpression(
            statement.context.factory.createPropertyAccessExpression(
              statement.context.factory.createIdentifier('BigInt'),
              statement.context.factory.createIdentifier('asIntN'),
            ),
            undefined,
            [
              statement.context.factory.createNumericLiteral(64),
              exp
            ]
          )
        }
        else if (!array.has(BuiltinUint, sourceType) && array.has(BuiltinUint, targetType)) {
          // int64 -> uint64
          exp = statement.context.factory.createCallExpression(
            statement.context.factory.createPropertyAccessExpression(
              statement.context.factory.createIdentifier('BigInt'),
              statement.context.factory.createIdentifier('asUintN'),
            ),
            undefined,
            [
              statement.context.factory.createNumericLiteral(64),
              exp
            ]
          )
        }

        if (ts.isBinaryExpression(exp)) {
          exp = statement.context.factory.createParenthesizedExpression(exp)
        }

        return exp
      }
      else if (array.has(BuiltinFloat, targetType)) {

        let exp = newNode as ts.Expression

        if (array.has(BuiltinBigInt, sourceType)) {
          exp = statement.context.factory.createCallExpression(
            statement.context.factory.createIdentifier('Number'),
            undefined,
            [
              exp
            ]
          )
        }

        if (ts.isBinaryExpression(exp)) {
          exp = statement.context.factory.createParenthesizedExpression(exp)
        }
        return exp
      }
      return statement.context.factory.createParenthesizedExpression(newNode as ts.Expression)
    }
    else if (callName === constant.reinterpretCast && !statement.lookupFunc(constant.reinterpretCast)) {
      return ts.visitNode(node.arguments[0], visitor)
    }
    else if (callName === constant.defined
      && !statement.lookupFunc(constant.defined)
      && node.arguments.length === 1 && ts.isIdentifier(node.arguments[0])
    ) {
      const name = node.arguments[0].escapedText as string
      return definedReplace(name, node)
    }
    else if (callName === constant.move && !statement.lookupFunc(constant.move)) {
      return ts.visitNode(
        statement.context.factory.createCallExpression(
          statement.context.factory.createIdentifier(constant.addressof),
          undefined,
          node.arguments
        ),
        visitor
      )
    }
    else if (callName === constant.malloc && !statement.lookupFunc(constant.malloc)) {
      return ts.visitNode(
        statement.context.factory.createCallExpression(
          statement.context.factory.createPropertyAccessExpression(
            statement.addIdentifierImport(constant.Allocator, constant.AllocatorPath, false),
            statement.context.factory.createIdentifier(constant.malloc)
          ),
          undefined,
          node.arguments
        ),
        visitor
      )
    }
    else if (callName === constant.calloc && !statement.lookupFunc(constant.calloc)) {
      return ts.visitNode(
        statement.context.factory.createCallExpression(
          statement.context.factory.createPropertyAccessExpression(
            statement.addIdentifierImport(constant.Allocator, constant.AllocatorPath, false),
            statement.context.factory.createIdentifier(constant.calloc)
          ),
          undefined,
          node.arguments
        ),
        visitor
      )
    }
    else if (callName === constant.realloc && !statement.lookupFunc(constant.realloc)) {
      return ts.visitNode(
        statement.context.factory.createCallExpression(
          statement.context.factory.createPropertyAccessExpression(
            statement.addIdentifierImport(constant.Allocator, constant.AllocatorPath, false),
            statement.context.factory.createIdentifier(constant.realloc)
          ),
          undefined,
          node.arguments
        ),
        visitor
      )
    }
    else if (callName === constant.alignedAlloc && !statement.lookupFunc(constant.alignedAlloc)) {
      return ts.visitNode(
        statement.context.factory.createCallExpression(
          statement.context.factory.createPropertyAccessExpression(
            statement.addIdentifierImport(constant.Allocator, constant.AllocatorPath, false),
            statement.context.factory.createIdentifier('alignedAlloc')
          ),
          undefined,
          node.arguments
        ),
        visitor
      )
    }
    else if (callName === constant.free && !statement.lookupFunc(constant.free)) {
      return ts.visitNode(
        statement.context.factory.createCallExpression(
          statement.context.factory.createPropertyAccessExpression(
            statement.addIdentifierImport(constant.Allocator, constant.AllocatorPath, false),
            statement.context.factory.createIdentifier(constant.free)
          ),
          undefined,
          node.arguments
        ),
        visitor
      )
    }
    else if (callName === constant.make && !statement.lookupFunc(constant.make)) {
      return statement.context.factory.createCallExpression(
        statement.addIdentifierImport(constant.make, constant.makePath, true),
        undefined,
        node.arguments
      )
    }
    else if (callName === constant.unmake && !statement.lookupFunc(constant.unmake)) {
      return statement.context.factory.createCallExpression(
        statement.addIdentifierImport(constant.unmake, constant.unmakePath, true),
        undefined,
        node.arguments
      )
    }
  }
  else if (ts.isPropertyAccessExpression(node.expression)) {
    if (callName === constant.indexOf) {
      const type = statement.typeChecker.getTypeAtLocation(node.expression.expression)
      if (typeUtils.isPointerType(type) && node.arguments[0]) {

        let tree = ts.visitNode(node.expression.expression, visitor)

        if (typeUtils.isPointerStructType(type)) {
          const struct = typeUtils.getPointerStructByType(type)
          if (struct) {
            let offset: ts.Expression = null
            if (ts.isNumericLiteral(node.arguments[0])) {
              if (+node.arguments[0].text) {
                offset = statement.context.factory.createNumericLiteral(+node.arguments[0].text * struct.length)
              }
            }
            else {
              offset = statement.context.factory.createBinaryExpression(
                ts.visitNode(node.arguments[0], visitor) as ts.Expression,
                ts.SyntaxKind.AsteriskToken,
                statement.context.factory.createNumericLiteral(struct.length)
              )
            }

            tree = offset ? statement.context.factory.createBinaryExpression(
              tree as ts.Expression,
              ts.SyntaxKind.PlusToken,
              offset
            ) : tree
            return accessStruct(tree, struct)
          }
        }
        else if (typeUtils.isPointerBuiltinType(type)) {
          const ctype = typeUtils.getPointerBuiltinByType(type)
          const byteLength = CTypeEnum2Bytes[ctype]
          if (byteLength) {

            let offset: ts.Expression = null
            if (ts.isNumericLiteral(node.arguments[0])) {
              if (+node.arguments[0].text) {
                offset = statement.context.factory.createNumericLiteral(+node.arguments[0].text * byteLength)
              }
            }
            else {
              offset = statement.context.factory.createBinaryExpression(
                ts.visitNode(node.arguments[0], visitor) as ts.Expression,
                ts.SyntaxKind.AsteriskToken,
                statement.context.factory.createNumericLiteral(byteLength)
              )
            }

            tree = offset ? statement.context.factory.createBinaryExpression(
              tree as ts.Expression,
              ts.SyntaxKind.PlusToken,
              offset
            ) : tree
            return accessCType(tree, ctype)
          }

        }
      }
    }
  }

  return ts.visitEachChild(node, visitor, statement.context)
}
