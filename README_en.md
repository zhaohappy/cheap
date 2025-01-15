cheap
======
English | [中文](README.md)


![](https://img.shields.io/badge/language-typescript-blue.svg) ![](https://img.shields.io/badge/platform-web%20|%20node-lightgrey.svg) ![license](https://img.shields.io/github/license/zhaohappy/cheap) [![npm](https://img.shields.io/npm/v/@libmedia/cheap.svg?style=flat)](https://www.npmjs.com/package/@libmedia/cheap)


### Introduction

cheap is a tool library for develop multi-thread of JavaScript and high-performance of WebAssembly.

cheap can be use in browser environment and Node environment.

### Start

#### install


```bash
npm install @libmedia/cheap
```

#### setting tsconfig.json

```javascript
{
  "baseUrl": "./",
  "paths": {
    ...
    "@libmedia/cheap/*": ["node_modules/@libmedia/cheap/dist/esm/*"]
  },
  "files": [
    "node_modules/@libmedia/cheap/dist/esm/cheapdef.d.ts"
  ],
  "cheap": {
    //  can add macro definition here
    "defined": {

    }
  }
}
```

#### configure

cheap must be developed with TypeScript.

Development using TypeScript needs to configure the compilation and packaging tool. The core is to configure tsc using cheap's transformer.

##### webpack

```javascript
const path = require('path');
const transformer = require('@libmedia/cheap/build/transformer');
module.exports = (env) => {
  return {
    module: {
      rules: [
        {
          test: /\.ts?$/,
          use: [
            {
              loader: 'ts-loader',
              options: {
                ...
                getCustomTransformers: function(program) {
                  return {
                    before: [transformer.before(program)]
                  }
                },
                ...
              }
            }
          ]
        }
      ],
    }
  }
}
```

##### vite
```javascript

import { defineConfig } from 'vite';
import typescript from '@rollup/plugin-typescript';
import transformer from '@libmedia/cheap/build/transformer';

export default defineConfig({
  ...
  plugins: [
    typescript({
      ...
      transformers: {
        before: [
          {
            type: 'program',
            factory: (program) => {
              return transformer.before(program)
            }
          }
        ]
      },
      ...
    })
  ],
});
```

##### rollup

```javascript

import typescript from '@rollup/plugin-typescript';
import transformer from '@libmedia/cheap/build/transformer'

export default {
  ...
  plugins: [
    typescript({
      ...
      transformers: {
        before: [
          {
            type: 'program',
            factory: (program) => {
              return transformer.before(program)
            }
          }
        ]
      },
      ...
    }),
  ]
};

```

#### webpack plugin

Cheap currently has a webpack plugin. If your use webpack, it is recommended that you use it. The usage is as follows:

```javascript
const path = require('path');
const CheapPlugin = require('@libmedia/cheap/build/webpack/CheapPlugin');
module.exports = (env) => {
  return {
    ...
    rules: [
      {
        test: /\.ts?$/,
        use: [
          {
            loader: 'ts-loader'
          }
        ]
      }
    ],
    plugins: [
      new CheapPlugin({
        // 'browser' | 'node'
        env: 'browser',
        // project root directory, here means webpack.config.js is under the project root directory
        projectPath: __dirname,
        // can add macro definition here
        defined: {

        }
      })
    ]
  }
}
```

#### Node compile

Developing Node projects often only need to be compiled without packaging, so in general, there is no need to use webpack or vite to pack all files; only tsc compile tools are used, but the official tsc command cannot use transformer. At this time, you need to write code to do compile.

```javascript

const fs = require('fs')
const path = require('path')
const ts = require('typescript')
const transformer = require('@libmedia/cheap/build/transformer')

// Read tsconfig.json configuration and change the path to your own tsconfig.json
const configPath = path.resolve(__dirname, './tsconfig.json')
const configText = fs.readFileSync(configPath, 'utf8')
const { config } = ts.parseConfigFileTextToJson(configPath, configText)
const parsedCommandLine = ts.parseJsonConfigFileContent(
  config,
  ts.sys,
  path.dirname(configPath)
)
const program = ts.createProgram(parsedCommandLine.fileNames, parsedCommandLine.options)
const emitResult = program.emit(undefined, undefined, undefined, undefined, {
  before: [
    transformer.before(program)
  ]
})
const allDiagnostics = ts
  .getPreEmitDiagnostics(program)
  .concat(emitResult.diagnostics)

allDiagnostics.forEach((diagnostic) => {
  if (diagnostic.file) {
    const { line, character } =
      diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
    const message = ts.flattenDiagnosticMessageText(
      diagnostic.messageText,
      '\n'
    );
    console.log(
      `${diagnostic.file.fileName} (${line + 1},${character + 1}): ${message}`
    );
  } else {
    console.log(
      ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n')
    );
  }
})
```

### Principle


cheap thinks about the design from the perspective of how to better transfer data (especially complex data structures) between js and wasm. We know that the current wasm and js can only transfer number type data to each other. The complex data structures often require serialize and deserialize, which greatly affects the performance of the program. It can be an important reason why wasm has not become popular yet on the web platform.

In order to solve this problem, cheap introduced the concept of ```struct``` into typescript. The concept of ```struct``` is consistent with the concept of ```struct``` in C. It represents the layout of a data structure in a memory. In this way, the memory can be operated according to the layout in wasm and js respectively, and data can be transferred between the two parties with the starting position of the memory, that is pointer, thus avoiding the overhead to serialize and deserialize for data.

With ```struct```, we can not only transfer data efficiently between wasm and js, but also think that multi-thread programming in js currently faces the problem of being unable to share data. If our ```struct``` is in SharedArrayBuffer, let all workers use the same SharedArrayBuffer instance can enable all workers to share data, and different workers can efficiently transfer data by passing pointers.

The overall idea is summarized as follows:

1. Implement a global memory allocator named Allocator, which can allocate memory of a given size and return the starting address, and can reclaim the allocated memory. This global memory is in ```WebAssembly.Memory``` and is called ```Heap```.
2. All wasm modules are compiled using the dynamic link library mode. When wasm allocating internal memory, use the Allocator implemented in (1) to allocate. The data segment of wasm also needs to be dynamically imported after being allocated through the Allocator in (1). The emscripten tool has a configuration to enable this compilation.
3. Use the typescript transformer api to write a plugin to compile pointer accesses into function calls during compilation in typescript code.
4. When creating a worker, pass the global Heap of the current thread to the created worker, and initialize the relevant configuration (the ```Heap``` in this case must be on the SharedArrayBuffer) to obtain a multi-thread data sharing environment. This requires Allocator to be thread-safe. The allocation of memory by each thread is responsible for the Allocator of the respective thread. They all allocate on the same memory.

In this way, all the memory of wasm is in the ```Heap```, and the memory allocate by each js worker is in the ```Heap```, so that data sharing can be realized everywhere. It is shared between wasm and wasm, and between worker and worker. also between javascript and wasm.

### API

#### Struct

In order to define the memory layout, cheap has added the following basic data types

| Type | Describe |
|----------|----------|
| bool | true or false
| char | 8-bit unsigned number, labeled string pointer in C
| uint8 | 8-bit unsigned integer
| int8  | 8-bit signed integer
| uint16| 16-bit unsigned integer
| int16 | 16-bit signed integer
| uint32| 32-bit unsigned integer
| int32 | 32-bit signed integer
| uint64| 64-bit unsigned integer
| int64 | 64-bit signed integer
| float | 32-bit floating-point number
| double、float64| 64-bit floating-point number
| pointer\<T>| pointer


##### Struct Definition

The memory layout rules of cheap's struct are completely consistent with C, so cheap can interoperate with C. Other languages generally have structure definition mode that interoperate with C. If it can interoperate with C, it can interoperate with cheap.

```typescript
// Use the struct decorator to mark a struct definition
@struct
class MyStruct {
  a: int8
  b: uint32
  // pointer to type uint8
  c: pointer<uint8>
  // Array of type int32, size 8
  d: array<int32, 8>
  // A two-dimensional array of type int32
  e: array<array<int32, 8>, 8>
  // Bit field, occupies 5 bits, the type will affect the subsequent attribute layout
  f: bit<int32, 5>
  // inline struct
  g: struct<{
    a: uint8
  }>
  // inline union
  h: union<{
    a: uint8
    b: uint32
  }>
  // This is not a built-in type and will be ignored during layout.
  // When you use struct instance access it, you access js object properties
  // Using pointer access it will cause a compile error
  // This operation is generally not recommended. One possible usage scenario is to operate the same structure in different threads.
  // This attribute can be used as a private attribute of the thread to read and write its own exclusive data, not shared with other threads
  i: number

  // You can use decorator to decorate properties
  // This means that this attribute will be ignored when the macro ENABLE_XX is turned off
  // can use conditional compilation in struct
  @ignore(!defined(ENABLE_XX))
  j: int16
}

@struct
class MyStructB {
  // type is another struct
  a: MyStruct
  // pointer to another struct
  b: pointer<MyStruct>
  // A two-dimensional pointer to another struct
  b: pointer<pointer<MyStruct>>
}

// struct can be inherited
@struct
class MyStructC extends MyStructB {
  d: float
}

// Use the union decorator to mark a union definition. All attributes of the union share a memory whose size is the size of the largest attribute member.
@union
class MyUnion {
  a: uint8
  b: uint32
}
```

##### Struct Use


```typescript

@struct
class MyStruct {
  a: int8
  b: uint32
}

// Create a struct instance, the second parameter can pass initialization data
// The return of make is a js object use proxy
// The getter and setter logic used every time when reading and writing properties
const myStruct = make<MyStruct>({ a: 0, b: 0 })
myStruct.a = 3
myStruct.b = 4
console.log(myStruct.b)

// destroy struct instance
unmake(myStruct)

// Create a struct pointer (recommended, most efficient)
let myStructPointer: pointer<MyStruct> = malloc(sizeof(MyStruct))
// pointer can be assigned values through properties
myStructPointer.a = 0
myStructPointer.b = 1
// pointer can got value of properties
console.log(myStructPointer.b)

// the type of pa pointer<int8>
// equal to 'int8* pa = &myStructPointer->a' in C
const pa = addressof(myStructPointer.a)
// equal to 'int8 va = *pa' in C
const va = accessof(pa)

// pointer can be used as array
// equal to 'accessof(pa + 3)'
const aa = pa[3]

// equal to '*va = (int8)34' in C
// since function calls in js cannot be Lvalue, a '<-' syntax is added
// But there is a small flaw. If the types on both sides are structures, an error will be reported. You need to use @ts-ignore to ignore it.
// or use 'pa[0] = static_cast<int8>(34)' it will not report an error
accessof(pa) <- static_cast<int8>(34)

// pointer can be incremented and decremented, and can be added to numbers. Two pointers of the same type can be subtracted. The rules are the same as C.
// + 1 means that the pointer is offset by the size of the pointer type bytes, not 1 byte
// pointer<uint8>++ offset 1 byte
// pointer<uint64>++ offset 8 bytes
pa++
pa--
pa += 8

// delete struct memory
free(myStructPointer)
// 'nullptr' is null pointer definition
myStructPointer = nullptr


```

#### Built-in Functions (global scope)


```typescript
/**
 * Create a struct instance
 */
function make<T extends {}>(): T
function make<T extends {}>(init: Partial<SetOmitFunctions<T>>): T

/**
 * Destroy a struct instance
 * 
 * @param target 
 */
function unmake<T extends Object>(target: T): void

/**
 * Create SharedPtr Smart Pointer
 */
function make_shared_ptr<T extends BuiltinType>(): SharedPtr<T>
function make_shared_ptr<T extends BuiltinType>(deleter: deleter<T>): SharedPtr<T>
function make_shared_ptr<T extends BuiltinType>(value: T): SharedPtr<T>
function make_shared_ptr<T extends BuiltinType>(value: pointer<T>): SharedPtr<T>
function make_shared_ptr<T extends BuiltinType>(value: T, deleter: deleter<T>): SharedPtr<T>
function make_shared_ptr<T extends BuiltinType>(value: pointer<T>, deleter: deleter<T>): SharedPtr<T>
function make_shared_ptr<T extends {}>(): SharedPtr<T>
function make_shared_ptr<T extends {}>(deleter: deleter<T>): SharedPtr<T>
function make_shared_ptr<T extends {}>(init: Partial<SetOmitFunctions<T>>): SharedPtr<T>
function make_shared_ptr<T extends {}>(init: pointer<T>): SharedPtr<T>
function make_shared_ptr<T extends {}>(init: T): SharedPtr<T>
function make_shared_ptr<T extends {}>(init: pointer<T>, deleter: deleter<T>): SharedPtr<T>
function make_shared_ptr<T extends {}>(init: T, deleter: deleter<T>): SharedPtr<T>
function make_shared_ptr<T extends {}>(init: Partial<SetOmitFunctions<T>>, deleter: deleter<T>): SharedPtr<T>

 /**
 * Allocate memory of size bytes
 * Assigned addresses are 8-byte aligned
 * 
 * @param size 
 */
function malloc(size: size): pointer<void>

/**
 * Allocates a specified amount of memory and initializes it to zero
 * 
 * @param num The number of elements to allocate
 * @param size Size of each element in bytes
 */
function calloc(num: size, size: size): pointer<void>

/**
 * Resize allocated memory blocks
 * 
 * @param address Pointer of allocated memory before
 * @param size The new size of the adjusted memory block in bytes
 */
function realloc(address: pointer<void>, size: size): pointer<void>

/**
 * Allocate an aligned memory block on the heap
 * 
 * @param alignment Memory alignment requirements, must be pow(2, x)
 * @param size Size of allocated memory block in bytes
 */
function aligned_alloc(alignment: size, size: size): pointer<void>

/**
 * delete memory by pointer
 * 
 * @param address 
 */
function free(address: pointer<void>): void

/**
 * & Get address
 * Note that you can only fetch the memory address on cheap, but cannot fetch the address on the js stack or heap.
 */
function addressof<T>(type: T): T extends any[] ? pointer<UnwrapArray<T>> : pointer<T>

/**
 * * access pointer
 */
function accessof<T extends (IsBuiltinType<T> extends true ? never : anyptr)>(pointer: T): UnwrapPointer<T>

/**
 * Returns the size occupied by type
 */
function sizeof(type: any): size

/**
 * - Convert between arbitrary pointers
 * - Converting between uint32 and pointer
 * - Converting between any builtin basic types only does compile-time type conversion, which may be unsafe at runtime (you need to ensure safety yourself)
 *   - int8 -> int32 safe, int64 -> int32 unsafe
 *   - uint8 -> int16 safe, uint8 -> int8 unsafe
 */
function reinterpret_cast<T extends (anyptr | BuiltinType)>(target: anyptr | BuiltinType): T

/**
 * Convert between basic types, excluding pointers (type safety)
 * The compiler will do some processing
 * uin8 -> int8 => (a & 0x80) ? -(0x100 - a) : a
 * int8 -> uint8 => a >>> 0
 * uint32 -> int8 => ((a & 0xff) & 0x80) ? -(0x100 - (a & 0xff)) : (a & 0xff)
 * int16 -> uint64 =>  BigInt(a >>> 0)
 * uint64 -> int32 => Number(a & 0xffffffffn) >> 0
 * uint64 -> int16 => (Number(a & 0xffffn) & 0x80000) ? -(0x10000 - Number(a & 0xffffn)) : Number(a & 0xffffn)
 * double -> int64 => BigInt(Math.floor(a))
 * float -> int32 => Math.floor(a)
 */
function static_cast<T extends BuiltinType>(target: BuiltinType): T

/**
 * assert
 * in debug mode will pause here if assert failed when opening the browser's console.
 * in release mode, assert will be delete in code
 * 
 * @param condition
 * @param msg Error message printed when assert failed
 */
function assert(condition: any, msg?: string): void

/**
 * use the macro definition, it will be replaced by the value defined by the macro.
 * 
 * @param def 
 */
function defined<T>(def: T): T

```

#### WebAssembly Modules

Our purpose of using WebAssembly is first to reuse a large number of existing basic libraries written in C/C++, and secondly to improve the performance brought by WebAssembly.

The current WebAssembly development model is developed using other languages, and then compiled into wasm bytecode through compilation tools. The required js glue layer code is also completed by compilation tools. This gives me the feeling that WebAssembly technology was originally used for the Web, but it has a sense of separation from JavaScript, the protagonist of the Web. I think JavaScript should dominate the entire program on the Web platform, so that we have both JavaScript (fast development, a large number of libraries in the community), and can introduce some of the advantages of other languages ​​to the Web; instead of letting people who write other languages ​​lead the entire process and let JavaScript become a glue layer for those codes that look ugly and obscure runtime code. JavaScript is the core of the entire Web technology. Abandoning it will only introduce the shortcomings of other languages ​​to the Web, and will not become the possibility of 1 + 1 > 2.

So in cheap we only need the compiled wasm bytecode, no glue layer code is needed, and cheap provides some basic runtime. This runtime has memory allocation, standard output(used to print logs), atomic, pthread, and semaphore. The summary is that the wasm module should only be responsible for the calculation part, and JavaScript should be responsible for the input and output of IO and business logic code. Because most of our wasm modules are compiled from C/C++, it's synchronous blocking IO method is inherently different from the Web's asynchronous method. All IO is put inside wasm and JavaScript is used to simulate a set of synchronous blocking runtime, would be the fatal flaw of this system. Of course, you can also use compilation tools to make wasm internally support calling JavaScript asynchronous functions, but this will either increase the size of the compiled product wasm and reduce performance; or the scenarios that can be used are greatly limited. As far as I know, emscripten supports C/C++ calling JavaScript asynchronous functions, but the premise is that there can be no indirect calls in the entire call chain.

To use the wasm module on cheap, you need to compile your wasm into dynamic linking mode. Here is an example.

```shell
emcc -O3 xx.c 
  -s WASM=1 \
  -s FILESYSTEM=0 \
  -s FETCH=0 \
  -s ASSERTIONS=0 \
  -s ALLOW_MEMORY_GROWTH=1 \
  -s IMPORTED_MEMORY=1 \
  -s INITIAL_MEMORY=17367040 \
  -s USE_PTHREADS=0 \
  -s MAIN_MODULE=2 \
  -s SIDE_MODULE=0 \
  -s MALLOC="none" \
  -s ERROR_ON_UNDEFINED_SYMBOLS=0 \
  -o xx.wasm
```

After getting the wasm output, you can use it under cheap

```javascript

import compile from '@libmedia/cheap/webassembly/compiler'
import WebAssemblyRunner from '@libmedia/cheap/webassembly/WebAssemblyRunner'

// The resource can be stored in indexDB and taken out directly for use next time without having to perform network requests and compilation.
const resource = await compile(
  {
    source: 'https://xxxx.wasm'
  }
)

const runner = new WebAssemblyRunner(resource)
await runner.run()

// Then you can call the function exported by wasm
runner.call('func_a', 0)


```


#### Threads

cheap supports multi-thread operations and makes multi-threaded development more elegant and simple.

##### thread create and termination

Thread creation and termination functions are defined in cheap/thread/thread.ts

```typescript

/**
 * Create a thread from a class and return the thread handle, so that the class member function in the thread can be called asynchronously through the handle
 * This class will be instantiated when the thread is created
 * There is currently a requirement here that the definition of the class and the call to create the thread class cannot be in the same file (this class may become an anonymous class after code compression)
 */
function createThreadFromClass<T, U extends any[]>(entity: new (...args: U) => T, options?: ThreadOptions): {
  run: (...args: U) => Promise<Thread<T>>
  transfer: (transfer: Transferable[]) => {
    run: (...args: U) => Promise<Thread<T>>
  }
}

/**
 * Create a thread from a function
 * This function will be run immediately after the thread is created, and the thread will exit when the function returns.
 * Consistent with C thread creation
 */
function createThreadFromFunction<T extends any[]>(entity: (...args: T) => void, options?: ThreadOptions): {
  run: (...args: T) => Promise<Thread<{}>>
  transfer: (transfer: Transferable[]) => {
    run: (...args: T) => Promise<Thread<{}>>
  }
}

/**
 * Create a thread from a module and return the thread handle, so that methods within the module can be called asynchronously through the handle
 */
function createThreadFromModule<T extends Object>(entity: T, options?: ThreadOptions): {
  run: () => Promise<Thread<T>>
}

/**
 * Force to terminate the thread
 * May cause memory leak, please use joinThread
 * 
 */
function closeThread(thread: Thread<{}>): void

/**
 * Wait for the thread to exit
 * The thread created from the function will wait for the function to return and return the return result of the function
 * Threads created from classes and modules will exit in the next event loop within the thread
 */
async function joinThread<T>(thread: Thread<{}>): Promise<T>

```

##### Thread Synchronization

cheap supports thread synchronization methods such as atomic operations, locks, condition variables, and semaphores.

###### Atomic Operations

Add Atomic Types

| Type | description |
|----------|----------|
| atomic_bool | true or false
| atomic_uint8 | 8-bit unsigned integer
| atomic_int8  | 8-bit signed integer
| atomic_uint16| 16-bit unsigned integer
| atomic_int16 | 16-bit signed integer
| atomic_uint32| 32-bit unsigned integer
| atomic_int32 | 32-bit signed integer
| atomic_uint64| 64-bit unsigned integer
| atomic_int64 | 64-bit signed integer

Atomic operation functions are defined in ```cheap/thread/atomic.ts```

```typescript

/**
 * Add the given value to the specified position
 *
 * Return the old value of this position
 *
 */
function add<T extends atomictype>(address: pointer<T>, value: AtomicType2Type<T>): AtomicType2Type<T>

/**
 * Subtract the given value from the value at the specified position
 *
 * Return the old value of this position
 *
 */
function sub<T extends atomictype>(address: pointer<T>, value: AtomicType2Type<T>): AtomicType2Type<T>

/**
 * AND operation between the given value and the value at the specified position
 *
 * Return the old value of this position
 *
 */
function and<T extends atomictype(address: pointer<T>, value: AtomicType2Type<T>): AtomicType2Type<T>

/**
 * OR the given value with the value at the specified position
 *
 * Return the old value of this position
 *
 */
function or<T extends atomictype(address: pointer<T>, value: AtomicType2Type<T>): AtomicType2Type<T>

/**
 * XOR operation between the given value and the value at the specified position
 *
 * Return the old value of this position
 *
 */
function xor<T extends atomictype(address: pointer<T>, value: AtomicType2Type<T>): AtomicType2Type<T>

/**
 * The given value exists at the given position
 *
 * Return the old value of this position
 *
 */
function store<T extends atomictype(address: pointer<T>, value: AtomicType2Type<T>): AtomicType2Type<T>

/**
 * Read the value at the given position
 *
 * Return the old value of this position
 *
 */
function load<T extends atomictype>(address: pointer<T>): AtomicType2Type<T>

/**
 * If the element at the specified position is equal to the given value, update it to the new value and return the original value of the element
 *
 * Return the old value of this position
 *
 */
function compareExchange<T extends atomictype>(
  address: pointer<T>,
  expectedValue: AtomicType2Type<T>,
  replacementValue: AtomicType2Type<T>
): AtomicType2Type<T>

/**
 * Update the element at the specified position to the given value and return the value before the element was updated.
 *
 * Return the old value of this position
 *
 */
function exchange<T extends atomictype>(address: pointer<T>, value: AtomicType2Type<T>): AtomicType2Type<T>

/**
 * Wake up the thread waiting on the element at the specified position in the waiting queue. The return value is the number of successfully awakened threads.
 *
 * Returns the number of awakened agents. 0 will not wake up any threads.
 *
 */
function notify(address: pointer<atomic_int32>, count: uint32): uint32

/**
 * Check whether the value at the specified position is still the given value, if so, keep suspending until awakened
 *
 * 0 "ok", 1 "not-equal"
 *
 */
function wait(address: pointer<atomic_int32>, value: int32): 0 | 1 | 2

/**
 * Check whether the value at the specified position is still the given value, if so, it will remain suspended until it is woken up or times out (milliseconds)
 *
 * 0 "ok", 1 "not-equal" or 2 "time-out"
 *
 */
function waitTimeout(address: pointer<atomic_int32>, value: int32, timeout: int32): 0 | 1 | 2

/**
 * Check whether the value at the specified position is still the given value, if so, keep suspending until awakened
 * Asynchronous and non-blocking, suitable for use on the main thread
 *
 * 0 "ok", 1 "not-equal"
 *
 */
function waitAsync(address: pointer<atomic_int32>, value: int32): Promise<0 | 1 | 2>

/**
 * Check whether the value at the specified position is still the given value, if so, it will remain suspended until it is awakened or times out.
 * Asynchronous and non-blocking, suitable for use on the main thread
 *
 * 0 "ok", 1 "not-equal" or 2 "time-out"
 *
 */
function waitTimeoutAsync(address: pointer<atomic_int32>, value: int32, timeout: int32): Promise<0 | 1 | 2>

```

###### Mutex, Condition Variables, Semaphore

Mutex is defined in ```cheap/thread/mutex.ts```

```typescript

/**
 * init Mutex
 * 
 * @param mutex 
 */
function init(mutex: pointer<Mutex>): int32

/**
 * lock Mutex
 * 
 * @param mutex 
 * @param spin
 */
function lock(mutex: pointer<Mutex>, spin: boolean = false): int32
async function lockAsync(mutex: pointer<Mutex>): Promise<int32>

/**
 * unlock Mutex
 * 
 * @param mutex 
 */
function unlock(mutex: pointer<Mutex>): int32

/**
 * destroy Mutex
 * 
 * @param mutex 
 * @returns 
 */
function destroy(mutex: pointer<Mutex>): int32

```

Condition variables are defined in ```cheap/thread/cond.ts```

```typescript
/**
 * init Cond
 */
function init(cond: pointer<Cond>, attr: pointer<void>): int32

/**
 * destroy Cond
 */
function destroy(cond: pointer<Cond>): int32

/**
 * Wake up a waiting thread on a condition variable
 * 
 * @param cond 
 */
function signal(cond: pointer<Cond>): int32

/**
 * Wake up all waiting threads on the condition variable
 * 
 * @param cond 
 */
function broadcast(cond: pointer<Cond>): int32 

/**
 * The thread waits at the condition variable
 * 
 * @param cond 
 * @param mutex 
 * @returns 
 */
function wait(cond: pointer<Cond>, mutex: pointer<Mutex>): int32 
async function waitAsync(cond: pointer<Cond>, mutex: pointer<Mutex>): Promise<int32>

/**
 * The thread times out waiting at the condition variable
 * 
 * @param cond 
 * @param mutex 
 * @param timeout mill second
 */
function timedWait(cond: pointer<Cond>, mutex: pointer<Mutex>, timeout: int32): int32
async function timedwaitAsync(cond: pointer<Cond>, mutex: pointer<Mutex>, timeout: int32): Promise<int32>
```

The semaphore is defined in ```cheap/thread/semaphore.ts```


```typescript

/**
 * init Sem
 * 
 * @param sem 
 * @param value
 */
function init(sem: pointer<Sem>, value: uint32): int32

/**
 * produce Sem
 * 
 * @param sem 
 */
function post(sem: pointer<Sem>): int32

/**
 * consume Sem
 * 
 * @param sem 
 */
function wait(sem: pointer<Sem>): int32 

/**
 * consume Sem, but not suspend thread
 * 
 * @param sem 
 */
function tryWait(sem: pointer<Sem>): int32

/**
 * consume Sem with timeout
 * 
 * @param sem 
 * @param timeout mill second
 */
function timedWait(sem: pointer<Sem>, timeout: int32): int32

/**
 * consume Sem (async)
 * 
 * @param sem 
 */
async function waitAsync(sem: pointer<Sem>): Promise<int32>

/**
 * consume Sem with timeout (async)
 * 
 * @param sem 
 * @param timeout mill second
 */
async function timedWaitAsync(sem: pointer<Sem>, timeout: int32): Promise<int32>

```


##### Thread in WebAssembly

Use ```wasmatomic.h``` below ```cheap/include``` in C/C++ to do atomic operations,
Use ```wasmpthread.h``` to do thread, lock, and condition variable related operations, use ```wasmsemaphore.h``` to do semaphore related operations, and then recompile the wasm module and use it in cheap to use wasm multi-threading.

#### Smart Pointer

Smart Pointer are used to automatically manage the life cycle of memory without manual release, reducing the risk of memory leaks. Currently, only ```SharedPtr``` is implemented.

The implementation mechanism of Smart Pointers relies on the [FinalizationRegistry](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/FinalizationRegistry) API and cannot be polyfilled, so make sure your execution environment meets the requirements.

The following table shows the compatibility of Smart Pointer:

| Environment    | Version      |
| -----------    | -----------  |
| Chrome         | 84+          |
| Firefox        | 79+          |
| Safari         | 14.1+        |
| Safari iOS     | 14.5+        |
| Node.js        | 14.6.0+      |
| Deno           | 1.0+         |

> A Smart Pointer is a js object that is passed by reference.

##### SharedPtr

SharedPtr is a sharable Smart Pointer that can be referenced in multiple places. The usage is as follows:

```typescript

@struct
class MyStruct {
  a: int8
}

// Constructor with no parameter 
const p0 = make_shared_ptr<MyStruct>()
const p1 = make_shared_ptr<int32>()
// Constructor with initialized data
const p2 = make_shared_ptr<MyStruct>({a: 0})
const p3 = make_shared_ptr<int32>(43)

function freeMyStruct(p: pointer<MyStruct>) {
  free(p)
}
// Constructor with a custom destructor
// If the destructor is not pass, the default destructor will only free the structure's own memory
const p4 = make_shared_ptr<MyStruct>(freeMyStruct)

// Constructor with initialized data and custom destructor
const p5 = make_shared_ptr<MyStruct>({a: 0}, freeMyStruct)

// Access the properties's value of the raw pointer
console.log(p5.a)
// Get the properties's address of the raw pointer
console.log(addressof(p5.a))

```

SharedPtr has the following methods:

```typescript

interface SharedPtr<T> {
  /**
   * Get the raw pointer
   */
  get(): pointer<T>
  /**
   * Reset the raw pointer
   */
  reset(value?: pointer<T>): void
  /**
   * Returns whether the current raw pointer has only one reference
   */
  unique(): boolean
  /**
   * Returns the reference count of the raw pointer
   */
  useCount(): int32
  /**
   * Returns whether has raw pointer
   */
  has(): boolean
  /**
   * Convert smart pointer to transferable object
   */
  transferable(): SharedPtrTransferable<T>
  /**
   * Clone a smart pointer (increase reference count)
   */
  clone(): SharedPtr<T>
}

```

##### Passing Smart Pointer between thread

```typescript
import { deTransferableSharedPtr } from '@libmedia/cheap/std/smartPtr/SharedPtr'
import { createThreadFromFunction } from '@libmedia/cheap/thread/thread'

@struct
class MyStruct {
  a: int8
}

function worker(t: SharedPtrTransferable<MyStruct>) {
  const p = deTransferableSharedPtr(t)
  console.log(p.a)
}

const p = make_shared_ptr<MyStruct>()
const transfer = p.transferable()
const thread = await createThreadFromFunction(worker).transfer(transfer.buffer).run(transfer)

```

### Suggestion

- The design should use struct as little as possible as a data structure. Use struct only when it needs to be transferred between multiple threads or between js and wasm. js objects should be used at other times. Otherwise, problems such as memory leaks, dirty memory writes, and dangling pointers will cause headaches.
- Although the API provided by cheap can use C style thread calling, my suggestion is that each thread should use asynchronous development in event loop. The advantage of this is that when multi-threading can not support in environment, you can fall back to running on the main thread (compatibility issues cannot be avoided on the Web); and writing in this way will make multi-threading easier, you only need to pay attention to those things that need to be transferred between different threads. The data synchronization problem can use reference counting to manage its life cycle well. At other times, it can be written in the same way as single-thread JavaScript that we are familiar with.
- There is currently a project [libmedia](https://github.com/zhaohappy/libmedia) that use cheap for development. If you want to learn how to use cheap, you can refer to the usage and design patterns of this project.
- [cheap-example](https://github.com/zhaohappy/cheap-example) is some simple examples for cheap.

### Notice

cheap is still in the research and development stage and has not yet been used in production environments. There may be some bugs, so please use it with caution.

The wasm modules tested so far are all compiled from emscripten. The wasm runtime in cheap is also for C/C++. Those compiled from other languages ​​such as Rust may need to add some imported functions. As for other languages with GC, it cannot be used.

### License

[MIT](https://opensource.org/licenses/MIT)

Copyright (C) 2024-present, Gaoxing Zhao
