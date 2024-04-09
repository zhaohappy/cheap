import * as atomics from './atomics'
import * as mutex from './mutex'
import { Mutex } from './mutex'

@struct
export class Sem {
  atomic: atomic_int32
  mutex: Mutex
}


/**
 * 初始化信号量
 * 
 * @param sem 
 * @param value 信号量初始值
 */
export function init(sem: pointer<Sem>, value: uint32): int32 {
  atomics.store(addressof(sem.atomic), static_cast<int32>(value))
  mutex.init(addressof(sem.mutex))
  return 0
}

export function destroy(sem: pointer<Sem>): int32 {
  mutex.destroy(addressof(sem.mutex))
  return 0
}

/**
 * 生产信号量
 * 
 * @param sem 
 */
export function post(sem: pointer<Sem>): int32 {
  atomics.add(addressof(sem.atomic), 1)
  atomics.notify(addressof(sem.atomic), 1)
  return 0
}

/**
 * 消费信号量
 * 
 * @param sem 
 */
export function wait(sem: pointer<Sem>): int32 {
  while (true) {
    atomics.wait(addressof(sem.atomic), 0)
    let old = atomics.sub(addressof(sem.atomic), 1)
    if (old <= 0) {
      // 此时已经没有了，将减掉的加回来继续等待
      atomics.add(addressof(sem.atomic), 1)
    }
    else {
      break
    }
  }
  return 0
}

/**
 * 消费信号量
 * 
 * @param sem 
 */
export function tryWait(sem: pointer<Sem>): int32 {
  mutex.lock(addressof(sem.mutex))
  if (sem.atomic > 0) {
    sem.atomic--
    mutex.unlock(addressof(sem.mutex))
    return 0
  }
  mutex.unlock(addressof(sem.mutex))
  return 11
}

/**
 * 消费信号量，并设置一个超时
 * 
 * @param sem 
 * @param timeout 毫秒
 * @returns 
 */
export function timedWait(sem: pointer<Sem>, timeout: int32): int32 {
  let ret = atomics.waitTimeout(addressof(sem.atomic), 0, timeout)
  if (ret !== 2) {
    let old = atomics.sub(addressof(sem.atomic), 1)
    if (old <= 0) {
      // 此时已经没有了，将减掉的加回来
      atomics.add(addressof(sem.atomic), 1)
      // ETIMEDOUT
      return 110
    }
  }
  return 0
}

/**
 * 异步消费信号量
 * 
 * @param sem 
 */
export async function waitAsync(sem: pointer<Sem>): Promise<int32> {
  while (true) {
    await atomics.waitAsync(addressof(sem.atomic), 0)
    let old = atomics.sub(addressof(sem.atomic), 1)
    if (old <= 0) {
      // 此时已经没有了，将减掉的加回来继续等待
      atomics.add(addressof(sem.atomic), 1)
    }
    else {
      break
    }
  }
  return 0
}

/**
 * 异步消费信号量，并设置一个超时
 * 
 * @param sem 
 * @param timeout 毫秒
 */
export async function timedWaitAsync(sem: pointer<Sem>, timeout: int32): Promise<int32> {
  let ret = await atomics.waitTimeoutAsync(addressof(sem.atomic), 0, timeout)
  if (ret !== 2) {
    let old = atomics.sub(addressof(sem.atomic), 1)
    if (old <= 0) {
      // 此时已经没有了，将减掉的加回来
      atomics.add(addressof(sem.atomic), 1)
      // ETIMEDOUT
      return 110
    }
  }
  return 0
}


export function set(sem: pointer<Sem>, value: int32): int32 {
  atomics.store(addressof(sem.atomic), value)
  return 0
}

export function get(sem: pointer<Sem>): int32 {
  return atomics.load(addressof(sem.atomic))
}

