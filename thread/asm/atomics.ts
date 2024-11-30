import { base64ToUint8Array } from 'common/util/base64'
import * as logger from 'common/util/logger'
import * as wasmUtils from 'common/util/wasm'

import asm from './atomics.asm'

import { override } from '../atomics'

/**
 * WebAssembly runtime 实例
 */
export let instance: WebAssembly.Instance

export function isSupport() {
  return !!instance
}

export default async function init(memory: WebAssembly.Memory, initial: int32, maximum: int32) {
  if (defined(DEBUG)) {
    return
  }
  try {
    if (typeof SharedArrayBuffer === 'function' && memory.buffer instanceof SharedArrayBuffer) {

      const wasm = wasmUtils.setMemoryMeta(base64ToUint8Array(asm), {
        shared: true,
        initial,
        maximum
      })

      instance = (await WebAssembly.instantiate(wasm, {
        env: {
          memory
        }
      })).instance
    }
    else {
      return
    }

    override({
      add: function<T> (address: pointer<T>, value: AtomicType2Type<T>, type?: atomictype): AtomicType2Type<T> {

        assert(address, 'Out Of Bounds, address: 0')

        switch (type) {
          case atomic_char:
          case atomic_uint8:
            return ((instance.exports.add8 as Function)(address, value) & 0xff) as AtomicType2Type<T>
          case atomic_int8:
            return (instance.exports.add8 as Function)(address, value)
          case atomic_int16:
            return (instance.exports.add16 as Function)(address, value)
          case atomic_uint16:
            return ((instance.exports.add16 as Function)(address, value) & 0xffff) as AtomicType2Type<T>
          case atomic_int32:
            assert(!(address % 4))
            return (instance.exports.add32 as Function)(address, value)
          case atomic_uint32:
            return ((instance.exports.add32 as Function)(address, value) & 0xffffffff) as AtomicType2Type<T>
          case atomic_int64:
            return (instance.exports.add64 as Function)(address, value)
          case atomic_uint64:
            return BigInt.asUintN(64, (instance.exports.add64 as Function)(address, value)) as AtomicType2Type<T>
        }
      },
      sub: function<T> (address: pointer<T>, value: AtomicType2Type<T>, type?: atomictype): AtomicType2Type<T> {

        assert(address, 'Out Of Bounds, address: 0')

        switch (type) {
          case atomic_char:
          case atomic_uint8:
            return ((instance.exports.sub8 as Function)(address, value) & 0xff) as AtomicType2Type<T>
          case atomic_int8:
            return (instance.exports.sub8 as Function)(address, value)
          case atomic_int16:
            return (instance.exports.sub16 as Function)(address, value)
          case atomic_uint16:
            return ((instance.exports.sub16 as Function)(address, value) & 0xffff) as AtomicType2Type<T>
          case atomic_int32:
            assert(!(address % 4))
            return (instance.exports.sub32 as Function)(address, value)
          case atomic_uint32:
            return ((instance.exports.sub32 as Function)(address, value) & 0xffffffff) as AtomicType2Type<T>
          case atomic_int64:
            return (instance.exports.sub64 as Function)(address, value)
          case atomic_uint64:
            return BigInt.asUintN(64, (instance.exports.sub64 as Function)(address, value)) as AtomicType2Type<T>
        }
      },
      and: function<T> (address: pointer<T>, value: AtomicType2Type<T>, type?: atomictype): AtomicType2Type<T> {

        assert(address, 'Out Of Bounds, address: 0')

        switch (type) {
          case atomic_char:
          case atomic_uint8:
            return ((instance.exports.and8 as Function)(address, value) & 0xff) as AtomicType2Type<T>
          case atomic_int8:
            return (instance.exports.and8 as Function)(address, value)
          case atomic_int16:
            return (instance.exports.and16 as Function)(address, value)
          case atomic_uint16:
            return ((instance.exports.and16 as Function)(address, value) & 0xffff) as AtomicType2Type<T>
          case atomic_int32:
            return (instance.exports.and32 as Function)(address, value)
          case atomic_uint32:
            return ((instance.exports.and32 as Function)(address, value) & 0xffffffff) as AtomicType2Type<T>
          case atomic_int64:
            return (instance.exports.and64 as Function)(address, value)
          case atomic_uint64:
            return BigInt.asUintN(64, (instance.exports.and64 as Function)(address, value)) as AtomicType2Type<T>
        }
      },
      or: function<T> (address: pointer<T>, value: AtomicType2Type<T>, type?: atomictype): AtomicType2Type<T> {

        assert(address, 'Out Of Bounds, address: 0')

        switch (type) {
          case atomic_char:
          case atomic_uint8:
            return ((instance.exports.or8 as Function)(address, value) & 0xff) as AtomicType2Type<T>
          case atomic_int8:
            return (instance.exports.or8 as Function)(address, value)
          case atomic_int16:
            return (instance.exports.or16 as Function)(address, value)
          case atomic_uint16:
            return ((instance.exports.or16 as Function)(address, value) & 0xffff) as AtomicType2Type<T>
          case atomic_int32:
            return (instance.exports.or32 as Function)(address, value)
          case atomic_uint32:
            return ((instance.exports.or32 as Function)(address, value) as 0xffffffff) as AtomicType2Type<T>
          case atomic_int64:
            return (instance.exports.or64 as Function)(address, value)
          case atomic_uint64:
            return BigInt.asUintN(64, (instance.exports.or64 as Function)(address, value)) as AtomicType2Type<T>
        }
      },
      xor: function<T> (address: pointer<T>, value: AtomicType2Type<T>, type?: atomictype): AtomicType2Type<T> {

        assert(address, 'Out Of Bounds, address: 0')

        switch (type) {
          case atomic_char:
          case atomic_uint8:
            return ((instance.exports.xor8 as Function)(address, value) & 0xff) as AtomicType2Type<T>
          case atomic_int8:
            return (instance.exports.xor8 as Function)(address, value)
          case atomic_int16:
            return (instance.exports.xor16 as Function)(address, value)
          case atomic_uint16:
            return ((instance.exports.xor16 as Function)(address, value) & 0xffff) as AtomicType2Type<T>
          case atomic_int32:
            return (instance.exports.xor32 as Function)(address, value)
          case atomic_uint32:
            return ((instance.exports.xor32 as Function)(address, value) as 0xffffffff) as AtomicType2Type<T>
          case atomic_int64:
            return (instance.exports.xor64 as Function)(address, value)
          case atomic_uint64:
            return BigInt.asUintN(64, (instance.exports.xor64 as Function)(address, value)) as AtomicType2Type<T>
        }
      },
      store: function<T> (address: pointer<T>, value: AtomicType2Type<T>, type?: atomictype): AtomicType2Type<T> {

        assert(address, 'Out Of Bounds, address: 0')

        switch (type) {
          case atomic_char:
          case atomic_int8:
          case atomic_uint8:
            return (instance.exports.store8 as Function)(address, value)
          case atomic_int16:
          case atomic_uint16:
            return (instance.exports.store16 as Function)(address, value)
          case atomic_int32:
          case atomic_uint32:
            assert(!(address % 4))
            return (instance.exports.store32 as Function)(address, value)
          case atomic_int64:
          case atomic_uint64:
            return (instance.exports.store64 as Function)(address, value)
        }
      },
      load: function<T> (address: pointer<T>, type?: atomictype): AtomicType2Type<T> {

        assert(address, 'Out Of Bounds, address: 0')

        switch (type) {
          case atomic_char:
          case atomic_uint8:
            return ((instance.exports.load8 as Function)(address) & 0xff) as AtomicType2Type<T>
          case atomic_int8:
            return (instance.exports.load8 as Function)(address)
          case atomic_int16:
            return (instance.exports.load16 as Function)(address)
          case atomic_uint16:
            return ((instance.exports.load16 as Function)(address) as 0xffff) as AtomicType2Type<T>
          case atomic_int32:
            assert(!(address % 4))
            return (instance.exports.load32 as Function)(address)
          case atomic_uint32:
            return ((instance.exports.load32 as Function)(address) & 0xffffffff) as AtomicType2Type<T>
          case atomic_int64:
            return (instance.exports.load64 as Function)(address)
          case atomic_uint64:
            return BigInt.asUintN(64, (instance.exports.load64 as Function)(address)) as AtomicType2Type<T>
        }
      },
      compareExchange: function<T> (
        address: pointer<T>,
        expectedValue: AtomicType2Type<T>,
        replacementValue: AtomicType2Type<T>,
        type?: atomictype
      ): AtomicType2Type<T> {

        assert(address, 'Out Of Bounds, address: 0')

        switch (type) {
          case atomic_char:
          case atomic_uint8:
            return ((instance.exports.compare_exchange8 as Function)(address, expectedValue, replacementValue) & 0xff) as AtomicType2Type<T>
          case atomic_int8:
            return (instance.exports.compare_exchange8 as Function)(address, expectedValue, replacementValue)
          case atomic_int16:
            return (instance.exports.compare_exchange16 as Function)(address, expectedValue, replacementValue)
          case atomic_uint16:
            return ((instance.exports.compare_exchange16 as Function)(address, expectedValue, replacementValue) & 0xffff) as AtomicType2Type<T>
          case atomic_int32:
            return (instance.exports.compare_exchange32 as Function)(address, expectedValue, replacementValue)
          case atomic_uint32:
            return ((instance.exports.compare_exchange32 as Function)(address, expectedValue, replacementValue) & 0xffffffff) as AtomicType2Type<T>
          case atomic_int64:
            return (instance.exports.compare_exchange64 as Function)(address, expectedValue, replacementValue)
          case atomic_uint64:
            return BigInt.asUintN(64, (instance.exports.compare_exchange64 as Function)(
              address,
              expectedValue,
              replacementValue
            )) as AtomicType2Type<T>
        }
      },
      exchange: function<T> (address: pointer<T>, value: AtomicType2Type<T>, type?: atomictype): AtomicType2Type<T> {

        assert(address, 'Out Of Bounds, address: 0')

        switch (type) {
          case atomic_char:
          case atomic_uint8:
            return ((instance.exports.exchange8 as Function)(address, value) & 0xff) as AtomicType2Type<T>
          case atomic_int8:
            return (instance.exports.exchange8 as Function)(address, value)
          case atomic_int16:
            return (instance.exports.exchange16 as Function)(address, value)
          case atomic_uint16:
            return ((instance.exports.exchange16 as Function)(address, value) & 0xffff) as AtomicType2Type<T>
          case atomic_int32:
            return (instance.exports.exchange32 as Function)(address, value)
          case atomic_uint32:
            return ((instance.exports.exchange32 as Function)(address, value) & 0xffffffff) as AtomicType2Type<T>
          case atomic_int64:
            return (instance.exports.exchange64 as Function)(address, value)
          case atomic_uint64:
            return BigInt.asUintN(64, (instance.exports.exchange64 as Function)(address, value)) as AtomicType2Type<T>
        }
      },
      notify: function (address: pointer<atomic_int32>, count: uint32) {

        assert(address, 'Out Of Bounds, address: 0')

        return (instance.exports.notify as Function)(address, count)
      },
      wait: function (address: pointer<atomic_int32>, value: int32) {

        assert(address, 'Out Of Bounds, address: 0')

        return (instance.exports.wait as Function)(address, value)
      },

      waitTimeout: function (address: pointer<atomic_int32>, value: int32, timeout?: int32) {

        assert(address, 'Out Of Bounds, address: 0')

        return (instance.exports.waitTimeout as Function)(address, value, static_cast<int64>(timeout))
      }
    })
  }
  catch (error) {
    logger.warn('atomics asm not support, cannot use asm atomics function')
  }
}
