import { memcpy } from '../../std/memory'
import { CTypeEnumWrite } from '../../ctypeEnumWrite'
import type { CTypeEnum } from '../../typedef'
import * as is from 'common/util/is'
import { CTypeEnumRead } from '../../ctypeEnumRead'
import structAccess from '../structAccess'
import { symbolStructAddress } from '../../symbol'

type ListNodeDepth = [never, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9]

@struct
class ListNode<T = void, D extends ListNodeDepth[number] = 9> {
  // @ts-ignore
  @type(ListNode<T>)
  @pointer()
  prev: [D] extends [never] ? never : pointer<ListNode<T, ListNodeDepth[D]>>

  // @ts-ignore
  @type(ListNode<T>)
  @pointer()
  next: [D] extends [never] ? never : pointer<ListNode<T, ListNodeDepth[D]>>

  data: pointer<T>
}

@struct
export default class List<T> {

  public length: uint32 = 0

  public head: pointer<ListNode<T>> = nullptr
  public tail: pointer<ListNode<T>> = nullptr

  private createNode(item: any, type?: CTypeEnum | struct<{}>, move: boolean = false) {
    const pNode = malloc(sizeof(ListNode)) as pointer<ListNode<T>>

    pNode.next = nullptr
    pNode.prev = nullptr

    if (is.number(type)) {
      assert(is.number(item) || is.bigint(item))
      if (type === typeptr) {
        pNode.data = reinterpret_cast<pointer<T>>(item)
      }
      else {
        const p = malloc(sizeof(type))
        CTypeEnumWrite[type as uint8](p, item)
        pNode.data = reinterpret_cast<pointer<T>>(p)
      }
    }
    else {
      if (move) {
        assert(is.number(item) && item)
        pNode.data = reinterpret_cast<pointer<T>>(item)
      }
      else {
        const p = malloc(sizeof(type))
        memcpy(p, item[symbolStructAddress], sizeof(type))
        pNode.data = reinterpret_cast<pointer<T>>(p)
      }
    }
    return pNode
  }

  private getItem(data: pointer<T>, type: CTypeEnum | struct<any>) {
    let result: T

    if (is.number(type)) {
      if (type === typeptr) {
        result = data as T
      }
      else {
        result = CTypeEnumRead[type](data as pointer<T>)
      }
    }
    else {
      result = structAccess(data as pointer<struct<any>>, type as any)
    }

    return result
  }

  public push<args=[T]>(item: T): void
  public push<args=[T, true]>(item: pointer<T>): void
  public push(item: any, type?: T, move: boolean = false) {

    const pNode = this.createNode(item, type, move)

    if (!this.tail) {

      assert(!this.head)

      this.head = pNode
      this.tail = pNode
    }
    else {
      this.tail.next = reinterpret_cast<pointer<ListNode<T>>>(pNode)
      pNode.prev = reinterpret_cast<pointer<ListNode<T>>>(this.tail)
      this.tail = pNode
    }

    this.length++
  }

  public pop<args=[T]>(): T
  public pop(type?: T): T {
    assert(this.length)

    const pNode = this.tail

    let result = this.getItem(pNode.data, type)

    if (this.length > 1) {
      pNode.prev.next = nullptr
      this.tail = reinterpret_cast<pointer<ListNode<T>>>(pNode.prev)
    }
    else {
      this.head = this.tail = nullptr
    }

    this.length--

    free(reinterpret_cast<pointer<void>>(pNode.data))
    free(pNode)

    return result
  }

  public shift<args=[T]>(): T
  public shift(type?: T): T {
    assert(this.length)

    const pNode = this.head

    let result = this.getItem(pNode.data, type)

    if (this.length > 1) {
      pNode.next.prev = nullptr
      this.head = reinterpret_cast<pointer<ListNode<T>>>(pNode.next)
    }
    else {
      this.head = this.tail = nullptr
    }

    this.length--

    free(reinterpret_cast<pointer<void>>(pNode.data))
    free(pNode)

    return result
  }

  public unshift<args=[T]>(item: T): void
  public unshift<args=[T, true]>(item: pointer<T>): void
  public unshift(item: any, type?: T, move: boolean = false) {

    const pNode = this.createNode(item, type, move)

    if (!this.head) {

      assert(!this.tail)

      this.head = pNode
      this.tail = pNode
    }
    else {
      this.head.prev = reinterpret_cast<pointer<ListNode<T>>>(pNode)
      pNode.next = reinterpret_cast<pointer<ListNode<T>>>(this.head)
      this.head = pNode
    }

    this.length++
  }

  public forEach<args=[T]>(callback: (item: T, index?: uint32) => boolean | void): void
  public forEach(callback: (item: T, index: uint32) => boolean, type?: T) {
    if (!this.length) {
      return
    }
    let current = this.head
    let index = 0
    while (current !== nullptr) {
      if (callback(this.getItem(current.data, type), index) === false) {
        break
      }
      current = reinterpret_cast<pointer<ListNode<T>>>(current.next)
      index++
    }
  }

  public find<args=[T]>(callback: (item: T, index?: uint32) => boolean): T
  public find(callback: (item: T, index: uint32) => boolean, type?: T): T {
    if (!this.length) {
      return nullptr as T
    }
    let current = this.head
    let index = 0
    while (current !== nullptr) {
      const item = this.getItem(current.data, type)
      if (callback(item, index) === true) {
        return item
      }
      current = reinterpret_cast<pointer<ListNode<T>>>(current.next)
      index++
    }
    return nullptr as T
  }

  public indexOf<args=[T]>(index: uint32): T
  public indexOf(index: uint32, type?: T): T {
    if (!this.length) {
      return nullptr as T
    }

    assert(index >= 0 && index < this.length)

    let current = this.head
    let i = 0
    while (current !== nullptr) {
      if (i === index) {
        return this.getItem(current.data, type)
      }
      current = reinterpret_cast<pointer<ListNode<T>>>(current.next)
      i++
    }
    return nullptr as T
  }

  public clear<args=[T]>(callback?: (item: T) => void): void
  public clear(callback?: (item: T) => void, type?: T) {
    if (this.length) {
      let current = this.head
      while (current !== nullptr) {
        if (callback) {
          callback(this.getItem(current.data, type))
        }
        free(reinterpret_cast<pointer<void>>(current.data))
        const next = reinterpret_cast<pointer<ListNode<T>>>(current.next)
        free(current)
        current = next
      }
    }
    this.head = this.tail = nullptr
    this.length = 0
  }
}
