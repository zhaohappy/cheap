
import { base64ToUint8Array } from 'common/util/base64'
import * as logger from 'common/util/logger'
import * as wasmUtils from 'common/util/wasm'
import { Memory } from '../heap'
import * as config from '../config'

export default class ASMRunner {

  private runner: WebAssembly.Instance

  private wasm: Uint8Array

  constructor(asmBase64: string) {
    this.wasm = wasmUtils.setMemoryMeta(base64ToUint8Array(asmBase64), {
      shared: config.USE_THREADS && defined(ENABLE_THREADS),
      initial: config.HEAP_INITIAL,
      maximum: config.HEAP_MAXIMUM
    })
    const module = new WebAssembly.Module(this.wasm)
    this.runner = new WebAssembly.Instance(module, {
      env: {
        memory: Memory
      }
    })
  }

  public call(name: string, ...args: (number | bigint)[]) {
    if (this.runner.exports[name]) {
      return (this.runner.exports[name] as Function).apply(null, args)
    }
    else {
      logger.fatal(`not found export function ${name} in ASMRunner`)
    }
  }

  public destroy() {
    this.runner = null
    this.wasm = null
  }

  get exports() {
    return this.runner.exports
  }
}
