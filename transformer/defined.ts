import * as array from 'common/util/array'
import * as object from 'common/util/object'
import { CTypeEnum } from '..//typedef'
import * as constant from './constant'

export const BuiltinType = [
  'i32',
  'i64',
  'f32',
  'f64',
  'uint8',
  'uint16',
  'uint32',
  'uint64',
  'int8',
  'int16',
  'int32',
  'int64',
  'float',
  'float64',
  'double',
  'char',
  'size',
  'void',
  'bool',
  'size',

  'atomic_char',
  'atomic_uint8',
  'atomic_uint16',
  'atomic_uint32',
  'atomic_int8',
  'atomic_int16',
  'atomic_int32',
  'atomic_int64',
  'atomic_uint64',
  'atomic_bool'
]

export const BuiltinAtomicType = [
  'atomic_char',
  'atomic_uint8',
  'atomic_uint16',
  'atomic_uint32',
  'atomic_int8',
  'atomic_int16',
  'atomic_int32',
  'atomic_int64',
  'atomic_uint64',
  'atomic_bool'
]

export const BuiltinDecorator = [
  constant.cstruct,
  constant.cunion,
  constant.cignore,
  constant.ctype,
  constant.cpointer,
  constant.carray,
  constant.cbitField,
  constant.cinline,
  constant.cdeasync
]

export const AtomicCall = [
  'add',
  'sub',
  'and',
  'or',
  'xor',
  'store',
  'load',
  'compareExchange',
  'exchange'
]

export const BuiltinFloat = [
  'float',
  'float64',
  'double',
  'f32',
  'f64'
]

export const BuiltinBigInt = [
  'i64',
  'int64',
  'uint64',
  'atomic_int64',
  'atomic_uint64'
]

export const BuiltinUint = [
  'uint8',
  'atomic_uint8',
  'uint16',
  'atomic_uint16',
  'uint32',
  'atomic_uint32',
  'uint64',
  'atomic_uint64',
  'size'
]

export const BuiltinBool = [
  'bool',
  'atomic_bool'
]

export const CTypeEnum2Type: Record<CTypeEnum, string> = {
  [CTypeEnum.uint8]: 'uint8',
  [CTypeEnum.atomic_uint8]: 'atomic_uint8',
  [CTypeEnum.char]: 'char',
  [CTypeEnum.atomic_char]: 'atomic_char',
  [CTypeEnum.uint16]: 'uint16',
  [CTypeEnum.atomic_uint16]: 'atomic_uint16',
  [CTypeEnum.uint32]: 'uint32',
  [CTypeEnum.atomic_uint32]: 'atomic_uint32',
  [CTypeEnum.uint64]: 'uint64',
  [CTypeEnum.int8]: 'int8',
  [CTypeEnum.atomic_int8]: 'atomic_int8',
  [CTypeEnum.int16]: 'int16',
  [CTypeEnum.atomic_int16]: 'atomic_int16',
  [CTypeEnum.int32]: 'int32',
  [CTypeEnum.atomic_int32]: 'atomic_int32',
  [CTypeEnum.int64]: 'int64',
  [CTypeEnum.float]: 'float',
  [CTypeEnum.double]: 'double',
  [CTypeEnum.pointer]: 'pointer',
  [CTypeEnum.void]: 'void',
  [CTypeEnum.null]: 'nullptr',
  [CTypeEnum.atomic_uint64]: 'atomic_uint64',
  [CTypeEnum.atomic_int64]: 'atomic_int64',
  [CTypeEnum.bool]: 'bool',
  [CTypeEnum.atomic_bool]: 'atomic_bool',
  [CTypeEnum.size]: 'size'
}

export const Type2CTypeEnum: Record<string, CTypeEnum> = {
  typeptr: CTypeEnum.pointer,
  i32: CTypeEnum.int32,
  i64: CTypeEnum.int64,
  f32: CTypeEnum.float,
  f64: CTypeEnum.double
}

object.each(CTypeEnum2Type, (value, key) => {
  Type2CTypeEnum[value] = +key
})

export const BuiltinNumber = array.exclude(array.exclude(array.exclude(BuiltinType, BuiltinFloat), BuiltinBigInt), BuiltinBool)
