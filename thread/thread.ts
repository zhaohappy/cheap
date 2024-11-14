import { PromiseType, RemoveNeverProperties } from 'common/types/advanced'
import IPCPort from 'common/network/IPCPort'
import NodeIPCPort from 'common/network/NodeIPCPort'
import { Memory } from '../heap'
import sourceLoad from 'common/function/sourceLoad'
import * as config from '../config'
import * as is from 'common/util/is'
import { SELF } from 'common/util/constant'
import generateUUID from 'common/function/generateUUID'
import toString from 'common/function/toString'
import align from 'common/math/align'

// @ts-ignore
let Worker: new (url: string) => Worker = SELF.Worker
// @ts-ignore
let MessageChannel: new () => MessageChannel = SELF.MessageChannel

if (defined(ENV_NODE)) {
  const { Worker: Worker_, MessageChannel: MessageChannel_ } = require('worker_threads')
  Worker = Worker_
  MessageChannel = MessageChannel_
}

if (defined(ENABLE_THREADS) && defined(ENV_WEBPACK)) {
  // 保证打包工具可以包含下面的模块代码
  require('./initClass')
  require('./initFunction')
  require('./initModule')
}

const initClass = (defined(ENABLE_THREADS) && defined(ENV_WEBPACK)) ? sourceLoad(require.resolve('./initClass'), {
  varName: 'init'
}) : null
const initFunction = (defined(ENABLE_THREADS) && defined(ENV_WEBPACK)) ? sourceLoad(require.resolve('./initFunction'), {
  varName: 'init'
}) : null
const initModule = (defined(ENABLE_THREADS) && defined(ENV_WEBPACK)) ? sourceLoad(require.resolve('./initModule'), {
  varName: 'init'
}) : null

const symbolRevoke = Symbol('revoke')

type AsyncReturnWithoutProperties<T> = RemoveNeverProperties<{
  [K in keyof T]: T[K] extends (...args: any[]) => any
    ? (T[K] extends (...args: any[]) => Promise<any>
      ? T[K] & {
        transfer: (...transfer: Transferable[]) => { invoke: T[K] }
      }
      : (...args: Parameters<T[K]>) => Promise<ReturnType<T[K]>> ) & {
      transfer: (...transfer: Transferable[]) => { invoke: T[K] }
    }
    : never
}>

type ThreadType = 'class' | 'function' | 'module'

export type Thread<T, U = never> = {
  $worker: Worker
  $ipc?: IPCPort
  $channel?: MessageChannel
  $moduleId: string | Worker
  $stackPointer: pointer<void>
  $retval?: Promise<U>
  $instance?: any
  $type: ThreadType
} & AsyncReturnWithoutProperties<T>

export interface ThreadOptions {
  name?: string
  stackSize?: number
  disableWorker?: boolean
  dispatchToWorker?: boolean
}

const caches: Map<string, {
  url: string
  refCount: number
}> = new Map()

function getCacheKey(moduleId: string, type: ThreadType) {
  return `${moduleId}_${type}`
}

export function createThreadFromClass<T, U extends any[], args=[moduleId<'0'>]>(entity: new (...args: U) => T, options?: ThreadOptions): {
  run: (...args: U) => Promise<Thread<T>>
  transfer: (...transfer: Transferable[]) => {
    run: (...args: U) => Promise<Thread<T>>
  }
}
export function createThreadFromClass<T, U extends any[]>(
  entity: new (...args: U) => T,
  options: ThreadOptions,
  workerize: () => Worker
): {
  run: (...args: U) => Promise<Thread<T>>
  transfer: (...transfer: Transferable[]) => {
    run: (...args: U) => Promise<Thread<T>>
  }
}
export function createThreadFromClass<T, U extends any[]>(
  entity: new (...args: U) => T,
  options: ThreadOptions = {},
  moduleId?: string | (() => Worker)
): {
    run: (...args: U) => Promise<Thread<T>>
    transfer: (...transfer: Transferable[]) => {
      run: (...args: U) => Promise<Thread<T>>
    }
  } {

  let transferData: Transferable[] = []

  let runInWorker: (...args: U) => Promise<Thread<T>>

  if (defined(ENABLE_THREADS)) {
    runInWorker = (...args: U) => {

      let worker: Worker

      if (is.func(moduleId)) {
        worker = moduleId()
      }
      else if (defined(ENV_WEBPACK)) {
        let workerUrl: string
        const cacheKey = getCacheKey(moduleId, 'class')
        if (caches.has(cacheKey)) {
          workerUrl = caches.get(cacheKey).url
          caches.get(cacheKey).refCount++
        }
        else {
          const module = sourceLoad(moduleId, {
            varName: `__module_${entity.name}__`,
            exportName: `__${entity.name}__`,
            pointName: entity.name,
            exportIsClass: true
          })
          const source = `
            self.CHEAP_DISABLE_THREAD = ${(SELF as any).CHEAP_DISABLE_THREAD}
            self.CHEAP_HEAP_INITIAL = ${(SELF as any).CHEAP_HEAP_INITIAL}
            self.CHEAP_HEAP_MAXIMUM = ${(SELF as any).CHEAP_HEAP_MAXIMUM}
            ${module}
            function run(params) {
              params.unshift(null)
              return new (Function.prototype.bind.apply(__module_${entity.name}__.__${entity.name}__, params))()
            }
            ${initClass}
            init.default(run);
          `
          if (defined(ENV_NODE)) {
            workerUrl = `./cheap_${generateUUID()}.js`
            const fs = require('fs')
            fs.writeFileSync(workerUrl, source)
          }
          else {
            const blob = new Blob([source], { type: 'text/javascript' })
            workerUrl = URL.createObjectURL(blob)
          }

          caches.set(cacheKey, {
            url: workerUrl,
            refCount: 1
          })
        }
        worker = new Worker(workerUrl)
      }
      else {
        throw new Error('not support')
      }

      const channel = new MessageChannel()
      return new Promise<Thread<T>>((resolve, reject) => {

        const stackPointer = config.USE_THREADS ? aligned_alloc(
          config.STACK_ALIGNMENT,
          options.stackSize
            ? align(options.stackSize, config.STACK_ALIGNMENT)
            : config.STACK_SIZE
        ) : nullptr

        function running() {
          const ipc = defined(ENV_NODE) ? new NodeIPCPort(channel.port1) : new IPCPort(channel.port1)

          const obj: Thread<T> = {
            $worker: worker,
            $ipc: ipc,
            $channel: channel,
            $moduleId: toString(moduleId),
            $stackPointer: stackPointer,
            $type: 'class'
          } as Thread<T>

          const { proxy, revoke } = Proxy.revocable(obj, {
            get(target, propertyKey, receiver) {
              if (target[propertyKey]) {
                return obj[propertyKey]
              }
              if (propertyKey in entity.prototype && typeof entity.prototype[propertyKey] === 'function') {
                const call = async function (...args: any[]) {
                  return ipc.request(propertyKey as string, {
                    params: args
                  })
                }
                call.transfer = function (...transfer: Transferable[]) {
                  return {
                    invoke: async function (...args: any[]) {
                      return ipc.request(propertyKey as string, {
                        params: args
                      }, transfer)
                    }
                  }
                }
                target[propertyKey] = call
              }
              return target[propertyKey]
            }
          })

          obj[symbolRevoke] = revoke

          resolve(proxy as Thread<T>)
        }

        const handler = (message: MessageEvent<any>) => {
          const origin = defined(ENV_NODE) ? message : message.data
          const type = origin.type
          const data = origin.data

          switch (type) {
            case 'ready':
              worker.postMessage({
                type: 'run',
                data: {
                  port: channel.port2,
                  params: args
                }
              }, [channel.port2, ...transferData])
              break
            case 'running':
              running()
              break
            default:
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

        worker.onmessage = handler

        worker.postMessage({
          type: 'init',
          data: {
            memory: config.USE_THREADS ? Memory : null,
            name: options.name || entity.name,
            stackPointer,
            stackSize: options.stackSize ?? config.STACK_SIZE
          }
        })
      })
    }
  }

  function runInMain(...args: U) {
    const worker = new entity(...args)
    return new Promise<Thread<T>>((resolve) => {
      const obj: Thread<T> = {
        $worker: null,
        $ipc: null,
        $channel: null,
        $moduleId: toString(moduleId),
        $stackPointer: nullptr,
        $instance: worker,
        $type: 'class'
      } as Thread<T>

      const { proxy, revoke } = Proxy.revocable(obj, {
        get(target, propertyKey, receiver) {
          if (target[propertyKey]) {
            return obj[propertyKey]
          }
          if (propertyKey in entity.prototype && typeof entity.prototype[propertyKey] === 'function') {
            const call = function (...args: any[]) {
              return worker[propertyKey](...args)
            }
            call.transfer = function (...transfer: Transferable[]) {
              return {
                invoke: function (...args: any[]) {
                  return worker[propertyKey](...args)
                }
              }
            }
            target[propertyKey] = call
          }
          return target[propertyKey]
        }
      })

      obj[symbolRevoke] = revoke

      resolve(proxy as Thread<T>)
    })
  }

  function transfer(...transfer: Transferable[]) {
    transferData = transfer
    return {
      run: defined(ENABLE_THREADS) && ((config.USE_THREADS || options.dispatchToWorker) && !options.disableWorker) ? runInWorker : runInMain
    }
  }

  return {
    run: defined(ENABLE_THREADS) && ((config.USE_THREADS || options.dispatchToWorker) && !options.disableWorker) ? runInWorker : runInMain,
    transfer
  }
}

export function createThreadFromFunction<T extends any[], U extends any, args=[moduleId<'0'>]>(entity: (...args: T) => U, options?: ThreadOptions): {
  run: (...args: T) => Promise<Thread<{}, U>>
  transfer: (...transfer: Transferable[]) => {
    run: (...args: T) => Promise<Thread<{}, U>>
  }
}
export function createThreadFromFunction<T extends any[], U extends any>(
  entity: (...args: T) => U,
  options: ThreadOptions,
  workerize: () => Worker
): {
  run: (...args: T) => Promise<Thread<{}, U>>
  transfer: (...transfer: Transferable[]) => {
    run: (...args: T) => Promise<Thread<{}, U>>
  }
}
export function createThreadFromFunction<T extends any[], U extends any>(
  entity: (...args: T) => U,
  options: ThreadOptions = {},
  moduleId?: string | (() => Worker)
): {
    run: (...args: T) => Promise<Thread<{}, U>>
    transfer: (...transfer: Transferable[]) => {
      run: (...args: T) => Promise<Thread<{}, U>>
    }
  } {

  let transferData: Transferable[] = []

  let runInWorker: (...args: T) => Promise<Thread<{}, U>>

  if (defined(ENABLE_THREADS)) {
    runInWorker = (...args: T) => {

      let worker: Worker

      if (is.func(moduleId)) {
        worker = moduleId()
      }
      else if (defined(ENV_WEBPACK)) {
        let workerUrl: string
        const cacheKey = getCacheKey(moduleId, 'function')
        if (caches.has(cacheKey)) {
          workerUrl = caches.get(cacheKey).url
          caches.get(cacheKey).refCount++
        }
        else {
          const module = sourceLoad(moduleId, {
            varName: `__module_${entity.name}__`,
            exportName: `__${entity.name}__`,
            pointName: entity.name
          })

          const source = `
            self.CHEAP_DISABLE_THREAD = ${(SELF as any).CHEAP_DISABLE_THREAD}
            self.CHEAP_HEAP_INITIAL = ${(SELF as any).CHEAP_HEAP_INITIAL}
            self.CHEAP_HEAP_MAXIMUM = ${(SELF as any).CHEAP_HEAP_MAXIMUM}
            ${module}
            function run(params) {
              return __module_${entity.name}__.__${entity.name}__.apply(${defined(ENV_NODE) ? 'global' : 'self'}, params)
            }
            ${initFunction}
            init.default(run);
          `
          if (defined(ENV_NODE)) {
            workerUrl = `./cheap_${generateUUID()}.js`
            const fs = require('fs')
            fs.writeFileSync(workerUrl, source)
          }
          else {
            const blob = new Blob([source], { type: 'text/javascript' })
            workerUrl = URL.createObjectURL(blob)
          }

          caches.set(cacheKey, {
            url: workerUrl,
            refCount: 1
          })
        }
        worker = new Worker(workerUrl)
      }
      else {
        throw new Error('not support')
      }

      return new Promise<Thread<{}, U>>((resolve, reject) => {

        const stackPointer = config.USE_THREADS ? aligned_alloc(
          config.STACK_ALIGNMENT,
          options.stackSize
            ? align(options.stackSize, config.STACK_ALIGNMENT)
            : config.STACK_SIZE
        ) : nullptr

        function running() {
          const obj: Thread<{}> = {
            $worker: worker,
            $moduleId: toString(moduleId),
            $stackPointer: stackPointer,
            $type: 'function'
          }
          resolve(obj)
        }

        const handler = (message: MessageEvent<any>) => {
          const origin = defined(ENV_NODE) ? message : message.data
          const type = origin.type
          const data = origin.data

          switch (type) {
            case 'ready':
              worker.postMessage({
                type: 'run',
                data: {
                  params: args
                }
              }, transferData)
              running()
              break
            default:
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

        worker.onmessage = handler

        worker.postMessage({
          type: 'init',
          data: {
            memory: config.USE_THREADS ? Memory : null,
            name: options.name || entity.name,
            stackPointer,
            stackSize: options.stackSize ?? config.STACK_SIZE
          }
        })
      })
    }
  }

  function runInMain(...args: T) {
    return new Promise<Thread<{}, U>>((resolve, reject) => {
      const obj: Thread<{}, U> = {
        $worker: null,
        $moduleId: toString(moduleId),
        $stackPointer: null,
        $type: 'function'
      }
      resolve(obj)
      obj.$retval = new Promise<U>((resolve) => {
        resolve(entity(...args))
      })
    })
  }

  function transfer(...transfer: Transferable[]) {
    transferData = transfer
    return {
      run: defined(ENABLE_THREADS) && ((config.USE_THREADS || options.dispatchToWorker) && !options.disableWorker) ? runInWorker : runInMain
    }
  }

  return {
    run: defined(ENABLE_THREADS) && ((config.USE_THREADS || options.dispatchToWorker) && !options.disableWorker) ? runInWorker : runInMain,
    transfer
  }
}

export function createThreadFromModule<T extends Object, args=[moduleId<'0'>]>(entity: T, options?: ThreadOptions): {
  run: () => Promise<Thread<T>>
}
export function createThreadFromModule<T extends Object>(
  entity: T,
  options: ThreadOptions,
  workerize: () => Worker
): {
  run: () => Promise<Thread<T>>
}

export function createThreadFromModule<T extends Object>(
  entity: T,
  options: ThreadOptions = {},
  moduleId?: string | (() => Worker)
): {
    run: () => Promise<Thread<T>>
  } {
  let runInWorker: () => Promise<Thread<T>>
  if (defined(ENABLE_THREADS)) {
    runInWorker = () => {
      let worker: Worker
      let moduleName = `__module_${moduleId}__`.replace(/\.|\//g, '_')

      if (is.func(moduleId)) {
        worker = moduleId()
      }
      else if (defined(ENV_WEBPACK)) {
        let workerUrl: string
        const cacheKey = getCacheKey(moduleId, 'module')
        if (caches.has(cacheKey)) {
          workerUrl = caches.get(cacheKey).url
          caches.get(cacheKey).refCount++
        }
        else {
          const module = sourceLoad(moduleId, {
            varName: moduleName
          })

          const source = `
            self.CHEAP_DISABLE_THREAD = ${(SELF as any).CHEAP_DISABLE_THREAD}
            self.CHEAP_HEAP_INITIAL = ${(SELF as any).CHEAP_HEAP_INITIAL}
            self.CHEAP_HEAP_MAXIMUM = ${(SELF as any).CHEAP_HEAP_MAXIMUM}
            ${module}
            ${initModule}
            init.default(${moduleName});
          `

          if (defined(ENV_NODE)) {
            workerUrl = `./cheap_${generateUUID()}.js`
            const fs = require('fs')
            fs.writeFileSync(workerUrl, source)
          }
          else {
            const blob = new Blob([source], { type: 'text/javascript' })
            workerUrl = URL.createObjectURL(blob)
          }
          caches.set(cacheKey, {
            url: workerUrl,
            refCount: 1
          })
        }
        worker = new Worker(workerUrl)
      }
      else {
        throw new Error('not support')
      }

      const channel = new MessageChannel()
      return new Promise<Thread<T>>((resolve, reject) => {

        const stackPointer = config.USE_THREADS ? aligned_alloc(
          config.STACK_ALIGNMENT,
          options.stackSize
            ? align(options.stackSize, config.STACK_ALIGNMENT)
            : config.STACK_SIZE
        ) : nullptr

        function running() {
          const ipc = defined(ENV_NODE) ? new NodeIPCPort(channel.port1) : new IPCPort(channel.port1)

          const obj: Thread<T> = {
            $worker: worker,
            $ipc: ipc,
            $channel: channel,
            $moduleId: toString(moduleId),
            $stackPointer: stackPointer,
            $type: 'module'
          } as Thread<T>

          const { proxy, revoke } = Proxy.revocable(obj, {
            get(target, propertyKey, receiver) {
              if (target[propertyKey]) {
                return obj[propertyKey]
              }
              if (propertyKey in entity && typeof entity[propertyKey] === 'function') {
                const call = async function (...args: any[]) {
                  return ipc.request(propertyKey as string, {
                    params: args
                  })
                }
                call.transfer = function (...transfer: Transferable[]) {
                  return {
                    invoke: async function (...args: any[]) {
                      return ipc.request(propertyKey as string, {
                        params: args
                      }, transfer)
                    }
                  }
                }
                target[propertyKey] = call
              }
              return target[propertyKey]
            }
          })

          obj[symbolRevoke] = revoke

          resolve(proxy as Thread<T>)
        }

        const handler = (message: MessageEvent<any>) => {
          const origin = defined(ENV_NODE) ? message : message.data
          const type = origin.type
          const data = origin.data

          switch (type) {
            case 'ready':
              worker.postMessage({
                type: 'run',
                data: {
                  port: channel.port2
                }
              }, [channel.port2])
              break
            case 'running':
              running()
              break
            default:
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

        worker.onmessage = handler

        worker.postMessage({
          type: 'init',
          data: {
            memory: config.USE_THREADS ? Memory : null,
            name: options.name || moduleName,
            stackPointer,
            stackSize: options.stackSize ?? config.STACK_SIZE
          }
        })
      })
    }
  }
  function runInMain() {
    return new Promise<Thread<T>>((resolve, reject) => {
      const obj: Thread<T> = {
        $worker: null,
        $ipc: null,
        $channel: null,
        $moduleId: toString(moduleId),
        $stackPointer: nullptr,
        $instance: entity,
        $type: 'module'
      } as Thread<T>

      const { proxy, revoke } = Proxy.revocable(obj, {
        get(target, propertyKey, receiver) {
          if (target[propertyKey]) {
            return obj[propertyKey]
          }
          if (propertyKey in entity && typeof entity[propertyKey] === 'function') {
            const call = function (...args: any[]) {
              return entity[propertyKey](...args)
            }
            call.transfer = function (...transfer: Transferable[]) {
              return {
                invoke: function (...args: any[]) {
                  return entity[propertyKey](...args)
                }
              }
            }
            target[propertyKey] = call
          }
          return target[propertyKey]
        }
      })

      obj[symbolRevoke] = revoke

      resolve(proxy as Thread<T>)
    })
  }
  return {
    run: defined(ENABLE_THREADS) && ((config.USE_THREADS || options.dispatchToWorker) && !options.disableWorker) ? runInWorker : runInMain,
  }
}

export function closeThread<T, U>(thread: Thread<T, U>) {
  if (thread.$worker) {
    thread.$worker.terminate()
    thread.$worker = null
  }
  if (thread.$moduleId) {
    if (is.string(thread.$moduleId)) {
      const cacheKey = getCacheKey(thread.$moduleId, thread.$type)
      if (caches.has(cacheKey)) {
        caches.get(cacheKey).refCount--
        if (caches.get(cacheKey).refCount === 0) {
          if (defined(ENV_NODE)) {
            const fs = require('fs')
            fs.unlinkSync(caches.get(cacheKey).url)
          }
          else {
            URL.revokeObjectURL(caches.get(cacheKey).url)
          }
          caches.delete(cacheKey)
        }
      }
    }
    thread.$moduleId = null
  }

  if (thread.$ipc) {
    thread.$ipc.destroy()
    thread.$ipc = null
  }

  if (thread.$stackPointer) {
    free(thread.$stackPointer)
    thread.$stackPointer = nullptr
  }

  thread.$channel = null
  thread.$instance = null

  if (thread[symbolRevoke]) {
    const revoke = thread[symbolRevoke]
    thread[symbolRevoke] = null
    revoke()
  }
}

export async function joinThread<T, U>(thread: Thread<{}, U>) {
  if (thread.$worker) {
    return new Promise<PromiseType<U>>((resolve) => {

      function handler(message: MessageEvent<any>) {
        const origin = defined(ENV_NODE) ? message : message.data
        const type = origin.type
        const data = origin.data

        switch (type) {
          case 'stopped':
            closeThread(thread)
            resolve(data)
            break
          default:
            break
        }
      }

      if (defined(ENV_NODE)) {
        // @ts-ignore
        thread.$worker.removeAllListeners('message')
        // @ts-ignore
        thread.$worker.on('message', handler)
      }
      else {
        thread.$worker.onmessage = handler
      }
      thread.$worker.postMessage({
        type: 'stop'
      })
    })
  }
  else if (thread.$retval) {
    return thread.$retval as PromiseType<U>
  }
}
