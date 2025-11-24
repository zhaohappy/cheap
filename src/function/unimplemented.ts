export default function unimplemented(pointer: pointer<void>, value?: any, size?: any): never {
  throw new Error('unimplemented')
}
