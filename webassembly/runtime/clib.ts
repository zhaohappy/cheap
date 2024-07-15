/* eslint-disable camelcase */

import { mapUint8Array } from '../../std/memory'
import * as text from 'common/util/text'

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
    accessof(buffer) <- static_cast<char>(str.charCodeAt(i))
    buffer++
  }
  if (!doNotAddNull) {
    accessof(buffer) <- static_cast<char>(0)
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

export function environ_get(environ: pointer<uint32>, environBuf: pointer<uint8>) {
  let bufSize = 0
  getEnvStrings().forEach(function (string: string, i: number) {

    const ptr: pointer<uint8> = reinterpret_cast<pointer<uint8>>(environBuf + bufSize)

    accessof(reinterpret_cast<pointer<uint32>>(environ + i)) <- reinterpret_cast<uint32>(ptr)

    writeAsciiToMemory(string, reinterpret_cast<pointer<char>>(ptr))

    bufSize += string.length + 1
  })
  return 0
}

export function environ_sizes_get(penvironCount: pointer<uint32>, penvironBufSize: pointer<uint32>) {
  const strings = getEnvStrings()

  accessof(penvironCount) <- static_cast<uint32>(strings.length)

  let bufSize = 0
  strings.forEach(function (string) {
    bufSize += string.length + 1
  })

  accessof(penvironBufSize) <- static_cast<uint32>(bufSize)

  return 0
}


export function fd_fdstat_get(fd: uint32, pBuf: pointer<void>) {
  let rightsBase = 0
  if (fd == 0) {
    rightsBase = 2
  }
  else if (fd == 1 || fd == 2) {
    rightsBase = 64
  }
  accessof(reinterpret_cast<pointer<int8>>(pBuf)) <- static_cast<int8>(2)
  accessof(reinterpret_cast<pointer<int16>>(pBuf + 2)) <- static_cast<int16>(1)
  accessof(reinterpret_cast<pointer<int32>>(pBuf + 8)) <- static_cast<int32>(rightsBase)
  accessof(reinterpret_cast<pointer<int32>>(pBuf + 12)) <- static_cast<int32>(0)
  accessof(reinterpret_cast<pointer<int64>>(pBuf + 16)) <- static_cast<int64>(0n)

  return WASI_ERRNO_SUCCESS
}

export function fd_read(fd: uint32, iov: pointer<uint32>, iovCnt: uint32, pNum: pointer<uint32>) {
  return WASI_ERRNO_NOSYS
}

export function fd_seek(fd: uint32, offsetLow: uint32, offsetHigh: uint32, whence: pointer<uint32>, newOffset: uint32) {
  return WASI_ERRNO_NOSYS
}

export function fd_write(fd: uint32, iov: pointer<uint32>, iovCnt: uint32, pNum: pointer<uint32>) {
  let num = 0
  for (let i = 0; i < iovCnt; i++) {
    let ptr = reinterpret_cast<pointer<char>>(accessof(iov))
    let len = accessof(reinterpret_cast<pointer<uint32>>(iov + 1))
    iov = reinterpret_cast<pointer<uint32>>(iov + 2)
    for (let j = 0; j < len; j++) {
      printChar(fd, accessof(reinterpret_cast<pointer<char>>(ptr + j)))
    }
    num += len
  }

  accessof(pNum) <- static_cast<uint32>(num)

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

export function clock_time_get(id: uint32, precision: int32, timeOut: pointer<uint64>) {
  if (id !== 0) {
    return WASI_ERRNO_INVAL
  }

  const now = new Date().getTime()

  accessof(timeOut) <- reinterpret_cast<uint64>(static_cast<uint64>(now as uint32) * 1000000n)

  return WASI_ERRNO_SUCCESS
}

export function clock_res_get(id: uint32, resOut: pointer<uint64>) {
  if (id !== 0) {
    return WASI_ERRNO_INVAL
  }

  accessof(resOut) <- static_cast<uint64>(1000000n)

  return WASI_ERRNO_SUCCESS
}

export function random_get(pointer: pointer<uint8>, size: size) {
  const buffer = mapUint8Array(pointer, size)
  if (defined(ENV_NODE)) {
    const crypto = require('crypto')
    crypto.randomFillSync(buffer)
  }
  else {
    crypto.getRandomValues(buffer)
  }
  return WASI_ERRNO_SUCCESS
}
