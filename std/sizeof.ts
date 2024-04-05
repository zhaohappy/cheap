import { symbolStruct, symbolStructLength } from '../symbol'
import * as is from 'common/util/is'
import { CTypeEnum, CTypeEnum2Bytes, Struct } from '../typedef'

export default function sizeof(type: CTypeEnum | Struct): size {
  if (is.number(type)) {
    return CTypeEnum2Bytes[type] || 0
  }
  else if (is.func(type) && type.prototype[symbolStruct]) {
    return type.prototype[symbolStructLength]
  }
  return 0
}
