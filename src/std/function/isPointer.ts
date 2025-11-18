import { is } from '@libmedia/common'

export default function isPointer(p: any): p is pointer<void> {
  return (defined(WASM_64) ? is.bigint(p) : is.number(p)) && p >= nullptr
}
