/* eslint-disable camelcase */

import { base64ToUint8Array } from 'common/util/base64'
import * as logger from 'common/util/logger'

import asm from './libc.asm'
import * as wasmUtils from 'common/util/wasm'
import { BuiltinTableSlot } from '../../../allocator/Table'
import { Table } from '../../../heap'

/**
 * WebAssembly runtime 实例
 */
export let wasmThreadProxy: WebAssembly.Instance

let support = true

export function isSupport() {
  return support
}

export async function init(memory: WebAssembly.Memory) {
  try {
    if (typeof SharedArrayBuffer === 'function' && memory.buffer instanceof SharedArrayBuffer) {

      const wasm = base64ToUint8Array(asm)

      wasmUtils.setMemoryShared(wasm, true)

      wasmThreadProxy = (await WebAssembly.instantiate(wasm, {
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
      })).instance
      Table.set(BuiltinTableSlot.MALLOC, wasmThreadProxy.exports.malloc as any)
      Table.set(BuiltinTableSlot.FREE, wasmThreadProxy.exports.free as any)
      Table.set(BuiltinTableSlot.CALLOC, wasmThreadProxy.exports.calloc as any)
      Table.set(BuiltinTableSlot.REALLOC, wasmThreadProxy.exports.realloc as any)
      Table.set(BuiltinTableSlot.ALIGNED_ALLOC, wasmThreadProxy.exports.alignedAlloc as any)
    }
    else {
      support = false
      return
    }
    
  }
  catch (error) {
    support = false
    logger.warn('thread asm not support, cannot use asm thread function')
  }
}
