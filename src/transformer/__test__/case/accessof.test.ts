import * as fs from 'fs'
import * as path from 'path'
import { check, distPath } from '../transformer'
import { ctypeEnumReadImport, definedMetaPropertyImport, symbolImport, mapStructImport } from './snippet'
import { CTypeEnum } from '../../../typedef'

describe('accessof', () => {

  let input: string
  let output: string

  beforeAll(() => {
    input = path.join(distPath, './accessof_input.ts')
    output = path.join(distPath, './accessof_output.ts')
  })

  afterAll(() => {
    fs.unlinkSync(input)
    fs.rmSync(output, { force: true })
  })

  const snippetClassTestABSource = `
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
    @struct
    class TestB {
      a: pointer<TestA>
      b: pointer<pointer<TestA>>
      c: TestA
    }
  `

  const snippetClassTestABTarget = `
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
    class TestB {
      a: pointer<TestA>;
      b: pointer<pointer<TestA>>;
      c: TestA;
    }
    (function (prototype) {
      var map = new Map();
      map.set("a", { 0: TestA, 1: 1, 2: 1, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0 });
      map.set("b", { 0: TestA, 1: 1, 2: 2, 3: 0, 4: 0, 5: 0, 6: 0, 7: 4, 8: 0 });
      map.set("c", { 0: TestA, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 8, 8: 0 });
      definedMetaProperty(prototype, symbolStruct, true);
      definedMetaProperty(prototype, symbolStructMaxBaseTypeByteLength, 4);
      definedMetaProperty(prototype, symbolStructLength, 76);
      definedMetaProperty(prototype, symbolStructKeysMeta, map);
    })(TestB.prototype);
  `

  test('accessof(pointer.pointer<char>)', () => {
    const source = `
      ${snippetClassTestABSource}
      let a: pointer<TestA>
      let b = accessof(a.a)
    `
    const target = `
      ${symbolImport}
      ${definedMetaPropertyImport}
      ${ctypeEnumReadImport}
      ${snippetClassTestABTarget}
      let a: pointer<TestA>
      let b = CTypeEnumRead[${CTypeEnum.char}](CTypeEnumRead[${CTypeEnum.pointer}](a))
    `
    check(source, target, {
      input
    })
  })

  test('accessof(pointer.pointer<uint8>)', () => {
    const source = `
      ${snippetClassTestABSource}
      let a: pointer<TestA>
      let b = accessof(a.b)
    `
    const target = `
      ${symbolImport}
      ${definedMetaPropertyImport}
      ${ctypeEnumReadImport}
      ${snippetClassTestABTarget}
      let a: pointer<TestA>
      let b = CTypeEnumRead[${CTypeEnum.uint8}](CTypeEnumRead[${CTypeEnum.pointer}](a + 4))
    `
    check(source, target, {
      input
    })
  })

  test('accessof(pointer.pointer<int8>)', () => {
    const source = `
      ${snippetClassTestABSource}
      let a: pointer<TestA>
      let b = accessof(a.c)
    `
    const target = `
      ${symbolImport}
      ${definedMetaPropertyImport}
      ${ctypeEnumReadImport}
      ${snippetClassTestABTarget}
      let a: pointer<TestA>
      let b = CTypeEnumRead[${CTypeEnum.int8}](CTypeEnumRead[${CTypeEnum.pointer}](a + 8))
    `
    check(source, target, {
      input
    })
  })

  test('accessof(pointer.pointer<atomic_char>)', () => {
    const source = `
      ${snippetClassTestABSource}
      let a: pointer<TestA>
      let b = accessof(a.d)
    `
    const target = `
      ${symbolImport}
      ${definedMetaPropertyImport}
      ${ctypeEnumReadImport}
      ${snippetClassTestABTarget}
      let a: pointer<TestA>
      let b = CTypeEnumRead[${CTypeEnum.atomic_char}](CTypeEnumRead[${CTypeEnum.pointer}](a + 12))
    `
    check(source, target, {
      input
    })
  })

  test('accessof(pointer.pointer<atomic_uint8>)', () => {
    const source = `
      ${snippetClassTestABSource}
      let a: pointer<TestA>
      let b = accessof(a.e)
    `
    const target = `
      ${symbolImport}
      ${definedMetaPropertyImport}
      ${ctypeEnumReadImport}
      ${snippetClassTestABTarget}
      let a: pointer<TestA>
      let b = CTypeEnumRead[${CTypeEnum.atomic_uint8}](CTypeEnumRead[${CTypeEnum.pointer}](a + 16))
    `
    check(source, target, {
      input
    })
  })

  test('accessof(pointer.pointer<atomic_int8>)', () => {
    const source = `
      ${snippetClassTestABSource}
      let a: pointer<TestA>
      let b = accessof(a.f)
    `
    const target = `
      ${symbolImport}
      ${definedMetaPropertyImport}
      ${ctypeEnumReadImport}
      ${snippetClassTestABTarget}
      let a: pointer<TestA>
      let b = CTypeEnumRead[${CTypeEnum.atomic_int8}](CTypeEnumRead[${CTypeEnum.pointer}](a + 20))
    `
    check(source, target, {
      input
    })
  })

  test('accessof(pointer.pointer<uint16>)', () => {
    const source = `
      ${snippetClassTestABSource}
      let a: pointer<TestA>
      let b = accessof(a.g)
    `
    const target = `
      ${symbolImport}
      ${definedMetaPropertyImport}
      ${ctypeEnumReadImport}
      ${snippetClassTestABTarget}
      let a: pointer<TestA>
      let b = CTypeEnumRead[${CTypeEnum.uint16}](CTypeEnumRead[${CTypeEnum.pointer}](a + 24))
    `
    check(source, target, {
      input
    })
  })

  test('accessof(pointer.pointer<int16>)', () => {
    const source = `
      ${snippetClassTestABSource}
      let a: pointer<TestA>
      let b = accessof(a.h)
    `
    const target = `
      ${symbolImport}
      ${definedMetaPropertyImport}
      ${ctypeEnumReadImport}
      ${snippetClassTestABTarget}
      let a: pointer<TestA>
      let b = CTypeEnumRead[${CTypeEnum.int16}](CTypeEnumRead[${CTypeEnum.pointer}](a + 28))
    `
    check(source, target, {
      input
    })
  })

  test('accessof(pointer.pointer<atomic_uint16>)', () => {
    const source = `
      ${snippetClassTestABSource}
      let a: pointer<TestA>
      let b = accessof(a.i)
    `
    const target = `
      ${symbolImport}
      ${definedMetaPropertyImport}
      ${ctypeEnumReadImport}
      ${snippetClassTestABTarget}
      let a: pointer<TestA>
      let b = CTypeEnumRead[${CTypeEnum.atomic_uint16}](CTypeEnumRead[${CTypeEnum.pointer}](a + 32))
    `
    check(source, target, {
      input
    })
  })

  test('accessof(pointer.pointer<atomic_int16>)', () => {
    const source = `
      ${snippetClassTestABSource}
      let a: pointer<TestA>
      let b = accessof(a.j)
    `
    const target = `
      ${symbolImport}
      ${definedMetaPropertyImport}
      ${ctypeEnumReadImport}
      ${snippetClassTestABTarget}
      let a: pointer<TestA>
      let b = CTypeEnumRead[${CTypeEnum.atomic_int16}](CTypeEnumRead[${CTypeEnum.pointer}](a + 36))
    `
    check(source, target, {
      input
    })
  })

  test('accessof(pointer.pointer<uint32>)', () => {
    const source = `
      ${snippetClassTestABSource}
      let a: pointer<TestA>
      let b = accessof(a.k)
    `
    const target = `
      ${symbolImport}
      ${definedMetaPropertyImport}
      ${ctypeEnumReadImport}
      ${snippetClassTestABTarget}
      let a: pointer<TestA>
      let b = CTypeEnumRead[${CTypeEnum.uint32}](CTypeEnumRead[${CTypeEnum.pointer}](a + 40))
    `
    check(source, target, {
      input
    })
  })

  test('accessof(pointer.pointer<int32>)', () => {
    const source = `
      ${snippetClassTestABSource}
      let a: pointer<TestA>
      let b = accessof(a.l)
    `
    const target = `
      ${symbolImport}
      ${definedMetaPropertyImport}
      ${ctypeEnumReadImport}
      ${snippetClassTestABTarget}
      let a: pointer<TestA>
      let b = CTypeEnumRead[${CTypeEnum.int32}](CTypeEnumRead[${CTypeEnum.pointer}](a + 44))
    `
    check(source, target, {
      input
    })
  })

  test('accessof(pointer.pointer<atomic_uint32>)', () => {
    const source = `
      ${snippetClassTestABSource}
      let a: pointer<TestA>
      let b = accessof(a.m)
    `
    const target = `
      ${symbolImport}
      ${definedMetaPropertyImport}
      ${ctypeEnumReadImport}
      ${snippetClassTestABTarget}
      let a: pointer<TestA>
      let b = CTypeEnumRead[${CTypeEnum.atomic_uint32}](CTypeEnumRead[${CTypeEnum.pointer}](a + 48))
    `
    check(source, target, {
      input
    })
  })

  test('accessof(pointer.pointer<atomic_int32>)', () => {
    const source = `
      ${snippetClassTestABSource}
      let a: pointer<TestA>
      let b = accessof(a.n)
    `
    const target = `
      ${symbolImport}
      ${definedMetaPropertyImport}
      ${ctypeEnumReadImport}
      ${snippetClassTestABTarget}
      let a: pointer<TestA>
      let b = CTypeEnumRead[${CTypeEnum.atomic_int32}](CTypeEnumRead[${CTypeEnum.pointer}](a + 52))
    `
    check(source, target, {
      input
    })
  })

  test('accessof(pointer.pointer<uint64>)', () => {
    const source = `
      ${snippetClassTestABSource}
      let a: pointer<TestA>
      let b = accessof(a.o)
    `
    const target = `
      ${symbolImport}
      ${definedMetaPropertyImport}
      ${ctypeEnumReadImport}
      ${snippetClassTestABTarget}
      let a: pointer<TestA>
      let b = CTypeEnumRead[${CTypeEnum.uint64}](CTypeEnumRead[${CTypeEnum.pointer}](a + 56))
    `
    check(source, target, {
      input
    })
  })

  test('accessof(pointer.pointer<int64>)', () => {
    const source = `
      ${snippetClassTestABSource}
      let a: pointer<TestA>
      let b = accessof(a.p)
    `
    const target = `
      ${symbolImport}
      ${definedMetaPropertyImport}
      ${ctypeEnumReadImport}
      ${snippetClassTestABTarget}
      let a: pointer<TestA>
      let b = CTypeEnumRead[${CTypeEnum.int64}](CTypeEnumRead[${CTypeEnum.pointer}](a + 60))
    `
    check(source, target, {
      input
    })
  })

  test('accessof(pointer.pointer<pointer>)', () => {
    const source = `
      ${snippetClassTestABSource}
      let a: pointer<TestA>
      let b = accessof(a.q)
    `
    const target = `
      ${symbolImport}
      ${definedMetaPropertyImport}
      ${ctypeEnumReadImport}
      ${snippetClassTestABTarget}
      let a: pointer<TestA>
      let b = CTypeEnumRead[${CTypeEnum.pointer}](CTypeEnumRead[${CTypeEnum.pointer}](a + 64))
    `
    check(source, target, {
      input
    })
  })

  test('accessof(pointer<struct>)', () => {
    const source = `
      ${snippetClassTestABSource}
      let a: pointer<TestA>
      let b = accessof(a)
    `
    const target = `
      ${symbolImport}
      ${definedMetaPropertyImport}
      ${mapStructImport}
      ${snippetClassTestABTarget}
      let a: pointer<TestA>
      let b = mapStruct(a, TestA)
    `
    check(source, target, {
      input
    })
  })

  test('accessof(pointer<pointer<uint8>>)', () => {
    const source = `
      let a: pointer<pointer<uint8>>
      let b = accessof(accessof(a))
    `
    const target = `
      ${ctypeEnumReadImport}
      let a: pointer<pointer<uint8>>
      let b = CTypeEnumRead[${CTypeEnum.uint8}](CTypeEnumRead[${CTypeEnum.pointer}](a));
    `
    check(source, target, {
      input
    })
  })

  test('accessof(pointer.struct.pointer<uint8>)', () => {
    const source = `
      ${snippetClassTestABSource}
      let a: pointer<TestB>
      let b = accessof(a.c.b)
    `
    const target = `
      ${symbolImport}
      ${definedMetaPropertyImport}
      ${ctypeEnumReadImport}
      ${snippetClassTestABTarget}
      let a: pointer<TestB>
      let b = CTypeEnumRead[${CTypeEnum.uint8}](CTypeEnumRead[${CTypeEnum.pointer}](a + ${8 + 4}));
    `

    check(source, target, {
      input
    })
  })

  test('accessof(accessof(accessof(a)))', () => {
    const source = `
      let a: pointer<pointer<pointer<uint8>>>
      let b = accessof(accessof(accessof(a)))
    `
    const target = `
      ${ctypeEnumReadImport}
      let a: pointer<pointer<pointer<uint8>>>
      let b = CTypeEnumRead[${CTypeEnum.uint8}](CTypeEnumRead[${CTypeEnum.pointer}](CTypeEnumRead[${CTypeEnum.pointer}](a)));
    `
    check(source, target, {
      input
    })
  })

  test('accessof(addressof(pointer.a))', () => {
    const source = `
      ${snippetClassTestABSource}
      let a: pointer<TestA>
      let b = accessof(addressof(a.a))
    `
    const target = `
      ${symbolImport}
      ${definedMetaPropertyImport}
      ${ctypeEnumReadImport}
      ${snippetClassTestABTarget}
      let a: pointer<TestA>
      let b = CTypeEnumRead[${CTypeEnum.pointer}](a)
    `
    check(source, target, {
      input
    })
  })
})