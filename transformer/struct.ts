import ts from 'typescript'
import * as array from 'common/util/array'
import { CTypeEnum, KeyMeta, KeyMetaKey } from '../typedef'
import { getMaxBaseTypeByteLength, getMaxTypeByteLength, layout } from '../cstruct'
import { BuiltinType, Type2CTypeEnum } from './defined'
import * as constant from './constant'
import * as nodeUtil from './util/nodeutil'
import * as object from 'common/util/object'
import statement from './statement'

export enum StructType {
  CSTRUCT,
  CUNION,
  INLINE_OBJECT
}

export type KeyMetaExt = Omit<KeyMeta, 'getTypeMeta'> & {
  has: boolean
  typeIdentifier: string
  getTypeMeta?: () => Struct
  symbol: ts.Symbol
  name: string
}

export type Struct = {
  maxBaseTypeByteLength: number
  length: number
  meta: Map<string, KeyMetaExt>
  symbol: ts.Symbol
  parent?: Struct,
  structType: StructType
  definedClassParent?: Struct
  inlineStructPathMap?: Map<ts.Symbol, string>
  name: string
}

const StructMap: Map<ts.Symbol, Struct> = new Map()
const StructFileIdentifiers: Map<string, string[]> = new Map()

const Stack: {
  struct: Struct
  treePath: string[]
  inlineStructPathMap: Map<ts.Symbol, string>
}[] = []

function addFileIdentifier(symbol: ts.Symbol) {
  if (symbol.valueDeclaration) {
    const fileName = symbol.valueDeclaration.getSourceFile().fileName
    if (StructFileIdentifiers.has(fileName)) {
      StructFileIdentifiers.get(fileName).push(symbol.name)
    }
    else {
      StructFileIdentifiers.set(fileName, [symbol.name])
    }
  }
}

function isCStruct(node: ts.ClassDeclaration) {

  if (!node) {
    return false
  }

  let has = false

  // 检查是否拥有 CStruct
  array.each(node.modifiers as any as Array<ts.ModifierLike>, (modifier) => {
    if (modifier.kind === ts.SyntaxKind.Decorator
      && modifier.expression?.kind === ts.SyntaxKind.Identifier
      && ((modifier.expression as ts.Identifier).escapedText === constant.cstruct)
    ) {
      has = true
      return false
    }
  })

  return has
}

function isCUnion(node: ts.ClassDeclaration) {

  if (!node) {
    return false
  }

  let has = false

  // 检查是否拥有 CUnion
  array.each(node.modifiers as any as Array<ts.ModifierLike>, (modifier) => {
    if (modifier.kind === ts.SyntaxKind.Decorator
      && modifier.expression?.kind === ts.SyntaxKind.Identifier
      && ((modifier.expression as ts.Identifier).escapedText === constant.cunion)
    ) {
      has = true
      return false
    }
  })

  return has
}

function analyzeModifiers(list: ts.NodeArray<ts.ModifierLike>, data: KeyMetaExt) {
  for (let i = 0; i < list.length; i++) {
    if (list[i].kind === ts.SyntaxKind.Decorator) {
      const decorator = list[i] as ts.Decorator

      let hasIgnore = false

      if (ts.isCallExpression(decorator.expression) && ts.isIdentifier(decorator.expression.expression)) {
        const name = decorator.expression.expression.escapedText
        if (name === constant.ctype) {
          data.has = true
          if (ts.isIdentifier(decorator.expression.arguments[0]) || ts.isExpressionWithTypeArguments(decorator.expression.arguments[0])) {
            data.typeIdentifier = (ts.isIdentifier((decorator.expression as ts.CallExpression).arguments[0])
              ? ((decorator.expression as ts.CallExpression).arguments[0] as ts.Identifier).escapedText
              : (((decorator.expression as ts.CallExpression)
                .arguments[0] as ts.ExpressionWithTypeArguments)
                .expression as ts.Identifier).escapedText) as string
            data.getTypeMeta = () => {
              const type = ts.isIdentifier((decorator.expression as ts.CallExpression).arguments[0])
                ? statement.typeChecker.getTypeAtLocation((decorator.expression as ts.CallExpression).arguments[0])
                : statement.typeChecker.getTypeAtLocation(((decorator.expression as ts.CallExpression)
                  .arguments[0] as ts.ExpressionWithTypeArguments)
                  .expression)
              if (type) {
                return getStruct(type.symbol)
              }
              else {
                return {
                  maxBaseTypeByteLength: 0,
                  length: 0,
                  structType: StructType.CSTRUCT,
                  meta: null,
                  symbol: null,
                  name: ''
                }
              }
            }
          }
          else if (decorator.expression.arguments[0].kind === ts.SyntaxKind.ThisKeyword) {
            data.typeIdentifier = (decorator.parent.parent as ts.ClassDeclaration).name.escapedText as string
            data.getTypeMeta = () => {
              const type = statement.typeChecker.getTypeAtLocation(decorator.parent.parent)
              return getStruct(type.symbol)
            }
          }
          else if (ts.isPropertyAccessExpression(decorator.expression.arguments[0])) {
            data[KeyMetaKey.Type] = Type2CTypeEnum[decorator.expression.arguments[0].name.escapedText as string]
          }
        }
        else if (name === constant.cpointer) {
          data[KeyMetaKey.Pointer] = 1
          if (!decorator.expression.arguments.length) {
            data[KeyMetaKey.PointerLevel] = 1
          }
          else {
            if (ts.isIdentifier(decorator.expression.arguments[0])) {
              data[KeyMetaKey.PointerLevel] = +decorator.expression.arguments[0].escapedText
            }
          }
        }
        else if (name === constant.carray) {
          data[KeyMetaKey.Array] = 1
          data[KeyMetaKey.ArrayLength] = 0
          if (ts.isNumericLiteral(decorator.expression.arguments[0])) {
            data[KeyMetaKey.ArrayLength] = +decorator.expression.arguments[0].text
          }
          else if (ts.isIdentifier(decorator.expression.arguments[0])) {
            const symbol = statement.typeChecker.getSymbolAtLocation(decorator.expression.arguments[0])
            if (symbol && ts.isVariableDeclaration(symbol.valueDeclaration) && symbol.valueDeclaration.initializer) {
              if (ts.isNumericLiteral(symbol.valueDeclaration.initializer)) {
                data[KeyMetaKey.ArrayLength] = +symbol.valueDeclaration.initializer.text
              }
            }
          }
          if (Number.isNaN(data[KeyMetaKey.ArrayLength])) {
            data[KeyMetaKey.ArrayLength] = 0
          }
        }
        else if (name === constant.cbitField) {
          data[KeyMetaKey.BitField] = 1
          if (ts.isIdentifier(decorator.expression.arguments[0])) {
            data[KeyMetaKey.BitFieldLength] = +decorator.expression.arguments[0].escapedText
          }
        }
        else if (name === constant.cignore) {
          hasIgnore = true
          if (ts.isCallExpression(decorator.expression)) {
            if (decorator.expression.arguments.length
              && !nodeUtil.checkBool(statement.visitor(decorator.expression.arguments[0]) as ts.Node, statement.visitor)
            ) {
              hasIgnore = false
            }
          }
        }
      }
      else if (ts.isIdentifier(decorator.expression)) {
        const name = decorator.expression.escapedText
        if (name === constant.cignore) {
          hasIgnore = true
        }
      }

      if (hasIgnore) {
        data.has = false
      }
    }
  }
}

function analyzeType(type: ts.Type, data: KeyMetaExt) {
  if (type.aliasSymbol) {
    const typeName = type.aliasSymbol.escapedName as string
    if (typeName === constant.typeArray && type.aliasTypeArguments[1]?.isNumberLiteral()) {
      data[KeyMetaKey.Array] = 1
      data[KeyMetaKey.ArrayLength] = (data[KeyMetaKey.ArrayLength] ? data[KeyMetaKey.ArrayLength] : 1) * type.aliasTypeArguments[1].value
      analyzeType(type.aliasTypeArguments[0], data)
    }
    else if (typeName === constant.typeBit && type.aliasTypeArguments[1]?.isNumberLiteral()) {
      data[KeyMetaKey.BitField] = 1
      data[KeyMetaKey.BitFieldLength] = type.aliasTypeArguments[1].value
      analyzeType(type.aliasTypeArguments[0], data)
    }
    else if (typeName === constant.typePointer) {
      data[KeyMetaKey.PointerLevel]++
      data[KeyMetaKey.Pointer] = 1
      analyzeType(type.aliasTypeArguments[0], data)
    }
    else if (typeName === constant.typeStruct
      || typeName === constant.typeUnion
    ) {
      const struct = getInlineStruct(
        type.aliasTypeArguments[0],
        typeName === constant.typeUnion ? StructType.CUNION : StructType.CSTRUCT,
      )
      if (struct) {
        data.has = true
        const stack = Stack[Stack.length - 1]
        stack.inlineStructPathMap.set(struct.symbol, stack.treePath.join('.'))
        data.getTypeMeta = () => {
          return struct
        }
      }
    }
    else if (type.aliasSymbol.valueDeclaration
      && (
        ts.isEnumDeclaration(type.aliasSymbol.valueDeclaration)
        || ts.isEnumMember(type.aliasSymbol.valueDeclaration)
      )
    ) {
      data.has = true
      data[KeyMetaKey.Type] = CTypeEnum.int32
    }
    else if (array.has(BuiltinType, typeName)) {
      data.has = true
      data[KeyMetaKey.Type] = Type2CTypeEnum[typeName]
    }
  }
  else if (type.symbol
    && (isCStruct(type.symbol.valueDeclaration as ts.ClassDeclaration)
      || isCUnion(type.symbol.valueDeclaration as ts.ClassDeclaration)
    )
  ) {
    if (!data[KeyMetaKey.Pointer] && type.symbol === data.symbol) {
      data.has = false
    }
    else {
      data.has = true
      data.typeIdentifier = type.symbol.escapedName as string
      data.getTypeMeta = () => {
        return getStruct(type.symbol)
      }
    }
  }
  else if (type.symbol?.valueDeclaration
    && (
      ts.isEnumDeclaration(type.symbol.valueDeclaration)
      || ts.isEnumMember(type.symbol.valueDeclaration)
    )
  ) {
    data.has = true
    data[KeyMetaKey.Type] = CTypeEnum.int32
  }
  else if (data[KeyMetaKey.Pointer]) {
    data.has = true
    data[KeyMetaKey.Type] = CTypeEnum.void
  }
  else if (type.isUnion()) {
    analyzeType(type.types[0], data)
  }
}

function getInlineStruct(type: ts.Type, structType: StructType) {

  const metaMap = new Map()
  const metaQueue = []

  if (type.symbol.members) {
    type.symbol.members.forEach((value, key) => {
      if (value.flags & ts.SymbolFlags.Property && value.valueDeclaration && ts.isPropertySignature(value.valueDeclaration)) {

        const stack = Stack[Stack.length - 1]

        stack.treePath.push(key as string)

        const metaData: KeyMetaExt = {
          [KeyMetaKey.Type]: CTypeEnum.void,
          [KeyMetaKey.Pointer]: 0,
          [KeyMetaKey.PointerLevel]: 0,
          [KeyMetaKey.Array]: 0,
          [KeyMetaKey.ArrayLength]: 0,
          [KeyMetaKey.BitField]: 0,
          [KeyMetaKey.BitFieldLength]: 0,
          [KeyMetaKey.BaseAddressOffset]: 0,
          [KeyMetaKey.BaseBitOffset]: 0,
          has: false,
          typeIdentifier: '',
          symbol: null,
          name: key as string
        }

        analyzeType(statement.typeChecker.getTypeOfSymbol(value), metaData)

        if (metaData.has) {
          metaMap.set(key as string, metaData)
          metaQueue.push(key as string)
        }

        stack.treePath.pop()
      }
    })
  }

  if (metaMap.size) {
    const maxBaseTypeByteLength = getMaxBaseTypeByteLength(metaMap)
    if (!maxBaseTypeByteLength) {
      return null
    }
    const length = structType === StructType.CUNION
      ? getMaxTypeByteLength(metaMap)
      : layout(metaQueue, metaMap, maxBaseTypeByteLength, 0)

    StructMap.set(type.symbol, {
      maxBaseTypeByteLength: maxBaseTypeByteLength,
      length: length,
      meta: metaMap,
      symbol: type.symbol,
      parent: null,
      structType: StructType.INLINE_OBJECT,
      definedClassParent: Stack[Stack.length - 1].struct,
      name: type.symbol.name
    })
    addFileIdentifier(type.symbol)
    return StructMap.get(type.symbol)
  }
  return null
}

function analyze(symbol: ts.Symbol) {

  // 检查是否是类定义
  if (!symbol.valueDeclaration || !ts.isClassDeclaration(symbol.valueDeclaration)) {
    StructMap.set(symbol, null)
    return
  }

  const valueDeclaration = symbol.valueDeclaration as ts.ClassDeclaration

  if (!isCStruct(valueDeclaration) && !isCUnion(valueDeclaration)) {
    StructMap.set(symbol, null)
    return
  }


  const structType = isCUnion(valueDeclaration) ? StructType.CUNION : StructType.CSTRUCT
  const metaMap = new Map()
  const metaQueue = []

  const inlineStructPathMap = new Map()
  const struct = {
    maxBaseTypeByteLength: 0,
    length: 0,
    meta: null,
    symbol: symbol,
    parent: null,
    structType: structType,
    name: symbol.name
  }
  const treePath = []

  Stack.push({
    treePath,
    struct,
    inlineStructPathMap
  })

  let parentStruct: Struct | null

  if (valueDeclaration.heritageClauses?.length) {
    for (let i = 0; i < valueDeclaration.heritageClauses.length; i++) {
      const clause = valueDeclaration.heritageClauses[i]
      if (clause.token === ts.SyntaxKind.ExtendsKeyword) {
        if (clause.types.length === 1) {
          let parentSymbol = statement.typeChecker.getSymbolAtLocation(clause.types[0].expression)
          parentStruct = StructMap.get(parentSymbol)
          if (!parentStruct) {
            analyze(parentSymbol)
            parentStruct = StructMap.get(parentSymbol)
          }
        }
      }
    }
  }

  if (symbol.members) {
    symbol.members.forEach((value, key) => {
      if (value.flags & ts.SymbolFlags.Property && value.valueDeclaration && ts.isPropertyDeclaration(value.valueDeclaration)) {

        const valueDeclaration = value.valueDeclaration

        treePath.push(key as string)

        const metaData: KeyMetaExt = {
          [KeyMetaKey.Type]: CTypeEnum.void,
          [KeyMetaKey.Pointer]: 0,
          [KeyMetaKey.PointerLevel]: 0,
          [KeyMetaKey.Array]: 0,
          [KeyMetaKey.ArrayLength]: 0,
          [KeyMetaKey.BitField]: 0,
          [KeyMetaKey.BitFieldLength]: 0,
          [KeyMetaKey.BaseAddressOffset]: 0,
          [KeyMetaKey.BaseBitOffset]: 0,
          has: false,
          typeIdentifier: '',
          symbol,
          name: key as string
        }

        analyzeType(statement.typeChecker.getTypeOfSymbol(value), metaData)

        if (valueDeclaration.modifiers?.length) {
          analyzeModifiers(valueDeclaration.modifiers, metaData)
        }

        if (metaData.has) {
          metaMap.set(key as string, metaData)
          metaQueue.push(key as string)
        }

        treePath.pop()
      }
    })
  }

  if (metaMap.size) {
    const maxBaseTypeByteLength = Math.max(getMaxBaseTypeByteLength(metaMap), parentStruct?.maxBaseTypeByteLength ?? 0)

    if (!maxBaseTypeByteLength) {
      StructMap.set(symbol, null)
      return
    }

    let offset = 0
    if (parentStruct) {
      offset = parentStruct.length
    }
    const length = structType === StructType.CUNION
      ? getMaxTypeByteLength(metaMap)
      : layout(metaQueue, metaMap, maxBaseTypeByteLength, offset)

    object.extend(struct, {
      maxBaseTypeByteLength: maxBaseTypeByteLength,
      length,
      meta: metaMap,
      parent: parentStruct,
      inlineStructPathMap
    })

    StructMap.set(symbol, struct)
    addFileIdentifier(symbol)
  }
  else {
    if (parentStruct) {
      object.extend(struct, {
        maxBaseTypeByteLength: parentStruct.maxBaseTypeByteLength,
        length: parentStruct.length,
        meta: metaMap,
        parent: parentStruct,
      })
      StructMap.set(symbol, struct)
      addFileIdentifier(symbol)
    }
    else {
      StructMap.set(symbol, null)
    }
  }

  Stack.pop()
}

export function getStruct(symbol: ts.Symbol) {
  if (!symbol) {
    return null
  }
  if (!StructMap.has(symbol)) {
    analyze(symbol)
  }
  return StructMap.get(symbol)
}

export function hasStruct(symbol: ts.Symbol) {
  const struct = getStruct(symbol)
  return struct != null
}

export function getStructFileIdentifiers(fileName: string) {
  return StructFileIdentifiers.get(fileName)
}
