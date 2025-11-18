import * as fs from 'fs'
import * as path from 'path'
import { check, distPath } from '../transformer'

describe('merge operator', () => {

  let input: string
  let output: string

  beforeAll(() => {
    input = path.join(distPath, './merge_operator_input.ts')
    output = path.join(distPath, './merge_operator_output.ts')
  })

  afterAll(() => {
    fs.unlinkSync(input)
    fs.rmSync(output, { force: true })
  })


  test('pointer<uint8> += 1', () => {
    const source = `
      let a: pointer<uint8>
      a += 1
    `
    const target = `
      let a: pointer<uint8>
      a = a + 1
    `
    check(source, target, {
      input
    })
  })

  test('pointer<uint8> -= 1', () => {
    const source = `
      let a: pointer<uint8>
      a -= 1
    `
    const target = `
      let a: pointer<uint8>
      a = a - 1
    `
    check(source, target, {
      input
    })
  })
  
})