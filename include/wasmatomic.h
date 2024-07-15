#ifndef __WASM_ATOMICS_H__
  #define __WASM_ATOMICS_H__

  #include "./wasmenv.h"
  #include <stddef.h>
  #include <stdint.h>

  typedef _Atomic(int8_t)             atomic_int8;
  typedef _Atomic(int16_t)            atomic_int16;
  typedef _Atomic(int32_t)            atomic_int32;
  typedef _Atomic(int64_t)            atomic_int64;

  typedef _Atomic(int8_t)             atomic_uint8;
  typedef _Atomic(int16_t)            atomic_uint16;
  typedef _Atomic(int32_t)            atomic_uint32;
  typedef _Atomic(int64_t)            atomic_uint64;

  #define atomic_bool atomic_int8
  #define atomic_char atomic_int8
  #define atomic_schar atomic_int8
  #define atomic_uchar atomic_uint8
  #define atomic_short atomic_int16
  #define atomic_ushort atomic_uint16
  #define atomic_int atomic_int32
  #define atomic_uint atomic_uint32
  #define atomic_long atomic_int32
  #define atomic_ulong atomic_uint32
  #define atomic_llong atomic_int64
  #define atomic_ullong atomic_uint64
  #define atomic_char16_t atomic_int16
  #define atomic_char32_t atomic_int32
  #define atomic_wchar_t atomic_int16
  #define atomic_int_least8_t atomic_int8
  #define atomic_uint_least8_t atomic_uint8
  #define atomic_int_least16_t atomic_int16
  #define atomic_uint_least16_t atomic_uint16
  #define atomic_int_least32_t atomic_int32
  #define atomic_uint_least32_t atomic_uint32
  #define atomic_int_least64_t atomic_int64
  #define atomic_uint_least64_t atomic_uint64
  #define atomic_int_fast8_t atomic_int8
  #define atomic_uint_fast8_t atomic_uint8
  #define atomic_int_fast16_t atomic_int16
  #define atomic_uint_fast16_t atomic_uint16
  #define atomic_int_fast32_t atomic_int32
  #define atomic_uint_fast32_t atomic_uint32
  #define atomic_int_fast64_t atomic_int64
  #define atomic_uint_fast64_t atomic_uint64
  #define atomic_intptr_t atomic_int32
  #define atomic_uintptr_t atomic_uint32
  #define atomic_size_t atomic_int32
  #define atomic_ptrdiff_t atomic_int32
  #define atomic_intmax_t atomic_int32
  #define atomic_uintmax_t atomic_int32

  #ifndef memory_order_relaxed
  #define memory_order_relaxed 0
  #endif
  #ifndef memory_order_consume
  #define memory_order_consume 1
  #endif
  #ifndef memory_order_acquire
  #define memory_order_acquire 2
  #endif
  #ifndef memory_order_release
  #define memory_order_release 3
  #endif
  #ifndef memory_order_acq_rel
  #define memory_order_acq_rel 4
  #endif
  #ifndef memory_order_seq_cst
  #define memory_order_seq_cst 5
  #endif

  #define ATOMIC_VAR_INIT(value) (value)

  EM_PORT_API(int8_t) atomic_add_i8(void* p, int8_t value);
  EM_PORT_API(int8_t) atomic_sub_i8(void* p, int8_t value);
  EM_PORT_API(int8_t) atomic_and_i8(void* p, int8_t value);
  EM_PORT_API(int8_t) atomic_or_i8(void* p, int8_t value);
  EM_PORT_API(int8_t) atomic_xor_i8(void* p, int8_t value);
  EM_PORT_API(int8_t) atomic_store_i8(void* p, int8_t value);
  EM_PORT_API(int8_t) atomic_load_i8(void* p);
  EM_PORT_API(int8_t) atomic_compare_exchange_i8(void* p, int8_t expected_value, int8_t replacement_value);
  EM_PORT_API(int8_t) atomic_exchange_i8(void* p, int8_t value);

  EM_PORT_API(int16_t) atomic_add_i16(void* p, int16_t value);
  EM_PORT_API(int16_t) atomic_sub_i16(void* p, int16_t value);
  EM_PORT_API(int16_t) atomic_and_i16(void* p, int16_t value);
  EM_PORT_API(int16_t) atomic_or_i16(void* p, int16_t value);
  EM_PORT_API(int16_t) atomic_xor_i16(void* p, int16_t value);
  EM_PORT_API(int16_t) atomic_store_i16(void* p, int16_t value);
  EM_PORT_API(int16_t) atomic_load_i16(void* p);
  EM_PORT_API(int16_t) atomic_compare_exchange_i16(void* p, int16_t expected_value, int16_t replacement_value);
  EM_PORT_API(int16_t) atomic_exchange_i16(void* p, int16_t value);

  EM_PORT_API(int32_t) atomic_add_i32(void* p, int32_t value);
  EM_PORT_API(int32_t) atomic_sub_i32(void* p, int32_t value);
  EM_PORT_API(int32_t) atomic_and_i32(void* p, int32_t value);
  EM_PORT_API(int32_t) atomic_or_i32(void* p, int32_t value);
  EM_PORT_API(int32_t) atomic_xor_i32(void* p, int32_t value);
  EM_PORT_API(int32_t) atomic_store_i32(void* p, int32_t value);
  EM_PORT_API(int32_t) atomic_load_i32(void* p);
  EM_PORT_API(int32_t) atomic_compare_exchange_i32(void* p, int32_t expected_value, int32_t replacement_value);
  EM_PORT_API(int32_t) atomic_exchange_i32(void* p, int32_t value);

  EM_PORT_API(int64_t) atomic_add_i64(void* p, int64_t value);
  EM_PORT_API(int64_t) atomic_sub_i64(void* p, int64_t value);
  EM_PORT_API(int64_t) atomic_and_i64(void* p, int64_t value);
  EM_PORT_API(int64_t) atomic_or_i64(void* p, int64_t value);
  EM_PORT_API(int64_t) atomic_xor_i64(void* p, int64_t value);
  EM_PORT_API(int64_t) atomic_store_i64(void* p, int64_t value);
  EM_PORT_API(int64_t) atomic_load_i64(void* p);
  EM_PORT_API(int64_t) atomic_compare_exchange_i64(void* p, int64_t expected_value, int64_t replacement_value);
  EM_PORT_API(int64_t) atomic_exchange_i64(void* p, int64_t value);


  /**
   * 唤醒等待队列中正在数组指定位置的元素上等待的线程。返回值为成功唤醒的线程数量。
   * 
   * 返回被唤醒的代理的数量
   **/
  EM_PORT_API(int32_t) atomics_notify(void* p, atomic_int32 count);

  /**
   * 检测数组中某个指定位置上的值是否仍然是给定值，是则保持挂起直到被唤醒
   * 
   * 0 "ok"、1 "not-equal" 或 2 "time-out"
   **/
  EM_PORT_API(int32_t) atomics_wait(void* p, atomic_int32 value);

  /**
   * 检测数组中某个指定位置上的值是否仍然是给定值，是则保持挂起直到被唤醒或超时
   * 
   * 0 "ok"、1 "not-equal" 或 2 "time-out"
   **/
  EM_PORT_API(int32_t) atomics_wait_timeout(void* p, atomic_int32 value, int64_t timeout);

  #define atomic_store(p, value) \
    ( \
      (sizeof(*p) == 8) \
      ? \
      atomic_store_i64((void*)p, value) \
      : \
      ( \
        (sizeof(*p) == 4) \
        ? atomic_store_i32((void*)p, value) \
        : ( \
          (sizeof(*p) == 2) \
          ? atomic_store_i16((void*)p, value) \
          : atomic_store_i8((void*)p, value) \
        ) \
      ) \
    )
  
  #define atomic_store_explicit(p, value, order) \
    atomic_store(p, value)
  
  #define atomic_load(p) \
    ( \
      (sizeof(*p) == 8) \
      ? \
      atomic_load_i64((void*)p) \
      : \
      ( \
        (sizeof(*p) == 4) \
        ? atomic_load_i32((void*)p) \
        : ( \
          (sizeof(*p) == 2) \
          ? atomic_load_i16((void*)p) \
          : atomic_load_i8((void*)p) \
        ) \
      ) \
    )

  #define atomic_load_explicit(p, order) \
    atomic_load(p)

  #define atomic_init(p, value) \
    atomic_store(p, value)

  #define atomic_exchange(p, value) \
    ( \
      (sizeof(*p) == 8) \
      ? \
      atomic_exchange_i64((void*)p, value) \
      : \
      ( \
        (sizeof(*p) == 4) \
        ? atomic_exchange_i32((void*)p, value) \
        : ( \
          (sizeof(*p) == 2) \
          ? atomic_exchange_i16((void*)p, value) \
          : atomic_exchange_i8((void*)p, value) \
        ) \
      ) \
    )

  #define atomic_exchange_explicit(p, value, order) \
    atomic_exchange(p, value)

  #define atomic_compare_exchange_strong(p, expected_value, replacement_value) \
    ( \
      (sizeof(*p) == 8) \
      ? \
      atomic_compare_exchange_i64((void*)p, *expected_value, replacement_value) \
      : \
      ( \
        (sizeof(*p) == 4) \
        ? atomic_compare_exchange_i32((void*)p, *expected_value, replacement_value) \
        : ( \
          (sizeof(*p) == 2) \
          ? atomic_compare_exchange_i16((void*)p, *expected_value, replacement_value) \
          : atomic_compare_exchange_i8((void*)p, *expected_value, replacement_value) \
        ) \
      ) \
    )

  #define atomic_compare_exchange_strong_explicit(p, expected_value, replacement_value, success, failure) \
    atomic_compare_exchange_strong(p, expected_value, replacement_value)

  #define atomic_fetch_add(p, value) \
    ( \
      (sizeof(*p) == 8) \
      ? \
      atomic_add_i64((void*)p, value) \
      : \
      ( \
        (sizeof(*p) == 4) \
        ? atomic_add_i32((void*)p, value) \
        : ( \
          (sizeof(*p) == 2) \
          ? atomic_add_i16((void*)p, value) \
          : atomic_add_i8((void*)p, value) \
        ) \
      ) \
    )

  #define atomic_fetch_add_explicit(p, value, order) \
    atomic_fetch_add(p, value)

  #define atomic_fetch_sub(p, value) \
    ( \
      (sizeof(*p) == 8) \
      ? \
      atomic_sub_i64((void*)p, value) \
      : \
      ( \
        (sizeof(*p) == 4) \
        ? atomic_sub_i32((void*)p, value) \
        : ( \
          (sizeof(*p) == 2) \
          ? atomic_sub_i16((void*)p, value) \
          : atomic_sub_i8((void*)p, value) \
        ) \
      ) \
    )

  #define atomic_fetch_sub_explicit(p, value, order) \
    atomic_fetch_sub(p, value)

  #define atomic_fetch_and(p, value) \
    ( \
      (sizeof(*p) == 8) \
      ? \
      atomic_and_i64((void*)p, value) \
      : \
      ( \
        (sizeof(*p) == 4) \
        ? atomic_and_i32((void*)p, value) \
        : ( \
          (sizeof(*p) == 2) \
          ? atomic_and_i16((void*)p, value) \
          : atomic_and_i8((void*)p, value) \
        ) \
      ) \
    )

  #define atomic_fetch_and_explicit(p, value, order) \
    atomic_fetch_and(p, value)
  
  #define atomic_fetch_or(p, value) \
    ( \
      (sizeof(*p) == 8) \
      ? \
      atomic_or_i64((void*)p, value) \
      : \
      ( \
        (sizeof(*p) == 4) \
        ? atomic_or_i32((void*)p, value) \
        : ( \
          (sizeof(*p) == 2) \
          ? atomic_or_i16((void*)p, value) \
          : atomic_or_i8((void*)p, value) \
        ) \
      ) \
    )

  #define atomic_fetch_or_explicit(p, value, order) \
    atomic_fetch_or(p, value)
  
  #define atomic_fetch_xor(p, value) \
    ( \
      (sizeof(*p) == 8) \
      ? \
      atomic_xor_i64((void*)p, value) \
      : \
      ( \
        (sizeof(*p) == 4) \
        ? atomic_xor_i32((void*)p, value) \
        : ( \
          (sizeof(*p) == 2) \
          ? atomic_xor_i16((void*)p, value) \
          : atomic_xor_i8((void*)p, value) \
        ) \
      ) \
    )

  #define atomic_fetch_xor_explicit(p, value, order) \
    atomic_fetch_xor(p, value)

#endif