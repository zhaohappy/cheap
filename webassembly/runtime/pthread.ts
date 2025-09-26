/* eslint-disable camelcase */

import * as mutexUtils from '../../thread/mutex'
import * as condUtils from '../../thread/cond'
import * as config from '../../config'

import { Table } from '../../heap'
import * as atomics from '../../thread/atomics'
import { SELF } from 'common/util/constant'
import type { Mutex } from '../../thread/mutex'
import type { Cond } from '../../thread/cond'
import type { Timespec } from './semaphore'
import type { Pthread, PthreadOnce } from '../thread'
import { PthreadFlags } from '../thread'
import { readCString } from '../../std/memory'

export let wasm_pthread_mutex_init: (mutex: pointer<Mutex>, attr: pointer<void>) => int32

export let wasm_pthread_mutex_destroy: (mutex: pointer<Mutex>) => int32

export let wasm_pthread_mutex_lock: (mutex: pointer<Mutex>) => int32

export let wasm_pthread_mutex_trylock: (mutex: pointer<Mutex>) => int32

export let wasm_pthread_mutex_unlock: (mutex: pointer<Mutex>) => int32

export let wasm_pthread_cond_init: (cond: pointer<Cond>, attr: pointer<void>) => int32

export let wasm_pthread_cond_destroy: (cond: pointer<Cond>) => int32

export let wasm_pthread_cond_wait: (cond: pointer<Cond>, mutex: pointer<Mutex>) => int32

export let wasm_pthread_cond_timedwait: (cond: pointer<Cond>, mutex: pointer<Mutex>, abstime: pointer<Timespec>) => int32

export let wasm_pthread_cond_signal: (cond: pointer<Cond>) => int32

export let wasm_pthread_cond_broadcast: (cond: pointer<Cond>) => int32

export let wasm_pthread_once: (control: pointer<PthreadOnce>, func: pointer<() => void>) => int32

export function wasm_pthread_self2(): pointer<Pthread> {
  return SELF.__SELF_THREAD__ as pointer<Pthread>
}

export function wasm_pthread_exit(retval: pointer<void>) {
  const thread: pointer<Pthread> = SELF.__SELF_THREAD__
  thread.retval = retval
  thread.flags |= PthreadFlags.EXIT
}

export function wasm_pthread_equal2(t1: pointer<Pthread>, t2: pointer<Pthread>) {
  return t1.id === t2.id ? 1 : 0
}

export function wasm_pthread_support() {
  return config.USE_THREADS ? 1 : 0
}

export function wasm_cpu_core_count() {
  return navigator.hardwareConcurrency
}

export function wasm_threw_error(code: int32, msg: pointer<char>) {
  throw new Error(readCString(msg))
}

wasm_pthread_mutex_init = function (mutex: pointer<Mutex>, attr: pointer<void>) {
  return mutexUtils.init(mutex)
}

wasm_pthread_mutex_destroy = function (mutex: pointer<Mutex>) {
  return mutexUtils.destroy(mutex)
}

wasm_pthread_mutex_lock = function (mutex: pointer<Mutex>) {
  return mutexUtils.lock(mutex)
}

wasm_pthread_mutex_trylock = function (mutex: pointer<Mutex>) {
  return mutexUtils.tryLock(mutex)
}

wasm_pthread_mutex_unlock = function (mutex: pointer<Mutex>) {
  return mutexUtils.unlock(mutex)
}

wasm_pthread_cond_init = function (cond: pointer<Cond>, attr: pointer<void>) {
  return condUtils.init(cond, attr)
}

wasm_pthread_cond_destroy = function (cond: pointer<Cond>) {
  return condUtils.destroy(cond)
}

wasm_pthread_cond_wait = function (cond: pointer<Cond>, mutex: pointer<Mutex>) {
  return condUtils.wait(cond, mutex)
}

wasm_pthread_cond_timedwait = function (cond: pointer<Cond>, mutex: pointer<Mutex>, abstime: pointer<Timespec>) {
  let timeout = Number(abstime.tvSec) * 1000 + abstime.tvNSec / 1000000
  return condUtils.timedWait(cond, mutex, timeout)
}

wasm_pthread_cond_signal = function (cond: pointer<Cond>) {
  return condUtils.signal(cond)
}

wasm_pthread_cond_broadcast = function (cond: pointer<Cond>) {
  return condUtils.broadcast(cond)
}

wasm_pthread_once = function (control: pointer<PthreadOnce>, func: pointer<() => void>) {
  if (atomics.add(addressof(control.atomic), 1) === 0) {
    Table.get(func)()
  }
  return 0
}

export function override(data: {
  wasm_pthread_mutex_lock?: (mutex: pointer<Mutex>) => int32,
  wasm_pthread_mutex_trylock?: (mutex: pointer<Mutex>) => int32,
  wasm_pthread_mutex_unlock?: (mutex: pointer<Mutex>) => int32,
  wasm_pthread_cond_wait?: (cond: pointer<Cond>, mutex: pointer<Mutex>) => int32,
  wasm_pthread_cond_timedwait?: (cond: pointer<Cond>, mutex: pointer<Mutex>, abstime: pointer<Timespec>) => int32,
  wasm_pthread_cond_signal?: (cond: pointer<Cond>) => int32,
  wasm_pthread_cond_broadcast?: (cond: pointer<Cond>) => int32
}) {
  if (data.wasm_pthread_mutex_lock) {
    wasm_pthread_mutex_lock = data.wasm_pthread_mutex_lock
  }
  if (data.wasm_pthread_mutex_trylock) {
    wasm_pthread_mutex_trylock = data.wasm_pthread_mutex_trylock
  }
  if (data.wasm_pthread_mutex_unlock) {
    wasm_pthread_mutex_unlock = data.wasm_pthread_mutex_unlock
  }
  if (data.wasm_pthread_cond_wait) {
    wasm_pthread_cond_wait = data.wasm_pthread_cond_wait
  }
  if (data.wasm_pthread_cond_timedwait) {
    wasm_pthread_cond_timedwait = data.wasm_pthread_cond_timedwait
  }
  if (data.wasm_pthread_cond_signal) {
    wasm_pthread_cond_signal = data.wasm_pthread_cond_signal
  }
  if (data.wasm_pthread_cond_broadcast) {
    wasm_pthread_cond_broadcast = data.wasm_pthread_cond_broadcast
  }
}
