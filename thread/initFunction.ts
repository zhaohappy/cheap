import { SELF } from '@libmedia/common/constant'

let parentPort = SELF
if (defined(ENV_NODE)) {
  const { parentPort: parentPort_ } = require('worker_threads')
  parentPort = parentPort_
}

export default function init(run: (...args: any[]) => any) {
  let retval: any

  const handler = (message: MessageEvent<any>) => {
    const origin = defined(ENV_NODE) ? message : message.data
    const type = origin.type
    const data = origin.data

    switch (type) {
      case 'init':
        if (SELF.CHeap && SELF.CHeap.initThread && SELF.CHeap.Config.USE_THREADS) {
          SELF.CHeap.initThread(data).then(() => {
            parentPort.postMessage({
              type: 'ready'
            })
          })
          return
        }

        parentPort.postMessage({
          type: 'ready'
        })
        break
      case 'run':
        retval = run(data.params)
        break
      case 'stop':
        if (retval && retval.then) {
          retval.then((res: any) => {
            // @ts-ignore
            if (SELF.__freeSmartPtr__) {
              // @ts-ignore
              SELF.__freeSmartPtr__()
            }
            parentPort.postMessage({
              type: 'stopped',
              data: res
            })
          })
        }
        else {
          // @ts-ignore
          if (SELF.__freeSmartPtr__) {
            // @ts-ignore
            SELF.__freeSmartPtr__()
          }
          parentPort.postMessage({
            type: 'stopped',
            data: retval
          })
        }
        break
      default:
        break
    }
  }

  if (defined(ENV_NODE)) {
    // @ts-ignore
    parentPort.on('message', handler)
  }
  else {
    parentPort.onmessage = handler
  }
}
