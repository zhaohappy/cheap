import { SELF } from 'common/util/constant'

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
        if (SELF.CHeap && SELF.CHeap.initThread) {
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
        parentPort.postMessage({
          type: 'running'
        })

        retval = run(data.params)

        break
      case 'stop':

        if (retval && retval.then) {
          retval.then((res: any) => {
            parentPort.postMessage({
              type: 'stopped',
              data: res
            })
          })
        }
        else {
          parentPort.postMessage({
            type: 'stopped',
            data: retval
          })
        }
        break
      default:
        console.log('default')
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
