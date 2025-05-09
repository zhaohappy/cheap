export default asm`
(func $write8 (export "write8") (param $p0 i32) (param $p1 i32)
  (local.get $p0)
  (local.get $p1)
  (i32.store8)
)
(func $write16 (export "write16") (param $p0 i32) (param $p1 i32)
  (local.get $p0)
  (local.get $p1)
  (i32.store16)
)
(func $write32 (export "write32") (param $p0 i32) (param $p1 i32)
  (local.get $p0)
  (local.get $p1)
  (i32.store)
)
(func $write64 (export "write64") (param $p0 i32) (param $p1 i64)
  (local.get $p0)
  (local.get $p1)
  (i64.store)
)
(func $writef32 (export "writef32") (param $p0 i32) (param $p1 f32)
  (local.get $p0)
  (local.get $p1)
  (f32.store)
)
(func $writef64 (export "writef64")(param $p0 i32) (param $p1 f64)
  (local.get $p0)
  (local.get $p1)
  (f64.store)
)
(func $read8 (export "read8") (param $p0 i32) (result i32)
  (local.get $p0)
  (i32.load8_s)
)
(func $readU8 (export "readU8") (param $p0 i32) (result i32)
  (local.get $p0)
  (i32.load8_u)
)
(func $read16 (export "read16") (param $p0 i32) (result i32)
  (local.get $p0)
  (i32.load16_s)
)
(func $readU16 (export "readU16") (param $p0 i32) (result i32)
  (local.get $p0)
  (i32.load16_u)
)
(func $read32 (export "read32") (param $p0 i32) (result i32)
  (local.get $p0)
  (i32.load)
)
(func $read64 (export "read64") (param $p0 i32) (result i64)
  (local.get $p0)
  (i64.load)
)
(func $readf32 (export "readf32") (param $p0 i32) (result f32)
  (local.get $p0)
  (f32.load)
)
(func $readf64 (export "readf64") (param $p0 i32) (result f64)
  (local.get $p0)
  (f64.load)
)
(func $fill (export "fill") (param $p0 i32) (param $p1 i32) (param $p2 i32)
  (local.get $p0)
  (local.get $p1)
  (local.get $p2)
  (memory.fill)
)
(func $copy (export "copy") (param $p0 i32) (param $p1 i32) (param $p2 i32)
  (local.get $p0)
  (local.get $p1)
  (local.get $p2)
  (memory.copy)
)
`
