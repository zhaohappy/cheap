import * as fs from 'fs'
import * as path from 'path'
import { check, distPath } from '../transformer'
import { ctypeEnumReadImport, definedMetaPropertyImport, symbolImport, mapStructImport } from './snippet'
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

  test('pointer[0]', () => {
    const source = `
      let a: pointer<uint8>
      let b = a[0]
    `
    const target = `
      ${ctypeEnumReadImport}
      let a: pointer<uint8>
      let b = CTypeEnumRead[${CTypeEnum.uint8}](a);
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
      ${mapStructImport}
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
      let b = mapStruct(a + 24, TestA);
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
      ${mapStructImport}
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
      let b = mapStruct(a + 24, TestA);
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
      ${ctypeEnumReadImport}
      ${mapStructImport}
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
      let b = mapStruct(a + (CTypeEnumRead[2](b) * 8), TestA);
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
      ${ctypeEnumReadImport}
      ${mapStructImport}
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
      let b = mapStruct(CTypeEnumRead[20](a + 12) + 24, TestA);
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
      ${ctypeEnumReadImport}
      ${mapStructImport}
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
      let b = mapStruct(CTypeEnumRead[20](a + 12) + 40, TestA);
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
      ${ctypeEnumReadImport}
      ${mapStructImport}
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
      let b = mapStruct(CTypeEnumRead[20](a + 12) + 40, TestA);
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
      ${mapStructImport}
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
      let a = mapStruct(CTypeEnumRead[20](p + 4) + 16, TestA, "b");
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
      ${mapStructImport}
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
      let a = mapStruct(CTypeEnumRead[20](p + 4) + 16, TestA, "b");
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

  test('pointer<struct>.array[x] wasm64', () => {
    const source = `
      @struct
      class TestA {
        a: uint8
        b: array<pointer<void>, 8>
      }
      let i = 0
      let a: pointer<TestA>;
      let b = a.b[i]
    `
    const target = `
      ${symbolImport}
      ${definedMetaPropertyImport}
      ${ctypeEnumReadImport}
      class TestA {
        a: uint8;
        b: array<pointer<void>, 8>;
      }
      (function (prototype) {
        var map = new Map();
        map.set("a", { 0: 2, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0 });
        map.set("b", { 0: 1, 1: 1, 2: 1, 3: 1, 4: 8, 5: 0, 6: 0, 7: 8, 8: 0 });
        definedMetaProperty(prototype, symbolStruct, true);
        definedMetaProperty(prototype, symbolStructMaxBaseTypeByteLength, 8);
        definedMetaProperty(prototype, symbolStructLength, 72);
        definedMetaProperty(prototype, symbolStructKeysMeta, map);
      })(TestA.prototype);
      let i = 0;
      let a: pointer<TestA>;
      let b = CTypeEnumRead[20](a + 8n + BigInt(8 * (i)));
    `
    check(source, target, {
      input,
      defined: {
        WASM_64: true
      }
    })
  })

  test('pointer<pointer<uint8>>[x]', () => {
    const source = `
      let a: pointer<pointer<uint8>>;
      let i = 0
      let b = a[i - 1]
    `
    const target = `
      ${ctypeEnumReadImport}
      let a: pointer<pointer<uint8>>;
      let i = 0;
      let b = CTypeEnumRead[${CTypeEnum.pointer}](a + ((i - 1) * 4));
    `
    check(source, target, {
      input
    })
  })

  test('pointer<pointer<uint8>>[x] wasm64', () => {
    const source = `
      let a: pointer<pointer<uint8>>;
      let i = 0
      let b = a[i - 1]
    `
    const target = `
      ${ctypeEnumReadImport}
      let a: pointer<pointer<uint8>>;
      let i = 0;
      let b = CTypeEnumRead[${CTypeEnum.pointer}](a + (BigInt((i - 1)) * 8n));
    `
    check(source, target, {
      input,
      defined: {
        WASM_64: true
      }
    })
  })

  test('pointer<pointer<uint8>>[x][x]', () => {
    const source = `
      let a: pointer<pointer<uint32>>;
      let i = 0
      let b = a[i - 1][i + 5]
    `
    const target = `
      ${ctypeEnumReadImport}
      let a: pointer<pointer<uint32>>;
      let i = 0;
      let b = CTypeEnumRead[${CTypeEnum.uint32}](CTypeEnumRead[${CTypeEnum.pointer}](a + ((i - 1) * 4)) + ((i + 5) * 4));
    `
    check(source, target, {
      input
    })
  })

  test('pointer<pointer<uint8>>[x][x] wasm64', () => {
    const source = `
      let a: pointer<pointer<uint32>>;
      let i = 0
      let b = a[i - 1][i + 5]
    `
    const target = `
      ${ctypeEnumReadImport}
      let a: pointer<pointer<uint32>>;
      let i = 0;
      let b = CTypeEnumRead[${CTypeEnum.uint32}](CTypeEnumRead[${CTypeEnum.pointer}](a + (BigInt((i - 1)) * 8n)) + (BigInt((i + 5)) * 4n));
    `
    check(source, target, {
      input,
      defined: {
        WASM_64: true
      }
    })
  })
})