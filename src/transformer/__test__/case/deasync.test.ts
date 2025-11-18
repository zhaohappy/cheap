import * as fs from 'fs'
import * as path from 'path'
import { check, distPath } from '../transformer'

describe('unary', () => {

  let input: string
  let output: string

  beforeAll(() => {
    input = path.join(distPath, './unary_input.ts')
    output = path.join(distPath, './unary_output.ts')
  })

  afterAll(() => {
    fs.unlinkSync(input)
    fs.rmSync(output, { force: true })
  })

  test('function', () => {
    const source = `
      // @ts-ignore
      @deasync
      async function a() {

      }

      async function b() {
        await a()
      }
    `
    const target = `
      // @ts-ignore
      function a() {
      }
      async function b() {
        a()
      }
    `
    check(source, target, {
      input,
      defined: {
        ENABLE_SYNCHRONIZE_API: true
      }
    })
  })

  test('function block', () => {
    const source = `
      // @ts-ignore
      async function a() {

      }
      @deasync
      async function b() {
        while (true) {
          await a()
          break
        }
      }
    `
    const target = `
      // @ts-ignore
      async function a() {
      }
      function b() {
        while (true) {
          a()
          break
        }
      }
    `
    check(source, target, {
      input,
      defined: {
        ENABLE_SYNCHRONIZE_API: true
      }
    })
  })

  test('class', () => {
    const source = `
      class A {
        @deasync
        async a() {

        }
      }
      async function b() {
        const a = new A()
        await a.a()
      }
    `
    const target = `
      class A {
        a() {

        }
      }
      async function b() {
        const a = new A()
        a.a()
      }
    `
    check(source, target, {
      input,
      defined: {
        ENABLE_SYNCHRONIZE_API: true
      }
    })
  })

  test('xx.class', () => {
    const source = `
      class A {
        @deasync
        async a() {

        }
      }
      const context = {
        a: new A()
      }

      async function b() {
        await context.a.a()
      }
    `
    const target = `
      class A {
        a() {

        }
      }
      const context = {
        a: new A()
      }
      async function b() {
        context.a.a()
      }
    `
    check(source, target, {
      input,
      defined: {
        ENABLE_SYNCHRONIZE_API: true
      }
    })
  })

  test('abstract class', () => {
    const source = `
      abstract class A {
        // @ts-ignore
        @deasync
        abstract a(): Promise<void>
      }
      class B extends A {
        async a() {

        }
      }
      async function b() {
        const a = new B()
        await a.a()
      }
    `
    const target = `
      abstract class A {
        abstract a(): Promise<void>
      }
      class B extends A {
        a() {

        }
      }
      async function b() {
        const a = new B()
        a.a()
      }
    `
    check(source, target, {
      input,
      defined: {
        ENABLE_SYNCHRONIZE_API: true
      }
    })
  })
})