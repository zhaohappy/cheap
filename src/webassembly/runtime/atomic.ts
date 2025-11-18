/* eslint-disable camelcase */

import * as atomics from '../../thread/atomics'
import { CTypeEnumPointerShiftMap } from '../../typedef'

export let atomic_add_i8 = function (p: pointer<atomic_int8>, value: int32) {
  // @ts-ignore
  return atomics.add(p, value, atomic_int8, CTypeEnumPointerShiftMap[atomic_int8])
}

export let atomic_sub_i8 = function (p: pointer<atomic_int8>, value: int32) {
  // @ts-ignore
  return atomics.sub(p, value, atomic_int8, CTypeEnumPointerShiftMap[atomic_int8])
}

export let atomic_and_i8 = function (p: pointer<atomic_int8>, value: int32) {
  // @ts-ignore
  return atomics.and(p, value, atomic_int8, CTypeEnumPointerShiftMap[atomic_int8])
}

export let atomic_or_i8 = function (p: pointer<atomic_int8>, value: int32) {
  // @ts-ignore
  return atomics.or(p, value, atomic_int8, CTypeEnumPointerShiftMap[atomic_int8])
}

export let atomic_xor_i8 = function (p: pointer<atomic_int8>, value: int32) {
  // @ts-ignore
  return atomics.xor(p, value, atomic_int8, CTypeEnumPointerShiftMap[atomic_int8])
}

export let atomic_store_i8 = function (p: pointer<atomic_int8>, value: int32) {
  // @ts-ignore
  return atomics.store(p, value, atomic_int8, CTypeEnumPointerShiftMap[atomic_int8])
}

export let atomic_load_i8 = function (p: pointer<atomic_int8>) {
  // @ts-ignore
  return atomics.load(p, atomic_int8, CTypeEnumPointerShiftMap[atomic_int8])
}

export let atomic_compare_exchange_i8 = function (p: pointer<atomic_int8>, expectedValue: int32, replacementValue: int32) {
  // @ts-ignore
  return atomics.compareExchange(p, expectedValue, replacementValue, atomic_int8, CTypeEnumPointerShiftMap[atomic_int8])
}

export let atomic_exchange_i8 = function (p: pointer<atomic_int8>, value: int32) {
  // @ts-ignore
  return atomics.exchange(p, value, atomic_int8, CTypeEnumPointerShiftMap[atomic_int8])
}


export let atomic_add_i16 = function (p: pointer<atomic_int16>, value: int32) {
  // @ts-ignore
  return atomics.add(p, value, atomic_int16, CTypeEnumPointerShiftMap[atomic_int16])
}

export let atomic_sub_i16 = function (p: pointer<atomic_int16>, value: int32) {
  // @ts-ignore
  return atomics.sub(p, value, atomic_int16, CTypeEnumPointerShiftMap[atomic_int16])
}

export let atomic_and_i16 = function (p: pointer<atomic_int16>, value: int32) {
  // @ts-ignore
  return atomics.and(p, value, atomic_int16, CTypeEnumPointerShiftMap[atomic_int16])
}

export let atomic_or_i16 = function (p: pointer<atomic_int16>, value: int32) {
  // @ts-ignore
  return atomics.or(p, value, atomic_int16, CTypeEnumPointerShiftMap[atomic_int16])
}

export let atomic_xor_i16 = function (p: pointer<atomic_int16>, value: int32) {
  // @ts-ignore
  return atomics.xor(p, value, atomic_int16, CTypeEnumPointerShiftMap[atomic_int16])
}

export let atomic_store_i16 = function (p: pointer<atomic_int16>, value: int32) {
  // @ts-ignore
  return atomics.store(p, value, atomic_int16, CTypeEnumPointerShiftMap[atomic_int16])
}

export let atomic_load_i16 = function (p: pointer<atomic_int16>) {
  // @ts-ignore
  return atomics.load(p, atomic_int16, CTypeEnumPointerShiftMap[atomic_int16])
}

export let atomic_compare_exchange_i16 = function (p: pointer<atomic_int16>, expectedValue: int32, replacementValue: int32) {
  // @ts-ignore
  return atomics.compareExchange(p, expectedValue, replacementValue, atomic_int16, CTypeEnumPointerShiftMap[atomic_int16])
}

export let atomic_exchange_i16 = function (p: pointer<atomic_int16>, value: int32) {
  // @ts-ignore
  return atomics.exchange(p, value, atomic_int16, CTypeEnumPointerShiftMap[atomic_int16])
}

export let atomic_add_i32 = function (p: pointer<atomic_int32>, value: int32) {
  // @ts-ignore
  return atomics.add(p, value, atomic_int32, CTypeEnumPointerShiftMap[atomic_int32])
}

export let atomic_sub_i32 = function (p: pointer<atomic_int32>, value: int32) {
  // @ts-ignore
  return atomics.sub(p, value, atomic_int32, CTypeEnumPointerShiftMap[atomic_int32])
}

export let atomic_and_i32 = function (p: pointer<atomic_int32>, value: int32) {
  // @ts-ignore
  return atomics.and(p, value, atomic_int32, CTypeEnumPointerShiftMap[atomic_int32])
}

export let atomic_or_i32 = function (p: pointer<atomic_int32>, value: int32) {
  // @ts-ignore
  return atomics.or(p, value, atomic_int32, CTypeEnumPointerShiftMap[atomic_int32])
}

export let atomic_xor_i32 = function (p: pointer<atomic_int32>, value: int32) {
  // @ts-ignore
  return atomics.xor(p, value, atomic_int32, CTypeEnumPointerShiftMap[atomic_int32])
}

export let atomic_store_i32 = function (p: pointer<atomic_int32>, value: int32) {
  // @ts-ignore
  return atomics.store(p, value, atomic_int32, CTypeEnumPointerShiftMap[atomic_int32])
}

export let atomic_load_i32 = function (p: pointer<atomic_int32>) {
  // @ts-ignore
  return atomics.load(p, atomic_int32, CTypeEnumPointerShiftMap[atomic_int32])
}

export let atomic_compare_exchange_i32 = function (p: pointer<atomic_int32>, expectedValue: int32, replacementValue: int32) {
  // @ts-ignore
  return atomics.compareExchange(p, expectedValue, replacementValue, atomic_int32, CTypeEnumPointerShiftMap[atomic_int32])
}

export let atomic_exchange_i32 = function (p: pointer<atomic_int32>, value: int32) {
  // @ts-ignore
  return atomics.exchange(p, value, atomic_int32, CTypeEnumPointerShiftMap[atomic_int32])
}



export let atomic_add_i64 = function (p: pointer<atomic_int64>, value: int64) {
  // @ts-ignore
  return atomics.add(p, value, atomic_int64, CTypeEnumPointerShiftMap[atomic_int64])
}

export let atomic_sub_i64 = function (p: pointer<atomic_int64>, value: int64) {
  // @ts-ignore
  return atomics.sub(p, value, atomic_int64, CTypeEnumPointerShiftMap[atomic_int64])
}

export let atomic_and_i64 = function (p: pointer<atomic_int64>, value: int64) {
  // @ts-ignore
  return atomics.and(p, value, atomic_int64, CTypeEnumPointerShiftMap[atomic_int64])
}

export let atomic_or_i64 = function (p: pointer<atomic_int64>, value: int64) {
  // @ts-ignore
  return atomics.or(p, value, atomic_int64, CTypeEnumPointerShiftMap[atomic_int64])
}

export let atomic_xor_i64 = function (p: pointer<atomic_int64>, value: int64) {
  // @ts-ignore
  return atomics.xor(p, value, atomic_int64, CTypeEnumPointerShiftMap[atomic_int64])
}

export let atomic_store_i64 = function (p: pointer<atomic_int64>, value: int64) {
  // @ts-ignore
  return atomics.store(p, value, atomic_int64, CTypeEnumPointerShiftMap[atomic_int64])
}

export let atomic_load_i64 = function (p: pointer<atomic_int64>) {
  // @ts-ignore
  return atomics.load(p, atomic_int64, CTypeEnumPointerShiftMap[atomic_int64])
}

export let atomic_compare_exchange_i64 = function (p: pointer<atomic_int64>, expectedValue: int64, replacementValue: int64) {
  // @ts-ignore
  return atomics.compareExchange(p, expectedValue, replacementValue, atomic_int64, CTypeEnumPointerShiftMap[atomic_int64])
}

export let atomic_exchange_i64 = function (p: pointer<atomic_int64>, value: int64) {
  // @ts-ignore
  return atomics.exchange(p, value, atomic_int64, CTypeEnumPointerShiftMap[atomic_int64])
}

export let atomics_notify = function (p: pointer<atomic_int32>, count: uint32) {
  return atomics.notify(p, count)
}

export let atomics_wait = function (p: pointer<atomic_int32>, value: int32) {
  return atomics.wait(p, value)
}

export let atomics_wait_timeout = function (p: pointer<atomic_int32>, value: int32, timeout: int64) {
  return atomics.waitTimeout(p, value, static_cast<int32>(timeout))
}

export function override(data: {
  atomic_add_i8?: typeof atomic_add_i8
  atomic_sub_i8?: typeof atomic_sub_i8
  atomic_and_i8?: typeof atomic_and_i8
  atomic_or_i8?: typeof atomic_or_i8
  atomic_xor_i8?: typeof atomic_xor_i8
  atomic_store_i8?: typeof atomic_store_i8
  atomic_load_i8?: typeof atomic_load_i8
  atomic_compare_exchange_i8?: typeof atomic_compare_exchange_i8
  atomic_exchange_i8?: typeof atomic_exchange_i8
  atomic_add_i16?: typeof atomic_add_i16
  atomic_sub_i16?: typeof atomic_sub_i16
  atomic_and_i16?: typeof atomic_and_i16
  atomic_or_i16?: typeof atomic_or_i16
  atomic_xor_i16?: typeof atomic_xor_i16
  atomic_store_i16?: typeof atomic_store_i16
  atomic_load_i16?: typeof atomic_load_i16
  atomic_compare_exchange_i16?: typeof atomic_compare_exchange_i16
  atomic_exchange_i16?: typeof atomic_exchange_i16
  atomic_add_i32?: typeof atomic_add_i32
  atomic_sub_i32?: typeof atomic_sub_i32
  atomic_and_i32?: typeof atomic_and_i32
  atomic_or_i32?: typeof atomic_or_i32
  atomic_xor_i32?: typeof atomic_xor_i32
  atomic_store_i32?: typeof atomic_store_i32
  atomic_load_i32?: typeof atomic_load_i32
  atomic_compare_exchange_i32?: typeof atomic_compare_exchange_i32
  atomic_exchange_i32?: typeof atomic_exchange_i32
  atomic_add_i64?: typeof atomic_add_i64
  atomic_sub_i64?: typeof atomic_sub_i64
  atomic_and_i64?: typeof atomic_and_i64
  atomic_or_i64?: typeof atomic_or_i64
  atomic_xor_i64?: typeof atomic_xor_i64
  atomic_store_i64?: typeof atomic_store_i64
  atomic_load_i64?: typeof atomic_load_i64
  atomic_compare_exchange_i64?: typeof atomic_compare_exchange_i64
  atomic_exchange_i64?: typeof atomic_exchange_i64
  atomics_notify?: typeof atomics_notify
  atomics_wait?: typeof atomics_wait
  atomics_wait_timeout?: typeof atomics_wait_timeout
}) {
  if (data.atomic_add_i8) {
    atomic_add_i8 = data.atomic_add_i8
  }
  if (data.atomic_sub_i8) {
    atomic_sub_i8 = data.atomic_sub_i8
  }
  if (data.atomic_and_i8) {
    atomic_and_i8 = data.atomic_and_i8
  }
  if (data.atomic_or_i8) {
    atomic_or_i8 = data.atomic_or_i8
  }
  if (data.atomic_xor_i8) {
    atomic_xor_i8 = data.atomic_xor_i8
  }
  if (data.atomic_store_i8) {
    atomic_store_i8 = data.atomic_store_i8
  }
  if (data.atomic_load_i8) {
    atomic_load_i8 = data.atomic_load_i8
  }
  if (data.atomic_compare_exchange_i8) {
    atomic_compare_exchange_i8 = data.atomic_compare_exchange_i8
  }
  if (data.atomic_exchange_i8) {
    atomic_exchange_i8 = data.atomic_exchange_i8
  }

  if (data.atomic_add_i16) {
    atomic_add_i16 = data.atomic_add_i16
  }
  if (data.atomic_sub_i16) {
    atomic_sub_i16 = data.atomic_sub_i16
  }
  if (data.atomic_and_i16) {
    atomic_and_i16 = data.atomic_and_i16
  }
  if (data.atomic_or_i16) {
    atomic_or_i16 = data.atomic_or_i16
  }
  if (data.atomic_xor_i16) {
    atomic_xor_i16 = data.atomic_xor_i16
  }
  if (data.atomic_store_i16) {
    atomic_store_i16 = data.atomic_store_i16
  }
  if (data.atomic_load_i16) {
    atomic_load_i16 = data.atomic_load_i16
  }
  if (data.atomic_compare_exchange_i16) {
    atomic_compare_exchange_i16 = data.atomic_compare_exchange_i16
  }
  if (data.atomic_exchange_i16) {
    atomic_exchange_i16 = data.atomic_exchange_i16
  }

  if (data.atomic_add_i32) {
    atomic_add_i32 = data.atomic_add_i32
  }
  if (data.atomic_sub_i32) {
    atomic_sub_i32 = data.atomic_sub_i32
  }
  if (data.atomic_and_i32) {
    atomic_and_i32 = data.atomic_and_i32
  }
  if (data.atomic_or_i32) {
    atomic_or_i32 = data.atomic_or_i32
  }
  if (data.atomic_xor_i32) {
    atomic_xor_i32 = data.atomic_xor_i32
  }
  if (data.atomic_store_i32) {
    atomic_store_i32 = data.atomic_store_i32
  }
  if (data.atomic_load_i32) {
    atomic_load_i32 = data.atomic_load_i32
  }
  if (data.atomic_compare_exchange_i32) {
    atomic_compare_exchange_i32 = data.atomic_compare_exchange_i32
  }
  if (data.atomic_exchange_i32) {
    atomic_exchange_i32 = data.atomic_exchange_i32
  }

  if (data.atomic_add_i64) {
    atomic_add_i64 = data.atomic_add_i64
  }
  if (data.atomic_sub_i64) {
    atomic_sub_i64 = data.atomic_sub_i64
  }
  if (data.atomic_and_i64) {
    atomic_and_i64 = data.atomic_and_i64
  }
  if (data.atomic_or_i64) {
    atomic_or_i64 = data.atomic_or_i64
  }
  if (data.atomic_xor_i64) {
    atomic_xor_i64 = data.atomic_xor_i64
  }
  if (data.atomic_store_i64) {
    atomic_store_i64 = data.atomic_store_i64
  }
  if (data.atomic_load_i64) {
    atomic_load_i64 = data.atomic_load_i64
  }
  if (data.atomic_compare_exchange_i64) {
    atomic_compare_exchange_i64 = data.atomic_compare_exchange_i64
  }
  if (data.atomic_exchange_i64) {
    atomic_exchange_i64 = data.atomic_exchange_i64
  }

  if (data.atomics_notify) {
    atomics_notify = data.atomics_notify
  }
  if (data.atomics_wait) {
    atomics_wait = data.atomics_wait
  }
  if (data.atomics_wait_timeout) {
    atomics_wait_timeout = data.atomics_wait_timeout
  }
}
