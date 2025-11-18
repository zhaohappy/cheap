import * as fs from 'fs'
import * as path from 'path'
import { check, distPath } from '../transformer'
import { ctypeEnumReadImport, ctypeEnumWriteImport, definedMetaPropertyImport, symbolImport, mapStructImport, memcpyImport } from './snippet'
import { CTypeEnum } from '../../../typedef'

describe('signal arrow', () => {

  let input: string
  let output: string

  beforeAll(() => {
    input = path.join(distPath, './signal_arrow_input.ts')
    output = path.join(distPath, './signal_arrow_output.ts')
  })

  afterAll(() => {
    fs.unlinkSync(input)
    fs.rmSync(output, { force: true })
  })

  test('accessof(pointer) <- accessof(pointer)', () => {
    const source = `
      let a: pointer<uint8>
      let b: pointer<uint8>
      accessof(a) <- accessof(b)
    `
    const target = `
      ${ctypeEnumReadImport}
      ${ctypeEnumWriteImport}
      let a: pointer<uint8>
      let b: pointer<uint8>;
      CTypeEnumWrite[${CTypeEnum.uint8}](a, CTypeEnumRead[${CTypeEnum.uint8}](b));
    `
    check(source, target, {
      input
    })
  })

  test('pointer[0] = accessof(pointer)', () => {
    const source = `
      let a: pointer<uint8>
      let b: pointer<uint8>
      a[0] = accessof(b)
    `
    const target = `
      ${ctypeEnumReadImport}
      ${ctypeEnumWriteImport}
      let a: pointer<uint8>
      let b: pointer<uint8>;
      CTypeEnumWrite[${CTypeEnum.uint8}](a, CTypeEnumRead[${CTypeEnum.uint8}](b));
    `
    check(source, target, {
      input
    })
  })

  test('accessof(pointer<atomic_int64>) <- BigInt(x)', () => {
    const source = `
      let a: pointer<atomic_int64>
      accessof(a) <- static_cast<atomic_int64>(8n)
    `
    const target = `
      ${ctypeEnumWriteImport}
      let a: pointer<atomic_int64>
      CTypeEnumWrite[${CTypeEnum.atomic_int64}](a, 8n);
    `
    check(source, target, {
      input,
      defined: {
        BIGINT_LITERAL: true
      }
    })
  })

  test('accessof(pointer + i) <- xx', () => {
    const source = `
      function _environ_get(__environ: pointer<uint32>, environ_buf: pointer<uint8>) {
        let bufSize = 0
        let i = 0
        const ptr: pointer<uint8> = reinterpret_cast<pointer<uint8>>(environ_buf + bufSize)
        accessof(reinterpret_cast<pointer<uint32>>(__environ + i)) <- reinterpret_cast<uint32>(ptr)
      }
    `
    const target = `
      ${ctypeEnumWriteImport}
      function _environ_get(__environ: pointer<uint32>, environ_buf: pointer<uint8>) {
        let bufSize = 0
        let i = 0
        const ptr: pointer<uint8> = environ_buf + bufSize
        CTypeEnumWrite[${CTypeEnum.uint32}](__environ + (i * 4), ptr);
      }
    `
    check(source, target, {
      input
    })
  })

  test('p.indexOf(x) <- xx', () => {
    const source = `
      let a: pointer<pointer<uint8>>
      a.indexOf(2) <- nullptr
    `
    const target = `
      ${ctypeEnumReadImport}
      ${ctypeEnumWriteImport}
      let a: pointer<pointer<uint8>>;
      CTypeEnumWrite[${CTypeEnum.pointer}](a + 8, 0);
    `
    check(source, target, {
      input
    })
  })

  test('p[x] <- xx', () => {
    const source = `
      let a: pointer<pointer<uint8>>
      a[2] <- nullptr
    `
    const target = `
      ${ctypeEnumReadImport}
      ${ctypeEnumWriteImport}
      let a: pointer<pointer<uint8>>;
      CTypeEnumWrite[${CTypeEnum.pointer}](a + 8, 0);
    `
    check(source, target, {
      input
    })
  })

  test('accessof(x)[0] <- xx', () => {
    const source = `
      let a: pointer<pointer<uint8>>
      accessof(a)[0] = 2
    `
    const target = `
      ${ctypeEnumReadImport}
      ${ctypeEnumWriteImport}
      let a: pointer<pointer<uint8>>;
      CTypeEnumWrite[${CTypeEnum.uint8}](CTypeEnumRead[${CTypeEnum.pointer}](a), 2);
    `
    check(source, target, {
      input
    })
  })

  test('p[x][x] <- xx size wasm64', () => {
    const source = `
      let a: pointer<pointer<size>>
      a[2][5] = 8
    `
    const target = `
      ${ctypeEnumReadImport}
      ${ctypeEnumWriteImport}
      let a: pointer<pointer<size>>;
      CTypeEnumWrite[${CTypeEnum.size}](CTypeEnumRead[${CTypeEnum.pointer}](a + 16n) + 40n, 8n);
    `
    check(source, target, {
      input,
      defined: {
        WASM_64: true
      }
    })
  })

  test('p[x][x] = xx', () => {
    const source = `
      let a: pointer<pointer<uint8>>
      a[0][0] = 3
    `
    const target = `
      ${ctypeEnumReadImport}
      ${ctypeEnumWriteImport}
      let a: pointer<pointer<uint8>>;
      CTypeEnumWrite[${CTypeEnum.uint8}](CTypeEnumRead[${CTypeEnum.pointer}](a), 3);
    `
    check(source, target, {
      input
    })
  })

  test('p[x] <- xx', () => {
    const source = `
      let a: pointer<pointer<uint8>>
      a[2] = nullptr
    `
    const target = `
      ${ctypeEnumReadImport}
      ${ctypeEnumWriteImport}
      let a: pointer<pointer<uint8>>;
      CTypeEnumWrite[${CTypeEnum.pointer}](a + 8, 0);
    `
    check(source, target, {
      input
    })
  })

  test('pointer<struct>[x]', () => {
    const source = `
      @struct
      class TestA {
        a: uint8
        b: float
      }

      let a: pointer<TestA>;
      let b: pointer<TestA>;
      // @ts-ignore
      a[2] <- b[2]
    `
    const target = `
      ${memcpyImport}
      ${symbolImport}
      ${definedMetaPropertyImport}
      ${mapStructImport}
      class TestA {
        a: uint8
        b: float
      }
      (function (prototype) {
        var map = new Map();
        map.set("a", { 0: ${CTypeEnum.uint8}, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0 });
        map.set("b", { 0: ${CTypeEnum.float}, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 4, 8: 0 });
        definedMetaProperty(prototype, symbolStruct, true);
        definedMetaProperty(prototype, symbolStructMaxBaseTypeByteLength, 4);
        definedMetaProperty(prototype, symbolStructLength, 8);
        definedMetaProperty(prototype, symbolStructKeysMeta, map);
      })(TestA.prototype);
      let a: pointer<TestA>;
      let b: pointer<TestA>;
      // @ts-ignore
      memcpy(a + 16, b + 16, 8);
    `
    check(source, target, {
      input
    })
  })

  test('pointer<struct>[x]', () => {
    const source = `
      @struct
      class TestA {
        a: uint8
        b: float
      }

      let a: pointer<TestA>;
      let b: pointer<TestA>;
      a[2] = b[2]
    `
    const target = `
      ${memcpyImport}
      ${symbolImport}
      ${definedMetaPropertyImport}
      ${mapStructImport}
      class TestA {
        a: uint8
        b: float
      }
      (function (prototype) {
        var map = new Map();
        map.set("a", { 0: ${CTypeEnum.uint8}, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0 });
        map.set("b", { 0: ${CTypeEnum.float}, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 4, 8: 0 });
        definedMetaProperty(prototype, symbolStruct, true);
        definedMetaProperty(prototype, symbolStructMaxBaseTypeByteLength, 4);
        definedMetaProperty(prototype, symbolStructLength, 8);
        definedMetaProperty(prototype, symbolStructKeysMeta, map);
      })(TestA.prototype);
      let a: pointer<TestA>;
      let b: pointer<TestA>;
      // @ts-ignore
      memcpy(a + 16, b + 16, 8);
    `
    check(source, target, {
      input
    })
  })

  test('pointer<pointer<struct>>[x]', () => {
    const source = `
      @struct
      class TestA {
        a: uint8
        b: float
      }
  
      let a: pointer<pointer<TestA>>;
      let b: pointer<TestA>;
      // @ts-ignore
      a[2] <- b
    `
    const target = `
      ${symbolImport}
      ${definedMetaPropertyImport}
      ${ctypeEnumReadImport}
      ${ctypeEnumWriteImport}
      class TestA {
        a: uint8
        b: float
      }
      (function (prototype) {
        var map = new Map();
        map.set("a", { 0: ${CTypeEnum.uint8}, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0 });
        map.set("b", { 0: ${CTypeEnum.float}, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 4, 8: 0 });
        definedMetaProperty(prototype, symbolStruct, true);
        definedMetaProperty(prototype, symbolStructMaxBaseTypeByteLength, 4);
        definedMetaProperty(prototype, symbolStructLength, 8);
        definedMetaProperty(prototype, symbolStructKeysMeta, map);
      })(TestA.prototype);
      let a: pointer<pointer<TestA>>;
      let b: pointer<TestA>;
      // @ts-ignore
      CTypeEnumWrite[${CTypeEnum.pointer}](a + 8, b);
    `
    check(source, target, {
      input
    })
  })
})