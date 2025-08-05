import isWorker from 'common/function/isWorker'
import type AllocatorInterface from './allocator/Allocator'
import AllocatorJS from './allocator/AllocatorJS'
import type { MemoryOperator } from './allocator/AllocatorJS64'
import AllocatorJS64 from './allocator/AllocatorJS64'
import { WebassemblyTable } from './allocator/Table'
import { SELF } from 'common/util/constant'
import type { AtomicsBuffer } from './typedef'
import { CTypeEnum } from './typedef'
import * as config from './config'
import * as staticData from './staticData'
import initAtomics from './thread/atomicsImpl'
import * as memoryAsm from './asm/memory'
import * as atomicsAsm from './thread/asm/atomics'
import initCtypeEnumImpl from './ctypeEnumImpl'
import isAudioWorklet from 'common/function/isAudioWorklet'
import browser from 'common/util/browser'
import os from 'common/util/os'

/**
 * 线程 id
 */
export let ThreadId: number = -1

export let isMainThread: boolean = true

/**
 * 线程名
 */
export let ThreadName: string = ''

/**
 * 当前线程的栈顶指针
 */
export let StackPointer: WebAssembly.Global = null

/**
 * 栈结束位置
 */
export let StackTop: pointer<void> = null

/**
 * 当前线程栈大小
 */
export let StackSize: int32 = 0

/**
 * 当前线程的 Table
 */
export let Table: WebassemblyTable = null

/**
 * 堆分配器
 */
export let Allocator: AllocatorInterface = null

/**
 * 堆
 */
export let Memory: WebAssembly.Memory = null

/**
 * 1 字节整型读取
 * - int8
 * - -128 to 127
 */
let Heap8: Int8Array = null

/**
 * 2 字节整型读取 
 * - int16
 * - -32768 to 32767
 */
let Heap16: Int16Array = null

/**
 * 4 字节整型读取
 * - int32
 * - -2147483648 to 2147483647
 */
let Heap32: Int32Array = null

/**
 * 8 字节整型读取
 * - int64
 * - 0 to 4294967295
 */
let Heap64: BigInt64Array = null

/**
 * 1 字节无符号整型读取
 * - uint8
 * - 0 to 255
 */
let HeapU8: Uint8Array = null

/**
 * 2 字节无符号整型读取
 * - uint16
 * - 0 to 65535
 */
let HeapU16: Uint16Array = null

/**
 * 4 字节无符号整型读取
 * - uint32
 * - 0 to 4294967295
 */
let HeapU32: Uint32Array = null

/**
 * 8 字节无符号整型读取
 * - uint64
 * - 0 to 4294967295
 */
let HeapU64: BigUint64Array = null

/**
 * 堆访问器
 */
let view: DataView = null

let AtomicBufferMap: Record<number, AtomicsBuffer> = {
  [CTypeEnum.atomic_char]: HeapU8,
  [CTypeEnum.atomic_uint8]: HeapU8,
  [CTypeEnum.atomic_uint16]: HeapU16,
  [CTypeEnum.atomic_uint32]: HeapU32,
  [CTypeEnum.atomic_uint64]: HeapU64,
  [CTypeEnum.atomic_int8]: Heap8,
  [CTypeEnum.atomic_int16]: Heap16,
  [CTypeEnum.atomic_int32]: Heap32,
  [CTypeEnum.atomic_int64]: Heap64
}

function checkHeap() {
  if (Memory && Memory.buffer !== HeapU8.buffer) {
    return true
  }
  return false
}

export function getHeap() {
  return Memory.buffer
}

export let getHeapU8: () => Uint8Array
export let getView: () => DataView
export let getAtomicsBuffer: (type: atomictype) => AtomicsBuffer
export let useResizableBuffer: boolean = false

function getHeapU8_() {
  if (!defined(WASM_64) && defined(ENABLE_THREADS) && checkHeap()) {
    updateHeap(Memory.buffer)
  }
  return HeapU8
}

export function getView_() {
  if (!defined(WASM_64) && defined(ENABLE_THREADS) && checkHeap()) {
    updateHeap(Memory.buffer)
  }
  return view
}

export function getAtomicsBuffer_(type: atomictype) {
  if (!defined(WASM_64) && defined(ENABLE_THREADS) && checkHeap()) {
    updateHeap(Memory.buffer)
  }
  return AtomicBufferMap[type as number]
}

function initView() {
  if (config.USE_THREADS && !useResizableBuffer) {
    getHeapU8 = getHeapU8_
    getView = getView_
    getAtomicsBuffer = getAtomicsBuffer_
  }
  else {
    getHeapU8 = () => HeapU8
    getView = () => view
    getAtomicsBuffer = (type: atomictype) => AtomicBufferMap[type as number]
  }
}


function setAllocator(a: AllocatorInterface) {
  if (!defined(WASM_64)) {
    if (Allocator && !useResizableBuffer) {
      Allocator.removeUpdateHandle(updateHeap)
    }
  }

  Allocator = a
  if (SELF.CHeap) {
    SELF.CHeap.Allocator = Allocator
  }

  if (!defined(WASM_64)) {
    if (!useResizableBuffer) {
      Allocator.addUpdateHandle(updateHeap)
    }
    updateHeap(Allocator.getBuffer())
  }
}

function updateHeap(heap: ArrayBuffer | SharedArrayBuffer) {
  if (!defined(WASM_64)) {
    Heap8 = new Int8Array(heap)
    Heap16 = new Int16Array(heap)
    Heap32 = new Int32Array(heap)
    Heap64 = new BigInt64Array(heap)

    HeapU8 = new Uint8Array(heap)
    HeapU16 = new Uint16Array(heap)
    HeapU32 = new Uint32Array(heap)
    HeapU64 = new BigUint64Array(heap)

    view = new DataView(heap)

    AtomicBufferMap = {
      [CTypeEnum.atomic_char]: HeapU8,
      [CTypeEnum.atomic_uint8]: HeapU8,
      [CTypeEnum.atomic_uint16]: HeapU16,
      [CTypeEnum.atomic_uint32]: HeapU32,
      [CTypeEnum.atomic_uint64]: HeapU64,
      [CTypeEnum.atomic_int8]: Heap8,
      [CTypeEnum.atomic_int16]: Heap16,
      [CTypeEnum.atomic_int32]: Heap32,
      [CTypeEnum.atomic_int64]: Heap64
    }
  }
}

export function allocThreadId() {
  if (defined(WASM_64)) {
    return (atomicsAsm.instance.exports.add32 as Function)(staticData.threadCounter, 1)
  }
  else {
    return Atomics.add(HeapU32, staticData.threadCounter >>> 2, 1)
  }
}

/**
 * 子线程初始化
 * 
 * @param options 
 */
export async function initThread(options: {
  memory: WebAssembly.Memory
  stackPointer?: pointer<void>
  stackSize?: int32
  name?: string
  disableAsm?: boolean
  id?: int32
}) {
  Memory = options.memory
  // @ts-ignore
  useResizableBuffer = !!Memory.buffer.growable

  initView()
  if (!defined(WASM_64)) {
    initCtypeEnumImpl(
      () => {
        return Allocator
      },
      getView
    )
    initAtomics(getAtomicsBuffer)
  }

  if (!options.disableAsm && !useResizableBuffer || defined(WASM_64)) {
    if (defined(ENV_NODE)) {
      memoryAsm.init(Memory, config.HEAP_INITIAL, config.HEAP_MAXIMUM)
    }
    else {
      // @ts-ignore
      if (typeof BigInt === 'function' && BigInt !== Number
        && (
          browser.chrome && browser.checkVersion(browser.majorVersion, '85', true)
          || browser.firefox && browser.checkVersion(browser.majorVersion, '78', true)
          || browser.safari && browser.checkVersion(browser.majorVersion, '15', true)
          || os.ios && browser.checkVersion(os.version, '15', true)
          || browser.newEdge
        )
        || defined(WASM_64)
      ) {
        memoryAsm.init(Memory, config.HEAP_INITIAL, config.HEAP_MAXIMUM)
      }
    }

    if (defined(ENV_NODE)) {
      atomicsAsm.init(Memory, config.HEAP_INITIAL, config.HEAP_MAXIMUM)
    }
    else {
      if ((
        browser.chrome && browser.checkVersion(browser.majorVersion, '85', true)
          || browser.firefox && browser.checkVersion(browser.majorVersion, '78', true)
          || browser.safari && browser.checkVersion(browser.majorVersion, '15', true)
          || os.ios && browser.checkVersion(os.version, '15', true)
          || browser.newEdge
      )
        || defined(WASM_64)
      ) {
        atomicsAsm.init(Memory, config.HEAP_INITIAL, config.HEAP_MAXIMUM)
      }
    }
  }

  const allocator = defined(WASM_64)
    ? new AllocatorJS64(
      {
        memory: Memory,
        byteOffset: static_cast<int64>(config.HEAP_OFFSET as uint32),
        maxHeapSize: static_cast<int64>(config.HEAP_MAXIMUM) * 64n * 1024n,
        growAllowed: true,
        operator: memoryAsm.instance.exports as unknown as MemoryOperator
      }
      , false
    )
    : new AllocatorJS(
      {
        buffer: Memory.buffer,
        memory: Memory,
        byteOffset: config.HEAP_OFFSET,
        maxHeapSize: config.HEAP_MAXIMUM * 64 * 1024,
        growAllowed: true
      },
      false
    )

  setAllocator(allocator as AllocatorInterface)

  if (options.stackPointer) {
    StackSize = options.stackSize
    StackTop = options.stackPointer
    StackPointer = new WebAssembly.Global({
      value: defined(WASM_64) ? 'i64' : 'i32',
      mutable: true
    }, StackTop + StackSize)
    Table = new WebassemblyTable()
  }
  if (typeof options.id === 'number') {
    ThreadId = options.id
  }
  else {
    if (defined(WASM_64)) {
      ThreadId = (atomicsAsm.instance.exports.add32 as Function)(staticData.threadCounter, 1)
    }
    else {
      ThreadId = Atomics.add(HeapU32, staticData.threadCounter >>> 2, 1)
    }
  }
  ThreadName = options.name ?? 'anonymous'

  SELF.CHeap = {
    initThread,
    Allocator,
    Table,
    ThreadId,
    ThreadName,
    Memory,
    Config: config,

    StackSize,
    StackTop,
    StackPointer,
    isMainThread: false
  }

  isMainThread = false
}

/**
 * 主线程初始化
 */
export function initMain() {

  Memory = SELF.CHeap?.Memory ? SELF.CHeap.Memory : new WebAssembly.Memory({
    initial: reinterpret_cast<size>(config.HEAP_INITIAL),
    maximum: reinterpret_cast<size>(config.HEAP_MAXIMUM),
    shared: config.USE_THREADS,
    // @ts-ignore
    address: defined(WASM_64) ? 'i64' : 'i32',
    // @ts-ignore
    index: defined(WASM_64) ? 'i64' : 'i32'
  })

  // @ts-ignore
  if (config.USE_THREADS && typeof Memory.toResizableBuffer === 'function' && !SELF.CHeap?.Memory) {
    // @ts-ignore
    Memory.toResizableBuffer()
  }

  // @ts-ignore
  useResizableBuffer = !!Memory.buffer.growable

  initView()
  if (!defined(WASM_64)) {
    initCtypeEnumImpl(
      () => {
        return Allocator
      },
      getView
    )
    initAtomics(getAtomicsBuffer)
  }

  if (!defined(DEBUG) && defined(ENABLE_THREADS) && !useResizableBuffer || defined(WASM_64)) {
    if (defined(ENV_NODE)) {
      if (config.USE_THREADS || defined(WASM_64)) {
        memoryAsm.init(Memory, config.HEAP_INITIAL, config.HEAP_MAXIMUM)
      }
    }
    else {
      // @ts-ignore
      if (typeof BigInt === 'function' && BigInt !== Number
        && (
          browser.chrome && browser.checkVersion(browser.majorVersion, '85', true)
          || browser.firefox && browser.checkVersion(browser.majorVersion, '78', true)
          || browser.safari && browser.checkVersion(browser.majorVersion, '15', true)
          || os.ios && browser.checkVersion(os.version, '15', true)
          || browser.newEdge
        )
        && config.USE_THREADS
        || defined(WASM_64)
      ) {
        memoryAsm.init(Memory, config.HEAP_INITIAL, config.HEAP_MAXIMUM)
      }
    }
    if (defined(ENV_NODE)) {
      if (config.USE_THREADS && defined(ENABLE_THREADS) || defined(WASM_64)) {
        atomicsAsm.init(Memory, config.HEAP_INITIAL, config.HEAP_MAXIMUM)
      }
    }
    else {
      if (config.USE_THREADS
        && defined(ENABLE_THREADS)
        && (
          browser.chrome && browser.checkVersion(browser.majorVersion, '85', true)
          || browser.firefox && browser.checkVersion(browser.majorVersion, '78', true)
          || browser.safari && browser.checkVersion(browser.majorVersion, '15', true)
          || os.ios && browser.checkVersion(os.version, '15', true)
          || browser.newEdge
        )
        || defined(WASM_64)
      ) {
        atomicsAsm.init(Memory, config.HEAP_INITIAL, config.HEAP_MAXIMUM)
      }
    }
  }

  Allocator = SELF.CHeap?.Allocator
    ? (SELF.CHeap.Allocator as AllocatorInterface)
    : (
      defined(WASM_64)
        ? new AllocatorJS64({
          memory: Memory,
          byteOffset: static_cast<int64>(config.HEAP_OFFSET as uint32),
          maxHeapSize: static_cast<int64>((config.HEAP_MAXIMUM)) * 64n * 1024n,
          growAllowed: true,
          operator: memoryAsm.instance.exports as unknown as MemoryOperator
        }) as unknown as AllocatorInterface
        : new AllocatorJS({
          buffer: Memory.buffer,
          memory: Memory,
          byteOffset: config.HEAP_OFFSET,
          maxHeapSize: config.HEAP_MAXIMUM * 64 * 1024,
          growAllowed: true
        })
    )

  if (!defined(WASM_64)) {
    if (!useResizableBuffer) {
      Allocator.addUpdateHandle(updateHeap)
    }
    updateHeap(Allocator.getBuffer())
  }

  StackSize = SELF.CHeap?.StackSize ? SELF.CHeap.StackSize : config.STACK_SIZE
  StackTop = SELF.CHeap?.StackTop ? SELF.CHeap.StackTop : Allocator.malloc(reinterpret_cast<size>(StackSize as unknown as uint32))
  StackPointer = SELF.CHeap?.StackPointer ? SELF.CHeap.StackPointer : new WebAssembly.Global({
    value: defined(WASM_64) ? 'i64' : 'i32',
    mutable: true
  }, StackTop + StackSize)

  Table = SELF.CHeap?.Table ? (SELF.CHeap.Table as WebassemblyTable) : new WebassemblyTable()

  ThreadId = SELF.CHeap?.ThreadId ? SELF.CHeap.ThreadId : 0
  ThreadName = SELF.CHeap?.ThreadName ? SELF.CHeap.ThreadName : 'main'

  if (!SELF.CHeap) {
    if (config.USE_THREADS && defined(ENABLE_THREADS)) {
      if (defined(WASM_64)) {
        (atomicsAsm.instance.exports.store32 as Function)(staticData.threadCounter, ThreadId + 1)
        ;(atomicsAsm.instance.exports.store32 as Function)(addressof(staticData.heapMutex.atomic), 0)
      }
      else {
        Atomics.store(HeapU32, staticData.threadCounter >>> 2, ThreadId + 1)
        Atomics.store(Heap32, addressof(staticData.heapMutex.atomic) >>> 2, 0)
      }
    }
    else {
      if (defined(WASM_64)) {
        (memoryAsm.instance.exports.write32 as Function)(staticData.threadCounter, ThreadId + 1)
        ;(memoryAsm.instance.exports.write32 as Function)(addressof(staticData.heapMutex.atomic), 0)
      }
      else {
        HeapU32[staticData.threadCounter >>> 2] = ThreadId + 1
        let index = addressof(staticData.heapMutex.atomic) >>> 2
        Heap32[index] = 0
      }
    }
  }

  if (!SELF.CHeap) {
    SELF.CHeap = {
      Allocator,
      Table,
      ThreadId,
      ThreadName,
      Memory,
      Config: config,

      StackSize,
      StackTop,
      StackPointer,
      isMainThread: true
    }
  }
  isMainThread = true
}

if (defined(ENV_NODE)) {
  const { isMainThread: isMainThread_ } = require('worker_threads')
  if (isMainThread_) {
    initMain()
  }
  else {
    SELF.CHeap = {
      initThread,
      isMainThread: false,
      Config: config
    }
    isMainThread = false
  }
}
else {
  if (!isWorker() && !isAudioWorklet() || (isWorker() && !config.USE_THREADS)) {
    initMain()
  }
  else {
    SELF.CHeap = {
      initThread,
      isMainThread: false,
      Config: config
    }
    isMainThread = false
  }
}
