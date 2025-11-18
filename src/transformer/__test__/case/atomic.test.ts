import * as fs from 'fs'
import * as path from 'path'
import { check, distPath } from '../transformer'
import { CTypeEnum } from '../../../typedef'

describe('atomic', () => {

  let input: string
  let output: string

  beforeAll(() => {
    input = path.join(distPath, './atomic_input.ts')
    output = path.join(distPath, './atomic_output.ts')
  })

  afterAll(() => {
    fs.unlinkSync(input)
    fs.rmSync(output, { force: true })
  })

  test('add atomic_uint16', () => {
    const source = `
      type AtomicType2CTypeEnum<T> = 
        T extends atomic_bool
        ? atomic_int32
        : T
      type AtomicType2Shift<T> =
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
        : T extends atomic_bool
        ? 2
        : never
      function add<T extends atomictype, args = [
        AtomicType2CTypeEnum<T>,
        AtomicType2Shift<T>
      ]>(address: pointer<T>, value: AtomicType2Type<T>): AtomicType2Type<T> {
        return 0 as AtomicType2Type<T>
      }
      let a: pointer<atomic_uint16>
      add(a, 1)
    `
    const target = `
      type AtomicType2CTypeEnum<T> = 
        T extends atomic_bool
        ? atomic_int32
        : T
      type AtomicType2Shift<T> =
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
        : T extends atomic_bool
        ? 2
        : never
      function add<T extends atomictype, args = [
        AtomicType2CTypeEnum<T>,
        AtomicType2Shift<T>
      ]>(address: pointer<T>, value: AtomicType2Type<T>): AtomicType2Type<T> {
        return 0 as AtomicType2Type<T>
      }
      let a: pointer<atomic_uint16>
      add(a, 1, ${CTypeEnum.atomic_uint16}, 1)
    `
    check(source, target, {
      input
    })
  })

  test('load atomic_bool', () => {
    const source = `
      import * as atomic from '${path.relative(distPath, path.join(__dirname, '../../../thread/atomics.ts')).replace(/\.ts$/, '')}'
      let a: pointer<atomic_bool>
      atomic.load(a)
    `
    const target = `
      import * as atomic from '${path.relative(distPath, path.join(__dirname, '../../../thread/atomics.ts')).replace(/\.ts$/, '')}'
      let a: pointer<atomic_bool>
      !!atomic.load(a, ${CTypeEnum.atomic_int8}, 0)
    `
    check(source, target, {
      input,
      include: [path.join(__dirname, '../../../thread/atomics.ts')]
    })
  })

  test('store atomic_bool true', () => {
    const source = `
      import * as atomic from '${path.relative(distPath, path.join(__dirname, '../../../thread/atomics.ts')).replace(/\.ts$/, '')}'
      let a: pointer<atomic_bool>
      atomic.store(a, true)
    `
    const target = `
      import * as atomic from '${path.relative(distPath, path.join(__dirname, '../../../thread/atomics.ts')).replace(/\.ts$/, '')}'
      let a: pointer<atomic_bool>
      atomic.store(a, 1, ${CTypeEnum.atomic_int8}, 0)
    `
    check(source, target, {
      input,
      include: [path.join(__dirname, '../../../thread/atomics.ts')]
    })
  })

  test('store atomic_bool false', () => {
    const source = `
      import * as atomic from '${path.relative(distPath, path.join(__dirname, '../../../thread/atomics.ts')).replace(/\.ts$/, '')}'
      let a: pointer<atomic_bool>
      atomic.store(a, false)
    `
    const target = `
      import * as atomic from '${path.relative(distPath, path.join(__dirname, '../../../thread/atomics.ts')).replace(/\.ts$/, '')}'
      let a: pointer<atomic_bool>
      atomic.store(a, 0, ${CTypeEnum.atomic_int8}, 0)
    `
    check(source, target, {
      input,
      include: [path.join(__dirname, '../../../thread/atomics.ts')]
    })
  })

  test('store atomic_bool a', () => {
    const source = `
      import * as atomic from '${path.relative(distPath, path.join(__dirname, '../../../thread/atomics.ts')).replace(/\.ts$/, '')}'
      let a: pointer<atomic_bool>
      let b: atomic_bool
      atomic.store(a, b)
    `
    const target = `
      import * as atomic from '${path.relative(distPath, path.join(__dirname, '../../../thread/atomics.ts')).replace(/\.ts$/, '')}'
      let a: pointer<atomic_bool>
      let b: atomic_bool
      atomic.store(a, ((b) ? 1 : 0), ${CTypeEnum.atomic_int8}, 0)
    `
    check(source, target, {
      input,
      include: [path.join(__dirname, '../../../thread/atomics.ts')]
    })
  })

  test('exchange atomic_bool a', () => {
    const source = `
      import * as atomic from '${path.relative(distPath, path.join(__dirname, '../../../thread/atomics.ts')).replace(/\.ts$/, '')}'
      let a: pointer<atomic_bool>
      let b: atomic_bool
      atomic.exchange(a, b)
    `
    const target = `
      import * as atomic from '${path.relative(distPath, path.join(__dirname, '../../../thread/atomics.ts')).replace(/\.ts$/, '')}'
      let a: pointer<atomic_bool>
      let b: atomic_bool
      atomic.exchange(a, ((b) ? 1 : 0), ${CTypeEnum.atomic_int8}, 0)
    `
    check(source, target, {
      input,
      include: [path.join(__dirname, '../../../thread/atomics.ts')]
    })
  })

  test('compareExchange atomic_bool a', () => {
    const source = `
      import * as atomic from '${path.relative(distPath, path.join(__dirname, '../../../thread/atomics.ts')).replace(/\.ts$/, '')}'
      let a: pointer<atomic_bool>
      let b: bool
      let c: bool
      atomic.compareExchange(a, b, c)
    `
    const target = `
      import * as atomic from '${path.relative(distPath, path.join(__dirname, '../../../thread/atomics.ts')).replace(/\.ts$/, '')}'
      let a: pointer<atomic_bool>
      let b: bool
      let c: bool
      atomic.compareExchange(a, ((b) ? 1 : 0), ((c) ? 1 : 0), ${CTypeEnum.atomic_int8}, 0)
    `
    check(source, target, {
      input,
      include: [path.join(__dirname, '../../../thread/atomics.ts')]
    })
  })
})