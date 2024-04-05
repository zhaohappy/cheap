import Allocator from './Allocator'
import * as object from 'common/util/object'

export type AllocatorWebassemblyOptions = {
  memory: WebAssembly.Memory
  instance: WebAssembly.Instance
  map?: {
    malloc: string
    calloc: string
    realloc: string
    alignedAlloc: string
    free: string
  }
}

const DefaultMap = {
  malloc: 'malloc',
  calloc: 'calloc',
  realloc: 'realloc',
  alignedAlloc: 'aligned_alloc',
  free: 'free'
}

export default class AllocatorWebassembly implements Allocator {

  public onArrayBufferUpdate: (buffer: ArrayBuffer) => void

  private instance: WebAssembly.Instance

  private options: AllocatorWebassemblyOptions

  constructor(options: AllocatorWebassemblyOptions) {
    this.options = object.extend({}, {
      map: DefaultMap
    }, options)

    this.instance = options.instance
  }

  public addUpdateHandle(handle: (buffer: ArrayBuffer) => void): void {
  }

  public removeUpdateHandle(handle: (buffer: ArrayBuffer) => void): void {
  }

  /**
   * Allocate a given number of bytes and return the offset.
   * If allocation fails, returns 0.
   */
  public malloc(size: size): pointer<void> {
    return this.call('malloc', [size])
  }
  public calloc(num: size, size: size): pointer<void> {
    return this.call('calloc', [num, size])
  }
  public realloc(address: pointer<void>, size: size): pointer<void> {
    return this.call('realloc', [address, size])
  }
  public alignedAlloc(alignment: size, size: size): pointer<void> {
    return this.call('alignedAlloc', [alignment, size])
  }
  /**
   * Free a number of bytes from the given address.
   */
  public free(address: pointer<void>): void {
    this.call('free', [address])
  }

  public isAlloc(pointer: pointer<void>) {
    return true
  }

  private call(func: string, args?: number[]): number {
    if (!this.asm) {
      return nullptr
    }

    let call: Function
    if (this.asm[func]) {
      call = this.asm[func]
    }
    else if (this.options.map[func] && this.asm[this.options.map[func]]) {
      call = this.asm[this.options.map[func]] as Function
    }
    if (call) {
      return call.apply(null, args)
    }
    else {
      return nullptr
    }
  }

  public sizeof(address: int32): size {
    return 0
  }

  public onGrow(memory: WebAssembly.Memory) {
    if (this.onArrayBufferUpdate) {
      this.onArrayBufferUpdate(memory.buffer)
    }
  }

  public getBuffer(): ArrayBuffer {
    return this.options.memory.buffer
  }

  get asm() {
    return this.instance && this.instance.exports as Object
  }
}
