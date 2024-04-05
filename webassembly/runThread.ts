
import { SELF } from 'common/util/constant'

// @ts-ignore
SELF.imports = {
  env: {

  }
}

export default function init(preRun: Promise<void>) {
  SELF.onmessage = (message) => {

    const origin = message.data
    const type = origin.type
    const data = origin.data

    let runner: any

    switch (type) {
      case 'run':

        SELF.postMessage({
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
  }
}
