import type { CTypeEnum2Type } from './typedef'
import { CTypeEnum } from './typedef'
import { object } from '@libmedia/common'

type CTypeEnumWrite = {
  [key in CTypeEnum]: (pointer: pointer<void>, value: CTypeEnum2Type<key>) => void
} & {
  fill: (dst: pointer<void>, value: uint8, size: size) => void,
  copy: (dst: pointer<void>, src: pointer<void>, size: size) => void,
}
export const CTypeEnumWrite: CTypeEnumWrite = {
  [CTypeEnum.char]: function (pointer: pointer<void>, value: any): void {
    throw new Error('unimplemented')
  },
  [CTypeEnum.atomic_char]: function (pointer: pointer<void>, value: any): void {
    throw new Error('unimplemented')
  },

  [CTypeEnum.uint8]: function (pointer: pointer<void>, value: any): void {
    throw new Error('unimplemented')
  },
  [CTypeEnum.atomic_uint8]: function (pointer: pointer<void>, value: any): void {
    throw new Error('unimplemented')
  },
  [CTypeEnum.uint16]: function (pointer: pointer<void>, value: any): void {
    throw new Error('unimplemented')
  },
  [CTypeEnum.atomic_uint16]: function (pointer: pointer<void>, value: any): void {
    throw new Error('unimplemented')
  },
  [CTypeEnum.uint32]: function (pointer: pointer<void>, value: any): void {
    throw new Error('unimplemented')
  },
  [CTypeEnum.atomic_uint32]: function (pointer: pointer<void>, value: any): void {
    throw new Error('unimplemented')
  },
  [CTypeEnum.uint64]: function (pointer: pointer<void>, value: any): void {
    throw new Error('unimplemented')
  },

  [CTypeEnum.int8]: function (pointer: pointer<void>, value: any): void {
    throw new Error('unimplemented')
  },
  [CTypeEnum.atomic_int8]: function (pointer: pointer<void>, value: any): void {
    throw new Error('unimplemented')
  },
  [CTypeEnum.int16]: function (pointer: pointer<void>, value: any): void {
    throw new Error('unimplemented')
  },
  [CTypeEnum.atomic_int16]: function (pointer: pointer<void>, value: any): void {
    throw new Error('unimplemented')
  },
  [CTypeEnum.int32]: function (pointer: pointer<void>, value: any): void {
    throw new Error('unimplemented')
  },
  [CTypeEnum.atomic_int32]: function (pointer: pointer<void>, value: any): void {
    throw new Error('unimplemented')
  },
  [CTypeEnum.int64]: function (pointer: pointer<void>, value: any): void {
    throw new Error('unimplemented')
  },

  [CTypeEnum.float]: function (pointer: pointer<void>, value: any): void {
    throw new Error('unimplemented')
  },
  [CTypeEnum.double]: function (pointer: pointer<void>, value: any): void {
    throw new Error('unimplemented')
  },
  [CTypeEnum.pointer]: function (pointer: pointer<void>, value: any): void {
    throw new Error('unimplemented')
  },

  [CTypeEnum.null]: function (pointer: pointer<void>, value: any): void {
    throw new Error('invalid operate')
  },
  [CTypeEnum.void]: function (pointer: pointer<void>, value: any): void {
    throw new Error('invalid operate')
  },

  [CTypeEnum.atomic_uint64]: function (pointer: pointer<void>, value: any): void {
    throw new Error('invalid operate')
  },
  [CTypeEnum.atomic_int64]: function (pointer: pointer<void>, value: any): void {
    throw new Error('invalid operate')
  },

  [CTypeEnum.bool]: function (pointer: pointer<void>, value: any): void {
    throw new Error('invalid operate')
  },
  [CTypeEnum.atomic_bool]: function (pointer: pointer<void>, value: any): void {
    throw new Error('invalid operate')
  },
  [CTypeEnum.size]: function (pointer: pointer<void>, value: any): void {
    throw new Error('unimplemented')
  },
  'copy': function (dst: pointer<void>, value: int32, size: size): void {
    throw new Error('invalid operate')
  },
  'fill': function (dst: pointer<void>, src: pointer<void>, size: size): void {
    throw new Error('invalid operate')
  }
}

export function override(funcs: Partial<CTypeEnumWrite>) {
  object.extend(CTypeEnumWrite, funcs)
}
