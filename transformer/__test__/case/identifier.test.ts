import * as fs from 'fs'
import * as path from 'path'
import { check, distPath } from '../transformer'
import { CTypeEnum } from '../../../typedef'

describe('identifier', () => {

  let input: string
  let output: string

  beforeAll(() => {
    input = path.join(distPath, './identifier_input.ts')
    output = path.join(distPath, './identifier_output.ts')
  })

  afterAll(() => {
    fs.unlinkSync(input)
    fs.unlinkSync(output)
  })

  test('let a = nullptr', () => {
    const source = `
      let b = nullptr
    `
    const target = `
      let b = ${CTypeEnum.null}
    `
    check(source, target, {
      input
    })
  })

  test('switch case', () => {
    const source = `
      function a(a: any){
        switch(a) {
          case uint8:
            break
          case char:
            break
        }
      }
    `
    const target = `
      function a(a: any){
        switch(a) {
          case ${CTypeEnum.uint8}:
            break
          case ${CTypeEnum.char}:
            break
        }
      }
    `
    check(source, target, {
      input
    })
  })

  test('return case', () => {
    const source = `
      function a(a: any){
        return nullptr
      }
    `
    const target = `
      function a(a: any){
        return 0
      }
    `
    check(source, target, {
      input
    })
  })

  test('local let', () => {
    const source = `
      function a(a: any){
        let nullptr = 8
        return nullptr
      }
    `
    const target = `
      function a(a: any){
        let nullptr = 8
        return nullptr
      }
    `
    check(source, target, {
      input
    })
  })

  test('global let', () => {
    const source = `
      let nullptr = 8
      function a(a: any){
        return nullptr
      }
    `
    const target = `
      let nullptr = 8
      function a(a: any){
        return nullptr
      }
    `
    check(source, target, {
      input
    })
  })
})