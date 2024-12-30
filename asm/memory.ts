import { base64ToUint8Array } from 'common/util/base64'
import * as logger from 'common/util/logger'
import { override as readoverride} from '../ctypeEnumRead'
import { override as writeoverride} from '../ctypeEnumWrite'
import * as wasmUtils from 'common/util/wasm'

import asm from './memory.asm'
import { CTypeEnum } from '../typedef'

/**
 * WebAssembly runtime 实例
 */
export let instance: WebAssembly.Instance

export function support() {
  return !!instance
}

export default function init(memory: WebAssembly.Memory, initial: int32, maximum: int32) {
  if (defined(DEBUG)) {
    return
  }
  try {
    const wasm = wasmUtils.setMemoryMeta(base64ToUint8Array(asm), {
      shared: typeof SharedArrayBuffer === 'function' && memory.buffer instanceof SharedArrayBuffer,
      initial,
      maximum
    })

    instance = new WebAssembly.Instance(new WebAssembly.Module(wasm), {
      env: {
        memory
      }
    })

    readoverride({
      [CTypeEnum.char]: instance.exports.readU8 as any,
      [CTypeEnum.atomic_char]: instance.exports.readU8 as any,
      [CTypeEnum.uint8]: instance.exports.readU8 as any,
      [CTypeEnum.atomic_uint8]: instance.exports.readU8 as any,
      [CTypeEnum.uint16]: instance.exports.readU16 as any,
      [CTypeEnum.atomic_uint16]: instance.exports.readU16 as any,
      [CTypeEnum.uint32]: (pointer: pointer<void>) => {
        return (instance.exports.read32 as Function)(pointer) >>> 0
      },
      [CTypeEnum.atomic_uint32]: (pointer: pointer<void>) => {
        return (instance.exports.read32 as Function)(pointer) >>> 0
      },
      [CTypeEnum.uint64]: (pointer: pointer<void>) => {
        return BigInt.asUintN(64, (instance.exports.read64 as Function)(pointer))
      },
      [CTypeEnum.atomic_uint64]: (pointer: pointer<void>) => {
        return BigInt.asUintN(64, (instance.exports.read64 as Function)(pointer))
      },

      [CTypeEnum.int8]: instance.exports.read8 as any,
      [CTypeEnum.atomic_int8]: instance.exports.read8 as any,
      [CTypeEnum.int16]: instance.exports.read16 as any,
      [CTypeEnum.atomic_int16]: instance.exports.read16 as any,
      [CTypeEnum.int32]: instance.exports.read32 as any,
      [CTypeEnum.atomic_int32]: instance.exports.read32 as any,
      [CTypeEnum.int64]: instance.exports.read64 as any,
      [CTypeEnum.atomic_int64]: instance.exports.read64 as any,

      [CTypeEnum.float]: instance.exports.readf32 as any,
      [CTypeEnum.double]: instance.exports.readf64 as any,

      [CTypeEnum.pointer]: (pointer: pointer<void>) => {
        return (instance.exports.read32 as Function)(pointer) >>> 0
      }
    })

    writeoverride({
      [CTypeEnum.char]: instance.exports.write8 as any,
      [CTypeEnum.atomic_char]: instance.exports.write8 as any,

      [CTypeEnum.uint8]: instance.exports.write8 as any,
      [CTypeEnum.atomic_uint8]: instance.exports.write8 as any,
      [CTypeEnum.uint16]: instance.exports.write16 as any,
      [CTypeEnum.atomic_uint16]: instance.exports.write16 as any,
      [CTypeEnum.uint32]: instance.exports.write32 as any,
      [CTypeEnum.atomic_uint32]: instance.exports.write32 as any,
      [CTypeEnum.uint64]: instance.exports.write64 as any,
      [CTypeEnum.atomic_uint64]: instance.exports.write64 as any,

      [CTypeEnum.int8]: instance.exports.write8 as any,
      [CTypeEnum.atomic_int8]: instance.exports.write8 as any,
      [CTypeEnum.int16]: instance.exports.write16 as any,
      [CTypeEnum.atomic_int16]: instance.exports.write16 as any,
      [CTypeEnum.int32]: instance.exports.write32 as any,
      [CTypeEnum.atomic_int32]: instance.exports.write32 as any,
      [CTypeEnum.int64]: instance.exports.write64 as any,
      [CTypeEnum.atomic_int64]: instance.exports.write64 as any,

      [CTypeEnum.float]: instance.exports.writef32 as any,
      [CTypeEnum.double]: instance.exports.writef64 as any,

      [CTypeEnum.pointer]: instance.exports.write32 as any
    })
  }
  catch (error) {
    logger.warn('memory asm not support, cannot use asm memory function')
  }
}
