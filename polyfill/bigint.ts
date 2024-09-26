import i32Toi64 from 'common/function/i32Toi64'
import i64Toi32 from 'common/function/i64Toi32'
import { SELF } from 'common/util/constant'
import * as is from 'common/util/is'

function BigInt64Array(buffer: ArrayBuffer) {
  const obj = {
    int: new Int32Array(buffer),
    uint: new Uint32Array(buffer),
    buffer,
    length: buffer.byteLength >>> 3,
    byteLength: buffer.byteLength,
    byteOffset: 0
  }
  return new Proxy(obj, {
    get: function (target, p, receiver) {
      if (is.string(p) && is.number(+p)) {
        const offset = (+p) << 1
        const lowWord = target.uint[offset]
        const highWord = target.int[offset + 1]
        const value = static_cast<int64>(i32Toi64(lowWord, Math.abs(highWord)))
        return highWord >= 0 ? value : -value
      }
      return target[p]
    },
    set: function (target, p, value, receiver) {
      if (is.string(p) && is.number(+p)) {
        let [lowWord, highWord] = i64Toi32(Math.abs(Number(value)))
        if (value < 0) {
          highWord = -highWord
        }
        const offset = (+p) << 1
        target.uint[offset] = lowWord
        target.int[offset + 1] = highWord
      }
      else {
        target[p] = value
      }
      return true
    }
  })
}

function BigUint64Array(buffer: ArrayBuffer) {
  const obj = {
    view: new Uint32Array(buffer),
    buffer,
    length: buffer.byteLength >>> 3,
    byteLength: buffer.byteLength,
    byteOffset: 0
  }
  return new Proxy(obj, {
    get: function (target, p, receiver) {
      if (is.string(p) && is.number(+p)) {
        const offset = (+p) << 1
        const lowWord = target.view[offset]
        const highWord = target.view[offset + 1]
        return static_cast<int64>(i32Toi64(lowWord, highWord))
      }
      return target[p]
    },
    set: function (target, p, value, receiver) {
      if (is.string(p) && is.number(+p)) {
        let [lowWord, highWord] = i64Toi32(value)
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
      let lowWord = 0, highWord = 0
      lowWord = this.getUint32(byteOffset + (littleEndian ? 0 : 4), littleEndian)
      highWord = this.getInt32(byteOffset + (littleEndian ? 4 : 0), littleEndian)
      const value = static_cast<int64>(i32Toi64(lowWord, Math.abs(highWord)))
      return highWord >= 0 ? value : -value
    }
  }
  if (!SELF.DataView.prototype.setBigInt64) {
    SELF.DataView.prototype.setBigInt64 = function (this: DataView, byteOffset: number, value: bigint, littleEndian?: boolean) {
      let [lowWord, highWord] = i64Toi32(Math.abs(Number(value)))
      if (value < 0) {
        highWord = -highWord
      }
      this.setUint32(byteOffset + (littleEndian ? 0 : 4), lowWord, littleEndian)
      this.setInt32(byteOffset + (littleEndian ? 4 : 0), highWord, littleEndian)
    }
  }
  if (!SELF.DataView.prototype.getBigUint64) {
    SELF.DataView.prototype.getBigUint64 = function (this: DataView, byteOffset: number, littleEndian?: boolean) {
      let lowWord = 0, highWord = 0
      lowWord = this.getUint32(byteOffset + (littleEndian ? 0 : 4), littleEndian)
      highWord = this.getUint32(byteOffset + (littleEndian ? 4 : 0), littleEndian)
      return static_cast<int64>(i32Toi64(lowWord, highWord))
    }
  }
  if (!SELF.DataView.prototype.setBigUint64) {
    SELF.DataView.prototype.setBigUint64 = function (this: DataView, byteOffset: number, value: bigint, littleEndian?: boolean) {
      const [lowWord, highWord] = i64Toi32(Number(value))
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
