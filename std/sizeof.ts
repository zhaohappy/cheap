import { symbolStruct, symbolStructLength } from '../symbol'
import * as is from 'common/util/is'
import type { CTypeEnum, Struct } from '../typedef'
import { CTypeEnum2Bytes } from '../typedef'

export default function sizeof(type: CTypeEnum | Struct): size {
  if (is.number(type)) {
    return reinterpret_cast<size>((CTypeEnum2Bytes[type] || 0) as uint32)
  }
  else if (is.func(type) && type.prototype[symbolStruct]) {
    return reinterpret_cast<size>(type.prototype[symbolStructLength] as uint32)
  }
  return 0
}
