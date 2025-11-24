import type { CTypeEnum2Type } from './typedef'
import { CTypeEnum } from './typedef'
import { object } from '@libmedia/common'
import unimplemented from './function/unimplemented'

type CTypeEnumWrite = {
  [key in CTypeEnum]: (pointer: pointer<void>, value: CTypeEnum2Type<key>) => void
} & {
  fill: (dst: pointer<void>, value: uint8, size: size) => void,
  copy: (dst: pointer<void>, src: pointer<void>, size: size) => void,
}
export const CTypeEnumWrite: CTypeEnumWrite = {
  [CTypeEnum.char]: unimplemented,
  [CTypeEnum.atomic_char]: unimplemented,

  [CTypeEnum.uint8]: unimplemented,
  [CTypeEnum.atomic_uint8]: unimplemented,
  [CTypeEnum.uint16]: unimplemented,
  [CTypeEnum.atomic_uint16]: unimplemented,
  [CTypeEnum.uint32]: unimplemented,
  [CTypeEnum.atomic_uint32]: unimplemented,
  [CTypeEnum.uint64]: unimplemented,

  [CTypeEnum.int8]: unimplemented,
  [CTypeEnum.atomic_int8]: unimplemented,
  [CTypeEnum.int16]: unimplemented,
  [CTypeEnum.atomic_int16]: unimplemented,
  [CTypeEnum.int32]: unimplemented,
  [CTypeEnum.atomic_int32]: unimplemented,
  [CTypeEnum.int64]: unimplemented,

  [CTypeEnum.float]: unimplemented,
  [CTypeEnum.double]: unimplemented,
  [CTypeEnum.pointer]: unimplemented,

  [CTypeEnum.null]: unimplemented,
  [CTypeEnum.void]: unimplemented,

  [CTypeEnum.atomic_uint64]: unimplemented,
  [CTypeEnum.atomic_int64]: unimplemented,

  [CTypeEnum.bool]: unimplemented,
  [CTypeEnum.atomic_bool]: unimplemented,
  [CTypeEnum.size]: unimplemented,
  'copy': unimplemented,
  'fill': unimplemented
}

export function override(funcs: Partial<CTypeEnumWrite>) {
  object.extend(CTypeEnumWrite, funcs)
}
