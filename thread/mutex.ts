/**
 * 参考 https://github.com/mozilla-spidermonkey/js-lock-and-condition
 */

import { POSIXError } from '../error'
import * as atomics from './atomics'
import isWorker from 'common/function/isWorker'

@struct
export class Mutex {
  atomic: atomic_int32
}

const enum STATUS {
  UNLOCK,
  LOCKED,
  WAITED
}

/**
 * 初始化锁
 * 
 * @param mutex 
 * @returns 
 */
export function init(mutex: pointer<Mutex>): int32 {
  atomics.store(addressof(mutex.atomic), STATUS.UNLOCK)
  return 0
}

/**
 * 加锁
 * 
 * @param mutex 
 * @param spin 是否自旋
 */
export function lock(mutex: pointer<Mutex>, spin: boolean = false): int32 {
  let status: STATUS
  // 不为 UNLOCK，说明其他线程持锁，将锁置为 LOCKED 状态
  if ((status = atomics.compareExchange(addressof(mutex.atomic), STATUS.UNLOCK, STATUS.LOCKED)) !== STATUS.UNLOCK) {
    do {
      // 如果依旧得不到锁，将锁置为 WAITED 状态
      if (status == STATUS.WAITED
        || atomics.compareExchange(addressof(mutex.atomic), STATUS.LOCKED, STATUS.WAITED) !== STATUS.UNLOCK
      ) {
        // 主线程不能 wait，直接自旋（需要注意所有线程各自的持锁时间，避免出现忙等占用大量 cpu 时间）
        if (!spin && isWorker()) {
          atomics.wait(addressof(mutex.atomic), STATUS.WAITED)
        }
      }
    }
    // 再次尝试获取锁
    while ((status = atomics.compareExchange(addressof(mutex.atomic), STATUS.UNLOCK, STATUS.WAITED)) !== STATUS.UNLOCK)
  }

  return 0
}

/**
 * 尝试加锁
 * 
 * @param mutex 
 */
export function tryLock(mutex: pointer<Mutex>): int32 {
  if (atomics.compareExchange(addressof(mutex.atomic), STATUS.UNLOCK, STATUS.LOCKED) === STATUS.UNLOCK) {
    return 0
  }
  // EBUSY
  return POSIXError.EBUSY
}


/**
 * 异步加锁
 * 
 * @param mutex
 */
export async function lockAsync(mutex: pointer<Mutex>): Promise<int32> {
  let status: STATUS
  // 不为 UNLOCK，说明其他线程持锁，将锁置为 LOCKED 状态
  if ((status = atomics.compareExchange(addressof(mutex.atomic), STATUS.UNLOCK, STATUS.LOCKED)) !== STATUS.UNLOCK) {
    do {
      // 如果依旧得不到锁，将锁置为 WAITED 状态
      if (status == STATUS.WAITED
        || atomics.compareExchange(addressof(mutex.atomic), STATUS.LOCKED, STATUS.WAITED) !== STATUS.UNLOCK
      ) {
        await atomics.waitAsync(addressof(mutex.atomic), STATUS.WAITED)
      }
    }
    // 再次尝试获取锁
    while ((status = atomics.compareExchange(addressof(mutex.atomic), STATUS.UNLOCK, STATUS.WAITED)) !== STATUS.UNLOCK)
  }

  return 0
}

/**
 * 释放锁
 * 
 * @param mutex 
 */
export function unlock(mutex: pointer<Mutex>): int32 {

  assert(atomics.load(addressof(mutex.atomic)) === STATUS.LOCKED || atomics.load(addressof(mutex.atomic)) === STATUS.WAITED)

  let status: STATUS = atomics.sub(addressof(mutex.atomic), 1)
  // 此时拥有锁，状态为 LOCKED 或 WAITED
  if (status !== STATUS.LOCKED) {
    // 释放锁
    atomics.store(addressof(mutex.atomic), STATUS.UNLOCK)
    // 唤醒一个 wait 的线程
    atomics.notify(addressof(mutex.atomic), 1)
  }

  return 0
}

/**
 * 销毁锁
 * 
 * @param mutex 
 * @returns 
 */
export function destroy(mutex: pointer<Mutex>): int32 {
  atomics.store(addressof(mutex.atomic), STATUS.UNLOCK)
  return 0
}
