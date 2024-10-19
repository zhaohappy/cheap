import * as fs from 'fs'
import * as path from 'path'
import { check, distPath } from '../transformer'
import { CTypeEnum } from '../../../typedef'

describe('args', () => {

  let input: string
  let output: string

  beforeAll(() => {
    input = path.join(distPath, './args_input.ts')
    output = path.join(distPath, './args_output.ts')
  })

  afterAll(() => {
    fs.unlinkSync(input)
    fs.unlinkSync(output)
  })

  test('args T', () => {
    const source = `
      type AtomicType2Shift<T> =
        T extends atomic_char
        ? 0
        : T extends atomic_int16
        ? 1
        : T extends atomic_int32
        ? 2
        : T extends atomic_int8
        ? 0
        : T extends atomic_uint8
        ? 0
        : T extends atomic_uint16
        ? 1
        : T extends atomic_uint32
        ? 2
        : never
      function add<T extends atomictype, args = [
        T,
        AtomicType2Shift<T>
      ]>(address: pointer<T>, value: AtomicType2Type<T>): AtomicType2Type<T> {
        return 0 as AtomicType2Type<T>
      }
      let a: pointer<atomic_uint16>
      add(a, 1)
    `
    const target = `
      type AtomicType2Shift<T> =
        T extends atomic_char
        ? 0
        : T extends atomic_int16
        ? 1
        : T extends atomic_int32
        ? 2
        : T extends atomic_int8
        ? 0
        : T extends atomic_uint8
        ? 0
        : T extends atomic_uint16
        ? 1
        : T extends atomic_uint32
        ? 2
        : never
      function add<T extends atomictype, args = [
        T,
        AtomicType2Shift<T>
      ]>(address: pointer<T>, value: AtomicType2Type<T>): AtomicType2Type<T> {
        return 0 as AtomicType2Type<T>
      }
      let a: pointer<atomic_uint16>
      add(a, 1, ${CTypeEnum.atomic_uint16}, 1)
    `
    check(source, target, {
      input
    })
  })

  test('args defined', () => {
    const source = `
      function info<args = ['__FILE__', defined<'__LINE__'>, 'defined(__LINE__)5']>(msg: string): void {
        
      }
      info('123')
    `
    const target = `
      function info<args = ['__FILE__', defined<'__LINE__'>, 'defined(__LINE__)5']>(msg: string): void {
          
      }
      info('123', '__FILE__', 5, '55')
    `
    check(source, target, {
      input
    })
  })

  test('args defined disable defined false', () => {
    const source = `
      function info<enableArgs=defined<'ENABLE_LOG_PATH'>, args = ['__FILE__', defined<'__LINE__'>, 'defined(__LINE__)5']>(msg: string): void {
        
      }
      info('123')
    `
    const target = `
      function info<enableArgs=defined<'ENABLE_LOG_PATH'>, args = ['__FILE__', defined<'__LINE__'>, 'defined(__LINE__)5']>(msg: string): void {
          
      }
      info('123')
    `
    check(source, target, {
      input,
      defined: {
        ENABLE_LOG_PATH: false
      }
    })
  })

  test('args defined disable defined 0', () => {
    const source = `
      function info<enableArgs=defined<'ENABLE_LOG_PATH'>, args = ['__FILE__', defined<'__LINE__'>, 'defined(__LINE__)5']>(msg: string): void {
        
      }
      info('123')
    `
    const target = `
      function info<enableArgs=defined<'ENABLE_LOG_PATH'>, args = ['__FILE__', defined<'__LINE__'>, 'defined(__LINE__)5']>(msg: string): void {
          
      }
      info('123')
    `
    check(source, target, {
      input,
      defined: {
        ENABLE_LOG_PATH: 0
      }
    })
  })

  test('args defined disable defined \'\'', () => {
    const source = `
      function info<args = ['__FILE__', defined<'__LINE__'>, 'defined(__LINE__)5'], enableArgs=defined<'ENABLE_LOG_PATH'>>(msg: string): void {
        
      }
      info('123')
    `
    const target = `
      function info<args = ['__FILE__', defined<'__LINE__'>, 'defined(__LINE__)5'], enableArgs=defined<'ENABLE_LOG_PATH'>>(msg: string): void {
          
      }
      info('123')
    `
    check(source, target, {
      input,
      defined: {
        ENABLE_LOG_PATH: ''
      }
    })
  })

  test('args defined disable false', () => {
    const source = `
      function info<enableArgs=false, args = ['__FILE__', defined<'__LINE__'>, 'defined(__LINE__)5']>(msg: string): void {
        
      }
      info('123')
    `
    const target = `
      function info<enableArgs=false, args = ['__FILE__', defined<'__LINE__'>, 'defined(__LINE__)5']>(msg: string): void {
          
      }
      info('123')
    `
    check(source, target, {
      input
    })
  })


  test('args defined defined enable', () => {
    const source = `
      function info<enableArgs=defined<'ENABLE_LOG_PATH'>, args = ['__FILE__', defined<'__LINE__'>, 'defined(__LINE__)5']>(msg: string): void {
        
      }
      info('123')
    `
    const target = `
      function info<enableArgs=defined<'ENABLE_LOG_PATH'>, args = ['__FILE__', defined<'__LINE__'>, 'defined(__LINE__)5']>(msg: string): void {
          
      }
      info('123', '__FILE__', 5, '55')
    `
    check(source, target, {
      input,
      defined: {
        ENABLE_LOG_PATH: true
      }
    })
  })

  test('args boolean true', () => {
    const source = `
      function info<args = [true]>(msg: string): void {
        
      }
      info('123')
    `
    const target = `
      function info<args = [true]>(msg: string): void {
          
      }
      info('123', true)
    `
    check(source, target, {
      input
    })
  })

  test('args boolean false', () => {
    const source = `
      function info<args = [false]>(msg: string): void {
        
      }
      info('123')
    `
    const target = `
      function info<args = [false]>(msg: string): void {
          
      }
      info('123', false)
    `
    check(source, target, {
      input
    })
  })

  test('args number', () => {
    const source = `
      function info<args = [2]>(msg: string): void {
        
      }
      info('123')
    `
    const target = `
      function info<args = [2]>(msg: string): void {
          
      }
      info('123', 2)
    `
    check(source, target, {
      input
    })
  })

  test('args T pointer', () => {
    const source = `
      function info<T extends pointer<void> args = [T]>(msg: T): void {
        
      }
      let a: pointer<uint8>
      info(a)
    `
    const target = `
      function info<T extends pointer<void> args = [T]>(msg: T): void {
          
      }
      let a: pointer<uint8>
      info(a, 20)
    `
    check(source, target, {
      input
    })
  })

  test('args undefined', () => {
    const source = `
      function info<args = [undefined]>(): void {
        
      }
      info()
    `
    const target = `
      function info<args = [undefined]>(): void {
        
      }
      info(undefined)
    `
    check(source, target, {
      input
    })
  })
})