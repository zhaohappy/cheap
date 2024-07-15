import support from 'common/util/support'
import { SELF } from 'common/util/constant'

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
export const HEAP_INITIAL = ((SELF as any).CHEAP_HEAP_INITIAL ?? defined(CHEAP_HEAP_INITIAL))

/**
 * 堆最大大小
 */
export const HEAP_MAXIMUM = 65536
