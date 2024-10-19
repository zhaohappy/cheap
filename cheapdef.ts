type UnwrapPointer<T> = T extends pointer<infer U> ? U : never
type UnwrapSharedPtr<T> = T extends SharedPtr<infer U> ? U : never

type UnwrapArray<T> = T extends (infer U)[] ? U : never

type SetFunctionKeys<T> = {
  [K in keyof T]: T[K] extends Function ? K : never
}[keyof T]

type SetOmitFunctions<T> = Omit<T, SetFunctionKeys<T>>

type IsAny<T> = unknown extends T
  ? [T] extends [string]
    ? true
    : false
  : false

declare type i32 = {
  zzztype__?: 'i32'
} & number
declare type i64 = {
  zzztype__?: 'i64'
} & bigint
declare type f32 = {
  zzztype__?: 'f32'
} & number
declare type f64 = {
  zzztype__?: 'f64'
} & number
declare type bool = {
  zzztype__?: 'bool'
} & boolean
declare type uint8 = {
  zzztype__?: 'uint8'
} & number
declare type uint16 = {
  zzztype__?: 'uint16'
} & number
declare type uint32 = {
  zzztype__?: 'uint32'
} & number
declare type uint64 = {
  zzztype__?: 'uint64'
} & bigint

declare type int8 = {
  zzztype__?: 'int8'
} & number
declare type int16 = {
  zzztype__?: 'int16'
} & number
declare type int32 = {
  zzztype__?: 'i32'
} & number
declare type int64 = {
  zzztype__?: 'i64'
} & bigint

declare type float = {
  zzztype__?: 'f32'
} & number
declare type float64 = {
  zzztype__?: 'f64'
} & number

declare type double = {
  zzztype__?: 'f64'
} & number

declare type char = {
  zzztype__?: 'char'
} & number

declare type size = int32

declare type atomic_char = {
  zzztype__?: 'atomic_char'
} & number
declare type atomic_uint8 = {
  zzztype__?: 'atomic_uint8'
} & number
declare type atomic_uint16 = {
  zzztype__?: 'atomic_uint16'
} & number
declare type atomic_uint32 = {
  zzztype__?: 'atomic_uint32'
} & number
declare type atomic_uint64 = {
  zzztype__?: 'atomic_uint64'
} & bigint
declare type atomic_int8 = {
  zzztype__?: 'atomic_int8'
} & number
declare type atomic_int16 = {
  zzztype__?: 'atomic_int16'
} & number
declare type atomic_int32 = {
  zzztype__?: 'atomic_int32'
} & number
declare type atomic_int64 = {
  zzztype__?: 'atomic_int64'
} & bigint
declare type atomic_bool = {
  zzztype__?: 'atomic_bool'
} & boolean

declare const i32: i32
declare const i64: int64
declare const f32: f32
declare const f64: f64
declare const bool: bool
declare const uint8: uint8
declare const uint16: uint16
declare const uint32: uint32
declare const uint64: uint64
declare const int8: int8
declare const int16: int16
declare const int32: int32
declare const int64: int64
declare const float: float
declare const float64: float64
declare const double: double
declare const char: char
declare const size: size

declare const atomic_bool: atomic_bool
declare const atomic_char: atomic_char
declare const atomic_uint8: atomic_uint8
declare const atomic_uint16: atomic_uint16
declare const atomic_uint32: atomic_uint32
declare const atomic_uint64: atomic_uint64
declare const atomic_int8: atomic_int8
declare const atomic_int16: atomic_int16
declare const atomic_int32: atomic_int32
declare const atomic_int64: atomic_int64

// 当前行数
declare const __LINE__: number

// 当前文件
declare const __FILE__: string

declare const nullptr: nullptr

declare const typeptr: pointer<void>

declare type atomictype = atomic_char | atomic_uint8 | atomic_int8
| atomic_uint16 | atomic_int16
| atomic_uint32 | atomic_int32
| atomic_uint64 | atomic_int64
| atomic_bool

type PointerLevel<T, Y = T, Level extends number[] = []> = IsAny<T> extends true
  ? Level['length']
  : (
    T extends pointer<infer U>
      ? PointerLevel<U, T, [1, ...Level]>
      : (
        T extends void
          ? Level['length']
          : (
            Y extends BuiltinType
              ? (
                Level extends [any, ...infer U]
                  ? U['length']
                  : never
              )
              : Level['length']
          )
      )
  )

type PointerType<T, Type = void> = T extends pointer<infer U>
  ? PointerType<U, U>
  : (Type extends void
    ? any
    : (Type extends BuiltinType ? `${Type['zzztype__']}*` : (Type extends string ? `${Type}*` : Type))
  )

type IsPointer<T> = Required<T> extends {
  zzztype__: any
  zzzlevel__: number
  indexOf: (index: uint32) => any
}
  ? true
  : false

type IsSharedPtr<T> = T extends SharedPtr<{}>
  ? true
  : false

type IsBuiltinType<T> = IsPointer<T> extends true
  ? false
  : (
    Required<T> extends {
      zzztype__: string
    }
      ? true
      : false
  )

interface Number {
  [index: number]: {}
}

declare type pointer<T> =
  (
    IsPointer<T> extends true
      ? {}
      : (
        IsBuiltinType<T> extends true
          ? {}
          : (
            IsAny<T> extends true
              ? {}
              : (
                T extends void
                  ? {}
                  : Partial<{
                    [K in keyof T]: T[K]
                  }>
              )
          )
      )
  )
  & {
    zzzlevel__?: PointerLevel<pointer<T>>
    zzztype__?: PointerType<pointer<T>>
    indexOf?: (index: number) => T extends void ? any : T
    [index: number]: T extends void ? any : T
  }
  & number

declare type anyptr = {
  zzzlevel__?: any
  zzztype__?: any
  indexOf?: (index: uint32) => any
  [index: number]: any
} & number

declare type nullptr = {
  zzzlevel__?: any
  zzztype__?: any
  indexOf?: (index: uint32) => any
  [index: number]: any
} & number

declare type multiPointer = {
  zzzlevel__?: 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10
  zzztype__?: any
  indexOf?: (index: uint32) => any
  [index: number]: any
} & number

declare type BuiltinType = i32 | i64 | f32 | f64
| uint8 | uint16 | uint32 | uint64
| int8 | int16 | int32 | int64
| float | float64 | double | char | bool
| atomic_char | atomic_uint8 | atomic_uint16
| atomic_uint32 | atomic_int8 | atomic_int16
| atomic_int32 | atomic_uint64 | atomic_int64
| atomic_bool

/* eslint-disable */
declare type AtomicType2Type<T> =
 T extends atomic_char
  ? char
  : T extends atomic_int16
  ? int16
  : T extends atomic_int32
  ? int32
  : T extends atomic_int8
  ? int8
  : T extends atomic_uint8
  ? uint8
  : T extends atomic_uint16
  ? uint16
  : T extends atomic_uint32
  ? uint32
  : T extends atomic_uint64
  ? uint64
  : T extends atomic_int64
  ? int64
  : T extends atomic_bool
  ? bool
  : never
/* eslint-enable */

declare type __struct__ = {
  zzzstruct__?: 'struct'
}
declare type __union__ = {
  zzzstruct__?: 'struct'
}
declare type __type__ = {
  zzztype__?: string
}

/**
 * 数组
 */
declare type array<T, U extends number> = T[]

/**
 * 位域
 */
declare type bit<T extends BuiltinType, U extends number> = T & { __bitfiled__?: true }

/**
 * 内联结构体
 */
declare type struct<T> = T & __struct__

/**
 * 内联联合体
 */
declare type union<T> = T & __union__

/**
 * 使用宏定义
 * 
 * @param def 
 */
declare function defined<T>(def: T): T

/**
 * C 结构体定义
 * 
 */
declare function struct(...args: any[]): any

/**
 * C 联合体定义
 * 
 */
declare function union(...args: any[]): any

/**
 * 忽略结构体属性，不在内存中布局
 * 
 * @param enable 是否忽略
 */
declare function ignore(enable: boolean): (...args: any[]) => void

/**
 * 标记结构体类型
 * 
 * @param type 
 */
declare function type(type: number | (new (init?: any) => any)): (...args: any[]) => void

/**
 * 标记是否是指针
 * 
 * @param level 指针级数 
 */
declare function pointer(level?: number): (...args: any[]) => void

/**
 * 标记是否是数组
 * 
 * @param length 数组大小 
 */
declare function array(length: number): (...args: any[]) => void

/**
 * 标记是否是位域
 * 
 * @param bits bit 位数 
 */
declare function bit(bits: number): (...args: any[]) => void

/**
 * 标记为内联函数
 * 
 */
declare function inline(...args: any[]): any

/**
 * 标记为可编译成同步函数
 */
declare function deasync(...args: any[]): any

declare type defined<T extends string> = `defined(${T})`

declare type moduleId<T extends string> = `moduleId(${T})`

/**
 * & 取地址
 */
declare function addressof<T>(struct: T): T extends any[] ? pointer<UnwrapArray<T>> : pointer<T>

/**
 * \* 解引用（访问指针）
 */
declare function accessof<T extends (IsBuiltinType<T> extends true ? never : anyptr)>(pointer: T): UnwrapPointer<T>

/**
 * 获取 struct 属性偏移
 */
declare function offsetof<T extends new (init?: Partial<{}>) => any>(
  struct: T,
  key: T extends new (init?: Partial<{}>) => infer U ? keyof U : never
): uint32

/**
 * 返回 type 大小
 */
declare function sizeof(type: any): size
/**
 * - 任意指针之间转换
 * - uint32 和指针之间转换
 * - 任意 builtin 类型之间转换，只做编译时类型转换，运行时可能不安全（需要自己确保安全）
 *   - int8 -> int32 是安全的， int64 -> int32 是不安全的
 *   - uint8 -> int16 是安全的，uint8 -> int8 可能是不安全的
 *   
 */
declare function reinterpret_cast<T extends (anyptr | BuiltinType)>(target: anyptr | BuiltinType): T
/**
 * 基本类型之间强转
 */
declare function static_cast<T extends BuiltinType>(target: BuiltinType): T

/**
 * 汇编模板标签
 * 
 * @param template 
 */
declare function asm(template: TemplateStringsArray, ...exps: any[]): string

/**
 * 创建结构体实例
 * 
 * @param struct 
 * @param init 
 */
declare function make<T extends {}, args=[T]>(): T
declare function make<T extends {}, args=[T]>(init: Partial<SetOmitFunctions<T>>): T

declare type deleter<T> = (p: pointer<T>) => void

declare interface SharedPtrTransferable<T> {
  readonly buffer: ArrayBuffer
}
declare type SharedPtr<T extends (BuiltinType | {})> = {
  /**
   * 获取原始指针
   */
  get(): pointer<T>
  /**
   * 重置原始指针
   * 
   * @param value 
   */
  reset(value?: pointer<T>): void
  /**
   * 返回当前的原始指针是否只有一个引用
   */
  unique(): boolean

  /**
   * 返回当前的引用计数
   */
  useCount(): int32

  /**
   * 是否有原始指针
   */
  has(): boolean

  /**
   * 将智能指针转为可转移
   */
  transferable(): SharedPtrTransferable<T>

  /**
   * 克隆智能指针（增加引用计数）
   * 
   * @returns 
   */
  clone(): SharedPtr<T>
} & SetOmitFunctions<T> & { zzztype__?: 'SharedPtr' }

declare function makeSharedPtr<T extends BuiltinType, args=[T]>(): SharedPtr<T>
declare function makeSharedPtr<T extends BuiltinType, args=[T]>(deleter: deleter<T>): SharedPtr<T>
declare function makeSharedPtr<T extends BuiltinType, args=[T, undefined, true]>(value: pointer<T>): SharedPtr<T>
declare function makeSharedPtr<T extends BuiltinType, args=[T]>(value: T): SharedPtr<T>
declare function makeSharedPtr<T extends BuiltinType, args=[T, true]>(value: pointer<T>, deleter: deleter<T>): SharedPtr<T>
declare function makeSharedPtr<T extends BuiltinType, args=[T]>(value: T, deleter: deleter<T>): SharedPtr<T>

declare function makeSharedPtr<T extends {}, args=[T]>(): SharedPtr<T>
declare function makeSharedPtr<T extends {}, args=[T]>(deleter: deleter<T>): SharedPtr<T>
declare function makeSharedPtr<T extends {}, args=[T]>(init: Partial<SetOmitFunctions<T>>): SharedPtr<T>
declare function makeSharedPtr<T extends {}, args=[T]>(init: pointer<T>): SharedPtr<T>
declare function makeSharedPtr<T extends {}, args=[T]>(init: T): SharedPtr<T>
declare function makeSharedPtr<T extends {}, args=[T]>(init: pointer<T>, deleter: deleter<T>): SharedPtr<T>
declare function makeSharedPtr<T extends {}, args=[T]>(init: T, deleter: deleter<T>): SharedPtr<T>
declare function makeSharedPtr<T extends {}, args=[T]>(init: Partial<SetOmitFunctions<T>>, deleter: deleter<T>): SharedPtr<T>

/**
 * 销毁结构体实例
 * 
 * @param target 
 */
declare function unmake<T extends Object>(target: T): void

/**
 * 申请大小为 size 字节的内存
 * 分配的地址以 8 字节对齐
 * 
 * @param size 
 */
declare function malloc(size: size): pointer<void>

/**
 * 分配一块指定数量的内存，并将其初始化为零
 * 
 * @param num 要分配的元素数量
 * @param size 每个元素的大小（以字节为单位）
 */
declare function calloc(num: size, size: size): pointer<void>

/**
 * 重新调整已分配内存块的大小
 * 
 * @param address 已分配内存块的指针
 * @param size 调整的内存块的新大小（以字节为单位）
 */
declare function realloc(address: pointer<void>, size: size): pointer<void>

/**
 * 堆上分配一块对齐的内存块
 * 
 * @param alignment 内存对齐的要求
 * @param size 分配的内存块的大小（以字节为单位）
 */
declare function aligned_alloc(alignment: size, size: size): pointer<void>

/**
 * 释放指定地址的内存
 * 
 * @param address 
 */
declare function free(address: pointer<void>): void

/**
 * 转移 struct 所有权
 * 
 * @param struct 
 */
declare function move<T>(struct: T): pointer<T>

/**
 * 断言
 * 
 * @param condition 条件
 * @param msg 当失败时打印的错误消息
 */
declare function assert(condition: any, msg?: string): void

declare interface Window {
  CHeap: {
    initThread?: (options: {
      memory: WebAssembly.Memory
      stackPointer?: number
      stackSize?: number
      name?: string
      disableAsm?: boolean
      id?: int32
    }) => Promise<void>
    Allocator?: {
      /**
       * 分配一个长度是 size 的一段内存
       * 
       * @param size 
       */
      malloc(size: size): pointer<void>

      /**
       * 分配一块指定数量的内存，并将其初始化为零
       * 
       * @param num 要分配的元素数量
       * @param size 每个元素的大小（以字节为单位）
       */
      calloc(num: size, size: size): pointer<void>

      /**
       * 重新调整已分配内存块的大小
       * 
       * @param address 已分配内存块的指针
       * @param size 调整的内存块的新大小（以字节为单位）
       */
      realloc(address: pointer<void>, size: size): pointer<void>

      /**
       * 堆上分配一块对齐的内存块
       * 
       * @param alignment 内存对齐的要求
       * @param size 分配的内存块的大小（以字节为单位）
       */
      alignedAlloc(alignment: size, size: size): pointer<void>

      /**
       * 释放指定地址的内存
       * 
       * @param address 
       */
      free(address: pointer<void>): void

      /**
       * 判断给定地址是否已经被分配
       * 
       * @param pointer 
       */
      isAlloc(pointer: pointer<void>): boolean

      /**
       * 给出指定地址分配的内存大小
       * 
       * @param address 
       */
      sizeof(address: int32): size
    },
    Table?: {
      getPointer(): number
      alloc(count: number): number
      free(pointer: number): void
      get<T extends (...args: any[]) => any>(index: pointer<T>): T
      set<T extends (...args: any[]) => any>(index: number, value: T): void
    }
    ThreadId?: number
    ThreadName?: string
    Memory?: WebAssembly.Memory
    StackSize?: int32
    StackTop?: int32
    StackPointer?: WebAssembly.Global<keyof WebAssembly.ValueTypeMap>
    Config?: Record<string, any>

    threadCounter?: pointer<void>
    heapMutex?: pointer<void>
    isMainThread: boolean
  }
  __SELF_THREAD__: pointer<void>
}

interface Function {
  transfer?: Transferable[]
}
