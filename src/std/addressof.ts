import { symbolStructAddress } from '../symbol'

export default function addressof<T extends Object>(struct: T): pointer<T> {
  return struct[symbolStructAddress] as pointer<T>
}
