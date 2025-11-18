import * as fs from 'fs'
import * as path from 'path'
import { check, distPath } from '../transformer'

describe('condition compile', () => {

  let input: string
  let output: string

  beforeAll(() => {
    input = path.join(distPath, './condition_compile_input.ts')
    output = path.join(distPath, './condition_compile_output.ts')
  })

  afterAll(() => {
    fs.unlinkSync(input)
    fs.rmSync(output, { force: true })
  })

  test('if: true', () => {
    const source = `
      if (defined(A)) {
        let a = 0
      }
      let b = 0
    `
    const target = `
      {
        let a = 0
      }
      let b = 0
    `
    check(source, target, {
      input,
      defined: {
        A: true
      }
    })
  })

  test('if: false', () => {
    const source = `
      if (defined(A)) {
        let a = 0
      }
      let b = 0
    `
    const target = `
      let b = 0
    `
    check(source, target, {
      input,
      defined: {
        A: false
      }
    })
  })

  test('if elseif else: if', () => {
    const source = `
      if (defined(A)) {
        let a = 0
      }
      else if (defined(B)) {
        let b = 0
      }
      else {
        let c = 0
      }
      let d = 0
    `
    const target = `
      {
        let a = 0
      }
      let d = 0
    `
    check(source, target, {
      input,
      defined: {
        A: true,
        B: false
      }
    })
  })

  test('if elseif else: elseif', () => {
    const source = `
      if (defined(A)) {
        let a = 0
      }
      else if (defined(B)) {
        let b = 0
      }
      else {
        let c = 0
      }
      let d = 0
    `
    const target = `
      {
        let b = 0
      }
      let d = 0
    `
    check(source, target, {
      input,
      defined: {
        A: false,
        B: true
      }
    })
  })

  test('if elseif else: else', () => {
    const source = `
      if (defined(A)) {
        let a = 0
      }
      else if (defined(B)) {
        let b = 0
      }
      else {
        let c = 0
      }
      let d = 0
    `
    const target = `
      {
        let c = 0
      }
      let d = 0
    `
    check(source, target, {
      input,
      defined: {
        A: false,
        B: false
      }
    })
  })

  test('if: defined() && defined()', () => {
    const source = `
      if (defined(A) && defined(B)) {
        let a = 0
      }
      let b = 0
    `
    const target = `
      {
        let a = 0
      }
      let b = 0
    `
    check(source, target, {
      input,
      defined: {
        A: true,
        B: true
      }
    })
  })

  test('if: defined() && true', () => {
    const source = `
      if (defined(A) && true) {
        let a = 0
      }
      let b = 0
    `
    const target = `
      {
        let a = 0
      }
      let b = 0
    `
    check(source, target, {
      input,
      defined: {
        A: true
      }
    })
  })

  test('if: defined() && 1', () => {
    const source = `
      if (defined(A) && 1) {
        let a = 0
      }
      let b = 0
    `
    const target = `
      if (true && 1) {
        let a = 0
      }
      let b = 0
    `
    check(source, target, {
      input,
      defined: {
        A: true
      }
    })
  })

  test('if: defined() && identifier', () => {
    const source = `
      let f = 0
      if (defined(A) && f) {
        let a = 0
      }
      let b = 0
    `
    const target = `
      let f = 0
      if (false && f) {
        let a = 0
      }
      let b = 0
    `
    check(source, target, {
      input,
      defined: {
        A: false
      }
    })
  })

  test('condition: defined() when true', () => {
    const source = `
      let f = defined(A) ? 1 : 2
    `
    const target = `
      let f = 1
    `
    check(source, target, {
      input,
      defined: {
        A: true
      }
    })
  })

  test('condition: defined() when false', () => {
    const source = `
      let f = defined(A) ? 1 : 2
    `
    const target = `
      let f = 2
    `
    check(source, target, {
      input,
      defined: {
        A: false
      }
    })
  })
})