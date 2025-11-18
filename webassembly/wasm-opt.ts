import * as fs from 'fs'
import { wasm } from '@libmedia/common'
import { IOReaderSync as IOReader, IOError, IOWriterSync as IOWriter, BufferWriter } from '@libmedia/common/io'
import { program } from 'commander'

let command: {
  i?: string
  o?: string
  bss?: boolean
} = {}

program
  .version('1.0.0')
  .description('cheap wasm optimize tool')
  .option('-i, --input <wasm file>', 'input wasm file path')
  .option('-o, --output <wasm file>', 'output wasm file path')
  .option('-b, --bss', 'enable bss optimize')
  .action((options) => {
    command = options
    if (command.i && command.o) {
      optimize()
    }
  })

program.parse(process.argv)

function createReader() {
  const fid = fs.openSync(command.i, 'r')
  const stats = fs.statSync(command.i)

  let readPos = 0
  const readFileLength = stats.size

  const ioReader = new IOReader()
  ioReader.onFlush = (buffer) => {
    if (readPos >= readFileLength) {
      return IOError.END
    }

    const len = Math.min(buffer.length, readFileLength - readPos)

    fs.readSync(fid, buffer, 0, len, readPos)

    readPos += len

    return len
  }
  ioReader.onSeek = (pos) => {
    readPos = Number(pos)
    return 0
  }

  ioReader.onSize = () => {
    return BigInt(stats.size)
  }
  // @ts-ignore
  ioReader.fid = fid
  return ioReader
}


function analyze() {

  const options = {
    dataSize: 0,
    dataAlign: 4,
    tableSize: 0,
    tableAlign: 0,
    dataPrefixSize: 0,
    data: null
  }

  const ioReader = createReader()
  try {
    ioReader.readUint32()
    ioReader.readUint32()
    while (true) {
      const sectionId = ioReader.readUint8()

      const size = wasm.readUleb128(ioReader)

      const now = ioReader.getPos()

      if (sectionId === wasm.SectionId.Data) {
        const now = ioReader.getPos()
        const count = wasm.readUleb128(ioReader)
        if (count === 1) {
          wasm.readUleb128(ioReader)
          while (true) {
            const byte = ioReader.readUint8()
            if (byte === 0x0b) {
              break
            }
          }
          options.dataPrefixSize = Number(ioReader.getPos() - now)
          options.dataSize = wasm.readUleb128(ioReader)
          options.data = ioReader.readBuffer(options.dataSize)
        }
      }
      else if (sectionId === wasm.SectionId.Import) {
        let count = wasm.readUleb128(ioReader)
        let counter = 0

        while (count--) {
          const moduleLen = wasm.readUleb128(ioReader)
          ioReader.readBuffer(moduleLen)
          const fieldLen = wasm.readUleb128(ioReader)
          ioReader.readBuffer(fieldLen)

          const externalKind = ioReader.readUint8()

          switch (externalKind) {
            case wasm.ExternalKind.Function: {
              wasm.readUleb128(ioReader)
              break
            }
            case wasm.ExternalKind.Global: {
              wasm.readSleb128(ioReader)
              wasm.readUleb128(ioReader)
              break
            }
            case wasm.ExternalKind.Memory: {
              let flags = wasm.readUleb128(ioReader)
              wasm.readUleb128(ioReader)
              if (flags & 0x01) {
                wasm.readUleb128(ioReader)
              }
              counter++
              break
            }
            case wasm.ExternalKind.Table: {
              wasm.readSleb128(ioReader)
              const flags = wasm.readUleb128(ioReader)
              const initial = wasm.readUleb128(ioReader)
              options.tableSize = initial
              if (flags & 0x01) {
                wasm.readUleb128(ioReader)
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
      else if (sectionId === wasm.SectionId.Custom) {
        const nameLen = wasm.readUleb128(ioReader)
        const name = ioReader.readString(nameLen)
        if (name === 'dylink.0') {
          wasm.readUleb128(ioReader)
          options.dataAlign = wasm.readUleb128(ioReader)
          wasm.readUleb128(ioReader)
          options.tableAlign = wasm.readUleb128(ioReader)
        }
      }
      const remainingLength = size - Number(ioReader.getPos() - now)
      if (remainingLength) {
        ioReader.skip(remainingLength)
      }
    }
  }
  catch (e) {
    if (ioReader.error === IOError.END) {
      return options
    }
    else {
      throw e
    }
  }
}

function analyzeBss(data: Uint8Array) {

  if (!data) {
    return {
      data: null,
      bssSize: 0
    }
  }

  let i = data.length - 1
  for (; i >= 0; i--) {
    if (data[i] !== 0) {
      break
    }
  }
  if (i === 0) {
    return {
      data: data.subarray(0, 1),
      bssSize: data.length - 1
    }
  }
  return {
    data: data.subarray(0, i + 1),
    bssSize: data.length - i - 1
  }
}

function uleb128Len(value: number) {
  let len = 0
  do {
    let byte = value & 0x7f
    value >>= 7
    // 如果还有未编码的位，设置高位为 1
    if (value !== 0) {
      byte |= 0x80
    }
    len++
  } while (value !== 0)
  return len
}

function optimize() {
  const options = analyze()
  const bss = analyzeBss(options.data)

  const ioReader = createReader()
  const ioWriter = new IOWriter()
  const buffers: Uint8Array[] = []
  ioWriter.onFlush = (buffer) => {
    buffers.push(buffer.slice())
    return 0
  }

  ioWriter.writeUint32(ioReader.readUint32())
  ioWriter.writeUint32(ioReader.readUint32())

  if (options.dataSize || options.tableSize) {

    let bufferWriter = new BufferWriter(new Uint8Array(30))
    wasm.writeUleb128(bufferWriter, options.dataSize)
    wasm.writeUleb128(bufferWriter, options.dataAlign)
    wasm.writeUleb128(bufferWriter, options.tableSize)
    wasm.writeUleb128(bufferWriter, options.tableAlign)

    const content = bufferWriter.getWroteBuffer()
    bufferWriter = new BufferWriter(new Uint8Array(30))

    wasm.writeUleb128(bufferWriter, 8)
    bufferWriter.writeString('dylink.0')

    bufferWriter.writeUint8(wasm.DYlinkType.MEMORY)

    wasm.writeUleb128(bufferWriter, content.length)
    bufferWriter.writeBuffer(content)

    ioWriter.writeUint8(wasm.SectionId.Custom)
    wasm.writeUleb128(ioWriter, bufferWriter.getWroteBuffer().length)
    ioWriter.writeBuffer(bufferWriter.getWroteBuffer())
  }

  try {
    while (true) {
      const sectionId = ioReader.readUint8()

      const size = wasm.readUleb128(ioReader)

      const now = ioReader.getPos()

      if (sectionId === wasm.SectionId.Data && options.dataSize && command.bss) {
        ioWriter.writeUint8(sectionId)
        wasm.writeUleb128(ioWriter, options.dataPrefixSize + uleb128Len(bss.data.length) + bss.data.length)
        wasm.writeUleb128(ioWriter, wasm.readUleb128(ioReader))
        wasm.writeUleb128(ioWriter, wasm.readUleb128(ioReader))
        while (true) {
          const byte = ioReader.readUint8()
          ioWriter.writeUint8(byte)
          if (byte === 0x0b) {
            break
          }
        }
        const dataSize = wasm.readUleb128(ioReader)
        ioReader.skip(dataSize)
        wasm.writeUleb128(ioWriter, bss.data.length)
        ioWriter.writeBuffer(bss.data)
      }
      else if (sectionId === wasm.SectionId.Custom && options.dataSize && command.bss) {
        const nameLen = wasm.readUleb128(ioReader)
        const name = ioReader.readString(nameLen)
        if (name === 'dylink.0') {
          ioReader.skip(size - Number(ioReader.getPos() - now))
          continue
        }
        ioWriter.writeUint8(sectionId)
        wasm.writeUleb128(ioWriter, size)
        wasm.writeUleb128(ioWriter, nameLen)
        ioWriter.writeString(name)
      }
      else {
        ioWriter.writeUint8(sectionId)
        wasm.writeUleb128(ioWriter, size)
      }

      const remainingLength = size - Number(ioReader.getPos() - now)
      if (remainingLength) {
        ioReader.pipe(ioWriter, size - Number(ioReader.getPos() - now))
      }
    }
  }
  catch (e) {
    if (ioReader.error === IOError.END) {
      ioWriter.flush()
      // @ts-ignore
      fs.closeSync(ioReader.fid)
      fs.writeFileSync(command.o, Buffer.concat(buffers))
    }
    else {
      throw e
    }
  }
}
