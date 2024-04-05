export type AtomicType2Shift<T> =
  T extends atomic_char
    ? 0
    : T extends atomic_int16
      ? 1
      : T extends atomic_int32
        ? 2
        : T extends atomic_int8
          ? 0
          : T extends atomic_uint8
            ? 0
            : T extends atomic_uint16
              ? 1
              : T extends atomic_uint32
                ? 2
                : T extends atomic_uint64
                  ? 4
                  : T extends atomic_int64
                    ? 4
                    : never

/**
 * 给定的值加到数组里的某个特定位置上
 * 
 * 返回该位置的旧值
 *
 */
export let add: <T extends atomictype, args = [T, AtomicType2Shift<T>]>(address: pointer<T>, value: AtomicType2Type<T>) => AtomicType2Type<T>

/**
 * 给定的值与数组里的某个特定位置上的值相减
 * 
 * 返回该位置的旧值
 *
 */
export let sub: <T extends atomictype, args = [T, AtomicType2Shift<T>]>(address: pointer<T>, value: AtomicType2Type<T>) => AtomicType2Type<T>

/**
 * 给定的值与数组里的某个特定位置上的值进行与运算
 * 
 * 返回该位置的旧值
 *
 */
export let and: <T extends atomictype, args = [T, AtomicType2Shift<T>]>(address: pointer<T>, value: AtomicType2Type<T>) => AtomicType2Type<T>

/**
 * 给定的值与数组里的某个特定位置上的值进行或运算
 * 
 * 返回该位置的旧值
 *
 */
export let or: <T extends atomictype, args = [T, AtomicType2Shift<T>]>(address: pointer<T>, value: AtomicType2Type<T>) => AtomicType2Type<T>

/**
 * 给定的值与数组里的某个特定位置上的值进行异或运算
 * 
 * 返回该位置的旧值
 *
 */
export let xor: <T extends atomictype, args = [T, AtomicType2Shift<T>]>(address: pointer<T>, value: AtomicType2Type<T>) => AtomicType2Type<T>

/**
 * 给定的值存在给定位置上
 * 
 * 返回该位置的旧值
 *
 */
export let store: <T extends atomictype, args = [T, AtomicType2Shift<T>]>(address: pointer<T>, value: AtomicType2Type<T>) => AtomicType2Type<T>

/**
 * 读取给定位置上的值
 * 
 * 返回该位置的旧值
 *
 */
export let load: <T extends atomictype, args = [T, AtomicType2Shift<T>]>(address: pointer<T>) => AtomicType2Type<T>

/**
 * 如果数组中指定的元素与给定的值相等，则将其更新为新的值，并返回该元素原先的值
 * 
 * 返回该位置的旧值
 *
 */
export let compareExchange: <T extends atomictype, args = [T, AtomicType2Shift<T>]>(
  address: pointer<T>,
  expectedValue: AtomicType2Type<T>,
  replacementValue: AtomicType2Type<T>
) => AtomicType2Type<T>
/**
 * 将数组中指定的元素更新为给定的值，并返回该元素更新前的值。
 * 
 * 返回该位置的旧值
 *
 */
export let exchange: <T extends atomictype, args = [T, AtomicType2Shift<T>]>(address: pointer<T>, value: AtomicType2Type<T>) => AtomicType2Type<T>


/**
 * 唤醒等待队列中正在数组指定位置的元素上等待的线程。返回值为成功唤醒的线程数量。
 * 
 * 返回被唤醒的代理的数量 0 将不会唤醒任何线程
 *
 */
export let notify: (address: pointer<atomic_int32>, count: uint32) => uint32

/**
 * 检测数组中某个指定位置上的值是否仍然是给定值，是则保持挂起直到被唤醒
 * 
 * 0 "ok"、1 "not-equal"
 *
 */
export let wait: (address: pointer<atomic_int32>, value: int32) => 0 | 1 | 2

/**
 * 检测数组中某个指定位置上的值是否仍然是给定值，是则保持挂起直到被唤醒或超时（毫秒）
 * 
 * 0 "ok"、1 "not-equal" 或 2 "time-out"
 *
 */
export let waitTimeout: (address: pointer<atomic_int32>, value: int32, timeout: int32) => 0 | 1 | 2

/**
 * 检测数组中某个指定位置上的值是否仍然是给定值，是则保持挂起直到被唤醒或超时
 * 
 * 0 "ok"、1 "not-equal"
 *
 */
export let waitAsync: (address: pointer<atomic_int32>, value: int32) => Promise<0 | 1 | 2>
/**
 * 检测数组中某个指定位置上的值是否仍然是给定值，是则保持挂起直到被唤醒或超时
 * 
 * 0 "ok"、1 "not-equal" 或 2 "time-out"
 *
 */
export let waitTimeoutAsync: (address: pointer<atomic_int32>, value: int32, timeout: int32) => Promise<0 | 1 | 2>

export function override(funcs: Partial<{
  add: typeof add
  sub: typeof sub
  and: typeof and
  or: typeof or
  xor: typeof xor
  store: typeof store
  load: typeof load
  compareExchange: typeof compareExchange
  exchange: typeof exchange
  notify: typeof notify
  wait: typeof wait
  waitTimeout: typeof waitTimeout
  waitAsync: typeof waitAsync
  waitTimeoutAsync: typeof waitTimeoutAsync
}>) {
  if (funcs.add) {
    add = funcs.add
  }
  if (funcs.sub) {
    sub = funcs.sub
  }
  if (funcs.and) {
    and = funcs.and
  }
  if (funcs.or) {
    or = funcs.or
  }
  if (funcs.xor) {
    xor = funcs.xor
  }
  if (funcs.store) {
    store = funcs.store
  }
  if (funcs.load) {
    load = funcs.load
  }
  if (funcs.compareExchange) {
    compareExchange = funcs.compareExchange
  }
  if (funcs.exchange) {
    exchange = funcs.exchange
  }
  if (funcs.notify) {
    notify = funcs.notify
  }
  if (funcs.wait) {
    wait = funcs.wait
  }
  if (funcs.waitTimeout) {
    waitTimeout = funcs.waitTimeout
  }
  if (funcs.waitAsync) {
    waitAsync = funcs.waitAsync
  }
  if (funcs.waitTimeoutAsync) {
    waitTimeoutAsync = funcs.waitTimeoutAsync
  }
}
