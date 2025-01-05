import { Cond } from '../thread/cond'
import { Mutex } from '../thread/mutex'

@struct
export class PthreadOnce {
  atomic: atomic_int32
}

@struct
export class Pthread {
  id: int32
  retval: pointer<void>
  flags: int32
  status: atomic_int32
}

@struct
export class ThreadDescriptor {
  flags: int32
  status: PthreadStatus
}

export const enum PthreadFlags {
  DETACH = 1,
  POOL = 2,
  EXIT = 4
}

export const enum PthreadStatus {
  STOP,
  RUN
}

export type ChildThread = {
  thread: pointer<Pthread>
  worker: Worker
  stackPointer: pointer<void>
  threadDescriptor: pointer<ThreadDescriptor>
}

@struct
export class ThreadWait {
  thread: pointer<Pthread>
  func: pointer<(args: pointer<void>) => void>
  args: pointer<void>
  cond: Cond
  mutex: Mutex
}
