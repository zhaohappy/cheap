
declare module 'cheap-worker-loader!*' {
  const content: new (...args: any[]) => any
  export default content
}

declare module '*.asm' {
  const content: string
  export default content
}

declare const DEBUG: boolean

declare const ENABLE_LOG_TRACE: boolean

declare const ENABLE_THREADS: boolean

declare const CHEAP_HEAP_INITIAL: number