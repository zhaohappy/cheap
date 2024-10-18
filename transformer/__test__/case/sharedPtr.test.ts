import * as fs from 'fs'
import * as path from 'path'
import { check, distPath, transform2AST } from '../transformer'

describe('sharedPtr', () => {

  let input: string
  let output: string

  beforeAll(() => {
    input = path.join(distPath, './sharedPtr.ts')
    output = path.join(distPath, './sharedPtr_output.ts')
  })

  afterAll(() => {
    fs.unlinkSync(input)
    fs.unlinkSync(output)
  })

  test('sharedPtr property', () => {
    const source = `
      @struct
      class TestA {
        a: int8
      }
      let b = makeSharedPtr<TestA>()
      let a = b.a
    `
    const target = `
      import { symbolStruct as symbolStruct, symbolStructMaxBaseTypeByteLength as symbolStructMaxBaseTypeByteLength, symbolStructLength as symbolStructLength, symbolStructKeysMeta as symbolStructKeysMeta } from "cheap/symbol";
      import definedMetaProperty from "cheap/function/definedMetaProperty";
      import { makeSharedPtr as makeSharedPtr } from "cheap/std/smartPtr/SharedPtr";
      import { CTypeEnumRead as CTypeEnumRead } from "cheap/ctypeEnumRead";
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
      let b = makeSharedPtr<TestB>()
      let a = b.b
    `
    const target = `
      import { symbolStruct as symbolStruct, symbolStructMaxBaseTypeByteLength as symbolStructMaxBaseTypeByteLength, symbolStructLength as symbolStructLength, symbolStructKeysMeta as symbolStructKeysMeta } from "cheap/symbol";
      import definedMetaProperty from "cheap/function/definedMetaProperty";
      import { makeSharedPtr as makeSharedPtr } from "cheap/std/smartPtr/SharedPtr";
      import structAccess from "cheap/std/structAccess";
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
      let a = structAccess(b.get() + 1, TestA);
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
      let b = makeSharedPtr<TestB>()
      let a = b.b.a
    `
    const target = `
      import { symbolStruct as symbolStruct, symbolStructMaxBaseTypeByteLength as symbolStructMaxBaseTypeByteLength, symbolStructLength as symbolStructLength, symbolStructKeysMeta as symbolStructKeysMeta } from "cheap/symbol";
      import definedMetaProperty from "cheap/function/definedMetaProperty";
      import { makeSharedPtr as makeSharedPtr } from "cheap/std/smartPtr/SharedPtr";
      import { CTypeEnumRead as CTypeEnumRead } from "cheap/ctypeEnumRead";
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
      let b = makeSharedPtr<TestB>()
      let a = addressof(b.b.a)
    `
    const target = `
      import { symbolStruct as symbolStruct, symbolStructMaxBaseTypeByteLength as symbolStructMaxBaseTypeByteLength, symbolStructLength as symbolStructLength, symbolStructKeysMeta as symbolStructKeysMeta } from "cheap/symbol";
      import definedMetaProperty from "cheap/function/definedMetaProperty";
      import { makeSharedPtr as makeSharedPtr } from "cheap/std/smartPtr/SharedPtr";
      import { CTypeEnumRead as CTypeEnumRead } from "cheap/ctypeEnumRead";
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
      let b = makeSharedPtr<TestA>()
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