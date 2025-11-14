import type { CTypeEnum, Struct } from '../../typedef'

import { symbolStruct, symbolStructAddress } from '../../symbol'
import { CTypeEnumWrite } from '../../ctypeEnumWrite'
import * as atomic from '../../thread/atomics'
import { mapUint8Array, memcpyFromUint8Array } from '../memory'
import * as stack from '../../stack'
import make from '../make'
import isPointer from '../function/isPointer'

import {
  isDef,
  is,
  isWorker,
  type Data
} from '@libmedia/common'

import { SELF } from '@libmedia/common/constant'

@struct
class SharedPtrStruct<T> {
  value: pointer<T>
  refCount: atomic_int32
}

const deleterMap: Map<pointer<SharedPtrStruct<void>>, {
  deleter: deleter<void> | null
  refCount: number
}> = new Map()

function freeSharedPtr(value: pointer<SharedPtrStruct<void>>) {
  if (atomic.sub(addressof(value.refCount), 1) === 1) {
    const deleter = deleterMap.get(value)
    if (deleter.deleter) {
      deleter.deleter(value.value)
    }
    else {
      free(value.value as pointer<void>)
    }
    free(value)
    deleterMap.delete(value)
  }
  if (deleterMap.has(value)) {
    deleterMap.get(value).refCount--
    if (deleterMap.get(value).refCount === 0) {
      deleterMap.delete(value)
    }
  }
}

const registry = new FinalizationRegistry<pointer<SharedPtrStruct<void>>>((value) => {
  freeSharedPtr(value)
})

if (isWorker()) {
  // @ts-ignore
  SELF.__freeSmartPtr__ = () => {
    deleterMap.forEach((item, p) => {
      freeSharedPtr(p)
    })
    deleterMap.clear()
  }
}

class SharedPtrImpl<T extends (BuiltinType | {})> {

  private value: pointer<SharedPtrStruct<T>>

  private deleter: deleter<T>

  constructor(value: pointer<SharedPtrStruct<T>>, deleter: deleter<T> = null) {
    this.value = value
    this.deleter = deleter
    if (value) {
      const del = deleterMap.get(this.value as pointer<SharedPtrStruct<void>>) || {
        deleter,
        refCount: 0
      }
      del.refCount++
      deleterMap.set(this.value as pointer<SharedPtrStruct<void>>, del as any)
      atomic.add(addressof(value.refCount), 1)
      registry.register(this, this.value as pointer<SharedPtrStruct<void>>)
    }
  }

  /**
   * 获取原始指针
   */
  public get() {
    if (!this.value) {
      return nullptr
    }
    return this.value.value
  }

  /**
   * 重置原始指针
   * 
   * @param value 
   */
  public reset(value: pointer<T> | nullptr = nullptr) {
    if (this.value) {
      if (atomic.sub(addressof(this.value.refCount), 1) === 1) {
        const deleter = deleterMap.get(this.value as pointer<SharedPtrStruct<void>>)
        if (deleter.deleter) {
          deleterMap.get(this.value as pointer<SharedPtrStruct<void>>).deleter(this.value.value as pointer<void>)
        }
        else {
          free(this.value.value as pointer<void>)
        }
        free(this.value)
        this.value = nullptr
        deleterMap.delete(this.value as pointer<SharedPtrStruct<void>>)
      }
      if (deleterMap.has(this.value as pointer<SharedPtrStruct<void>>)) {
        deleterMap.get(this.value as pointer<SharedPtrStruct<void>>).refCount--
        if (deleterMap.get(this.value as pointer<SharedPtrStruct<void>>).refCount === 0) {
          deleterMap.delete(this.value as pointer<SharedPtrStruct<void>>)
        }
      }
    }
    if (value) {
      const s = reinterpret_cast<pointer<SharedPtrStruct<T>>>(malloc(sizeof(SharedPtrStruct)))
      s.value = value as pointer<T>
      s.refCount = 1
      this.value = s

      const del = deleterMap.get(this.value as pointer<SharedPtrStruct<void>>) || {
        deleter: this.deleter,
        refCount: 0
      }
      del.refCount++
      deleterMap.set(this.value as pointer<SharedPtrStruct<void>>, del as any)
    }
  }

  /**
   * 返回当前的原始指针是否只有一个引用
   */
  public unique() {
    return atomic.load(addressof(this.value.refCount)) === 1
  }

  /**
   * 返回当前的引用计数
   */
  public useCount() {
    return atomic.load(addressof(this.value.refCount))
  }

  /**
   * 返回管理的地址是否有值
   */
  public has() {
    return this.value !== nullptr
  }

  /**
   * 将智能指针转为可转移
   */
  public transferable(): SharedPtrTransferable<T> {
    const p = reinterpret_cast<pointer<pointer<SharedPtrStruct<T>>>>(stack.malloc(sizeof(pointer)))
    accessof(p) <- this.value
    const buffer = mapUint8Array(reinterpret_cast<pointer<uint8>>(p), sizeof(pointer)).slice()
    stack.free(sizeof(pointer))

    atomic.add(addressof(this.value.refCount), 1)
    registry.register(buffer.buffer, this.value as pointer<SharedPtrStruct<void>>)
    return {
      buffer: buffer.buffer
    }
  }

  /**
   * 克隆智能指针（增加引用计数）
   * 
   * @returns 
   */
  public clone() {
    if (deleterMap.has( this.value as pointer<SharedPtrStruct<void>>)) {
      deleterMap.get( this.value as pointer<SharedPtrStruct<void>>).refCount++
    }
    return new SharedPtrImpl(this.value)
  }
}

export function makeSharedPtr<T extends BuiltinType, args=[T]>(): SharedPtr<T>
export function makeSharedPtr<T extends BuiltinType, args=[T]>(deleter: deleter<T>): SharedPtr<T>
export function makeSharedPtr<T extends BuiltinType, args=[T]>(value: T): SharedPtr<T>
export function makeSharedPtr<T extends BuiltinType, args=[T, undefined, true]>(value: pointer<T>): SharedPtr<T>
export function makeSharedPtr<T extends BuiltinType, args=[T]>(value: T, deleter: deleter<T>): SharedPtr<T>
export function makeSharedPtr<T extends BuiltinType, args=[T, true]>(value: pointer<T>, deleter: deleter<T>): SharedPtr<T>

export function makeSharedPtr<T extends {}, args=[T]>(): SharedPtr<T>
export function makeSharedPtr<T extends {}, args=[T]>(deleter: deleter<T>): SharedPtr<T>
export function makeSharedPtr<T extends {}, args=[T]>(init: Partial<SetOmitFunctions<T>>): SharedPtr<T>
export function makeSharedPtr<T extends {}, args=[T]>(init: pointer<T>): SharedPtr<T>
export function makeSharedPtr<T extends {}, args=[T]>(init: T): SharedPtr<T>
export function makeSharedPtr<T extends {}, args=[T]>(init: pointer<T>, deleter: deleter<T>): SharedPtr<T>
export function makeSharedPtr<T extends {}, args=[T]>(init: T, deleter: deleter<T>): SharedPtr<T>
export function makeSharedPtr<T extends {}, args=[T]>(init: Partial<SetOmitFunctions<T>>, deleter: deleter<T>): SharedPtr<T>

export function makeSharedPtr<T>(
  value?: CTypeEnum | {} | deleter<T> | number | bigint | boolean | pointer<T> | nullptr,
  deleter?: CTypeEnum | {} | deleter<T>,
  type?: CTypeEnum | {},
  valueIsPointer?: boolean
): SharedPtr<T> {
  // makeSharedPtr<T>(value, deleter)
  if (isDef(type)) {
    if (is.number(type)) {
      let raw: pointer<T> = reinterpret_cast<pointer<T>>(nullptr)
      if (valueIsPointer) {
        raw = reinterpret_cast<pointer<T>>(value as pointer<void>)
      }
      else {
        raw = reinterpret_cast<pointer<T>>(malloc(sizeof(type)))
        CTypeEnumWrite[type as uint8](raw, value as uint8)
      }
      let s: pointer<SharedPtrStruct<T>> = nullptr
      if (raw) {
        s = reinterpret_cast<pointer<SharedPtrStruct<T>>>(malloc(sizeof(SharedPtrStruct)))
        s.refCount = 0
        s.value = raw
      }
      return new SharedPtrImpl(s, deleter as deleter<T>) as unknown as SharedPtr<T>
    }
    else if (is.func(type) && type.prototype[symbolStruct]) {
      let raw: pointer<T> = reinterpret_cast<pointer<T>>(nullptr)
      if (isPointer(value)) {
        raw = reinterpret_cast<pointer<T>>(value)
      }
      else {
        const p: T = value[symbolStruct] ? value : make(value as Data, type as Struct)
        raw = p[symbolStructAddress]
      }
      let s: pointer<SharedPtrStruct<T>> = nullptr
      if (raw) {
        s = reinterpret_cast<pointer<SharedPtrStruct<T>>>(malloc(sizeof(SharedPtrStruct)))
        s.refCount = 0
        s.value = raw
      }
      return new SharedPtrImpl(s, deleter as deleter<T>) as unknown as SharedPtr<T>
    }
    else {
      throw new Error('invalid params')
    }
  }
  // makeSharedPtr<T>(value)
  // makeSharedPtr<T>(deleter)
  else if (isDef(deleter)) {
    if (is.number(deleter)) {
      let raw: pointer<T> = reinterpret_cast<pointer<T>>(nullptr)
      if (valueIsPointer) {
        raw = reinterpret_cast<pointer<T>>(value as pointer<void>)
      }
      else {
        raw = reinterpret_cast<pointer<T>>(malloc(sizeof(deleter)))
        if (!is.func(value)) {
          CTypeEnumWrite[deleter as uint8](raw, value as uint8)
        }
      }
      let s: pointer<SharedPtrStruct<T>> = nullptr
      if (raw) {
        s = reinterpret_cast<pointer<SharedPtrStruct<T>>>(malloc(sizeof(SharedPtrStruct)))
        s.refCount = 0
        s.value = raw
      }
      return new SharedPtrImpl(s, is.func(value) ? value as deleter<T> : null) as unknown as SharedPtr<T>
    }
    else if (is.func(deleter) && deleter.prototype[symbolStruct]) {
      let raw: pointer<T> = reinterpret_cast<pointer<T>>(nullptr)
      if (isPointer(value)) {
        raw = reinterpret_cast<pointer<T>>(value)
      }
      else {
        const p = value[symbolStruct] ? value : make(is.func(value) ? {} : value as Data, deleter as (new (...args: any[]) => T))
        raw = p[symbolStructAddress]
      }
      let s: pointer<SharedPtrStruct<T>> = nullptr
      if (raw) {
        s = reinterpret_cast<pointer<SharedPtrStruct<T>>>(malloc(sizeof(SharedPtrStruct)))
        s.refCount = 0
        s.value = raw
      }
      return new SharedPtrImpl(s, is.func(value) ? value as deleter<T> : null) as unknown as SharedPtr<T>
    }
    else {
      throw new Error('invalid params')
    }
  }
  // makeSharedPtr<T>()
  else {
    const p = reinterpret_cast<pointer<T>>(malloc(sizeof(value as (CTypeEnum | Struct))))
    const s = reinterpret_cast<pointer<SharedPtrStruct<T>>>(malloc(sizeof(SharedPtrStruct)))
    s.value = p
    s.refCount = 0
    return new SharedPtrImpl(s) as unknown as SharedPtr<T>
  }
}

export function deTransferableSharedPtr<T extends(BuiltinType | {})>(transfer: SharedPtrTransferable<T>, deleter?: deleter<T>): SharedPtr<T> {
  const p = reinterpret_cast<pointer<pointer<SharedPtrStruct<T>>>>(stack.malloc(sizeof(pointer)))
  memcpyFromUint8Array(reinterpret_cast<pointer<uint8>>(p), sizeof(pointer), new Uint8Array(transfer.buffer))
  const ptr = new SharedPtrImpl(accessof(p), deleter)
  stack.free(sizeof(pointer))
  return ptr as unknown as SharedPtr<T>
}
