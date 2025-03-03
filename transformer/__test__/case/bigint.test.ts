import * as fs from 'fs'
import * as path from 'path'
import { check, distPath } from '../transformer'

describe('bigint', () => {

  let input: string
  let output: string

  beforeAll(() => {
    input = path.join(distPath, './bigint_input.ts')
    output = path.join(distPath, './bigint_output.ts')
  })

  afterAll(() => {
    fs.unlinkSync(input)
    fs.unlinkSync(output)
  })

  test('bigint literal enable', () => {
    const source = `
      let b = 0n
    `
    const target = `
      let b = 0n
    `
    check(source, target, {
      input,
      defined: {
        BIGINT_LITERAL: true
      }
    })
  })

  test('bigint literal disable', () => {
    const source = `
      let b = 1000n
    `
    const target = `
      let b = BigInt(1000)
    `
    check(source, target, {
      input,
      defined: {
        BIGINT_LITERAL: false
      }
    })
  }),

  test('bigint literal disable, expression', () => {
    const source = `
      let b = 1000n * 123n * 345n
    `
    const target = `
      let b = BigInt(42435000)
    `
    check(source, target, {
      input,
      defined: {
        BIGINT_LITERAL: false
      }
    })
  })

  test('bigint literal disable, expression max', () => {
    const source = `
      let b = 9007199254740991n * 2n
    `
    const target = `
      let b = BigInt(9007199254740991) * BigInt(2)
    `
    check(source, target, {
      input,
      defined: {
        BIGINT_LITERAL: false
      }
    })
  })
})