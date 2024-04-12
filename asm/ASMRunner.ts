
import { base64ToUint8Array } from 'common/util/base64'
import * as logger from 'common/util/logger'
import * as wasmUtils from 'common/util/wasm'
import { Memory } from '../heap'
import * as config from '../config'

export default class ASMRunner {

  private runner: WebAssembly.Instance

  private wasm: Uint8Array

  constructor (asmBase64: string) {
    let wasm = base64ToUint8Array(asmBase64)

    if (config.USE_THREADS && defined(ENABLE_THREADS)) {
      wasmUtils.setMemoryShared(wasm, true)
    }

    this.wasm = wasm
  }

  public async run() {
    this.runner = (await WebAssembly.instantiate(this.wasm, {
      env: {
        memory: Memory
      }
    })).instance
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

  get exports () {
    return this.runner.exports
  }
}