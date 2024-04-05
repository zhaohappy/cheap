import * as fs from 'fs'
import * as path from 'path'
import { check, distPath } from '../transformer'

describe('assert', () => {

  let input: string
  let output: string

  beforeAll(() => {
    input = path.join(distPath, './assert_input.ts')
    output = path.join(distPath, './assert_output.ts')
  })

  afterAll(() => {
    fs.unlinkSync(input)
    fs.unlinkSync(output)
  })

  test('assert condition', () => {
    const source = `
      let a: uint8
      assert(a > 0)
    `
    const target = `
      let a: uint8
      if (!(a > 0)) {
        console.error("[__test__cache/assert_input.ts line: 3]", 'assert [a > 0]');
        debugger;
      }
    `
    check(source, target, {
      input,
      defined: {
        DEBUG: true
      }
    })
  })

  test('assert condition msg', () => {
    const source = `
      let a: uint8
      assert(a > 0, '123')
    `
    const target = `
      let a: uint8
      if (!(a > 0)) {
        console.error("[__test__cache/assert_input.ts line: 3]", 'assert [a > 0]', '123');
        debugger;
      }
    `
    check(source, target, {
      input,
      defined: {
        DEBUG: true
      }
    })
  })

  test('assert condition production', () => {
    const source = `
      let a: uint8
      assert(a > 0)
    `
    const target = `
      let a: uint8
    `
    check(source, target, {
      input,
      defined: {
        DEBUG: false
      }
    })
  })
})