import { SELF } from '@libmedia/common/constant'
import { is } from '@libmedia/common'
import { CHeapError } from '../error'

import {
  IPCPort,
  REQUEST,
  NodeIPCPort
} from '@libmedia/common/network'

let parentPort = SELF
if (defined(ENV_NODE)) {
  const { parentPort: parentPort_ } = require('worker_threads')
  parentPort = parentPort_
}

export default function init(module: Object) {

  let ipc: IPCPort

  function initIPC(port: MessagePort) {
    ipc = defined(ENV_NODE) ? new NodeIPCPort(port) : new IPCPort(port)
    ipc.on(REQUEST, async (data: any) => {
      const method = data.method
      const params = data.params

      if (is.func(module[method])) {
        try {
          if (!module[method].transfer) {
            module[method].transfer = []
          }
          const result = await module[method](...params.params)
          ipc.reply(data, result, null, module[method].transfer)
          module[method].transfer.length = 0
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

        parentPort.postMessage({
          type: 'running'
        })

        initIPC(data.port)

        break
      case 'stop':
        if (ipc) {
          ipc.destroy()
        }
        // @ts-ignore
        if (SELF.__freeSmartPtr__) {
          // @ts-ignore
          SELF.__freeSmartPtr__()
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
