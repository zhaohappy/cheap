/**
 * 同一个线程内异步方法串行执行
 */

export class Sync {
  list: (() => void)[] = []
}

export async function lock(sync: Sync) {
  return new Promise<void>((resolve) => {
    sync.list.push(resolve)
    if (sync.list.length === 1) {
      resolve()
    }
  })
}

export function unlock(sync: Sync) {
  sync.list.shift()
  if (sync.list.length) {
    sync.list[0]()
  }
}
