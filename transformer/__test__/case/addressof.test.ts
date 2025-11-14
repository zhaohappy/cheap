import * as fs from 'fs'
import * as path from 'path'
import { check, distPath } from '../transformer'
import { ctypeEnumReadImport, definedMetaPropertyImport, symbolImport, symbol2Import } from './snippet'
import { CTypeEnum } from '../../../typedef'

describe('addressof', () => {

  let input: string
  let output: string

  beforeAll(() => {
    input = path.join(distPath, './addressof_input.ts')
    output = path.join(distPath, './addressof_output.ts')
  })

  afterAll(() => {
    fs.unlinkSync(input)
    fs.unlinkSync(output)
  })

  const snippetClassTestABSource = `
    @struct
    class TestA {
      a: pointer<uint8>
      b: uint8
      c: array<uint8, 8>
    }
    @struct
    class TestB {
      a: pointer<TestA>
      b: TestA
      c: uint16
    }
  `  

  const snippetClassTestABTarget = `
    class TestA {
      a: pointer<uint8>;
      b: uint8;
      c: array<uint8, 8>;
    }
    (function (prototype) {
      var map = new Map();
      map.set("a", { 0: 2, 1: 1, 2: 1, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0 });
      map.set("b", { 0: 2, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 4, 8: 0 });
      map.set("c", { 0: 2, 1: 0, 2: 0, 3: 1, 4: 8, 5: 0, 6: 0, 7: 5, 8: 0 });
      definedMetaProperty(prototype, symbolStruct, true);
      definedMetaProperty(prototype, symbolStructMaxBaseTypeByteLength, 4);
      definedMetaProperty(prototype, symbolStructLength, 16);
      definedMetaProperty(prototype, symbolStructKeysMeta, map);
    })(TestA.prototype);
    class TestB {
      a: pointer<TestA>;
      b: TestA;
      c: uint16;
    }
    (function (prototype) {
      var map = new Map();
      map.set("a", { 0: TestA, 1: 1, 2: 1, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0 });
      map.set("b", { 0: TestA, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 4, 8: 0 });
      map.set("c", { 0: 6, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 20, 8: 0 });
      definedMetaProperty(prototype, symbolStruct, true);
      definedMetaProperty(prototype, symbolStructMaxBaseTypeByteLength, 4);
      definedMetaProperty(prototype, symbolStructLength, 24);
      definedMetaProperty(prototype, symbolStructKeysMeta, map);
    })(TestB.prototype);
  `

  test('addressof(struct)', () => {
    const source = `
      ${snippetClassTestABSource}
      let a: TestA
      let b = addressof(a)
    `
    const target = `
      ${symbol2Import}
      ${definedMetaPropertyImport}
      ${snippetClassTestABTarget}
      let a: TestA
      let b = a[symbolStructAddress];
    `
    check(source, target, {
      input
    })
  })

  test('addressof(pointer.pointer<uint8>)', () => {
    const source = `
      ${snippetClassTestABSource}
      let a: pointer<TestA>
      let b = addressof(a.a)
    `
    const target = `
      ${symbolImport}
      ${definedMetaPropertyImport}
      ${ctypeEnumReadImport}
      ${snippetClassTestABTarget}
      let a: pointer<TestA>
      let b = a;
    `
    check(source, target, {
      input
    })
  })

  test('addressof(pointer.uint8)', () => {
    const source = `
      ${snippetClassTestABSource}
      let a: pointer<TestA>
      let b = addressof(a.b)
    `
    const target = `
      ${symbolImport}
      ${definedMetaPropertyImport}
      ${ctypeEnumReadImport}
      ${snippetClassTestABTarget}
      let a: pointer<TestA>
      let b = a + 4;
    `
    check(source, target, {
      input
    })
  })

  test('addressof(pointer.pointer.uint8)', () => {
    const source = `
      ${snippetClassTestABSource}
      let a: pointer<TestB>
      let b = addressof(a.a.b)
    `
    const target = `
      ${symbolImport}
      ${definedMetaPropertyImport}
      ${ctypeEnumReadImport}
      ${snippetClassTestABTarget}
      let a: pointer<TestB>
      let b = CTypeEnumRead[${CTypeEnum.pointer}](a) + 4;
    `
    check(source, target, {
      input
    })
  })

  test('addressof(pointer.struct.uint8)', () => {
    const source = `
      ${snippetClassTestABSource}
      let a: pointer<TestB>
      let b = addressof(a.b.b)
    `
    const target = `
      ${symbolImport}
      ${definedMetaPropertyImport}
      ${ctypeEnumReadImport}
      ${snippetClassTestABTarget}
      let a: pointer<TestB>
      let b = a + ${4 + 4}
    `
    check(source, target, {
      input
    })
  })

  test('addressof(accessof(pointer))', () => {
    const source = `
      let a: pointer<uint8>
      let b = addressof(accessof(a))
    `
    const target = `
      let a: pointer<uint8>
      let b = a
    `
    check(source, target, {
      input
    })
  })

  test('addressof(accessof(pointer.pointer<uint8>))', () => {
    const source = `
      ${snippetClassTestABSource}
      let a: pointer<TestB>
      let b = addressof(accessof(a.b.a))
    `
    const target = `
      ${symbolImport}
      ${definedMetaPropertyImport}
      ${ctypeEnumReadImport}
      ${snippetClassTestABTarget}
      let a: pointer<TestB>
      let b = CTypeEnumRead[${CTypeEnum.pointer}](a + 4);
    `
    check(source, target, {
      input
    })
  })

  test('addressof(pointer.indexOf[x])', () => {
    const source = `
      ${snippetClassTestABSource}
      let a: pointer<TestA>
      let b = addressof(a.a.indexOf(4))
    `
    const target = `
      ${symbolImport}
      ${definedMetaPropertyImport}
      ${ctypeEnumReadImport}
      ${snippetClassTestABTarget}
      let a: pointer<TestA>
      let b = CTypeEnumRead[${CTypeEnum.pointer}](a) + 4
    `
    check(source, target, {
      input
    })
  })

  test('addressof(pointer.array[x])', () => {
    const source = `
      ${snippetClassTestABSource}
      let a: pointer<TestA>
      let b = addressof(a.c[7])
    `
    const target = `
      ${symbolImport}
      ${definedMetaPropertyImport}
      ${ctypeEnumReadImport}
      ${snippetClassTestABTarget}
      let a: pointer<TestA>
      let b = a + 5 + 7
    `
    check(source, target, {
      input
    })
  })

  test('addressof(pointer.pointer[x])', () => {
    const source = `
      ${snippetClassTestABSource}
      let a: pointer<TestA>
      let b = addressof(a.a[7])
    `
    const target = `
      ${symbolImport}
      ${definedMetaPropertyImport}
      ${ctypeEnumReadImport}
      ${snippetClassTestABTarget}
      let a: pointer<TestA>
      let b = CTypeEnumRead[20](a) + 7;
    `
    check(source, target, {
      input
    })
  })

  test('struct property inline union', () => {
    const source = `
      @struct
      class TestA {
        a: uint8
        b: union<{
          a: uint8
          b: uint16
        }>
      }
      let p: pointer<TestA>
      let a = addressof(p.b.a)
      let b = addressof(p.b.b)
    `
    const target = `
      ${symbolImport}
      ${definedMetaPropertyImport}
      ${ctypeEnumReadImport}
      class TestA {
        a: uint8;
        b: union<{
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
          map.set("b", { 0: 6, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0 });
          definedMetaProperty(prototype, symbolStruct, true);
          definedMetaProperty(prototype, symbolStructMaxBaseTypeByteLength, 2);
          definedMetaProperty(prototype, symbolStructLength, 2);
          definedMetaProperty(prototype, symbolStructKeysMeta, map);
          return prototype;
        })({}), 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 2, 8: 0 });
        definedMetaProperty(prototype, symbolStruct, true);
        definedMetaProperty(prototype, symbolStructMaxBaseTypeByteLength, 2);
        definedMetaProperty(prototype, symbolStructLength, 4);
        definedMetaProperty(prototype, symbolStructKeysMeta, map);
      })(TestA.prototype);
      let p: pointer<TestA>;
      let a = p + 2;
      let b = p + 2;
    `
    check(source, target, {
      input
    })
  })
})