
import { SELF } from 'common/util/constant'
import { ThreadWait } from './thread'

// @ts-ignore
SELF.imports = {
  env: {

  }
}

let parentPort = SELF
if (defined(ENV_NODE)) {
  const { parentPort: parentPort_ } = require('worker_threads')
  parentPort = parentPort_
}

let runner: any
let runnerData: any
let waitData: pointer<ThreadWait> = nullptr

export default function init(preRun: Promise<void>) {
  const handler = (message: MessageEvent<any>) => {

    const origin = defined(ENV_NODE) ? message : message.data
    const type = origin.type
    const data = origin.data

    switch (type) {
      case 'run': {
        parentPort.postMessage({
          type: 'run'
        })
        if (SELF.CHeap && SELF.CHeap.initThread) {
          SELF.CHeap.initThread(data.cheap).then(() => {
            function run() {
              SELF.__SELF_THREAD__ = data.runner.thread
              // @ts-ignore
              data.runner.options.imports = SELF.imports
              // @ts-ignore
              runner = new __WebAssemblyRunner__.__WebAssemblyRunner__(data.runner.resource, data.runner.options)
              runner.runAsChild().then(() => {
                // @ts-ignore
                __WebAssemblyRunner__.__WebAssemblyRunner__.getTable().get(data.runner.func)(data.runner.args)
                runner.destroy()
              })
            }

            if (preRun) {
              preRun.then(() => {
                run()
              })
            }
            else {
              run()
            }
          })
        }
        break
      }
      case 'ready': {
        runnerData = data.runner
        waitData = data.cheap.stackPointer
        if (SELF.CHeap && SELF.CHeap.initThread) {
          SELF.CHeap.initThread(data.cheap).then(() => {
            if (preRun) {
              preRun.then(() => {
                parentPort.postMessage({
                  type: 'ready'
                })
              })
            }
            else {
              parentPort.postMessage({
                type: 'ready'
              })
            }
          })
        }
        break
      }

      case 'wait': {
        async function run() {
          while (true) {
            // @ts-ignore
            __WebAssemblyRunner__.__WebAssemblyRunner__.mutexLock(addressof(waitData.mutex))
            // @ts-ignore
            while (__WebAssemblyRunner__.__WebAssemblyRunner__.readPointer(addressof(waitData.thread)) === nullptr) {
              // @ts-ignore
              __WebAssemblyRunner__.__WebAssemblyRunner__.condWait(addressof(waitData.cond), addressof(waitData.mutex))
            }

            // @ts-ignore
            SELF.__SELF_THREAD__ = runnerData.options.thread = runnerData.thread = __WebAssemblyRunner__.__WebAssemblyRunner__.readPointer(addressof(waitData.thread))

            // @ts-ignore
            runnerData.func = __WebAssemblyRunner__.__WebAssemblyRunner__.readPointer(addressof(waitData.func))
            // @ts-ignore
            runnerData.args = __WebAssemblyRunner__.__WebAssemblyRunner__.readPointer(addressof(waitData.args))

            // @ts-ignore
            runner = new __WebAssemblyRunner__.__WebAssemblyRunner__(runnerData.resource, runnerData.options)
            await runner.runAsChild()
            // @ts-ignore
            __WebAssemblyRunner__.__WebAssemblyRunner__.getTable().get(runnerData.func)(runnerData.args)
            runner.destroy()
            // @ts-ignore
            __WebAssemblyRunner__.__WebAssemblyRunner__.writePointer(addressof(waitData.thread), nullptr)
            // @ts-ignore
            __WebAssemblyRunner__.__WebAssemblyRunner__.mutexUnlock(addressof(waitData.mutex))
          }
        }
        // @ts-ignore
        runnerData.options.imports = SELF.imports
        run()
        break
      }
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
