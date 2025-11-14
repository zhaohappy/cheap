/**
 * 静态分配区只能在此文件分配
 * 导出在其他地方使用
 */

import * as config from './config'
import { Mutex } from './thread/mutex'

/**
 * 静态分配区栈顶指针
 */
let pointer: pointer<void> = reinterpret_cast<pointer<void>>(reinterpret_cast<pointer<pointer<void>>>(nullptr) + 1)

export function malloc(length: size, algin: size = 1): pointer<void> {

  let address = pointer

  while (address % algin) {
    address++
  }

  assert(address < config.HEAP_OFFSET, 'static data overflow')

  pointer = reinterpret_cast<pointer<void>>(address + length)

  return address
}

/**
 * 线程计数器地址
 */
export const threadCounter: pointer<uint32> = reinterpret_cast<pointer<uint32>>(malloc(sizeof(uint32), sizeof(uint32)))

/**
 * 堆分配锁地址
 */
export const heapMutex: pointer<Mutex> = reinterpret_cast<pointer<Mutex>>(malloc(sizeof(Mutex), sizeof(atomic_int32)))

/**
 * 32 位唯一 id 生成地址
 */
export const uniqueCounter32: pointer<atomic_uint32> = reinterpret_cast<pointer<atomic_uint32>>(malloc(sizeof(atomic_uint32), sizeof(atomic_uint32)))

/**
 * 64 位唯一 id 生成地址
 */
export const uniqueCounter64: pointer<atomic_uint64> = reinterpret_cast<pointer<atomic_uint64>>(malloc(sizeof(atomic_uint64), sizeof(atomic_uint64)))
