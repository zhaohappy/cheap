
interface Node {
  pointer: number
  length: number
  free: boolean
}

export const enum BuiltinTableSlot {
  FREE = 1,
  MALLOC,
  CALLOC,
  REALLOC,
  ALIGNED_ALLOC,
  SLOT_NB
}

const INIT_SIZE = 10

export class WebassemblyTable {

  table: WebAssembly.Table

  pointer: number

  private nodes: Node[]

  constructor() {
    this.table = new WebAssembly.Table({
      initial: BuiltinTableSlot.SLOT_NB + INIT_SIZE,
      element: 'anyfunc'
    })

    this.pointer = BuiltinTableSlot.SLOT_NB
    this.nodes = [{
      pointer: this.pointer,
      length: INIT_SIZE,
      free: true
    }]
  }

  public getPointer() {
    return this.pointer
  }

  public alloc(count: number) {

    let p = this.findFree(count)

    if (p < 0) {
      const last = this.nodes[this.nodes.length - 1]

      const length = count - (last.free ? last.length : 0)

      this.table.grow(length)

      if (last.free) {
        last.length = last.length + length
      }
      else {
        this.nodes.push({
          pointer: last.pointer + last.length,
          length,
          free: true
        })
      }

      p = this.findFree(count)
    }

    const node = this.nodes[p]

    if (node.length > count) {
      this.nodes.splice(p + 1, 0, {
        pointer: node.pointer + count,
        length: node.length - count,
        free: true
      })
      node.length = count
    }

    node.free = false

    return node.pointer
  }

  public free(pointer: number) {
    let p = this.findNode(pointer)
    const node = this.nodes[p]

    if (node && !node.free) {
      const before = this.nodes[p - 1]
      const after = this.nodes[p + 1]

      if (before && before.free) {
        if (after && after.free) {
          before.length += (node.length + after.length)
          this.nodes.splice(p, 2)
        }
        else {
          before.length += node.length
          this.nodes.splice(p, 1)
        }
      }
      else {
        if (after && after.free) {
          node.length += after.length
          this.nodes.splice(p + 1, 1)
          node.free = true
        }
        else {
          node.free = true
        }
      }
    }

    if (this.nodes.length === 1 && this.nodes[0].free) {
      // 当全部 free 之后重新创建新的 Table，之前 WebAssembly 设置的函数引用在 chrome 上没有被回收，会内存泄漏
      const table = new WebAssembly.Table({
        initial: BuiltinTableSlot.SLOT_NB + INIT_SIZE,
        element: 'anyfunc'
      })
      this.pointer = BuiltinTableSlot.SLOT_NB
      this.nodes = [{
        pointer: this.pointer,
        length: INIT_SIZE,
        free: true
      }]
      for (let i = 1; i < this.pointer; i++) {
        table.set(i, this.table.get(i))
      }
      this.table = table
    }
  }

  public get<T extends(...args: any[]) => any>(index: pointer<T>): T {
    return this.table.get(index)
  }

  public set<T extends(...args: any[]) => any>(index: number, value: T) {
    if (index < 0 || index >= this.pointer) {
      throw new RangeError('index out of bound')
    }
    this.table.set(index, value)
  }

  public inspect() {
    return this.nodes
  }

  private findFree(length: number) {
    let index = -1
    for (let i = 0; i < this.nodes.length; i++) {
      if (this.nodes[i].length >= length && this.nodes[i].free) {
        index = i
        break
      }
    }
    return index
  }

  private findNode(pointer: number) {
    let index = -1
    for (let i = 0; i < this.nodes.length; i++) {
      if (this.nodes[i].pointer === pointer) {
        index = i
        break
      }
    }
    return index
  }
}
