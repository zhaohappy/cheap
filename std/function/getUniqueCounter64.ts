
import { uniqueCounter64 } from '../../staticData'
import * as atomics from '../../thread/atomics'

/**
 * 获取全局唯一的 uint64 计数器，在页面的生命周期内返回的值是唯一的
 * 
 * 线程安全但需要注意回环
 * 
 * @returns 
 */
export default function getUniqueCounter64() {
  return atomics.add(uniqueCounter64, 1n)
}
