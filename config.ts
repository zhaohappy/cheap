import support from 'common/util/support'
import { SELF } from 'common/util/constant'
import browser from 'common/util/browser'
import os from 'common/util/os'

/**
 * 是否使用多线程
 */
export const USE_THREADS = defined(ENABLE_THREADS) && (support.thread || defined(ENV_NODE)) && (SELF as any).CHEAP_DISABLE_THREAD !== true

/**
 * 栈地址对齐
 * 栈地址至少是 16 字节对齐，因为 wasm 的基本类型中最大是 v128 16 字节
 */
export let STACK_ALIGNMENT = 16

/**
 * 栈大小，应为 STACK_ALIGNMENT 的整数倍
 */
export let STACK_SIZE = 1024 * 1024

/**
 * 堆保留段，可用于静态数据区分配
 */
export const HEAP_OFFSET = 1024

/**
 * 堆初始大小
 */
export const HEAP_INITIAL: uint32 = ((SELF as any).CHEAP_HEAP_INITIAL ?? defined(CHEAP_HEAP_INITIAL))

/**
 * 堆最大大小
 * ios safari 16 以下 对最大值有限制，太大分配不出来
 */
export const HEAP_MAXIMUM: uint32 = (SELF as any).CHEAP_HEAP_MAXIMUM
  ?? (USE_THREADS && (os.ios && !browser.checkVersion(os.version, '17', true))
    ? 8192
    : (defined(WASM_64)
      // 64 位最大 16GB
      ? 262144
      // 32 位最大 4GB
      : 65536
    )
  )
