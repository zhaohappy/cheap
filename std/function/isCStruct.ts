import { symbolStructAddress } from '../../symbol'
import { object } from '@libmedia/common'

/**
 * 判断是否是 CStruct
 * 
 * @param struct 
 * @returns 
 */
export default function isCStruct(struct: Object) {
  return object.has(struct, symbolStructAddress as any)
}
