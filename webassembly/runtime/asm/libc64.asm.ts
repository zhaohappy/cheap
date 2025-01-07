export default asm64`
(func $env.malloc (;0;) (import "env" "malloc") (param i64) (result i64))
(func $env.free (;1;) (import "env" "free") (param i64))
(func $env.calloc (;2;) (import "env" "calloc") (param i64 i64) (result i64))
(func $env.realloc (;3;) (import "env" "realloc") (param i64 i64) (result i64))
(func $env.aligned_alloc (;4;) (import "env" "aligned_alloc") (param i64 i64) (result i64))

(func $malloc (export "malloc") (param $size i64) (result i64)
  (call $env.malloc (local.get $size))
)
(func $free (export "free") (param $pointer i64)
  (call $env.free (local.get $pointer))
)
(func $calloc (export "calloc") (param $num i64) (param $size i64) (result i64)
  (call $env.calloc (local.get $num) (local.get $size))
)
(func $realloc (export "realloc") (param $pointer i64) (param $size i64) (result i64)
  (call $env.realloc (local.get $pointer) (local.get $size))
)
(func $aligned_alloc (export "alignedAlloc") (param $alignment i64) (param $size i64) (result i64)
  (call $env.realloc (local.get $alignment) (local.get $size))
)
`
