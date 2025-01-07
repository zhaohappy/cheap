import * as fs from 'fs'
import * as path from 'path'
import { check, distPath, transform2AST } from '../transformer'

describe('parameter', () => {

  let input: string
  let output: string

  beforeAll(() => {
    input = path.join(distPath, './parameter_input.ts')
    output = path.join(distPath, './parameter_output.ts')
  })

  afterAll(() => {
    fs.unlinkSync(input)
    fs.unlinkSync(output)
  })

  test('int32 assignable to pointer<void>', () => {
    const source = `
      function test(a: pointer<void>) {
      }

      test(4 as int32)
    `
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()

    transform2AST(source, {
      input
    })

    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringMatching(/type int32 is not assignable to parameter of type pointer\n?$/))
    consoleErrorSpy.mockRestore()
  })

  test('pointer<void> assignable to int32', () => {
    const source = `
      function test(a: int32) {
      }
      let a: pointer<void>
      test(a)
    `
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()

    transform2AST(source, {
      input
    })

    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringMatching(/type pointer is not assignable to parameter of type int32\n?$/))
    consoleErrorSpy.mockRestore()
  })

  test('size assignable to int32 wasm64', () => {
    const source = `
      function test(a: size) {
      }
      let a: int32
      test(a)
    `
   
    const target = `
      function test(a: size) {
      }
      let a: int32
      test(BigInt(a))
    `
    check(source, target, {
      input,
      defined: {
        WASM_64: true
      }
    })
  })

  test('size assignable to number wasm64', () => {
    const source = `
      function test(a: size) {
      }
      test(12)
    `
   
    const target = `
      function test(a: size) {
      }
      test(12n)
    `
    check(source, target, {
      input,
      defined: {
        WASM_64: true
      }
    })
  })
})