import * as fs from 'fs'
import * as path from 'path'
import { check, distPath } from '../transformer'
import { ctypeEnumReadImport, definedMetaPropertyImport, symbolImport } from './snippet'
import { CTypeEnum } from '../../../typedef'

describe('pointer array access', () => {

  let input: string
  let output: string

  beforeAll(() => {
    input = path.join(distPath, './pointer_array_access_input.ts')
    output = path.join(distPath, './pointer_array_access_output.ts')
  })

  afterAll(() => {
    fs.unlinkSync(input)
    fs.unlinkSync(output)
  })

  test('pointer.indexOf(x)', () => {
    const source = `
      let a: pointer<uint8>
      let b = a.indexOf(3)
    `
    const target = `
      ${ctypeEnumReadImport}
      let a: pointer<uint8>
      let b = CTypeEnumRead[${CTypeEnum.uint8}](a + 3);
    `
    check(source, target, {
      input
    })
  })

  test('pointer[x]', () => {
    const source = `
      let a: pointer<uint8>
      let b = a[3]
    `
    const target = `
      ${ctypeEnumReadImport}
      let a: pointer<uint8>
      let b = CTypeEnumRead[${CTypeEnum.uint8}](a + 3);
    `
    check(source, target, {
      input
    })
  })

  test('pointer[i]', () => {
    const source = `
      let a: pointer<uint8>
      let i: number
      let b = a[i]
    `
    const target = `
      ${ctypeEnumReadImport}
      let a: pointer<uint8>
      let i: number
      let b = CTypeEnumRead[${CTypeEnum.uint8}](a + i);
    `
    check(source, target, {
      input
    })
  })

  test('pointer.indexOf(x).indexOf(y)', () => {
    const source = `
      let a: pointer<pointer<uint8>>
      let b = a.indexOf(3).indexOf(8)
    `
    const target = `
      ${ctypeEnumReadImport}
      let a: pointer<pointer<uint8>>
      let b = CTypeEnumRead[2](CTypeEnumRead[20](a + 12) + 8);
    `
    check(source, target, {
      input
    })
  })

  test('pointer[x][y]', () => {
    const source = `
      let a: pointer<pointer<uint8>>
      let b = a[3][8]
    `
    const target = `
      ${ctypeEnumReadImport}
      let a: pointer<pointer<uint8>>
      let b = CTypeEnumRead[2](CTypeEnumRead[20](a + 12) + 8);
    `
    check(source, target, {
      input
    })
  })

  test('pointer<struct>.indexOf(x)', () => {
    const source = `
      @struct
      class TestA {
        a: uint8
        b: float
      }

      let a: pointer<TestA>;
      let b = a.indexOf(3);
    `
    const target = `
      ${symbolImport}
      ${definedMetaPropertyImport}
      import structAccess from "cheap/std/structAccess";
      class TestA {
        a: uint8
        b: float
      }
      (function (prototype) {
        var map = new Map();
        map.set("a", { 0: 2, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0 });
        map.set("b", { 0: 18, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 4, 8: 0 });
        definedMetaProperty(prototype, symbolStruct, true);
        definedMetaProperty(prototype, symbolStructMaxBaseTypeByteLength, 4);
        definedMetaProperty(prototype, symbolStructLength, 8);
        definedMetaProperty(prototype, symbolStructKeysMeta, map);
      })(TestA.prototype);
      let a: pointer<TestA>;
      let b = structAccess(a + 24, TestA);
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
      let b = a[3];
    `
    const target = `
      ${symbolImport}
      ${definedMetaPropertyImport}
      import structAccess from "cheap/std/structAccess";
      class TestA {
        a: uint8
        b: float
      }
      (function (prototype) {
        var map = new Map();
        map.set("a", { 0: 2, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0 });
        map.set("b", { 0: 18, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 4, 8: 0 });
        definedMetaProperty(prototype, symbolStruct, true);
        definedMetaProperty(prototype, symbolStructMaxBaseTypeByteLength, 4);
        definedMetaProperty(prototype, symbolStructLength, 8);
        definedMetaProperty(prototype, symbolStructKeysMeta, map);
      })(TestA.prototype);
      let a: pointer<TestA>;
      let b = structAccess(a + 24, TestA);
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
      let b: pointer<TestA>
      let b = a[b.a];
    `
    const target = `
      ${symbolImport}
      ${definedMetaPropertyImport}
      import { CTypeEnumRead as CTypeEnumRead } from "cheap/ctypeEnumRead";
      import structAccess from "cheap/std/structAccess";
      class TestA {
        a: uint8
        b: float
      }
      (function (prototype) {
        var map = new Map();
        map.set("a", { 0: 2, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0 });
        map.set("b", { 0: 18, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 4, 8: 0 });
        definedMetaProperty(prototype, symbolStruct, true);
        definedMetaProperty(prototype, symbolStructMaxBaseTypeByteLength, 4);
        definedMetaProperty(prototype, symbolStructLength, 8);
        definedMetaProperty(prototype, symbolStructKeysMeta, map);
      })(TestA.prototype);
      let a: pointer<TestA>;
      let b: pointer<TestA>;
      let b = structAccess(a + (CTypeEnumRead[2](b) * 8), TestA);
    `
    check(source, target, {
      input
    })
  })

  test('pointer<struct>[x][x]', () => {
    const source = `
      @struct
      class TestA {
        a: uint8
        b: float
      }

      let a: pointer<pointer<TestA>>;
      let b = a[3][3];
    `
    const target = `
      ${symbolImport}
      ${definedMetaPropertyImport}
      import { CTypeEnumRead as CTypeEnumRead } from "cheap/ctypeEnumRead";
      import structAccess from "cheap/std/structAccess";
      class TestA {
        a: uint8
        b: float
      }
      (function (prototype) {
        var map = new Map();
        map.set("a", { 0: 2, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0 });
        map.set("b", { 0: 18, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 4, 8: 0 });
        definedMetaProperty(prototype, symbolStruct, true);
        definedMetaProperty(prototype, symbolStructMaxBaseTypeByteLength, 4);
        definedMetaProperty(prototype, symbolStructLength, 8);
        definedMetaProperty(prototype, symbolStructKeysMeta, map);
      })(TestA.prototype);
      let a: pointer<pointer<TestA>>;
      let b = structAccess(CTypeEnumRead[20](a + 12) + 24, TestA);
    `
    check(source, target, {
      input
    })
  })

  test('pointer<struct>.indexOf(x).indexOf(y)', () => {
    const source = `
      @struct
      class TestA {
        a: uint8
        b: float
      }
      let a: pointer<pointer<TestA>>;
      let b = a.indexOf(3).indexOf(5);
    `
    const target = `
      ${symbolImport}
      ${definedMetaPropertyImport}
      import { CTypeEnumRead as CTypeEnumRead } from "cheap/ctypeEnumRead";
      import structAccess from "cheap/std/structAccess";
      class TestA {
        a: uint8
        b: float
      }
      (function (prototype) {
        var map = new Map();
        map.set("a", { 0: 2, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0 });
        map.set("b", { 0: 18, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 4, 8: 0 });
        definedMetaProperty(prototype, symbolStruct, true);
        definedMetaProperty(prototype, symbolStructMaxBaseTypeByteLength, 4);
        definedMetaProperty(prototype, symbolStructLength, 8);
        definedMetaProperty(prototype, symbolStructKeysMeta, map);
      })(TestA.prototype);
      let a: pointer<pointer<TestA>>;
      let b = structAccess(CTypeEnumRead[20](a + 12) + 40, TestA);
    `
    check(source, target, {
      input
    })
  })

  test('pointer<struct>[x][y]', () => {
    const source = `
      @struct
      class TestA {
        a: uint8
        b: float
      }
      let a: pointer<pointer<TestA>>;
      let b = a[3][5];
    `
    const target = `
      ${symbolImport}
      ${definedMetaPropertyImport}
      import { CTypeEnumRead as CTypeEnumRead } from "cheap/ctypeEnumRead";
      import structAccess from "cheap/std/structAccess";
      class TestA {
        a: uint8
        b: float
      }
      (function (prototype) {
        var map = new Map();
        map.set("a", { 0: 2, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0 });
        map.set("b", { 0: 18, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 4, 8: 0 });
        definedMetaProperty(prototype, symbolStruct, true);
        definedMetaProperty(prototype, symbolStructMaxBaseTypeByteLength, 4);
        definedMetaProperty(prototype, symbolStructLength, 8);
        definedMetaProperty(prototype, symbolStructKeysMeta, map);
      })(TestA.prototype);
      let a: pointer<pointer<TestA>>;
      let b = structAccess(CTypeEnumRead[20](a + 12) + 40, TestA);
    `
    check(source, target, {
      input
    })
  })

  test('pointer<inline struct>.indexOf(x)', () => {
    const source = `
      @struct
      class TestA {
        a: uint8
        b: pointer<struct<{
          a: uint8
          b: uint16
        }>>
      }
      let p: pointer<TestA>;
      let a = p.b.indexOf(4)
    `
    const target = `
      ${symbolImport}
      ${definedMetaPropertyImport}
      ${ctypeEnumReadImport}
      import structAccess from "cheap/std/structAccess";
      class TestA {
        a: uint8;
        b: pointer<struct<{
          a: uint8
          b: uint16
        }>>;
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
        })({}), 1: 1, 2: 1, 3: 0, 4: 0, 5: 0, 6: 0, 7: 4, 8: 0 });
        definedMetaProperty(prototype, symbolStruct, true);
        definedMetaProperty(prototype, symbolStructMaxBaseTypeByteLength, 4);
        definedMetaProperty(prototype, symbolStructLength, 8);
        definedMetaProperty(prototype, symbolStructKeysMeta, map);
      })(TestA.prototype);
      let p: pointer<TestA>;
      let a = structAccess(CTypeEnumRead[20](p + 4) + 16, TestA, "b");
    `
    check(source, target, {
      input
    })
  })

  test('pointer<inline struct>[x]', () => {
    const source = `
      @struct
      class TestA {
        a: uint8
        b: pointer<struct<{
          a: uint8
          b: uint16
        }>>
      }
      let p: pointer<TestA>;
      let a = p.b[4]
    `
    const target = `
      ${symbolImport}
      ${definedMetaPropertyImport}
      ${ctypeEnumReadImport}
      import structAccess from "cheap/std/structAccess";
      class TestA {
        a: uint8;
        b: pointer<struct<{
          a: uint8
          b: uint16
        }>>;
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
        })({}), 1: 1, 2: 1, 3: 0, 4: 0, 5: 0, 6: 0, 7: 4, 8: 0 });
        definedMetaProperty(prototype, symbolStruct, true);
        definedMetaProperty(prototype, symbolStructMaxBaseTypeByteLength, 4);
        definedMetaProperty(prototype, symbolStructLength, 8);
        definedMetaProperty(prototype, symbolStructKeysMeta, map);
      })(TestA.prototype);
      let p: pointer<TestA>;
      let a = structAccess(CTypeEnumRead[20](p + 4) + 16, TestA, "b");
    `
    check(source, target, {
      input
    })
  })

  test('pointer<inline struct>.indexOf(x).[xx]', () => {
    const source = `
      @struct
      class TestA {
        a: uint8
        b: pointer<struct<{
          a: uint8
          b: uint16
        }>>
      }
      let p: pointer<TestA>;
      let a = p.b.indexOf(4).b
    `
    const target = `
      ${symbolImport}
      ${definedMetaPropertyImport}
      ${ctypeEnumReadImport}
      class TestA {
        a: uint8;
        b: pointer<struct<{
          a: uint8
          b: uint16
        }>>;
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
        })({}), 1: 1, 2: 1, 3: 0, 4: 0, 5: 0, 6: 0, 7: 4, 8: 0 });
        definedMetaProperty(prototype, symbolStruct, true);
        definedMetaProperty(prototype, symbolStructMaxBaseTypeByteLength, 4);
        definedMetaProperty(prototype, symbolStructLength, 8);
        definedMetaProperty(prototype, symbolStructKeysMeta, map);
      })(TestA.prototype);
      let p: pointer<TestA>;
      let a = CTypeEnumRead[6](CTypeEnumRead[20](p + 4) + 18);
    `
    check(source, target, {
      input
    })
  })

  test('pointer<inline struct>[x].[xx]', () => {
    const source = `
      @struct
      class TestA {
        a: uint8
        b: pointer<struct<{
          a: uint8
          b: uint16
        }>>
      }
      let p: pointer<TestA>;
      let a = p.b[4].b
    `
    const target = `
      ${symbolImport}
      ${definedMetaPropertyImport}
      ${ctypeEnumReadImport}
      class TestA {
        a: uint8;
        b: pointer<struct<{
          a: uint8
          b: uint16
        }>>;
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
        })({}), 1: 1, 2: 1, 3: 0, 4: 0, 5: 0, 6: 0, 7: 4, 8: 0 });
        definedMetaProperty(prototype, symbolStruct, true);
        definedMetaProperty(prototype, symbolStructMaxBaseTypeByteLength, 4);
        definedMetaProperty(prototype, symbolStructLength, 8);
        definedMetaProperty(prototype, symbolStructKeysMeta, map);
      })(TestA.prototype);
      let p: pointer<TestA>;
      let a = CTypeEnumRead[6](CTypeEnumRead[20](p + 4) + 18);
    `
    check(source, target, {
      input
    })
  })

  test('pointer<pointer<inline struct>>[x].[xx]', () => {
    const source = `
      @struct
      class TestA {
        a: uint8
        b: pointer<pointer<struct<{
          a: uint8
          b: uint16
        }>>>
      }
      let p: pointer<TestA>;
      let a = p.b[4].b
    `
    const target = `
      ${symbolImport}
      ${definedMetaPropertyImport}
      ${ctypeEnumReadImport}
      class TestA {
        a: uint8;
        b:  pointer<pointer<struct<{
          a: uint8
          b: uint16
        }>>>;
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
        })({}), 1: 1, 2: 2, 3: 0, 4: 0, 5: 0, 6: 0, 7: 4, 8: 0 });
        definedMetaProperty(prototype, symbolStruct, true);
        definedMetaProperty(prototype, symbolStructMaxBaseTypeByteLength, 4);
        definedMetaProperty(prototype, symbolStructLength, 8);
        definedMetaProperty(prototype, symbolStructKeysMeta, map);
      })(TestA.prototype);
      let p: pointer<TestA>;
      let a = CTypeEnumRead[6](CTypeEnumRead[20](CTypeEnumRead[20](p + 4) + 16) + 2);
    `
    check(source, target, {
      input
    })
  })

  test('pointer<inline union>.indexOf(x).[xx]', () => {
    const source = `
      @struct
      class TestA {
        a: uint8
        b: pointer<union<{
          a: uint8
          b: uint16
        }>>
      }
      let p: pointer<TestA>;
      let a = p.b.indexOf(4).b
    `
    const target = `
      ${symbolImport}
      ${definedMetaPropertyImport}
      ${ctypeEnumReadImport}
      class TestA {
        a: uint8;
        b: pointer<union<{
          a: uint8
          b: uint16
        }>>;
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
        })({}), 1: 1, 2: 1, 3: 0, 4: 0, 5: 0, 6: 0, 7: 4, 8: 0 });
        definedMetaProperty(prototype, symbolStruct, true);
        definedMetaProperty(prototype, symbolStructMaxBaseTypeByteLength, 4);
        definedMetaProperty(prototype, symbolStructLength, 8);
        definedMetaProperty(prototype, symbolStructKeysMeta, map);
      })(TestA.prototype);
      let p: pointer<TestA>;
      let a = CTypeEnumRead[6](CTypeEnumRead[20](p + 4) + 8);
    `
    check(source, target, {
      input
    })
  })

  test('pointer<inline union>[x].[xx]', () => {
    const source = `
      @struct
      class TestA {
        a: uint8
        b: pointer<union<{
          a: uint8
          b: uint16
        }>>
      }
      let p: pointer<TestA>;
      let a = p.b[4].b
    `
    const target = `
      ${symbolImport}
      ${definedMetaPropertyImport}
      ${ctypeEnumReadImport}
      class TestA {
        a: uint8;
        b: pointer<union<{
          a: uint8
          b: uint16
        }>>;
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
        })({}), 1: 1, 2: 1, 3: 0, 4: 0, 5: 0, 6: 0, 7: 4, 8: 0 });
        definedMetaProperty(prototype, symbolStruct, true);
        definedMetaProperty(prototype, symbolStructMaxBaseTypeByteLength, 4);
        definedMetaProperty(prototype, symbolStructLength, 8);
        definedMetaProperty(prototype, symbolStructKeysMeta, map);
      })(TestA.prototype);
      let p: pointer<TestA>;
      let a = CTypeEnumRead[6](CTypeEnumRead[20](p + 4) + 8);
    `
    check(source, target, {
      input
    })
  })

  test('pointer<inline struct>[xx].xx', () => {
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
      let a = p.b[4].b
    `
    const target = `
      ${symbolImport}
      ${definedMetaPropertyImport}
      ${ctypeEnumReadImport}
      class TestA {
        a: uint8;
        b: array<struct<{
          a: uint8
          b: uint16
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
      let a = CTypeEnumRead[6](p + 20);
    `
    check(source, target, {
      input
    })
  })

  test('pointer<inline union>[xx].[xx]', () => {
    const source = `
      @struct
      class TestA {
        a: uint8
        b: array<union<{
          a: uint8
          b: uint16
        }>, 6>
      }
      let p: pointer<TestA>;
      let a = p.b[4].b
    `
    const target = `
      ${symbolImport}
      ${definedMetaPropertyImport}
      ${ctypeEnumReadImport}
      class TestA {
        a: uint8;
        b: array<union<{
          a: uint8
          b: uint16
        }>, 6>;
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
        })({}), 1: 0, 2: 0, 3: 1, 4: 6, 5: 0, 6: 0, 7: 2, 8: 0 });
        definedMetaProperty(prototype, symbolStruct, true);
        definedMetaProperty(prototype, symbolStructMaxBaseTypeByteLength, 2);
        definedMetaProperty(prototype, symbolStructLength, 14);
        definedMetaProperty(prototype, symbolStructKeysMeta, map);
      })(TestA.prototype);
      let p: pointer<TestA>;
      let a = CTypeEnumRead[6](p + 10);
    `
    check(source, target, {
      input
    })
  })
})