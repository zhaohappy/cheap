import * as fs from 'fs'
import * as path from 'path'
import { check, distPath } from '../transformer'

describe('reinterpretCast', () => {

  let input: string
  let output: string

  beforeAll(() => {
    input = path.join(distPath, './reinterpret_cast_input.ts')
    output = path.join(distPath, './reinterpret_cast_output.ts')
  })

  afterAll(() => {
    fs.unlinkSync(input)
    fs.unlinkSync(output)
  })

  test('reinterpret_cast<pointer<uint16>>(pointer<uint8>)', () => {
    const source = `
      let a: pointer<uint8>
      let b = reinterpret_cast<pointer<uint16>>(a)
    `
    const target = `
      let a: pointer<uint8>
      let b = a
    `
    check(source, target, {
      input
    })
  })

  test('reinterpret_cast<int32>(sizeof(a))', () => {
    const source = `
      let a: int32
      let b = reinterpret_cast<int32>(sizeof(a))
    `
    const target = `
      let a: int32
      let b = 4
    `
    check(source, target, {
      input
    })
  })

  test('reinterpret_cast<int32>(sizeof(a)) wasm64', () => {
    const source = `
      let a: int32
      let b = reinterpret_cast<int32>(sizeof(a))
    `
    const target = `
      let a: int32
      let b = 4
    `
    check(source, target, {
      input
    })
  })


  test('reinterpret_cast<double>(size)', () => {
    const source = `
      let a: size
      let b = reinterpret_cast<double>(a)
    `
    const target = `
      let a: size
      let b = a
    `
    check(source, target, {
      input
    })
  })
  

  test('reinterpret_cast<double>(size) wasm', () => {
    const source = `
      let a: size
      let b = reinterpret_cast<double>(a)
    `
    const target = `
      let a: size
      let b = Number(a)
    `
    check(source, target, {
      input,
      defined: {
        WASM_64: true
      }
    })
  })
})