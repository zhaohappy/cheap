import * as fs from 'fs'
import * as path from 'path'
import { check, distPath } from '../transformer'

describe('static cast', () => {

  let input: string
  let output: string

  beforeAll(() => {
    input = path.join(distPath, './static_cast_input.ts')
    output = path.join(distPath, './static_cast_output.ts')
  })

  afterAll(() => {
    fs.unlinkSync(input)
    fs.rmSync(output, { force: true })
  })

  test('static_cast<uint32>(bool)', () => {
    const source = `
      let a: bool
      let b = static_cast<uint32>(a)
    `
    const target = `
      let a: bool
      let b = ((a) ? 1 : 0)
    `
    check(source, target, {
      input
    })
  })

  test('static_cast<bool>(uint32)', () => {
    const source = `
      let a: uint32
      let b = static_cast<bool>(a)
    `
    const target = `
      let a: uint32
      let b = !!a
    `
    check(source, target, {
      input
    })
  })

  test('static_cast<float>(bool)', () => {
    const source = `
      let a: bool
      let b = static_cast<float>(a)
    `
    const target = `
      let a: bool
      let b = ((a) ? 1.0 : 0.0)
    `
    check(source, target, {
      input
    })
  })

  test('static_cast<int64>(bool)', () => {
    const source = `
      let a: bool
      let b = static_cast<int64>(a)
    `
    const target = `
      let a: bool
      let b = ((a) ? 1n : 0n)
    `
    check(source, target, {
      input
    })
  })

  test('static_cast<uint8>(uint16)', () => {
    const source = `
      let a: uint16
      let b = static_cast<uint8>(a)
    `
    const target = `
      let a: uint16
      let b = (a & 0xff)
    `
    check(source, target, {
      input
    })
  })

  test('static_cast<uint16>(uint8)', () => {
    const source = `
      let a: uint8
      let b = static_cast<uint16>(a)
    `
    const target = `
      let a: uint8
      let b = a
    `
    check(source, target, {
      input
    })
  })

  test('static_cast<uint8>(float)', () => {
    const source = `
      let a: float
      let b = static_cast<uint8>(a)
    `
    const target = `
      let a: float
      let b = (((a) >> 0) & 0xff)
    `
    check(source, target, {
      input
    })
  })

  test('static_cast<float>(uint8)', () => {
    const source = `
      let a: uint8
      let b = static_cast<float>(a)
    `
    const target = `
      let a: uint8
      let b = a
    `
    check(source, target, {
      input
    })
  })

  test('static_cast<float>(double)', () => {
    const source = `
      let a: double
      let b = static_cast<float>(a)
    `
    const target = `
      let a: double
      let b = a
    `
    check(source, target, {
      input
    })
  })

  test('static_cast<uint64>(uint32)', () => {
    const source = `
      let a: uint32
      let b = static_cast<uint64>(a)
    `
    const target = `
      let a: uint32
      let b = BigInt(a)
    `
    check(source, target, {
      input
    })
  })

  test('static_cast<uint64>(100)', () => {
    const source = `
      const a = 100
      let b = static_cast<uint64>(a)
    `
    const target = `
      let a = 100
      let b = BigInt(a)
    `
    check(source, target, {
      input
    })
  })

  test('static_cast<uint64>(uint32 || 0)', () => {
    const source = `
      let a: uint32
      let b = static_cast<uint64>(a || 0)
    `
    const target = `
      let a: uint32
      let b = BigInt(a || 0)
    `
    check(source, target, {
      input
    })
  })

  test('static_cast<uint64>(double)', () => {
    const source = `
      let a: double
      let b = static_cast<uint64>(a)
    `
    const target = `
      let a: double
      let b = BigInt.asUintN(64, BigInt(Math.floor(a)))
    `
    check(source, target, {
      input
    })
  })

  test('static_cast<int64>(uint64)', () => {
    const source = `
      let a: uint64
      let b = static_cast<int64>(a)
    `
    const target = `
      let a: uint64
      let b = BigInt.asIntN(64, a)
    `
    check(source, target, {
      input
    })
  })

  test('static_cast<int64>(uint32)', () => {
    const source = `
      let a: uint32
      let b = static_cast<int64>(a)
    `
    const target = `
      let a: uint32
      let b = BigInt(a)
    `
    check(source, target, {
      input
    })
  })

  test('static_cast<int16>(uint32)', () => {
    const source = `
      let a: uint32
      let b = static_cast<int16>(a)
    `
    const target = `
      let a: uint32
      let b = (((a & 0xffff) & 0x80000) ? -(0x10000 - (a & 0xffff)) : (a & 0xffff));
    `
    check(source, target, {
      input
    })
  })

  test('static_cast<uint8>(uint32)', () => {
    const source = `
      let a: uint32
      let b = static_cast<uint8>(a)
    `
    const target = `
      let a: uint32
      let b = (a & 0xff)
    `
    check(source, target, {
      input
    })
  })

  test('static_cast<uint8>(int64)', () => {
    const source = `
      let a: int64
      let b = static_cast<uint8>(a)
    `
    const target = `
      let a: int64
      let b = Number(BigInt.asUintN(8, a))
    `
    check(source, target, {
      input
    })
  })

  test('static_cast<uint64>(uint32 || uint32)', () => {
    const source = `
      let a: uint32
      let b: uint32
      let b = static_cast<uint64>(a || b)
    `
    const target = `
      let a: uint32
      let b: uint32
      let b = BigInt(a || b)
    `
    check(source, target, {
      input
    })
  })

  test('static_cast<uint32>(uint64)', () => {
    const source = `
      let a: uint64
      let b = static_cast<uint32>(a)
    `
    const target = `
      let a: uint64
      let b = Number(BigInt.asUintN(32, a))
    `
    check(source, target, {
      input
    })
  })

  test('static_cast<int16>(uint64)', () => {
    const source = `
      let a: uint64
      let b = static_cast<int16>(a)
    `
    const target = `
      let a: uint64
      let b = Number(BigInt.asIntN(16, a))
    `
    check(source, target, {
      input
    })
  })

  test('static_cast<int8>(uint32)', () => {
    const source = `
      let a: uint32
      let b = static_cast<int8>(a)
    `
    const target = `
      let a: uint32
      let b = (((a & 0xff) & 0x80) ? -(0x100 - (a & 0xff)) : (a & 0xff));
    `
    check(source, target, {
      input,
    })
  })

  test('static_cast<int8>(uint8)', () => {
    const source = `
      let a: uint8
      let b = static_cast<int8>(a)
    `
    const target = `
      let a: uint8
      let b = ((a & 0x80) ? -(0x100 - a) : a);
    `
    check(source, target, {
      input
    })
  })

  test('static_cast<double>(uint64)', () => {
    const source = `
      let a: uint64
      let b = static_cast<double>(a)
    `
    const target = `
      let a: uint64
      let b = Number(a)
    `
    check(source, target, {
      input
    })
  })

  test('static_cast<int32>(int64 - int64)', () => {
    const source = `
      let a: int64
      let b: int64
      let c = static_cast<int32>(a - b)
    `
    const target = `
      let a: int64
      let b: int64
      let c = Number(BigInt.asIntN(32, a - b))
    `
    check(source, target, {
      input
    })
  })

  test('static_cast<int64>(float - int32 * int32)', () => {
    const source = `
      let a: float
      let b: int32
      let c = static_cast<int64>(a - b * 100)
    `
    const target = `
      let a: float
      let b: int32
      let c = BigInt(Math.floor(a - b * 100))
    `
    check(source, target, {
      input
    })
  })

  test('static_cast<int64>(int32)', () => {
    const source = `
      let c = static_cast<int64>(a as int32)
    `
    const target = `
      let c = BigInt((a as int32) >> 0);
    `
    check(source, target, {
      input
    })
  })

  test('static_cast<int32>(int64)', () => {
    const source = `
      let c = static_cast<int32>(a as int64)
    `
    const target = `
      let c = Number(BigInt.asIntN(32, a as int64))
    `
    check(source, target, {
      input
    })
  })

  test('static_cast<uint64>(enum)', () => {
    const source = `
      const enum TYPE {
        ITEM = 0
      }
      const list = [
        TYPE.ITEM
      ]
      let index: uin8 = 0
      let c = static_cast<uint64>(list[index])
    `
    const target = `
    const enum TYPE {
        ITEM = 0
      }
      const list = [
        TYPE.ITEM
      ]
      let index: uin8 = 0
      let c = BigInt(list[index] >>> 0);
    `
    check(source, target, {
      input
    })
  })

  test('static_cast<uint32>(nullptr)', () => {
    const source = `
      let c = static_cast<uint32>(nullptr)
    `
    const target = `
      let c = 0
    `
    check(source, target, {
      input
    })
  })

  test('static_cast<uint64>(nullptr) wasm64', () => {
    const source = `
      let c = static_cast<uint64>(nullptr)
    `
    const target = `
      let c = 0n
    `
    check(source, target, {
      input,
      defined: {
        WASM_64: true
      }
    })
  })

  test('static_cast<pointer>(uint32) wasm64', () => {
    const source = `
      let c = static_cast<pointer<void>>(23 as uint32)
    `
    const target = `
      let c = BigInt(23 as uint32)
    `
    check(source, target, {
      input,
      defined: {
        WASM_64: true
      }
    })
  })
})