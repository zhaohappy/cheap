
import { SELF } from 'common/util/constant'

function load(
  typedArray: Int8Array | Uint8Array | Int16Array | Uint16Array | Int32Array | Uint32Array,
  index: number
): number {
  return typedArray[index]
}
function store(
  typedArray: Int8Array | Uint8Array | Int16Array | Uint16Array | Int32Array | Uint32Array,
  index: number,
  value: number
): number {
  const old = typedArray[index]
  typedArray[index] = value
  return old
}
function add(
  typedArray: Int8Array | Uint8Array | Int16Array | Uint16Array | Int32Array | Uint32Array,
  index: number,
  value: number
): number {
  const old = typedArray[index]
  typedArray[index] = old + value
  return old
}
function sub(
  typedArray: Int8Array | Uint8Array | Int16Array | Uint16Array | Int32Array | Uint32Array,
  index: number,
  value: number
): number {
  const old = typedArray[index]
  typedArray[index] = old - value
  return old
}
function or(
  typedArray: Int8Array | Uint8Array | Int16Array | Uint16Array | Int32Array | Uint32Array,
  index: number,
  value: number
): number {
  const old = typedArray[index]
  typedArray[index] = old | value
  return old
}
function and(
  typedArray: Int8Array | Uint8Array | Int16Array | Uint16Array | Int32Array | Uint32Array,
  index: number,
  value: number
): number {
  const old = typedArray[index]
  typedArray[index] = old & value
  return old
}
function xor(
  typedArray: Int8Array | Uint8Array | Int16Array | Uint16Array | Int32Array | Uint32Array,
  index: number,
  value: number
): number {
  const old = typedArray[index]
  typedArray[index] = old ^ value
  return old
}
function compareExchange(
  typedArray: Int8Array | Uint8Array | Int16Array | Uint16Array | Int32Array | Uint32Array,
  index: number,
  expectedValue: number,
  replacementValue: number
): number {
  const old = typedArray[index]
  if (old === expectedValue) {
    typedArray[index] = replacementValue
  }
  return old
}
function exchange(
  typedArray: Int8Array | Uint8Array | Int16Array | Uint16Array | Int32Array | Uint32Array,
  index: number,
  value: number
): number {
  const old = typedArray[index]
  typedArray[index] = value
  return old
}
function isLockFree(size: number): boolean {
  return true
}

function wait(
  typedArray: Int32Array,
  index: number,
  value: number,
  timeout?: number
): 'ok' | 'not-equal' | 'timed-out' {
  return 'ok'
}
function notify(
  typedArray: Int32Array,
  index: number,
  count?: number
): number {
  return 1
}

const Atomics = {
  add,
  compareExchange,
  exchange,
  isLockFree,
  load,
  and,
  or,
  store,
  sub,
  wait,
  notify,
  xor
}

export default function polyfill() {
  // @ts-ignore
  if (!SELF.Atomics) {
    // @ts-ignore
    SELF.Atomics = Atomics
  }
}
