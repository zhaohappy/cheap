import { symbolStructKeysMeta } from '../symbol'
import { KeyMeta, KeyMetaKey } from '../typedef'

export default function offsetof<T extends new (init?: Partial<{}>) => any>(
  struct: T,
  key: T extends new (init?: Partial<{}>) => infer U ? keyof U : never
): uint32 {
  const meta = struct[symbolStructKeysMeta] as Map<string, KeyMeta>
  if (meta.has(key as string)) {
    return meta.get(key as string)[KeyMetaKey.BaseAddressOffset]
  }
  throw new Error(`not found key: ${key as string}`)
}
