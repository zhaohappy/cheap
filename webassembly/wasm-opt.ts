import * as fs from 'fs'
import IOReader from 'common/io/IOReaderSync'
import IOWriter from 'common/io/IOWriterSync'
import { IOError } from 'common/io/error'
import { ExternalKind, readSleb128, readUleb128, SectionId, writeUleb128, DYlinkType } from 'common/util/wasm'
import BufferWriter from 'common/io/BufferWriter'

const args = process.argv.slice(2)

let command: {
  i?: string
  o?: string
  bss?: boolean
} = {}
let currentOption = null

args.forEach(arg => {
  if (arg.startsWith('-')) {
    currentOption = arg.replace(/^-+/, '')
    command[currentOption] = true
  }
  else if (currentOption) {
    command[currentOption] = arg
    currentOption = null
  }
  else {
    command['i'] = arg
  }
})

if (command.i && command.o) {
  optimize()
}

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
    data: null,
  }

  const ioReader = createReader()
  try {
    ioReader.readUint32()
    ioReader.readUint32()
    while (true) {
      const sectionId = ioReader.readUint8()
     
      const size = readUleb128(ioReader)

      const now = ioReader.getPos()

      if (sectionId === SectionId.Data) {
        const now = ioReader.getPos()
        const count = readUleb128(ioReader)
        if (count === 1) {
          readUleb128(ioReader)
          while (true) {
            const byte = ioReader.readUint8()
            if (byte === 0x0b) {
              break
            }
          }
          options.dataPrefixSize = Number(ioReader.getPos() - now)
          options.dataSize = readUleb128(ioReader)
          options.data = ioReader.readBuffer(options.dataSize)
        }
      }
      else if (sectionId === SectionId.Import) {
        let count = readUleb128(ioReader)
        let counter = 0

        while (count--) {
          const moduleLen = readUleb128(ioReader)
          ioReader.readBuffer(moduleLen)
          const fieldLen = readUleb128(ioReader)
          ioReader.readBuffer(fieldLen)

          const externalKind = ioReader.readUint8()

          switch (externalKind) {
            case ExternalKind.Function: {
              readUleb128(ioReader)
              break
            }
            case ExternalKind.Global: {
              readSleb128(ioReader)
              readUleb128(ioReader)
              break
            }
            case ExternalKind.Memory: {
              let flags = readUleb128(ioReader)
              readUleb128(ioReader)
              if (flags & 0x01) {
                readUleb128(ioReader)
              }
              counter++
              break
            }
            case ExternalKind.Table: {
              readSleb128(ioReader)
              const flags = readUleb128(ioReader)
              const initial = readUleb128(ioReader)
              options.tableSize = initial
              if (flags & 0x01) {
                readUleb128(ioReader)
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
      else if (sectionId === SectionId.Custom) {
        const nameLen = readUleb128(ioReader)
        const name = ioReader.readString(nameLen)
        if (name === 'dylink.0') {
          readUleb128(ioReader)
          options.dataAlign = readUleb128(ioReader)
          readUleb128(ioReader)
          options.tableAlign = readUleb128(ioReader)
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
    writeUleb128(bufferWriter, options.dataSize)
    writeUleb128(bufferWriter, options.dataAlign)
    writeUleb128(bufferWriter, options.tableSize)
    writeUleb128(bufferWriter, options.tableAlign)

    const content = bufferWriter.getWroteBuffer()
    bufferWriter = new BufferWriter(new Uint8Array(30))

    writeUleb128(bufferWriter, 8)
    bufferWriter.writeString('dylink.0')

    bufferWriter.writeUint8(DYlinkType.MEMORY)

    writeUleb128(bufferWriter, content.length)
    bufferWriter.writeBuffer(content)

    ioWriter.writeUint8(SectionId.Custom)
    writeUleb128(ioWriter, bufferWriter.getWroteBuffer().length)
    ioWriter.writeBuffer(bufferWriter.getWroteBuffer())
  }

  try {
    while (true) {
      const sectionId = ioReader.readUint8()

      const size = readUleb128(ioReader)

      const now = ioReader.getPos()

      if (sectionId === SectionId.Data && options.dataSize && command.bss) {
        ioWriter.writeUint8(sectionId)
        writeUleb128(ioWriter, options.dataPrefixSize + uleb128Len(bss.data.length) + bss.data.length)
        writeUleb128(ioWriter, readUleb128(ioReader))
        writeUleb128(ioWriter, readUleb128(ioReader))
        while (true) {
          const byte = ioReader.readUint8()
          ioWriter.writeUint8(byte)
          if (byte === 0x0b) {
            break
          }
        }
        const dataSize = readUleb128(ioReader)
        ioReader.skip(dataSize)
        writeUleb128(ioWriter, bss.data.length)
        ioWriter.writeBuffer(bss.data)
      }
      else if (sectionId === SectionId.Custom && options.dataSize && command.bss) {
        const nameLen = readUleb128(ioReader)
        const name = ioReader.readString(nameLen)
        if (name === 'dylink.0') {
          ioReader.skip(size - Number(ioReader.getPos() - now))
          continue
        }
        ioWriter.writeUint8(sectionId)
        writeUleb128(ioWriter, size)
        writeUleb128(ioWriter, nameLen)
        ioWriter.writeString(name)
      }
      else {
        ioWriter.writeUint8(sectionId)
        writeUleb128(ioWriter, size)
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