import i32Toi64 from 'common/function/i32Toi64'
import i64Toi32 from 'common/function/i64Toi32'
import { SELF } from 'common/util/constant'
import * as is from 'common/util/is'

function uin32ToInt64(lowWord: number, highWord: number) {
  if (highWord >>> 31) {
    highWord &= 0xfffff
    if (lowWord) {
      lowWord -= 1
    }
    else {
      lowWord = 0xffffffff
      highWord -= 1
    }
    lowWord = ~lowWord
    highWord = (~highWord) & 0xfffff
    return BigInt(-1) * static_cast<int64>(i32Toi64(lowWord, highWord))
  }
  else {
    return static_cast<int64>(i32Toi64(lowWord, highWord & 0xfffff))
  }
}

function int64ToUint32(value: number) {
  let [lowWord, highWord] = i64Toi32(Math.abs(Number(value)))
  if (value < 0) {
    // 负数的补码是正数取反加 1
    lowWord = ~lowWord
    // number 整数位 52，高位只能有 20 位
    highWord = (~highWord) & 0xfffff
    if (lowWord === 0xffffffff) {
      lowWord = 0
      highWord += 1
    }
    else {
      lowWord += 1
    }
    // 置符号位为 1
    highWord |= 0x80000000
  }
  return [lowWord, highWord]
}

function uint64ToUint32(value: number) {
  let [lowWord, highWord] = i64Toi32(Math.abs(Number(value)))
  if (value < 0) {
    // 负数的补码是正数取反加 1
    lowWord = ~lowWord
    // number 整数位 52，高位只能有 20 位
    highWord = (~highWord) & 0xfffff
    if (lowWord === 0xffffffff) {
      lowWord = 0
      highWord += 1
    }
    else {
      lowWord += 1
    }
  }
  return [lowWord, highWord]
}

// 模拟 53 位有符号整数
function BigInt64Array(buffer: ArrayBuffer) {
  const obj = {
    view: new Uint32Array(buffer),
    buffer,
    length: buffer.byteLength >>> 3,
    byteLength: buffer.byteLength,
    byteOffset: 0,
    BYTES_PER_ELEMENT: 8
  }
  return new Proxy(obj, {
    get: function (target, p, receiver) {
      if (is.string(p) && is.number(+p)) {
        const offset = (+p) << 1
        let lowWord = target.view[offset]
        let highWord = target.view[offset + 1]
        return uin32ToInt64(lowWord, highWord)
      }
      return target[p]
    },
    set: function (target, p, value, receiver) {
      if (is.string(p) && is.number(+p)) {
        const [lowWord, highWord] = int64ToUint32(value)
        const offset = (+p) << 1
        target.view[offset] = lowWord
        target.view[offset + 1] = highWord
      }
      else {
        target[p] = value
      }
      return true
    }
  })
}

// 模拟 52 位无符号整数
function BigUint64Array(buffer: ArrayBuffer) {
  const obj = {
    view: new Uint32Array(buffer),
    buffer,
    length: buffer.byteLength >>> 3,
    byteLength: buffer.byteLength,
    byteOffset: 0,
    BYTES_PER_ELEMENT: 8
  }
  return new Proxy(obj, {
    get: function (target, p, receiver) {
      if (is.string(p) && is.number(+p)) {
        const offset = (+p) << 1
        const lowWord = target.view[offset]
        const highWord = target.view[offset + 1]
        return static_cast<int64>(i32Toi64(lowWord, highWord & 0xfffff))
      }
      return target[p]
    },
    set: function (target, p, value, receiver) {
      if (is.string(p) && is.number(+p)) {
        let [lowWord, highWord] = uint64ToUint32(value)
        const offset = (+p) << 1
        target.view[offset] = lowWord
        target.view[offset + 1] = highWord & 0xfffff
      }
      else {
        target[p] = value
      }
      return true
    }
  })
}

export default function polyfill() {
  // @ts-ignore
  if (!SELF.BigInt) {
    // @ts-ignore
    SELF.BigInt = Number
  }

  // @ts-ignore
  if (!SELF.BigInt64Array) {
    // @ts-ignore
    SELF.BigInt64Array = BigInt64Array
  }
  // @ts-ignore
  if (!SELF.BigUint64Array) {
    // @ts-ignore
    SELF.BigUint64Array = BigUint64Array
  }

  if (!SELF.DataView.prototype.getBigInt64) {
    SELF.DataView.prototype.getBigInt64 = function (this: DataView, byteOffset: number, littleEndian?: boolean) {
      let lowWord = this.getUint32(byteOffset + (littleEndian ? 0 : 4), littleEndian)
      let highWord = this.getUint32(byteOffset + (littleEndian ? 4 : 0), littleEndian)
      return uin32ToInt64(lowWord, highWord)
    }
  }
  if (!SELF.DataView.prototype.setBigInt64) {
    SELF.DataView.prototype.setBigInt64 = function (this: DataView, byteOffset: number, value: bigint, littleEndian?: boolean) {
      let [lowWord, highWord] = int64ToUint32(Number(value))
      this.setUint32(byteOffset + (littleEndian ? 0 : 4), lowWord, littleEndian)
      this.setUint32(byteOffset + (littleEndian ? 4 : 0), highWord, littleEndian)
    }
  }
  if (!SELF.DataView.prototype.getBigUint64) {
    SELF.DataView.prototype.getBigUint64 = function (this: DataView, byteOffset: number, littleEndian?: boolean) {
      let lowWord = this.getUint32(byteOffset + (littleEndian ? 0 : 4), littleEndian)
      let highWord = this.getUint32(byteOffset + (littleEndian ? 4 : 0), littleEndian)
      return static_cast<int64>(i32Toi64(lowWord, highWord & 0xfffff))
    }
  }
  if (!SELF.DataView.prototype.setBigUint64) {
    SELF.DataView.prototype.setBigUint64 = function (this: DataView, byteOffset: number, value: bigint, littleEndian?: boolean) {
      const [lowWord, highWord] = uint64ToUint32(Number(value))
      this.setUint32(byteOffset + (littleEndian ? 0 : 4), lowWord, littleEndian)
      this.setUint32(byteOffset + (littleEndian ? 4 : 0), highWord, littleEndian)
    }
  }

  const view = new DataView(new ArrayBuffer(8))

  // @ts-ignore
  if (!SELF.BigInt.asUintN) {
    // @ts-ignore
    SELF.BigInt.asUintN = function (bits: number, int: bigint) {
      view.setBigInt64(0, int)
      if (bits === 8) {
        return view.getUint8(0)
      }
      if (bits === 16) {
        return view.getUint16(0)
      }
      if (bits === 32) {
        return view.getUint32(0)
      }
      if (bits === 64) {
        return view.getBigUint64(0)
      }
    }
  }

  // @ts-ignore
  if (!SELF.BigInt.asIntN) {
    // @ts-ignore
    SELF.BigInt.asIntN = function (bits: number, int: bigint) {

      if (bits === 64) {
        return int
      }

      let max = Math.pow(2, bits - 1) - 1
      let min = -Math.pow(2, bits - 1)

      if (Number(int) <= max && Number(int) >= min) {
        return int
      }

      view.setBigInt64(0, int)
      if (bits === 8) {
        return view.getInt8(0)
      }
      if (bits === 16) {
        return view.getInt16(0)
      }
      if (bits === 32) {
        return view.getInt32(0)
      }
      if (bits === 64) {
        return view.getBigInt64(0)
      }
    }
  }
}
