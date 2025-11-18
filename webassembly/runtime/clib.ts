/* eslint-disable camelcase */

import { mapUint8Array } from '../../std/memory'
import { text } from '@libmedia/common'
import getRandomValues from '../../std/function/getRandomValues'

const buffers = [null, [], []]

const WASI_ERRNO_SUCCESS = 0
const WASI_ERRNO_NOSYS = 52
const WASI_ERRNO_INVAL = 28

export function printChar(stream: uint32, curr: char) {
  const buffer = buffers[stream]
  if (curr === 0 || curr === 10) {
    (stream === 1 ? console.log.bind(console) : console.log.bind(console))(text.decode(buffer))
    buffer.length = 0
  }
  else {
    buffer.push(curr)
  }
}

export function writeAsciiToMemory(str: string, buffer: pointer<char>, doNotAddNull?: boolean) {
  for (let i = 0; i < str.length; ++i) {
    accessof(buffer) <- reinterpret_cast<char>(str.charCodeAt(i))
    buffer++
  }
  if (!doNotAddNull) {
    accessof(buffer) <- reinterpret_cast<char>(0)
  }
}

const ENV = {}
let thisProgram: string = './this.program'
let getEnvStringsStrings: string[]

function getExecutableName() {
  return thisProgram || './this.program'
}

function getEnvStrings() {
  if (!getEnvStringsStrings) {
    const lang = (typeof navigator === 'object' && navigator.languages && navigator.languages[0] || 'C').replace('-', '_') + '.UTF-8'
    const env = {
      'USER': 'web_user',
      'LOGNAME': 'web_user',
      'PATH': '/',
      'PWD': '/',
      'HOME': '/home/web_user',
      'LANG': lang,
      '_': getExecutableName()
    }
    for (let x in ENV) {
      env[x] = ENV[x]
    }
    const strings = []
    for (let x in env) {
      strings.push(x + '=' + env[x])
    }
    getEnvStringsStrings = strings
  }
  return getEnvStringsStrings
}

export function environ_get(environ: pointer<pointer<char>>, environBuf: pointer<char>) {
  let bufSize: uint32 = 0
  getEnvStrings().forEach(function (string: string, i: uint32) {

    const ptr: pointer<char> = reinterpret_cast<pointer<char>>(environBuf + bufSize)

    accessof(reinterpret_cast<pointer<pointer<char>>>(environ + i)) <- ptr

    writeAsciiToMemory(string, reinterpret_cast<pointer<char>>(ptr))

    bufSize += string.length + 1
  })
  return 0
}

export function environ_sizes_get(penvironCount: pointer<size>, penvironBufSize: pointer<size>) {
  const strings = getEnvStrings()

  accessof(penvironCount) <- reinterpret_cast<size>(strings.length as uint32)

  let bufSize = 0
  strings.forEach(function (string) {
    bufSize += string.length + 1
  })

  accessof(penvironBufSize) <- reinterpret_cast<size>(bufSize as uint32)

  return 0
}


export function fd_fdstat_get(fd: uint32, buf_ptr: pointer<void>) {
  let rightsBase = 0
  if (fd == 0) {
    rightsBase = 2
  }
  else if (fd == 1 || fd == 2) {
    rightsBase = 64
  }
  accessof(reinterpret_cast<pointer<int8>>(buf_ptr)) <- reinterpret_cast<int8>(2)
  accessof(reinterpret_cast<pointer<int16>>(buf_ptr + 2)) <- reinterpret_cast<int16>(1)
  accessof(reinterpret_cast<pointer<int32>>(buf_ptr + 8)) <- reinterpret_cast<int32>(rightsBase)
  accessof(reinterpret_cast<pointer<int32>>(buf_ptr + 12)) <- reinterpret_cast<int32>(0)
  accessof(reinterpret_cast<pointer<int64>>(buf_ptr + 16)) <- reinterpret_cast<int64>(0n)

  return WASI_ERRNO_SUCCESS
}

@struct
class WASICiovec {
  buf: pointer<void>
  len: size
}

export function fd_read(fd: uint32, iovs: pointer<WASICiovec>, iovs_len: size, nread: pointer<size>) {
  return WASI_ERRNO_NOSYS
}

export function fd_seek(fd: uint32, offset: size, whence: int32, newoffset: pointer<size>) {
  return WASI_ERRNO_NOSYS
}

export function fd_write(fd: uint32, iovs: pointer<WASICiovec>, iovs_len: size, nwritten: pointer<size>) {
  let num: size = 0
  for (let i = 0; i < iovs_len; i++) {
    let ptr = iovs.buf
    let len = iovs.len
    for (let j = 0; j < len; j++) {
      printChar(fd, accessof(reinterpret_cast<pointer<char>>(ptr + (j as uint32))))
    }
    num += len
    iovs++
  }

  accessof(nwritten) <- num

  return WASI_ERRNO_SUCCESS
}

export function fd_close(fd: uint32) {
  return WASI_ERRNO_NOSYS
}

export function abort(what?: string) {
  what += ''
  what = `abort(${what}). Build with -s ASSERTIONS=1 for more info.`
  throw new WebAssembly.RuntimeError(what)
}

export function clock_time_get(clock_id: uint32, precision: int32, time: pointer<uint64>) {
  if (clock_id !== 0) {
    return WASI_ERRNO_INVAL
  }

  const now = new Date().getTime()

  accessof(time) <- reinterpret_cast<uint64>(static_cast<uint64>(now as uint32) * 1000000n)

  return WASI_ERRNO_SUCCESS
}

export function clock_res_get(clock_id: uint32, resolution: pointer<uint64>) {
  if (clock_id !== 0) {
    return WASI_ERRNO_INVAL
  }

  accessof(resolution) <- static_cast<uint64>(1000000n)

  return WASI_ERRNO_SUCCESS
}

export function random_get(pointer: pointer<uint8>, size: size) {
  const buffer = mapUint8Array(pointer, size)
  getRandomValues(buffer)
  return WASI_ERRNO_SUCCESS
}
