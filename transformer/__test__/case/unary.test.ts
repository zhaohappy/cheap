import * as fs from 'fs'
import * as path from 'path'
import { check, distPath } from '../transformer'
import { ctypeEnumReadImport, ctypeEnumWriteImport, definedMetaPropertyImport, symbolImport } from './snippet'
import { CTypeEnum } from '../../../typedef'

describe('unary', () => {

  let input: string
  let output: string

  beforeAll(() => {
    input = path.join(distPath, './unary_input.ts')
    output = path.join(distPath, './unary_output.ts')
  })

  afterAll(() => {
    fs.unlinkSync(input)
    fs.unlinkSync(output)
  })

  test('pointer<uint8>++', () => {
    const source = `
      let a: pointer<uint8>
      a++
    `
    const target = `
      let a: pointer<uint8>
      a = a + 1
    `
    check(source, target, {
      input
    })
  })

  test('pointer<uint32>++', () => {
    const source = `
      let a: pointer<uint32>
      a++
    `
    const target = `
      let a: pointer<uint32>
      a = a + 4
    `
    check(source, target, {
      input
    })
  })

  test('pointer<uint8>++ wasm64', () => {
    const source = `
      let a: pointer<uint8>
      a++
    `
    const target = `
      let a: pointer<uint8>
      a = a + 1n
    `
    check(source, target, {
      input,
      defined: {
        WASM_64: true
      }
    })
  })

  test('pointer<uint32>++ wasm64', () => {
    const source = `
      let a: pointer<uint32>
      a++
    `
    const target = `
      let a: pointer<uint32>
      a = a + 4n
    `
    check(source, target, {
      input,
      defined: {
        WASM_64: true
      }
    })
  })

  test('pointer<struct>.uint64++', () => {
    const source = `
      @struct
      class Test {
        a: uint64
      }
      let a: pointer<Test>
      a.a++
    `
    const target = `
      ${symbolImport}
      ${definedMetaPropertyImport}
      ${ctypeEnumReadImport}
      ${ctypeEnumWriteImport}
      class Test {
        a: uint64;
      }
      (function (prototype) {
        var map = new Map();
        map.set("a", { 0: ${CTypeEnum.uint64}, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0 });
        definedMetaProperty(prototype, symbolStruct, true);
        definedMetaProperty(prototype, symbolStructMaxBaseTypeByteLength, 8);
        definedMetaProperty(prototype, symbolStructLength, 8);
        definedMetaProperty(prototype, symbolStructKeysMeta, map);
      })(Test.prototype);
      let a: pointer<Test>;
      CTypeEnumWrite[${CTypeEnum.uint64}](a, CTypeEnumRead[${CTypeEnum.uint64}](a) + 1n);
    `
    check(source, target, {
      input,
      defined: {
        BIGINT_LITERAL: true
      }
    })
  })

  test('++pointer<uint8>', () => {
    const source = `
      let a: pointer<uint8>
      ++a
    `
    const target = `
      let a: pointer<uint8>
      a = a + 1
    `
    check(source, target, {
      input
    })
  })

  test('pointer<uint8>--', () => {
    const source = `
      let a: pointer<uint8>
      a--
    `
    const target = `
      let a: pointer<uint8>
      a = a - 1
    `
    check(source, target, {
      input
    })
  })

  test('--pointer<uint8>', () => {
    const source = `
      let a: pointer<uint8>
      --a
    `
    const target = `
      let a: pointer<uint8>
      a = a - 1
    `
    check(source, target, {
      input
    })
  })

  test('if (a--)', () => {
    const source = `
      let a: pointer<uint8>
      if (a--) {

      }
    `
    const target = `
      let a: pointer<uint8>
      if (a = a - 1, a + 1) {
        
      }
    `
    check(source, target, {
      input
    })
  })

  test('if (a++)', () => {
    const source = `
      let a: pointer<uint8>
      if (a++) {

      }
    `
    const target = `
      let a: pointer<uint8>
      if (a = a + 1, a - 1) {
        
      }
    `
    check(source, target, {
      input
    })
  })

  test('if (--a)', () => {
    const source = `
      let a: pointer<uint8>
      if (--a) {

      }
    `
    const target = `
      let a: pointer<uint8>
      if (a = a - 1, a) {
        
      }
    `
    check(source, target, {
      input
    })
  })

  test('if (++a)', () => {
    const source = `
      let a: pointer<uint8>
      if (++a) {

      }
    `
    const target = `
      let a: pointer<uint8>
      if (a = a + 1, a) {
        
      }
    `
    check(source, target, {
      input
    })
  })

  test('while (++a)', () => {
    const source = `
      let a: pointer<uint8>
      while (++a) {

      }
    `
    const target = `
      let a: pointer<uint8>
      while (a = a + 1, a) {
        
      }
    `
    check(source, target, {
      input
    })
  })

  test('pointer<struct>++', () => {
    const source = `
      @struct
      class Test {
        a: pointer<void>
        b: size
      }
      let a: pointer<Test>
      a++
    `
    const target = `
      ${symbolImport}
      ${definedMetaPropertyImport}
      class Test {
        a: pointer<void>;
        b: size;
      }
      (function (prototype) {
        var map = new Map();
        map.set("a", { 0: ${CTypeEnum.void}, 1: 1, 2: 1, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0 });
        map.set("b", { 0: ${CTypeEnum.size}, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 4, 8: 0 });
        definedMetaProperty(prototype, symbolStruct, true);
        definedMetaProperty(prototype, symbolStructMaxBaseTypeByteLength, 4);
        definedMetaProperty(prototype, symbolStructLength, 8);
        definedMetaProperty(prototype, symbolStructKeysMeta, map);
      })(Test.prototype);
      let a: pointer<Test>;
      a = a + 8;
    `
    check(source, target, {
      input
    })
  })

  test('pointer<struct>++ wasm64', () => {
    const source = `
      @struct
      class Test {
        a: pointer<void>
        b: size
      }
      let a: pointer<Test>
      a++
    `
    const target = `
      ${symbolImport}
      ${definedMetaPropertyImport}
      class Test {
        a: pointer<void>;
        b: size;
      }
      (function (prototype) {
        var map = new Map();
        map.set("a", { 0: ${CTypeEnum.void}, 1: 1, 2: 1, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0 });
        map.set("b", { 0: ${CTypeEnum.size}, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 8, 8: 0 });
        definedMetaProperty(prototype, symbolStruct, true);
        definedMetaProperty(prototype, symbolStructMaxBaseTypeByteLength, 8);
        definedMetaProperty(prototype, symbolStructLength, 16);
        definedMetaProperty(prototype, symbolStructKeysMeta, map);
      })(Test.prototype);
      let a: pointer<Test>;
      a = a + 16n;
    `
    check(source, target, {
      input,
      defined: {
        WASM_64: true
      }
    })
  })
})