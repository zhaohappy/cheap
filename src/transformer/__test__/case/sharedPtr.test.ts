import * as fs from 'fs'
import * as path from 'path'
import { check, distPath, transform2AST } from '../transformer'

import {
  definedMetaPropertyImport,
  symbolImport,
  symbol2Import,
  ctypeEnumReadImport,
  ctypeEnumWriteImport,
  mapStructImport,
  makeImport,
  makeSharedPtrImport,
  memcpyImport
} from './snippet'

describe('sharedPtr', () => {

  let input: string
  let output: string

  beforeAll(() => {
    input = path.join(distPath, './sharedPtr.ts')
    output = path.join(distPath, './sharedPtr_output.ts')
  })

  afterAll(() => {
    fs.unlinkSync(input)
    fs.rmSync(output, { force: true })
  })

  test('sharedPtr property', () => {
    const source = `
      @struct
      class TestA {
        a: int8
      }
      let b = make_shared_ptr<TestA>()
      let a = b.a
      b.a = 6
    `
    const target = `
      ${symbolImport}
      ${definedMetaPropertyImport}
      ${makeSharedPtrImport}
      ${ctypeEnumReadImport}
      ${ctypeEnumWriteImport}
      class TestA {
        a: int8
      }
      (function (prototype) {
        var map = new Map()
        map.set("a", { 0: 11, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0 })
        definedMetaProperty(prototype, symbolStruct, true)
        definedMetaProperty(prototype, symbolStructMaxBaseTypeByteLength, 1)
        definedMetaProperty(prototype, symbolStructLength, 1)
        definedMetaProperty(prototype, symbolStructKeysMeta, map)
      })(TestA.prototype)
      let b = makeSharedPtr(TestA)
      let a = CTypeEnumRead[11](b.get())
      CTypeEnumWrite[11](b.get(), 6)
    `
    check(source, target, {
      input
    })
  })

  test('sharedPtr property struct', () => {
    const source = `
      @struct
      class TestA {
        a: int8
      }
      @struct
      class TestB {
        a: int8
        b: TestA
      }
      let b = make_shared_ptr<TestB>()
      let a = b.b
      let c = make<TestA>()
      b.b.a = 6
      b.b = c
    `
    const target = `
      ${memcpyImport}
      ${symbol2Import}
      ${definedMetaPropertyImport}
      ${makeSharedPtrImport}
      ${mapStructImport}
      ${makeImport}
      ${ctypeEnumWriteImport}
      class TestA {
        a: int8;
      }
      (function (prototype) {
        var map = new Map();
        map.set("a", { 0: 11, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0 });
        definedMetaProperty(prototype, symbolStruct, true);
        definedMetaProperty(prototype, symbolStructMaxBaseTypeByteLength, 1);
        definedMetaProperty(prototype, symbolStructLength, 1);
        definedMetaProperty(prototype, symbolStructKeysMeta, map);
      })(TestA.prototype);
      class TestB {
        a: int8;
        b: TestA;
      }
      (function (prototype) {
        var map = new Map();
        map.set("a", { 0: 11, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0 });
        map.set("b", { 0: TestA, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 1, 8: 0 });
        definedMetaProperty(prototype, symbolStruct, true);
        definedMetaProperty(prototype, symbolStructMaxBaseTypeByteLength, 1);
        definedMetaProperty(prototype, symbolStructLength, 2);
        definedMetaProperty(prototype, symbolStructKeysMeta, map);
      })(TestB.prototype);
      let b = makeSharedPtr(TestB);
      let a = mapStruct(b.get() + 1, TestA);
      let c = make(TestA);
      CTypeEnumWrite[11](b.get() + 1, 6);
      memcpy(b.get() + 1, c[symbolStructAddress], 1);
    `
    check(source, target, {
      input
    })
  })

  test('sharedPtr property pointer', () => {
    const source = `
      @struct
      class TestA {
        a: int8
      }
      @struct
      class TestB {
        a: int8
        b: pointer<TestA>
      }
      let b = make_shared_ptr<TestB>()
      let a = b.b.a
      b.b.a = 8
    `
    const target = `
      ${symbolImport}
      ${definedMetaPropertyImport}
      ${makeSharedPtrImport}
      ${ctypeEnumReadImport}
      ${ctypeEnumWriteImport}
      class TestA {
        a: int8;
      }
      (function (prototype) {
        var map = new Map();
        map.set("a", { 0: 11, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0 });
        definedMetaProperty(prototype, symbolStruct, true);
        definedMetaProperty(prototype, symbolStructMaxBaseTypeByteLength, 1);
        definedMetaProperty(prototype, symbolStructLength, 1);
        definedMetaProperty(prototype, symbolStructKeysMeta, map);
      })(TestA.prototype);
      class TestB {
        a: int8;
        b: pointer<TestA>;
      }
      (function (prototype) {
        var map = new Map();
        map.set("a", { 0: 11, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0 });
        map.set("b", { 0: TestA, 1: 1, 2: 1, 3: 0, 4: 0, 5: 0, 6: 0, 7: 4, 8: 0 });
        definedMetaProperty(prototype, symbolStruct, true);
        definedMetaProperty(prototype, symbolStructMaxBaseTypeByteLength, 4);
        definedMetaProperty(prototype, symbolStructLength, 8);
        definedMetaProperty(prototype, symbolStructKeysMeta, map);
      })(TestB.prototype);
      let b = makeSharedPtr(TestB);
      let a = CTypeEnumRead[11](CTypeEnumRead[20](b.get() + 4));
      CTypeEnumWrite[11](CTypeEnumRead[20](b.get() + 4), 8);
    `
    check(source, target, {
      input
    })
  })

  test('sharedPtr property address', () => {
    const source = `
      @struct
      class TestA {
        a: int8
      }
      @struct
      class TestB {
        a: int8
        b: pointer<TestA>
      }
      let b = make_shared_ptr<TestB>()
      let a = addressof(b.b.a)
    `
    const target = `
      ${symbolImport}
      ${definedMetaPropertyImport}
      ${makeSharedPtrImport}
      ${ctypeEnumReadImport}
      class TestA {
        a: int8;
      }
      (function (prototype) {
        var map = new Map();
        map.set("a", { 0: 11, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0 });
        definedMetaProperty(prototype, symbolStruct, true);
        definedMetaProperty(prototype, symbolStructMaxBaseTypeByteLength, 1);
        definedMetaProperty(prototype, symbolStructLength, 1);
        definedMetaProperty(prototype, symbolStructKeysMeta, map);
      })(TestA.prototype);
      class TestB {
        a: int8;
        b: pointer<TestA>;
      }
      (function (prototype) {
        var map = new Map();
        map.set("a", { 0: 11, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0 });
        map.set("b", { 0: TestA, 1: 1, 2: 1, 3: 0, 4: 0, 5: 0, 6: 0, 7: 4, 8: 0 });
        definedMetaProperty(prototype, symbolStruct, true);
        definedMetaProperty(prototype, symbolStructMaxBaseTypeByteLength, 4);
        definedMetaProperty(prototype, symbolStructLength, 8);
        definedMetaProperty(prototype, symbolStructKeysMeta, map);
      })(TestB.prototype);
      let b = makeSharedPtr(TestB);
      let a = CTypeEnumRead[20](b.get() + 4);
    `
    check(source, target, {
      input
    })
  })

  test('sharedPtr[]', () => {
    const source = `
      @struct
      class TestA {
        a: int8
      }
      let b = make_shared_ptr<TestA>()
      let c = b[0]
    `
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()

    transform2AST(source, {
      input
    })

    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringMatching(/smart pointer not support \[\] operate\n?$/))
    consoleErrorSpy.mockRestore()
  })
})