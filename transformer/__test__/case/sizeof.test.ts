import * as fs from 'fs'
import * as path from 'path'
import { check, distPath } from '../transformer'
import { definedMetaPropertyImport, symbolImport } from './snippet'

describe('sizeof', () => {

  let input: string
  let output: string

  beforeAll(() => {
    input = path.join(distPath, './sizeof_input.ts')
    output = path.join(distPath, './sizeof_output.ts')
  })

  afterAll(() => {
    fs.unlinkSync(input)
    fs.unlinkSync(output)
  })

  test('sizeof(char)', () => {
    const source = `
      let a = sizeof(char)
    `
    const target = `
      let a = 1
    `
    check(source, target, {
      input
    })
  })

  test('sizeof(atomic_char)', () => {
    const source = `
      let a = sizeof(atomic_char)
    `
    const target = `
      let a = 1
    `
    check(source, target, {
      input
    })
  })

  test('sizeof(uint8)', () => {
    const source = `
      let a = sizeof(uint8)
    `
    const target = `
      let a = 1
    `
    check(source, target, {
      input
    })
  })

  test('sizeof(atomic_uint8)', () => {
    const source = `
      let a = sizeof(atomic_uint8)
    `
    const target = `
      let a = 1
    `
    check(source, target, {
      input
    })
  })

  test('sizeof(int8)', () => {
    const source = `
      let a = sizeof(int8)
    `
    const target = `
      let a = 1
    `
    check(source, target, {
      input
    })
  })

  test('sizeof(atomic_int8)', () => {
    const source = `
      let a = sizeof(atomic_int8)
    `
    const target = `
      let a = 1
    `
    check(source, target, {
      input
    })
  })

  test('sizeof(uint16)', () => {
    const source = `
      let a = sizeof(uint16)
    `
    const target = `
      let a = 2
    `
    check(source, target, {
      input
    })
  })

  test('sizeof(atomic_uint16)', () => {
    const source = `
      let a = sizeof(atomic_uint16)
    `
    const target = `
      let a = 2
    `
    check(source, target, {
      input
    })
  })

  test('sizeof(int16)', () => {
    const source = `
      let a = sizeof(int16)
    `
    const target = `
      let a = 2
    `
    check(source, target, {
      input
    })
  })

  test('sizeof(atomic_int16)', () => {
    const source = `
      let a = sizeof(atomic_int16)
    `
    const target = `
      let a = 2
    `
    check(source, target, {
      input
    })
  })

  test('sizeof(uint32)', () => {
    const source = `
      let a = sizeof(uint32)
    `
    const target = `
      let a = 4
    `
    check(source, target, {
      input
    })
  })

  test('sizeof(atomic_uint32)', () => {
    const source = `
      let a = sizeof(atomic_uint32)
    `
    const target = `
      let a = 4
    `
    check(source, target, {
      input
    })
  })

  test('sizeof(int32)', () => {
    const source = `
      let a = sizeof(int32)
    `
    const target = `
      let a = 4
    `
    check(source, target, {
      input
    })
  })

  test('sizeof(atomic_int32)', () => {
    const source = `
      let a = sizeof(atomic_int32)
    `
    const target = `
      let a = 4
    `
    check(source, target, {
      input
    })
  })

  test('sizeof(uint64)', () => {
    const source = `
      let a = sizeof(uint64)
    `
    const target = `
      let a = 8
    `
    check(source, target, {
      input
    })
  })

  test('sizeof(int64)', () => {
    const source = `
      let a = sizeof(int64)
    `
    const target = `
      let a = 8
    `
    check(source, target, {
      input
    })
  })

  test('sizeof(float)', () => {
    const source = `
      let a = sizeof(float)
    `
    const target = `
      let a = 4
    `
    check(source, target, {
      input
    })
  })

  test('sizeof(double)', () => {
    const source = `
      let a = sizeof(double)
    `
    const target = `
      let a = 8
    `
    check(source, target, {
      input
    })
  })

  test('sizeof(pointer<void>)', () => {
    const source = `
      let a = sizeof(typeptr)
    `
    const target = `
      let a = 4
    `
    check(source, target, {
      input
    })
  })

  test('sizeof(pointer<double>)', () => {
    const source = `
      let a: pointer<double>
      let size = sizeof(a)
    `
    const target = `
      let a: pointer<double>
      let size = 4
    `
    check(source, target, {
      input
    })
  })

  test('sizeof(pointer<pointer<uint32>>)', () => {
    const source = `
      let a: pointer<pointer<uint32>>
      let size = sizeof(a)
    `
    const target = `
      let a: pointer<pointer<uint32>>
      let size = 4
    `
    check(source, target, {
      input
    })
  })

  test('sizeof(array<uint16, 8>)', () => {
    const source = `
      let a: array<uint16, 8>
      let size = sizeof(a)
    `
    const target = `
      let a: array<uint16, 8>
      let size = 16
    `
    check(source, target, {
      input
    })
  })
  test('sizeof(array<pointer<uint8>, 8>)', () => {
    const source = `
      let a: array<pointer<uint8>, 8>
      let size = sizeof(a)
    `
    const target = `
      let a: array<pointer<uint8>, 8>
      let size = 32
    `
    check(source, target, {
      input
    })
  })

  test('sizeof(array<array<uint8, 8>, 8>)', () => {
    const source = `
      let a: array<array<uint8, 8>, 8>
      let size = sizeof(a)
    `
    const target = `
      let a: array<array<uint8, 8>, 8>
      let size = 64
    `
    check(source, target, {
      input
    })
  })

  test('runtime type sizeof: sizeof(type)', () => {
    const source = `
      function test<T>(a: T) {
        let size = sizeof(a)
      }
    `
    const target = `
      import sizeof from 'cheap/std/sizeof'
      function test<T>(a: T) {
        let size = sizeof(a)
      }
    `
    check(source, target, {
      input
    })
  })

  const classTestSource = `
    @struct
    class Test {
      a: uint8
      b: float
    }
  `

  const classTestTarget = `
    import { symbolStruct as symbolStruct, symbolStructMaxBaseTypeByteLength as symbolStructMaxBaseTypeByteLength, symbolStructLength as symbolStructLength, symbolStructKeysMeta as symbolStructKeysMeta } from "cheap/symbol";
    import definedMetaProperty from "cheap/function/definedMetaProperty";
    class Test {
      a: uint8;
      b: float;
    }
    (function (prototype) {
      let map = new Map();
      map.set("a", { 0: 2, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0 });
      map.set("b", { 0: 18, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 4, 8: 0 });
      definedMetaProperty(prototype, symbolStruct, true);
      definedMetaProperty(prototype, symbolStructMaxBaseTypeByteLength, 4);
      definedMetaProperty(prototype, symbolStructLength, 8);
      definedMetaProperty(prototype, symbolStructKeysMeta, map);
    })(Test.prototype);
  `

  test('struct sizeof: sizeof(struct)', () => {
    const source = `
      ${classTestSource}
      let a = sizeof(Test)
    `
    const target = `
      ${classTestTarget}
      let a = 8;
    `
    check(source, target, {
      input
    })
  })

  test('struct property sizeof: sizeof(struct.a)', () => {
    const source = `
      ${classTestSource}
      let a: Test
      let size = sizeof(a.b)
    `
    const target = `
      ${classTestTarget}
      let a: Test
      let size = 4
    `
    check(source, target, {
      input
    })
  })

  test('pointer property sizeof: sizeof(pointer.a)', () => {
    const source = `
      ${classTestSource}
      let a: pointer<Test>
      let size = sizeof(a.a)
    `
    const target = `
      ${classTestTarget}
      let a: pointer<Test>
      let size = 1
    `
    check(source, target, {
      input
    })
  })

  test('struct property sizeof: sizeof(struct.[inline struct])', () => {
    const source = `
      @struct
      class TestA {
        a: uint8
        b: struct<{
          a: uint8
          b: uint16
        }>
      }
      let p: pointer<TestA>
      let size = sizeof(p.b)
    `
    const target = `
      ${symbolImport}
      ${definedMetaPropertyImport}
      class TestA {
        a: uint8;
        b: struct<{
          a: uint8;
          b: uint16;
        }>;
      }
      (function (prototype) {
        var map = new Map();
        map.set("a", { 0: 2, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0 });
        map.set("b", { 0: (function (prototype) {
          var map = new Map();
          map.set("a", { 0: 2, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0 });
          map.set("b", { 0: 6, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 2, 8: 0 });
          definedMetaProperty(prototype, symbolStruct, true);
          definedMetaProperty(prototype, symbolStructMaxBaseTypeByteLength, 2);
          definedMetaProperty(prototype, symbolStructLength, 4);
          definedMetaProperty(prototype, symbolStructKeysMeta, map);
          return prototype;
        })({}), 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 2, 8: 0 });
        definedMetaProperty(prototype, symbolStruct, true);
        definedMetaProperty(prototype, symbolStructMaxBaseTypeByteLength, 2);
        definedMetaProperty(prototype, symbolStructLength, 6);
        definedMetaProperty(prototype, symbolStructKeysMeta, map);
      })(TestA.prototype);
      let p: pointer<TestA>
      let size = 4
    `
    check(source, target, {
      input
    })
  })
})