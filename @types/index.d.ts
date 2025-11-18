
declare module 'cheap-worker-loader!*' {
  const content: new (...args: any[]) => any
  export default content
}

declare module '*.asm' {
  const content: string
  export default content
}

declare const ENV_NODE: boolean

declare const DEBUG: boolean

declare const ENABLE_THREADS: boolean

declare const CHEAP_HEAP_INITIAL: number

declare const ENV_WEBPACK: boolean

declare const WASM_64: boolean

declare const ENABLE_THREADS_SPLIT: boolean

declare const ENV_CSP: boolean

declare const ENV_CJS: boolean
