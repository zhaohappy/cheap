import { CTypeEnum, CTypeEnum2Type } from './typedef'
import * as object from 'common/util/object'

type CTypeEnumRead = {
  [key in CTypeEnum]: (pointer: pointer<void>) => CTypeEnum2Type<key>
}

export const CTypeEnumRead: CTypeEnumRead = {
  [CTypeEnum.char]: function (pointer: pointer<void>) {
    throw new Error('unimplemented')
  },
  [CTypeEnum.atomic_char]: function (pointer: pointer<void>) {
    throw new Error('unimplemented')
  },

  [CTypeEnum.uint8]: function (pointer: pointer<void>) {
    throw new Error('unimplemented')
  },
  [CTypeEnum.atomic_uint8]: function (pointer: pointer<void>) {
    throw new Error('unimplemented')
  },
  [CTypeEnum.uint16]: function (pointer: pointer<void>) {
    throw new Error('unimplemented')
  },
  [CTypeEnum.atomic_uint16]: function (pointer: pointer<void>) {
    throw new Error('unimplemented')
  },
  [CTypeEnum.uint32]: function (pointer: pointer<void>) {
    throw new Error('unimplemented')
  },
  [CTypeEnum.atomic_uint32]: function (pointer: pointer<void>) {
    throw new Error('unimplemented')
  },
  [CTypeEnum.uint64]: function (pointer: pointer<void>) {
    throw new Error('unimplemented')
  },

  [CTypeEnum.int8]: function (pointer: pointer<void>) {
    throw new Error('unimplemented')
  },
  [CTypeEnum.atomic_int8]: function (pointer: pointer<void>) {
    throw new Error('unimplemented')
  },
  [CTypeEnum.int16]: function (pointer: pointer<void>) {
    throw new Error('unimplemented')
  },
  [CTypeEnum.atomic_int16]: function (pointer: pointer<void>) {
    throw new Error('unimplemented')
  },
  [CTypeEnum.int32]: function (pointer: pointer<void>) {
    throw new Error('unimplemented')
  },
  [CTypeEnum.atomic_int32]: function (pointer: pointer<void>) {
    throw new Error('unimplemented')
  },
  [CTypeEnum.int64]: function (pointer: pointer<void>) {
    throw new Error('unimplemented')
  },

  [CTypeEnum.float]: function (pointer: pointer<void>) {
    throw new Error('unimplemented')
  },
  [CTypeEnum.double]: function (pointer: pointer<void>) {
    throw new Error('unimplemented')
  },
  [CTypeEnum.pointer]: function (pointer: pointer<void>) {
    throw new Error('unimplemented')
  },

  [CTypeEnum.null]: function (pointer: pointer<void>) {
    throw new Error('invalid operate')
  },
  [CTypeEnum.void]: function (pointer: pointer<void>) {
    throw new Error('invalid operate')
  },

  [CTypeEnum.atomic_uint64]: function (pointer: pointer<void>) {
    throw new Error('invalid operate')
  },
  [CTypeEnum.atomic_int64]: function (pointer: pointer<void>) {
    throw new Error('invalid operate')
  },

  [CTypeEnum.bool]: function (pointer: pointer<void>) {
    throw new Error('invalid operate')
  },
  [CTypeEnum.atomic_bool]: function (pointer: pointer<void>) {
    throw new Error('invalid operate')
  }
}

export function override(funcs: Partial<CTypeEnumRead>) {
  object.extend(CTypeEnumRead, funcs)
}
