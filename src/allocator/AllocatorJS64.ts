/**
 * 基于 https://github.com/codemix/malloc 修改
 * 一个基于跳表的 malloc 算法
 * 添加支持自动扩堆，支持多线程和 alignedAlloc
 */

import type Allocator from './Allocator'
import { lock, unlock } from '../thread/mutex'
import { heapMutex } from '../staticData'

import {
  object,
  array,
  logger
} from '@libmedia/common'

const ALIGNMENT_IN_BYTES = 16n
const ALIGNMENT_MASK = ALIGNMENT_IN_BYTES - 1n

const POINTER_SIZE_IN_BYTES = 8n
const BYTES_TO_QUADS_SHIFT = 3n
const MIN_FREEABLE_SIZE_IN_BYTES = 32n
const MIN_FREEABLE_SIZE_IN_QUADS = bytesToQuads(MIN_FREEABLE_SIZE_IN_BYTES)

const MAX_HEIGHT = 32n

const HEADER_SIZE_IN_QUADS = 1n + (MAX_HEIGHT * 2n)
const HEADER_OFFSET_IN_QUADS = 1n

const HEIGHT_OFFSET_IN_QUADS = 0n
const NEXT_OFFSET_IN_QUADS = 2n

const POINTER_SIZE_IN_QUADS = 1n
const POINTER_OVERHEAD_IN_QUADS = 2n

const FIRST_BLOCK_OFFSET_IN_QUADS = HEADER_OFFSET_IN_QUADS + HEADER_SIZE_IN_QUADS + POINTER_OVERHEAD_IN_QUADS
const FIRST_BLOCK_OFFSET_IN_BYTES = FIRST_BLOCK_OFFSET_IN_QUADS * POINTER_SIZE_IN_BYTES
const OVERHEAD_IN_BYTES = (FIRST_BLOCK_OFFSET_IN_QUADS + 1n) * POINTER_SIZE_IN_BYTES

// 64 位 pointer 和 size 类型是 bigint
type pointer<T = void> = bigint
type size = bigint

type ListNode = {
  type: string
  offset: int64
  size: int64
  height: int64
  pointers: int64[]
  block: int64
}

type InspectionResult = {
  header: ListNode
  blocks: Array<{
    type: string
    size: int64
    node?: ListNode
  }>
  total: int64
  used: int64
}

export type AllocatorJSOptions = {
  memory: WebAssembly.Memory
  byteOffset?: int64
  growAllowed?: boolean
  growSize?: int64
  maxHeapSize?: int64
  operator: MemoryOperator
}

export interface MemoryOperator {
  read64: (p: int64) => int64
  write64: (p: int64, value: int64) => void
  fill: (p: int64, value: int32, size: bigint) => void
  copy: (dst: int64, src: int64, size: bigint) => void
}

class BlockArray {

  private offset: int64

  private operator: MemoryOperator

  private heapLength: () => int64

  private memory: WebAssembly.Memory

  constructor(memory: WebAssembly.Memory, offset: int64, heapLength: () => int64, operator: MemoryOperator) {
    this.offset = offset
    this.heapLength = heapLength
    this.operator = operator
    this.memory = memory
  }

  get length() {
    return this.heapLength()
  }

  public at(p: int64) {
    return this.operator.read64(this.offset + quadsToBytes(p))
  }

  public set(p: int64, value: int64) {
    this.operator.write64(this.offset + quadsToBytes(p), value)
  }

  public fill(value: int64) {
    new BigInt64Array(this.memory.buffer, static_cast<double>(this.offset), static_cast<double>(this.length)).fill(value)
  }

  public copy(dst: int64, src: int64, size: size) {
    this.operator.copy(this.offset + quadsToBytes(dst), this.offset + quadsToBytes(src), quadsToBytes(static_cast<int64>(size)))
  }
}

export default class AllocatorJS64 implements Allocator {

  private byteOffset: int64

  private blockArray: BlockArray

  private updates: BlockArray

  private options: AllocatorJSOptions

  private shared: boolean

  private handles: ((buffer: ArrayBufferLike) => void)[]

  constructor(options: AllocatorJSOptions, init: boolean = true) {
    this.options = object.extend({
      growSize: 1n * 1024n * 1024n,
      maxHeapSize: 2000n * 1024n * 1024n
    }, options)
    this.handles = []
    this.shared = false
    if (this.options.memory) {
      this.byteOffset = options.byteOffset ?? 0n

      this.blockArray = new BlockArray(
        this.options.memory,
        this.heapOffset,
        () => bytesToQuads(this.heapLength),
        this.options.operator
      )
      this.updates = new BlockArray(
        this.options.memory,
        this.byteOffset,
        () => MAX_HEIGHT,
        this.options.operator
      )
      if (typeof SharedArrayBuffer === 'function' && this.options.memory.buffer instanceof SharedArrayBuffer) {
        this.shared = true
      }
    }
    else {
      logger.fatal('Expected buffer to be an instance of Buffer or ArrayBuffer')
    }

    if (init) {
      this.updates.fill(HEADER_OFFSET_IN_QUADS)
      prepare(this.blockArray)
      checkListIntegrity(this.blockArray)
    }
  }

  get heapOffset() {
    return alignHeapOffset(this.byteOffset + quadsToBytes(MAX_HEIGHT), static_cast<int64>(this.options.memory.buffer.byteLength as uint32))
  }

  get heapLength() {
    return alignHeapLength((static_cast<int64>(this.options.memory.buffer.byteLength as uint32)) - this.heapOffset)
  }

  public addUpdateHandle(handle: (buffer: ArrayBufferLike) => void): void {
    if (!array.has(this.handles, handle)) {
      this.handles.push(handle)
    }
  }

  public removeUpdateHandle(handle: (buffer: ArrayBufferLike) => void): void {
    array.remove(this.handles, handle)
  }

  private malloc_(size: size): pointer<void> {

    size = align(size, ALIGNMENT_MASK)
    if (size < MIN_FREEABLE_SIZE_IN_BYTES) {
      size = MIN_FREEABLE_SIZE_IN_BYTES
    }

    assert(!(!this.options.growSize && size > this.heapLength - OVERHEAD_IN_BYTES), `malloc size must be between ${MIN_FREEABLE_SIZE_IN_BYTES} bytes and ${this.heapLength - OVERHEAD_IN_BYTES} bytes`)

    const minimumSize: int64 = bytesToQuads(size)
    const block: int64 = this.findFreeBlock(this.blockArray, minimumSize)
    if (block <= HEADER_OFFSET_IN_QUADS) {
      return reinterpret_cast<uint64>(nullptr)
    }
    const blockSize: int64 = readSize(this.blockArray, block)

    if (blockSize - (minimumSize + POINTER_OVERHEAD_IN_QUADS) >= MIN_FREEABLE_SIZE_IN_QUADS) {
      split(this.blockArray, block, minimumSize, blockSize, this.updates)
    }
    else {
      assert(!(blockSize % 2n))
      remove(this.blockArray, block, blockSize, this.updates)
    }

    assert(!((quadsToBytes(block) & ALIGNMENT_MASK) !== reinterpret_cast<uint64>(nullptr)), `Address must be a multiple of (${ALIGNMENT_IN_BYTES}).`)

    return quadsToBytes(block) + this.heapOffset
  }
  // @ts-ignore
  public malloc(size: size): pointer<void> {
    if (this.shared) {
      lock(heapMutex, !defined(DEBUG))
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
    if (address === reinterpret_cast<uint64>(nullptr)) {
      // Not enough space
      return reinterpret_cast<uint64>(nullptr)
    }

    this.options.operator.fill(address, 0, numberOfBytes)

    return address
  }
  // @ts-ignore
  public calloc(num: size, size: size): pointer<void> {
    if (this.shared) {
      lock(heapMutex, !defined(DEBUG))
    }

    const address = this.calloc_(num, size)

    if (this.shared) {
      unlock(heapMutex)
    }

    return address
  }

  private realloc_(address: pointer<void>, size: size): pointer<void> {

    if (address === reinterpret_cast<uint64>(nullptr)) {
      return this.malloc_(size)
    }

    assert(!((address & ALIGNMENT_MASK) !== reinterpret_cast<uint64>(nullptr)), `Address must be a multiple of (${ALIGNMENT_IN_BYTES}).`)

    const originAddress = address

    if (size === 0n) {
      this.free_(originAddress)
      return reinterpret_cast<uint64>(nullptr)
    }

    address -= this.heapOffset

    assert(!(address < FIRST_BLOCK_OFFSET_IN_BYTES || address > this.heapLength), `Address must be between ${FIRST_BLOCK_OFFSET_IN_BYTES} and ${this.heapLength - OVERHEAD_IN_BYTES}`)

    let originBlock = bytesToQuads(address)
    let block = originBlock
    let padding = 0n

    if (isAlign(this.blockArray, originBlock)) {
      block = this.blockArray.at(originBlock - 1n)
      padding = originBlock - block
    }

    const blockSize: int64 = readSize(this.blockArray, block) - padding
    const minimumSize: int64 = bytesToQuads(align(size, ALIGNMENT_MASK))

    assert(!(blockSize < MIN_FREEABLE_SIZE_IN_QUADS || blockSize > (this.heapLength - OVERHEAD_IN_BYTES) / 4n), `Invalid block: ${block}, got block size: ${quadsToBytes(blockSize)}`)

    if (blockSize >= minimumSize) {
      return originAddress
    }
    else {
      const newAddress = this.malloc_(size)
      if (newAddress === reinterpret_cast<uint64>(nullptr)) {
        this.free_(originAddress)
        return reinterpret_cast<uint64>(nullptr)
      }

      this.blockArray.copy(bytesToQuads(newAddress - this.heapOffset), originBlock, reinterpret_cast<size>(blockSize))

      this.free_(originAddress)
      return newAddress
    }
  }
  // @ts-ignore
  public realloc(address: pointer<void>, size: size): pointer<void> {
    if (this.shared) {
      lock(heapMutex, !defined(DEBUG))
    }

    address = this.realloc_(address, size)

    if (this.shared) {
      unlock(heapMutex)
    }

    return address
  }

  private alignedAlloc_(alignment: size, size: size): pointer<void> {

    assert(alignment >= 4n, `alignment must not smaller then 4, but got ${alignment}`)

    assert(!(alignment & (alignment - 1n)), `alignment must be power of 2, but got ${alignment}`)

    if (alignment <= ALIGNMENT_IN_BYTES) {
      // malloc 以 ALIGNMENT_IN_BYTES 字节对齐
      return this.malloc_(size)
    }

    const address = this.malloc_(size + alignment - 1n + POINTER_SIZE_IN_BYTES)

    if (address === reinterpret_cast<uint64>(nullptr)) {
      return reinterpret_cast<uint64>(nullptr)
    }

    const alignmentAddress = (address + alignment - 1n + POINTER_SIZE_IN_BYTES) & ~(alignment - 1n)

    this.blockArray.set(bytesToQuads(alignmentAddress - this.heapOffset) - POINTER_SIZE_IN_QUADS, bytesToQuads(address - this.heapOffset))

    assert(!(alignmentAddress % alignment))

    return alignmentAddress
  }
  // @ts-ignore
  public alignedAlloc(alignment: size, size: size): pointer<void> {
    if (this.shared) {
      lock(heapMutex, !defined(DEBUG))
    }

    const address = this.alignedAlloc_(alignment, size)

    if (this.shared) {
      unlock(heapMutex)
    }

    return address
  }

  private free_(address: pointer<void>): void {

    if (address === reinterpret_cast<uint64>(nullptr)) {
      return
    }

    address -= this.heapOffset

    assert(!((address & ALIGNMENT_MASK) !== reinterpret_cast<uint64>(nullptr)), `Address must be a multiple of (${ALIGNMENT_IN_BYTES}).`)

    assert(!(address < FIRST_BLOCK_OFFSET_IN_BYTES || address > this.heapLength), `Address must be between ${FIRST_BLOCK_OFFSET_IN_BYTES} and ${this.heapLength - OVERHEAD_IN_BYTES}`)

    let block = bytesToQuads(address)

    if (isAlign(this.blockArray, block)) {
      block = this.blockArray.at(block - POINTER_SIZE_IN_QUADS)
    }

    if (isFree(this.blockArray, block)) {
      return
    }

    const blockSize: int64 = readSize(this.blockArray, block)

    // 对地址是否合法进行断言
    assert(blockSize === readSize(this.blockArray, block + blockSize + 1n))

    /* istanbul ignore if  */
    assert(!(blockSize < MIN_FREEABLE_SIZE_IN_QUADS || blockSize > (this.heapLength - OVERHEAD_IN_BYTES) / 4n), `Invalid block: ${block}, got block size: ${quadsToBytes(blockSize)}`)

    const preceding: int64 = getFreeBlockBefore(this.blockArray, block)
    const trailing: int64 = getFreeBlockAfter(this.blockArray, block)

    if (preceding !== reinterpret_cast<int64>(nullptr)) {
      if (trailing !== reinterpret_cast<int64>(nullptr)) {
        insertMiddle(this.blockArray, preceding, block, blockSize, trailing, this.updates)
      }
      else {
        insertAfter(this.blockArray, preceding, block, blockSize, this.updates)
      }
    }
    else if (trailing !== reinterpret_cast<int64>(nullptr)) {
      insertBefore(this.blockArray, trailing, block, blockSize, this.updates)
    }
    else {
      insert(this.blockArray, block, blockSize, this.updates)
    }
  }
  // @ts-ignore
  public free(address: pointer<void>): void {
    if (this.shared) {
      lock(heapMutex, !defined(DEBUG))
    }

    this.free_(address)

    if (this.shared) {
      unlock(heapMutex)
    }
  }

  // @ts-ignore
  public sizeof(address: pointer<void>): size {

    if (address === reinterpret_cast<uint64>(nullptr)) {
      return 0n
    }

    address -= this.heapOffset

    assert(!(address < FIRST_BLOCK_OFFSET_IN_BYTES || address > this.heapLength || typeof address !== 'bigint'), `Address must be between ${FIRST_BLOCK_OFFSET_IN_BYTES} and ${this.heapLength - OVERHEAD_IN_BYTES}`)

    assert(!((address & ALIGNMENT_MASK) !== reinterpret_cast<uint64>(nullptr)), `Address must be a multiple of the pointer size (${POINTER_SIZE_IN_BYTES}).`)

    let block = bytesToQuads(address)

    if (isAlign(this.blockArray, block)) {
      block = this.blockArray.at(block - POINTER_SIZE_IN_QUADS)
    }

    return reinterpret_cast<size>(quadsToBytes(readSize(this.blockArray, block)))
  }

  /**
   * 获取堆分配信息
   * 
   * @returns 
   */
  public inspect(): InspectionResult {
    return inspect(this.blockArray, this.heapOffset)
  }

  private findFreeBlock(blockArray: BlockArray, minimumSize: int64): int64 {
    let block: int64 = findFreeBlock(blockArray, minimumSize)
    if (block === HEADER_OFFSET_IN_QUADS) {
      if (this.options.growAllowed && this.heapLength < this.options.maxHeapSize) {

        const block = this.blockArray.length + 1n

        let updates: BlockArray

        this.options.memory.grow(reinterpret_cast<int32>(align(
          this.options.growSize > quadsToBytes(minimumSize) ? this.options.growSize : quadsToBytes(minimumSize),
          ALIGNMENT_MASK
        ) >> 16n))
        blockArray = new BlockArray(this.options.memory, this.heapOffset, () => bytesToQuads(this.heapLength), this.options.operator)
        updates = new BlockArray(this.options.memory, this.byteOffset, () => MAX_HEIGHT, this.options.operator)

        this.blockArray = blockArray
        this.updates = updates

        const blockSize = blockArray.length - (block - 1n) - POINTER_OVERHEAD_IN_QUADS

        writeFreeBlockSize(blockArray, blockSize, block)

        const preceding: int64 = getFreeBlockBefore(blockArray, block)
        if (preceding !== reinterpret_cast<int64>(nullptr)) {
          insertAfter(blockArray, preceding, block, blockSize, this.updates)
        }
        else {
          insert(blockArray, block, blockSize, this.updates)
        }

        if (this.handles.length) {
          array.each(this.handles, (func) => {
            func(this.options.memory.buffer)
          })
        }

        return this.findFreeBlock(this.blockArray, minimumSize)
      }
      return block
    }
    else {
      return block
    }
  }

  public getBuffer(): ArrayBufferLike {
    return this.options.memory.buffer
  }

  // @ts-ignore
  public isAlloc(pointer: pointer<void>) {
    if (this.shared) {
      lock(heapMutex, !defined(DEBUG))
    }
    const block = bytesToQuads(pointer - this.heapOffset)
    let next: int64 = this.blockArray.at(HEADER_OFFSET_IN_QUADS + NEXT_OFFSET_IN_QUADS)
    // sometime get undefined from the last free node in v8
    // but it's is all right |=_=
    while (next && next !== HEADER_OFFSET_IN_QUADS) {
      if (block >= next && block < next + this.blockArray.at(next - POINTER_SIZE_IN_QUADS)) {
        if (this.shared) {
          unlock(heapMutex)
        }
        return false
      }
      next = this.blockArray.at(next + NEXT_OFFSET_IN_QUADS)
    }
    if (this.shared) {
      unlock(heapMutex)
    }
    return true
  }
}

/**
 * Prepare the given blockArray and ensure it contains a valid header.
 */
function prepare(blockArray: BlockArray) {
  if (!verifyHeader(blockArray)) {
    writeInitialHeader(blockArray)
  }
}

/**
 * Verify that the blockArray contains a valid header.
 */
function verifyHeader(blockArray: BlockArray): boolean {
  return blockArray.at(HEADER_OFFSET_IN_QUADS - 1n) === HEADER_SIZE_IN_QUADS
    && blockArray.at(HEADER_OFFSET_IN_QUADS + HEADER_SIZE_IN_QUADS) === HEADER_SIZE_IN_QUADS
}

/**
 * Write the initial header for an empty blockArray.
 */
function writeInitialHeader(blockArray: BlockArray) {
  const header = HEADER_OFFSET_IN_QUADS
  const headerSize = HEADER_SIZE_IN_QUADS
  const block = FIRST_BLOCK_OFFSET_IN_QUADS
  const blockSize = blockArray.length - (header + headerSize + POINTER_OVERHEAD_IN_QUADS + POINTER_SIZE_IN_QUADS)

  writeFreeBlockSize(blockArray, headerSize, header)
  blockArray.set(header + HEIGHT_OFFSET_IN_QUADS, 1n)
  blockArray.set(header + NEXT_OFFSET_IN_QUADS, block)
  for (let height = 1n; height < MAX_HEIGHT; height++) {
    blockArray.set(header + NEXT_OFFSET_IN_QUADS + height, HEADER_OFFSET_IN_QUADS)
  }

  writeFreeBlockSize(blockArray, blockSize, block)
  blockArray.set(block + HEIGHT_OFFSET_IN_QUADS, 1n)
  blockArray.set(block + NEXT_OFFSET_IN_QUADS, header)
}

/**
 * Check the integrity of the freelist in the given array.
 */
function checkListIntegrity(blockArray: BlockArray): boolean {
  let block: int64 = FIRST_BLOCK_OFFSET_IN_QUADS
  while (block < blockArray.length - POINTER_SIZE_IN_QUADS) {
    const size: int64 = readSize(blockArray, block)
    /* istanbul ignore if  */
    if (size < POINTER_OVERHEAD_IN_QUADS || size >= blockArray.length - FIRST_BLOCK_OFFSET_IN_QUADS) {
      logger.fatal(`Got invalid sized chunk at ${quadsToBytes(block)} (${quadsToBytes(size)} bytes).`)
    }
    else if (isFree(blockArray, block)) {
      checkFreeBlockIntegrity(blockArray, block, size)
    }
    else {
      checkUsedBlockIntegrity(blockArray, block, size)
    }
    block += size + POINTER_OVERHEAD_IN_QUADS
  }
  return true
}

function checkFreeBlockIntegrity(blockArray: BlockArray, block: int64, blockSize: int64): boolean {
  /* istanbul ignore if  */
  if (blockArray.at(block - 1n) !== blockArray.at(block + blockSize)) {
    logger.fatal(`Block length header does not match footer (${quadsToBytes(blockArray.at(block - 1n))} vs ${quadsToBytes(blockArray.at(block + blockSize))}).`)
  }
  const height: int64 = blockArray.at(block + HEIGHT_OFFSET_IN_QUADS)
  /* istanbul ignore if  */
  if (height < 1 || height > MAX_HEIGHT) {
    logger.fatal(`Block ${quadsToBytes(block)} height must be between 1 and ${MAX_HEIGHT}, got ${height}.`)
  }
  for (let i = 0n; i < height; i++) {
    const pointer = blockArray.at(block + NEXT_OFFSET_IN_QUADS + i)
    /* istanbul ignore if  */
    if (pointer >= FIRST_BLOCK_OFFSET_IN_QUADS && !isFree(blockArray, pointer)) {
      logger.fatal(`Block ${quadsToBytes(block)} has a pointer to a non-free block (${quadsToBytes(pointer)}).`)
    }
  }
  return true
}

function checkUsedBlockIntegrity(blockArray: BlockArray, block: int64, blockSize: int64): boolean {
  /* istanbul ignore if  */
  if (blockArray.at(block - 1n) !== blockArray.at(block + blockSize)) {
    logger.fatal(`Block length header does not match footer (${quadsToBytes(blockArray.at(block - 1n))} vs ${quadsToBytes(blockArray.at(block + blockSize))}).`)
  }
  else {
    return true
  }
}


/**
 * Inspect the freelist in the given array.
 */
function inspect(blockArray: BlockArray, byteOffset: int64): InspectionResult {
  const blocks: { type: string; size: int64; node?: ListNode; offset: int64, block: int64 }[] = []
  const header: ListNode = readListNode(blockArray, HEADER_OFFSET_IN_QUADS, byteOffset)
  let block: int64 = FIRST_BLOCK_OFFSET_IN_QUADS
  let used = 0n
  while (block < blockArray.length - POINTER_SIZE_IN_QUADS) {
    const size: int64 = readSize(blockArray, block)
    /* istanbul ignore if  */
    if (size < POINTER_OVERHEAD_IN_QUADS || size >= blockArray.length) {
      logger.fatal(`Got invalid sized chunk at ${quadsToBytes(block)} (${quadsToBytes(size)})`)
    }
    if (isFree(blockArray, block)) {
      // @flowIssue todo
      blocks.push(readListNode(blockArray, block, byteOffset))
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
  return { header, blocks, total: quadsToBytes(blockArray.length), used }
}

/**
 * Convert quads to bytes.
 */
function quadsToBytes(num: int64): int64 {
  return num << BYTES_TO_QUADS_SHIFT
}

/**
 * Convert bytes to quads.
 */
function bytesToQuads(num: int64): int64 {
  return num >> BYTES_TO_QUADS_SHIFT
}

/**
 * Align the given value to 8 bytes.
 */
function align(value: int64, alignment: int64): int64 {
  return (value + alignment) & ~alignment
}

/**
 * align heap
 * 
 * @param offset heap start offset
 * @param byteLength  buffer length
 * @returns 
 */
function alignHeapOffset(offset: int64, byteLength: int64) {
  const length = byteLength - offset
  // 保证 heapLength 为 ALIGNMENT_IN_BYTES 对齐
  let heapOffset = offset + (align(length, ALIGNMENT_MASK) === length
    ? 0n
    : (length - align(length, ALIGNMENT_MASK) + ALIGNMENT_IN_BYTES))

  return heapOffset
}

function alignHeapLength(length: int64) {
  // header 所占 int length 为奇数，则总长度也需要为奇数保证 body 为偶数
  if (!((HEADER_OFFSET_IN_QUADS + HEADER_SIZE_IN_QUADS) % 2n)) {
    length -= POINTER_SIZE_IN_BYTES
  }
  return length
}

/**
 * Read the list pointers for a given block.
 */
function readListNode(blockArray: BlockArray, block: int64, byteOffset: int64): ListNode {
  const height: int64 = blockArray.at(block + HEIGHT_OFFSET_IN_QUADS)
  const pointers: int64[] = []
  for (let i = 0n; i < height; i++) {
    pointers.push(blockArray.at(block + NEXT_OFFSET_IN_QUADS + i))
  }

  return {
    type: 'free',
    block,
    offset: quadsToBytes(block) + byteOffset,
    height,
    pointers,
    size: quadsToBytes(blockArray.at(block - 1n))
  }
}


/**
 * Read the size (in quads) of the block at the given address.
 */
function readSize(blockArray: BlockArray, block: int64): int64 {
  const n = blockArray.at(block - 1n)
  const mask = n >> 31n
  return (n + mask) ^ mask
}

/**
 * Write the size of the block at the given address.
 * Note: This ONLY works for free blocks, not blocks in use.
 */
function writeFreeBlockSize(blockArray: BlockArray, size: int64, block: int64): void {
  blockArray.set(block - 1n, size)
  blockArray.set(block + size, size)
}

/**
 * Populate the `UPDATES` array with the offset of the last item in each
 * list level, *before* a node of at least the given size.
 */
function findPredecessors(blockArray: BlockArray, minimumSize: int64, UPDATES: BlockArray): void {
  const listHeight: int64 = blockArray.at(HEADER_OFFSET_IN_QUADS + HEIGHT_OFFSET_IN_QUADS)

  let node: int64 = HEADER_OFFSET_IN_QUADS

  for (let height = listHeight; height > 0; height--) {
    let next: int64 = node + NEXT_OFFSET_IN_QUADS + (height - 1n)
    while (blockArray.at(next) >= FIRST_BLOCK_OFFSET_IN_QUADS && blockArray.at(blockArray.at(next) - 1n) < minimumSize) {
      node = blockArray.at(next)
      next = node + NEXT_OFFSET_IN_QUADS + (height - 1n)
    }
    UPDATES.set(height - 1n, node)
  }
}

/**
 * Find a free block with at least the given size and return its offset in quads.
 */
function findFreeBlock(blockArray: BlockArray, minimumSize: int64): int64 {
  let block: int64 = HEADER_OFFSET_IN_QUADS

  for (let height = blockArray.at(HEADER_OFFSET_IN_QUADS + HEIGHT_OFFSET_IN_QUADS); height > 0; height--) {
    let next: int64 = blockArray.at(block + NEXT_OFFSET_IN_QUADS + (height - 1n))
    while (next !== HEADER_OFFSET_IN_QUADS && blockArray.at(next - POINTER_SIZE_IN_QUADS) < minimumSize) {
      block = next
      next = blockArray.at(block + NEXT_OFFSET_IN_QUADS + (height - 1n))
    }
  }

  block = blockArray.at(block + NEXT_OFFSET_IN_QUADS)
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
function split(blockArray: BlockArray, block: int64, firstSize: int64, blockSize: int64, UPDATES: BlockArray): void {
  const second: int64 = (block + firstSize + POINTER_OVERHEAD_IN_QUADS)
  const secondSize: int64 = (blockSize - (second - block))

  remove(blockArray, block, blockSize, UPDATES)

  blockArray.set(block - 1n, -firstSize)
  blockArray.set(block + firstSize, -firstSize)

  blockArray.set(second - 1n, -secondSize)
  blockArray.set(second + secondSize, -secondSize)

  insert(blockArray, second, secondSize, UPDATES)
}

/**
 * Remove the given block from the freelist and mark it as allocated.
 */
function remove(blockArray: BlockArray, block: int64, blockSize: int64, UPDATES: BlockArray): void {
  findPredecessors(blockArray, blockSize, UPDATES)

  let node: int64 = blockArray.at(UPDATES.at(0n) + NEXT_OFFSET_IN_QUADS)

  while (node !== block && node !== HEADER_OFFSET_IN_QUADS && blockArray.at(node - 1n) <= blockSize) {
    for (let height: int64 = blockArray.at(node + HEIGHT_OFFSET_IN_QUADS) - 1n; height >= 0; height--) {
      if (blockArray.at(node + NEXT_OFFSET_IN_QUADS + height) === block) {
        UPDATES.set(height, node)
      }
    }
    node = blockArray.at(node + NEXT_OFFSET_IN_QUADS)
  }

  assert(node === block, 'Could not find block to remove.')

  let listHeight: int64 = blockArray.at(HEADER_OFFSET_IN_QUADS + HEIGHT_OFFSET_IN_QUADS)
  for (let height = 0n; height < listHeight; height++) {
    const next: int64 = blockArray.at(UPDATES.at(height) + NEXT_OFFSET_IN_QUADS + height)
    if (next !== block) {
      break
    }
    blockArray.set(UPDATES.at(height) + NEXT_OFFSET_IN_QUADS + height, blockArray.at(block + NEXT_OFFSET_IN_QUADS + height))
  }

  while (listHeight > 0 && blockArray.at(HEADER_OFFSET_IN_QUADS + NEXT_OFFSET_IN_QUADS + (listHeight - 1n)) === HEADER_OFFSET_IN_QUADS) {
    listHeight--
    blockArray.set(HEADER_OFFSET_IN_QUADS + HEIGHT_OFFSET_IN_QUADS, listHeight)
  }
  // invert the size sign to signify an allocated block

  blockArray.set(block - 1n, -blockSize)
  blockArray.set(block + blockSize, -blockSize)
}

/**
 * Determine whether the block at the given address is free or not.
 */
function isFree(blockArray: BlockArray, block: int64): boolean {
  /* istanbul ignore if  */
  if (block < HEADER_SIZE_IN_QUADS) {
    return false
  }

  const size: int64 = blockArray.at(block - POINTER_SIZE_IN_QUADS)

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
function isAlign(blockArray: BlockArray, block: int64): boolean {
  /* istanbul ignore if  */
  if (block < HEADER_SIZE_IN_QUADS) {
    return false
  }

  const origin: int64 = blockArray.at(block - POINTER_SIZE_IN_QUADS)

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
function getFreeBlockBefore(blockArray: BlockArray, block: int64): int64 {
  if (block <= FIRST_BLOCK_OFFSET_IN_QUADS) {
    return reinterpret_cast<int64>(nullptr)
  }
  const beforeSize: int64 = blockArray.at(block - POINTER_OVERHEAD_IN_QUADS)

  if (beforeSize < POINTER_OVERHEAD_IN_QUADS) {
    return reinterpret_cast<int64>(nullptr)
  }
  return block - (POINTER_OVERHEAD_IN_QUADS + beforeSize)
}

/**
 * Get the address of the block after the given one and return its address *if it is free*,
 * otherwise 0.
 */
function getFreeBlockAfter(blockArray: BlockArray, block: int64): int64 {
  const blockSize: int64 = readSize(blockArray, block)
  if (block + blockSize + POINTER_OVERHEAD_IN_QUADS >= blockArray.length - 2n) {
    // Block is the last in the list.
    return reinterpret_cast<int64>(nullptr)
  }
  const next: int64 = (block + blockSize + POINTER_OVERHEAD_IN_QUADS)
  const nextSize: int64 = blockArray.at(next - POINTER_SIZE_IN_QUADS)

  if (nextSize < POINTER_OVERHEAD_IN_QUADS) {
    return reinterpret_cast<int64>(nullptr)
  }
  return next
}


/**
 * Insert the given block into the freelist and return the number of bytes that were freed.
 */
function insert(blockArray: BlockArray, block: int64, blockSize: int64, UPDATES: BlockArray): int64 {
  findPredecessors(blockArray, blockSize, UPDATES)
  const blockHeight: int64 = generateHeight(blockArray, block, blockSize, UPDATES)

  for (let height = 1n; height <= blockHeight; height++) {
    const update: int64 = UPDATES.at(height - 1n) + NEXT_OFFSET_IN_QUADS + (height - 1n)
    blockArray.set(block + NEXT_OFFSET_IN_QUADS + (height - 1n), blockArray.at(update))
    blockArray.set(update, block)
    UPDATES.set(height - 1n, HEADER_OFFSET_IN_QUADS)
  }

  blockArray.set(block - 1n, blockSize)
  blockArray.set(block + blockSize, blockSize)
  return blockSize
}


/**
 * Insert the given block into the freelist before the given free block,
 * joining them together, returning the number of bytes which were freed.
 */
function insertBefore(blockArray: BlockArray, trailing: int64, block: int64, blockSize: int64, UPDATES: BlockArray): int64 {
  const trailingSize: int64 = readSize(blockArray, trailing)
  remove(blockArray, trailing, trailingSize, UPDATES)
  const size: int64 = (blockSize + trailingSize + POINTER_OVERHEAD_IN_QUADS)
  blockArray.set(block - POINTER_SIZE_IN_QUADS, -size)
  blockArray.set(trailing + trailingSize, -size)
  insert(blockArray, block, size, UPDATES)
  return blockSize
}

/**
 * Insert the given block into the freelist in between the given free blocks,
 * joining them together, returning the number of bytes which were freed.
 */
function insertMiddle(blockArray: BlockArray, preceding: int64, block: int64, blockSize: int64, trailing: int64, UPDATES: BlockArray): int64 {
  const precedingSize: int64 = readSize(blockArray, preceding)
  const trailingSize: int64 = readSize(blockArray, trailing)
  const size: int64 = ((trailing - preceding) + trailingSize)

  remove(blockArray, preceding, precedingSize, UPDATES)
  remove(blockArray, trailing, trailingSize, UPDATES)
  blockArray.set(preceding - POINTER_SIZE_IN_QUADS, -size)
  blockArray.set(trailing + trailingSize, -size)
  insert(blockArray, preceding, size, UPDATES)
  return blockSize
}

/**
 * Insert the given block into the freelist after the given free block,
 * joining them together, returning the number of bytes which were freed.
 */
function insertAfter(blockArray: BlockArray, preceding: int64, block: int64, blockSize: int64, UPDATES: BlockArray): int64 {
  const precedingSize: int64 = (block - preceding) - POINTER_OVERHEAD_IN_QUADS
  const size: int64 = ((block - preceding) + blockSize)
  remove(blockArray, preceding, precedingSize, UPDATES)
  blockArray.set(preceding - POINTER_SIZE_IN_QUADS, -size)
  blockArray.set(block + blockSize, -size)
  insert(blockArray, preceding, size, UPDATES)
  return blockSize
}



/**
 * Generate a random height for a block, growing the list height by 1 if required.
 */
function generateHeight(blockArray: BlockArray, block: int64, blockSize: int64, UPDATES: BlockArray): int64 {
  const listHeight: int64 = blockArray.at(HEADER_OFFSET_IN_QUADS + HEIGHT_OFFSET_IN_QUADS)
  let height: int64 = randomHeight()

  if (blockSize - 1n < height + 1n) {
    height = blockSize - 2n
  }

  if (height > listHeight) {
    const newHeight: int64 = listHeight + 1n
    blockArray.set(HEADER_OFFSET_IN_QUADS + HEIGHT_OFFSET_IN_QUADS, newHeight)
    blockArray.set(HEADER_OFFSET_IN_QUADS + NEXT_OFFSET_IN_QUADS + (newHeight - 1n), HEADER_OFFSET_IN_QUADS)
    UPDATES.set(newHeight, HEADER_OFFSET_IN_QUADS)
    blockArray.set(block + HEIGHT_OFFSET_IN_QUADS, newHeight)
    return newHeight
  }
  else {
    blockArray.set(block + HEIGHT_OFFSET_IN_QUADS, height)
    return height
  }
}

/**
 * Generate a random height for a new block.
 */
function randomHeight(): int64 {
  let height: int64 = 1n
  while (Math.random() < 0.5 && height < MAX_HEIGHT) {
    height += 1n
  }
  return height
}
