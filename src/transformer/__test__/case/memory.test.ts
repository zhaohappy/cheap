import * as fs from 'fs'
import * as path from 'path'
import { check, distPath } from '../transformer'
import { allocatorImport } from './snippet'

describe('identifier', () => {

  let input: string
  let output: string

  beforeAll(() => {
    input = path.join(distPath, './identifier_input.ts')
    output = path.join(distPath, './identifier_output.ts')
  })

  afterAll(() => {
    fs.unlinkSync(input)
    fs.rmSync(output, { force: true })
  })

  test('malloc', () => {
    const source = `
      let b = malloc(4)
    `
    const target = `
      ${allocatorImport}
      let b = Allocator.malloc(4)
    `
    check(source, target, {
      input
    })
  })

  test('malloc local', () => {
    const source = `
      function malloc(a: number) {

      }
      let b = malloc(4)
    `
    const target = `
      function malloc(a: number) {

      }
      let b = malloc(4)
    `
    check(source, target, {
      input
    })
  })

  test('calloc', () => {
    const source = `
      let b = calloc(4, 4)
    `
    const target = `
      ${allocatorImport}
      let b = Allocator.calloc(4, 4)
    `
    check(source, target, {
      input
    })
  })

  test('realloc', () => {
    const source = `
      let p: pointer<void>
      let b = realloc(p, 4)
    `
    const target = `
      ${allocatorImport}
      let p: pointer<void>
      let b = Allocator.realloc(p, 4)
    `
    check(source, target, {
      input
    })
  })

  test('aligned_alloc', () => {
    const source = `
      let b = aligned_alloc(8, 4)
    `
    const target = `
      ${allocatorImport}
      let b = Allocator.alignedAlloc(8, 4)
    `
    check(source, target, {
      input
    })
  })

  test('free', () => {
    const source = `
      let p: pointer<void>
      free(p)
    `
    const target = `
      ${allocatorImport}
      let p: pointer<void>
      Allocator.free(p)
    `
    check(source, target, {
      input
    })
  })
})