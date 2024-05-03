import { symbolStructAddress } from '../../symbol'
import * as object from 'common/util/object'

/**
 * 判断是否是 CStruct
 * 
 * @param struct 
 * @returns 
 */
export default function isCStruct(struct: Object) {
  return object.has(struct, symbolStructAddress as any)
}
