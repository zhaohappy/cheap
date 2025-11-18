export default function definedMetaProperty(target: any, key: symbol, value: any) {
  Object.defineProperty(target, key, {
    value,
    writable: false,
    enumerable: false,
    configurable: false
  })
}
