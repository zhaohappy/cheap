import * as is from 'common/util/is'
import * as array from 'common/util/array'
import type { KeyMeta, Struct, Union } from './typedef'
import { CTypeEnum, CTypeEnum2Bytes, KeyMetaKey } from './typedef'
import { symbolStruct, symbolStructKeysMeta,
  symbolStructLength, symbolStructMaxBaseTypeByteLength
} from './symbol'
import isLittleEndian from 'common/function/isLittleEndian'
import definedMetaProperty from './function/definedMetaProperty'

/**
 * 获取结构体最大基本类型的长度
 * 
 * @param target 
 * @returns 
 */
export function getMaxBaseTypeByteLength(keysMeta:  Map<string, KeyMeta>) {

  let max = 0

  keysMeta.forEach((value) => {
    if (value[KeyMetaKey.Pointer]) {
      if (CTypeEnum2Bytes[CTypeEnum.pointer] > max) {
        max = CTypeEnum2Bytes[CTypeEnum.pointer]
      }
    }
    else {
      if (is.func(value.getTypeMeta)) {
        const typeMeta = value.getTypeMeta()
        if (typeMeta.maxBaseTypeByteLength > max) {
          max = typeMeta.maxBaseTypeByteLength
        }
      }
      else if (is.func(value[KeyMetaKey.Type])) {
        if (value[KeyMetaKey.Type][symbolStructMaxBaseTypeByteLength] > max) {
          max = value[KeyMetaKey.Type][symbolStructMaxBaseTypeByteLength]
        }
      }
      else if (CTypeEnum2Bytes[value[KeyMetaKey.Type] as CTypeEnum] > max) {
        max = CTypeEnum2Bytes[value[KeyMetaKey.Type] as CTypeEnum]
      }
    }
  })

  return max
}

/**
 * 获取结构体最大成员的长度
 * 
 * @param target 
 * @returns 
 */
export function getMaxTypeByteLength(keysMeta:  Map<string, KeyMeta>) {

  let max = 0

  keysMeta.forEach((value) => {
    if (value[KeyMetaKey.Pointer]) {
      if (CTypeEnum2Bytes[CTypeEnum.pointer] > max) {
        max = CTypeEnum2Bytes[CTypeEnum.pointer]
      }
    }
    else {
      if (is.func(value.getTypeMeta)) {
        const typeMeta = value.getTypeMeta()
        if (typeMeta.length > max) {
          max = typeMeta.length
        }
      }
      else if (is.func(value[KeyMetaKey.Type])) {
        if (value[KeyMetaKey.Type][symbolStructLength] > max) {
          max = value[KeyMetaKey.Type][symbolStructLength]
        }
      }
      else if (CTypeEnum2Bytes[value[KeyMetaKey.Type] as CTypeEnum] > max) {
        max = CTypeEnum2Bytes[value[KeyMetaKey.Type] as CTypeEnum]
      }
    }
  })

  return max
}

/**
 * 对结构体进行内存布局
 * 
 * 1. 结构体变量的首地址能够被其最宽基本类型成员的大小 (sizeof)  所整除 （这个由 malloc 保证）
 * 2. 结构体每个成员相对结构体首地址的偏移量 offset 都是成员大小的整数倍，如有需要编译器会在成员之间加上填充字节
 * 3. 结构体的总大小 sizeof 为结构体最宽基本成员大小的整数倍，如有需要编译器会在最末一个成员之后加上填充字节。
 * 
 * 位域：
 * 
 * 4.  如果相邻位域字段的类型相同，且位宽之和小于类型的 sizeof 大小，则后一个字段将紧邻前一个字段存储，直到不能容纳为止。
 * 5.  如果相邻位域字段的类型相同，但位宽之和大于类型的 sizeof 大小，则后一个字段将从新的存储单元开始，其偏移量为其类型大小的整数倍。
 * 6.  如果相邻的位域字段的类型不同，则各编译器的具体实现有差异。（此处采取不压缩）
 * 7.  如果位域字段之间穿插着非位域字段，则不进行压缩。
 * 
 * @param target 
 * @returns 
 */
export function layout(keysQueue: string[], keysMeta: Map<string, KeyMeta>, padding: number, offset: number = 0) {
  let lastBitFieldType: CTypeEnum = CTypeEnum.null
  let bitFieldRemaining: number = 0
  let lastOffset: number = offset

  if (keysQueue && keysMeta) {
    array.each(keysQueue, (key) => {
      const meta = keysMeta.get(key)

      let padding = 0
      let length = 0

      if (meta[KeyMetaKey.Pointer]) {
        padding = CTypeEnum2Bytes[CTypeEnum.pointer]
        length = CTypeEnum2Bytes[CTypeEnum.pointer]
      }
      else {
        if (is.func(meta.getTypeMeta)) {
          const typeMeta = meta.getTypeMeta()
          padding = typeMeta.maxBaseTypeByteLength
          length = typeMeta.length
        }
        else if (is.func(meta[KeyMetaKey.Type])) {
          padding = (meta[KeyMetaKey.Type] as Function).prototype[symbolStructMaxBaseTypeByteLength]
          length = (meta[KeyMetaKey.Type] as Function).prototype[symbolStructLength]
        }
        else {
          // 与上一个字段类型相同且有足够 bit 数（条件 4，6）
          if (meta[KeyMetaKey.BitField]
            && meta[KeyMetaKey.Type] === lastBitFieldType
            && bitFieldRemaining >= meta[KeyMetaKey.BitFieldLength]
          ) {
            meta[KeyMetaKey.BaseAddressOffset] = lastOffset
            meta[KeyMetaKey.BaseBitOffset] = CTypeEnum2Bytes[lastBitFieldType] * 8 - bitFieldRemaining
            bitFieldRemaining -= meta[KeyMetaKey.BitFieldLength]

            if (meta[KeyMetaKey.BitFieldLength] === 0) {
              meta[KeyMetaKey.BitFieldLength] = bitFieldRemaining
              lastBitFieldType = CTypeEnum.null
              bitFieldRemaining = 0
            }

            if (isLittleEndian()) {
              meta[KeyMetaKey.BaseBitOffset] = CTypeEnum2Bytes[lastBitFieldType] * 8
                - meta[KeyMetaKey.BaseBitOffset] - meta[KeyMetaKey.BitFieldLength]
            }

            return true
          }
          else {
            // 不满足，重新开启空间（条件 5）
            padding = CTypeEnum2Bytes[meta[KeyMetaKey.Type] as CTypeEnum]
            length = CTypeEnum2Bytes[meta[KeyMetaKey.Type] as CTypeEnum]
          }
        }
      }

      // 对当前字段类型对齐（条件 2）
      while (offset % padding !== 0) {
        offset++
      }
      meta[KeyMetaKey.BaseAddressOffset] = offset

      if (meta[KeyMetaKey.BitField]) {
        lastBitFieldType = meta[KeyMetaKey.Type] as CTypeEnum
        meta[KeyMetaKey.BaseBitOffset] = 0
        bitFieldRemaining = CTypeEnum2Bytes[lastBitFieldType] * 8 - meta[KeyMetaKey.BitFieldLength]

        if (isLittleEndian()) {
          meta[KeyMetaKey.BaseBitOffset] = CTypeEnum2Bytes[lastBitFieldType] * 8 - meta[KeyMetaKey.BitFieldLength]
        }
      }
      else {
        // 不是位域重置（条件 7）
        lastBitFieldType = CTypeEnum.null
        bitFieldRemaining = 0
      }

      lastOffset = offset
      offset += meta[KeyMetaKey.Array] ? (length * meta[KeyMetaKey.ArrayLength]) : length
    })
  }

  // 对结构体大小对齐（条件 3）
  while (offset % padding !== 0) {
    offset++
  }

  return offset
}

/**
 * 全局的状态收集
 */
const keysQueue: string[] = []
const keysMeta: Map<string, KeyMeta> = new Map()

export function CStruct(target: Struct, { kind }) {
  if (kind === 'class') {
    definedMetaProperty(target.prototype, symbolStruct, true)
    definedMetaProperty(target.prototype, symbolStructMaxBaseTypeByteLength, getMaxBaseTypeByteLength(keysMeta))
    definedMetaProperty(target.prototype, symbolStructLength, layout(keysQueue, keysMeta, target.prototype[symbolStructMaxBaseTypeByteLength]))
    definedMetaProperty(target.prototype, symbolStructKeysMeta, new Map(keysMeta.entries()))
  }
  keysQueue.length = 0
  keysMeta.clear()
}

export function CUnion(target: Union, { kind }) {
  if (kind === 'class') {
    definedMetaProperty(target.prototype, symbolStruct, true)
    definedMetaProperty(target.prototype, symbolStructMaxBaseTypeByteLength, getMaxBaseTypeByteLength(keysMeta))
    definedMetaProperty(target.prototype, symbolStructLength, getMaxTypeByteLength(keysMeta))
    definedMetaProperty(target.prototype, symbolStructKeysMeta, new Map(keysMeta.entries()))
  }
  keysQueue.length = 0
  keysMeta.clear()
}

export function CType(type: CTypeEnum | Struct) {

  if (is.func(type) && !type.prototype[symbolStruct]) {
    throw new TypeError(`type ${type.prototype.constructor.name} is not defined to struct`)
  }

  return function (target: null, { kind, name }) {
    if (kind === 'field') {
      if (name[0] === '$') {
        throw new TypeError('struct property cannot start with $')
      }

      if (!array.has(keysQueue, name)) {
        keysQueue.push(name)
      }
      const data: KeyMeta = keysMeta.get(name) || {
        [KeyMetaKey.Type]: CTypeEnum.void,
        [KeyMetaKey.Pointer]: 0,
        [KeyMetaKey.PointerLevel]: 0,
        [KeyMetaKey.Array]: 0,
        [KeyMetaKey.ArrayLength]: 0,
        [KeyMetaKey.BitField]: 0,
        [KeyMetaKey.BitFieldLength]: 0,
        [KeyMetaKey.BaseAddressOffset]: 0,
        [KeyMetaKey.BaseBitOffset]: 0
      }

      data[KeyMetaKey.Type] = type

      keysMeta.set(name, data)
    }
  }
}

export function CPointer(level: number = 1) {

  if (level < 1) {
    throw new TypeError('pointer level can not smaller then 1')
  }

  return function (target: null, { kind, name }) {
    if (kind === 'field') {
      if (!array.has(keysQueue, name)) {
        keysQueue.push(name)
      }
      const data: KeyMeta = keysMeta.get(name) || {
        [KeyMetaKey.Type]: CTypeEnum.void,
        [KeyMetaKey.Pointer]: 0,
        [KeyMetaKey.PointerLevel]: 0,
        [KeyMetaKey.Array]: 0,
        [KeyMetaKey.ArrayLength]: 0,
        [KeyMetaKey.BitField]: 0,
        [KeyMetaKey.BitFieldLength]: 0,
        [KeyMetaKey.BaseAddressOffset]: 0,
        [KeyMetaKey.BaseBitOffset]: 0
      }

      data[KeyMetaKey.Pointer] = 1
      data[KeyMetaKey.PointerLevel] = level

      keysMeta.set(name, data)
    }
  }
}

export function CArray(length: number) {

  if (!length) {
    throw new TypeError('length must not be 0')
  }

  return function (target: null, { kind, name }) {
    if (kind === 'field') {
      if (!array.has(keysQueue, name)) {
        keysQueue.push(name)
      }
      const data: KeyMeta = keysMeta.get(name) || {
        [KeyMetaKey.Type]: CTypeEnum.void,
        [KeyMetaKey.Pointer]: 0,
        [KeyMetaKey.PointerLevel]: 0,
        [KeyMetaKey.Array]: 0,
        [KeyMetaKey.ArrayLength]: 0,
        [KeyMetaKey.BitField]: 0,
        [KeyMetaKey.BitFieldLength]: 0,
        [KeyMetaKey.BaseAddressOffset]: 0,
        [KeyMetaKey.BaseBitOffset]: 0
      }

      data[KeyMetaKey.Array] = 1
      data[KeyMetaKey.ArrayLength] = length
      keysMeta.set(name, data)
    }
  }
}

export function CBitField(length: number) {
  return function (target: null, { kind, name }) {
    if (is.func(target)) {
      throw new TypeError('bit field can not use for struct')
    }
    if (kind === 'field') {
      if (!array.has(keysQueue, name)) {
        keysQueue.push(name)
      }
      const data: KeyMeta = keysMeta.get(name) || {
        [KeyMetaKey.Type]: CTypeEnum.void,
        [KeyMetaKey.Pointer]: 0,
        [KeyMetaKey.PointerLevel]: 0,
        [KeyMetaKey.Array]: 0,
        [KeyMetaKey.ArrayLength]: 0,
        [KeyMetaKey.BitField]: 0,
        [KeyMetaKey.BitFieldLength]: 0,
        [KeyMetaKey.BaseAddressOffset]: 0,
        [KeyMetaKey.BaseBitOffset]: 0
      }

      data[KeyMetaKey.BitField] = 1
      data[KeyMetaKey.BitFieldLength] = length

      keysMeta.set(name, data)
    }
  }
}
