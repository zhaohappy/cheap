import { CTypeEnumRead } from './ctypeEnumRead'
import { CTypeEnumWrite } from './ctypeEnumWrite'
import { symbolStructAddress, symbolStructKeysMeta } from './symbol'
import type { KeyMeta, Struct } from './typedef'
import { CTypeEnum, CTypeEnum2Bytes, KeyMetaKey } from './typedef'
import * as is from 'common/util/is'
import * as object from 'common/util/object'
import toString from 'common/function/toString'
import * as array from 'common/util/array'

function definedProperty(target: any, key: string, get: () => any, set: (v: any) => void) {
  Object.defineProperty(target, key, {
    get,
    set,
    configurable: true,
    enumerable: true
  })
}

/**
 * 指针的值
 * 
 * @param address 
 * @returns 
 */
function getPointerValue(address: () => pointer<void>) {
  return function () {
    return CTypeEnumRead[CTypeEnum.pointer](address())
  }
}

function getStruct(target: any, key: string, address: () => pointer<void>, struct: Struct | {}) {
  return function () {
    return target[`__$__${key}`] || (target[`__$__${key}`] = definedStruct(address(), struct))
  }
}

function getCTypeEnumValue(address: () => pointer<void>, type: CTypeEnum) {
  return function () {
    return  CTypeEnumRead[type](address())
  }
}

function getBitFieldValue(address: () => pointer<void>, type: CTypeEnum, bitLen: number, offset: number) {
  const shift = CTypeEnum2Bytes[type] * 8 - offset - bitLen
  const valueMask = Math.pow(2, bitLen) - 1
  return function () {
    let value = CTypeEnumRead[type as uint8](address())
    return (value >>> shift) & valueMask
  }
}

function setPointerValue(address: () => pointer<void>) {
  return function (newValue: pointer<void>) {
    CTypeEnumWrite[CTypeEnum.pointer](address(), newValue)
  }
}

function setStruct(obj: Object, key: string, address: () => pointer<void>, struct: Struct | {}) {
  const localKey = `__$__${key}`
  return function (newValue: Object) {
    const proxy = obj[localKey] || (obj[localKey] = definedStruct(address(), struct))
    object.each(newValue, (value, key) => {
      proxy[key] = value
    })
    obj[localKey] = proxy
  }
}

function setCTypeEnumValue(address: () => pointer<void>, type: CTypeEnum) {
  return function (newValue: any) {
    CTypeEnumWrite[type as uint8](address(), newValue)
  }
}

function setBitFieldValue(address: () => pointer<void>, type: CTypeEnum, bitLen: number, offset: number) {
  let zeroMask = 0
  let len = CTypeEnum2Bytes[type] * 8
  for (let i = 0; i < bitLen; i++) {
    zeroMask |= (1 << (len - 1 - (i + offset)))
  }
  const valueMask = Math.pow(2, bitLen) - 1
  const shift = len - offset - bitLen

  return function (newValue: any) {
    const addr = address()
    const value = CTypeEnumRead[type as uint8](addr)
    CTypeEnumWrite[type as uint8](
      addr,
      (value & ~zeroMask) | ((newValue & valueMask) << shift)
    )
  }
}

function definedArrayStruct(address: () => pointer<void>, length: number, type: Struct | {}) {
  const obj = {}
  let size = reinterpret_cast<int32>(sizeof(type))
  for (let i = 0; i < length; i++) {
    const key = toString(i)
    definedProperty(
      obj,
      key,
      getStruct(
        obj,
        key,
        () => {
          return address() + size * i
        },
        type
      ),
      setStruct(
        obj,
        key,
        () => {
          return address() + size * i
        },
        type
      )
    )
  }

  return obj
}

function definedArrayCTypeEnum(address: () => pointer<void>, length: number, type: CTypeEnum) {
  const obj = {}
  let size = reinterpret_cast<int32>(sizeof(type))
  for (let i = 0; i < length; i++) {
    const key = toString(i)
    definedProperty(
      obj,
      key,
      getCTypeEnumValue(
        () => {
          return address() + size * i
        },
        type
      ),
      setCTypeEnumValue(
        () => {
          return address() + size * i
        },
        type
      )
    )
  }

  return obj
}

function getArray(address: () => pointer<void>, target: Object, key: string, length: number, type: Struct | {} | CTypeEnum) {
  return function () {
    let t = target[`__$__${key}`]
    if (!t) {
      t = (is.func(type) || is.object(type))
        ? definedArrayStruct(address, length, type)
        : definedArrayCTypeEnum(address, length, type)
      target[`__$__${key}`] = t
    }
    t[symbolStructAddress] = address()
    return t
  }
}

function setArrayStruct(obj: Object, key: string, address: () => pointer<void>, length: number, type: Struct | {}) {
  const localKey = `__$__${key}`
  return function (newValue: any[]) {
    let proxy = obj[localKey] || definedArrayStruct(address, length, type)
    proxy[symbolStructAddress] = address()
    array.each(newValue, (value, key) => {
      proxy[key] = value
    })
    obj[localKey] = proxy
  }
}

function setArrayCTypeEnum(obj: Object, key: string, address: () => pointer<void>, length: number, type: CTypeEnum) {
  const localKey = `__$__${key}`
  return function (newValue: any[]) {
    let proxy = obj[localKey] || definedArrayCTypeEnum(address, length, type)
    proxy[symbolStructAddress] = address()
    array.each(newValue, (value, key) => {
      proxy[key] = value
    })
    obj[localKey] = proxy
  }
}

export function definedStruct<T>(address: pointer<void>, struct: (new () => T) | {}) {
  let prototype = is.func(struct) ? struct.prototype : struct

  const obj = {}
  obj[symbolStructAddress] = address
  Object.setPrototypeOf(obj, prototype)

  while (true) {
    let keysMeta = prototype[symbolStructKeysMeta] as Map<string, KeyMeta>

    if (keysMeta) {
      keysMeta.forEach((meta, key) => {
        if (meta[KeyMetaKey.Array]) {
          if (meta[KeyMetaKey.Pointer]) {
            definedProperty(
              obj,
              key,
              getArray(
                () => {
                  if (defined(WASM_64)) {
                    return obj[symbolStructAddress] + static_cast<int64>(meta[KeyMetaKey.BaseAddressOffset] as uint32)
                  }
                  else {
                    return obj[symbolStructAddress] + meta[KeyMetaKey.BaseAddressOffset]
                  }
                },
                obj,
                key,
                meta[KeyMetaKey.ArrayLength],
                meta[KeyMetaKey.Type]
              ),
              setArrayCTypeEnum(
                obj,
                key,
                () => {
                  if (defined(WASM_64)) {
                    return obj[symbolStructAddress] + static_cast<int64>(meta[KeyMetaKey.BaseAddressOffset] as uint32)
                  }
                  else {
                    return obj[symbolStructAddress] + meta[KeyMetaKey.BaseAddressOffset]
                  }
                },
                meta[KeyMetaKey.ArrayLength],
                CTypeEnum.pointer
              )
            )
          }
          else {
            if (is.func(meta[KeyMetaKey.Type]) || is.object(meta[KeyMetaKey.Type])) {
              definedProperty(
                obj,
                key,
                getArray(
                  () => {
                    if (defined(WASM_64)) {
                      return obj[symbolStructAddress] + static_cast<int64>(meta[KeyMetaKey.BaseAddressOffset] as uint32)
                    }
                    else {
                      return obj[symbolStructAddress] + meta[KeyMetaKey.BaseAddressOffset]
                    }
                  },
                  obj,
                  key,
                  meta[KeyMetaKey.ArrayLength],
                  meta[KeyMetaKey.Type]
                ),
                setArrayStruct(
                  obj,
                  key,
                  () => {
                    if (defined(WASM_64)) {
                      return obj[symbolStructAddress] + static_cast<int64>(meta[KeyMetaKey.BaseAddressOffset] as uint32)
                    }
                    else {
                      return obj[symbolStructAddress] + meta[KeyMetaKey.BaseAddressOffset]
                    }
                  },
                  meta[KeyMetaKey.ArrayLength],
                  meta[KeyMetaKey.Type]
                )
              )
            }
            else {
              definedProperty(
                obj,
                key,
                getArray(
                  () => {
                    if (defined(WASM_64)) {
                      return obj[symbolStructAddress] + static_cast<int64>(meta[KeyMetaKey.BaseAddressOffset] as uint32)
                    }
                    else {
                      return obj[symbolStructAddress] + meta[KeyMetaKey.BaseAddressOffset]
                    }
                  },
                  obj,
                  key,
                  meta[KeyMetaKey.ArrayLength],
                  meta[KeyMetaKey.Type]
                ),
                setArrayCTypeEnum(
                  obj,
                  key,
                  () => {
                    if (defined(WASM_64)) {
                      return obj[symbolStructAddress] + static_cast<int64>(meta[KeyMetaKey.BaseAddressOffset] as uint32)
                    }
                    else {
                      return obj[symbolStructAddress] + meta[KeyMetaKey.BaseAddressOffset]
                    }
                  },
                  meta[KeyMetaKey.ArrayLength],
                  meta[KeyMetaKey.Type]
                )
              )
            }
          }
        }
        else {
          if (meta[KeyMetaKey.Pointer]) {
            definedProperty(
              obj,
              key,
              getPointerValue(() => {
                if (defined(WASM_64)) {
                  return obj[symbolStructAddress] + static_cast<int64>(meta[KeyMetaKey.BaseAddressOffset] as uint32)
                }
                else {
                  return obj[symbolStructAddress] + meta[KeyMetaKey.BaseAddressOffset]
                }
              }),
              setPointerValue(() => {
                if (defined(WASM_64)) {
                  return obj[symbolStructAddress] + static_cast<int64>(meta[KeyMetaKey.BaseAddressOffset] as uint32)
                }
                else {
                  return obj[symbolStructAddress] + meta[KeyMetaKey.BaseAddressOffset]
                }
              })
            )
          }
          else if (is.func(meta[KeyMetaKey.Type]) || is.object(meta[KeyMetaKey.Type])) {
            definedProperty(
              obj,
              key,
              getStruct(
                obj,
                key,
                () => {
                  if (defined(WASM_64)) {
                    return obj[symbolStructAddress] + static_cast<int64>(meta[KeyMetaKey.BaseAddressOffset] as uint32)
                  }
                  else {
                    return obj[symbolStructAddress] + meta[KeyMetaKey.BaseAddressOffset]
                  }
                },
                meta[KeyMetaKey.Type]
              ),
              setStruct(
                obj,
                key,
                () => {
                  if (defined(WASM_64)) {
                    return obj[symbolStructAddress] + static_cast<int64>(meta[KeyMetaKey.BaseAddressOffset] as uint32)
                  }
                  else {
                    return obj[symbolStructAddress] + meta[KeyMetaKey.BaseAddressOffset]
                  }
                },
                meta[KeyMetaKey.Type]
              )
            )
          }
          else {
            if (meta[KeyMetaKey.BitField]) {
              definedProperty(
                obj,
                key,
                getBitFieldValue(
                  () => {
                    if (defined(WASM_64)) {
                      return obj[symbolStructAddress] + static_cast<int64>(meta[KeyMetaKey.BaseAddressOffset] as uint32)
                    }
                    else {
                      return obj[symbolStructAddress] + meta[KeyMetaKey.BaseAddressOffset]
                    }
                  },
                  meta[KeyMetaKey.Type],
                  meta[KeyMetaKey.BitFieldLength],
                  meta[KeyMetaKey.BaseBitOffset]
                ),
                setBitFieldValue(
                  () => {
                    if (defined(WASM_64)) {
                      return obj[symbolStructAddress] + static_cast<int64>(meta[KeyMetaKey.BaseAddressOffset] as uint32)
                    }
                    else {
                      return obj[symbolStructAddress] + meta[KeyMetaKey.BaseAddressOffset]
                    }
                  },
                  meta[KeyMetaKey.Type],
                  meta[KeyMetaKey.BitFieldLength],
                  meta[KeyMetaKey.BaseBitOffset]
                )
              )
            }
            else {
              definedProperty(
                obj,
                key,
                getCTypeEnumValue(
                  () => {
                    if (defined(WASM_64)) {
                      return obj[symbolStructAddress] + static_cast<int64>(meta[KeyMetaKey.BaseAddressOffset] as uint32)
                    }
                    else {
                      return obj[symbolStructAddress] + meta[KeyMetaKey.BaseAddressOffset]
                    }
                  },
                  meta[KeyMetaKey.Type]
                ),
                setCTypeEnumValue(
                  () => {
                    if (defined(WASM_64)) {
                      return obj[symbolStructAddress] + static_cast<int64>(meta[KeyMetaKey.BaseAddressOffset] as uint32)
                    }
                    else {
                      return obj[symbolStructAddress] + meta[KeyMetaKey.BaseAddressOffset]
                    }
                  },
                  meta[KeyMetaKey.Type]
                )
              )
            }
          }
        }
      })
    }
    prototype = Object.getPrototypeOf(prototype)
    if (!prototype) {
      break
    }
  }
  return obj as T
}

export function revokeDefinedStruct<T>(target: T) {
  let prototype = Object.getPrototypeOf(target)
  while (true) {
    let keysMeta = prototype[symbolStructKeysMeta] as Map<string, KeyMeta>
    if (keysMeta) {
      keysMeta.forEach((meta, key) => {
        delete target[key]
      })
    }
    prototype = Object.getPrototypeOf(prototype)
    if (!prototype) {
      break
    }
  }
}
