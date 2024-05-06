import * as fs from 'fs'
import * as path from 'path'
import { check, distPath } from '../transformer'

describe('args', () => {

  let input: string
  let output: string

  beforeAll(() => {
    input = path.join(distPath, './asm_input.ts')
    output = path.join(distPath, './asm_output.ts')
  })

  afterAll(() => {
    fs.unlinkSync(input)
    fs.unlinkSync(output)
  })


  test('asm', () => {
    const source = `
      const text = asm\`
      (func $write16 (export "write16") (param $p0 i32) (param $p1 i32)
        (local.get $p0)
        (local.get $p1)
        (i32.store16)
      )
      \`
    `
    const target = `
      const text = "AGFzbQEAAAABBgFgAn9/AAISAQNlbnYGbWVtb3J5AgMBgIACAwIBAAcLAQd3cml0ZTE2AAAKCwEJACAAIAE7AQAL";
    `
    check(source, target, {
      input
    })
  })
})