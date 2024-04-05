import { SELF } from 'common/util/constant'

export default function init(run: (...args: any[]) => any) {

  let retval: any

  SELF.onmessage = (message) => {
    const origin = message.data
    const type = origin.type
    const data = origin.data

    switch (type) {
      case 'init':
        if (SELF.CHeap && SELF.CHeap.initThread) {
          SELF.CHeap.initThread(data).then(() => {
            SELF.postMessage({
              type: 'ready'
            })
          })
          return
        }

        SELF.postMessage({
          type: 'ready'
        })
        break
      case 'run':

        SELF.postMessage({
          type: 'running'
        })

        retval = run(data.params)

        break
      case 'stop':

        if (retval && retval.then) {
          retval.then((res) => {
            SELF.postMessage({
              type: 'stopped',
              data: res
            })
          })
        }
        else {
          SELF.postMessage({
            type: 'stopped',
            data: retval
          })
        }
        break
      default:
        break
    }
  }
}
