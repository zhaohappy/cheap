import * as is from 'common/util/is'
import IOReader from 'common/io/IOReader'
import { IOError } from 'common/io/error'
import IOWriter from 'common/io/IOWriter'
import { DYlinkType, ExternalKind, SectionId, readSleb128Async,
  readUleb128Async, writeSleb128, writeUleb128, writeUleb128Async
} from 'common/util/wasm'
import concatTypeArray from 'common/function/concatTypeArray'
import * as object from 'common/util/object'
import * as config from '../config'
import browser from 'common/util/browser'
import os from 'common/util/os'
import BufferWriter from 'common/io/BufferWriter'
import nearestPowerOf2 from 'common/math/nearestPowerOf2'

export interface WebAssemblyResource {
  tableSize?: number
  tableAlign?: number
  dataSize?: number
  dataAlign?: number
  bssSize?: number
  initFuncs?: string[]
  module: WebAssembly.Module
  buffer?: ArrayBuffer
  threadModule?: {
    module: WebAssembly.Module
    initFuncs?: string[]
  }
  /**
   * 提前创建好的 worker pool
   * 某些 wasm 创建线程之后需要马上挂起线程，这种情况需要提前将线程准备好
   */
  enableThreadPool?: boolean
  enableThreadCountRate?: number
}

export interface WebAssemblySource {
  source: Uint8Array<ArrayBuffer> | ArrayBuffer | string
  tableSize?: number
  tableAlign?: number
  dataSize?: number
  dataAlign?: number
  bssSize?: number
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
    tableAlign?: number
    dataSize?: number
    dataAlign?: number
    bssSize?: number
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

          const size = await readUleb128Async(context.ioReader)
          await context.ioReader.skip(size)
          continue
        }
      }

      await context.ioWriter.writeUint8(sectionId)

      const size = await readUleb128Async(context.ioReader)

      const now = context.ioReader.getPos()
      if (sectionId === SectionId.Custom) {
        await writeUleb128Async(context.ioWriter, size)
        const now = context.ioReader.getPos()
        const len = await readUleb128Async(context.ioReader)
        const name = await context.ioReader.readString(len)
        await writeUleb128Async(context.ioWriter, len)
        await context.ioWriter.writeString(name)
        if (name === 'dylink.0') {
          const endPos = context.ioReader.getPos() + (static_cast<int64>(size) - (context.ioReader.getPos() - now))
          while (context.ioReader.getPos() < endPos) {
            const type = await context.ioReader.readUint8()
            await context.ioWriter.writeUint8(type)
            const contentSize = await readUleb128Async(context.ioReader)
            await writeUleb128Async(context.ioWriter, contentSize)
            if (type === DYlinkType.MEMORY) {
              context.data.dataSize = await readUleb128Async(context.ioReader)
              context.data.dataAlign = await readUleb128Async(context.ioReader)
              context.data.tableSize = await readUleb128Async(context.ioReader)
              context.data.tableAlign = await readUleb128Async(context.ioReader)
              await writeUleb128Async(context.ioWriter, context.data.dataSize)
              await writeUleb128Async(context.ioWriter, context.data.dataAlign)
              await writeUleb128Async(context.ioWriter, context.data.tableSize)
              await writeUleb128Async(context.ioWriter, context.data.tableAlign)
            }
            else {
              await context.ioWriter.writeBuffer(await context.ioReader.readBuffer(contentSize))
            }
          }
        }
      }
      else if (sectionId === SectionId.Data) {
        await writeUleb128Async(context.ioWriter, size)
        /**
         * - count: varuint32
         * - entries: data_segment*
         *   - index varuint32 the linear memory index (0 in the MVP)
         *   - offset init_expr 
         *   - size varuint32
         *   - data bytes
         */
        const count = await readUleb128Async(context.ioReader)
        await writeUleb128Async(context.ioWriter, count)
        if (count) {
          await writeUleb128Async(context.ioWriter, await readUleb128Async(context.ioReader))
          while (true) {
            const byte = await context.ioReader.readUint8()
            await context.ioWriter.writeUint8(byte)
            if (byte === 0x0b) {
              break
            }
          }
          const dataSize = await readUleb128Async(context.ioReader)
          if (context.data.dataSize) {
            context.data.bssSize = context.data.dataSize - dataSize
          }
          else {
            context.data.dataSize = dataSize
          }
          await writeUleb128Async(context.ioWriter, dataSize)
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
        const importWriter = new BufferWriter(new Uint8Array(size + 100))
        let count = await readUleb128Async(context.ioReader)
        writeUleb128(importWriter, count)
        let counter = 0

        while (count--) {
          const moduleLen = await readUleb128Async(context.ioReader)
          writeUleb128(importWriter, moduleLen)
          importWriter.writeBuffer(await context.ioReader.readBuffer(moduleLen))
          const fieldLen = await readUleb128Async(context.ioReader)
          writeUleb128(importWriter, fieldLen)
          importWriter.writeBuffer(await context.ioReader.readBuffer(fieldLen))

          const externalKind = await context.ioReader.readUint8()
          importWriter.writeUint8(externalKind)

          switch (externalKind) {
            case ExternalKind.Function: {
              // type index of the function signature
              writeUleb128(importWriter, await readUleb128Async(context.ioReader))
              break
            }
            case ExternalKind.Global: {
              // content_type
              writeSleb128(importWriter, await readSleb128Async(context.ioReader))
              // mutability
              writeUleb128(importWriter, await readUleb128Async(context.ioReader))
              break
            }
            case ExternalKind.Memory: {
              let flags = await readUleb128Async(context.ioReader)

              if (context.options.enableThread) {
                flags |= 2
              }
              else {
                flags &= ~2
              }

              writeUleb128(importWriter, flags)
              // initial
              const initial = await readUleb128Async(context.ioReader)
              writeUleb128(importWriter, config.HEAP_INITIAL || initial)
              if (flags & 0x01) {
                let max = await readUleb128Async(context.ioReader)
                if (!(os.ios && !browser.checkVersion(os.version, '17', true)) || !context.options.enableThread) {
                  // ios safari 16 以下改更了会编译错误，但它也不会去检查 max 和导入的内存是否限制一致
                  // 所以这里不更改了
                  max = config.HEAP_MAXIMUM
                }
                // maximum
                writeUleb128(importWriter, max)
              }
              counter++
              break
            }
            case ExternalKind.Table: {
              // elem_type
              writeSleb128(importWriter, await readSleb128Async(context.ioReader))
              const flags = await readUleb128Async(context.ioReader)
              writeUleb128(importWriter, flags)
              const initial = await readUleb128Async(context.ioReader)
              writeUleb128(importWriter, initial)

              context.data.tableSize = initial

              if (flags & 0x01) {
                // maximum
                writeUleb128(importWriter, await readUleb128Async(context.ioReader))
              }
              counter++
              break
            }
          }

          if (counter === 2) {
            break
          }
        }
        const buffer = importWriter.getWroteBuffer()
        const remainingLength = size - Number(context.ioReader.getPos() - now)
        await writeUleb128Async(context.ioWriter, buffer.length + remainingLength)
        await context.ioWriter.writeBuffer(buffer)
      }
      else {
        await writeUleb128Async(context.ioWriter, size)
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
  let tableAlign: number
  let dataSize: number
  let dataAlign: number
  let bssSize: number

  let buffer: ArrayBuffer

  options = object.extend({
    enableThread: config.USE_THREADS,
    initFuncs: options.child ? [] : ['__wasm_apply_data_relocs', '_initialize']
  }, options)

  if (is.number(source.dataSize) && is.number(source.tableSize)) {
    tableSize = source.dataSize
    dataSize = source.dataSize
    tableAlign = source.dataAlign
    dataAlign = source.dataAlign
    bssSize = source.bssSize
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
      buffer = is.arrayBuffer(source.source) ? source.source : (source.source as Uint8Array<ArrayBuffer>).buffer
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
            if (typeof AbortController === 'function') {
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
            const controller = await new Promise<ReadableStreamDefaultController<any>>((resolve) => {
              context.bufferResolve = resolve
            })
            controller.enqueue(buffer.slice())
            if (context.bufferEnded) {
              controller.close()
            }
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
      ? (concatTypeArray(Uint8Array, context.buffers) as Uint8Array<ArrayBuffer>).buffer
      : (is.arrayBuffer(source.source) ? source.source : (source.source as Uint8Array<ArrayBuffer>).buffer)
    tableSize = context.data.tableSize
    dataSize = context.data.dataSize
    tableAlign = context.data.tableAlign
    dataAlign = context.data.dataAlign
    bssSize = context.data.bssSize
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
    tableAlign: tableAlign || 0,
    dataSize,
    dataAlign: dataAlign ? Math.max(nearestPowerOf2(dataAlign), 8) : 8,
    bssSize: bssSize || 0,
    initFuncs: options.initFuncs || [],
    buffer: buffer
  }
}
