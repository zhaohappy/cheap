import { symbolStruct, symbolStructAddress } from '../symbol'
import { revokeProxyStruct } from '../proxyStruct'
import { revokeDefinedStruct } from '../definedStruct'
import support from 'common/util/support'

/**
 * 销毁一个 struct 实例，调用 make 创建的对象必须调用 unmake，否则内存泄漏
 * 
 * @param target 
 */
export default function unmake<T extends Object>(target: T) {

  assert(Object.getPrototypeOf(target)[symbolStruct], 'cannot unmake struct because of not defined')

  const p = target[symbolStructAddress]
  if (p) {
    free(p)
    target[symbolStructAddress] = nullptr
    support.proxy ? revokeProxyStruct(target) : revokeDefinedStruct(target)
  }
}
