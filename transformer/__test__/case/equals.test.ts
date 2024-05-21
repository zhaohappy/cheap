import * as fs from 'fs'
import * as path from 'path'
import { check, distPath } from '../transformer'
import { CTypeEnum, CTypeEnum2Bytes } from '../../../typedef'
import { ctypeEnumReadImport, ctypeEnumWriteImport, definedMetaPropertyImport, symbolImport } from './snippet'

describe('equals', () => {

  let input: string
  let output: string

  beforeAll(() => {
    input = path.join(distPath, './equals_input.ts')
    output = path.join(distPath, './equals_output.ts')
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


  test('chain assignment: a = b = c', () => {
    const source = `
      let a: number, b: number, c: number;
      a = 0;
      b = c = a;
    `
    const target = `
      let a: number, b: number, c: number;
      a = 0;
      b = c = a;
    `
    check(source, target, {
      input
    })
  })

  test('pointer chain assignment: a = b = c', () => {
    const source = `
      let a: pointer<int8>, b: pointer<int8>, c: pointer<int8>;
      a = 0;
      b = c = a;
    `
    const target = `
      let a: pointer<int8>, b: pointer<int8>, c: pointer<int8>;
      a = 0;
      b = a, c = a;
    `
    check(source, target, {
      input
    })
  })

  test('pointer property equal: pointer.char = 0', () => {
    const source = `
      ${snippetClassTestABSource}
      let a: pointer<TestA>;
      a.a = 0;
    `
    const target = `
      ${symbolImport}
      ${definedMetaPropertyImport}
      ${ctypeEnumReadImport}
      ${ctypeEnumWriteImport}
      ${snippetClassTestABTarget}
      let a: pointer<TestA>;
      CTypeEnumWrite[${CTypeEnum.char}](a, 0);
    `
    check(source, target, {
      input
    })
  })

  test('pointer property equal: pointer.uint8 = 0', () => {
    const source = `
      ${snippetClassTestABSource}
      let a: pointer<TestA>;
      a.b = 0;
    `
    const target = `
      ${symbolImport}
      ${definedMetaPropertyImport}
      ${ctypeEnumReadImport}
      ${ctypeEnumWriteImport}
      ${snippetClassTestABTarget}
      let a: pointer<TestA>;
      CTypeEnumWrite[${CTypeEnum.uint8}](a + 1, 0);
    `
    check(source, target, {
      input,
    })
  })

  test('pointer property equal: pointer.struct.a = 0', () => {
    const source = `
      ${snippetClassTestABSource}
      let a: pointer<TestB>;
      a.a.a = 0;
    `
    const target = `
      ${symbolImport}
      ${definedMetaPropertyImport}
      ${ctypeEnumReadImport}
      ${ctypeEnumWriteImport}
      ${snippetClassTestABTarget}
      let a: pointer<TestB>;
      CTypeEnumWrite[${CTypeEnum.char}](a, 0);
    `
    check(source, target, {
      input
    })
  })

  test('pointer property equal: pointer.pointer.a = 0', () => {
    const source = `
      ${snippetClassTestABSource}
      let a: pointer<TestB>;
      a.b.a = 0;
    `
    const target = `
      ${symbolImport}
      ${definedMetaPropertyImport}
      ${ctypeEnumReadImport}
      ${ctypeEnumWriteImport}
      ${snippetClassTestABTarget}
      let a: pointer<TestB>;
      CTypeEnumWrite[${CTypeEnum.char}](CTypeEnumRead[${CTypeEnum.pointer}](a + 72), 0);
    `
    check(source, target, {
      input
    })
  })

  test('pointer property equal: pointer.pointer_2.a = 0', () => {
    const source = `
      ${snippetClassTestABSource}
      let a: pointer<TestB>;
      accessof(a.c).a = 0;
    `
    const target = `
      ${symbolImport}
      ${definedMetaPropertyImport}
      ${ctypeEnumReadImport}
      ${ctypeEnumWriteImport}
      ${snippetClassTestABTarget}
      let a: pointer<TestB>;
      CTypeEnumWrite[${CTypeEnum.char}](CTypeEnumRead[${CTypeEnum.pointer}](CTypeEnumRead[${CTypeEnum.pointer}](a + 76)), 0);
    `
    check(source, target, {
      input
    })
  })

  test('pointer property equal: pointer.pointer_2.b = 0', () => {
    const source = `
      ${snippetClassTestABSource}
      let a: pointer<TestB>;
      accessof(a.c).b = 0;
    `
    const target = `
      ${symbolImport}
      ${definedMetaPropertyImport}
      ${ctypeEnumReadImport}
      ${ctypeEnumWriteImport}
      ${snippetClassTestABTarget}
      let a: pointer<TestB>;
      CTypeEnumWrite[${CTypeEnum.uint8}](CTypeEnumRead[${CTypeEnum.pointer}](CTypeEnumRead[${CTypeEnum.pointer}](a + 76)) + 1, 0);
    `
    check(source, target, {
      input
    })
  })

  test('pointer property equal: pointer.array.a = 0', () => {
    const source = `
      ${snippetClassTestABSource}
      let a: pointer<TestB>;
      a.d[2].a = 0
    `
    const target = `
      ${symbolImport}
      ${definedMetaPropertyImport}
      ${ctypeEnumReadImport}
      ${ctypeEnumWriteImport}
      ${snippetClassTestABTarget}
      let a: pointer<TestB>;
      CTypeEnumWrite[${CTypeEnum.char}](a + ${80 + 144}, 0);
    `
    check(source, target, {
      input
    })
  })

  test('pointer property equal: pointer.xx[xx].a = 0', () => {
    const source = `
      ${snippetClassTestABSource}
      let a: pointer<TestB>;
      a.e[5].a = 0
    `
    const target = `
      ${symbolImport}
      ${definedMetaPropertyImport}
      ${ctypeEnumReadImport}
      ${ctypeEnumWriteImport}
      ${snippetClassTestABTarget}
      let a: pointer<TestB>;
      CTypeEnumWrite[${CTypeEnum.char}](CTypeEnumRead[${CTypeEnum.pointer}](a + ${656 + 5 * CTypeEnum2Bytes[CTypeEnum.pointer]}), 0)
    `
    check(source, target, {
      input
    })
  })

  test('pointer property equal: pointer.xx[xx].b = 0', () => {
    const source = `
      ${snippetClassTestABSource}
      let a: pointer<TestB>;
      a.e[3].b = 0
    `
    const target = `
      ${symbolImport}
      ${definedMetaPropertyImport}
      ${ctypeEnumReadImport}
      ${ctypeEnumWriteImport}
      ${snippetClassTestABTarget}
      let a: pointer<TestB>;
      CTypeEnumWrite[${CTypeEnum.uint8}](CTypeEnumRead[${CTypeEnum.pointer}](a + ${656 + 3 * CTypeEnum2Bytes[CTypeEnum.pointer]}) + ${CTypeEnum2Bytes[CTypeEnum.char]}, 0)
    `
    check(source, target, {
      input
    })
  })

  test('pointer property equal: pointer.xx.indexOf(xx).b = 0', () => {
    const source = `
      ${snippetClassTestABSource}
      let a: pointer<TestB>;
      a.b.indexOf(6).b = 0
    `
    const target = `
      ${symbolImport}
      ${definedMetaPropertyImport}
      ${ctypeEnumReadImport}
      ${ctypeEnumWriteImport}
      ${snippetClassTestABTarget}
      let a: pointer<TestB>;
      CTypeEnumWrite[${CTypeEnum.uint8}](CTypeEnumRead[${CTypeEnum.pointer}](a + 72) + ${432 + 1}, 0)
    `
    check(source, target, {
      input
    })
  })

  test('pointer property equal: pointer.array[x] = 0', () => {
    const source = `
      ${snippetClassTestABSource}
      let a: pointer<TestA>;
      a.s[1] = 0
    `
    const target = `
      ${symbolImport}
      ${definedMetaPropertyImport}
      ${ctypeEnumReadImport}
      ${ctypeEnumWriteImport}
      ${snippetClassTestABTarget}
      let a: pointer<TestA>;
      CTypeEnumWrite[${CTypeEnum.uint8}](a + 56 + 1, 0)
    `
    check(source, target, {
      input
    })
  })

  test('pointer property equal: pointer.array[0] = 0', () => {
    const source = `
      ${snippetClassTestABSource}
      let a: pointer<TestA>;
      a.s[0] = 0
    `
    const target = `
      ${symbolImport}
      ${definedMetaPropertyImport}
      ${ctypeEnumReadImport}
      ${ctypeEnumWriteImport}
      ${snippetClassTestABTarget}
      let a: pointer<TestA>;
      CTypeEnumWrite[${CTypeEnum.uint8}](a + 56, 0)
    `
    check(source, target, {
      input
    })
  })

  test('pointer property equal: pointer.array[i] = 0', () => {
    const source = `
      let a: pointer<float>;
      for (let i = 0; i < 5; i++) {
        a[i] = 0.0
      }
    `
    const target = `
      ${ctypeEnumReadImport}
      ${ctypeEnumWriteImport}
      let a: pointer<float>;
      for (let i = 0; i < 5; i++) {
        CTypeEnumWrite[18](a + (i * 4), 0.0);
      }
    `
    check(source, target, {
      input
    })
  })

  test('pointer property equal: pointer.bit = 4', () => {
    const source = `
      ${snippetClassTestABSource}
      let a: pointer<TestA>;
      a.t = 4
    `
    const target = `
      ${symbolImport}
      ${definedMetaPropertyImport}
      ${ctypeEnumReadImport}
      ${ctypeEnumWriteImport}
      ${snippetClassTestABTarget}
      let a: pointer<TestA>;
      CTypeEnumWrite[${CTypeEnum.uint8}](a + 64, (CTypeEnumRead[${CTypeEnum.uint8}](a + 64) & ~31) | ((4 & 31) << 0))
    `
    check(source, target, {
      input
    })
  })

  test('pointer property equal: pointer.bit = 4', () => {
    const source = `
      ${snippetClassTestABSource}
      let a: pointer<TestA>;
      a.a = a.b = 0
    `
    const target = `
      ${symbolImport}
      ${definedMetaPropertyImport}
      ${ctypeEnumReadImport}
      ${ctypeEnumWriteImport}
      ${snippetClassTestABTarget}
      let a: pointer<TestA>;
      CTypeEnumWrite[4](a, 0), CTypeEnumWrite[2](a + 1, 0)
    `
    check(source, target, {
      input
    })
  })

  test('struct property inline union equals', () => {
    const source = `
      @struct
      class TestA {
        a: uint8
        b: union<{
          a: uint8
          b: uint16
        }>
      }
      let p1: pointer<TestA>
      let p2: pointer<TestA>
      p1.b = p2.b
      p1.b.b = p2.b.b
    `
    const target = `
      import { memcpy as memcpy } from "cheap/std/memory";
      ${symbolImport}
      ${definedMetaPropertyImport}
      import structAccess from "cheap/std/structAccess";
      import { CTypeEnumRead as CTypeEnumRead } from "cheap/ctypeEnumRead";
      import { CTypeEnumWrite as CTypeEnumWrite } from "cheap/ctypeEnumWrite";
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
      let p1: pointer<TestA>;
      let p2: pointer<TestA>;
      memcpy(p1 + 2, p2 + 2, 2);
      CTypeEnumWrite[6](p1 + 2, CTypeEnumRead[6](p2 + 2));
    `
    check(source, target, {
      input
    })
  })

  test('struct property inline union equals', () => {
    const source = `
      @struct
      class TestA {
        a: uint8
        b: union<{
          a: uint8
          b: uint16
        }>
      }
      @struct
      class TestB {
        a: uint8
        b: TestA
      }
      let p1: pointer<TestB>
      let p2: pointer<TestB>
      let p3 = addressof(p2.b.b.b)
      p1.b.b.b = p2.b.b.b
    `
    const target = `
      ${symbolImport}
      ${definedMetaPropertyImport}
      import { CTypeEnumRead as CTypeEnumRead } from "cheap/ctypeEnumRead";
      import { CTypeEnumWrite as CTypeEnumWrite } from "cheap/ctypeEnumWrite";
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
      class TestB {
        a: uint8;
        b: TestA;
      }
      (function (prototype) {
        var map = new Map();
        map.set("a", { 0: 2, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0 });
        map.set("b", { 0: TestA, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 2, 8: 0 });
        definedMetaProperty(prototype, symbolStruct, true);
        definedMetaProperty(prototype, symbolStructMaxBaseTypeByteLength, 2);
        definedMetaProperty(prototype, symbolStructLength, 6);
        definedMetaProperty(prototype, symbolStructKeysMeta, map);
      })(TestB.prototype);
      let p1: pointer<TestB>;
      let p2: pointer<TestB>;
      let p3 = p2 + 4;
      CTypeEnumWrite[6](p1 + 4, CTypeEnumRead[6](p2 + 4));
    `
    check(source, target, {
      input
    })
  })

  test('struct property js object equals', () => {
    const source = `
      @struct
      class TestA {
        a: uint8
        b: union<{
          a: uint8
          b: uint16
        }>
      }
      const a: {
        a: pointer<TestA>
      } = {
        a: 0
      }
      a.a.a = 0
    `
    const target = `
      ${symbolImport}
      ${definedMetaPropertyImport}
      import { CTypeEnumRead as CTypeEnumRead } from "cheap/ctypeEnumRead";
      import { CTypeEnumWrite as CTypeEnumWrite } from "cheap/ctypeEnumWrite";
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
      const a: {
        a: pointer<TestA>;
      } = {
        a: 0
      };
      CTypeEnumWrite[2](a.a, 0);
    `
    check(source, target, {
      input
    })
  })

  test('struct property this object equals', () => {
    const source = `
      @struct
      class TestA {
        a: uint8
        b: union<{
          a: uint8
          b: uint16
        }>
      }
      class TestB {

        a: pointer<TestA>

        push() {
          this.a.b.b = 0
        }
      }
    `
    const target = `
      ${symbolImport}
      ${definedMetaPropertyImport}
      import { CTypeEnumRead as CTypeEnumRead } from "cheap/ctypeEnumRead";
      import { CTypeEnumWrite as CTypeEnumWrite } from "cheap/ctypeEnumWrite";
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
      class TestB {
        a: pointer<TestA>;
        push() {
          CTypeEnumWrite[6](this.a + 2, 0);
        }
      }
    `
    check(source, target, {
      input
    })
  })

  test('struct property struct object literal equal', () => {
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
      p.b = {
        a: 0,
        b: 1
      }
    `
    const target = `
      ${symbolImport}
      ${definedMetaPropertyImport}
      import structAccess from "cheap/std/structAccess";
      import { CTypeEnumWrite as CTypeEnumWrite } from "cheap/ctypeEnumWrite";
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
      CTypeEnumWrite[2](p + 2, 0), CTypeEnumWrite[6](p + 4, 1)
    `
    check(source, target, {
      input
    })
  })

  test('struct property struct object literal equal', () => {
    const source = `
      @struct
      class TestA {
        a: uint8
        b: struct<{
          a: uint8
          b: uint16
        }>
      }
      @struct
      class TestB {
        a: uint8
        b: TestA
      }

      let p: pointer<TestB>;
      p.b = {
        a: 0,
        b: {
          a: 1,
          b: 2
        }
      }
    `
    const target = `
      ${symbolImport}
      ${definedMetaPropertyImport}
      import structAccess from "cheap/std/structAccess";
      import { CTypeEnumWrite as CTypeEnumWrite } from "cheap/ctypeEnumWrite";
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
      class TestB {
        a: uint8;
        b: TestA;
      }
      (function (prototype) {
        var map = new Map();
        map.set("a", { 0: 2, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0 });
        map.set("b", { 0: TestA, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 2, 8: 0 });
        definedMetaProperty(prototype, symbolStruct, true);
        definedMetaProperty(prototype, symbolStructMaxBaseTypeByteLength, 2);
        definedMetaProperty(prototype, symbolStructLength, 8);
        definedMetaProperty(prototype, symbolStructKeysMeta, map);
      })(TestB.prototype);
      let p: pointer<TestB>;
      CTypeEnumWrite[2](p + 2, 0), CTypeEnumWrite[2](p + 4, 1), CTypeEnumWrite[6](p + 6, 2);
    `
    check(source, target, {
      input
    })
  })
})