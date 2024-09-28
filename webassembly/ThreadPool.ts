import { ChildThread, Pthread, PthreadFlags, PthreadStatus, ThreadDescriptor, ThreadWait } from './thread'
import * as config from '../config'
import { memset } from 'cheap/std/memory'
import { Memory, allocThreadId } from 'cheap/heap'
import * as cond from 'cheap/thread/cond'
import * as mutex from 'cheap/thread/mutex'
import * as atomicsUtils from '../thread/atomics'

interface TheadPoolEntry {
  id: uint32
  thread: ChildThread
  threadWait: pointer<ThreadWait>
}

interface TheadPoolEntryOptions {
  tableSize: number
  module: WebAssembly.Module
  initFuncs: string[]

  memoryBase: number
  tableBase: number
  childImports: string
}

export default class ThreadPool {

  private count: number

  private url: string

  private childThreads: TheadPoolEntry[]

  constructor(count: number, url: string) {
    this.count = count
    this.url = url
    this.childThreads = []
  }

  private async createTheadPoolEntry(options: TheadPoolEntryOptions) {
    return new Promise<TheadPoolEntry>((resolve, reject) => {
      const worker = new Worker(this.url)
      const stackPointer = aligned_alloc(config.STACK_ALIGNMENT, config.STACK_SIZE)
      const threadDescriptor: pointer<ThreadDescriptor> = malloc(sizeof(ThreadDescriptor))
      memset(threadDescriptor, 0, sizeof(ThreadDescriptor))

      threadDescriptor.status = PthreadStatus.STOP
      threadDescriptor.flags |= PthreadFlags.POOL

      const id = allocThreadId()

      worker.onmessage = (message) => {
        const origin = message.data
        const type = origin.type
        switch (type) {
          case 'ready':
            const wait: pointer<ThreadWait> = stackPointer
            memset(wait, 0, sizeof(ThreadWait))
            mutex.init(addressof(wait.mutex))
            cond.init(addressof(wait.cond))
            worker.postMessage({
              type: 'wait'
            })
            resolve({
              id,
              thread: {
                thread: nullptr,
                worker,
                stackPointer,
                threadDescriptor
              },
              threadWait: wait
            })
            break
        }
      }

      worker.postMessage({
        type: 'ready',
        data: {
          cheap: {
            memory: Memory,
            stackPointer,
            stackSize: config.STACK_SIZE,
            id
          },
          runner: {
            resource: {
              tableSize: options.tableSize,
              module: options.module,
              initFuncs: options.initFuncs
            },
            options: {
              memoryBase: options.memoryBase,
              tableBase: options.tableBase,
              threadDescriptor,
              childImports: options.childImports
            },
            imports: options.childImports
          }
        }
      })
    })
  }

  public async ready(options: TheadPoolEntryOptions) {
    this.childThreads = await Promise.all(new Array(this.count).fill(0).map(() => {
      return this.createTheadPoolEntry(options)
    }))
  }

  public hasFree() {
    for (let i = 0; i < this.childThreads.length; i++) {
      if (this.childThreads[i].thread.threadDescriptor.status === PthreadStatus.STOP) {
        return true
      }
    }
    return false
  }

  public isPoolThread(thread: pointer<Pthread>) {
    for (let i = 0; i < this.childThreads.length; i++) {
      if (this.childThreads[i].thread.thread === thread) {
        return true
      }
    }
    return false
  }

  public createThread(thread: pointer<Pthread>, attr: pointer<void>, func: pointer<((args: pointer<void>) => void)>, args: pointer<void>) {
    for (let i = 0; i < this.childThreads.length; i++) {
      if (this.childThreads[i].thread.threadDescriptor.status === PthreadStatus.STOP) {
        this.childThreads[i].thread.threadDescriptor.status = PthreadStatus.RUN
        this.childThreads[i].thread.thread = thread

        thread.flags |= PthreadFlags.POOL

        mutex.lock(addressof(this.childThreads[i].threadWait.mutex))
        this.childThreads[i].threadWait.thread = thread
        this.childThreads[i].threadWait.func = func
        this.childThreads[i].threadWait.args = args
        mutex.unlock(addressof(this.childThreads[i].threadWait.mutex))
        cond.signal(addressof(this.childThreads[i].threadWait.cond))
        return
      }
    }
  }

  public joinThread(thread: pointer<Pthread>, retval: pointer<pointer<void>>) {

    let entry: TheadPoolEntry

    for (let i = 0; i < this.childThreads.length; i++) {
      if (this.childThreads[i].thread.thread === thread) {
        entry = this.childThreads[i]
        break
      }
    }

    if (!entry) {
      return -1
    }

    if (thread.flags & PthreadFlags.DETACH) {
      return 0
    }
    // 等待子线程退出
    atomicsUtils.wait(addressof(thread.status), PthreadStatus.RUN)

    if (retval !== nullptr) {
      accessof(retval) <- thread.retval
    }

    entry.thread.threadDescriptor.status = PthreadStatus.STOP

    return 0
  }

  public detachThread(thread: pointer<Pthread>) {
    let entry: TheadPoolEntry

    for (let i = 0; i < this.childThreads.length; i++) {
      if (this.childThreads[i].thread.thread === thread) {
        entry = this.childThreads[i]
        break
      }
    }

    if (!entry) {
      return -1
    }

    entry.thread.threadDescriptor.flags |= PthreadFlags.DETACH
    thread.flags |= PthreadFlags.DETACH

    return 0
  }

  public destroy() {
    for (let i = 0; i < this.childThreads.length; i++) {
      // 回收栈
      free(this.childThreads[i].thread.stackPointer)
      free(this.childThreads[i].thread.threadDescriptor)
      this.childThreads[i].thread.worker.terminate()
    }
    this.childThreads = []
  }
}
