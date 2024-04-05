import * as fs from 'fs'
import * as path from 'path'
import { check, distPath } from '../transformer'

describe('defined', () => {

  let input: string
  let output: string

  beforeAll(() => {
    input = path.join(distPath, './defined_input.ts')
    output = path.join(distPath, './defined_output.ts')
  })

  afterAll(() => {
    fs.unlinkSync(input)
    fs.unlinkSync(output)
  })

  test('let a = defined(boolean)', () => {
    const source = `
      let b = defined(A)
    `
    const target = `
      let b = true
    `
    check(source, target, {
      input,
      defined: {
        A: true
      }
    })
  })

  test('let a = defined(number)', () => {
    const source = `
      let b = defined(A)
    `
    const target = `
      let b = 0
    `
    check(source, target, {
      input,
      defined: {
        A: 0
      }
    })
  })

  test('let a = defined(string)', () => {
    const source = `
      let b = defined(A)
    `
    const target = `
      let b = 'abc'
    `
    check(source, target, {
      input,
      defined: {
        A: 'abc'
      }
    })
  })

  test('call(defined(x))', () => {
    const source = `
      function a(a: number) {

      }
      a(defined(A))
    `
    const target = `
      function a(a: number) {

      }
      a(0)
    `
    check(source, target, {
      input,
      defined: {
        A: 0
      }
    })
  })
})