import isLittleEndian from 'common/function/isLittleEndian'
import { CTypeEnum } from './typedef'
import { override as readoverride} from './ctypeEnumRead'
import { override as writeoverride} from './ctypeEnumWrite'
import AllocatorInterface from './allocator/Allocator'

let getAllocator: () => AllocatorInterface
let getView: () => DataView

const littleEndian = isLittleEndian()

function writeU8(pointer: pointer<void>, value: uint8) {
  assert(pointer, 'Out Of Bounds, address: 0')
  assert(getAllocator().isAlloc(pointer), `address ${pointer} is not alloc`)
  getView().setUint8(pointer, value)
}

function readU8(pointer: pointer<void>): uint8 {
  assert(pointer, 'Out Of Bounds, address: 0')
  assert(getAllocator().isAlloc(pointer), `address ${pointer} is not alloc`)
  return getView().getUint8(pointer)
}

function writeU16(pointer: pointer<void>, value: uint16) {
  assert(pointer, 'Out Of Bounds, address: 0')
  assert(getAllocator().isAlloc(pointer), `address ${pointer} is not alloc`)
  getView().setUint16(pointer, value, littleEndian)
}

function readU16(pointer: pointer<void>): uint16 {
  assert(pointer, 'Out Of Bounds, address: 0')
  assert(getAllocator().isAlloc(pointer), `address ${pointer} is not alloc`)
  return getView().getUint16(pointer, littleEndian)
}

function writeU32(pointer: pointer<void>, value: uint32) {
  assert(pointer, 'Out Of Bounds, address: 0')
  assert(getAllocator().isAlloc(pointer), `address ${pointer} is not alloc`)
  getView().setUint32(pointer, value, littleEndian)
}

function readU32(pointer: pointer<void>): uint32 {
  assert(pointer, 'Out Of Bounds, address: 0')
  assert(getAllocator().isAlloc(pointer), `address ${pointer} is not alloc`)
  return getView().getUint32(pointer, littleEndian)
}

function writeU64(pointer: pointer<void>, value: uint64) {
  assert(pointer, 'Out Of Bounds, address: 0')
  assert(getAllocator().isAlloc(pointer), `address ${pointer} is not alloc`)
  getView().setBigUint64(pointer, value, littleEndian)
}

function readU64(pointer: pointer<void>): uint64 {
  assert(pointer, 'Out Of Bounds, address: 0')
  assert(getAllocator().isAlloc(pointer), `address ${pointer} is not alloc`)
  return getView().getBigUint64(pointer, littleEndian)
}

function write8(pointer: pointer<void>, value: int8) {
  assert(pointer, 'Out Of Bounds, address: 0')
  assert(getAllocator().isAlloc(pointer), `address ${pointer} is not alloc`)
  getView().setInt8(pointer, value)
}

function read8(pointer: pointer<void>): int8 {
  assert(pointer, 'Out Of Bounds, address: 0')
  assert(getAllocator().isAlloc(pointer), `address ${pointer} is not alloc`)
  return getView().getInt8(pointer)
}

function write16(pointer: pointer<void>, value: int16) {
  assert(pointer, 'Out Of Bounds, address: 0')
  assert(getAllocator().isAlloc(pointer), `address ${pointer} is not alloc`)
  getView().setInt16(pointer, value, littleEndian)
}

function read16(pointer: pointer<void>): int16 {
  assert(pointer, 'Out Of Bounds, address: 0')
  assert(getAllocator().isAlloc(pointer), `address ${pointer} is not alloc`)
  return getView().getInt16(pointer, littleEndian)
}

function write32(pointer: pointer<void>, value: int32) {
  assert(pointer, 'Out Of Bounds, address: 0')
  assert(getAllocator().isAlloc(pointer), `address ${pointer} is not alloc`)
  getView().setInt32(pointer, value, littleEndian)
}

function read32(pointer: pointer<void>): int32 {
  assert(pointer, 'Out Of Bounds, address: 0')
  assert(getAllocator().isAlloc(pointer), `address ${pointer} is not alloc`)
  return getView().getInt32(pointer, littleEndian)
}

function write64(pointer: pointer<void>, value: int64) {
  assert(pointer, 'Out Of Bounds, address: 0')
  assert(getAllocator().isAlloc(pointer), `address ${pointer} is not alloc`)
  getView().setBigInt64(pointer, value, littleEndian)
}

function read64(pointer: pointer<void>): int64 {
  assert(pointer, 'Out Of Bounds, address: 0')
  assert(getAllocator().isAlloc(pointer), `address ${pointer} is not alloc`)
  return getView().getBigInt64(pointer, littleEndian)
}

function writef32(pointer: pointer<void>, value: float) {
  assert(pointer, 'Out Of Bounds, address: 0')
  assert(getAllocator().isAlloc(pointer), `address ${pointer} is not alloc`)
  getView().setFloat32(pointer, value, littleEndian)
}

function readf32(pointer: pointer<void>): float {
  assert(pointer, 'Out Of Bounds, address: 0')
  assert(getAllocator().isAlloc(pointer), `address ${pointer} is not alloc`)
  return getView().getFloat32(pointer, littleEndian)
}

function writef64(pointer: pointer<void>, value: float64) {
  assert(pointer, 'Out Of Bounds, address: 0')
  assert(getAllocator().isAlloc(pointer), `address ${pointer} is not alloc`)
  getView().setFloat64(pointer, value, littleEndian)
}

function readf64(pointer: pointer<void>): float64 | double {
  assert(pointer, 'Out Of Bounds, address: 0')
  assert(getAllocator().isAlloc(pointer), `address ${pointer} is not alloc`)
  return getView().getFloat64(pointer, littleEndian)
}

function readPointer<T>(pointer: pointer<void>): pointer<T> {
  assert(pointer, 'Out Of Bounds, address: 0')
  assert(getAllocator().isAlloc(pointer), `address ${pointer} is not alloc`)
  return getView().getUint32(pointer, littleEndian) as pointer<T>
}

function writePointer<T>(pointer: pointer<void>, value: pointer<T>) {
  assert(pointer, 'Out Of Bounds, address: 0')
  assert(getAllocator().isAlloc(pointer), `address ${pointer} is not alloc`)
  return getView().setUint32(pointer, value, littleEndian)
}

function readSize(pointer: pointer<void>): size {
  assert(pointer, 'Out Of Bounds, address: 0')
  assert(getAllocator().isAlloc(pointer), `address ${pointer} is not alloc`)
  if (defined(WASM_64)) {
    return getView().getBigUint64(pointer, littleEndian) as unknown as size
  }
  else {
    return getView().getUint32(pointer, littleEndian) as size
  }
}

function writeSize(pointer: pointer<void>, value: size) {
  assert(pointer, 'Out Of Bounds, address: 0')
  assert(getAllocator().isAlloc(pointer), `address ${pointer} is not alloc`)
  if (defined(WASM_64)) {
    getView().setBigUint64(pointer, reinterpret_cast<bigint>(size), littleEndian)
  }
  else {
    getView().setUint32(pointer, value, littleEndian)
  }
}

export default function init(getAllocator_: () => AllocatorInterface, getView_: () => DataView) {

  getAllocator = getAllocator_
  getView = getView_

  readoverride({
    [CTypeEnum.char]: readU8 as any,
    [CTypeEnum.atomic_char]: readU8 as any,

    [CTypeEnum.uint8]: readU8,
    [CTypeEnum.atomic_uint8]: readU8 as any,
    [CTypeEnum.uint16]: readU16,
    [CTypeEnum.atomic_uint16]: readU16 as any,
    [CTypeEnum.uint32]: readU32,
    [CTypeEnum.atomic_uint32]: readU32 as any,
    [CTypeEnum.uint64]: readU64,

    [CTypeEnum.int8]: read8,
    [CTypeEnum.atomic_int8]: read8 as any,
    [CTypeEnum.int16]: read16,
    [CTypeEnum.atomic_int16]: read16 as any,
    [CTypeEnum.int32]: read32,
    [CTypeEnum.atomic_int32]: read32 as any,
    [CTypeEnum.int64]: read64,

    [CTypeEnum.float]: readf32,
    [CTypeEnum.double]: readf64,
    [CTypeEnum.pointer]: readPointer,

    [CTypeEnum.bool]: (pointer: pointer<void>) => {
      return !!read8(pointer)
    },
    [CTypeEnum.atomic_bool]: (pointer: pointer<void>) => {
      return !!read8(pointer)
    },
    [CTypeEnum.size]: (pointer: pointer<void>) => {
      return readSize(pointer)
    }
  })

  writeoverride({
    [CTypeEnum.char]: writeU8 as any,
    [CTypeEnum.atomic_char]: writeU8,

    [CTypeEnum.uint8]: writeU8,
    [CTypeEnum.atomic_uint8]: writeU8,
    [CTypeEnum.uint16]: writeU16,
    [CTypeEnum.atomic_uint16]: writeU16 as any,
    [CTypeEnum.uint32]: writeU32,
    [CTypeEnum.atomic_uint32]: writeU32 as any,
    [CTypeEnum.uint64]: writeU64,

    [CTypeEnum.int8]: write8,
    [CTypeEnum.atomic_int8]: write8 as any,
    [CTypeEnum.int16]: write16,
    [CTypeEnum.atomic_int16]: write16 as any,
    [CTypeEnum.int32]: write32,
    [CTypeEnum.atomic_int32]: write32 as any,
    [CTypeEnum.int64]: write64,

    [CTypeEnum.float]: writef32,
    [CTypeEnum.double]: writef64,
    [CTypeEnum.pointer]: writePointer,

    [CTypeEnum.bool]: (pointer: pointer<void>, value: bool) => {
      write8(pointer, value ? 1 : 0)
    },
    [CTypeEnum.atomic_bool]: ((pointer: pointer<void>, value: bool) => {
      write8(pointer, value ? 1 : 0)
    }) as any,
    [CTypeEnum.size]: writeSize,
  })
}
