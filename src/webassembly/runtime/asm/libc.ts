/* eslint-disable camelcase */

import asm from './libc.asm'
import asm64 from './libc64.asm'
import { BuiltinTableSlot } from '../../../allocator/Table'
import { Table } from '../../../heap'

import { base64, wasm as wasmUtils, logger } from '@libmedia/common'

/**
 * WebAssembly runtime 实例
 */
export let wasmThreadProxy: WebAssembly.Instance

let support = true

export function isSupport() {
  return support
}

export function init(memory: WebAssembly.Memory, initial: uint32, maximum: uint32) {
  try {
    const wasm = wasmUtils.setMemoryMeta(base64.base64ToUint8Array(defined(WASM_64) ? asm64 : asm), {
      shared: typeof SharedArrayBuffer === 'function' && memory.buffer instanceof SharedArrayBuffer,
      initial,
      maximum
    })

    wasmThreadProxy = new WebAssembly.Instance(new WebAssembly.Module(wasm as BufferSource), {
      env: {
        memory,
        malloc: function (size: size) {
          return malloc(size)
        },
        calloc: function (num: size, size: size) {
          return calloc(num, size)
        },
        realloc: function (pointer: pointer<void>, size: size) {
          return realloc(pointer, size)
        },
        aligned_alloc(alignment: size, size: size): pointer<void> {
          return aligned_alloc(alignment, size)
        },
        free: function (pointer: pointer<void>) {
          free(pointer)
        }
      }
    })

    Table.set(static_cast<pointer<void>>(BuiltinTableSlot.MALLOC as uint32), wasmThreadProxy.exports.malloc as any)
    Table.set(static_cast<pointer<void>>(BuiltinTableSlot.FREE as uint32), wasmThreadProxy.exports.free as any)
    Table.set(static_cast<pointer<void>>(BuiltinTableSlot.CALLOC as uint32), wasmThreadProxy.exports.calloc as any)
    Table.set(static_cast<pointer<void>>(BuiltinTableSlot.REALLOC as uint32), wasmThreadProxy.exports.realloc as any)
    Table.set(static_cast<pointer<void>>(BuiltinTableSlot.ALIGNED_ALLOC as uint32), wasmThreadProxy.exports.alignedAlloc as any)
  }
  catch (error) {
    support = false
    logger.warn('libc asm not support, cannot use asm thread function')
  }
}
