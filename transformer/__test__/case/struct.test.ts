import * as fs from 'fs'
import * as path from 'path'
import { check, distPath } from '../transformer'
import { definedMetaPropertyImport, symbolImport } from './snippet'
import { CTypeEnum } from '../../../typedef'

describe('struct', () => {

  let input: string
  let output: string

  beforeAll(() => {
    input = path.join(distPath, './struct_input.ts')
    output = path.join(distPath, './struct_output.ts')
  })

  afterAll(() => {
    fs.unlinkSync(input)
    fs.unlinkSync(output)
  })

  test('struct', () => {
    const source = `
      @struct
      class TestA {
        a: pointer<char>
        b: pointer<uint8>
        c: pointer<int8>
        d: pointer<atomic_char>
        e: pointer<atomic_uint8>
        f: pointer<atomic_int8>
        g: pointer<uint16>
        h: pointer<int16>
        i: pointer<atomic_uint16>
        j: pointer<atomic_int16>
        k: pointer<uint32>
        l: pointer<int32>
        m: pointer<atomic_uint32>
        n: pointer<atomic_int32>
        o: pointer<uint64>
        p: pointer<int64>
        q: pointer<pointer<uint8>>
      }
    `
    const target = `
      ${symbolImport}
      ${definedMetaPropertyImport}
      class TestA {
        a: pointer<char>;
        b: pointer<uint8>;
        c: pointer<int8>;
        d: pointer<atomic_char>;
        e: pointer<atomic_uint8>;
        f: pointer<atomic_int8>;
        g: pointer<uint16>;
        h: pointer<int16>;
        i: pointer<atomic_uint16>;
        j: pointer<atomic_int16>;
        k: pointer<uint32>;
        l: pointer<int32>;
        m: pointer<atomic_uint32>;
        n: pointer<atomic_int32>;
        o: pointer<uint64>;
        p: pointer<int64>;
        q: pointer<pointer<uint8>>;
      }
      (function (prototype) {
        var map = new Map();
        map.set("a", { 0: 4, 1: 1, 2: 1, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0 });
        map.set("b", { 0: 2, 1: 1, 2: 1, 3: 0, 4: 0, 5: 0, 6: 0, 7: 4, 8: 0 });
        map.set("c", { 0: 11, 1: 1, 2: 1, 3: 0, 4: 0, 5: 0, 6: 0, 7: 8, 8: 0 });
        map.set("d", { 0: 5, 1: 1, 2: 1, 3: 0, 4: 0, 5: 0, 6: 0, 7: 12, 8: 0 });
        map.set("e", { 0: 3, 1: 1, 2: 1, 3: 0, 4: 0, 5: 0, 6: 0, 7: 16, 8: 0 });
        map.set("f", { 0: 12, 1: 1, 2: 1, 3: 0, 4: 0, 5: 0, 6: 0, 7: 20, 8: 0 });
        map.set("g", { 0: 6, 1: 1, 2: 1, 3: 0, 4: 0, 5: 0, 6: 0, 7: 24, 8: 0 });
        map.set("h", { 0: 13, 1: 1, 2: 1, 3: 0, 4: 0, 5: 0, 6: 0, 7: 28, 8: 0 });
        map.set("i", { 0: 7, 1: 1, 2: 1, 3: 0, 4: 0, 5: 0, 6: 0, 7: 32, 8: 0 });
        map.set("j", { 0: 14, 1: 1, 2: 1, 3: 0, 4: 0, 5: 0, 6: 0, 7: 36, 8: 0 });
        map.set("k", { 0: 8, 1: 1, 2: 1, 3: 0, 4: 0, 5: 0, 6: 0, 7: 40, 8: 0 });
        map.set("l", { 0: 15, 1: 1, 2: 1, 3: 0, 4: 0, 5: 0, 6: 0, 7: 44, 8: 0 });
        map.set("m", { 0: 9, 1: 1, 2: 1, 3: 0, 4: 0, 5: 0, 6: 0, 7: 48, 8: 0 });
        map.set("n", { 0: 16, 1: 1, 2: 1, 3: 0, 4: 0, 5: 0, 6: 0, 7: 52, 8: 0 });
        map.set("o", { 0: 10, 1: 1, 2: 1, 3: 0, 4: 0, 5: 0, 6: 0, 7: 56, 8: 0 });
        map.set("p", { 0: 17, 1: 1, 2: 1, 3: 0, 4: 0, 5: 0, 6: 0, 7: 60, 8: 0 });
        map.set("q", { 0: 2, 1: 1, 2: 2, 3: 0, 4: 0, 5: 0, 6: 0, 7: 64, 8: 0 });
        definedMetaProperty(prototype, symbolStruct, true);
        definedMetaProperty(prototype, symbolStructMaxBaseTypeByteLength, 4);
        definedMetaProperty(prototype, symbolStructLength, 68);
        definedMetaProperty(prototype, symbolStructKeysMeta, map);
      })(TestA.prototype);
    `
    check(source, target, {
      input
    })
  })

  test('struct property enum', () => {
    const source = `
      enum A {
        a,
        b
      }
      @struct
      class TestA {
        a: A
      }
    `
    const target = `
      ${symbolImport}
      ${definedMetaPropertyImport}
      enum A {
        a,
        b
      }
      class TestA {
        a: A
      }
      (function (prototype) {
        var map = new Map();
        map.set("a", { 0: ${CTypeEnum.int32}, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0 });
        definedMetaProperty(prototype, symbolStruct, true);
        definedMetaProperty(prototype, symbolStructMaxBaseTypeByteLength, 4);
        definedMetaProperty(prototype, symbolStructLength, 4);
        definedMetaProperty(prototype, symbolStructKeysMeta, map);
      })(TestA.prototype);
    `
    check(source, target, {
      input
    })
  })

  test('struct property not builtin type', () => {
    const source = `
      @struct
      class TestA {
        a: uint8
        b: number
      }
    `
    const target = `
      ${symbolImport}
      ${definedMetaPropertyImport}
      class TestA {
        a: uint8
        b: number
      }
      (function (prototype) {
        var map = new Map();
        map.set("a", { 0: 2, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0 });
        definedMetaProperty(prototype, symbolStruct, true);
        definedMetaProperty(prototype, symbolStructMaxBaseTypeByteLength, 1);
        definedMetaProperty(prototype, symbolStructLength, 1);
        definedMetaProperty(prototype, symbolStructKeysMeta, map);
      })(TestA.prototype);
    `
    check(source, target, {
      input
    })
  })

  test('struct property array', () => {
    const source = `
      @struct
      class TestA {
        a: array<pointer<uint8>, 8>
        b: uint8
      }

      let p: pointer<TestA>
      p.a[3] = 0
    `
    const target = `
      ${symbolImport}
      ${definedMetaPropertyImport}
      import { CTypeEnumRead as CTypeEnumRead } from "cheap/ctypeEnumRead";
      import { CTypeEnumWrite as CTypeEnumWrite } from "cheap/ctypeEnumWrite";
      class TestA {
        a: array<pointer<uint8>, 8>;
        b: uint8;
      }
      (function (prototype) {
        var map = new Map();
        map.set("a", { 0: 2, 1: 1, 2: 1, 3: 1, 4: 8, 5: 0, 6: 0, 7: 0, 8: 0 });
        map.set("b", { 0: 2, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 32, 8: 0 });
        definedMetaProperty(prototype, symbolStruct, true);
        definedMetaProperty(prototype, symbolStructMaxBaseTypeByteLength, 4);
        definedMetaProperty(prototype, symbolStructLength, 36);
        definedMetaProperty(prototype, symbolStructKeysMeta, map);
      })(TestA.prototype);
      let p: pointer<TestA>;
      CTypeEnumWrite[20](p + 12, 0);
    `
    check(source, target, {
      input
    })
  })

  test('struct property array<array>', () => {
    const source = `
      @struct
      class TestA {
        a: array<array<pointer<uint8>, 8>, 8>
        b: uint8
      }

      let p: pointer<TestA>
      p.a[3][4] = 0
      let b = p.a[2][1]
    `
    const target = `
      ${symbolImport}
      ${definedMetaPropertyImport}
      import { CTypeEnumRead as CTypeEnumRead } from "cheap/ctypeEnumRead";
      import { CTypeEnumWrite as CTypeEnumWrite } from "cheap/ctypeEnumWrite";
      class TestA {
        a: array<array<pointer<uint8>, 8>, 8>;
        b: uint8;
      }
      (function (prototype) {
        var map = new Map();
        map.set("a", { 0: 2, 1: 1, 2: 1, 3: 1, 4: 64, 5: 0, 6: 0, 7: 0, 8: 0 });
        map.set("b", { 0: 2, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 256, 8: 0 });
        definedMetaProperty(prototype, symbolStruct, true);
        definedMetaProperty(prototype, symbolStructMaxBaseTypeByteLength, 4);
        definedMetaProperty(prototype, symbolStructLength, 260);
        definedMetaProperty(prototype, symbolStructKeysMeta, map);
      })(TestA.prototype);
      let p: pointer<TestA>;
      CTypeEnumWrite[20](p + 96 + 16, 0);
      let b = CTypeEnumRead[20](p + 64 + 4);
    `
    check(source, target, {
      input
    })
  })

  test('struct property @ignore', () => {
    const source = `
      @struct
      class TestA {
        a: uint8
        @ignore
        b: uint8
      }
    `
    const target = `
      ${symbolImport}
      ${definedMetaPropertyImport}
      class TestA {
        a: uint8
        b: uint8
      }
      (function (prototype) {
        var map = new Map();
        map.set("a", { 0: 2, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0 });
        definedMetaProperty(prototype, symbolStruct, true);
        definedMetaProperty(prototype, symbolStructMaxBaseTypeByteLength, 1);
        definedMetaProperty(prototype, symbolStructLength, 1);
        definedMetaProperty(prototype, symbolStructKeysMeta, map);
      })(TestA.prototype);
    `
    check(source, target, {
      input
    })
  })

  test('struct property @ignore condition(true)', () => {
    const source = `
      @struct
      class TestA {
        a: uint8
        @ignore(!defined(Enable_CIgnore))
        b: uint8
      }
    `
    const target = `
      ${symbolImport}
      ${definedMetaPropertyImport}
      class TestA {
        a: uint8
        b: uint8
      }
      (function (prototype) {
        var map = new Map();
        map.set("a", { 0: 2, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0 });
        definedMetaProperty(prototype, symbolStruct, true);
        definedMetaProperty(prototype, symbolStructMaxBaseTypeByteLength, 1);
        definedMetaProperty(prototype, symbolStructLength, 1);
        definedMetaProperty(prototype, symbolStructKeysMeta, map);
      })(TestA.prototype);
    `
    check(source, target, {
      input,
      defined: {
        Enable_CIgnore: false
      }
    })
  })

  test('struct property @ignore condition(false)', () => {
    const source = `
      @struct
      class TestA {
        a: uint8
        @ignore(!defined(Enable_CIgnore))
        b: uint8
      }
    `
    const target = `
      ${symbolImport}
      ${definedMetaPropertyImport}
      class TestA {
        a: uint8
        b: uint8
      }
      (function (prototype) {
        var map = new Map();
        map.set("a", { 0: 2, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0 });
        map.set("b", { 0: 2, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 1, 8: 0 });
        definedMetaProperty(prototype, symbolStruct, true);
        definedMetaProperty(prototype, symbolStructMaxBaseTypeByteLength, 1);
        definedMetaProperty(prototype, symbolStructLength, 2);
        definedMetaProperty(prototype, symbolStructKeysMeta, map);
      })(TestA.prototype);
    `
    check(source, target, {
      input,
      defined: {
        Enable_CIgnore: true
      }
    })
  })

  test('struct property @ignore', () => {
    const source = `
      @struct
      class TestA {
        a: uint8
        b: uint8
      }
      @struct
      class TestB extends TestA {
        c: int64
      }
    `
    const target = `
      ${symbolImport}
      ${definedMetaPropertyImport}
      class TestA {
        a: uint8;
        b: uint8;
      }
      (function (prototype) {
        var map = new Map();
        map.set("a", { 0: 2, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0 });
        map.set("b", { 0: 2, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 1, 8: 0 });
        definedMetaProperty(prototype, symbolStruct, true);
        definedMetaProperty(prototype, symbolStructMaxBaseTypeByteLength, 1);
        definedMetaProperty(prototype, symbolStructLength, 2);
        definedMetaProperty(prototype, symbolStructKeysMeta, map);
      })(TestA.prototype);
      class TestB extends TestA {
        c: int64;
      }
      (function (prototype) {
        var map = new Map();
        map.set("c", { 0: 17, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 8, 8: 0 });
        definedMetaProperty(prototype, symbolStruct, true);
        definedMetaProperty(prototype, symbolStructMaxBaseTypeByteLength, 8);
        definedMetaProperty(prototype, symbolStructLength, 16);
        definedMetaProperty(prototype, symbolStructKeysMeta, map);
      })(TestB.prototype);
    `
    check(source, target, {
      input
    })
  })

  test('struct property tree node', () => {
    const source = `
      type LevelDepth = [never, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9]

      @struct
      class ListNode<T = void, D extends LevelDepth[number] = 9> {
        @type(ListNode<T>)
        @pointer()
        prev: [D] extends [never] ? never : pointer<ListNode<T, LevelDepth[D]>>
        @type(ListNode<T>)
        @pointer()
        next: [D] extends [never] ? never : pointer<ListNode<T, LevelDepth[D]>>
        data: pointer<T>
      }
      let a: pointer<ListNode>
      let data = a.data
    `
    const target = `
      ${symbolImport}
      ${definedMetaPropertyImport}
      import { CTypeEnumRead as CTypeEnumRead } from "cheap/ctypeEnumRead";
      type LevelDepth = [
        never,
        0,
        1,
        2,
        3,
        4,
        5,
        6,
        7,
        8,
        9
      ];
      class ListNode<T = void, D extends LevelDepth[number] = 9> {
        prev: [
          D
        ] extends [
          never
        ] ? never : pointer<ListNode<T, LevelDepth[D]>>;
        next: [
          D
        ] extends [
          never
        ] ? never : pointer<ListNode<T, LevelDepth[D]>>;
        data: pointer<T>;
      }
      (function (prototype) {
        var map = new Map();
        map.set("prev", { 0: ListNode, 1: 1, 2: 1, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0 });
        map.set("next", { 0: ListNode, 1: 1, 2: 1, 3: 0, 4: 0, 5: 0, 6: 0, 7: 4, 8: 0 });
        map.set("data", { 0: 1, 1: 1, 2: 1, 3: 0, 4: 0, 5: 0, 6: 0, 7: 8, 8: 0 });
        definedMetaProperty(prototype, symbolStruct, true);
        definedMetaProperty(prototype, symbolStructMaxBaseTypeByteLength, 4);
        definedMetaProperty(prototype, symbolStructLength, 12);
        definedMetaProperty(prototype, symbolStructKeysMeta, map);
      })(ListNode.prototype);
      let a: pointer<ListNode>;
      let data = CTypeEnumRead[20](a + 8);
    `
    check(source, target, {
      input
    })
  })

  test('struct property union', () => {
    const source = `
      @union
      class TestA {
        a: uint8
        b: uint16
      }
    `
    const target = `
      ${symbolImport}
      ${definedMetaPropertyImport}
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
    `
    const target = `
      ${symbolImport}
      ${definedMetaPropertyImport}
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
    `
    check(source, target, {
      input
    })
  })

  test('struct property type union', () => {
    const source = `
      const enum A {
        A,
        B
      }
      const enum B {
        C,
        D
      }
      @struct
      class TestA {
        a: A | B
      }

      let p1: pointer<TestA>
      let p2: pointer<TestA>
      let b = p1.a
      p2.a = p1.a
    `
    const target = `
      ${symbolImport}
      ${definedMetaPropertyImport}
      import { CTypeEnumRead as CTypeEnumRead } from "cheap/ctypeEnumRead";
      import { CTypeEnumWrite as CTypeEnumWrite } from "cheap/ctypeEnumWrite";
      const enum A {
        A,
        B
      }
      const enum B {
        C,
        D
      }
      class TestA {
        a: A | B;
      }
      (function (prototype) {
        var map = new Map();
        map.set("a", { 0: 15, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0 });
        definedMetaProperty(prototype, symbolStruct, true);
        definedMetaProperty(prototype, symbolStructMaxBaseTypeByteLength, 4);
        definedMetaProperty(prototype, symbolStructLength, 4);
        definedMetaProperty(prototype, symbolStructKeysMeta, map);
      })(TestA.prototype);
      let p1: pointer<TestA>;
      let p2: pointer<TestA>;
      let b = CTypeEnumRead[15](p1);
      CTypeEnumWrite[15](p2, CTypeEnumRead[15](p1));
    `
    check(source, target, {
      input
    })
  })

  
})