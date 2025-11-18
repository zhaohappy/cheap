import * as atomics from './atomics'

@struct
export class Barrier {
  counter: atomic_int32
  atomic: atomic_int32
  numAgents: atomic_int32
}

/**
 * 初始化 Barrier
 * @returns 
 */
export function init(barrier: pointer<Barrier>, numAgents: int32): int32 {
  atomics.store(addressof(barrier.counter), numAgents)
  atomics.store(addressof(barrier.atomic), 0)
  atomics.store(addressof(barrier.numAgents), numAgents)
  return 0
}

/**
 * Enter the barrier
 * This will block until all agents have entered the barrier
 * 
 * @param barrier 
 */
export function enter(barrier: pointer<Barrier>): int32 {
  const atomic = atomics.load(addressof(barrier.atomic))
  if (atomics.sub(addressof(barrier.counter), 1) === 1) {
    const numAgents = barrier.numAgents
    barrier.counter = numAgents
    atomics.add(addressof(barrier.atomic), 1)
    atomics.notify(addressof(barrier.atomic), numAgents - 1)
    atomics.add(addressof(barrier.atomic), 1)
  }
  else {
    atomics.wait(addressof(barrier.atomic), atomic)
    while (atomics.load(addressof(barrier.atomic)) & 1) {}
  }
  return 0
}
