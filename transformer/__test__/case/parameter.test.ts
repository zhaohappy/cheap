import * as fs from 'fs'
import * as path from 'path'
import { check, distPath } from '../transformer'

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
    const target = `
      function test(a: pointer<void>) {
      }
      test(4 as int32)
    `
    check(source, target, {
      input
    })
  })

  test('pointer<void> assignable to int32', () => {
    const source = `
      function test(a: int32) {
      }
      let a: pointer<void>
      test(a)
    `
    const target = `
      function test(a: int32) {
      }
      let a: pointer<void>
      test(a)
    `
    check(source, target, {
      input
    })
  })
})