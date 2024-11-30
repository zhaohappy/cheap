/* eslint-disable camelcase */

import { base64ToUint8Array } from 'common/util/base64'
import * as logger from 'common/util/logger'

import asm from './thread.asm'
import { Mutex } from '../../../thread/mutex'
import { Cond } from '../../../thread/cond'
import { Timespec } from '../semaphore'
import * as wasmUtils from 'common/util/wasm'

/**
 * WebAssembly runtime 实例
 */
export let wasmThreadProxy: WebAssembly.Instance

let support = true

export function isSupport() {
  return support
}

export async function init(memory: WebAssembly.Memory, initial: int32, maximum: int32, override: (
  data: {
    wasm_pthread_mutex_lock: (mutex: pointer<Mutex>) => int32,
    wasm_pthread_mutex_trylock: (mutex: pointer<Mutex>) => int32,
    wasm_pthread_mutex_unlock: (mutex: pointer<Mutex>) => int32,
    wasm_pthread_cond_wait: (cond: pointer<Cond>, mutex: pointer<Mutex>) => int32,
    wasm_pthread_cond_timedwait: (cond: pointer<Cond>, mutex: pointer<Mutex>, abstime: pointer<Timespec>) => int32,
    wasm_pthread_cond_signal: (cond: pointer<Cond>) => int32,
    wasm_pthread_cond_broadcast: (cond: pointer<Cond>) => int32
  }
) => void) {
  try {
    if (typeof SharedArrayBuffer === 'function' && memory.buffer instanceof SharedArrayBuffer) {
      const wasm = wasmUtils.setMemoryMeta(base64ToUint8Array(asm), {
        shared: true,
        initial,
        maximum
      })

      wasmThreadProxy = (await WebAssembly.instantiate(wasm, {
        env: {
          memory
        }
      })).instance
    }
    else {
      support = false
      return
    }
    override({
      wasm_pthread_mutex_lock: wasmThreadProxy.exports.lock as (mutex: pointer<Mutex>) => int32,
      wasm_pthread_mutex_trylock: wasmThreadProxy.exports.trylock as (mutex: pointer<Mutex>) => int32,
      wasm_pthread_mutex_unlock: wasmThreadProxy.exports.unlock as (mutex: pointer<Mutex>) => int32,
      wasm_pthread_cond_wait: wasmThreadProxy.exports.wait as (cond: pointer<Cond>, mutex: pointer<Mutex>) => int32,
      wasm_pthread_cond_timedwait: wasmThreadProxy.exports.timedwait as (
        cond: pointer<Cond>,
        mutex: pointer<Mutex>,
        abstime: pointer<Timespec>
      ) => int32,
      wasm_pthread_cond_signal: wasmThreadProxy.exports.signal as (cond: pointer<Cond>) => int32,
      wasm_pthread_cond_broadcast: wasmThreadProxy.exports.broadcast as (cond: pointer<Cond>) => int32
    })
  }
  catch (error) {
    support = false
    logger.warn('thread asm not support, cannot use asm thread function')
  }
}
