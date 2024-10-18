import isDef from 'common/function/isDef'
import { CTypeEnum, Struct } from '../../typedef'

import * as is from 'common/util/is'
import { symbolStruct, symbolStructAddress } from '../../symbol'
import { CTypeEnumWrite } from '../../ctypeEnumWrite'
import * as atomic from '../../thread/atomics'
import { mapUint8Array, memcpyFromUint8Array } from '../memory'
import * as stack from '../../stack'
import { SELF } from 'common/util/constant'
import isWorker from 'common/function/isWorker'
import make from '../make'

@struct
class SharedPtrStruct<T> {
  value: pointer<T>
  refCount: atomic_int32
}

const deleterMap: Map<pointer<SharedPtrStruct<void>>, {
  deleter?: deleter<void>
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

  constructor(value: pointer<SharedPtrStruct<T>>, deleter?: deleter<T>) {
    this.value = value
    this.deleter = deleter
    const del = deleterMap.get(this.value as pointer<SharedPtrStruct<void>>) || {
      deleter,
      refCount: 0
    }
    del.refCount++
    deleterMap.set(this.value as pointer<SharedPtrStruct<void>>, del as any)
    atomic.add(addressof(value.refCount), 1)
    registry.register(this, this.value as pointer<SharedPtrStruct<void>>)
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
  public reset(value: pointer<T> = nullptr as pointer<T>) {
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
      const s: pointer<SharedPtrStruct<T>> = malloc(sizeof(SharedPtrStruct))
      s.value = value
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
export function makeSharedPtr<T extends BuiltinType, args=[T]>(value: T, deleter: deleter<T>): SharedPtr<T>

export function makeSharedPtr<T extends {}, args=[T]>(): SharedPtr<T>
export function makeSharedPtr<T extends {}, args=[T]>(deleter: deleter<T>): SharedPtr<T>
export function makeSharedPtr<T extends {}, args=[T]>(init: Partial<SetOmitFunctions<T>>): SharedPtr<T>
export function makeSharedPtr<T extends {}, args=[T]>(init: Partial<SetOmitFunctions<T>>, deleter: deleter<T>): SharedPtr<T>

export function makeSharedPtr(
  value?: CTypeEnum | Object | deleter<void> | number | bigint,
  deleter?: CTypeEnum | Object | deleter<void>,
  type?: CTypeEnum | Object
): SharedPtr<any> {
  // makeSharedPtr<T>(value, deleter)
  if (isDef(type)) {
    if (is.number(type)) {
      const p = malloc(sizeof(type))
      CTypeEnumWrite[type as uint8](p, value as number)
      const s: pointer<SharedPtrStruct<void>> = malloc(sizeof(SharedPtrStruct))
      s.value = p
      s.refCount = 0
      // @ts-ignore
      return new SharedPtrImpl(s as pointer<any>, deleter as deleter<any>)
    }
    else if (is.func(type) && type.prototype[symbolStruct]) {
      const p = make(value as any, type as Struct)
      const s: pointer<SharedPtrStruct<void>> = malloc(sizeof(SharedPtrStruct))
      s.value = p[symbolStructAddress]
      s.refCount = 0
      // @ts-ignore
      return new SharedPtrImpl(s as pointer<any>, deleter as deleter<any>)
    }
    else {
      throw new Error('invalid params')
    }
  }
  // makeSharedPtr<T>(value)
  // makeSharedPtr<T>(deleter)
  else if (isDef(deleter)) {
    if (is.number(deleter)) {
      const p = malloc(sizeof(deleter))
      if (!is.func(value)) {
        CTypeEnumWrite[deleter as uint8](p, value as number)
      }
      const s: pointer<SharedPtrStruct<void>> = malloc(sizeof(SharedPtrStruct))
      s.value = p
      s.refCount = 0
      // @ts-ignore
      return new SharedPtrImpl(s as pointer<any>, is.func(value) ? value as deleter<any> : null)
    }
    else if (is.func(deleter) && deleter.prototype[symbolStruct]) {
      const p = make(is.func(value) ? {} : value as any, deleter as any)
      const s: pointer<SharedPtrStruct<void>> = malloc(sizeof(SharedPtrStruct))
      s.value = p[symbolStructAddress]
      s.refCount = 0
      // @ts-ignore
      return new SharedPtrImpl(s as pointer<any>, is.func(value) ? value as deleter<any> : null)
    }
    else {
      throw new Error('invalid params')
    }
  }
  // makeSharedPtr<T>()
  else {
    const p = malloc(sizeof(value as (CTypeEnum | Struct)))
    const s: pointer<SharedPtrStruct<void>> = malloc(sizeof(SharedPtrStruct))
    s.value = p
    s.refCount = 0
    // @ts-ignore
    return new SharedPtrImpl(s as pointer<any>)
  }
}

export function deTransferableSharedPtr<T extends(BuiltinType | {})>(transfer: SharedPtrTransferable<T>, deleter?: deleter<T>): SharedPtr<T> {
  const p = reinterpret_cast<pointer<pointer<SharedPtrStruct<T>>>>(stack.malloc(sizeof(pointer)))
  memcpyFromUint8Array(reinterpret_cast<pointer<uint8>>(p), sizeof(pointer), new Uint8Array(transfer.buffer))
  const ptr = new SharedPtrImpl(accessof(p), deleter)
  stack.free(sizeof(pointer))
  return ptr as unknown as SharedPtr<T>
}
