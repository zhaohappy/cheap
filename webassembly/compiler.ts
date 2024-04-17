import * as is from 'common/util/is'
import IOReader from 'common/io/IOReader'
import { IOError } from 'common/io/error'
import IOWriter from 'common/io/IOWriter'
import { ExternalKind, SectionId, readSLeb128Async,
  readULeb128Async, writeSleb128Async, writeUleb128Async
} from 'common/util/wasm'
import concatTypeArray from 'common/function/concatTypeArray'
import * as object from 'common/util/object'
import * as config from '../config'

export interface WebAssemblyResource {
  tableSize?: number
  dataSize?: number
  initFuncs?: string[]
  module: WebAssembly.Module
  buffer?: ArrayBuffer
  threadModule?: {
    module: WebAssembly.Module
    initFuncs?: string[]
  }
}

export interface WebAssemblySource {
  source: Uint8Array | ArrayBuffer | string
  tableSize?: number
  dataSize?: number
}

interface Context {
  ioReader: IOReader,
  ioWriter: IOWriter
  bufferEnded: boolean
  compileStopped: boolean
  error: string
  abortController: AbortController

  pullResolve: (buffer: Uint8Array) => void
  bufferResolve: (controller: ReadableStreamDefaultController<any>) => void

  data: {
    tableSize?: number
    dataSize?: number
  }
  buffers: Uint8Array[]
  options: CompilerOptions
}

interface CompilerOptions {
  enableThread?: boolean
  child?: boolean
  initFuncs?: string[]
}

async function process(context: Context) {
  try {
    // `\0asm`
    await context.ioWriter.writeUint32(await context.ioReader.readUint32())
    // Version
    await context.ioWriter.writeUint32(await context.ioReader.readUint32())
    while (true) {
      if (context.compileStopped) {
        if (context.abortController) {
          context.abortController.abort()
        }
        break
      }

      const sectionId = await context.ioReader.readUint8()
      if (context.options.child) {
        if (sectionId === SectionId.Data) {
          await context.ioWriter.writeUint8(sectionId)
          // size
          await writeUleb128Async(context.ioWriter, 7)

          // count
          await writeUleb128Async(context.ioWriter, 1)

          // index
          await writeUleb128Async(context.ioWriter, 0)

          // init_expr i32_const 0
          await context.ioWriter.writeUint8(0x41)
          await context.ioWriter.writeUint8(0x00)
          await context.ioWriter.writeUint8(0x0b)

          // size
          await writeUleb128Async(context.ioWriter, 1)
          await context.ioWriter.writeUint8(0x00)

          const size = await readULeb128Async(context.ioReader)
          await context.ioReader.skip(size)
          continue
        }
      }

      await context.ioWriter.writeUint8(sectionId)

      const size = await readULeb128Async(context.ioReader)
      await writeUleb128Async(context.ioWriter, size)

      const now = context.ioReader.getPos()

      if (sectionId === SectionId.Data) {
        /**
         * - count: varuint32
         * - entries: data_segment*
         *   - index varuint32 the linear memory index (0 in the MVP)
         *   - offset init_expr 
         *   - size varuint32
         *   - data bytes
         */
        const count = await readULeb128Async(context.ioReader)
        await writeUleb128Async(context.ioWriter, count)
        if (count) {
          await writeUleb128Async(context.ioWriter, await readULeb128Async(context.ioReader))
          while (true) {
            const byte = await context.ioReader.readUint8()
            await context.ioWriter.writeUint8(byte)
            if (byte === 0x0b) {
              break
            }
          }
          context.data.dataSize = await readULeb128Async(context.ioReader)
          await writeUleb128Async(context.ioWriter, context.data.dataSize)
        }
      }
      else if (sectionId === SectionId.Import) {
        /**
         * - count: varuint32
         * - entries: import_entry*
         *   - module_len varuint32
         *   - module_str bytes 
         *   - field_len varuint32
         *   - field_str bytes
         *   - external_kind
         */

        let count = await readULeb128Async(context.ioReader)
        await writeUleb128Async(context.ioWriter, count)
        let counter = 0

        while (count--) {
          const moduleLen = await readULeb128Async(context.ioReader)
          await writeUleb128Async(context.ioWriter, moduleLen)
          await context.ioWriter.writeBuffer(await context.ioReader.readBuffer(moduleLen))
          const fieldLen = await readULeb128Async(context.ioReader)
          await writeUleb128Async(context.ioWriter, fieldLen)
          await context.ioWriter.writeBuffer(await context.ioReader.readBuffer(fieldLen))

          const externalKind = await context.ioReader.readUint8()
          await context.ioWriter.writeUint8(externalKind)

          switch (externalKind) {
            case ExternalKind.Function: {
              // type index of the function signature
              await writeUleb128Async(context.ioWriter, await readULeb128Async(context.ioReader))
              break
            }
            case ExternalKind.Global: {
              // content_type
              await writeSleb128Async(context.ioWriter, await readSLeb128Async(context.ioReader))
              // mutability
              await writeUleb128Async(context.ioWriter, await readULeb128Async(context.ioReader))
              break
            }
            case ExternalKind.Memory: {
              let flags = await readULeb128Async(context.ioReader)

              if (context.options.enableThread) {
                flags |= 2
              }
              else {
                flags &= ~2
              }

              await writeUleb128Async(context.ioWriter, flags)
              // initial
              await writeUleb128Async(context.ioWriter, await readULeb128Async(context.ioReader))
              if (flags & 0x01) {
                // maximum
                await writeUleb128Async(context.ioWriter, await readULeb128Async(context.ioReader))
              }
              counter++
              break
            }
            case ExternalKind.Table: {
              // elem_type
              await writeSleb128Async(context.ioWriter, await readSLeb128Async(context.ioReader))
              const flags = await readULeb128Async(context.ioReader)
              await writeUleb128Async(context.ioWriter, flags)
              const initial = await readULeb128Async(context.ioReader)
              await writeUleb128Async(context.ioWriter, initial)

              context.data.tableSize = initial

              if (flags & 0x01) {
                // maximum
                await writeUleb128Async(context.ioWriter, await readULeb128Async(context.ioReader))
              }
              counter++
              break
            }
          }

          if (counter === 2) {
            break
          }
        }
      }

      const remainingLength = size - Number(context.ioReader.getPos() - now)
      if (remainingLength) {
        await context.ioReader.pipe(context.ioWriter, size - Number(context.ioReader.getPos() - now))
      }
    }
  }
  catch (e) {
    if (context.ioReader.error === IOError.END) {
      context.bufferEnded = true
    }
    else {
      context.error = e
    }
    if (context.ioReader.remainingLength()) {
      await context.ioWriter.writeBuffer(await context.ioReader.readBuffer(context.ioReader.remainingLength()))
    }
    await context.ioWriter.flush()
  }
}

export default async function compile(source: WebAssemblySource, options: CompilerOptions = {}): Promise<WebAssemblyResource> {
  let module: WebAssembly.Module
  let tableSize: number
  let dataSize: number
  let buffer: ArrayBuffer

  options = object.extend({
    enableThread: config.USE_THREADS,
    initFuncs: options.child ? [] : ['__wasm_apply_data_relocs']
  }, options)

  if (is.number(source.dataSize) && is.number(source.tableSize)) {
    tableSize = source.dataSize
    dataSize = source.dataSize
    if (is.string(source.source)) {
      const params: Partial<any> = {
        method: 'GET',
        headers: {},
        mode: 'cors',
        cache: 'default',
        referrerPolicy: 'no-referrer-when-downgrade'
      }
      if (is.func(WebAssembly.compileStreaming)) {
        module = await WebAssembly.compileStreaming(fetch(source.source, params))
      }
      else {
        const response = await fetch(source.source, params)
        buffer = await response.arrayBuffer()
        module = await WebAssembly.compile(buffer)
      }
    }
    else {
      module = await WebAssembly.compile(source.source)
      buffer = is.arrayBuffer(source.source) ? source.source : (source.source as Uint8Array).buffer
    }
  }
  else {
    const context: Context = {
      ioReader: new IOReader(1 * 1024 * 1024),
      ioWriter: new IOWriter(1 * 1024 * 1024),
      bufferEnded: false,
      compileStopped: false,
      error: '',
      abortController: null,

      pullResolve: null,
      bufferResolve: null,
      buffers: [],
      data: {

      },
      options
    }

    const response = new Response(
      new ReadableStream({
        async start(controller) {
          if (is.string(source.source)) {
            if (AbortController) {
              context.abortController = new AbortController()
            }
            const params: Partial<any> = {
              method: 'GET',
              headers: {},
              mode: 'cors',
              cache: 'default',
              referrerPolicy: 'no-referrer-when-downgrade',
              signal: context.abortController?.signal
            }

            const res = await fetch(source.source, params)
            let reader: ReadableStreamDefaultReader<Uint8Array>
            if (res.ok && (res.status >= 200 && res.status <= 299)) {
              reader = res.body.getReader()
            }
            else {
              controller.error(`Http code invalid, ${res.status} ${res.statusText}`)
            }

            const buffers: Uint8Array[] = []
            context.ioReader.onFlush = async (buffer: Uint8Array) => {
              let pos = 0
              while (buffers.length && pos < buffer.length) {
                const cache = buffers.shift()
                if (cache.length > buffer.length - pos) {
                  buffer.set(cache.subarray(0, buffer.length - pos), pos)
                  buffers.unshift(cache.subarray(buffer.length - pos))
                  pos = buffer.length
                }
                else {
                  buffer.set(cache, pos)
                  pos += cache.length
                }
              }

              if (pos >= buffer.length) {
                return buffer.length
              }

              const { value, done } = await reader.read()

              if (done) {
                return pos > 0 ? pos : IOError.END
              }
              else {
                context.buffers.push(value)
                if (value.length > buffer.length - pos) {
                  buffer.set(value.subarray(0, buffer.length - pos), pos)
                  buffers.push(value.subarray(buffer.length - pos))
                  return buffer.length
                }
                else {
                  buffer.set(value, pos)
                  pos += value.length
                  return pos
                }
              }
            }
          }
          else {
            let readPos = 0
            let readFileLength = source.source.byteLength

            const wasm = is.arrayBuffer(source.source) ? new Uint8Array(source.source) : source.source

            context.ioReader.onFlush = async (buffer: Uint8Array) => {
              if (readPos >= readFileLength) {
                return IOError.END
              }
              const len = Math.min(buffer.length, readFileLength - readPos)

              buffer.set(wasm.subarray(readPos, readPos + len), 0)

              readPos += len

              return len
            }
          }

          context.ioWriter.onFlush = async (buffer: Uint8Array) => {
            if (context.pullResolve) {
              context.pullResolve(buffer.slice())
              context.pullResolve = null
              return 0
            }
            (await new Promise<ReadableStreamDefaultController<any>>((resolve, reject) => {
              context.bufferResolve = resolve
            })).enqueue(buffer.slice())

            return 0
          }

          process(context)
        },
        async pull(controller) {
          if (context.error) {
            controller.close()
            return
          }
          if (context.bufferResolve) {
            context.bufferResolve(controller)
            context.bufferResolve = null
            return
          }
          controller.enqueue(await new Promise<Uint8Array>((resolve, reject) => {
            context.pullResolve = resolve
          }))

          if (context.bufferEnded) {
            controller.close()
          }
          else if (context.error) {
            controller.error(context.error)
          }
        },
        cancel(reason) {
          context.compileStopped = true
        }
      }),
      {
        headers: {
          'Content-Type': 'application/wasm'
        }
      }
    )

    if (is.func(WebAssembly.compileStreaming)) {
      module = await WebAssembly.compileStreaming(response)
    }
    else {
      module = await WebAssembly.compile(await response.arrayBuffer())
    }

    buffer = is.string(source.source)
      ? concatTypeArray(Uint8Array, context.buffers).buffer
      : (is.arrayBuffer(source.source) ? source.source : (source.source as Uint8Array).buffer)
    tableSize = context.data.tableSize
    dataSize = context.data.dataSize
  }

  if (options.child) {
    return {
      module,
      initFuncs: options.initFuncs || []
    }
  }

  return {
    module,
    tableSize,
    dataSize,
    initFuncs: options.initFuncs || [],
    buffer: buffer
  }
}
