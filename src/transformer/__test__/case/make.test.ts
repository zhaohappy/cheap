import * as fs from 'fs'
import * as path from 'path'
import { check, distPath, transform2AST } from '../transformer'
import { makeImport, symbolImport, definedMetaPropertyImport } from './snippet'

describe('make', () => {

  let input: string
  let output: string

  beforeAll(() => {
    input = path.join(distPath, './make.ts')
    output = path.join(distPath, './make_output.ts')
  })

  afterAll(() => {
    fs.unlinkSync(input)
    fs.rmSync(output, { force: true })
  })

  test('make', () => {
    const source = `
      @struct
      class TestA {
        a: int8
      }
      let b = make<TestA>()
    `
    const target = `
      ${symbolImport}
      ${definedMetaPropertyImport}
      ${makeImport}
      class TestA {
        a: int8
      }
      (function (prototype) {
        var map = new Map()
        map.set("a", { 0: 11, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0 })
        definedMetaProperty(prototype, symbolStruct, true)
        definedMetaProperty(prototype, symbolStructMaxBaseTypeByteLength, 1)
        definedMetaProperty(prototype, symbolStructLength, 1)
        definedMetaProperty(prototype, symbolStructKeysMeta, map)
      })(TestA.prototype)
      let b = make(TestA)
    `
    check(source, target, {
      input
    })
  })

  test('make no T', () => {
    const source = `
      @struct
      class TestA {
        a: int8
      }
      let b = make()
    `

    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()

    transform2AST(source, {
      input
    })

    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringMatching(/invalid typeArguments\n?$/))
    consoleErrorSpy.mockRestore()
  })

  test('make not struct', () => {
    const source = `
      class TestA {
        a: int8
      }
      let b = make<TestA>()
    `
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()

    transform2AST(source, {
      input
    })

    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringMatching(/invalid typeArguments, not found struct defined of TestA\n?$/))
    consoleErrorSpy.mockRestore()
  })
})