import * as fs from 'fs'
import * as path from 'path'
import { check, distPath, transform2AST } from '../transformer'
import { CTypeEnum } from '../../../typedef'
import {
  definedMetaPropertyImport,
  symbolImport,
  makeSharedPtrImport
} from './snippet'

describe('makeSharedPtr', () => {

  let input: string
  let output: string

  beforeAll(() => {
    input = path.join(distPath, './makeSharedPtr.ts')
    output = path.join(distPath, './makeSharedPtr_output.ts')
  })

  afterAll(() => {
    fs.unlinkSync(input)
    fs.unlinkSync(output)
  })

  test('makeSharedPtr struct', () => {
    const source = `
      @struct
      class TestA {
        a: int8
      }
      let b = make_shared_ptr<TestA>()
    `
    const target = `
      ${symbolImport}
      ${definedMetaPropertyImport}
      ${makeSharedPtrImport}
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
      let b = makeSharedPtr(TestA)
    `
    check(source, target, {
      input
    })
  })

  test('makeSharedPtr struct init', () => {
    const source = `
      @struct
      class TestA {
        a: int8
      }
      let b = make_shared_ptr<TestA>({a: 0})
    `
    const target = `
      ${symbolImport}
      ${definedMetaPropertyImport}
      ${makeSharedPtrImport}
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
      let b = makeSharedPtr({a: 0}, TestA)
    `
    check(source, target, {
      input
    })
  })

  test('makeSharedPtr builtin type', () => {
    const source = `
      let b = make_shared_ptr<uint32>()
    `
    const target = `
      ${makeSharedPtrImport}
      let b = makeSharedPtr(${CTypeEnum.uint32})
    `
    check(source, target, {
      input
    })
  })

  test('makeSharedPtr builtin type init', () => {
    const source = `
      let b = make_shared_ptr<uint32>(3)
    `
    const target = `
      ${makeSharedPtrImport}
      let b = makeSharedPtr(3, ${CTypeEnum.uint32})
    `
    check(source, target, {
      input
    })
  })

  test('makeSharedPtr no T', () => {
    const source = `
      @struct
      class TestA {
        a: int8
      }
      let b = make_shared_ptr()
    `

    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()

    transform2AST(source, {
      input
    })

    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringMatching(/invalid typeArguments\n?$/))
    consoleErrorSpy.mockRestore()
  })

  test('makeSharedPtr invalid type', () => {
    const source = `
      type a = number
      let b = make_shared_ptr<a>()
    `

    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()

    transform2AST(source, {
      input
    })

    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringMatching(/invalid typeArguments, not found struct defined of a or a is not builtin type\n?$/))
    consoleErrorSpy.mockRestore()
  })

  test('makeSharedPtr not struct', () => {
    const source = `
      class TestA {
        a: int8
      }
      let b = make_shared_ptr<TestA>()
    `

    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()

    transform2AST(source, {
      input
    })

    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringMatching(/invalid typeArguments, not found struct defined of TestA or TestA is not builtin type\n?$/))
    consoleErrorSpy.mockRestore()
  })
})