export default asm64`
(func $lock (export "lock") (param $mutexAddr i64) (result i32)
  (local $status i32)
  (i32.atomic.rmw.cmpxchg (local.get $mutexAddr) (i32.const 0) (i32.const 1))
  (local.set $status)
  (local.get $status)
  (i32.const 0)
  (i32.ne)
  if
    (loop $loop
      (local.get $status)
      (i32.const 2)
      (i32.eq)
      if (result i32)
        (i32.const 1)
      else
        (i32.atomic.rmw.cmpxchg (local.get $mutexAddr) (i32.const 1) (i32.const 2))
        (i32.const 0)
        (i32.ne)
      end
      if
        (memory.atomic.wait32 (local.get $mutexAddr) (i32.const 2) (i64.const -1))
        (drop)
      end
      (i32.atomic.rmw.cmpxchg (local.get $mutexAddr) (i32.const 0) (i32.const 2))
      (local.set $status)
      (local.get $status)
      (i32.const 0)
      (i32.ne)
      (br_if $loop)
    )
  end
  (i32.const 0)
)

(func $trylock (export "trylock") (param $mutexAddr i64) (result i32)
  (i32.atomic.rmw.cmpxchg (local.get $mutexAddr) (i32.const 0) (i32.const 1))
  (i32.const 0)
  (i32.eq)
  if (result i32)
    (i32.const 0)
  else
    (i32.const 16)
  end
)

(func $unlock (export "unlock") (param $mutexAddr i64) (result i32)
  (i32.atomic.rmw.sub (local.get $mutexAddr) (i32.const 1))
  (i32.const 1)
  (i32.ne)
  if
    (i32.atomic.store (local.get $mutexAddr) (i32.const 0))
    (memory.atomic.notify (local.get $mutexAddr) (i32.const 1))
    (drop)
  end
  (i32.const 0)
)

(func (export "wait") (param $condAddr i64) (param $mutexAddr i64) (result i32)
  (local.get $condAddr)
  (i32.atomic.load (local.get $condAddr))
  (call $unlock (local.get $mutexAddr))
  (drop)
  (i64.const -1)
  (memory.atomic.wait32)
  (drop)
  (call $lock (local.get $mutexAddr))
  (drop)
  (i32.const 0)
)

(func (export "timedwait") (param $condAddr i64) (param $mutexAddr i64) (param $timeout i64) (result i32)
  (local.get $condAddr)
  (i32.atomic.load (local.get $condAddr))
  (call $unlock (local.get $mutexAddr))
  (drop)
  (i64.add (i64.mul (i64.load (local.get $timeout)) (i64.const 1000000000)) (i64.extend_i32_u (i32.load offset=8 align=4 (local.get $timeout))))
  (memory.atomic.wait32)
  (call $lock (local.get $mutexAddr))
  (drop)
  (i32.const 2)
  (i32.eq)
  if (result i32)
    (i32.const 112)
  else
    (i32.const 0)
  end
)

(func (export "signal") (param $condAddr i64) (result i32)
  (i32.atomic.rmw.add (local.get $condAddr) (i32.const 1))
  (drop)
  (memory.atomic.notify (local.get $condAddr) (i32.const 1))
  (drop)
  (i32.const 0)
)

(func (export "broadcast") (param $condAddr i64) (result i32)
  (i32.atomic.rmw.add (local.get $condAddr) (i32.const 1))
  (drop)
  (memory.atomic.notify (local.get $condAddr) (i32.const 1073741824))
  (drop)
  (i32.const 0)
)
`
