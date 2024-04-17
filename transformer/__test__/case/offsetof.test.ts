import * as fs from 'fs'
import * as path from 'path'
import { check, distPath } from '../transformer'

describe('addressof', () => {

  let input: string
  let output: string

  beforeAll(() => {
    input = path.join(distPath, './offsetof_input.ts')
    output = path.join(distPath, './offsetof_output.ts')
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

  test('offsetof(struct, a)', () => {
    const source = `
      ${snippetClassTestABSource}
      let b = offsetof(TestA, 'a')
      let c = offsetof(TestB, 'c')
    `
    const target = `
      import { symbolStruct as symbolStruct, symbolStructMaxBaseTypeByteLength as symbolStructMaxBaseTypeByteLength, symbolStructLength as symbolStructLength, symbolStructKeysMeta as symbolStructKeysMeta } from "cheap/symbol";
      import definedMetaProperty from "cheap/function/definedMetaProperty";
      ${snippetClassTestABTarget}
      let b = 0
      let c = 20
    `
    check(source, target, {
      input
    })
  })
 
})