/**
 * 基于 https://github.com/codemix/malloc 修改
 * 一个基于跳表的 malloc 算法
 * 添加支持自动扩堆，支持多线程和 alignedAlloc
 */

import type Allocator from './Allocator'
import * as object from 'common/util/object'
import * as array from 'common/util/array'
import { lock, unlock } from '../thread/mutex'
import { heapMutex } from '../staticData'
import * as logger from 'common/util/logger'

const ALIGNMENT_IN_BYTES = 8
const ALIGNMENT_MASK = ALIGNMENT_IN_BYTES - 1

const POINTER_SIZE_IN_BYTES = 4
const BYTES_TO_QUADS_SHIFT = 2
const MIN_FREEABLE_SIZE_IN_BYTES = 16
const MIN_FREEABLE_SIZE_IN_QUADS = bytesToQuads(MIN_FREEABLE_SIZE_IN_BYTES)

const MAX_HEIGHT = 32

const HEADER_SIZE_IN_QUADS = 1 + (MAX_HEIGHT * 2)
const HEADER_OFFSET_IN_QUADS = 1

const HEIGHT_OFFSET_IN_QUADS = 0
const NEXT_OFFSET_IN_QUADS = 2

const POINTER_SIZE_IN_QUADS = 1
const POINTER_OVERHEAD_IN_QUADS = 2

const FIRST_BLOCK_OFFSET_IN_QUADS = HEADER_OFFSET_IN_QUADS + HEADER_SIZE_IN_QUADS + POINTER_OVERHEAD_IN_QUADS
const FIRST_BLOCK_OFFSET_IN_BYTES = FIRST_BLOCK_OFFSET_IN_QUADS * POINTER_SIZE_IN_BYTES
const OVERHEAD_IN_BYTES = (FIRST_BLOCK_OFFSET_IN_QUADS + 1) * POINTER_SIZE_IN_BYTES

type ListNode = {
  type: string
  offset: int32
  size: int32
  height: int32
  pointers: int32[]
  block: number
}

type InspectionResult = {
  header: ListNode
  blocks: Array<{
    type: string;
    size: int32
    node?: ListNode
  }>
  total: number
  used: number
}

export type AllocatorJSOptions = {
  memory?: WebAssembly.Memory
  buffer: ArrayBuffer | SharedArrayBuffer
  byteOffset?: int32
  byteLength?: int32
  growAllowed?: boolean
  growSize?: number
  maxHeapSize?: number
  onResize?: (old: Int32Array, need: number) => { buffer: ArrayBuffer, byteOffset?: number, byteLength?: number }
}

export default class AllocatorJS implements Allocator {

  private buffer: ArrayBuffer | SharedArrayBuffer

  private byteOffset: int32

  private heapOffset: int32

  private heapLength: int32

  private int32Array: Int32Array

  private updates: Int32Array

  private options: AllocatorJSOptions

  private shared: boolean

  private handles: ((buffer: ArrayBufferLike) => void)[]

  constructor(options: AllocatorJSOptions, init: boolean = true) {
    this.options = object.extend({
      growSize: 1 * 1024 * 1024,
      maxHeapSize: 2000 * 1024 * 1024
    }, options)
    this.handles = []
    this.buffer = options.buffer
    this.shared = false
    if (this.options.memory || this.buffer instanceof ArrayBuffer || this.buffer instanceof SharedArrayBuffer) {
      this.byteOffset = options.byteOffset ?? 0
      this.heapOffset = alignHeapOffset(this.byteOffset + quadsToBytes(MAX_HEIGHT), options.byteLength ?? this.buffer.byteLength)
      this.heapLength = alignHeapLength((options.byteLength ?? this.buffer.byteLength) - this.heapOffset)

      this.int32Array = new Int32Array(this.buffer, this.heapOffset, bytesToQuads(static_cast<int32>(this.heapLength)))
      this.updates = new Int32Array(this.buffer, this.byteOffset, MAX_HEIGHT)

      if (typeof SharedArrayBuffer === 'function' && this.buffer instanceof SharedArrayBuffer) {
        this.shared = true
      }
    }
    else {
      logger.fatal('Expected buffer to be an instance of Buffer or ArrayBuffer')
    }

    if (init) {
      this.updates.fill(HEADER_OFFSET_IN_QUADS)
      prepare(this.int32Array)
      checkListIntegrity(this.int32Array)
    }
  }

  public addUpdateHandle(handle: (buffer: ArrayBuffer) => void): void {
    if (!array.has(this.handles, handle)) {
      this.handles.push(handle)
    }
  }

  public removeUpdateHandle(handle: (buffer: ArrayBuffer) => void): void {
    array.remove(this.handles, handle)
  }

  private malloc_(size: size): pointer<void> {
    size = reinterpret_cast<size>(align(reinterpret_cast<int32>(size), ALIGNMENT_MASK))
    if (size < MIN_FREEABLE_SIZE_IN_BYTES) {
      size = reinterpret_cast<size>(MIN_FREEABLE_SIZE_IN_BYTES)
    }

    assert(!(!this.options.growSize && size > this.heapLength - OVERHEAD_IN_BYTES), `malloc size must be between ${MIN_FREEABLE_SIZE_IN_BYTES} bytes and ${this.heapLength - OVERHEAD_IN_BYTES} bytes`)

    const minimumSize: int32 = bytesToQuads(reinterpret_cast<int32>(size))
    const block: int32 = this.findFreeBlock(this.int32Array, minimumSize)
    if (block <= HEADER_OFFSET_IN_QUADS) {
      return nullptr
    }
    const blockSize: int32 = readSize(this.int32Array, block)

    if (blockSize - (minimumSize + POINTER_OVERHEAD_IN_QUADS) >= MIN_FREEABLE_SIZE_IN_QUADS) {
      split(this.int32Array, block, minimumSize, blockSize, this.updates)
    }
    else {
      assert(!(blockSize % 2))
      remove(this.int32Array, block, blockSize, this.updates)
    }

    assert(!((quadsToBytes(block) & ALIGNMENT_MASK) !== nullptr), `Address must be a multiple of (${ALIGNMENT_IN_BYTES}).`)

    return quadsToBytes(block) + this.heapOffset
  }
  /**
   * Allocate a given number of bytes and return the offset.
   * If allocation fails, returns 0.
   */
  public malloc(size: size): pointer<void> {

    if (this.shared) {
      lock(heapMutex, !defined(DEBUG))
      this.checkBuffer()
    }

    const address = this.malloc_(size)

    if (this.shared) {
      unlock(heapMutex)
    }

    return address
  }

  private calloc_(num: size, size: size): pointer<void> {
    let numberOfBytes = num * size

    if (numberOfBytes < MIN_FREEABLE_SIZE_IN_BYTES) {
      numberOfBytes = MIN_FREEABLE_SIZE_IN_BYTES
    }
    else {
      numberOfBytes = align(numberOfBytes, ALIGNMENT_MASK)
    }

    const address = this.malloc_(numberOfBytes)
    if (address === nullptr) {
      // Not enough space
      return nullptr
    }
    const offset = bytesToQuads(address - this.heapOffset)
    this.int32Array.subarray(offset, offset + bytesToQuads(numberOfBytes)).fill(0)

    return address
  }
  public calloc(num: size, size: size): pointer<void> {
    if (this.shared) {
      lock(heapMutex, !defined(DEBUG))
      this.checkBuffer()
    }

    const address = this.calloc_(num, size)

    if (this.shared) {
      unlock(heapMutex)
    }

    return address
  }

  private realloc_(address: pointer<void>, size: size): pointer<void> {

    if (address === nullptr) {
      return this.malloc_(size)
    }

    assert(!((address & ALIGNMENT_MASK) !== nullptr), `Address must be a multiple of (${ALIGNMENT_IN_BYTES}).`)

    const originAddress = address

    if (size === 0) {
      this.free_(originAddress)
      return nullptr
    }

    address -= this.heapOffset

    assert(!(address < FIRST_BLOCK_OFFSET_IN_BYTES || address > this.heapLength), `Address must be between ${FIRST_BLOCK_OFFSET_IN_BYTES} and ${this.heapLength - OVERHEAD_IN_BYTES}`)

    let originBlock = bytesToQuads(reinterpret_cast<int32>(address))
    let block = originBlock
    let padding = 0

    if (isAlign(this.int32Array, originBlock)) {
      block = this.int32Array[originBlock - 1]
      padding = originBlock - block
    }

    const blockSize: int32 = readSize(this.int32Array, block) - padding
    const minimumSize: int32 = bytesToQuads(align(reinterpret_cast<int32>(size), ALIGNMENT_MASK))

    assert(!(blockSize < MIN_FREEABLE_SIZE_IN_QUADS || blockSize > (this.heapLength - OVERHEAD_IN_BYTES) / 4), `Invalid block: ${block}, got block size: ${quadsToBytes(blockSize)}`)

    if (blockSize >= minimumSize) {
      return originAddress
    }
    else {
      const newAddress = this.malloc_(size)
      if (newAddress === nullptr) {
        this.free_(originAddress)
        return nullptr
      }
      this.int32Array.set(
        this.int32Array.subarray(originBlock, originBlock + blockSize),
        bytesToQuads(newAddress - this.heapOffset)
      )
      this.free_(originAddress)
      return newAddress
    }
  }
  public realloc(address: pointer<void>, size: size): pointer<void> {
    if (this.shared) {
      lock(heapMutex, !defined(DEBUG))
      this.checkBuffer()
    }

    address = this.realloc_(address, size)

    if (this.shared) {
      unlock(heapMutex)
    }

    return address
  }

  private alignedAlloc_(alignment: size, size: size): pointer<void> {

    assert(alignment >= 4, `alignment must not smaller then 4, but got ${alignment}`)

    assert(!(alignment & (alignment - reinterpret_cast<size>(1))), `alignment must be power of 2, but got ${alignment}`)

    if (alignment <= ALIGNMENT_IN_BYTES) {
      // malloc 以 ALIGNMENT_IN_BYTES 字节对齐
      return this.malloc_(size)
    }

    const address = this.malloc_(size + alignment - reinterpret_cast<size>(1) + reinterpret_cast<size>(POINTER_SIZE_IN_BYTES))

    if (address === nullptr) {
      return nullptr
    }

    const alignmentAddress: pointer<void> = reinterpret_cast<pointer<void>>((address + alignment - reinterpret_cast<size>(1)
      + reinterpret_cast<size>(POINTER_SIZE_IN_BYTES)) & reinterpret_cast<size>(~(alignment - reinterpret_cast<size>(1))))

    this.int32Array[bytesToQuads(alignmentAddress - this.heapOffset) - POINTER_SIZE_IN_QUADS] = bytesToQuads(address - this.heapOffset)

    assert(!(alignmentAddress % alignment))

    return alignmentAddress
  }
  public alignedAlloc(alignment: size, size: size): pointer<void> {
    if (this.shared) {
      lock(heapMutex, !defined(DEBUG))
      this.checkBuffer()
    }

    const address = this.alignedAlloc_(alignment, size)

    if (this.shared) {
      unlock(heapMutex)
    }

    return address
  }

  private free_(address: pointer<void>): void {
    if (address === nullptr) {
      return
    }

    address -= this.heapOffset

    assert(!((address & ALIGNMENT_MASK) !== nullptr), `Address must be a multiple of (${ALIGNMENT_IN_BYTES}).`)

    assert(!(address < FIRST_BLOCK_OFFSET_IN_BYTES || address > this.heapLength), `Address must be between ${FIRST_BLOCK_OFFSET_IN_BYTES} and ${this.heapLength - OVERHEAD_IN_BYTES}`)

    let block = bytesToQuads(reinterpret_cast<int32>(address))

    if (isAlign(this.int32Array, block)) {
      block = this.int32Array[block - POINTER_SIZE_IN_QUADS]
    }

    if (isFree(this.int32Array, block)) {
      return
    }

    const blockSize: int32 = readSize(this.int32Array, block)

    // 对地址是否合法进行断言
    assert(blockSize === readSize(this.int32Array, block + blockSize + 1))

    /* istanbul ignore if  */
    assert(!(blockSize < MIN_FREEABLE_SIZE_IN_QUADS || blockSize > (this.heapLength - OVERHEAD_IN_BYTES) / 4), `Invalid block: ${block}, got block size: ${quadsToBytes(blockSize)}`)

    const preceding: int32 = getFreeBlockBefore(this.int32Array, block)
    const trailing: int32 = getFreeBlockAfter(this.int32Array, block)

    if (preceding !== nullptr) {
      if (trailing !== nullptr) {
        insertMiddle(this.int32Array, preceding, block, blockSize, trailing, this.updates)
      }
      else {
        insertAfter(this.int32Array, preceding, block, blockSize, this.updates)
      }
    }
    else if (trailing !== nullptr) {
      insertBefore(this.int32Array, trailing, block, blockSize, this.updates)
    }
    else {
      insert(this.int32Array, block, blockSize, this.updates)
    }
  }
  /**
   * Free a number of bytes from the given address.
   */
  public free(address: pointer<void>): void {
    if (this.shared) {
      lock(heapMutex, !defined(DEBUG))
      this.checkBuffer()
    }

    this.free_(address)

    if (this.shared) {
      unlock(heapMutex)
    }
  }

  /**
   * Return the size of the block at the given address.
   */
  public sizeof(address: int32): size {

    if (address === nullptr) {
      return 0
    }

    address -= this.heapOffset

    assert(!(address < FIRST_BLOCK_OFFSET_IN_BYTES || address > this.heapLength || typeof address !== 'number' || isNaN(address)), `Address must be between ${FIRST_BLOCK_OFFSET_IN_BYTES} and ${this.heapLength - OVERHEAD_IN_BYTES}`)

    assert(!((address & ALIGNMENT_MASK) !== nullptr), `Address must be a multiple of the pointer size (${POINTER_SIZE_IN_BYTES}).`)

    let block = bytesToQuads(address)

    if (isAlign(this.int32Array, block)) {
      block = this.int32Array[block - POINTER_SIZE_IN_QUADS]
    }

    return reinterpret_cast<size>(quadsToBytes(readSize(this.int32Array, block)))
  }

  /**
   * 获取堆分配信息
   * 
   * @returns 
   */
  public inspect(): InspectionResult {
    this.checkBuffer()
    return inspect(this.int32Array, this.heapOffset)
  }

  private findFreeBlock(int32Array: Int32Array, minimumSize: int32): int32 {
    let block: int32 = findFreeBlock(int32Array, minimumSize)
    if (block === HEADER_OFFSET_IN_QUADS) {
      if (this.options.growAllowed && this.heapLength < this.options.maxHeapSize) {

        const block = this.int32Array.length + 1

        let int32Array: Int32Array
        let updates: Int32Array
        let byteOffset = 0
        let heapLength = 0
        let heapOffset = 0

        if (this.options.onResize) {
          const result = this.options.onResize(
            this.int32Array,
            this.int32Array.byteLength + align(Math.max(this.options.growSize, quadsToBytes(minimumSize)), ALIGNMENT_MASK)
          )
          byteOffset = result.byteOffset ?? 0
          heapOffset = alignHeapOffset(byteOffset + quadsToBytes(MAX_HEIGHT), result.byteLength ?? result.buffer.byteLength)
          heapLength = alignHeapLength((result.byteLength ?? result.buffer.byteLength) - heapOffset)
          int32Array = new Int32Array(result.buffer, heapOffset, bytesToQuads(heapLength))
          updates = new Int32Array(result.buffer, byteOffset, MAX_HEIGHT)
        }
        else {
          const buffer = new ArrayBuffer(this.int32Array.length + bytesToQuads(this.options.growSize))
          heapOffset = alignHeapOffset(byteOffset + quadsToBytes(MAX_HEIGHT), buffer.byteLength)
          heapLength = alignHeapLength(buffer.byteLength - heapOffset)
          int32Array = new Int32Array(buffer, heapOffset, bytesToQuads(heapLength))
          int32Array.set(this.int32Array, 0)
          updates = new Int32Array(buffer, byteOffset, MAX_HEIGHT)
        }

        this.byteOffset = byteOffset
        this.heapOffset = heapOffset
        this.buffer = int32Array.buffer
        this.heapLength = heapLength
        this.int32Array = int32Array
        this.updates = updates

        const blockSize = int32Array.length - (block - 1) - POINTER_OVERHEAD_IN_QUADS

        writeFreeBlockSize(int32Array, blockSize, block)

        const preceding: int32 = getFreeBlockBefore(int32Array, block)
        if (preceding !== nullptr) {
          insertAfter(int32Array, preceding, block, blockSize, this.updates)
        }
        else {
          insert(int32Array, block, blockSize, this.updates)
        }

        if (this.handles.length) {
          array.each(this.handles, (func) => {
            func(this.buffer)
          })
        }

        return this.findFreeBlock(this.int32Array, minimumSize)
      }
      return block
    }
    else {
      return block
    }
  }

  public getBuffer(): ArrayBufferLike {
    return this.buffer
  }

  public isAlloc(pointer: pointer<void>) {
    if (this.shared) {
      lock(heapMutex, !defined(DEBUG))
      this.checkBuffer()
    }
    const block = bytesToQuads(pointer - this.heapOffset)
    let next: int32 = this.int32Array[HEADER_OFFSET_IN_QUADS + NEXT_OFFSET_IN_QUADS]
    // sometime get undefined from the last free node in v8
    // but it's is all right |=_=
    while (next && next !== HEADER_OFFSET_IN_QUADS) {
      if (block >= next && block < next + this.int32Array[next - POINTER_SIZE_IN_QUADS]) {
        if (this.shared) {
          unlock(heapMutex)
        }
        return false
      }
      next = this.int32Array[next + NEXT_OFFSET_IN_QUADS]
    }
    if (this.shared) {
      unlock(heapMutex)
    }
    return true
  }

  private checkBuffer() {
    if (this.options.memory && this.options.memory.buffer !== this.buffer) {
      this.buffer = this.options.memory.buffer
      this.heapLength = alignHeapLength(this.buffer.byteLength - this.heapOffset)
      this.int32Array = new Int32Array(this.buffer, this.heapOffset, bytesToQuads(static_cast<int32>(this.heapLength)))
    }
  }
}

/**
 * Prepare the given int32Array and ensure it contains a valid header.
 */
function prepare(int32Array: Int32Array) {
  if (!verifyHeader(int32Array)) {
    writeInitialHeader(int32Array)
  }
}

/**
 * Verify that the int32Array contains a valid header.
 */
function verifyHeader(int32Array: Int32Array): boolean {
  return int32Array[HEADER_OFFSET_IN_QUADS - 1] === HEADER_SIZE_IN_QUADS
    && int32Array[HEADER_OFFSET_IN_QUADS + HEADER_SIZE_IN_QUADS] === HEADER_SIZE_IN_QUADS
}

/**
 * Write the initial header for an empty int32Array.
 */
function writeInitialHeader(int32Array: Int32Array) {
  const header = HEADER_OFFSET_IN_QUADS
  const headerSize = HEADER_SIZE_IN_QUADS
  const block = FIRST_BLOCK_OFFSET_IN_QUADS
  const blockSize = int32Array.length - (header + headerSize + POINTER_OVERHEAD_IN_QUADS + POINTER_SIZE_IN_QUADS)

  writeFreeBlockSize(int32Array, headerSize, header)
  int32Array[header + HEIGHT_OFFSET_IN_QUADS] = 1
  int32Array[header + NEXT_OFFSET_IN_QUADS] = block
  for (let height = 1; height < MAX_HEIGHT; height++) {
    int32Array[header + NEXT_OFFSET_IN_QUADS + height] = HEADER_OFFSET_IN_QUADS
  }

  writeFreeBlockSize(int32Array, blockSize, block)
  int32Array[block + HEIGHT_OFFSET_IN_QUADS] = 1
  int32Array[block + NEXT_OFFSET_IN_QUADS] = header
}

/**
 * Check the integrity of the freelist in the given array.
 */
function checkListIntegrity(int32Array: Int32Array): boolean {
  let block: int32 = FIRST_BLOCK_OFFSET_IN_QUADS
  while (block < int32Array.length - POINTER_SIZE_IN_QUADS) {
    const size: int32 = readSize(int32Array, block)
    /* istanbul ignore if  */
    if (size < POINTER_OVERHEAD_IN_QUADS || size >= int32Array.length - FIRST_BLOCK_OFFSET_IN_QUADS) {
      logger.fatal(`Got invalid sized chunk at ${quadsToBytes(block)} (${quadsToBytes(size)} bytes).`)
    }
    else if (isFree(int32Array, block)) {
      checkFreeBlockIntegrity(int32Array, block, size)
    }
    else {
      checkUsedBlockIntegrity(int32Array, block, size)
    }
    block += size + POINTER_OVERHEAD_IN_QUADS
  }
  return true
}

function checkFreeBlockIntegrity(int32Array: Int32Array, block: int32, blockSize: int32): boolean {
  /* istanbul ignore if  */
  if (int32Array[block - 1] !== int32Array[block + blockSize]) {
    logger.fatal(`Block length header does not match footer (${quadsToBytes(int32Array[block - 1])} vs ${quadsToBytes(int32Array[block + blockSize])}).`)
  }
  const height: int32 = int32Array[block + HEIGHT_OFFSET_IN_QUADS]
  /* istanbul ignore if  */
  if (height < 1 || height > MAX_HEIGHT) {
    logger.fatal(`Block ${quadsToBytes(block)} height must be between 1 and ${MAX_HEIGHT}, got ${height}.`)
  }
  for (let i = 0; i < height; i++) {
    const pointer = int32Array[block + NEXT_OFFSET_IN_QUADS + i]
    /* istanbul ignore if  */
    if (pointer >= FIRST_BLOCK_OFFSET_IN_QUADS && !isFree(int32Array, pointer)) {
      logger.fatal(`Block ${quadsToBytes(block)} has a pointer to a non-free block (${quadsToBytes(pointer)}).`)
    }
  }
  return true
}

function checkUsedBlockIntegrity(int32Array: Int32Array, block: int32, blockSize: int32): boolean {
  /* istanbul ignore if  */
  if (int32Array[block - 1] !== int32Array[block + blockSize]) {
    logger.fatal(`Block length header does not match footer (${quadsToBytes(int32Array[block - 1])} vs ${quadsToBytes(int32Array[block + blockSize])}).`)
  }
  else {
    return true
  }
}


/**
 * Inspect the freelist in the given array.
 */
function inspect(int32Array: Int32Array, byteOffset: number): InspectionResult {
  const blocks: { type: string; size: int32; node?: ListNode; offset: number, block: number }[] = []
  const header: ListNode = readListNode(int32Array, HEADER_OFFSET_IN_QUADS, byteOffset)
  let block: int32 = FIRST_BLOCK_OFFSET_IN_QUADS
  let used = 0
  while (block < int32Array.length - POINTER_SIZE_IN_QUADS) {
    const size: int32 = readSize(int32Array, block)
    /* istanbul ignore if  */
    if (size < POINTER_OVERHEAD_IN_QUADS || size >= int32Array.length) {
      logger.fatal(`Got invalid sized chunk at ${quadsToBytes(block)} (${quadsToBytes(size)})`)
    }
    if (isFree(int32Array, block)) {
      // @flowIssue todo
      blocks.push(readListNode(int32Array, block, byteOffset))
    }
    else {
      used += quadsToBytes(size)
      blocks.push({
        type: 'used',
        block: block,
        offset: quadsToBytes(block) + byteOffset,
        size: quadsToBytes(size)
      })
    }
    block += size + POINTER_OVERHEAD_IN_QUADS
  }
  return { header, blocks, total: quadsToBytes(int32Array.length), used }
}

/**
 * Convert quads to bytes.
 */
function quadsToBytes(num: int32): int32 {
  return (num << BYTES_TO_QUADS_SHIFT) >>> 0
}

/**
 * Convert bytes to quads.
 */
function bytesToQuads(num: int32): int32 {
  return num >>> BYTES_TO_QUADS_SHIFT
}

/**
 * Align the given value to 8 bytes.
 */
function align(value: int32, alignment: int32): int32 {
  return ((value + alignment) & ~alignment) >>> 0
}

/**
 * align heap
 * 
 * @param offset heap start offset
 * @param byteLength  buffer length
 * @returns 
 */
function alignHeapOffset(offset: int32, byteLength: int32) {
  const length = byteLength - offset
  // 保证 heapLength 为 ALIGNMENT_IN_BYTES 对齐
  let heapOffset = offset + (align(length, ALIGNMENT_MASK) === length
    ? 0
    : (length - align(length, ALIGNMENT_MASK) + ALIGNMENT_IN_BYTES))

  return heapOffset
}

function alignHeapLength(length: int32) {
  // header 所占 int length 为奇数，则总长度也需要为奇数保证 body 为偶数
  if (!((HEADER_OFFSET_IN_QUADS + HEADER_SIZE_IN_QUADS) % 2)) {
    length -= POINTER_SIZE_IN_BYTES
  }
  return length
}

/**
 * Read the list pointers for a given block.
 */
function readListNode(int32Array: Int32Array, block: int32, byteOffset: int32): ListNode {
  const height: int32 = int32Array[block + HEIGHT_OFFSET_IN_QUADS]
  const pointers: int32[] = []
  for (let i = 0; i < height; i++) {
    pointers.push(int32Array[block + NEXT_OFFSET_IN_QUADS + i])
  }

  return {
    type: 'free',
    block,
    offset: quadsToBytes(block) + byteOffset,
    height,
    pointers,
    size: quadsToBytes(int32Array[block - 1])
  }
}


/**
 * Read the size (in quads) of the block at the given address.
 */
function readSize(int32Array: Int32Array, block: int32): int32 {
  const n = int32Array[block - 1]
  const mask = n >> 31
  return (n + mask) ^ mask
}

/**
 * Write the size of the block at the given address.
 * Note: This ONLY works for free blocks, not blocks in use.
 */
function writeFreeBlockSize(int32Array: Int32Array, size: int32, block: int32): void {
  int32Array[block - 1] = size
  int32Array[block + size] = size
}

/**
 * Populate the `UPDATES` array with the offset of the last item in each
 * list level, *before* a node of at least the given size.
 */
function findPredecessors(int32Array: Int32Array, minimumSize: int32, UPDATES: Int32Array): void {
  const listHeight: int32 = int32Array[HEADER_OFFSET_IN_QUADS + HEIGHT_OFFSET_IN_QUADS]

  let node: int32 = HEADER_OFFSET_IN_QUADS

  for (let height = listHeight; height > 0; height--) {
    let next: int32 = node + NEXT_OFFSET_IN_QUADS + (height - 1)
    while (int32Array[next] >= FIRST_BLOCK_OFFSET_IN_QUADS && int32Array[int32Array[next] - 1] < minimumSize) {
      node = int32Array[next]
      next = node + NEXT_OFFSET_IN_QUADS + (height - 1)
    }
    UPDATES[height - 1] = node
  }
}

/**
 * Find a free block with at least the given size and return its offset in quads.
 */
function findFreeBlock(int32Array: Int32Array, minimumSize: int32): int32 {
  let block: int32 = HEADER_OFFSET_IN_QUADS

  for (let height = int32Array[HEADER_OFFSET_IN_QUADS + HEIGHT_OFFSET_IN_QUADS]; height > 0; height--) {
    let next: int32 = int32Array[block + NEXT_OFFSET_IN_QUADS + (height - 1)]
    while (next !== HEADER_OFFSET_IN_QUADS && int32Array[next - POINTER_SIZE_IN_QUADS] < minimumSize) {
      block = next
      next = int32Array[block + NEXT_OFFSET_IN_QUADS + (height - 1)]
    }
  }

  block = int32Array[block + NEXT_OFFSET_IN_QUADS]
  if (block === HEADER_OFFSET_IN_QUADS) {
    return block
  }
  else {
    return block
  }
}

/**
 * Split the given block after a certain number of bytes and add the second half to the freelist.
 */
function split(int32Array: Int32Array, block: int32, firstSize: int32, blockSize: int32, UPDATES: Int32Array): void {
  const second: int32 = (block + firstSize + POINTER_OVERHEAD_IN_QUADS)
  const secondSize: int32 = (blockSize - (second - block))

  remove(int32Array, block, blockSize, UPDATES)

  int32Array[block - 1] = -firstSize
  int32Array[block + firstSize] = -firstSize

  int32Array[second - 1] = -secondSize
  int32Array[second + secondSize] = -secondSize

  insert(int32Array, second, secondSize, UPDATES)
}

/**
 * Remove the given block from the freelist and mark it as allocated.
 */
function remove(int32Array: Int32Array, block: int32, blockSize: int32, UPDATES: Int32Array): void {
  findPredecessors(int32Array, blockSize, UPDATES)

  let node: int32 = int32Array[UPDATES[0] + NEXT_OFFSET_IN_QUADS]

  while (node !== block && node !== HEADER_OFFSET_IN_QUADS && int32Array[node - 1] <= blockSize) {
    for (let height: number = int32Array[node + HEIGHT_OFFSET_IN_QUADS] - 1; height >= 0; height--) {
      if (int32Array[node + NEXT_OFFSET_IN_QUADS + height] === block) {
        UPDATES[height] = node
      }
    }
    node = int32Array[node + NEXT_OFFSET_IN_QUADS]
  }

  assert(node === block, 'Could not find block to remove.')

  let listHeight: int32 = int32Array[HEADER_OFFSET_IN_QUADS + HEIGHT_OFFSET_IN_QUADS]
  for (let height = 0; height < listHeight; height++) {
    const next: int32 = int32Array[UPDATES[height] + NEXT_OFFSET_IN_QUADS + height]
    if (next !== block) {
      break
    }
    int32Array[UPDATES[height] + NEXT_OFFSET_IN_QUADS + height] = int32Array[block + NEXT_OFFSET_IN_QUADS + height]
  }

  while (listHeight > 0 && int32Array[HEADER_OFFSET_IN_QUADS + NEXT_OFFSET_IN_QUADS + (listHeight - 1)] === HEADER_OFFSET_IN_QUADS) {
    listHeight--
    int32Array[HEADER_OFFSET_IN_QUADS + HEIGHT_OFFSET_IN_QUADS] = listHeight
  }
  // invert the size sign to signify an allocated block

  int32Array[block - 1] = -blockSize
  int32Array[block + blockSize] = -blockSize
}

/**
 * Determine whether the block at the given address is free or not.
 */
function isFree(int32Array: Int32Array, block: int32): boolean {
  /* istanbul ignore if  */
  if (block < HEADER_SIZE_IN_QUADS) {
    return false
  }

  const size: int32 = int32Array[block - POINTER_SIZE_IN_QUADS]

  if (size < 0) {
    return false
  }
  else {
    return true
  }
}

/**
 * Determine whether the block at the given address is free or not.
 */
function isAlign(int32Array: Int32Array, block: int32): boolean {
  /* istanbul ignore if  */
  if (block < HEADER_SIZE_IN_QUADS) {
    return false
  }

  const origin: int32 = int32Array[block - POINTER_SIZE_IN_QUADS]

  if (origin < 0) {
    return false
  }
  else {
    return true
  }
}


/**
 * Get the address of the block before the given one and return the address *if it is free*,
 * otherwise 0.
 */
function getFreeBlockBefore(int32Array: Int32Array, block: int32): int32 {
  if (block <= FIRST_BLOCK_OFFSET_IN_QUADS) {
    return nullptr
  }
  const beforeSize: int32 = int32Array[block - POINTER_OVERHEAD_IN_QUADS]

  if (beforeSize < POINTER_OVERHEAD_IN_QUADS) {
    return nullptr
  }
  return block - (POINTER_OVERHEAD_IN_QUADS + beforeSize)
}

/**
 * Get the address of the block after the given one and return its address *if it is free*,
 * otherwise 0.
 */
function getFreeBlockAfter(int32Array: Int32Array, block: int32): int32 {
  const blockSize: int32 = readSize(int32Array, block)
  if (block + blockSize + POINTER_OVERHEAD_IN_QUADS >= int32Array.length - 2) {
    // Block is the last in the list.
    return nullptr
  }
  const next: int32 = (block + blockSize + POINTER_OVERHEAD_IN_QUADS)
  const nextSize: int32 = int32Array[next - POINTER_SIZE_IN_QUADS]

  if (nextSize < POINTER_OVERHEAD_IN_QUADS) {
    return nullptr
  }
  return next
}


/**
 * Insert the given block into the freelist and return the number of bytes that were freed.
 */
function insert(int32Array: Int32Array, block: int32, blockSize: int32, UPDATES: Int32Array): int32 {
  findPredecessors(int32Array, blockSize, UPDATES)
  const blockHeight: int32 = generateHeight(int32Array, block, blockSize, UPDATES)

  for (let height = 1; height <= blockHeight; height++) {
    const update: int32 = UPDATES[height - 1] + NEXT_OFFSET_IN_QUADS + (height - 1)
    int32Array[block + NEXT_OFFSET_IN_QUADS + (height - 1)] = int32Array[update]
    int32Array[update] = block
    UPDATES[height - 1] = HEADER_OFFSET_IN_QUADS
  }

  int32Array[block - 1] = blockSize
  int32Array[block + blockSize] = blockSize
  return blockSize
}


/**
 * Insert the given block into the freelist before the given free block,
 * joining them together, returning the number of bytes which were freed.
 */
function insertBefore(int32Array: Int32Array, trailing: int32, block: int32, blockSize: int32, UPDATES: Int32Array): int32 {
  const trailingSize: int32 = readSize(int32Array, trailing)
  remove(int32Array, trailing, trailingSize, UPDATES)
  const size: int32 = (blockSize + trailingSize + POINTER_OVERHEAD_IN_QUADS)
  int32Array[block - POINTER_SIZE_IN_QUADS] = -size
  int32Array[trailing + trailingSize] = -size
  insert(int32Array, block, size, UPDATES)
  return blockSize
}

/**
 * Insert the given block into the freelist in between the given free blocks,
 * joining them together, returning the number of bytes which were freed.
 */
function insertMiddle(int32Array: Int32Array, preceding: int32, block: int32, blockSize: int32, trailing: int32, UPDATES: Int32Array): int32 {
  const precedingSize: int32 = readSize(int32Array, preceding)
  const trailingSize: int32 = readSize(int32Array, trailing)
  const size: int32 = ((trailing - preceding) + trailingSize)

  remove(int32Array, preceding, precedingSize, UPDATES)
  remove(int32Array, trailing, trailingSize, UPDATES)
  int32Array[preceding - POINTER_SIZE_IN_QUADS] = -size
  int32Array[trailing + trailingSize] = -size
  insert(int32Array, preceding, size, UPDATES)
  return blockSize
}

/**
 * Insert the given block into the freelist after the given free block,
 * joining them together, returning the number of bytes which were freed.
 */
function insertAfter(int32Array: Int32Array, preceding: int32, block: int32, blockSize: int32, UPDATES: Int32Array): int32 {
  const precedingSize: int32 = (block - preceding) - POINTER_OVERHEAD_IN_QUADS
  const size: int32 = ((block - preceding) + blockSize)
  remove(int32Array, preceding, precedingSize, UPDATES)
  int32Array[preceding - POINTER_SIZE_IN_QUADS] = -size
  int32Array[block + blockSize] = -size
  insert(int32Array, preceding, size, UPDATES)
  return blockSize
}



/**
 * Generate a random height for a block, growing the list height by 1 if required.
 */
function generateHeight(int32Array: Int32Array, block: int32, blockSize: int32, UPDATES: Int32Array): int32 {
  const listHeight: int32 = int32Array[HEADER_OFFSET_IN_QUADS + HEIGHT_OFFSET_IN_QUADS]
  let height: int32 = randomHeight()

  if (blockSize - 1 < height + 1) {
    height = blockSize - 2
  }

  if (height > listHeight) {
    const newHeight: int32 = listHeight + 1
    int32Array[HEADER_OFFSET_IN_QUADS + HEIGHT_OFFSET_IN_QUADS] = newHeight
    int32Array[HEADER_OFFSET_IN_QUADS + NEXT_OFFSET_IN_QUADS + (newHeight - 1)] = HEADER_OFFSET_IN_QUADS
    UPDATES[newHeight] = HEADER_OFFSET_IN_QUADS
    int32Array[block + HEIGHT_OFFSET_IN_QUADS] = newHeight
    return newHeight
  }
  else {
    int32Array[block + HEIGHT_OFFSET_IN_QUADS] = height
    return height
  }
}

/**
 * Generate a random height for a new block.
 */
function randomHeight(): number {
  let height: number = 1
  while (Math.random() < 0.5 && height < MAX_HEIGHT) {
    height += 1
  }
  return height
}
