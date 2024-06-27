import { Data, TypeArray } from 'common/types/type'

export const enum CTypeEnum {
  null = 0,

  void,

  uint8,
  atomic_uint8,
  char,
  atomic_char,
  uint16,
  atomic_uint16,
  uint32,
  atomic_uint32,
  uint64,

  int8,
  atomic_int8,
  int16,
  atomic_int16,
  int32,
  atomic_int32,
  int64,

  float,
  double,
  pointer,

  atomic_int64,
  atomic_uint64,

  bool,
  atomic_bool
}

export const CTypeEnum2Bytes: Record<CTypeEnum, number> = {
  [CTypeEnum.uint8]: 1,
  [CTypeEnum.atomic_uint8]: 1,
  [CTypeEnum.char]: 1,
  [CTypeEnum.atomic_char]: 1,
  [CTypeEnum.uint16]: 2,
  [CTypeEnum.atomic_uint16]: 2,
  [CTypeEnum.uint32]: 4,
  [CTypeEnum.atomic_uint32]: 4,
  [CTypeEnum.uint64]: 8,
  [CTypeEnum.int8]: 1,
  [CTypeEnum.atomic_int8]: 1,
  [CTypeEnum.int16]: 2,
  [CTypeEnum.atomic_int16]: 2,
  [CTypeEnum.int32]: 4,
  [CTypeEnum.atomic_int32]: 4,
  [CTypeEnum.int64]: 8,
  [CTypeEnum.float]: 4,
  [CTypeEnum.double]: 8,
  [CTypeEnum.pointer]: 4,
  [CTypeEnum.null]: 4,
  [CTypeEnum.void]: 4,

  [CTypeEnum.atomic_uint64]: 8,
  [CTypeEnum.atomic_int64]: 8,

  [CTypeEnum.bool]: 1,
  [CTypeEnum.atomic_bool]: 1
}

export const CTypeEnumPointerShiftMap: Record<CTypeEnum, number> = {
  [CTypeEnum.uint8]: 0,
  [CTypeEnum.atomic_uint8]: 0,
  [CTypeEnum.char]: 0,
  [CTypeEnum.atomic_char]: 0,
  [CTypeEnum.uint16]: 1,
  [CTypeEnum.atomic_uint16]: 1,
  [CTypeEnum.uint32]: 2,
  [CTypeEnum.atomic_uint32]: 2,
  [CTypeEnum.uint64]: 4,
  [CTypeEnum.int8]: 0,
  [CTypeEnum.atomic_int8]: 0,
  [CTypeEnum.int16]: 1,
  [CTypeEnum.atomic_int16]: 1,
  [CTypeEnum.int32]: 2,
  [CTypeEnum.atomic_int32]: 2,
  [CTypeEnum.int64]: 4,
  [CTypeEnum.float]: 2,
  [CTypeEnum.double]: 4,
  [CTypeEnum.pointer]: 2,
  [CTypeEnum.void]: 2,
  [CTypeEnum.null]: 2,
  [CTypeEnum.atomic_uint64]: 4,
  [CTypeEnum.atomic_int64]: 4,

  [CTypeEnum.bool]: 0,
  [CTypeEnum.atomic_bool]: 0
}

export const enum KeyMetaKey {
  Type,
  Pointer,
  PointerLevel,
  Array,
  ArrayLength,
  BitField,
  BitFieldLength,
  BaseAddressOffset,
  BaseBitOffset,
  InlineStruct
}

export type KeyMeta = {
  [KeyMetaKey.Type]: CTypeEnum | Struct
  [KeyMetaKey.Pointer]: 0 | 1
  [KeyMetaKey.PointerLevel]: number
  [KeyMetaKey.Array]: 0 | 1
  [KeyMetaKey.ArrayLength]: number
  [KeyMetaKey.BitField]: 0 | 1
  [KeyMetaKey.BitFieldLength]: number
  [KeyMetaKey.BaseAddressOffset]: uint32
  [KeyMetaKey.BaseBitOffset]: uint32
  getTypeMeta?: () => { length: number, maxBaseTypeByteLength: number }
}

export type Struct = new (init?: Data) => any
export type Union = new (init?: Data) => any

/* eslint-disable */
export type CTypeEnum2Type<T> =
  T extends CTypeEnum.null
  ? void
  : T extends CTypeEnum.void
  ? void
  : T extends CTypeEnum.uint8
  ? uint8
  : T extends CTypeEnum.atomic_int8
  ? atomic_uint8
  : T extends CTypeEnum.char
  ? char
  : T extends CTypeEnum.uint16
  ? uint16
  : T extends CTypeEnum.atomic_uint16
  ? atomic_uint16
  : T extends CTypeEnum.uint32
  ? uint32
  : T extends CTypeEnum.atomic_uint32
  ? atomic_uint32
  : T extends CTypeEnum.uint64
  ? uint64
  : T extends CTypeEnum.int8
  ? int8
  : T extends CTypeEnum.atomic_int8
  ? atomic_int8
  : T extends CTypeEnum.int16
  ? int16
  : T extends CTypeEnum.atomic_int16
  ? atomic_int16
  : T extends CTypeEnum.int32
  ? int32
  : T extends CTypeEnum.atomic_int32
  ? atomic_int32
  : T extends CTypeEnum.int64
  ? int64
  : T extends CTypeEnum.float
  ? float
  : T extends CTypeEnum.double
  ? double
  : T extends CTypeEnum.pointer
  ? pointer<void>
  : T extends CTypeEnum.atomic_int64
  ? atomic_int64
  : T extends CTypeEnum.atomic_uint64
  ? atomic_uint64
  : T extends CTypeEnum.bool
  ? bool
  : T extends CTypeEnum.atomic_bool
  ? atomic_bool
  : never
/* eslint-enable */

export type AtomicsBuffer = Exclude<TypeArray, Float32Array | Float64Array> | BigInt64Array | BigUint64Array
