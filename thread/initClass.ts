import IPCPort, { REQUEST } from 'common/network/IPCPort'
import NodeIPCPort from 'common/network/NodeIPCPort'
import { SELF } from 'common/util/constant'
import * as is from 'common/util/is'
import { CHeapError } from '../error'

let parentPort = SELF
if (defined(ENV_NODE)) {
  const { parentPort: parentPort_ } = require('worker_threads')
  parentPort = parentPort_
}

export default function init(run: (...args: any[]) => any) {

  let ipc: IPCPort
  let target: any

  function initIPC(port: MessagePort) {
    ipc = defined(ENV_NODE) ? new NodeIPCPort(port) : new IPCPort(port)
    ipc.on(REQUEST, async (data: any) => {
      const method = data.method
      const params = data.params

      if (is.func(target[method])) {
        try {
          const transfer = []
          const result = await target[method](...params.params, transfer)
          ipc.reply(data, result, null, transfer)
        }
        catch (error) {
          if (defined(DEBUG)) {
            console.error(error)
          }
          ipc.reply(data, CHeapError.REQUEST_ERROR, {
            message: error.message
          })
        }
      }
    })
  }

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

        target = run(data.params)

        initIPC(data.port)

        break
      case 'stop':
        if (ipc) {
          ipc.destroy()
        }
        parentPort.postMessage({
          type: 'stopped'
        })
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
