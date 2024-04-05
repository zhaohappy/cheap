/* eslint-disable camelcase */

import * as object from 'common/util/object'
import * as array from 'common/util/array'
import * as logger from 'common/util/logger'
import * as is from 'common/util/is'
import { Memory, StackPointer, Table, allocThreadId, StackTop } from '../heap'
import { memcpy, memset } from '../std/memory'
import { environGet, environSizesGet, fdClose, fdFdstatGet,
  fdRead, fdSeek, fdWrite, abort, emscriptenDateNow
} from './runtime/clib'
import { WebAssemblyResource } from './compiler'
import * as atomics from './runtime/atomic'
import * as pthread from './runtime/pthread'
import * as semaphore from './runtime/semaphore'
import sourceLoad from 'common/function/sourceLoad'
import * as config from '../config'
import * as atomicsUtils from '../thread/atomics'
import * as atomicAsm from '../thread/asm/atomics'

import * as threadAsm from './runtime/asm/thread'
import isWorker from 'common/function/isWorker'
import { Pthread, PthreadFlags, PthreadStatus } from './runtime/pthread'

export type WebAssemblyRunnerOptions = {
  imports?: Record<string, Record<string, WebAssembly.ImportValue>>,
  exportMap?: Record<string, string>
  importMap?: Record<string, string>
  envKey?: string
  childImports?: string | Blob
  memoryBase?: number
  tableBase?: number
  thread?: pointer<Pthread>
  threadDescriptor?: pointer<ThreadDescriptor>
}

type ChildThread = {
  thread: pointer<Pthread>
  worker: Worker
  stackPointer: uint32
  threadDescriptor: pointer<ThreadDescriptor>
}

if (defined(ENABLE_THREADS)) {
  // 保证打包工具包含下面的模块代码
  require('./runThread')
}

const runThread = defined(ENABLE_THREADS) ? sourceLoad(require.resolve('./runThread'), {
  varName: 'init'
}) : null

let atomicAsmOverride = false

@struct
class ThreadDescriptor {
  flags: int32
}

export default class WebAssemblyRunner {

  static getTable() {
    return Table
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

  private memoryBase: number

  private tableBase: number

  private childImports: string
  private childUrl: string
  private childBlob: Blob

  private childThreads: Map<int32, ChildThread>

  private imports: Record<string, any>

  private childReadyPromises: Promise<void>[]

  constructor(resource: WebAssemblyResource, options: WebAssemblyRunnerOptions = {}) {

    this.resource = resource
    this.builtinMalloc = []

    this.childThreads = new Map()
    this.childReadyPromises = []

    if (is.string(options.childImports)) {
      this.childImports =  options.childImports
    }
    else if (is.object(options.childImports) && options.childImports instanceof Blob) {
      this.childImports = URL.createObjectURL(options.childImports)
    }

    this.memoryBase = resource.dataSize ? malloc(resource.dataSize) : 0

    // 子线程的 tableBase 需要和父线程一致
    if (options.thread && options.tableBase) {
      if (Table.getPointer() !== options.tableBase) {
        Table.alloc(options.tableBase - Table.getPointer())
      }
    }
    this.tableBase = resource.tableSize ? Table.alloc(resource.tableSize) : 0

    this.options = options

    this.imports = {
      env: {
        memory: Memory,
        __stack_pointer: StackPointer,
        __indirect_function_table: Table.table,

        clock_time_get: (type: number, b: number, ptime: number) => {
          return 0
        },

        abort: abort,
        environ_get: environGet,
        environ_sizes_get: environSizesGet,
        emscripten_date_now: emscriptenDateNow,
        proc_exit: function (exitCode: number) {
          logger.error(`wasm module exit, code: ${exitCode}`)
        },

        fd_close: fdClose,
        fd_fdstat_get: fdFdstatGet,
        fd_read: fdRead,
        fd_seek: fdSeek,
        fd_write: fdWrite,

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
        malloc: function (size: size) {
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
        }
      }
    }

    if (defined(ENABLE_THREADS)) {
      object.extend(this.imports.env, {
        wasm_pthread_create: (thread: pointer<Pthread>, attr: pointer<void>, func: pointer<((args: pointer<void>) => void)>, args: pointer<void>) => {
          if (!this.childUrl) {
            const module = sourceLoad(require.resolve('./WebAssemblyRunner.ts'), {
              varName: '__WebAssemblyRunner__',
              exportName: '__WebAssemblyRunner__',
              pointName: WebAssemblyRunner.name,
              exportIsClass: true
            })
            const source = `
              ${module}
              ${runThread}
              var preRun;
              ${this.childImports ? `
              preRun = import('${this.childImports}')
              ` : ''}
              init.default(preRun);
            `
            this.childBlob = new Blob([source], { type: 'text/javascript' })
            this.childUrl = URL.createObjectURL(this.childBlob)
          }

          const worker = new Worker(this.childUrl)

          thread.id = allocThreadId()
          thread.status = PthreadStatus.RUN
          thread.flags = 0
          thread.retval = 0

          const stackPointer = aligned_alloc(config.STACK_ALIGNMENT, config.STACK_SIZE)

          const threadDescriptor = malloc(sizeof(ThreadDescriptor))
          memset(threadDescriptor, 0, sizeof(ThreadDescriptor))

          this.childThreads.set(thread.id, {
            thread,
            worker,
            stackPointer,
            threadDescriptor
          })

          let resolve: () => void

          this.childReadyPromises.push(new Promise((r) => {
            resolve = r
          }))

          worker.onmessage = (message) => {
            const origin = message.data
            const type = origin.type
            const data = origin.data

            switch (type) {
              case 'run':
                resolve()
                break
            }
          }

          /**
           * postMessage 并不是同步的，而是在事件循环中处理的
           * 因此父线程不能被阻塞在当前的时间片中，否则子线程无法成功运行
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
          return 0
        },

        wasm_pthread_join2: (thread: pointer<Pthread>, retval: pointer<pointer<void>>) => {
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

          return 0
        },

        wasm_pthread_detach2: (thread: pointer<Pthread>) => {
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
  public async run(imports?: Record<string, any>) {
    if (is.object(imports)) {
      object.extend(this.options.imports, imports)
    }
    if (!defined(DEBUG)
      && isWorker()
      && !threadAsm.wasmThreadProxy
      && threadAsm.isSupport()
      && this.resource.threadModule
    ) {
      await threadAsm.init(Memory, pthread.override)
      object.extend(this.imports.env, pthread)
    }
    if (!atomicAsmOverride && atomicAsm.isSupport()) {
      atomicAsmOverride = true
      this.overrideAtomic()
    }
    this.instance = await WebAssembly.instantiate(this.resource.module, this.imports)

    this.initRunTime()
  }

  public async runAsChild(imports?: Record<string, any>) {
    if (is.object(imports)) {
      object.extend(this.options.imports, imports)
    }
    if (!defined(DEBUG) && !threadAsm.wasmThreadProxy && threadAsm.isSupport()) {
      await threadAsm.init(Memory, pthread.override)
      object.extend(this.imports.env, pthread)
    }
    if (!atomicAsmOverride && atomicAsm.isSupport()) {
      atomicAsmOverride = true
      this.overrideAtomic()
    }
    this.instance = new WebAssembly.Instance(this.resource.module, this.imports)

    this.initRunTime()
  }

  public async childrenThreadReady() {
    if (!this.childReadyPromises.length) {
      return
    }
    const promise = this.childReadyPromises
    this.childReadyPromises = []
    await Promise.all(promise)
  }

  private initRunTime() {
    this.builtinMalloc = []
    if (is.array(this.resource.initFuncs)) {
      array.each(this.resource.initFuncs, (func) => {
        this.call(func)
      })
    }
  }

  /**
   * 调用 wasm 模块暴露的方法
   * 
   * @param func 方法名
   * @param args 参数，只能是 number 和 bigint( 有浏览器版本要求， 建议 64 位数据使用指针传递） 类型，如果是其他类型参数使用指针传递
   */
  public call<T extends number | bigint | void = void>(func: string, args?: (number | bigint)[]): T  {
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

  get asm() {
    return this.instance && this.instance.exports as Object
  }

  public getInstance() {
    return this.instance
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
      this.tableBase = null
    }

    if (this.childImports) {
      URL.revokeObjectURL(this.childImports)
      this.childImports = null
    }

    if (this.childUrl) {
      URL.revokeObjectURL(this.childUrl)
      this.childUrl = null
    }
    this.childBlob = null
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
      if (this.options.threadDescriptor && this.options.threadDescriptor.flags & PthreadFlags.DETACH) {
        if (StackTop) {
          free(StackTop)
        }
        free(this.options.threadDescriptor)
        self.close()
      }
      else {
        this.options.thread.status = PthreadStatus.STOP
        // 唤醒父线程收回资源
        atomicsUtils.notify(addressof(this.options.thread.status), 1)
      }
    }
  }
}
