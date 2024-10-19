cheap
======
中文 | [English](README_en.md)

![](https://img.shields.io/badge/language-typescript-blue.svg) ![](https://img.shields.io/badge/platform-web%20|%20node-lightgrey.svg) ![license](https://img.shields.io/github/license/zhaohappy/cheap)


### 介绍

cheap 是一个用于 JavaScript 多线程和高性能 WebAssembly 程序开发的工具库

cheap 可以用于浏览器环境和 Node 环境

### 使用

cheap 只能使用 typescript 开发

cheap 目前只能使用 webpack 打包编译，如果你使用了 cheap 那你所使用的相关模块就需要用 webpack 打包，建议使用 webpack 5，更低的版本可能存在无法编译的问题。

cheap 依赖了 [common](https://github.com/zhaohappy/common) 项目，建议将 cheap 和 common 都作为子模块放入项目下的同级目录中。

webpack 配置需要添加 cheap 的插件

```javascript
// 插件位置在 cheap build 目录下面
const CheapPlugin = require('./src/cheap/build/webpack/plugin/CheapPlugin')

{
  ...
  plugins: [
    new CheapPlugin({
      // 'web' | 'node'
      env: 'web',
      // 项目根目录，这里表示 webpack.config.js 在项目根目录下面
      projectPath: __dirname,
      // 需要排除处理的文件匹配
      exclude: /__test__/,
      // 添加宏定义
      defined: {

      }
    })
  ]
}
```

```tsconfig.json``` 中添加配置，将 cheap 和 common 目录下面的代码包括进工程
```Javascript
{
  "paths": {
    ...
    "cheap/*": ["./src/cheap/*"],
    "common/*": ["./src/common/*"]
  },
  "include": [
    "./src/cheap/**/*.ts",
    "./src/common/**/*.ts"
  ],
  "exclude": [
    // 排除测试文件
    "*.test.ts",
    "__test__",
    "/node_modules/**"
  ],
  "cheap": {
    // 可以配置一些宏
    "defined": {

    }
  }
}
```


### 原理


cheap 从如何让 js 和 wasm 之间更好的进行数据传递（特别是复杂的数据结构）这个角度来思考设计的。我们知道当前的 wasm 和 js 之间只能互相传递 number 类型的数据，更复杂的数据结构往往需要做序列化和反序列化，这大大影响了程序的性能，可以说是目前 wasm 在 web 平台上还未流行使用的一个重要原因。

为了解决这个问题，cheap 将 struct 的概念引入 typescript，struct 和 C 中的 struct 概念一致，表示一段内存中的数据结构布局，如此可以在 wasm 和 js 中各自根据布局操作内存，而双方之间传递数据时传递内存的开始位置，也就是 pointer(指针)，从而避免了数据的序列化和反序列化的开销。

有了 struct 了我们不仅可以在 wasm 和 js 之间高效的传递数据，还想到目前 js 中多线程编程也面临着无法进行数据共享的问题，如果我们的 struct 是在 SharedArrayBuffer 中，让所有 worker 使用同一个 SharedArrayBuffer，这样所有 worker 都实现了数据共享，不同 worker 之间通过传递指针来高效的进行数据传递。

整体思路总结如下:

1. 实现一个全局的内存分配器 Allocator，它可以分配出给定大小的内存并返回起始地址，可以回收已被分配的内存，这个全局的内存在 Webassembly.Memory 中，称其为 Heap
2. 所有 wasm 模块使用动态链接库的模式来编译，内部要分配内存时使用 1 中实现的 Allocator 来分配，包括 data 段的内存也需要通过 1 中的 Allocator 分配之后动态导入，emscripten 工具有固定的配置来开启这种编译
3. 使用 typescript transformer api 编写一个插件来在编译期间对 ts 代码中的指针访问编译成函数调用
4. 创建 worker 时将当前线程的全局 Heap 传递到创建的 worker 中，并初始化相关配置（这种情况下的 Heap 一定是在 SharedArrayBuffer 之上的）得到多线程数据共享的环境。这要求 Allocator 是要线程安全的。各个线程分配内存由各自线程的 Allocator 负责，它们都在同一个内存上进行分配

如此 wasm 的所有内存在 Heap 中，每个 js worker 分配的内存在 Heap 中，就可以让所有地方都实现了数据共享，wasm 和 wasm 之间是共享的，worker 和 worker 之间是共享的，js 和 wasm 之间是共享的。

### API

#### struct

为了能定义内存布局，cheap 新增了以下基本数据类型

| 类型 | 描述 |
|----------|----------|
| bool | true 或者 false
| char | 8 位无符号数，标记 C 中的字符串指针
| uint8 | 8 位无符号数
| int8 |8 位有符号数
| uint16|16 位无符号数
| int16| 16 位有符号数
| uint32| 32 位无符号数
| int32| 32 位有符号数
| uint64| 64 位无符号数
| int64| 64 位有符号数
| float| 32 位浮点数
| double、float64| 64 位浮点数
| pointer\<T>| 指针


##### struct 定义

cheap 的 struct 内存布局规则完全和 C 一致，因此 cheap 和 C 可以进行互操作，其他语言一般都有和 C 进行互操作的结构体定义方式。能和 C 互操作，就能和 cheap 互操作

```typescript
// 使用 struct 装饰器来标记一个 struct 定义
@struct
class MyStruct {
  a: int8
  b: uint32
  // 指向 uint8 类型的指针
  c: pointer<uint8>
  // 类型为 int32，大小为 8 的数组
  d: array<int32, 8>
  // 类型为 int32 的二维数组
  e: array<array<int32, 8>, 8>
  // 位域，占 5 bit，类型会影响后面的属性布局
  f: bit<int32, 5>
  // 内联结构体
  g: struct<{
    a: uint8
  }>
  // 内联联合体
  h: union<{
    a: uint8
    b: uint32
  }>
  // 这个不是内建类型，在布局时会忽略
  // 当你使用实例访问时访问的是 js 对象属性，此属性只在本线程的 js 中可见
  // 使用指针访问会编译报错
  // 一般不建议有此操作，一种可能的使用场景是在不同的线程中操作同一个结构体
  // 此属性可以作为线程自己的私有属性读写自己的独占数据，不与其他线程共享
  i: number

  // 可以使用装饰器修饰属性
  // 这里表示当宏 ENABLE_XX 未开启时会忽略此属性
  // 可以在 struct 里面做条件编译
  @ignore(!defined(ENABLE_XX))
  j: int16
}

@struct
class MyStructB {
  // 类型为另一个结构体
  a: MyStruct
  // 指向另一个结构体的指针
  b: pointer<MyStruct>
  // 指向另一个结构体的二维指针
  c: pointer<pointer<MyStruct>>
}

// 结构体可以继承
@struct
class MyStructC extends MyStructB {
  d: float
}

// 用 union 装饰器来标记一个 union 定义，union 所有属性共享一段内存，其大小为最大属性成员的大小
@union
class MyUnion {
  a: uint8
  b: uint32
}
```

##### struct 使用


```typescript

@struct
class MyStruct {
  a: int8
  b: uint32
}

// 创建结构体实例，第二个参数可以传递初始化数据
// 返回的 myStruct 是一个 proxy 代理的 js 对象
// 每次读写属性时走的 getter 和 setter 逻辑
const myStruct = make<MyStruct>({ a: 0, b: 0 })
myStruct.a = 3
myStruct.b = 4
console.log(myStruct.b)

// 销毁实例
unmake(myStruct)

// 创建结构体指针（推荐使用，效率最高）
let myStructPointer: pointer<MyStruct> = malloc(sizeof(MyStruct))
// 指针可以通过属性赋值
myStructPointer.a = 0
myStructPointer.b = 1
// 取值
console.log(myStructPointer.b)

// pa 的类型为 pointer<int8>
// 等于 C 中的 int8* pa = &myStructPointer->a
const pa = addressof(myStructPointer.a)
// 等于 C 中的 int8 va = *pa
const va = accessof(pa)

// 指针可以当成数组取下标
// 等于 accessof(pa + 3)
const aa = pa[3]

// 等于 C 中的 *va = (int8)34
// 由于 js 中函数调用不能是左值，所以加了个  <- 语法
// 但是有个小瑕疵如果两边类型是结构体 ts 会报错，需要用 @ts-ignore 忽略一下
// 或者 pa[0] = static_cast<int8>(34)，虽然也很诡异，但不会报错
accessof(pa) <- static_cast<int8>(34)

// 指针可以自增自减，可以和 number 做加法， 两个类型一样的指针可以相减，规则和 C 一样
// + 1 表示指针往后偏移一个指针类型的大小个字节，非 1 个字节
// pointer<uint8>++ 偏移 1 个字节
// pointer<uint64>++ 偏移 8 个字节
pa++
pa--
pa += 8

// 回收内存 
free(myStructPointer)
// nullptr 为空指针定义
myStructPointer = nullptr


```

#### 内置函数（全局作用域）


```typescript
/**
 * 创建结构体实例
 */
declare function make<T extends {}>(): T
declare function make<T extends {}>(init: Partial<SetOmitFunctions<T>>): T

/**
 * 销毁结构体实例
 * 
 * @param target 
 */
function unmake<T extends Object>(target: T): void

/**
 * 创建 SharedPtr 智能指针
 */
declare function makeSharedPtr<T extends BuiltinType, args=[T]>(): SharedPtr<T>
declare function makeSharedPtr<T extends BuiltinType, args=[T]>(deleter: deleter<T>): SharedPtr<T>
declare function makeSharedPtr<T extends BuiltinType, args=[T]>(value: T): SharedPtr<T>
declare function makeSharedPtr<T extends BuiltinType, args=[T, undefined, true]>(value: pointer<T>): SharedPtr<T>
declare function makeSharedPtr<T extends BuiltinType, args=[T]>(value: T, deleter: deleter<T>): SharedPtr<T>
declare function makeSharedPtr<T extends BuiltinType, args=[T, true]>(value: pointer<T>, deleter: deleter<T>): SharedPtr<T>
declare function makeSharedPtr<T extends {}, args=[T]>(): SharedPtr<T>
declare function makeSharedPtr<T extends {}, args=[T]>(deleter: deleter<T>): SharedPtr<T>
declare function makeSharedPtr<T extends {}, args=[T]>(init: Partial<SetOmitFunctions<T>>): SharedPtr<T>
declare function makeSharedPtr<T extends {}, args=[T]>(init: pointer<T>): SharedPtr<T>
declare function makeSharedPtr<T extends {}, args=[T]>(init: T): SharedPtr<T>
declare function makeSharedPtr<T extends {}, args=[T]>(init: pointer<T>, deleter: deleter<T>): SharedPtr<T>
declare function makeSharedPtr<T extends {}, args=[T]>(init: T, deleter: deleter<T>): SharedPtr<T>
declare function makeSharedPtr<T extends {}, args=[T]>(init: Partial<SetOmitFunctions<T>>, deleter: deleter<T>): SharedPtr<T>

 /**
 * 申请大小为 size 字节的内存
 * 分配的地址以 8 字节对齐
 * 
 * @param size 
 */
function malloc(size: size): pointer<void>

/**
 * 分配一块指定数量的内存，并将其初始化为零
 * 
 * @param num 要分配的元素数量
 * @param size 每个元素的大小（以字节为单位）
 */
function calloc(num: size, size: size): pointer<void>

/**
 * 重新调整已分配内存块的大小
 * 
 * @param address 已分配内存块的指针
 * @param size 调整的内存块的新大小（以字节为单位）
 */
function realloc(address: pointer<void>, size: size): pointer<void>

/**
 * 堆上分配一块对齐的内存块
 * 
 * @param alignment 内存对齐的要求，需要为 2 的幂次方
 * @param size 分配的内存块的大小（以字节为单位）
 */
function aligned_alloc(alignment: size, size: size): pointer<void>

/**
 * 释放指定地址的内存
 * 
 * @param address 
 */
function free(address: pointer<void>): void

/**
 * & 取地址
 * 注意只能取内存在 cheap 上的地址，js 栈和堆上的无法取
 */
function addressof<T>(type: T): T extends any[] ? pointer<UnwrapArray<T>> : pointer<T>

/**
 * * 解引用（访问指针）
 */
function accessof<T extends (IsBuiltinType<T> extends true ? never : anyptr)>(pointer: T): UnwrapPointer<T>

/**
 * 返回 type 所占内存大小
 */
function sizeof(type: any): size

/**
 * - 任意指针之间转换
 * - uint32 和指针之间转换
 * - 任意 builtin 基本类型之间转换，只做编译时类型转换，运行时可能不安全（需要自己确保安全）
 *   - int8 -> int32 是安全的， int64 -> int32 是不安全的
 *   - uint8 -> int16 是安全的，uint8 -> int8 可能是不安全的
 */
function reinterpret_cast<T extends (anyptr | BuiltinType)>(target: anyptr | BuiltinType): T

/**
 * 基本类型之间强转，不包括指针（类型安全）
 * 编译器会做一些处理
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
 * 断言
 * debug 模式下打开控制台在断言处触发会在此暂停
 * release 模式下会把断言语句去掉
 * 
 * @param condition 条件
 * @param msg 当断言失败时打印的错误消息
 */
function assert(condition: any, msg?: string): void

/**
 * 使用宏定义，会替换为宏定义的值
 * 
 * @param def 
 */
function defined<T>(def: T): T

```

#### WebAssembly 模块使用

我们使用 WebAssembly 的目的首先是复用现有的大量 C/C++ 写的基础库，其次是 WebAssembly 带来的性能提升。

目前的 WebAssembly 开发模式都是使用其他语言来开发，然后通过编译工具编译成 wasm 字节码，其中需要的 js 胶水层代码也由编译工具来完成。这给我的感觉是本来 WebAssembly 技术一开始是给 Web 使用的，但它却和 Web 的主角 JavaScript 有一种割裂感，我认为在 Web 平台上应该由 JavaScript 来主导整个程序，这样我们既拥有了 JavaScript 的优点（开发快速、社区大量的库），又可以把其他语言的一些优势引入 Web；而不是让写其他语言的人员主导整个过程让 JavaScript 沦为那些代码看起来丑陋和晦涩难懂的胶水层的运行时代码。JavaScript 作为整个 Web 技术的核心，抛弃它只会把其他语言的缺点引入 Web，而不会成为 1 + 1 > 2 的可能。

所以在 cheap 中我们只需要编译之后的 wasm 字节码，不需要胶水层代码，同时 cheap 提供了一些基础的运行时。这个运行时有内存分配、标准输出（用于日志打印）、atomic、pthread、semaphore。总结就是 wasm 模块应该只负责计算部分，IO 的输入输出和业务逻辑应该由 JavaScript 负责。因为我们的 wasm 模块绝大部分从 C/C++ 编译而来，其同步阻塞的 IO 方式和 Web 异步的方式天生不合，所有将 IO 放进 wasm 内部而用 JavaScript 去模拟一套同步阻塞的运行时都将成为这个系统的致命缺陷。当然你也可以使用编译工具让 wasm 内部支持调用 JavaScript 的异步函数，但它带来的是要么编译产物 wasm 体积变大，性能下降；要么可以使用的场景有很大限制。据我所知 emscripten 支持让 C/C++ 调用 JavaScript 的异步函数，但前提是整个调用链上不能有间接调用。

要在 cheap 上使用 wasm 模块，你需要将你的 wasm 编译成动态链接的方式，下面是一个例子

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

得到 wasm 输出之后，就可以在 cheap 下使用了

```javascript

import compile from 'cheap/webassembly/compiler'
import WebAssemblyRunner from 'cheap/webassembly/WebAssemblyRunner'
import * as config from 'cheap/config'

// resource 可以存入 indexDB 里面，下一次直接取出来用，不用在进行网络请求和编译了
const resource = await compile(
  {
    source: 'https://xxxx.wasm'
  }
)

const runner = new WebAssemblyRunner(resource)
await runner.run()

// 然后就可以调用 wasm 导出的函数了
runner.call('func_a', 0)


```


#### 多线程

cheap 支持多线程操作，并且让多线程开发变得更加的优雅简单。

##### 线程创建和结束

线程创建和结束函数在 ```cheap/thread/thread.ts``` 中定义

```typescript

/**
 * 从一个类创建线程，返回线程句柄，这样可以通过句柄异步调用线程中类成员函数
 * 线程创建时会实例化这个类
 * 这里目前有一个要求是类的定义和创建线程类的调用不能在同一个文件里面（代码压缩之后可能会将这个类变成了匿名类）
 */
function createThreadFromClass<T, U extends any[]>(entity: new (...args: U) => T, options?: ThreadOptions): {
  run: (...args: U) => Promise<Thread<T>>
  transfer: (...transfer: Transferable[]) => {
    run: (...args: U) => Promise<Thread<T>>
  }
}

/**
 * 从一个函数创建线程，建议函数定义单独在一个文件
 * 线程创建之后会马上运行这个函数，函数返回时线程退出
 * 和 C 创建线程一致
 */
function createThreadFromFunction<T extends any[]>(entity: (...args: T) => void, options?: ThreadOptions): {
  run: (...args: T) => Promise<Thread<{}>>
  transfer: (...transfer: Transferable[]) => {
    run: (...args: T) => Promise<Thread<{}>>
  }
}

/**
 * 从一个模块创建线程，返回线程句柄，这样可以通过句柄异步调用模块内的方法
 */
function createThreadFromModule<T extends Object>(entity: T, options?: ThreadOptions): {
  run: () => Promise<Thread<T>>
}

/**
 * 强制结束线程
 * 可能会导致内存泄漏，请使用 joinThread
 * 
 */
function closeThread(thread: Thread<{}>): void

/**
 * 等待线程退出
 * 从函数创建的线程会等待函数返回，并返回函数的返回结果
 * 从类和模块创建的线程会在线程内部的下一次事件循环中退出
 */
async function joinThread<T>(thread: Thread<{}>): Promise<T>

```

##### 线程同步

cheap 支持原子操作、锁、条件变量、信号量等线程同步方法。

###### 原子操作

新增原子类型

| 类型 | 描述 |
|----------|----------|
| atomic_bool | true 或者 false
| atomic_uint8 | 8 位无符号数
| atomic_int8 |8 位有符号数
| atomic_uint16|16 位无符号数
| atomic_int16| 16 位有符号数
| atomic_uint32| 32 位无符号数
| atomic_int32| 32 位有符号数
| atomic_uint64| 64 位无符号数
| atomic_int64| 64 位有符号数

原子操作函数在 ```cheap/thread/atomic.ts``` 中定义

```typescript

/**
 * 给定的值加到指定位置上
 * 
 * 返回该位置的旧值
 *
 */
function add<T extends atomictype>(address: pointer<T>, value: AtomicType2Type<T>): AtomicType2Type<T>

/**
 * 给定的值与指定位置上的值相减
 * 
 * 返回该位置的旧值
 *
 */
function sub<T extends atomictype>(address: pointer<T>, value: AtomicType2Type<T>): AtomicType2Type<T>

/**
 * 给定的值与指定位置上的值进行与运算
 * 
 * 返回该位置的旧值
 *
 */
function and<T extends atomictype(address: pointer<T>, value: AtomicType2Type<T>): AtomicType2Type<T>

/**
 * 给定的值与指定位置上的值进行或运算
 * 
 * 返回该位置的旧值
 *
 */
function or<T extends atomictype(address: pointer<T>, value: AtomicType2Type<T>): AtomicType2Type<T>

/**
 * 给定的值与指定位置上的值进行异或运算
 * 
 * 返回该位置的旧值
 *
 */
function xor<T extends atomictype(address: pointer<T>, value: AtomicType2Type<T>): AtomicType2Type<T>

/**
 * 给定的值存在给定位置上
 * 
 * 返回该位置的旧值
 *
 */
function store<T extends atomictype(address: pointer<T>, value: AtomicType2Type<T>): AtomicType2Type<T>

/**
 * 读取给定位置上的值
 * 
 * 返回该位置的旧值
 *
 */
function load<T extends atomictype>(address: pointer<T>): AtomicType2Type<T>

/**
 * 如果指定位置的元素与给定的值相等，则将其更新为新的值，并返回该元素原先的值
 * 
 * 返回该位置的旧值
 *
 */
function compareExchange<T extends atomictype>(
  address: pointer<T>,
  expectedValue: AtomicType2Type<T>,
  replacementValue: AtomicType2Type<T>
): AtomicType2Type<T>

/**
 * 将指定位置的元素更新为给定的值，并返回该元素更新前的值。
 * 
 * 返回该位置的旧值
 *
 */
function exchange<T extends atomictype>(address: pointer<T>, value: AtomicType2Type<T>): AtomicType2Type<T>


/**
 * 唤醒等待队列中正在指定位置的元素上等待的线程。返回值为成功唤醒的线程数量。
 * 
 * 返回被唤醒的代理的数量 0 将不会唤醒任何线程
 *
 */
function notify(address: pointer<atomic_int32>, count: uint32): uint32

/**
 * 检测指定位置上的值是否仍然是给定值，是则保持挂起直到被唤醒
 * 
 * 0 "ok"、1 "not-equal"
 *
 */
function wait(address: pointer<atomic_int32>, value: int32): 0 | 1 | 2

/**
 * 检测指定位置上的值是否仍然是给定值，是则保持挂起直到被唤醒或超时（毫秒）
 * 
 * 0 "ok"、1 "not-equal" 或 2 "time-out"
 *
 */
function waitTimeout(address: pointer<atomic_int32>, value: int32, timeout: int32): 0 | 1 | 2

/**
 * 检测指定位置上的值是否仍然是给定值，是则保持挂起直到被唤醒
 * 异步非阻塞，适合在主线程上使用
 * 
 * 0 "ok"、1 "not-equal"
 *
 */
function waitAsync(address: pointer<atomic_int32>, value: int32): Promise<0 | 1 | 2>
/**
 * 检测指定位置上的值是否仍然是给定值，是则保持挂起直到被唤醒或超时
 * 异步非阻塞，适合在主线程上使用
 * 
 * 0 "ok"、1 "not-equal" 或 2 "time-out"
 *
 */
function waitTimeoutAsync(address: pointer<atomic_int32>, value: int32, timeout: int32): Promise<0 | 1 | 2>

```

###### 锁、条件变量、信号量

锁在 ```cheap/thread/mutex.ts``` 中定义

```typescript

/**
 * 初始化锁
 * 
 * @param mutex 
 */
function init(mutex: pointer<Mutex>): int32

/**
 * 加锁
 * 
 * @param mutex 
 * @param spin 是否自旋
 */
function lock(mutex: pointer<Mutex>, spin: boolean = false): int32

/**
 * 异步加锁
 * 
 * @param mutex
 */
async function lockAsync(mutex: pointer<Mutex>): Promise<int32>

/**
 * 释放锁
 * 
 * @param mutex 
 */
function unlock(mutex: pointer<Mutex>): int32

/**
 * 销毁锁
 * 
 * @param mutex 
 * @returns 
 */
function destroy(mutex: pointer<Mutex>): int32

```

条件变量在 ```cheap/thread/cond.ts``` 中定义

```typescript
/**
 * 初始化条件变量
 */
function init(cond: pointer<Cond>, attr: pointer<void>): int32

/**
 * 销毁条件变量
 */
function destroy(cond: pointer<Cond>): int32

/**
 * 唤醒条件变量上的一个等待线程
 * 
 * @param cond 
 */
function signal(cond: pointer<Cond>): int32

/**
 * 唤醒条件变量上的所有等待线程
 * 
 * @param cond 
 */
function broadcast(cond: pointer<Cond>): int32 

/**
 * 线程在条件变量处等待
 * 
 * @param cond 
 * @param mutex 
 * @returns 
 */
function wait(cond: pointer<Cond>, mutex: pointer<Mutex>): int32 

/**
 * 线程在条件变量处异步等待
 * 
 * @param cond 
 * @param mutex 
 */
async function waitAsync(cond: pointer<Cond>, mutex: pointer<Mutex>): Promise<int32>

/**
 * 线程在条件变量处超时等待
 * 
 * @param cond 
 * @param mutex 
 * @param timeout 毫秒
 */
function timedWait(cond: pointer<Cond>, mutex: pointer<Mutex>, timeout: int32): int32

/**
 * 线程在条件变量处超时异步等待
 * 
 * @param cond 
 * @param mutex 
 * @param timeout 毫秒
 */
async function timedwaitAsync(cond: pointer<Cond>, mutex: pointer<Mutex>, timeout: int32): Promise<int32>
```

信号量在 ```cheap/thread/semaphore.ts``` 中定义


```typescript

/**
 * 初始化信号量
 * 
 * @param sem 
 * @param value 信号量初始值
 */
function init(sem: pointer<Sem>, value: uint32): int32

/**
 * 生产信号量
 * 
 * @param sem 
 */
function post(sem: pointer<Sem>): int32

/**
 * 消费信号量
 * 
 * @param sem 
 */
function wait(sem: pointer<Sem>): int32 

/**
 * 消费信号量，不会挂起线程
 * 
 * @param sem 
 */
function tryWait(sem: pointer<Sem>): int32

/**
 * 消费信号量，并设置一个超时
 * 
 * @param sem 
 * @param timeout 毫秒
 */
function timedWait(sem: pointer<Sem>, timeout: int32): int32

/**
 * 异步消费信号量
 * 
 * @param sem 
 */
async function waitAsync(sem: pointer<Sem>): Promise<int32>

/**
 * 异步消费信号量，并设置一个超时
 * 
 * @param sem 
 * @param timeout 毫秒
 */
async function timedWaitAsync(sem: pointer<Sem>, timeout: int32): Promise<int32>

```


##### wasm 模块中使用多线程

在 C/C++ 中使用 cheap/include 下面的 wasmatomic.h 来做原子操作，
使用 wasmpthread.h 来做线程、锁、条件变量相关操作、使用 wasmsemaphore.h 来做信号量相关操作，然后重新编译 wasm 模块在 cheap 中使用即可使用 wasm 多线程。

#### 智能指针

智能指针用于自动管理动态申请的内存的生命周期而无需手动释放，降低内存泄漏的风险。目前实现了 ```SharedPtr```。

智能指针的实现机制依赖 [FinalizationRegistry](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/FinalizationRegistry) API 且不能被 polyfill，因此请确保你的执行环境是否满足要求。

下表是智能指针的兼容情况:

| 环境            | 版本          |
| -----------    | -----------  |
| Chrome         | 84+          |
| Firefox        | 79+          |
| Safari         | 14.1+        |
| Safari iOS     | 14.5+        |
| Node.js        | 14.6.0+      |
| Deno           | 1.0+         |

> 智能指针是一个 js 对象，按引用传递

##### SharedPtr

SharedPtr 是可共享的智能指针，可以在多个地方引用。用法如下

```typescript

@struct
class MyStruct {
  a: int8
}

// 无参构造
const p0 = makeSharedPtr<MyStruct>()
const p1 = makeSharedPtr<int32>()
// 带初始化数据的构造
const p2 = makeSharedPtr<MyStruct>({a: 0})
const p3 = makeSharedPtr<int32>(43)

function freeMyStruct(p: pointer<MyStruct>) {
  free(p)
}
// 带自定义析构函数的构造，不传使用默认析构只会 free 结构体自己的内存
const p4 = makeSharedPtr<MyStruct>(freeMyStruct)

// 带初始化数据和自定义析构函数的构造
const p5 = makeSharedPtr<MyStruct>({a: 0}, freeMyStruct)

// 访问原始指针的属性
console.log(p5.a)
// 获取原始指针的属性地址
console.log(addressof(p5.a))

```

SharedPtr 拥有下面的方法:

```typescript

interface SharedPtr<T> {
  /**
   * 获取原始指针
   */
  get(): pointer<T>
  /**
   * 重置原始指针
   */
  reset(value?: pointer<T>): void
  /**
   * 返回当前的原始指针是否只有一个引用
   */
  unique(): boolean
  /**
   * 返回当前的原始指针引用计数
   */
  useCount(): int32
  /**
   * 是否有原始指针
   */
  has(): boolean
  /**
   * 将智能指针转为可转移对象
   */
  transferable(): SharedPtrTransferable<T>
  /**
   * 克隆智能指针（增加引用计数）
   */
  clone(): SharedPtr<T>
}

```

##### 在线程之间传递智能指针

```typescript
import { deTransferableSharedPtr } from 'cheap/std/smartPtr/SharedPtr'
import { createThreadFromFunction } from 'cheap/thread/thread'

@struct
class MyStruct {
  a: int8
}

function worker(t: SharedPtrTransferable<MyStruct>) {
  const p = deTransferableSharedPtr(t)
  console.log(p.a)
}

const p = makeSharedPtr<MyStruct>()
const transfer = p.transferable()
const thread = await createThreadFromFunction(worker).transfer(transfer.buffer).run(transfer)

```


### 一些建议

- 设计上应该尽量少使用 struct 做数据结构、只在需要在多个线程之间传递和 js 和 wasm 之间传递时使用 struct，其他时候应该使用 js 对象。否则内存泄漏、内存脏写、空悬指针这些问题让人头大。
- 虽然 cheap 提供的 API 可以使用 C 那种同步阻塞的线程调用方式，但我的建议是应当在每个线程都用事件循环的方式做异步开发，这样的好处是一套代码当浏览器不能支持多线程时可以回退到在主线程上也能运行（兼容问题是 Web 无法避开的）；并且这样写会让多线程写法变得更简单，你只需要去关注那些需要在不同线程间流转的数据的同步问题，这样的数据用引用计数就可以很好的管理其生命周期，其他时候都可以和写我们熟悉的方式的单线程的 JavaScript 一样。
- 目前有一个项目[libmedia](https://github.com/zhaohappy/libmedia) 使用 cheap 进行开发，如果你想学习 cheap 如何用来开发，可以参考这个项目的使用方法和设计模式。
- [cheap-example](https://github.com/zhaohappy/cheap-example) 是一些使用 cheap 的简单例子。

### 注意

cheap 目前还在研发阶段，尚未在生产环境使用，可能存在一些 bug，请谨慎使用。

目前测试过的 wasm 模块都是从 emscripten 编译而来，cheap 中的 wasm runtime 也是针对 C/C++ 的，其他语言如 Rust 编译来的可能需要自己追加一些导入函数。至于其他带有 GC 的语言则不能使用。

### 开源协议

[MIT](https://opensource.org/licenses/MIT)

版权所有 (C) 2024-现在 赵高兴

Copyright (C) 2024-present, Gaoxing Zhao
