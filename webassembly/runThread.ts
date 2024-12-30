
import { ThreadWait } from './thread'
import WebAssemblyRunner from './WebAssemblyRunner'

/* eslint-disable camelcase */
export default function runThread() {

  let WebAssemblyRunnerClass: typeof WebAssemblyRunner

  if (defined(ENV_NODE)) {
    WebAssemblyRunnerClass = require('./WebAssemblyRunner.js').default
  }
  // @ts-ignore
  else if (defined(ENV_WEBPACK) && __WebAssemblyRunner__) {
    // @ts-ignore
    WebAssemblyRunnerClass = __WebAssemblyRunner__.__WebAssemblyRunner__
  }
  else {
    // @ts-ignore
    WebAssemblyRunnerClass = __CHeap_WebAssemblyRunner__.default
  }

  let parentPort = self
  if (defined(ENV_NODE)) {
    const { parentPort: parentPort_ } = require('worker_threads')
    parentPort = parentPort_
  }

  let runner: any
  let runnerData: any
  let waitData: pointer<ThreadWait> = nullptr

  const handler = (message: MessageEvent<any>) => {

    const origin = defined(ENV_NODE) ? message : message.data
    const type = origin.type
    const data = origin.data

    switch (type) {
      case 'run': {
        parentPort.postMessage({
          type: 'run'
        })
        if (self.CHeap && self.CHeap.initThread) {
          self.CHeap.initThread(data.cheap).then(() => {
            function run() {
              self.__SELF_THREAD__ = data.runner.thread
              // @ts-ignore
              data.runner.options.imports = self.imports
              runner = new WebAssemblyRunnerClass(data.runner.resource, data.runner.options)
              runner.runAsChild()
              WebAssemblyRunnerClass.getTable().get(data.runner.func)(data.runner.args)
              runner.destroy()
            }
            run()
          })
        }
        break
      }
      case 'ready': {
        runnerData = data.runner
        waitData = data.cheap.stackPointer
        if (self.CHeap && self.CHeap.initThread) {
          self.CHeap.initThread(data.cheap).then(() => {
            parentPort.postMessage({
              type: 'ready'
            })
          })
        }
        break
      }

      case 'wait': {
        async function run() {
          while (true) {
            WebAssemblyRunnerClass.mutexLock(addressof(waitData.mutex))
            while (WebAssemblyRunnerClass.readPointer(addressof(waitData.thread)) === nullptr) {
              WebAssemblyRunnerClass.condWait(addressof(waitData.cond), addressof(waitData.mutex))
            }

            self.__SELF_THREAD__ = runnerData.options.thread = runnerData.thread = WebAssemblyRunnerClass.readPointer(addressof(waitData.thread))

            runnerData.func = WebAssemblyRunnerClass.readPointer(addressof(waitData.func))
            runnerData.args = WebAssemblyRunnerClass.readPointer(addressof(waitData.args))

            runner = new WebAssemblyRunnerClass(runnerData.resource, runnerData.options)
            runner.runAsChild()
            WebAssemblyRunnerClass.getTable().get(runnerData.func)(runnerData.args)
            runner.destroy()
            WebAssemblyRunnerClass.writePointer(addressof(waitData.thread), nullptr)
            WebAssemblyRunnerClass.mutexUnlock(addressof(waitData.mutex))
          }
        }
        // @ts-ignore
        runnerData.options.imports = self.imports
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
