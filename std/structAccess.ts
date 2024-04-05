import { symbolStruct, symbolStructKeysMeta } from '../symbol'
import { proxyStruct } from '../proxyStruct'
import { definedStruct } from '../definedStruct'
import support from 'common/util/support'
import * as is from 'common/util/is'
import * as keypath from 'common/util/keypath'
import { KeyMeta, KeyMetaKey } from '../typedef'

/**
 * 访问 struct 指针
 * 
 * @param target 
 * @param address
 * @returns
 */
export default function structAccess<T>(address: pointer<void>, struct: new (...args: any[]) => T): T {

  assert(struct.prototype[symbolStruct], 'cannot reinterpret cast struct because of not defined')

  if (arguments[2] && is.string(arguments[2])) {
    struct = struct.prototype
    keypath.each(arguments[2], (key) => {
      const meta = struct[symbolStructKeysMeta] as Map<string, KeyMeta>
      struct = meta.get(key)[KeyMetaKey.Type] as (new (...args: any[]) => T)
    })
  }

  return support.proxy ? proxyStruct(address, struct) : definedStruct(address, struct)
}
