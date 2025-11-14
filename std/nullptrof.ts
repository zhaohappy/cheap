import { symbolStructAddress } from '../symbol'

export default function nullptrof<T extends Object>(struct: T): void {
  struct[symbolStructAddress] = nullptr
}
