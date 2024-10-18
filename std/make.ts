import { memset } from './memory'
import { symbolStruct } from '../symbol'
import * as object from 'common/util/object'
import { Data } from 'common/types/type'
import isDef from 'common/function/isDef'
import structAccess from './structAccess'

/**
 * 创建一个 struct 实例
 * 
 * @param target 
 * @returns 
 */
export default function make<T>(init?: Data, struct?: new (...args: any[]) => T): T {

  assert(struct.prototype[symbolStruct], 'cannot make struct because of not defined')

  if (!isDef(struct)) {
    struct = init as unknown as new (...args: any[]) => any
    init = null
  }

  const size = sizeof(struct)
  const address = malloc(size)
  if (!address) {
    throw new TypeError('cannot alloc memory for struct')
  }

  memset(address, 0, size)

  const target = structAccess(address, struct)

  const data = new struct()

  if (init) {
    object.extend(data, init)
  }

  object.each(data, (value, key) => {
    if (isDef(value)) {
      target[key] = value
    }
  })

  return target
}
