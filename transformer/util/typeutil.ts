import ts from 'typescript'
import * as constant from '../constant'
import { CTypeEnum2Type, Type2CTypeEnum } from '../defined'
import { CTypeEnum } from '../../typedef'
import { getStruct, hasStruct } from '../struct'
import * as is from 'common/util/is'

export function isCompatibleType(type1: string, type2: string) {
  if (type1 === constant.typePointer && type2 === constant.typeAnyptr
    || type1 === constant.typeAnyptr && type2 === constant.typePointer
  ) {
    return true
  }
  if (type1 === 'any' || type2 === 'any') {
    return true
  }
  if (type1 === 'void' || type2 === 'void') {
    return true
  }
  return type1 === type2
}

export function isTypeEquals(type1: ts.Type, type2: ts.Type) {

  if (isPointerType(type1) && isPointerType(type2)) {
    if (isAnyPointer(type1) || isAnyPointer(type2)) {
      return true
    }
    return getFixTypeByType(type1) === getFixTypeByType(type2)
      && getPointerLevelByType(type1) === getPointerLevelByType(type2)
  }
  else if (isBuiltinType(type1) && isBuiltinType(type2)) {
    return getBuiltinByType(type1) === getBuiltinByType(type2)
  }
  else if (isStructType(type1) && isStructType(type2)) {
    return getStructByType(type1) === getStructByType(type2)
  }

  if (type1.symbol && type2.symbol) {
    return type1.symbol === type2.symbol
  }
  else if (type1.aliasSymbol && type2.aliasSymbol) {

    if (type1.aliasSymbol.escapedName === constant.typePointer && type2.aliasSymbol.escapedName === constant.typeAnyptr
      || type1.aliasSymbol.escapedName === constant.typeAnyptr && type2.aliasSymbol.escapedName === constant.typePointer
    ) {
      return true
    }

    if (!type1.aliasTypeArguments && !type2.aliasTypeArguments) {
      return isCompatibleType(type1.aliasSymbol.escapedName as string, type2.aliasSymbol.escapedName as string)
    }
    if (type1.aliasTypeArguments?.length === type2.aliasTypeArguments?.length) {
      for (let i = 0; i < type1.aliasTypeArguments.length; i++) {
        if (!isTypeEquals(type1.aliasTypeArguments[i], type2.aliasTypeArguments[i])) {
          return false
        }
      }
      return true
    }
    return false
  }
  // @ts-ignore
  else if (type1.intrinsicName && type2.intrinsicName) {
    // @ts-ignore
    return type1.intrinsicName === type2.intrinsicName
  }

  return false
}

export function isBuiltinType(type: ts.Type) {
  if (!type) {
    return false
  }
  if (isPointerType(type)) {
    return true
  }
  if  (type.aliasSymbol) {
    if (type.aliasSymbol.escapedName === constant.typeAnyptr
      || type.aliasSymbol.escapedName === constant.typeMultiPointer
    ) {
      return true
    }
    return is.number(Type2CTypeEnum[type.aliasSymbol.escapedName as string])
  }
  if (type.isIntersection()) {
    const type_ = type.getProperty(constant.typeProperty)
    // @ts-ignore
    if (type_?.links?.type?.value) {
      // @ts-ignore
      return is.number(Type2CTypeEnum[type_.links.type.value.replace(/\*$/g, '')])
    }
  }
  return false
}

export function isPointerBuiltinType(type: ts.Type) {
  if (!type) {
    return false
  }
  return isPointerType(type)
    && (
      type.aliasSymbol && type.aliasTypeArguments && isBuiltinType(type.aliasTypeArguments[0])
      || !type.symbol && !type.aliasSymbol && !isPointerStructType(type)
    )
}

export function isStructType(type: ts.Type, ignoreLevel: boolean = false) {
  if (!type) {
    return false
  }
  if (type.symbol) {
    return hasStruct(type.symbol)
  }
  else if (type.aliasSymbol) {
    return type.aliasSymbol.escapedName === constant.typeStruct
      || type.aliasSymbol.escapedName === constant.typeUnion
  }
  else if (type.isIntersection()) {

    const level_ = type.getProperty(constant.levelProperty)

    // @ts-ignore
    if (!ignoreLevel && level_?.links?.type?.value && level_.links.type.value > 0) {
      return false
    }

    // pointer[x]
    const type_ = type.getProperty(constant.typeProperty)
    // @ts-ignore
    if (type_?.links?.type?.symbol) {
      // @ts-ignore
      return isStructType(type_.links.type)
    }
    // @ts-ignore
    else if (type_?.links?.type?.aliasSymbol
      // @ts-ignore
      && type_?.links?.type?.aliasTypeArguments
      && (
        // @ts-ignore
        type_.links.type.aliasSymbol.escapedName === constant.typeStruct
        // @ts-ignore
         || type_.links.type.aliasSymbol.escapedName === constant.typeUnion
      )
    ) {
      // @ts-ignore
      return isStructType(type_.links.type.aliasTypeArguments[0])
    }

    // 内联 struct
    const struct_ = type.getProperty(constant.structProperty)
    if (struct_) {
      for (let i = 0; i < type.types.length; i++) {
        if (type.types[i].symbol && hasStruct(type.types[i].symbol)) {
          return true
        }
      }
    }
  }
  return false
}

export function isAnyPointer(type: ts.Type) {
  if (type.aliasSymbol) {
    return type.aliasSymbol.escapedName === constant.typeAnyptr
  }
  return false
}

export function isArrayType(type: ts.Type) {
  return type.aliasSymbol
    && type.aliasSymbol.escapedName === constant.typeArray
    && type.aliasTypeArguments[1]?.isNumberLiteral()
}

export function isMultiPointer(type: ts.Type) {
  if (type.aliasSymbol) {
    return type.aliasSymbol.escapedName === constant.typeMultiPointer
  }
  return false
}

export function isPointerType(type: ts.Type) {
  if (!type) {
    return false
  }

  if (isAnyPointer(type) || isMultiPointer(type)) {
    return true
  }
  if (type.aliasSymbol) {
    return type.aliasSymbol.escapedName === constant.typePointer
  }
  if (type.symbol) {
    return type.symbol.escapedName === constant.typePointer
  }
  if (type.isIntersection()) {
    const type_ = type.getProperty(constant.levelProperty)
    // @ts-ignore
    if (type_?.links?.type?.value != null) {
      // @ts-ignore
      return type_.links.type.value > 0
    }
  }
  return false
}

export function isPointerStructType(type: ts.Type) {
  if (!type) {
    return false
  }
  if (isPointerType(type)) {
    if (isAnyPointer(type) || isMultiPointer(type)) {
      return false
    }
    if (type.aliasSymbol && type.aliasTypeArguments) {
      return isStructType(type.aliasTypeArguments[0])
    }
    else if (!type.symbol && !type.aliasSymbol && type.isIntersection()) {
      const level_ = type.getProperty(constant.levelProperty)
      // @ts-ignore
      if (level_?.links?.type?.value && level_.links.type.value > 1) {
        return false
      }
      return isStructType(type, true)
    }
  }
  return false
}

export function getStructByType(type: ts.Type) {
  if (type.aliasSymbol && type.aliasTypeArguments) {
    if (type.aliasSymbol.escapedName === constant.typeStruct
      || type.aliasSymbol.escapedName === constant.typeUnion
      || type.aliasSymbol.escapedName === constant.typeArray
      || type.aliasSymbol.escapedName === constant.typePointer
    ) {
      return getStructByType(type.aliasTypeArguments[0])
    }
  }
  else if (type.symbol) {
    return getStruct(type.symbol)
  }
  else if (type.isIntersection()) {
    // pointer[x]
    const type_ = type.getProperty(constant.typeProperty)
    // @ts-ignore
    if (type_?.links?.type?.symbol) {
      // @ts-ignore
      return getStructByType(type_.links.type)
    }
    // @ts-ignore
    else if (type_?.links?.type?.aliasSymbol
      // @ts-ignore
      && type_?.links?.type?.aliasTypeArguments
      && (
        // @ts-ignore
        type_.links.type.aliasSymbol.escapedName === constant.typeStruct
        // @ts-ignore
         || type_.links.type.aliasSymbol.escapedName === constant.typeUnion
      )
    ) {
      // @ts-ignore
      return getStructByType(type_.links.type.aliasTypeArguments[0])
    }

    // 内联 struct
    const struct_ = type.getProperty(constant.structProperty)
    if (struct_) {
      for (let i = 0; i < type.types.length; i++) {
        if (type.types[i].symbol && hasStruct(type.types[i].symbol)) {
          return getStruct(type.types[i].symbol)
        }
      }
    }
  }
}

export function getPointerStructByType(type: ts.Type) {

  if (getPointerLevelByType(type) > 1) {
    return null
  }
  return type.aliasSymbol && type.aliasTypeArguments && !isPointerType(type.aliasTypeArguments[0]) && getStructByType(type.aliasTypeArguments[0])
    || !type.symbol && !type.aliasSymbol && getStructByType(type)
}

export function getBuiltinNameByType(type: ts.Type) {
  if  (type.aliasSymbol) {
    return type.aliasSymbol.escapedName as string
  }
  if (type.isIntersection()) {
    const type_ = type.getProperty(constant.typeProperty)
    // @ts-ignore
    if (type_?.links?.type?.value) {
      // @ts-ignore
      if (/\*+$/.test(type_.links.type.value)) {
        return CTypeEnum2Type[CTypeEnum.pointer]
      }
      // @ts-ignore
      return type_.links.type.value
    }
  }
}

export function getBuiltinByType(type: ts.Type) {
  if (isPointerType(type)) {
    return CTypeEnum.pointer
  }
  const name = getBuiltinNameByType(type)
  if (name) {
    return Type2CTypeEnum[name]
  }
}

export function getPointerBuiltinByType(type: ts.Type) {
  let builtinType = type.aliasSymbol && type.aliasTypeArguments && getBuiltinByType(type.aliasTypeArguments[0])
  if (!is.number(builtinType) && !type.symbol && !type.aliasSymbol && type.isIntersection()) {

    if (getPointerLevelByType(type) > 1) {
      return CTypeEnum.pointer
    }

    const type_ = type.getProperty(constant.typeProperty)
    // @ts-ignore
    if (type_?.links?.type?.value) {
      // @ts-ignore
      if (/\*{2}$/.test(type_.links.type.value)) {
        return CTypeEnum.pointer
      }
      // @ts-ignore
      return Type2CTypeEnum[type_.links.type.value.replace(/\**$/, '')]
    }
  }
  return builtinType
}

export function getFixTypeByType(type: ts.Type) {
  if (isPointerType(type)) {
    if (type.aliasSymbol && type.aliasTypeArguments) {
      return getFixTypeByType(type.aliasTypeArguments[0])
    }
    else {
      const type_ = type.getProperty(constant.typeProperty)
      // @ts-ignore
      if (type_?.links?.type?.value) {
        // @ts-ignore
        return Type2CTypeEnum[type_.links.type.value.replace(/\**$/, '')]
      }
      else {
        return getStructByType(type)
      }
    }
  }
  else if (isStructType(type)) {
    return getStructByType(type)
  }
  else if (isBuiltinType(type)) {
    return getBuiltinByType(type)
  }
}

export function getPointerLevelByType(type: ts.Type) {
  if (isPointerType(type) && type.isIntersection()) {
    const type_ = type.getProperty(constant.levelProperty)
    // @ts-ignore
    if (type_?.links?.type?.value) {
      // @ts-ignore
      return type_.links.type.value
    }
  }
  return 0
}
