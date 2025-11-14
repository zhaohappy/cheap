import { override } from './atomics'
import type { AtomicsBuffer } from '../typedef'
import * as config from '../config'

import {
  getTimestamp,
  nextTick,
  browser,
  support
} from '@libmedia/common'

let getAtomicsBuffer: (type: atomictype) => AtomicsBuffer

const useAtomics = config.USE_THREADS || (!browser.chrome && support.atomics || browser.checkVersion(browser.majorVersion, '94', true))

/**
 * 给定的值加到指定位置上
 * 
 * 返回该位置的旧值
 *
 */
function add<T extends atomictype>(address: pointer<T>, value: AtomicType2Type<T>, type?: T, shift?: uint32): AtomicType2Type<T> {
  assert(address, 'Out Of Bounds, address: 0')
  if (defined(ENABLE_THREADS) && useAtomics) {
    return Atomics.add(getAtomicsBuffer(type) as Uint8Array, address >>> shift, value as uint8) as AtomicType2Type<T>
  }
  else {
    const buffer = getAtomicsBuffer(type) as Uint8Array
    const index = address >>> shift
    const old = buffer[index]
    buffer[index] += value as uint8
    return old as AtomicType2Type<T>
  }
}

/**
 * 给定的值与指定位置上的值相减
 * 
 * 返回该位置的旧值
 *
 */
function sub<T extends atomictype>(address: pointer<T>, value: AtomicType2Type<T>, type?: T, shift?: uint32): AtomicType2Type<T> {
  assert(address, 'Out Of Bounds, address: 0')
  if (defined(ENABLE_THREADS) && useAtomics) {
    return Atomics.sub(getAtomicsBuffer(type) as Uint8Array, address >>> shift, value as uint8) as AtomicType2Type<T>
  }
  else {
    const buffer = getAtomicsBuffer(type) as Uint8Array
    const index = address >>> shift
    const old = buffer[index]
    buffer[index] -= value as uint8
    return old as AtomicType2Type<T>
  }
}

/**
 * 给定的值与指定位置上的值进行与运算
 * 
 * 返回该位置的旧值
 *
 */
function and<T extends atomictype>(address: pointer<T>, value: AtomicType2Type<T>, type?: T, shift?: uint32): AtomicType2Type<T> {
  assert(address, 'Out Of Bounds, address: 0')
  if (defined(ENABLE_THREADS) && useAtomics) {
    return Atomics.and(getAtomicsBuffer(type) as Uint8Array, address >>> shift, value as uint8) as AtomicType2Type<T>
  }
  else {
    const buffer = getAtomicsBuffer(type) as Uint8Array
    const index = address >>> shift
    const old = buffer[index]
    buffer[index] &= value as uint8
    return old as AtomicType2Type<T>
  }
}

/**
 * 给定的值与指定位置上的值进行或运算
 * 
 * 返回该位置的旧值
 *
 */
function or<T extends atomictype>(address: pointer<T>, value: AtomicType2Type<T>, type?: T, shift?: uint32): AtomicType2Type<T> {
  assert(address, 'Out Of Bounds, address: 0')
  if (defined(ENABLE_THREADS) && useAtomics) {
    return Atomics.or(getAtomicsBuffer(type) as Uint8Array, address >>> shift, value as uint8) as AtomicType2Type<T>
  }
  else {
    const buffer = getAtomicsBuffer(type) as Uint8Array
    const index = address >>> shift
    const old = buffer[index]
    buffer[index] |= value as uint8
    return old as AtomicType2Type<T>
  }
}

/**
 * 给定的值与指定位置上的值进行异或运算
 * 
 * 返回该位置的旧值
 *
 */
function xor<T extends atomictype>(address: pointer<T>, value: AtomicType2Type<T>, type?: T, shift?: uint32): AtomicType2Type<T> {
  assert(address, 'Out Of Bounds, address: 0')
  if (defined(ENABLE_THREADS) && useAtomics) {
    return Atomics.xor(getAtomicsBuffer(type) as Uint8Array, address >>> shift, value as uint8) as AtomicType2Type<T>
  }
  else {
    const buffer = getAtomicsBuffer(type) as Uint8Array
    const index = address >>> shift
    const old = buffer[index]
    buffer[index] ^= value as uint8
    return old as AtomicType2Type<T>
  }
}

/**
 * 给定的值存在给定位置上
 * 
 * 返回该位置的旧值
 *
 */
function store<T extends atomictype>(address: pointer<T>, value: AtomicType2Type<T>, type?: T, shift?: uint32): AtomicType2Type<T> {
  assert(address, 'Out Of Bounds, address: 0')
  if (defined(ENABLE_THREADS) && useAtomics) {
    return Atomics.store(getAtomicsBuffer(type) as Uint8Array, address >>> shift, value as uint8) as AtomicType2Type<T>
  }
  else {
    const buffer = getAtomicsBuffer(type) as Uint8Array
    const index = address >>> shift
    const old = buffer[index]
    buffer[index] = value as uint8
    return old as AtomicType2Type<T>
  }
}

/**
 * 读取给定位置上的值
 * 
 * 返回该位置的旧值
 *
 */
function load<T extends atomictype>(address: pointer<T>, type?: T, shift?: uint32): AtomicType2Type<T> {
  assert(address, 'Out Of Bounds, address: 0')
  if (defined(ENABLE_THREADS) && useAtomics) {
    return Atomics.load(getAtomicsBuffer(type) as Uint8Array, address >>> shift as uint8) as AtomicType2Type<T>
  }
  else {
    const buffer = getAtomicsBuffer(type) as Uint8Array
    const index = address >>> shift
    const old = buffer[index]
    return old as AtomicType2Type<T>
  }
}

/**
 * 如果指定位置的值与给定的值相等，则将其更新为新的值，并返回该位置原先的值
 * 
 * 返回该位置的旧值
 *
 */
function compareExchange<T extends atomictype>(
  address: pointer<T>,
  expectedValue: AtomicType2Type<T>,
  replacementValue: AtomicType2Type<T>,
  type?: T,
  shift?: uint32
): AtomicType2Type<T> {
  assert(address, 'Out Of Bounds, address: 0')
  if (defined(ENABLE_THREADS) && useAtomics) {
    return Atomics.compareExchange(
      getAtomicsBuffer(type) as Uint8Array,
      address >>> shift,
      expectedValue as uint8,
      replacementValue as uint8
    ) as AtomicType2Type<T>
  }
  else {
    const buffer = getAtomicsBuffer(type) as Uint8Array
    const index = address >>> shift
    const old = buffer[index] as uint8
    if (old === expectedValue) {
      buffer[index] = replacementValue as uint8
    }
    return old as AtomicType2Type<T>
  }
}

/**
 * 将指定位置的值更新为给定的值，并返回该位置更新前的值。
 * 
 * 返回该位置的旧值
 *
 */
function exchange<T extends atomictype>(address: pointer<T>, value: AtomicType2Type<T>, type?: T, shift?: uint32): AtomicType2Type<T> {
  assert(address, 'Out Of Bounds, address: 0')
  if (defined(ENABLE_THREADS) && useAtomics) {
    return Atomics.exchange(getAtomicsBuffer(type) as Uint8Array, address >>> shift, value as uint8) as AtomicType2Type<T>
  }
  else {
    const buffer = getAtomicsBuffer(type) as Uint8Array
    const index = address >>> shift
    const old = buffer[index]
    buffer[index] = value as uint8
    return old as AtomicType2Type<T>
  }
}

/**
 * 唤醒等待队列中正在指定位置上等待的线程。返回值为成功唤醒的线程数量。
 * 
 * 返回被唤醒的代理的数量
 *
 */
function notify(address: pointer<atomic_int32>, count: uint32): uint32 {
  assert(address, 'Out Of Bounds, address: 0')
  if (defined(ENABLE_THREADS) && useAtomics) {
    return Atomics.notify(getAtomicsBuffer(atomic_int32) as Int32Array, address >>> 2, count)
  }
  else {
    return
  }
}

/**
 * 检测指定位置上的值是否仍然是给定值，是则保持挂起直到被唤醒
 * 
 * 0 "ok"、1 "not-equal" 或 2 "timed-out"
 *
 */
const waitMap: Record<'ok' | 'not-equal' | 'timed-out', 0 | 1 | 2> = {
  'ok': 0,
  'not-equal': 1,
  'timed-out': 2
}

function wait(address: pointer<atomic_int32>, value: int32): 0 | 1 | 2 {
  assert(address, 'Out Of Bounds, address: 0')
  return waitMap[Atomics.wait(getAtomicsBuffer(atomic_int32) as Int32Array, address >>> 2, value)]
}

/**
 * 检测指定位置上的值是否仍然是给定值，是则保持挂起直到被唤醒或超时
 * 
 * 0 "ok"、1 "not-equal" 或 2 "time-out"
 *
 */
function waitTimeout(address: pointer<atomic_int32>, value: int32, timeout: int32): 0 | 1 | 2 {
  assert(address, 'Out Of Bounds, address: 0')
  return waitMap[Atomics.wait(getAtomicsBuffer(atomic_int32) as Int32Array, address >>> 2, value, timeout)]
}

/**
 * 检测指定位置上的值是否仍然是给定值，是则保持挂起直到被唤醒
 * 
 * 0 "ok"、1 "not-equal" 或 2 "timed-out"
 *
 */
async function waitAsync(address: pointer<atomic_int32>, value: int32): Promise<0 | 1 | 2> {

  assert(address, 'Out Of Bounds, address: 0')

  if (Atomics.waitAsync) {
    const result = Atomics.waitAsync(getAtomicsBuffer(atomic_int32) as Int32Array, address >>> 2, value)
    if (result.async) {
      return waitMap[await result.value]
    }
    return waitMap[result.value as 'not-equal' | 'timed-out']
  }
  else {

    if (static_cast<int32>(load(address)) !== value) {
      return 1
    }
    else {
      while (static_cast<int32>(load(address)) === value) {
        // 跳过当前事件循环
        await new Promise<void>((resolve) => {
          nextTick(() => {
            resolve()
          })
        })
      }
      return 0
    }
  }
}

/**
 * 检测指定位置上的值是否仍然是给定值，是则保持挂起直到被唤醒或超时
 * 
 * 0 "ok"、1 "not-equal" 或 2 "time-out"
 *
 */
async function waitTimeoutAsync(address: pointer<atomic_int32>, value: int32, timeout: int32): Promise<0 | 1 | 2> {

  assert(address, 'Out Of Bounds, address: 0')

  if (Atomics.waitAsync) {
    const result = Atomics.waitAsync(getAtomicsBuffer(atomic_int32) as Int32Array, address >>> 2, value, timeout)
    if (result.async) {
      return waitMap[await result.value]
    }
    return waitMap[result.value as 'not-equal' | 'timed-out']
  }
  else {

    if (static_cast<int32>(load(address)) !== value) {
      return 1
    }
    else {
      const now = getTimestamp()

      while (static_cast<int32>(load(address)) === value && (getTimestamp() - now < timeout)) {
        // 跳过当前事件循环
        await new Promise<void>((resolve) => {
          nextTick(() => {
            resolve()
          })
        })
      }
      return load(address) !== value ? 0 : 2
    }
  }
}

export default function init(getAtomicsBuffer_: (type: atomictype) => AtomicsBuffer) {

  getAtomicsBuffer = getAtomicsBuffer_

  override({
    add,
    sub,
    and,
    or,
    xor,
    store,
    load,
    compareExchange,
    exchange,
    notify,
    wait,
    waitTimeout,
    waitAsync,
    waitTimeoutAsync
  })
}
