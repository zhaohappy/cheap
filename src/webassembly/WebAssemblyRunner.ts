/* eslint-disable camelcase */

import { Memory, StackPointer, Table, allocThreadId, StackTop } from '../heap'
import { memcpy, memset } from '../std/memory'
import { fd_fdstat_get, fd_write, abort, random_get, clock_time_get, clock_res_get, environ_get, environ_sizes_get } from './runtime/clib'
import type { WebAssemblyResource } from './compiler'
import * as atomics from './runtime/atomic'
import * as pthread from './runtime/pthread'
import * as semaphore from './runtime/semaphore'
import * as config from '../config'
import * as atomicsUtils from '../thread/atomics'
import * as atomicAsm from '../thread/asm/atomics'
import * as libcAsm from './runtime/asm/libc'
import { BuiltinTableSlot } from '../allocator/Table'

import * as threadAsm from './runtime/asm/thread'
import type { ChildThread } from './thread'
import { Pthread, PthreadFlags, PthreadStatus } from './thread'
import { ThreadDescriptor } from './thread'
import ThreadPool from './ThreadPool'
import * as cond from '../thread/cond'
import * as mutex from '../thread/mutex'
import runThread from './runThread'
import { SELF } from '@libmedia/common/constant'
import sourceLoad from '@libmedia/common/sourceLoad'
import { is, object, support, array, logger } from '@libmedia/common'
if (defined(ENV_NODE) && !defined(ENV_CJS)) {
  // @ts-ignore
  import { Worker as Worker_ } from 'worker_threads'
  // @ts-ignore
  import fs from 'fs'
  // @ts-ignore
  import path from 'path'
  // @ts-ignore
  import { fileURLToPath } from 'url'
}


export type WebAssemblyRunnerOptions = {
  imports?: Record<string, Record<string, WebAssembly.ImportValue>>
  exportMap?: Record<string, string>
  importMap?: Record<string, string>
  envKey?: string
  childImports?: string | Blob
  memoryBase?: number
  tableBase?: number
  thread?: pointer<Pthread>
  threadDescriptor?: pointer<ThreadDescriptor>
}

let Worker: new (url: string | URL) => Worker = SELF.Worker
if (defined(ENV_NODE)) {
  if (defined(ENV_CJS)) {
    const { Worker: Worker_ } = require('worker_threads')
    Worker = Worker_
  }
  else {
    Worker = Worker_ as any
  }
}

function emptyFunction() {}

let atomicAsmOverride = false

export default class WebAssemblyRunner {

  static getTable() {
    return Table
  }

  static mutexLock(mux: pointer<mutex.Mutex>) {
    mutex.lock(mux)
  }

  static mutexUnlock(mux: pointer<mutex.Mutex>) {
    mutex.unlock(mux)
  }

  static condWait(cnd: pointer<cond.Cond>, mux: pointer<mutex.Mutex>) {
    cond.wait(cnd, mux)
  }

  static readPointer(p: pointer<pointer<void>>) {
    return accessof(p)
  }

  static writePointer(p: pointer<pointer<void>>, v: pointer<void>) {
    accessof(p) <- v
  }

  private resource: WebAssemblyResource

  /**
   * WebAssembly runtime 实例
   */
  private instance: WebAssembly.Instance

  /**
   * 配置项
   */
  protected options: WebAssemblyRunnerOptions

  private builtinMalloc: pointer<void>[]

  private memoryBase: pointer<void>

  private tableBase: pointer<void>

  private childImports: string
  private childUrl: string | URL
  private childImportUrl: URL
  private childBlob: Blob

  private childThreads: Map<int32, ChildThread>

  private imports: Record<string, any>

  private childReadyPromises: Promise<void>[]

  private threadPool: ThreadPool

  private initCalling: boolean

  private promisingMap: Map<string, Function>

  constructor(resource: WebAssemblyResource, options: WebAssemblyRunnerOptions = {}) {

    this.resource = resource
    this.builtinMalloc = []
    this.initCalling = false

    this.childThreads = new Map()
    this.childReadyPromises = []
    this.promisingMap = new Map()

    if (is.string(options.childImports)) {
      this.childImports = options.childImports
    }
    else if (is.object(options.childImports) && options.childImports instanceof Blob) {
      this.childImports = URL.createObjectURL(options.childImports)
    }

    this.memoryBase = resource.dataSize ? aligned_alloc(resource.dataAlign ?? 8, resource.dataSize) : nullptr
    if (this.memoryBase && resource.bssSize) {
      memset(this.memoryBase + ((resource.dataSize - resource.bssSize) as uint32), 0, resource.bssSize)
    }

    // 子线程的 tableBase 需要和父线程一致
    if (options.thread && options.tableBase) {
      if (Table.getPointer() !== options.tableBase) {
        Table.alloc(options.tableBase - Table.getPointer())
      }
    }
    this.tableBase = resource.tableSize ? Table.alloc(resource.tableSize) : nullptr

    this.options = options

    this.imports = {
      env: {
        memory: Memory,
        __stack_pointer: StackPointer,
        __indirect_function_table: Table.table,

        clock_time_get: clock_time_get,
        clock_res_get: clock_res_get,
        random_get: random_get,

        abort: abort,
        proc_exit: function (exitCode: number) {
          logger.error(`wasm module exit, code: ${exitCode}`)
        },
        __syscall_renameat: emptyFunction,
        __syscall_unlinkat: emptyFunction,

        environ_get: environ_get,
        environ_sizes_get: environ_sizes_get,

        fd_close: emptyFunction,
        fd_fdstat_get: fd_fdstat_get,
        fd_read: emptyFunction,
        fd_seek: emptyFunction,
        fd_write: fd_write,

        emscripten_builtin_malloc: (size: size) => {
          const p = malloc(size)
          this.builtinMalloc.push(p)
          return p
        },

        emscripten_builtin_free: (pointer: pointer<void>) => {
          free(pointer)
        },

        emscripten_builtin_memalign: (memptr: pointer<pointer<void>>, alignment: size, size: size) => {
          const address = aligned_alloc(alignment, size)
          if (address !== nullptr) {
            accessof(memptr) <- address
            this.builtinMalloc.push(address)
            return 0
          }
          return -1
        },

        emscripten_memcpy_big: function (dest: pointer<void>, src: pointer<void>, num: size) {
          memcpy(dest, src, num)
        },

        __libc_malloc: function (size: size) {
          return malloc(size)
        },
        __libc_free: (pointer: pointer<void>) => {
          free(pointer)
        },
        malloc: (size: size) => {
          if (this.initCalling === true) {
            const p = malloc(size)
            this.builtinMalloc.push(p)
            return p
          }
          return malloc(size)
        },
        calloc: function (num: size, size: size) {
          return calloc(num, size)
        },
        realloc: function (pointer: pointer<void>, size: size) {
          return realloc(pointer, size)
        },
        aligned_alloc(alignment: size, size: size): pointer<void> {
          return aligned_alloc(alignment, size)
        },
        free: function (pointer: pointer<void>) {
          free(pointer)
        },
        posix_memalign: function (memptr: pointer<pointer<void>>, alignment: size, size: size) {
          const address = aligned_alloc(alignment, size)
          if (address !== nullptr) {
            accessof(memptr) <- address
            return 0
          }
          return -1
        },
        memalign: function (alignment: size, size: size) {
          return aligned_alloc(alignment, size)
        }
      },
      'GOT.func': {
        malloc: new WebAssembly.Global({ mutable: true, value: defined(WASM_64) ? 'i64' : 'i32' }, reinterpret_cast<pointer<void>>(BuiltinTableSlot.MALLOC)),
        calloc: new WebAssembly.Global({ mutable: true, value: defined(WASM_64) ? 'i64' : 'i32' }, reinterpret_cast<pointer<void>>(BuiltinTableSlot.CALLOC)),
        realloc: new WebAssembly.Global({ mutable: true, value: defined(WASM_64) ? 'i64' : 'i32' }, reinterpret_cast<pointer<void>>(BuiltinTableSlot.REALLOC)),
        aligned_alloc: new WebAssembly.Global({ mutable: true, value: defined(WASM_64) ? 'i64' : 'i32' }, reinterpret_cast<pointer<void>>(BuiltinTableSlot.ALIGNED_ALLOC)),
        free: new WebAssembly.Global({ mutable: true, value: defined(WASM_64) ? 'i64' : 'i32' }, reinterpret_cast<pointer<void>>(BuiltinTableSlot.FREE))
      }
    }

    if (defined(ENABLE_THREADS)) {
      const createPthread = (thread: pointer<Pthread>, attr: pointer<void>, func: pointer<((args: pointer<void>) => void)>, args: pointer<void>) => {
        if (this.threadPool && this.threadPool.hasFree()) {
          this.threadPool.createThread(thread, attr, func, args)
          return 0
        }

        if (!this.childUrl) {
          this.createChildUrl()
        }

        const worker = new Worker(this.childUrl)

        thread.id = allocThreadId()
        thread.status = PthreadStatus.RUN
        thread.flags = 0
        thread.retval = nullptr

        const stackPointer = aligned_alloc(config.STACK_ALIGNMENT, config.STACK_SIZE)

        const threadDescriptor = reinterpret_cast<pointer<ThreadDescriptor>>(malloc(sizeof(ThreadDescriptor)))
        memset(threadDescriptor, 0, sizeof(ThreadDescriptor))

        this.childThreads.set(thread.id, {
          thread,
          worker,
          stackPointer,
          threadDescriptor
        })

        let resolve: (ret: int32) => void
        const promise = new Promise<int32>((r) => {
          resolve = r
        })
        if (!support.jspi) {
          this.childReadyPromises.push(promise as unknown as Promise<void>)
        }

        const handler = (message) => {
          const origin = defined(ENV_NODE) ? message : message.data
          const type = origin.type
          const data = origin.data

          switch (type) {
            case 'run':
              resolve(0)
              break
          }
        }

        if (defined(ENV_NODE)) {
          // @ts-ignore
          worker.on('message', handler)
        }
        else {
          worker.onmessage = handler
        }

        if (this.childImportUrl) {
          worker.postMessage({
            type: 'import',
            data: {
              url: this.childImportUrl.href
            }
          })
        }

        /**
         * postMessage 并不是同步的，而是在事件循环中处理的
         * 因此父线程不能被阻塞在当前的事件循环中，否则子线程无法成功运行
         * 只有 childReadyPromises 中的 Promise 都 resolve 了之后才能阻塞
         */
        worker.postMessage({
          type: 'run',
          data: {
            cheap: {
              memory: Memory,
              stackPointer,
              stackSize: config.STACK_SIZE,
              id: thread.id
            },
            runner: {
              resource: {
                tableSize: this.resource.tableSize,
                module: this.resource.threadModule.module,
                initFuncs: this.resource.threadModule.initFuncs
              },
              options: {
                memoryBase: this.options.memoryBase || this.memoryBase,
                tableBase: this.tableBase,
                thread,
                threadDescriptor,
                childImports: this.childImports
              },
              func,
              args,
              imports: this.childImports,
              thread
            }
          }
        })

        return support.jspi ? promise : 0
      }

      object.extend(this.imports.env, {
        wasm_pthread_create: support.jspi ? new WebAssembly.Suspending(createPthread) : createPthread,

        wasm_pthread_join2: (thread: pointer<Pthread>, retval: pointer<pointer<void>>) => {

          if (this.threadPool && this.threadPool.isPoolThread(thread)) {
            this.threadPool.joinThread(thread, retval)
            return 0
          }

          if (thread.flags & PthreadFlags.DETACH) {
            this.childThreads.delete(thread.id)
            return 0
          }
          // 等待子线程退出
          atomicsUtils.wait(addressof(thread.status), PthreadStatus.RUN)

          if (retval !== nullptr) {
            accessof(retval) <- thread.retval
          }

          const child = this.childThreads.get(thread.id)

          // 回收栈
          free(child.stackPointer)
          free(child.threadDescriptor)

          child.worker.terminate()

          this.childThreads.delete(thread.id)

          memset(thread, 0, sizeof(Pthread))
          return 0
        },

        wasm_pthread_detach2: (thread: pointer<Pthread>) => {
          if (this.threadPool && this.threadPool.isPoolThread(thread)) {
            this.threadPool.detachThread(thread)
            return 0
          }
          const child = this.childThreads.get(thread.id)
          child.threadDescriptor.flags |= PthreadFlags.DETACH
          thread.flags |= PthreadFlags.DETACH
        }
      })
      object.extend(this.imports.env, atomics)
      object.extend(this.imports.env, pthread)
      object.extend(this.imports.env, semaphore)
    }

    if (this.memoryBase) {
      object.extend(this.imports.env, {
        __memory_base: this.memoryBase
      })
    }
    // 使用父线程的 memoryBase
    else if (options.memoryBase) {
      object.extend(this.imports.env, {
        __memory_base: options.memoryBase
      })
    }
    if (this.tableBase) {
      object.extend(this.imports.env, {
        __table_base: this.tableBase
      })
    }

    if (options.imports?.env) {
      object.extend(this.imports.env, options.imports.env)
      if (options.envKey && options.importMap) {
        const env: Record<string, WebAssembly.ImportValue> = {}
        object.each(this.imports.env, (value, key) => {
          if (options.importMap[key]) {
            env[options.importMap[key]] = value
          }
        })
        this.imports[options.envKey] = env
      }
    }
    this.imports['wasi_snapshot_preview1'] = this.imports.env
  }

  private createChildUrl() {
    if (defined(ENABLE_THREADS)) {
      let source = ''
      let staticImport = ''
      if (defined(ENV_WEBPACK) && !defined(ENV_NODE) && !defined(ENV_CSP)) {
        // 保证打包工具包含下面的模块代码
        require('./runThread')
        const module = sourceLoad(require.resolve('./WebAssemblyRunner.ts'), {
          varName: '__WebAssemblyRunner__',
          exportName: '__WebAssemblyRunner__',
          pointName: WebAssemblyRunner.name,
          exportIsClass: true
        })
        const runThread = defined(ENABLE_THREADS) ? sourceLoad(require.resolve('./runThread'), {
          varName: 'runThread'
        }) : null

        let childImports = ''
        let cheapPolyfillUrl = ''
        if (defined(ENV_NODE)) {
          if (this.childImports) {
            childImports = `Object.assign(self.imports.env, require(${this.childImports}).env)`
          }
        }
        else {
          if (this.childImports) {
            childImports = `importScripts('${this.childImports}');`
          }
          if ((SELF as any).CHEAP_POLYFILL_URL) {
            cheapPolyfillUrl = `importScripts('${(SELF as any).CHEAP_POLYFILL_URL}');`
          }
        }

        source = `
          ${module}
          ${runThread}
          self.imports = {env:{}};
          ${cheapPolyfillUrl}
          ${childImports}
          runThread.default();
        `
      }
      else if (defined(ENV_NODE) || !defined(ENV_CSP)) {
        let WebAssemblyRunnerWorkerUrl = ''
        let childImports = ''
        let cheapPolyfillUrl = ''
        if (defined(ENV_NODE)) {
          if (this.childImports) {
            childImports = `Object.assign(self.imports.env, require(${this.childImports}).env)`
          }
          if (!defined(ENV_CJS)) {
            staticImport = `
              import WebAssemblyRunnerClass_ from './WebAssemblyRunner.js'
              import { parentPort as parentPort_ } from 'worker_threads'
            `
          }
        }
        else {
          // @ts-ignore
          WebAssemblyRunnerWorkerUrl = `importScripts('${defined(USE_WORKER_SELF_URL) ? self.location.href : new URL('./WebAssemblyRunnerWorker.js', import.meta.url)}');`
          if (this.childImports) {
            childImports = `importScripts('${this.childImports}');`
          }
          if ((SELF as any).CHEAP_POLYFILL_URL) {
            cheapPolyfillUrl = `importScripts('${(SELF as any).CHEAP_POLYFILL_URL}');`
          }
        }
        source = `
          ${staticImport}
          var self = typeof self !== 'undefined' ? self : (typeof globalThis !== 'undefined' ? globalThis : window)
          self.CHEAP_HEAP_INITIAL = ${(SELF as any).CHEAP_HEAP_INITIAL}
          self.CHEAP_HEAP_MAXIMUM = ${(SELF as any).CHEAP_HEAP_MAXIMUM}

          self.imports = {env:{}};
          ${cheapPolyfillUrl}
          ${WebAssemblyRunnerWorkerUrl}
          ${childImports}

          (${runThread.toString()})();
        `
      }
      if (defined(ENV_NODE)) {
        if (defined(ENV_CJS)) {
          const path = require('path')
          const fs = require('fs')
          this.childUrl = path.join(__dirname, '.__node__WebAssemblyRunnerWorker.cjs')
          if (!fs.existsSync(this.childUrl)) {
            fs.writeFileSync(this.childUrl, source)
          }
        }
        else {
          // @ts-ignore
          const __filename = fileURLToPath(import.meta.url)
          const __dirname = path.dirname(__filename)
          this.childUrl = path.join(__dirname, '.__node__WebAssemblyRunnerWorker.js')
          if (!fs.existsSync(this.childUrl)) {
            fs.writeFileSync(this.childUrl, source)
          }
        }
      }
      else if (defined(ENV_CSP)) {
        // @ts-ignore
        this.childUrl = new URL('./threadEntry.js', import.meta.url)
        // @ts-ignore
        this.childImportUrl = new URL('./WebAssemblyRunnerWorker.js', import.meta.url)
      }
      else {
        this.childBlob = new Blob([source], { type: 'text/javascript' })
        this.childUrl = URL.createObjectURL(this.childBlob)
      }
    }
  }

  private overrideAtomic() {
    atomics.override({
      atomic_add_i8: atomicAsm.instance.exports.add8 as any,
      atomic_sub_i8: atomicAsm.instance.exports.sub8 as any,
      atomic_and_i8: atomicAsm.instance.exports.and8 as any,
      atomic_or_i8: atomicAsm.instance.exports.or8 as any,
      atomic_xor_i8: atomicAsm.instance.exports.xor8 as any,
      atomic_store_i8: atomicAsm.instance.exports.store8 as any,
      atomic_load_i8: atomicAsm.instance.exports.load8 as any,
      atomic_compare_exchange_i8: atomicAsm.instance.exports.compare_exchange8 as any,
      atomic_exchange_i8: atomicAsm.instance.exports.exchange8 as any,
      atomic_add_i16: atomicAsm.instance.exports.add16 as any,
      atomic_sub_i16: atomicAsm.instance.exports.sub16 as any,
      atomic_and_i16: atomicAsm.instance.exports.and16 as any,
      atomic_or_i16: atomicAsm.instance.exports.or16 as any,
      atomic_xor_i16: atomicAsm.instance.exports.xor16 as any,
      atomic_store_i16: atomicAsm.instance.exports.store16 as any,
      atomic_load_i16: atomicAsm.instance.exports.load16 as any,
      atomic_compare_exchange_i16: atomicAsm.instance.exports.compare_exchange16 as any,
      atomic_exchange_i16: atomicAsm.instance.exports.exchange16 as any,
      atomic_add_i32: atomicAsm.instance.exports.add32 as any,
      atomic_sub_i32: atomicAsm.instance.exports.sub32 as any,
      atomic_and_i32: atomicAsm.instance.exports.and32 as any,
      atomic_or_i32: atomicAsm.instance.exports.or32 as any,
      atomic_xor_i32: atomicAsm.instance.exports.xor32 as any,
      atomic_store_i32: atomicAsm.instance.exports.store32 as any,
      atomic_load_i32: atomicAsm.instance.exports.load32 as any,
      atomic_compare_exchange_i32: atomicAsm.instance.exports.compare_exchange32 as any,
      atomic_exchange_i32: atomicAsm.instance.exports.exchange32 as any,
      atomic_add_i64: atomicAsm.instance.exports.add64 as any,
      atomic_sub_i64: atomicAsm.instance.exports.sub64 as any,
      atomic_and_i64: atomicAsm.instance.exports.and64 as any,
      atomic_or_i64: atomicAsm.instance.exports.or64 as any,
      atomic_xor_i64: atomicAsm.instance.exports.xor64 as any,
      atomic_store_i64: atomicAsm.instance.exports.store64 as any,
      atomic_load_i64: atomicAsm.instance.exports.load64 as any,
      atomic_compare_exchange_i64: atomicAsm.instance.exports.compare_exchange64 as any,
      atomic_exchange_i64: atomicAsm.instance.exports.exchange64 as any,
      atomics_notify: atomicAsm.instance.exports.notify as any,
      atomics_wait: atomicAsm.instance.exports.wait as any
    })
    object.extend(this.imports.env, atomics)
  }

  /**
   * 运行 wasm 实例
   */
  public async run(imports?: Record<string, any>, threadPoolCount?: number) {
    if (is.object(imports)) {
      object.extend(this.options.imports, imports)
    }
    if (!defined(DEBUG)
      && threadAsm.isSupport()
      && this.resource.threadModule
    ) {
      if (!threadAsm.wasmThreadProxy) {
        threadAsm.init(Memory, config.HEAP_INITIAL, config.HEAP_MAXIMUM, pthread.override)
      }
      object.extend(this.imports.env, pthread)
    }
    if (!libcAsm.wasmThreadProxy
      && libcAsm.isSupport()
    ) {
      libcAsm.init(Memory, config.HEAP_INITIAL, config.HEAP_MAXIMUM)
    }
    if (!atomicAsmOverride && atomicAsm.isSupport()) {
      atomicAsmOverride = true
      this.overrideAtomic()
    }
    this.instance = await WebAssembly.instantiate(this.resource.module, this.imports)

    this.initRunTime()

    if (defined(ENABLE_THREADS)
      && this.resource.threadModule
      && this.resource.enableThreadPool
      && threadPoolCount > 0
      && !support.jspi
    ) {
      if (!this.childUrl) {
        this.createChildUrl()
      }

      let count = threadPoolCount
      if (this.resource.enableThreadCountRate) {
        count *= this.resource.enableThreadCountRate
      }

      this.threadPool = new ThreadPool(count, this.childUrl, this.childImportUrl)
      await this.threadPool.ready({
        tableSize: this.resource.tableSize,
        module: this.resource.threadModule.module,
        initFuncs: this.resource.threadModule.initFuncs,
        memoryBase: this.options.memoryBase || this.memoryBase,
        tableBase: this.tableBase,
        childImports: this.childImports
      })
    }
  }

  public runAsChild(imports?: Record<string, any>) {
    if (is.object(imports)) {
      object.extend(this.options.imports, imports)
    }
    if (!defined(DEBUG) && threadAsm.isSupport()) {
      if (!threadAsm.wasmThreadProxy) {
        threadAsm.init(Memory, config.HEAP_INITIAL, config.HEAP_MAXIMUM, pthread.override)
      }
      object.extend(this.imports.env, pthread)
    }
    if (!atomicAsmOverride && atomicAsm.isSupport()) {
      atomicAsmOverride = true
      this.overrideAtomic()
    }
    this.instance = new WebAssembly.Instance(this.resource.module, this.imports)

    this.initRunTime()
  }

  public async childThreadsReady() {
    if (!this.childReadyPromises.length) {
      return
    }
    const promise = this.childReadyPromises
    this.childReadyPromises = []
    await Promise.all(promise)
  }

  private initRunTime() {
    this.builtinMalloc = []
    this.initCalling = true
    if (is.array(this.resource.initFuncs)) {
      array.each(this.resource.initFuncs, (func) => {
        let call: Function
        if (this.asm[func]) {
          call = this.asm[func]
        }
        if (call) {
          return call()
        }
      })
    }
    this.initCalling = false
  }

  /**
   * 调用 wasm 模块暴露的方法
   * 
   * @param func 方法名
   * @param args 参数，只能是 number 和 bigint( 有浏览器版本要求， 建议 64 位数据使用指针传递） 类型，如果是其他类型参数使用指针传递
   */
  public invoke<T extends number | bigint | void = void>(func: string, ...args: (number | bigint)[]): T {
    if (!this.asm) {
      return -1 as T
    }

    let call: Function
    if (this.asm[func]) {
      call = this.asm[func]
    }
    else if (this.options.exportMap && this.options.exportMap[func] && this.asm[this.options.exportMap[func]]) {
      call = this.asm[this.options.exportMap[func]] as Function
    }
    if (call) {
      return call.apply(null, args)
    }
    else {
      logger.error(`the wasm module has not function ${func} to call`)
    }
  }

  /**
   * 异步调用 wasm 模块暴露的方法
   * 
   * 适用于 wasm 内部会调用异步 js 函数的情况
   * 
   * 需要支持 JSPI
   * 
   * @param func 方法名
   * @param args 参数，只能是 number 和 bigint( 有浏览器版本要求， 建议 64 位数据使用指针传递） 类型，如果是其他类型参数使用指针传递
   */
  public async invokeAsync<T extends number | bigint | void = void>(func: string, ...args: (number | bigint)[]): Promise<T> {
    if (!this.asm) {
      return -1 as T
    }
    if (!support.jspi) {
      return this.invoke<T>(func, ...args)
    }

    let call: Function

    if (this.promisingMap.has(func)) {
      call = this.promisingMap.get(func)
    }
    else {
      if (this.asm[func]) {
        call = this.asm[func]
      }
      else if (this.options.exportMap && this.options.exportMap[func] && this.asm[this.options.exportMap[func]]) {
        call = this.asm[this.options.exportMap[func]] as Function
      }
      call = WebAssembly.promising(call as (...args: any[]) => any)
      this.promisingMap.set(func, call)
    }
    if (call) {
      return call.apply(null, args)
    }
    else {
      logger.error(`the wasm module has not function ${func} to call`)
    }
  }

  get asm() {
    return this.instance && this.instance.exports as Object
  }

  public getInstance() {
    return this.instance
  }

  public getChildThreadCount() {
    return this.childThreads.size
  }

  public destroy() {
    if (this.builtinMalloc?.length) {
      array.each(this.builtinMalloc, (pointer) => {
        free(pointer)
      })
      this.builtinMalloc.length = 0
    }

    if (this.memoryBase) {
      free(this.memoryBase)
      this.memoryBase = null
    }

    if (this.tableBase) {
      Table.free(this.tableBase)
      this.tableBase = nullptr
    }

    if (this.childImports) {
      URL.revokeObjectURL(this.childImports)
      this.childImports = null
    }

    if (this.childUrl) {
      if (defined(ENV_NODE)) {
        if (defined(ENV_CJS)) {
          const fs = require('fs')
          fs.unlinkSync(this.childUrl)
        }
        else {
          fs.unlinkSync(this.childUrl)
        }
      }
      else if (is.string(this.childUrl)) {
        URL.revokeObjectURL(this.childUrl)
      }
      this.childUrl = null
    }
    this.childBlob = null
    this.childImportUrl = null
    this.childReadyPromises.length = 0

    if (this.childThreads.size) {
      this.childThreads.forEach((thread, id) => {
        if (!(thread.threadDescriptor.flags & PthreadFlags.DETACH)) {
          logger.warn('has child thread running, maybe resource leakage')
          thread.worker.terminate()
          thread.thread.status = PthreadStatus.STOP
          if (thread.stackPointer) {
            free(thread.stackPointer)
          }
          free(thread.threadDescriptor)
          this.childThreads.delete(id)
        }
      })
    }

    this.builtinMalloc = null
    this.instance = null

    if (this.options.thread) {
      if (this.options.threadDescriptor) {
        this.options.threadDescriptor.status = PthreadStatus.STOP
      }
      if (this.options.threadDescriptor
        && ((this.options.threadDescriptor.flags & PthreadFlags.DETACH)
            || (this.options.thread.flags & PthreadFlags.EXIT)
        )
      ) {
        if (!(this.options.threadDescriptor.flags & PthreadFlags.POOL)) {
          if (StackTop) {
            free(StackTop)
          }
          free(this.options.threadDescriptor)
          memset(this.options.thread, 0, sizeof(Pthread))
          self.close()
        }
      }
      else {
        this.options.thread.status = PthreadStatus.STOP
        // 唤醒父线程收回资源
        atomicsUtils.notify(addressof(this.options.thread.status), 1)
      }
    }

    if (defined(ENABLE_THREADS)) {
      if (this.threadPool) {
        this.threadPool.destroy()
      }
      this.threadPool = null
    }

    if (this.promisingMap) {
      this.promisingMap.clear()
      this.promisingMap = null
    }
  }
}
