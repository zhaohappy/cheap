/**
 * 参考 https://github.com/mozilla-spidermonkey/js-lock-and-condition
 */

import * as mutexUtil from './mutex'
import * as atomics from './atomics'
import { Mutex } from './mutex'

@struct
export class Cond {
  atomic: atomic_int32
}

/**
 * 初始化条件变量
 */
export function init(cond: pointer<Cond>, attr: pointer<void>): int32 {
  atomics.store(addressof(cond.atomic), 0)
  return 0
}

/**
 * 销毁条件变量
 */
export function destroy(cond: pointer<Cond>): int32 {
  atomics.store(addressof(cond.atomic), 0)
  return 0
}

/**
 * 唤醒条件变量上的一个等待线程
 * 
 * @param cond 
 * @param atomics 
 */
export function signal(cond: pointer<Cond>): int32 {
  atomics.add(addressof(cond.atomic), 1)
  atomics.notify(addressof(cond.atomic), 1)
  return 0
}

/**
 * 唤醒条件变量上的所有等待线程
 * 
 * @param cond 
 * @param atomics 
 */
export function broadcast(cond: pointer<Cond>): int32 {
  atomics.add(addressof(cond.atomic), 1)
  atomics.notify(addressof(cond.atomic), 1 << 30)
  return 0
}

/**
 * 线程在条件变量处等待
 * 
 * @param cond 
 * @param mutex 
 * @param atomics 
 * @returns 
 */
export function wait(cond: pointer<Cond>, mutex: pointer<Mutex>): int32 {
  let c = atomics.load(addressof(cond.atomic))
  mutexUtil.unlock(mutex)
  atomics.wait(addressof(cond.atomic), c)
  mutexUtil.lock(mutex)
  return 0
}

/**
 * 异步线程在条件变量处等待
 * 
 * @param cond 
 * @param mutex 
 * @param atomics 
 * @returns 
 */
export async function waitAsync(cond: pointer<Cond>, mutex: pointer<Mutex>): Promise<int32> {
  let c = atomics.load(addressof(cond.atomic))
  mutexUtil.unlock(mutex)

  await atomics.waitAsync(addressof(cond.atomic), c)

  await mutexUtil.lockAsync(mutex)

  return 0
}

/**
 * 线程在条件变量处超时等待
 * 
 * @param cond 
 * @param mutex 
 * @param timeout 毫秒
 * @returns 
 */
export function timedWait(cond: pointer<Cond>, mutex: pointer<Mutex>, timeout: int32): int32 {
  let c = atomics.load(addressof(cond.atomic))
  mutexUtil.unlock(mutex)
  let ret = atomics.waitTimeout(addressof(cond.atomic), c, timeout)
  mutexUtil.lock(mutex)
  return ret === 2 ? 110 : 0
}

/**
 * 异步线程在条件变量处超时等待
 * 
 * @param cond 
 * @param mutex 
 * @param timeout 毫秒
 * @returns 
 */
export async function timedwaitAsync(cond: pointer<Cond>, mutex: pointer<Mutex>, timeout: int32): Promise<int32> {
  let c = atomics.load(addressof(cond.atomic))
  mutexUtil.unlock(mutex)
  let ret = await atomics.waitTimeoutAsync(addressof(cond.atomic), c, timeout)
  await mutexUtil.lockAsync(mutex)
  return ret === 2 ? 110 : 0
}

