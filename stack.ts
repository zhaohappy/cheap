import { StackPointer, StackTop, StackSize } from './heap'

export function malloc(size: size): pointer<void> {
  assert(StackPointer.value - size >= StackTop, 'stack up overflow')
  StackPointer.value -= size
  return StackPointer.value
}

export function free(size: size): void {
  assert(StackPointer.value + size <= StackTop + StackSize, 'stack down overflow')
  StackPointer.value += size
}
