import { Struct } from '../struct'

export default function getStructMeta(struct: Struct, key: string) {
  let meta = struct.meta.get(key)
  if (meta) {
    return meta
  }
  let next = struct.parent
  while (next) {
    meta = next.meta.get(key)
    if (meta) {
      return meta
    }
    next = struct.parent
  }

  return null
}
