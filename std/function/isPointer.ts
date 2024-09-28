import * as is from 'common/util/is'

export default function isPointer(p: any): p is pointer<void> {
  return is.number(p) && p >= nullptr
}
