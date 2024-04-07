
interface Node {
  pointer: number
  length: number
  free: boolean
}

export class WebassemblyTable {

  table: WebAssembly.Table

  pointer: number

  private nodes: Node[]

  constructor() {
    this.table = new WebAssembly.Table({
      initial: 10,
      element: 'anyfunc'
    })

    this.pointer = 1
    this.nodes = [{
      pointer: 1,
      length: 9,
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
