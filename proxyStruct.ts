import { CTypeEnumRead } from './ctypeEnumRead'
import { CTypeEnumWrite } from './ctypeEnumWrite'
import { symbolStructAddress, symbolStructKeysMeta, symbolStructProxyRevoke } from './symbol'
import { CTypeEnum, CTypeEnum2Bytes, KeyMeta, KeyMetaKey, Struct } from './typedef'
import * as is from 'common/util/is'
import * as object from 'common/util/object'
import * as array from 'common/util/array'
import toNumber from 'common/function/toNumber'

const ObjectPro = Object.getPrototypeOf({})

export function findKeyMeta<T>(prototype: new () => T, key: string) {
  while (true) {
    let keysMeta = prototype[symbolStructKeysMeta] as Map<string, KeyMeta>
    if (keysMeta) {
      const meta = keysMeta.get(key)
      if (meta) {
        return meta
      }
    }
    prototype = Object.getPrototypeOf(prototype)
    if (!prototype || prototype === ObjectPro) {
      return null
    }
  }
}


function proxyArray(address: pointer<CTypeEnum | Struct>, length: number, type: CTypeEnum | Struct, pointer: 0 | 1) {
  const obj = {}
  obj[symbolStructAddress] = address

  let size = reinterpret_cast<int32>(sizeof(pointer ? CTypeEnum.pointer : type))

  const proxy = new Proxy(obj, {
    get(target, propertyKey, receiver) {

      if (propertyKey === symbolStructAddress) {
        return target[symbolStructAddress]
      }

      const index = toNumber(propertyKey)

      if (defined(WASM_64)) {
        assert(index < length && index >= 0, `Out Of Bounds, address: ${(target[symbolStructAddress] + static_cast<int64>((index * size) as uint32)).toString(16)}`)
      }
      else {
        assert(index < length && index >= 0, `Out Of Bounds, address: ${(target[symbolStructAddress] + index * size).toString(16)}`)
      }

      if (pointer) {
        if (defined(WASM_64)) {
          return CTypeEnumRead[CTypeEnum.pointer](target[symbolStructAddress] + static_cast<int64>((index * size) as uint32))
        }
        else {
          return CTypeEnumRead[CTypeEnum.pointer](target[symbolStructAddress] + index * size)
        }
      }
      else {
        if (is.func(type)) {
          return target[propertyKey]
        }
        else {
          if (defined(WASM_64)) {
            return CTypeEnumRead[type](target[symbolStructAddress] + static_cast<int64>((index * size) as uint32))
          }
          else {
            return CTypeEnumRead[type](target[symbolStructAddress] + index * size)
          }
        }
      }
    },
    set(target, propertyKey, newValue, receiver) {

      if (propertyKey === symbolStructAddress) {
        target[symbolStructAddress] = newValue
        return true
      }

      const index = toNumber(propertyKey)

      if (defined(WASM_64)) {
        assert(index < length && index >= 0, `Out Of Bounds, address: ${(target[symbolStructAddress] + static_cast<int64>((index * size) as uint32)).toString(16)}`)
      }
      else {
        assert(index < length && index >= 0, `Out Of Bounds, address: ${(target[symbolStructAddress] + index * size).toString(16)}`)
      }

      if (pointer) {

        assert(defined(WASM_64) ? is.bigint(newValue) : is.number(newValue), 'value is not pointer')

        if (defined(WASM_64)) {
          CTypeEnumWrite[CTypeEnum.pointer](target[symbolStructAddress] + static_cast<int64>((index * size) as uint32), newValue)
        }
        else {
          CTypeEnumWrite[CTypeEnum.pointer](target[symbolStructAddress] + index * size, newValue)
        }
        target[propertyKey] = newValue
      }
      else {
        if (is.func(type)) {

          assert(is.object(newValue) && Object.getPrototypeOf(newValue) == type.prototype, `value is not ${type.prototype.constructor.name}'s instance`)

          const proxy = target[propertyKey] || (target[propertyKey] = proxyStruct(target[symbolStructAddress]
            + (defined(WASM_64) ? static_cast<int64>((index * size) as uint32) : (index * size)), type))
          object.each(newValue, (value, key) => {
            proxy[key] = value
          })
          target[propertyKey] = proxy
        }
        else {

          assert(is.number(newValue) || is.bigint(newValue), 'value is not number')
          if (defined(WASM_64)) {
            CTypeEnumWrite[type as uint8](target[symbolStructAddress] + static_cast<int64>((index * size) as uint32), newValue)
          }
          else {
            CTypeEnumWrite[type as uint8](target[symbolStructAddress] + index * size, newValue)
          }
          target[propertyKey] = newValue
        }
      }
      return true
    }
  })

  return proxy
}

export function proxyStruct<T>(address: pointer<void>, struct: (new () => T) | {}): T {
  const prototype = is.func(struct) ? struct.prototype : struct

  const obj = {}
  obj[symbolStructAddress] = address
  Object.setPrototypeOf(obj, prototype)

  const { proxy, revoke } = Proxy.revocable(obj, {
    get(target, propertyKey, receiver) {
      if (is.string(propertyKey)) {

        assert(target[symbolStructAddress] !== nullptr, 'target address is null, maybe is free')

        const meta = findKeyMeta(prototype, (propertyKey as string).replace(/^\$+/, ''))

        if (meta) {
          const address = target[symbolStructAddress] + (defined(WASM_64) ? static_cast<uint64>(meta[KeyMetaKey.BaseAddressOffset]) : meta[KeyMetaKey.BaseAddressOffset])
          if (meta[KeyMetaKey.Array]) {
            const t = target[propertyKey]
            t[symbolStructAddress] = address
            return t
          }
          else if (meta[KeyMetaKey.Pointer]) {
            let p = CTypeEnumRead[CTypeEnum.pointer](address)
            return p
          }
          else if (is.func(meta[KeyMetaKey.Type]) || is.object(meta[KeyMetaKey.Type])) {
            return target[propertyKey] || (target[propertyKey] = proxyStruct(address, meta[KeyMetaKey.Type]))
          }
          else {
            let value = CTypeEnumRead[meta[KeyMetaKey.Type] as uint8](address)
            if (meta[KeyMetaKey.BitField]) {
              value = ((value >>> (CTypeEnum2Bytes[meta[KeyMetaKey.Type]] * 8 - meta[KeyMetaKey.BaseBitOffset] - meta[KeyMetaKey.BitFieldLength]))
                & (Math.pow(2, meta[KeyMetaKey.BitFieldLength]) - 1))
            }
            return value
          }
        }
        else {
          return target[propertyKey]
        }
      }
      else {
        return target[propertyKey]
      }
    },
    set(target, propertyKey, newValue, receiver) {
      if (is.string(propertyKey)) {
        assert(target[symbolStructAddress] !== nullptr, 'target address is null, maybe has freed')
        const meta = findKeyMeta(prototype, (propertyKey as string).replace(/^\$+/, ''))
        if (meta) {
          const address = target[symbolStructAddress] + (defined(WASM_64) ? static_cast<uint64>(meta[KeyMetaKey.BaseAddressOffset]) : meta[KeyMetaKey.BaseAddressOffset])
          if (meta[KeyMetaKey.Array]) {
            const proxy = target[propertyKey] || proxyArray(address, meta[KeyMetaKey.ArrayLength], meta[KeyMetaKey.Type], meta[KeyMetaKey.Pointer])
            array.each(newValue, (value, key) => {
              proxy[key] = value
            })
            target[propertyKey] = proxy
          }
          else {
            if (meta[KeyMetaKey.Pointer]) {

              assert(defined(WASM_64) ? is.bigint(newValue) : is.number(newValue), `value is not pointer, struct: ${prototype.constructor.name}, name: ${propertyKey as string}`)

              CTypeEnumWrite[CTypeEnum.pointer](address, newValue)
              target[propertyKey] = newValue
            }
            else if (is.func(meta[KeyMetaKey.Type]) || is.object(meta[KeyMetaKey.Type])) {

              assert(
                is.object(newValue)
                && Object.getPrototypeOf(newValue) === (
                  is.func(meta[KeyMetaKey.Type])
                    ? meta[KeyMetaKey.Type].prototype
                    : meta[KeyMetaKey.Type]
                ),
                `value is not ${is.func(meta[KeyMetaKey.Type]) ? meta[KeyMetaKey.Type].prototype.constructor.name : 'inline struct'}'s instance, name: ${propertyKey as string}`
              )

              const proxy = target[propertyKey] || (target[propertyKey] = proxyStruct(address, meta[KeyMetaKey.Type]))
              object.each(newValue, (value, key) => {
                proxy[key] = value
              })
              target[propertyKey] = proxy
            }
            else {

              assert(is.number(newValue) || is.bigint(newValue), 'value is not number')

              if (meta[KeyMetaKey.BitField]) {

                assert(!is.bigint(newValue), `bigint is not support in bit field, struct: ${prototype.constructor.name}, name: ${propertyKey as string}`)

                let mask = 0
                let len = CTypeEnum2Bytes[meta[KeyMetaKey.Type]] * 8
                for (let i = 0; i < meta[KeyMetaKey.BitFieldLength]; i++) {
                  mask |= (1 << (len - 1 - (i + meta[KeyMetaKey.BaseBitOffset])))
                }
                const value = CTypeEnumRead[meta[KeyMetaKey.Type] as uint8](address)

                CTypeEnumWrite[meta[KeyMetaKey.Type] as uint8](
                  address,
                  (value & ~mask) | ((newValue & (Math.pow(2, meta[KeyMetaKey.BitFieldLength]) - 1))
                    << (len - meta[KeyMetaKey.BaseBitOffset] - meta[KeyMetaKey.BitFieldLength]))
                )
              }
              else {
                CTypeEnumWrite[meta[KeyMetaKey.Type] as uint8](address, newValue)
              }
              target[propertyKey] = newValue
            }
          }
        }
        else {
          target[propertyKey] = newValue
        }
      }
      else {
        target[propertyKey] = newValue
      }
      return true
    },
    getOwnPropertyDescriptor(target, key) {
      return {
        enumerable: true,
        configurable: true
      }
    },
    ownKeys(target) {
      return Array.from(((target[symbolStructKeysMeta]) as Map<string, any>).keys())
    }
  })

  obj[symbolStructProxyRevoke] = revoke

  return proxy as T
}

export function revokeProxyStruct<T>(target: T) {
  const revoke = target[symbolStructProxyRevoke]
  if (revoke) {
    revoke()
  }
}
