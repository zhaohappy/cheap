import * as fs from 'fs'
import * as path from 'path'
import { check, distPath } from '../transformer'
import { ctypeEnumReadImport, definedMetaPropertyImport, symbolImport } from './snippet'
import { CTypeEnum } from '../../../typedef'

describe('property access', () => {

  let input: string
  let output: string

  beforeAll(() => {
    input = path.join(distPath, './property_access_input.ts')
    output = path.join(distPath, './property_access_output.ts')
  })

  afterAll(() => {
    fs.unlinkSync(input)
    fs.unlinkSync(output)
  })

  const snippetClassTestABSource = `
    @struct
    class TestA {
      a: char
      b: uint8
      c: int8
      d: atomic_char
      e: atomic_uint8
      f: atomic_int8
      g: uint16
      h: int16
      i: atomic_uint16
      j: atomic_int16
      k: uint32
      l: int32
      m: atomic_uint32
      n: atomic_int32
      o: uint64
      p: int64
      q: pointer<uint8>
      r: pointer<pointer<uint8>>
      s: array<uint8, 8>
      t: bit<uint8, 5>
    }
    @struct
    class TestB {
      a: TestA
      b: pointer<TestA>
      c: pointer<pointer<TestA>>
      d: array<TestA, 8>
      e: array<pointer<TestA>, 8>
    }
  `

  const snippetClassTestABTarget = `
    class TestA {
      a: char;
      b: uint8;
      c: int8;
      d: atomic_char;
      e: atomic_uint8;
      f: atomic_int8;
      g: uint16;
      h: int16;
      i: atomic_uint16;
      j: atomic_int16;
      k: uint32;
      l: int32;
      m: atomic_uint32;
      n: atomic_int32;
      o: uint64;
      p: int64;
      q: pointer<uint8>;
      r: pointer<pointer<uint8>>;
      s: array<uint8, 8>;
      t: bit<uint8, 5>;
    }
    (function (prototype) {
      var map = new Map();
      map.set("a", { 0: 4, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0 });
      map.set("b", { 0: 2, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 1, 8: 0 });
      map.set("c", { 0: 11, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 2, 8: 0 });
      map.set("d", { 0: 5, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 3, 8: 0 });
      map.set("e", { 0: 3, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 4, 8: 0 });
      map.set("f", { 0: 12, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 5, 8: 0 });
      map.set("g", { 0: 6, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 6, 8: 0 });
      map.set("h", { 0: 13, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 8, 8: 0 });
      map.set("i", { 0: 7, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 10, 8: 0 });
      map.set("j", { 0: 14, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 12, 8: 0 });
      map.set("k", { 0: 8, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 16, 8: 0 });
      map.set("l", { 0: 15, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 20, 8: 0 });
      map.set("m", { 0: 9, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 24, 8: 0 });
      map.set("n", { 0: 16, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 28, 8: 0 });
      map.set("o", { 0: 10, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 32, 8: 0 });
      map.set("p", { 0: 17, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 40, 8: 0 });
      map.set("q", { 0: 2, 1: 1, 2: 1, 3: 0, 4: 0, 5: 0, 6: 0, 7: 48, 8: 0 });
      map.set("r", { 0: 2, 1: 1, 2: 2, 3: 0, 4: 0, 5: 0, 6: 0, 7: 52, 8: 0 });
      map.set("s", { 0: 2, 1: 0, 2: 0, 3: 1, 4: 8, 5: 0, 6: 0, 7: 56, 8: 0 });
      map.set("t", { 0: 2, 1: 0, 2: 0, 3: 0, 4: 0, 5: 1, 6: 5, 7: 64, 8: 3 });
      definedMetaProperty(prototype, symbolStruct, true);
      definedMetaProperty(prototype, symbolStructMaxBaseTypeByteLength, 8);
      definedMetaProperty(prototype, symbolStructLength, 72);
      definedMetaProperty(prototype, symbolStructKeysMeta, map);
    })(TestA.prototype);
    class TestB {
      a: TestA;
      b: pointer<TestA>;
      c: pointer<pointer<TestA>>;
      d: array<TestA, 8>;
      e: array<pointer<TestA>, 8>;
    }
    (function (prototype) {
      var map = new Map();
      map.set("a", { 0: TestA, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0 });
      map.set("b", { 0: TestA, 1: 1, 2: 1, 3: 0, 4: 0, 5: 0, 6: 0, 7: 72, 8: 0 });
      map.set("c", { 0: TestA, 1: 1, 2: 2, 3: 0, 4: 0, 5: 0, 6: 0, 7: 76, 8: 0 });
      map.set("d", { 0: TestA, 1: 0, 2: 0, 3: 1, 4: 8, 5: 0, 6: 0, 7: 80, 8: 0 });
      map.set("e", { 0: TestA, 1: 1, 2: 1, 3: 1, 4: 8, 5: 0, 6: 0, 7: 656, 8: 0 });
      definedMetaProperty(prototype, symbolStruct, true);
      definedMetaProperty(prototype, symbolStructMaxBaseTypeByteLength, 8);
      definedMetaProperty(prototype, symbolStructLength, 688);
      definedMetaProperty(prototype, symbolStructKeysMeta, map);
    })(TestB.prototype);
  `

  test('pointer.uint8', () => {
    const source = `
      ${snippetClassTestABSource}
      let a: pointer<TestA>;
      let b = a.b
    `
    const target = `
      ${symbolImport}
      ${definedMetaPropertyImport}
      ${ctypeEnumReadImport}
      ${snippetClassTestABTarget}
      let a: pointer<TestA>;
      let b = CTypeEnumRead[${CTypeEnum.uint8}](a + 1);
    `
    check(source, target, {
      input,
    })
  })

  test('union property', () => {
    const source = `
      @union
      class TestA {
        a: uint8
        b: uint16
      }
      let p: pointer<TestA>
      let a = p.a
      let b = p.b
    `
    const target = `
      ${symbolImport}
      ${definedMetaPropertyImport}
      ${ctypeEnumReadImport}
      class TestA {
        a: uint8
        b: uint16
      }
      (function (prototype) {
        var map = new Map();
        map.set("a", { 0: 2, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0 });
        map.set("b", { 0: 6, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0 });
        definedMetaProperty(prototype, symbolStruct, true);
        definedMetaProperty(prototype, symbolStructMaxBaseTypeByteLength, 2);
        definedMetaProperty(prototype, symbolStructLength, 2);
        definedMetaProperty(prototype, symbolStructKeysMeta, map);
      })(TestA.prototype);
      let p: pointer<TestA>;
      let a = CTypeEnumRead[2](p);
      let b = CTypeEnumRead[6](p);
    `
    check(source, target, {
      input
    })
  })

  test('struct property inline struct', () => {
    const source = `
      @struct
      class TestA {
        a: uint8
        b: struct<{
          a: uint8
          b: uint16
        }>
      }
      let p: pointer<TestA>;
      let a = p.b.a
      let b = p.b.b
    `
    const target = `
      ${symbolImport}
      ${definedMetaPropertyImport}
      ${ctypeEnumReadImport}
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
      let p: pointer<TestA>;
      let a = CTypeEnumRead[2](p + 2);
      let b = CTypeEnumRead[6](p + ${2 + 2});
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
      let p: pointer<TestA>;
      let a = p.b.a
      let b = p.b.b
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
      let a = CTypeEnumRead[2](p + 2);
      let b = CTypeEnumRead[6](p + 2);
    `
    check(source, target, {
      input
    })
  })

  test('pointer.struct', () => {
    const source = `
      ${snippetClassTestABSource}
      let a: pointer<TestB>;
      let b = a.a
    `
    const target = `
      ${symbolImport}
      ${definedMetaPropertyImport}
      import structAccess from "cheap/std/structAccess";
      ${snippetClassTestABTarget}
      let a: pointer<TestB>;
      let b = structAccess(a, TestA)
    `
    check(source, target, {
      input
    })
  })

  test('pointer.bit', () => {
    const source = `
      ${snippetClassTestABSource}
      let a: pointer<TestA>;
      let b = a.t
    `
    const target = `
      ${symbolImport}
      ${definedMetaPropertyImport}
      ${ctypeEnumReadImport}
      ${snippetClassTestABTarget}
      let a: pointer<TestA>;
      let b = (CTypeEnumRead[${CTypeEnum.uint8}](a + 64) >>> 0) & 31
    `
    check(source, target, {
      input
    })
  })

  test('pointer.array[x]', () => {
    const source = `
      ${snippetClassTestABSource}
      let a: pointer<TestB>;
      let b = a.e[4]
    `
    const target = `
      ${symbolImport}
      ${definedMetaPropertyImport}
      ${ctypeEnumReadImport}
      ${snippetClassTestABTarget}
      let a: pointer<TestB>;
      let b = CTypeEnumRead[20](a + 656 + 16);
    `
    check(source, target, {
      input
    })
  })

  test('pointer.pointer.indexOf(i).xx', () => {
    const source = `
      ${snippetClassTestABSource}
      let a: pointer<TestB>;
      let b = a.b.indexOf(3).a
    `
    const target = `
      ${symbolImport}
      ${definedMetaPropertyImport}
      ${ctypeEnumReadImport}
      ${snippetClassTestABTarget}
      let a: pointer<TestB>;
      let b = CTypeEnumRead[4](CTypeEnumRead[20](a + 72) + 216);
    `
    check(source, target, {
      input
    })
  })

  test('pointer.pointer[i].xx', () => {
    const source = `
      ${snippetClassTestABSource}
      let a: pointer<TestB>;
      let b = a.b[3].a
    `
    const target = `
      ${symbolImport}
      ${definedMetaPropertyImport}
      ${ctypeEnumReadImport}
      ${snippetClassTestABTarget}
      let a: pointer<TestB>;
      let b = CTypeEnumRead[4](CTypeEnumRead[20](a + 72) + 216);
    `
    check(source, target, {
      input
    })
  })

  test('pointer.pointer<pointer>.indexOf(i).xx', () => {
    const source = `
      ${snippetClassTestABSource}
      let a: pointer<TestB>;
      let b = a.c.indexOf(3).b
    `
    const target = `
      ${symbolImport}
      ${definedMetaPropertyImport}
      ${ctypeEnumReadImport}
      ${snippetClassTestABTarget}
      let a: pointer<TestB>;
      let b = CTypeEnumRead[2](CTypeEnumRead[20](CTypeEnumRead[20](a + 76) + 12) + 1);
    `
    check(source, target, {
      input
    })
  })

  test('pointer.pointer<pointer>[i].xx', () => {
    const source = `
      ${snippetClassTestABSource}
      let a: pointer<TestB>;
      let b = a.c[3].b
    `
    const target = `
      ${symbolImport}
      ${definedMetaPropertyImport}
      ${ctypeEnumReadImport}
      ${snippetClassTestABTarget}
      let a: pointer<TestB>;
      let b = CTypeEnumRead[2](CTypeEnumRead[20](CTypeEnumRead[20](a + 76) + 12) + 1);
    `
    check(source, target, {
      input
    })
  })

  test('pointer.pointer<pointer>.indexOf(i).indexOf(j).x', () => {
    const source = `
      ${snippetClassTestABSource}
      let a: pointer<TestB>;
      let b = a.c.indexOf(3).indexOf(2).c
    `
    const target = `
      ${symbolImport}
      ${definedMetaPropertyImport}
      ${ctypeEnumReadImport}
      ${snippetClassTestABTarget}
      let a: pointer<TestB>;
      let b = CTypeEnumRead[11](CTypeEnumRead[20](CTypeEnumRead[20](a + 76) + 12) + ${144 + 2});
    `
    check(source, target, {
      input
    })
  })

  test('pointer.pointer<pointer>[i][j].x', () => {
    const source = `
      ${snippetClassTestABSource}
      let a: pointer<TestB>;
      let b = a.c[3][2].c
    `
    const target = `
      ${symbolImport}
      ${definedMetaPropertyImport}
      ${ctypeEnumReadImport}
      ${snippetClassTestABTarget}
      let a: pointer<TestB>;
      let b = CTypeEnumRead[11](CTypeEnumRead[20](CTypeEnumRead[20](a + 76) + 12) + ${144 + 2});
    `
    check(source, target, {
      input
    })
  })

  test('struct property inline struct', () => {
    const source = `
      @struct
      class TestA {
        a: uint8
        b: struct<{
          a: uint8
          b: uint16
        }>
      }
      let p: pointer<TestA>;
      let a = p.b
    `
    const target = `
      ${symbolImport}
      ${definedMetaPropertyImport}
      import structAccess from "cheap/std/structAccess";
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
      let p: pointer<TestA>;
      let a = structAccess(p + 2, TestA, "b");
    `
    check(source, target, {
      input
    })
  })

  test('struct property inline struct -> inline struct', () => {
    const source = `
      @struct
      class TestA {
        a: uint8
        b: struct<{
          a: uint8
          b: struct<{
            a: uint8
            b: uint16
          }>
        }>
      }
      let p: pointer<TestA>;
      let a = p.b.b
    `
    const target = `
      ${symbolImport}
      ${definedMetaPropertyImport}
      import structAccess from "cheap/std/structAccess";
      class TestA {
        a: uint8;
        b: struct<{
          a: uint8;
          b: struct<{
            a: uint8
            b: uint16
          }>
        }>;
      }
      (function (prototype) {
        var map = new Map();
        map.set("a", { 0: 2, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0 });
        map.set("b", { 0: (function (prototype) {
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
          return prototype;
        })({}), 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 2, 8: 0 });
        definedMetaProperty(prototype, symbolStruct, true);
        definedMetaProperty(prototype, symbolStructMaxBaseTypeByteLength, 2);
        definedMetaProperty(prototype, symbolStructLength, 8);
        definedMetaProperty(prototype, symbolStructKeysMeta, map);
      })(TestA.prototype);
      let p: pointer<TestA>;
      let a = structAccess(p + 4, TestA, "b.b");
    `
    check(source, target, {
      input
    })
  })

  test('struct property [inline struct]', () => {
    const source = `
      @struct
      class TestA {
        a: uint8
        b: array<struct<{
          a: uint8
          b: uint16
        }>, 6>
      }
      let p: pointer<TestA>;
      let a = p.b[4];
    `
    const target = `
      ${symbolImport}
      ${definedMetaPropertyImport}
      import structAccess from "cheap/std/structAccess";
      class TestA {
        a: uint8;
        b: array<struct<{
          a: uint8;
          b: uint16;
        }>, 6>;
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
        })({}), 1: 0, 2: 0, 3: 1, 4: 6, 5: 0, 6: 0, 7: 2, 8: 0 });
        definedMetaProperty(prototype, symbolStruct, true);
        definedMetaProperty(prototype, symbolStructMaxBaseTypeByteLength, 2);
        definedMetaProperty(prototype, symbolStructLength, 26);
        definedMetaProperty(prototype, symbolStructKeysMeta, map);
      })(TestA.prototype);
      let p: pointer<TestA>;
      let a = structAccess(p + 2 + 16, TestA, "b");
    `
    check(source, target, {
      input
    })
  })
})