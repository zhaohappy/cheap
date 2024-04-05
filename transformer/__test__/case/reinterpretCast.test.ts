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
})