import * as fs from 'fs'
import * as path from 'path'
import { check, distPath } from '../transformer'
import { CTypeEnum, CTypeEnum2Bytes } from '../../../typedef'
import { definedMetaPropertyImport, symbolImport, ctypeEnumReadImport } from './snippet'

describe('binary', () => {

  let input: string
  let output: string

  beforeAll(() => {
    input = path.join(distPath, './binary_input.ts')
    output = path.join(distPath, './binary_output.ts')
  })

  afterAll(() => {
    fs.unlinkSync(input)
    fs.unlinkSync(output)
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
      map.set("a", { 0: ${CTypeEnum.char}, 1: 1, 2: 1, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0 });
      map.set("b", { 0: ${CTypeEnum.uint8}, 1: 1, 2: 1, 3: 0, 4: 0, 5: 0, 6: 0, 7: 4, 8: 0 });
      map.set("c", { 0: ${CTypeEnum.int8}, 1: 1, 2: 1, 3: 0, 4: 0, 5: 0, 6: 0, 7: 8, 8: 0 });
      map.set("d", { 0: ${CTypeEnum.atomic_char}, 1: 1, 2: 1, 3: 0, 4: 0, 5: 0, 6: 0, 7: 12, 8: 0 });
      map.set("e", { 0: ${CTypeEnum.atomic_uint8}, 1: 1, 2: 1, 3: 0, 4: 0, 5: 0, 6: 0, 7: 16, 8: 0 });
      map.set("f", { 0: ${CTypeEnum.atomic_int8}, 1: 1, 2: 1, 3: 0, 4: 0, 5: 0, 6: 0, 7: 20, 8: 0 });
      map.set("g", { 0: ${CTypeEnum.uint16}, 1: 1, 2: 1, 3: 0, 4: 0, 5: 0, 6: 0, 7: 24, 8: 0 });
      map.set("h", { 0: ${CTypeEnum.int16}, 1: 1, 2: 1, 3: 0, 4: 0, 5: 0, 6: 0, 7: 28, 8: 0 });
      map.set("i", { 0: ${CTypeEnum.atomic_uint16}, 1: 1, 2: 1, 3: 0, 4: 0, 5: 0, 6: 0, 7: 32, 8: 0 });
      map.set("j", { 0: ${CTypeEnum.atomic_int16}, 1: 1, 2: 1, 3: 0, 4: 0, 5: 0, 6: 0, 7: 36, 8: 0 });
      map.set("k", { 0: ${CTypeEnum.uint32}, 1: 1, 2: 1, 3: 0, 4: 0, 5: 0, 6: 0, 7: 40, 8: 0 });
      map.set("l", { 0: ${CTypeEnum.int32}, 1: 1, 2: 1, 3: 0, 4: 0, 5: 0, 6: 0, 7: 44, 8: 0 });
      map.set("m", { 0: ${CTypeEnum.atomic_uint32}, 1: 1, 2: 1, 3: 0, 4: 0, 5: 0, 6: 0, 7: 48, 8: 0 });
      map.set("n", { 0: ${CTypeEnum.atomic_int32}, 1: 1, 2: 1, 3: 0, 4: 0, 5: 0, 6: 0, 7: 52, 8: 0 });
      map.set("o", { 0: ${CTypeEnum.uint64}, 1: 1, 2: 1, 3: 0, 4: 0, 5: 0, 6: 0, 7: 56, 8: 0 });
      map.set("p", { 0: ${CTypeEnum.int64}, 1: 1, 2: 1, 3: 0, 4: 0, 5: 0, 6: 0, 7: 60, 8: 0 });
      map.set("q", { 0: ${CTypeEnum.uint8}, 1: 1, 2: 2, 3: 0, 4: 0, 5: 0, 6: 0, 7: 64, 8: 0 });
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

  const snippetClassTestABTarget64 = `
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
      map.set("a", { 0: ${CTypeEnum.char}, 1: 1, 2: 1, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0 });
      map.set("b", { 0: ${CTypeEnum.uint8}, 1: 1, 2: 1, 3: 0, 4: 0, 5: 0, 6: 0, 7: 8, 8: 0 });
      map.set("c", { 0: ${CTypeEnum.int8}, 1: 1, 2: 1, 3: 0, 4: 0, 5: 0, 6: 0, 7: 16, 8: 0 });
      map.set("d", { 0: ${CTypeEnum.atomic_char}, 1: 1, 2: 1, 3: 0, 4: 0, 5: 0, 6: 0, 7: 24, 8: 0 });
      map.set("e", { 0: ${CTypeEnum.atomic_uint8}, 1: 1, 2: 1, 3: 0, 4: 0, 5: 0, 6: 0, 7: 32, 8: 0 });
      map.set("f", { 0: ${CTypeEnum.atomic_int8}, 1: 1, 2: 1, 3: 0, 4: 0, 5: 0, 6: 0, 7: 40, 8: 0 });
      map.set("g", { 0: ${CTypeEnum.uint16}, 1: 1, 2: 1, 3: 0, 4: 0, 5: 0, 6: 0, 7: 48, 8: 0 });
      map.set("h", { 0: ${CTypeEnum.int16}, 1: 1, 2: 1, 3: 0, 4: 0, 5: 0, 6: 0, 7: 56, 8: 0 });
      map.set("i", { 0: ${CTypeEnum.atomic_uint16}, 1: 1, 2: 1, 3: 0, 4: 0, 5: 0, 6: 0, 7: 64, 8: 0 });
      map.set("j", { 0: ${CTypeEnum.atomic_int16}, 1: 1, 2: 1, 3: 0, 4: 0, 5: 0, 6: 0, 7: 72, 8: 0 });
      map.set("k", { 0: ${CTypeEnum.uint32}, 1: 1, 2: 1, 3: 0, 4: 0, 5: 0, 6: 0, 7: 80, 8: 0 });
      map.set("l", { 0: ${CTypeEnum.int32}, 1: 1, 2: 1, 3: 0, 4: 0, 5: 0, 6: 0, 7: 88, 8: 0 });
      map.set("m", { 0: ${CTypeEnum.atomic_uint32}, 1: 1, 2: 1, 3: 0, 4: 0, 5: 0, 6: 0, 7: 96, 8: 0 });
      map.set("n", { 0: ${CTypeEnum.atomic_int32}, 1: 1, 2: 1, 3: 0, 4: 0, 5: 0, 6: 0, 7: 104, 8: 0 });
      map.set("o", { 0: ${CTypeEnum.uint64}, 1: 1, 2: 1, 3: 0, 4: 0, 5: 0, 6: 0, 7: 112, 8: 0 });
      map.set("p", { 0: ${CTypeEnum.int64}, 1: 1, 2: 1, 3: 0, 4: 0, 5: 0, 6: 0, 7: 120, 8: 0 });
      map.set("q", { 0: ${CTypeEnum.uint8}, 1: 1, 2: 2, 3: 0, 4: 0, 5: 0, 6: 0, 7: 128, 8: 0 });
      definedMetaProperty(prototype, symbolStruct, true);
      definedMetaProperty(prototype, symbolStructMaxBaseTypeByteLength, 8);
      definedMetaProperty(prototype, symbolStructLength, 136);
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
      map.set("b", { 0: TestA, 1: 1, 2: 2, 3: 0, 4: 0, 5: 0, 6: 0, 7: 8, 8: 0 });
      map.set("c", { 0: TestA, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 16, 8: 0 });
      definedMetaProperty(prototype, symbolStruct, true);
      definedMetaProperty(prototype, symbolStructMaxBaseTypeByteLength, 8);
      definedMetaProperty(prototype, symbolStructLength, 152);
      definedMetaProperty(prototype, symbolStructKeysMeta, map);
    })(TestB.prototype);
  `

  test('pointer<uint8> + number', () => {
    const source = `
      let a: pointer<uint8>
      let b = a + 6
    `
    const target = `
      let a: pointer<uint8>
      let b = a + 6
    `
    check(source, target, {
      input
    })
  })

  test('pointer<uint8> + number wasm64', () => {
    const source = `
      let a: pointer<uint8>
      let b = a + 6
    `
    const target = `
      let a: pointer<uint8>
      let b = a + 6n
    `
    check(source, target, {
      input,
      defined: {
        WASM_64: true
      }
    })
  })

  test('size + number', () => {
    const source = `
      let a: size
      let b = a + 6
    `
    const target = `
      let a: size
      let b = a + 6
    `
    check(source, target, {
      input
    })
  })

  test('size + number wasm64', () => {
    const source = `
      let a: size
      let b = a + 6
    `
    const target = `
      let a: size
      let b = a + 6n
    `
    check(source, target, {
      input,
      defined: {
        WASM_64: true
      }
    })
  })

  test('pointer<uint16> + number', () => {
    const source = `
      let a: pointer<uint16>
      let b = a + 4
    `
    const target = `
      let a: pointer<uint16>
      let b = a + ${4 * CTypeEnum2Bytes[CTypeEnum.uint16]}
    `
    check(source, target, {
      input
    })
  })

  test('pointer<struct> + number', () => {
    const source = `
      ${snippetClassTestABSource}
      let a: pointer<TestA>
      let b = a + 7
    `
    const target = `
      ${symbolImport}
      ${definedMetaPropertyImport}
      ${snippetClassTestABTarget}
      let a: pointer<TestA>
      let b = a + ${7 * 68}
    `
    check(source, target, {
      input
    })
  })

  test('pointer<struct> - number', () => {
    const source = `
      ${snippetClassTestABSource}
      let a: pointer<TestA>
      let b = a - 3
    `
    const target = `
      ${symbolImport}
      ${definedMetaPropertyImport}
      ${snippetClassTestABTarget}
      let a: pointer<TestA>
      let b = a - ${3 * 68}
    `
    check(source, target, {
      input
    })
  })

  test('pointer<uint8> - number', () => {
    const source = `
      let a: pointer<uint8>
      let b = a - 6
    `
    const target = `
      let a: pointer<uint8>
      let b = a - 6
    `
    check(source, target, {
      input
    })
  })

  test('pointer<uint16> - number', () => {
    const source = `
      let a: pointer<uint16>
      let b = a - 4
    `
    const target = `
      let a: pointer<uint16>
      let b = a - ${4 * CTypeEnum2Bytes[CTypeEnum.uint16]}
    `
    check(source, target, {
      input
    })
  })

  test('pointer<uint8> - pointer<uint8>', () => {
    const source = `
      let a: pointer<uint8>
      let b: pointer<uint8>
      let c = b - a
    `
    const target = `
      let a: pointer<uint8>
      let b: pointer<uint8>
      let c = b - a
    `
    check(source, target, {
      input
    })
  })

  test('pointer<uint32> - pointer<uint32>', () => {
    const source = `
      let a: pointer<uint32>
      let b: pointer<uint32>
      let c = b - a
    `
    const target = `
      let a: pointer<uint32>
      let b: pointer<uint32>
      let c = (b - a) >>> 2
    `
    check(source, target, {
      input
    })
  })

  test('pointer<uint16> - pointer<uint16>', () => {
    const source = `
      let a: pointer<uint16>
      let b: pointer<uint16>
      let c = b - a
    `
    const target = `
      let a: pointer<uint16>
      let b: pointer<uint16>
      let c = (b - a) >>> 1
    `
    check(source, target, {
      input
    })
  })

  test('pointer<uint64> - pointer<uint64>', () => {
    const source = `
      let a: pointer<uint64>
      let b: pointer<uint64>
      let c = b - a
    `
    const target = `
      let a: pointer<uint64>
      let b: pointer<uint64>
      let c = (b - a) >> 3
    `
    check(source, target, {
      input
    })
  })

  test('pointer<uint64> - pointer<uint64> wasm64', () => {
    const source = `
      let a: pointer<uint64>
      let b: pointer<uint64>
      let c = b - a
    `
    const target = `
      let a: pointer<uint64>
      let b: pointer<uint64>
      let c = Number((b - a) >> 3n)
    `
    check(source, target, {
      input,
      defined: {
        WASM_64: true
      }
    })
  })

  test('pointer<struct> - pointer<struct>', () => {
    const source = `
      ${snippetClassTestABSource}
      let a: pointer<TestA>
      let b: pointer<TestA>
      let c = b - a
    `
    const target = `
      ${symbolImport}
      ${definedMetaPropertyImport}
      ${snippetClassTestABTarget}
      let a: pointer<TestA>
      let b: pointer<TestA>
      let c = ((b - a) / 68)
    `
    check(source, target, {
      input
    })
  })

  test('pointer<struct> - pointer<struct> wasm64', () => {
    const source = `
      ${snippetClassTestABSource}
      let a: pointer<TestA>
      let b: pointer<TestA>
      let c = b - a
    `
    const target = `
      ${symbolImport}
      ${definedMetaPropertyImport}
      ${snippetClassTestABTarget64}
      let a: pointer<TestA>
      let b: pointer<TestA>
      let c = Number((b - a) / 136n);
    `
    check(source, target, {
      input,
      defined: {
        WASM_64: true
      }
    })
  })

  test('let a = 1 + 3', () => {
    const source = `
      let a = 1 + 3
    `
    const target = `
      let a = 4
    `
    check(source, target, {
      input
    })
  })

  test('let b = a + 0', () => {
    const source = `
      let a = 1
      let b = a + 0
    `
    const target = `
      let a = 1
      let b = a
    `
    check(source, target, {
      input
    })
  })

  test('let b = 0 + a', () => {
    const source = `
      let a = 1
      let b = 0 + a
    `
    const target = `
      let a = 1
      let b = a
    `
    check(source, target, {
      input
    })
  })

  test('let b = a - 0', () => {
    const source = `
      let a = 1
      let b = a - 0
    `
    const target = `
      let a = 1
      let b = a
    `
    check(source, target, {
      input
    })
  })

  test('let b = a * 1', () => {
    const source = `
      let a = 1
      let b = a * 1
    `
    const target = `
      let a = 1
      let b = a
    `
    check(source, target, {
      input
    })
  })

  test('let b = a * 0', () => {
    const source = `
      let a = 1
      let b = a * 0
    `
    const target = `
      let a = 1
      let b = 0
    `
    check(source, target, {
      input
    })
  })

  test('let b = 1 * a', () => {
    const source = `
      let a = 1
      let b = 1 * a
    `
    const target = `
      let a = 1
      let b = a
    `
    check(source, target, {
      input
    })
  })

  test('let b = 0 * a', () => {
    const source = `
      let a = 1
      let b = 0 * a
    `
    const target = `
      let a = 1
      let b = 0
    `
    check(source, target, {
      input
    })
  })

  test('let b = a / 1', () => {
    const source = `
      let a = 1
      let b = a / 1
    `
    const target = `
      let a = 1
      let b = a
    `
    check(source, target, {
      input
    })
  })

  test('let b = 0 / a', () => {
    const source = `
      let a = 1
      let b = 0 / a
    `
    const target = `
      let a = 1
      let b = 0
    `
    check(source, target, {
      input
    })
  })

  test('let b = x / y', () => {
    const source = `
      let a: array<pointer<uint8>, 8>
      for (let i = 0; i < sizeof(a) / sizeof(a[0]); i++) {

      }
    `
    const target = `
      let a: array<pointer<uint8>, 8>
      for (let i = 0; i < 8; i++) {
        
      }
    `
    check(source, target, {
      input
    })
  })

  test('let b = pointer + size wasm64', () => {
    const source = `
      let a: pointer<uint8>
      let b: size
      let c = a + b
    `
    const target = `
      let a: pointer<uint8>
      let b: size
      let c = a + b
    `
    check(source, target, {
      input,
      defined: {
        WASM_64: true
      }
    })
  })

  test('size > size - pointer wasm64', () => {
    const source = `
      let a: size
      if ((a & (a - reinterpret_cast<size>(1)))) {
      }
    `
    const target = `
      let a: size
      if ((a & (a - 1n))) {
      }
    `
    check(source, target, {
      input,
      defined: {
        WASM_64: true
      }
    })
  })

  test('size > size - pointer wasm64', () => {
    const source = `
      let totalSize: size
      const INT32_MAX: int32
      const sizes: pointer<size>
      if (totalSize > static_cast<size>(INT32_MAX) - sizes[i]) {
      }
    `
    const target = `
      ${ctypeEnumReadImport}
      let totalSize: size
      const INT32_MAX: int32
      const sizes: pointer<size>
      if (totalSize > BigInt(INT32_MAX >>> 0) - CTypeEnumRead[${CTypeEnum.size}](sizes + i)) {
      }
    `
    check(source, target, {
      input,
      defined: {
        WASM_64: true
      }
    })
  })

  test('pointer % number wasm64', () => {
    const source = `
      const sizes: pointer<size>
      let a = sizes % 2
    `
    const target = `
      const sizes: pointer<size>
      let a = sizes % 2n
    `
    check(source, target, {
      input,
      defined: {
        WASM_64: true
      }
    })
  })
})