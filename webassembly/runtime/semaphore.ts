/* eslint-disable camelcase */

import * as semUtils from '../../thread/semaphore'
import { Sem } from '../../thread/semaphore'

@struct
export class Timespec {
  tvSec: int64
  tvNSec: int32
}


export function wasm_sem_init(sem: pointer<Sem>, pshared: int32, value: uint32) {
  return semUtils.init(sem, value)
}

export function wasm_sem_destroy(sem: pointer<Sem>) {
  return semUtils.destroy(sem)
}

export function wasm_sem_wait(sem: pointer<Sem>) {
  return semUtils.wait(sem)
}

export function wasm_sem_trywait(sem: pointer<Sem>) {
  return semUtils.tryWait(sem)
}

export function wasm_sem_timedwait(sem: pointer<Sem>, abstime: pointer<Timespec>) {
  let timeout = Number(abstime.tvSec) * 1000 + abstime.tvNSec / 1000000
  return semUtils.timedWait(sem, timeout)
}

export function wasm_sem_post(sem: pointer<Sem>) {
  return semUtils.post(sem)
}
