import { StackPointer, StackTop, StackSize } from './heap'

export function malloc(size: size): pointer<void> {
  assert(reinterpret_cast<pointer<void>>(StackPointer.value) - size >= StackTop, 'stack up overflow')
  StackPointer.value = (StackPointer.value as size) - size
  return StackPointer.value
}

export function free(size: size): void {
  assert(reinterpret_cast<pointer<void>>(StackPointer.value) + size <= StackTop + reinterpret_cast<size>(StackSize), 'stack down overflow')
  StackPointer.value = (StackPointer.value as size) + size
}
