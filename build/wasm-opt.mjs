import * as fs from 'fs';
import { wasm } from '@libmedia/common';
import { program } from 'commander';

/**
 * @file 为了压缩，定义的常量
 */
const NULL = null;
const UNDEFINED = void 0;
const RAW_UNDEFINED = 'undefined';
/**
 * Single instance for window in browser
 */
const WINDOW = typeof window !== RAW_UNDEFINED ? window : UNDEFINED;
/**
 * Single instance for global in nodejs or browser
 */
// @ts-ignore
const GLOBAL = typeof globalThis !== RAW_UNDEFINED ? globalThis : (typeof global !== RAW_UNDEFINED ? global : WINDOW);
/**
 * Single instance for self in nodejs or browser
 */
// @ts-ignore
const SELF = typeof self !== RAW_UNDEFINED ? self : GLOBAL;
/**
 * Single instance for noop function
 */
const EMPTY_FUNCTION = function () {
    /** common */
};
/**
 * 空字符串
 */
const EMPTY_STRING = '';

/**
 * @file 强转为 string
 */
/**
 * 强转为 string
 *
 * @param target 待转换的值
 * @param defaultValue 默认值
 * @returns 转换之后的值
 */
function toString(target, defaultValue) {
    return target != NULL && target.toString
        ? target.toString()
        : EMPTY_STRING;
}

/**
 * @file 日志
 */
const TRACE = 0;
const INFO = 2;
const WARN = 3;
const ERROR = 4;
const FATAL = 5;
const nativeConsole = typeof console !== RAW_UNDEFINED ? console : NULL, 
/**
 * 当前是否是源码调试，如果开启了代码压缩，empty function 里的注释会被干掉
 */
defaultLogLevel = /common/.test(toString(EMPTY_FUNCTION)) ? INFO : WARN, 
printWarn = nativeConsole
    ? function (tag, msg) {
        nativeConsole.warn(tag, msg);
    }
    : EMPTY_FUNCTION, printError = nativeConsole
    ? function (tag, msg) {
        nativeConsole.error(tag, msg);
    }
    : EMPTY_FUNCTION;
/**
 * 全局调试开关
 */
function getLogLevel() {
    if (GLOBAL) {
        const logLevel = SELF['COMMON_LOG_LEVEL'];
        if (logLevel >= TRACE && logLevel <= FATAL) {
            return logLevel;
        }
    }
    return defaultLogLevel;
}
function warn(msg, file, line) {
    if (getLogLevel() <= WARN) {
        printWarn(`[${arguments[1]}][line ${arguments[2]}] [warn]`, msg);
    }
}
function error(msg, file, line) {
    if (getLogLevel() <= ERROR) {
        printError(`[${arguments[1]}][line ${arguments[2]}] [error]`, msg);
    }
}
function fatal(msg, file, line) {
    if (getLogLevel() <= FATAL) {
        error(msg, file, line);
        throw new Error(`[${arguments[1]}][line ${arguments[2]}] [fatal]: ${msg}`);
    }
}

const encoder = typeof TextEncoder === 'function' ? new TextEncoder() : null;
const decoder = typeof TextDecoder === 'function' ? new TextDecoder() : null;
function encode(data) {
    if (encoder) {
        return encoder.encode(data);
    }
    const array = [];
    for (let i = 0; i < data.length; ++i) {
        let u = data.charCodeAt(i);
        if (u >= 55296 && u <= 57343) {
            let u1 = data.charCodeAt(++i);
            u = 65536 + ((u & 1023) << 10) | u1 & 1023;
        }
        if (u <= 127) {
            array.push(u);
        }
        else if (u <= 2047) {
            array.push(192 | u >> 6);
            array.push(128 | u & 63);
        }
        else if (u <= 65535) {
            array.push(224 | u >> 12);
            array.push(128 | u >> 6 & 63);
            array.push(128 | u & 63);
        }
        else {
            array.push(240 | u >> 18);
            array.push(128 | u >> 12 & 63);
            array.push(128 | u >> 6 & 63);
            array.push(128 | u & 63);
        }
    }
    return new Uint8Array(array);
}
function decodeJS(data) {
    let result = '';
    for (let i = 0; i < data.length;) {
        let u0 = data[i++ >>> 0];
        if (!(u0 & 128)) {
            result += String.fromCharCode(u0);
            continue;
        }
        let u1 = data[i++ >>> 0] & 63;
        if ((u0 & 224) == 192) {
            result += String.fromCharCode((u0 & 31) << 6 | u1);
            continue;
        }
        let u2 = data[i++ >>> 0] & 63;
        if ((u0 & 240) == 224) {
            u0 = (u0 & 15) << 12 | u1 << 6 | u2;
        }
        else {
            u0 = (u0 & 7) << 18 | u1 << 12 | u2 << 6 | data[i++ >>> 0] & 63;
        }
        if (u0 < 65536) {
            result += String.fromCharCode(u0);
        }
        else {
            let ch = u0 - 65536;
            result += String.fromCharCode(55296 | ch >> 10, 56320 | ch & 1023);
        }
    }
    return result;
}
function decode(data) {
    if (data instanceof Uint8Array && decoder && !(typeof SharedArrayBuffer === 'function' && data.buffer instanceof SharedArrayBuffer)) {
        try {
            // chrome 偶现 data.buffer instanceof SharedArrayBuffer 返回 false 但其实是 SharedArrayBuffer 的情况
            return decoder.decode(data);
        }
        catch (error) {
            return decodeJS(data);
        }
    }
    return decodeJS(data);
}

const cheap__fileName__0$1 = "src/common/src/io/IOReaderSync.ts";
class IOReaderSync {
    data;
    buffer;
    pointer;
    endPointer;
    pos;
    size;
    littleEndian;
    fileSize_;
    error;
    onFlush;
    onSeek;
    onSize;
    flags;
    /**
     * @param data 待读取的字节
     * @param bigEndian 是否按大端字节序读取，默认大端字节序（网络字节序）
     */
    constructor(size = 1048576, bigEndian = true, map) {
        this.pos = BigInt(0);
        this.pointer = 0;
        this.error = 0;
        this.endPointer = 0;
        this.littleEndian = !bigEndian;
        this.flags = 0;
        if (map && map.view) {
            this.size = map.length;
            this.buffer = map;
            this.data = map.view;
        }
        else if (map && !map.byteOffset) {
            this.size = map.length;
            this.buffer = map;
            this.data = new DataView(this.buffer.buffer);
        }
        else {
            if (map) {
                throw new Error('not support subarray of ArrayBuffer');
            }
            this.size = Math.max(size, 102400);
            this.buffer = new Uint8Array(this.size);
            this.data = new DataView(this.buffer.buffer);
        }
    }
    /**
     * 读取 8 位无符号整数
     *
     * @returns
     */
    readUint8() {
        if (this.remainingLength() < 1) {
            this.flush(1);
        }
        const value = this.data.getUint8(this.pointer);
        this.pointer++;
        this.pos++;
        return value;
    }
    /**
     * 读取 8 位无符号整数（不会移动读取指针位置）
     *
     * @returns
     */
    peekUint8() {
        if (this.remainingLength() < 1) {
            this.flush(1);
        }
        return this.data.getUint8(this.pointer);
    }
    /**
     * 读取 16 位无符号整数
     *
     * @returns
     */
    readUint16() {
        if (this.remainingLength() < 2) {
            this.flush(2);
        }
        const value = this.data.getUint16(this.pointer, this.littleEndian);
        this.pointer += 2;
        this.pos += BigInt(2);
        return value;
    }
    /**
     * 读取 16 位无符号整数（不会移动读取指针位置）
     *
     * @returns
     */
    peekUint16() {
        if (this.remainingLength() < 2) {
            this.flush(2);
        }
        return this.data.getUint16(this.pointer, this.littleEndian);
    }
    /**
     * 读取 24 位无符号整数
     *
     * @returns
     */
    readUint24() {
        if (this.remainingLength() < 3) {
            this.flush(3);
        }
        const high = this.readUint16();
        const low = this.readUint8();
        return this.littleEndian ? (low << 16 | high) : (high << 8 | low);
    }
    /**
     * 读取 24 位无符号整数（不会移动读取指针位置）
     *
     * @returns
     */
    peekUint24() {
        if (this.remainingLength() < 3) {
            this.flush(3);
        }
        const pointer = this.pointer;
        const pos = this.pos;
        const high = this.readUint16();
        const low = this.readUint8();
        const value = this.littleEndian ? (low << 16 | high) : (high << 8 | low);
        this.pointer = pointer;
        this.pos = pos;
        return value;
    }
    /**
     * 读取 32 位无符号整数
     *
     * @returns
     */
    readUint32() {
        if (this.remainingLength() < 4) {
            this.flush(4);
        }
        const value = this.data.getUint32(this.pointer, this.littleEndian);
        this.pointer += 4;
        this.pos += BigInt(4);
        return value;
    }
    /**
     * 读取 32 位无符号整数（不会移动读取指针位置）
     *
     * @returns
     */
    peekUint32() {
        if (this.remainingLength() < 4) {
            this.flush(4);
        }
        return this.data.getUint32(this.pointer, this.littleEndian);
    }
    /**
     * 读取 64 位无符号整数
     *
     * @returns
     */
    readUint64() {
        if (this.remainingLength() < 8) {
            this.flush(8);
        }
        const value = this.data.getBigUint64(this.pointer, this.littleEndian);
        this.pointer += 8;
        this.pos += BigInt(8);
        return value;
    }
    /**
     * 读取 64 位无符号整数（不会移动读取指针位置）
     *
     * @returns
     */
    peekUint64() {
        if (this.remainingLength() < 8) {
            this.flush(8);
        }
        return this.data.getBigUint64(this.pointer, this.littleEndian);
    }
    /**
     * 读取 8 位有符号整数
     *
     * @returns
     */
    readInt8() {
        if (this.remainingLength() < 1) {
            this.flush(1);
        }
        const value = this.data.getInt8(this.pointer);
        this.pointer++;
        this.pos++;
        return value;
    }
    /**
     * 读取 8 位有符号整数（不会移动读取指针位置）
     *
     * @returns
     */
    peekInt8() {
        if (this.remainingLength() < 1) {
            this.flush(1);
        }
        return this.data.getInt8(this.pointer);
    }
    /**
     * 读取 16 位有符号整数
     *
     * @returns
     */
    readInt16() {
        if (this.remainingLength() < 2) {
            this.flush(2);
        }
        const value = this.data.getInt16(this.pointer, this.littleEndian);
        this.pointer += 2;
        this.pos += BigInt(2);
        return value;
    }
    /**
     * 读取 16 位有符号整数（不会移动读取指针位置）
     *
     * @returns
     */
    peekInt16() {
        if (this.remainingLength() < 2) {
            this.flush(2);
        }
        return this.data.getInt16(this.pointer, this.littleEndian);
    }
    /**
     * 读取 24 位有符号整数
     *
     * @returns
     */
    readInt24() {
        const value = this.readUint24();
        return (value & 0x800000) ? (value - 0x1000000) : value;
    }
    /**
     * 读取 24 位有符号整数（不会移动读取指针位置）
     *
     * @returns
     */
    peekInt24() {
        const value = this.peekUint24();
        return (value & 0x800000) ? (value - 0x1000000) : value;
    }
    /**
     * 读取 32 位有符号整数
     *
     * @returns
     */
    readInt32() {
        if (this.remainingLength() < 4) {
            this.flush(4);
        }
        const value = this.data.getInt32(this.pointer, this.littleEndian);
        this.pointer += 4;
        this.pos += BigInt(4);
        return value;
    }
    /**
     * 读取 32 位有符号整数（不会移动读取指针位置）
     *
     * @returns
     */
    peekInt32() {
        if (this.remainingLength() < 4) {
            this.flush(4);
        }
        return this.data.getInt32(this.pointer, this.littleEndian);
    }
    /**
     * 读取 64 位有符号整数
     *
     * @returns
     */
    readInt64() {
        if (this.remainingLength() < 8) {
            this.flush(8);
        }
        const value = this.data.getBigInt64(this.pointer, this.littleEndian);
        this.pointer += 8;
        this.pos += BigInt(8);
        return value;
    }
    /**
     * 读取 64 位有符号整数（不会移动读取指针位置）
     *
     * @returns
     */
    peekInt64() {
        if (this.remainingLength() < 8) {
            this.flush(8);
        }
        return this.data.getBigInt64(this.pointer, this.littleEndian);
    }
    /**
     * 读取单精度浮点数
     *
     * @returns
     */
    readFloat() {
        if (this.remainingLength() < 4) {
            this.flush(4);
        }
        const value = this.data.getFloat32(this.pointer, this.littleEndian);
        this.pointer += 4;
        this.pos += BigInt(4);
        return value;
    }
    /**
     * 读取单精度浮点数（不会移动读取指针位置）
     *
     * @returns
     */
    peekFloat() {
        if (this.remainingLength() < 4) {
            this.flush(4);
        }
        return this.data.getFloat32(this.pointer, this.littleEndian);
    }
    /**
     * 读取双精度浮点数
     *
     * @returns
     */
    readDouble() {
        if (this.remainingLength() < 8) {
            this.flush(8);
        }
        const value = this.data.getFloat64(this.pointer, this.littleEndian);
        this.pointer += 8;
        this.pos += BigInt(8);
        return value;
    }
    /**
     * 读取双精度浮点数（不会移动读取指针位置）
     *
     * @returns
     */
    peekDouble() {
        if (this.remainingLength() < 8) {
            this.flush(8);
        }
        return this.data.getFloat64(this.pointer, this.littleEndian);
    }
    /**
     * 读取指定长度的字节，并以 16 进制字符串返回
     *
     * @param length 默认 1
     * @returns
     */
    readHex(length = 1) {
        let hexStr = '';
        for (let i = 0; i < length; i++) {
            const hex = this.readUint8().toString(16);
            hexStr += (hex.length === 1 ? '0' + hex : hex);
        }
        return hexStr;
    }
    /**
     * 读取指定长度的字节，并以 16 进制字符串返回（不会移动读取指针位置）
     *
     * @param length 默认 1
     * @returns
     */
    peekHex(length = 1) {
        if (length > this.size) {
            this.error = -1048574 /* IOError.INVALID_OPERATION */;
            fatal('peekHex, length too large', cheap__fileName__0$1, 412);
        }
        if (this.remainingLength() < length) {
            this.flush(length);
        }
        const pointer = this.pointer;
        const pos = this.pos;
        let hexStr = '';
        for (let i = 0; i < length; i++) {
            const hex = this.readUint8().toString(16);
            hexStr += (hex.length === 1 ? '0' + hex : hex);
        }
        this.pointer = pointer;
        this.pos = pos;
        return hexStr;
    }
    readBuffer(length, buffer) {
        if (!length) {
            return new Uint8Array(0);
        }
        if (!buffer) {
            buffer = new Uint8Array(length);
        }
        if (this.remainingLength() < length) {
            let index = 0;
            if (this.remainingLength() > 0) {
                const len = this.remainingLength();
                buffer.set(this.buffer.subarray(this.pointer, this.pointer + len), index);
                index += len;
                this.pointer += len;
                this.pos += BigInt(len);
                length -= len;
            }
            while (length > 0) {
                this.flush();
                const len = Math.min(this.endPointer - this.pointer, length);
                buffer.set(this.buffer.subarray(this.pointer, this.pointer + len), index);
                index += len;
                this.pointer += len;
                this.pos += BigInt(len);
                length -= len;
            }
        }
        else {
            buffer.set(this.buffer.subarray(this.pointer, this.pointer + length), 0);
            this.pointer += length;
            this.pos += BigInt(length);
        }
        return buffer;
    }
    peekBuffer(length, buffer) {
        if (!length) {
            return new Uint8Array(0);
        }
        if (length > this.size) {
            this.error = -1048574 /* IOError.INVALID_OPERATION */;
            fatal('peekBuffer, length too large', cheap__fileName__0$1, 505);
        }
        if (this.remainingLength() < length) {
            this.flush(length);
        }
        if (!buffer) {
            buffer = new Uint8Array(length);
        }
        buffer.set(this.buffer.subarray(this.pointer, this.pointer + length), 0);
        return buffer;
    }
    /**
     * 读取最多 length 字节的数据到指定 buffer，返回已写入的字节长度
     *
     * @param length
     * @param buffer
     * @returns
     */
    readToBuffer(length, buffer) {
        if (this.remainingLength() < length) {
            let index = 0;
            if (this.remainingLength() > 0) {
                const len = this.remainingLength();
                buffer.set(this.buffer.subarray(this.pointer, this.pointer + len), index);
                index += len;
                this.pointer += len;
                this.pos += BigInt(len);
                length -= len;
            }
            while (length > 0) {
                try {
                    this.flush();
                }
                catch (error) {
                    if (this.error === -1048576 /* IOError.END */ && index) {
                        return index;
                    }
                    else {
                        throw error;
                    }
                }
                const len = Math.min(this.endPointer - this.pointer, length);
                buffer.set(this.buffer.subarray(this.pointer, this.pointer + len), index);
                index += len;
                this.pointer += len;
                this.pos += BigInt(len);
                length -= len;
            }
            return index;
        }
        else {
            buffer.set(this.buffer.subarray(this.pointer, this.pointer + length), 0);
            this.pointer += length;
            this.pos += BigInt(length);
            return length;
        }
    }
    /**
     * 读取指定长度的字符串
     *
     * @param length 默认 1
     * @returns
     */
    readString(length = 1) {
        const buffer = this.readBuffer(length);
        return decode(buffer);
    }
    /**
     * 读取指定长度的字符串
     *
     * @param length 默认 1
     * @returns
     */
    peekString(length = 1) {
        const buffer = this.peekBuffer(length);
        return decode(buffer);
    }
    /**
     * 读取一行字符
     */
    readLine() {
        let str = '';
        while (true) {
            let got = false;
            for (let i = this.pointer; i < this.endPointer; i++) {
                if (this.buffer[i] === 0x0a || this.buffer[i] === 0x0d) {
                    if (i !== this.pointer) {
                        str += this.readString(i - this.pointer);
                    }
                    got = true;
                    break;
                }
            }
            if (!got) {
                str += this.readString(this.remainingLength());
                this.flush();
            }
            else {
                break;
            }
        }
        let next = this.peekUint8();
        if (next === 0x0a || next === 0x0d) {
            this.pointer++;
            if (next === 0x0d) {
                next = this.peekUint8();
                // \r\n
                if (next === 0x0a) {
                    this.pointer++;
                }
            }
        }
        return str;
    }
    /**
     * 读取一行字符
     */
    peekLine() {
        if (this.remainingLength() < this.size) {
            this.flush();
        }
        let str = '';
        let got = false;
        for (let i = this.pointer; i < this.endPointer; i++) {
            if (this.buffer[i] === 0x0a || this.buffer[i] === 0x0d) {
                str += this.peekString(i - this.pointer);
                got = true;
                break;
            }
        }
        if (!got) {
            this.error = -1048574 /* IOError.INVALID_OPERATION */;
            fatal('peekLine, out of buffer', cheap__fileName__0$1, 656);
        }
        return str;
    }
    /**
     * 获取当前读取指针
     *
     * @returns
     */
    getPointer() {
        return this.pointer;
    }
    /**
     * 获取已读字节偏移
     *
     * @returns
     */
    getPos() {
        return this.pos;
    }
    /**
     * 跳过指定字节长度
     *
     * @param length
     */
    skip(length) {
        const backup = length;
        while (this.remainingLength() < length) {
            length -= this.remainingLength();
            this.pointer = this.endPointer;
            this.flush();
        }
        if (this.remainingLength() >= length) {
            this.pointer += length;
        }
        this.pos += BigInt(backup);
    }
    /**
     * 获取剩余可读字节数
     *
     * @returns
     */
    remainingLength() {
        return this.endPointer - this.pointer;
    }
    /**
     * 重新填充剩余缓冲区
     *
     * @param need
     * @returns
     */
    flush(need = 0) {
        if (!this.onFlush) {
            this.error = -1048574 /* IOError.INVALID_OPERATION */;
            fatal('IOReader error, flush failed because of no flush callback', cheap__fileName__0$1, 720);
        }
        if (this.size - this.remainingLength() <= 0) {
            return;
        }
        need = Math.min(need, this.size);
        if (this.pointer < this.endPointer) {
            this.buffer.set(this.buffer.subarray(this.pointer, this.endPointer), 0);
            this.endPointer = this.endPointer - this.pointer;
        }
        else {
            this.endPointer = 0;
        }
        this.pointer = 0;
        if (need) {
            while (this.remainingLength() < need) {
                const len = this.onFlush(this.buffer.subarray(this.endPointer));
                if (len < 0) {
                    this.error = len;
                    throw new Error(`IOReader error, flush ${len === -1048576 /* IOError.END */ ? 'ended' : 'failed'}, ret: ${len}`);
                }
                this.endPointer += len;
            }
        }
        else {
            const len = this.onFlush(this.buffer.subarray(this.endPointer));
            if (len < 0) {
                this.error = len;
                throw new Error(`IOReader error, flush ${len === -1048576 /* IOError.END */ ? 'ended' : 'failed'}, ret: ${len}`);
            }
            this.endPointer += len;
        }
        this.error = 0;
    }
    /**
     *
     * seek 到指定位置
     *
     * @param pos
     * @param force false 时可以在目前的缓冲区内 seek，否则丢弃缓冲区内容重新填充指定位置的数据，默认 false
     * @param flush 指定 seek 之后是否马上填充数据，否则只 seek 到目标位置，默认 true
     * @returns
     */
    seek(pos, force = false, flush = true) {
        if (!force) {
            const len = Number(pos - this.pos);
            // 可以往回 seek
            if (len < 0 && Math.abs(len) <= this.pointer) {
                this.pointer += len;
                this.pos = pos;
                return;
            }
            // 可以直接往后 seek
            else if (len > 0 && this.pointer + len < this.endPointer) {
                this.pointer += len;
                this.pos = pos;
                return;
            }
            else if (len === 0) {
                return;
            }
        }
        if (!this.onSeek) {
            this.error = -1048574 /* IOError.INVALID_OPERATION */;
            fatal('IOReader error, seek failed because of no seek callback', cheap__fileName__0$1, 790);
        }
        this.pointer = this.endPointer = 0;
        this.pos = pos;
        const ret = this.onSeek(pos);
        if (ret !== 0) {
            this.error = ret;
            fatal('IOReader error, seek failed', cheap__fileName__0$1, 799);
        }
        if (flush) {
            this.flush();
        }
    }
    /**
     * 获取缓冲区
     */
    getBuffer() {
        return this.buffer;
    }
    /**
     * 写入数据到缓冲区
     *
     * @param buffer
     */
    appendBuffer(buffer) {
        if (this.size - this.endPointer >= buffer.length) {
            this.buffer.set(buffer, this.endPointer);
            this.endPointer += buffer.length;
        }
        else {
            this.buffer.set(this.buffer.subarray(this.pointer, this.endPointer), 0);
            this.endPointer = this.endPointer - this.pointer;
            this.pointer = 0;
            if (this.size - this.endPointer >= buffer.length) {
                this.buffer.set(buffer, this.endPointer);
                this.endPointer += buffer.length;
            }
            else {
                const len = Math.min(this.size - this.endPointer, buffer.length);
                this.buffer.set(buffer.subarray(0, len), this.endPointer);
                this.endPointer += len;
                warn('IOReader, call appendBuffer but the buffer\'s size is lagger then the remaining size', cheap__fileName__0$1, 838);
            }
        }
    }
    /**
     * 重置 reader
     */
    reset() {
        this.pointer = this.endPointer = 0;
        this.pos = BigInt(0);
        this.error = 0;
    }
    /**
     * 设置读取是小端还是大端
     *
     * @param bigEndian
     */
    setEndian(bigEndian) {
        this.littleEndian = !bigEndian;
    }
    /**
     * 当前读取模式是否是大端
     *
     * @returns
     */
    isBigEndian() {
        return !this.littleEndian;
    }
    /**
     * 获取源总字节长度
     *
     * @returns
     */
    fileSize() {
        if (this.fileSize_) {
            return this.fileSize_;
        }
        if (!this.onSize) {
            warn('IOReader error, fileSize failed because of no onSize callback', cheap__fileName__0$1, 880);
            return BigInt(0);
        }
        try {
            this.fileSize_ = this.onSize();
        }
        catch (error) {
            warn(`IOReader error, call fileSize failed: ${error}`, cheap__fileName__0$1, 887);
            this.fileSize_ = BigInt(0);
        }
        return this.fileSize_;
    }
    /**
     * 获取缓冲区长度
     *
     * @returns
     */
    getBufferSize() {
        return this.size;
    }
    /**
     * 连接到 ioWriter
     *
     * @param ioWriter
     * @param length
     */
    pipe(ioWriter, length) {
        if (length) {
            if (this.remainingLength() < length) {
                if (this.remainingLength() > 0) {
                    const len = this.remainingLength();
                    ioWriter.writeBuffer(this.buffer.subarray(this.pointer, this.pointer + len));
                    this.pointer += len;
                    this.pos += BigInt(len);
                    length -= len;
                }
                while (length > 0) {
                    this.flush();
                    const len = Math.min(this.endPointer - this.pointer, length);
                    ioWriter.writeBuffer(this.buffer.subarray(this.pointer, this.pointer + len));
                    this.pointer += len;
                    this.pos += BigInt(len);
                    length -= len;
                }
            }
            else {
                ioWriter.writeBuffer(this.buffer.subarray(this.pointer, this.pointer + length));
                this.pointer += length;
                this.pos += BigInt(length);
            }
        }
        else {
            if (this.remainingLength() > 0) {
                const len = this.remainingLength();
                ioWriter.writeBuffer(this.buffer.subarray(this.pointer, this.pointer + len));
                this.pointer += len;
                this.pos += BigInt(len);
            }
            while (this.onFlush(this.buffer.subarray(0)) > 0) {
                const len = this.remainingLength();
                ioWriter.writeBuffer(this.buffer.subarray(this.pointer, this.pointer + len));
                this.pointer += len;
                this.pos += BigInt(len);
            }
        }
    }
}

/**
 * 写字节流工具
 */
class IOWriterSync {
    data;
    buffer;
    pointer;
    pos;
    size;
    littleEndian;
    error;
    onFlush;
    onSeek;
    /**
     * @param data 待写的 Uint8Array
     * @param bigEndian 是否按大端字节序写，默认大端字节序（网络字节序）
     */
    constructor(size = 1048576, bigEndian = true, map) {
        this.pointer = 0;
        this.pos = BigInt(0);
        this.size = size;
        this.littleEndian = !bigEndian;
        this.error = 0;
        if (map && map.view) {
            this.size = map.length;
            this.buffer = map;
            this.data = map.view;
        }
        else if (map && !map.byteOffset) {
            this.size = map.length;
            this.buffer = map;
            this.data = new DataView(this.buffer.buffer);
        }
        else {
            if (map) {
                throw new Error('not support subarray of ArrayBuffer');
            }
            this.buffer = new Uint8Array(this.size);
            this.data = new DataView(this.buffer.buffer);
        }
    }
    /**
     * 写 8 位无符号整数
     */
    writeUint8(value) {
        if (this.remainingLength() < 1) {
            this.flush();
        }
        this.data.setUint8(this.pointer, value);
        this.pointer++;
        this.pos++;
    }
    /**
     * 读取 16 位无符号整数
     */
    writeUint16(value) {
        if (this.remainingLength() < 2) {
            this.flush();
        }
        this.data.setUint16(this.pointer, value, this.littleEndian);
        this.pointer += 2;
        this.pos += BigInt(2);
    }
    /**
     * 写 24 位无符号整数
     */
    writeUint24(value) {
        if (this.remainingLength() < 3) {
            this.flush();
        }
        const high = (value & 0xff0000) >> 16;
        const middle = (value & 0x00ff00) >> 8;
        const low = value & 0x0000ff;
        if (this.littleEndian) {
            this.writeUint8(low);
            this.writeUint8(middle);
            this.writeUint8(high);
        }
        else {
            this.writeUint8(high);
            this.writeUint8(middle);
            this.writeUint8(low);
        }
    }
    /**
     * 写 32 位无符号整数
     */
    writeUint32(value) {
        if (this.remainingLength() < 4) {
            this.flush();
        }
        this.data.setUint32(this.pointer, value, this.littleEndian);
        this.pointer += 4;
        this.pos += BigInt(4);
    }
    /**
     * 写 64 位无符号整数
     */
    writeUint64(value) {
        if (this.remainingLength() < 8) {
            this.flush();
        }
        this.data.setBigUint64(this.pointer, value, this.littleEndian);
        this.pointer += 8;
        this.pos += BigInt(8);
    }
    /**
     * 写 8 位有符号整数
     *
     * @returns
     */
    writeInt8(value) {
        if (this.remainingLength() < 1) {
            this.flush();
        }
        this.data.setInt8(this.pointer, value);
        this.pointer++;
        this.pos++;
    }
    /**
     * 写 16 位有符号整数
     */
    writeInt16(value) {
        if (this.remainingLength() < 2) {
            this.flush();
        }
        this.data.setInt16(this.pointer, value, this.littleEndian);
        this.pointer += 2;
        this.pos += BigInt(2);
    }
    /**
     * 写 24 位有符号整数
     */
    writeInt24(value) {
        this.writeUint24(value < 0 ? (value + 0x1000000) : value);
    }
    /**
     * 写 32 位有符号整数
     */
    writeInt32(value) {
        if (this.remainingLength() < 4) {
            this.flush();
        }
        this.data.setInt32(this.pointer, value, this.littleEndian);
        this.pointer += 4;
        this.pos += BigInt(4);
    }
    /**
     * 写 64 位有符号整数
     */
    writeInt64(value) {
        if (this.remainingLength() < 8) {
            this.flush();
        }
        this.data.setBigInt64(this.pointer, value, this.littleEndian);
        this.pointer += 8;
        this.pos += BigInt(8);
    }
    /**
     * 写单精度浮点数
     *
     * @returns
     */
    writeFloat(value) {
        if (this.remainingLength() < 4) {
            this.flush();
        }
        this.data.setFloat32(this.pointer, value, this.littleEndian);
        this.pointer += 4;
        this.pos += BigInt(4);
    }
    /**
     * 写双精度浮点数
     */
    writeDouble(value) {
        if (this.remainingLength() < 8) {
            this.flush();
        }
        this.data.setFloat64(this.pointer, value, this.littleEndian);
        this.pointer += 8;
        this.pos += BigInt(8);
    }
    /**
     * 获取当前写指针
     *
     * @returns
     */
    getPointer() {
        return this.pointer;
    }
    getPos() {
        return this.pos;
    }
    /**
     * 获取剩余可写节数
     *
     * @returns
     */
    remainingLength() {
        return this.size - this.pointer;
    }
    /**
     * 写指定长度的二进制 buffer 数据
     *
     * @param length
     * @returns
     */
    writeBuffer(buffer) {
        if (!buffer.length) {
            return;
        }
        let length = buffer.length;
        if (this.remainingLength() < length) {
            let index = 0;
            while (length > 0) {
                this.flush();
                const len = Math.min(this.size, length);
                this.buffer.set(buffer.subarray(index, index + len), this.pointer);
                this.pointer += len;
                this.pos += BigInt(len);
                index += len;
                length -= len;
            }
        }
        else {
            this.buffer.set(buffer, this.pointer);
            this.pointer += length;
            this.pos += BigInt(length);
        }
    }
    /**
     * 写一个字符串
     */
    writeString(str) {
        const buffer = encode(str);
        this.writeBuffer(buffer);
        return buffer.length;
    }
    /**
     * 将缓冲区中数据写出
     */
    flush() {
        if (!this.onFlush) {
            this.error = -1048574 /* IOError.INVALID_OPERATION */;
            throw Error('IOWriter error, flush failed because of no flush callback');
        }
        if (this.pointer) {
            const ret = this.onFlush(this.buffer.subarray(0, this.pointer));
            if (ret !== 0) {
                this.error = ret;
                throw Error('IOWriter error, flush failed');
            }
        }
        this.pointer = 0;
    }
    /**
     * 将缓冲区中数据写出到指定位置
     *
     * @param pos
     */
    flushToPos(pos) {
        if (!this.onFlush) {
            this.error = -1048574 /* IOError.INVALID_OPERATION */;
            throw Error('IOWriter error, flush failed because of no flush callback');
        }
        if (this.pointer) {
            const ret = this.onFlush(this.buffer.subarray(0, this.pointer), pos);
            if (ret !== 0) {
                this.error = ret;
                throw Error('IOWriter error, flush failed');
            }
        }
        this.pointer = 0;
    }
    /**
     * seek 到指定位置
     *
     * @param pos
     */
    seek(pos) {
        if (!this.onSeek) {
            this.error = -1048574 /* IOError.INVALID_OPERATION */;
            throw Error('IOWriter error, seek failed because of no seek callback');
        }
        this.flush();
        const ret = this.onSeek(pos);
        if (ret !== 0) {
            this.error = ret;
            throw Error('IOWriter error, seek failed');
        }
        this.pos = pos;
    }
    /**
     * 在当前缓冲区映射区间内 seek
     *
     * @param pos
     */
    seekInline(pos) {
        const pointer = this.pointer;
        this.pointer = Math.max(0, Math.min(this.size, pos));
        this.pos += BigInt(this.pointer - pointer);
    }
    /**
     * 跳过指定长度
     *
     * @param length
     */
    skip(length) {
        const pointer = this.pointer;
        this.pointer = Math.min(this.size, this.pointer + length);
        this.pos += BigInt(this.pointer - pointer);
    }
    /**
     * 回退指定长度，不能大于 pointer 大小
     *
     * @param length
     */
    back(length) {
        const pointer = this.pointer;
        this.pointer = Math.max(0, this.pointer - length);
        this.pos += BigInt(this.pointer - pointer);
    }
    /**
     * 获取缓冲区
     *
     * @returns
     */
    getBuffer() {
        return this.buffer.subarray(0, this.pointer);
    }
    /**
     * 设置读取是小端还是大端
     *
     * @param bigEndian
     */
    setEndian(bigEndian) {
        this.littleEndian = !bigEndian;
    }
    /**
     * 重置 writer
     */
    reset() {
        this.pointer = 0;
        this.pos = BigInt(0);
        this.error = 0;
    }
    /**
     * 获取缓冲区长度
     *
     * @returns
     */
    getBufferSize() {
        return this.size;
    }
}

const cheap__fileName__0 = "src/common/src/io/BufferWriter.ts";
class BufferWriter {
    data;
    buffer;
    byteStart;
    pos;
    size;
    littleEndian;
    /**
     * @param data 待写的 Uint8Array
     * @param bigEndian 是否按大端字节序写，默认大端字节序（网络字节序）
     */
    constructor(data, bigEndian = true) {
        this.buffer = data;
        this.data = data instanceof Uint8Array ? new DataView(data.buffer) : data.view;
        this.byteStart = data instanceof Uint8Array ? data.byteOffset : 0;
        this.pos = 0;
        this.size = data.byteLength;
        this.littleEndian = !bigEndian;
    }
    /**
     * 写 8 位无符号整数
     */
    writeUint8(value) {
        this.data.setUint8(this.pos++ + this.byteStart, value);
    }
    /**
     * 读取 16 位无符号整数
     */
    writeUint16(value) {
        this.data.setUint16(this.pos + this.byteStart, value, this.littleEndian);
        this.pos += 2;
    }
    /**
     * 写 24 位无符号整数
     */
    writeUint24(value) {
        const high = value & 0xf00;
        const middle = value & 0x0f0;
        const low = value & 0x00f;
        if (this.littleEndian) {
            this.writeUint8(low);
            this.writeUint8(middle);
            this.writeUint8(high);
        }
        else {
            this.writeUint8(high);
            this.writeUint8(middle);
            this.writeUint8(low);
        }
    }
    /**
     * 写 32 位无符号整数
     */
    writeUint32(value) {
        this.data.setUint32(this.pos + this.byteStart, value, this.littleEndian);
        this.pos += 4;
    }
    /**
     * 写 64 位无符号整数
     */
    writeUint64(value) {
        this.data.setBigUint64(this.pos + this.byteStart, value, this.littleEndian);
        this.pos += 8;
    }
    /**
     * 写 8 位有符号整数
     *
     * @returns
     */
    writeInt8(value) {
        this.data.setInt8(this.pos++ + this.byteStart, value);
    }
    /**
     * 写 16 位有符号整数
     */
    writeInt16(value) {
        this.data.setInt16(this.pos + this.byteStart, value, this.littleEndian);
        this.pos += 2;
    }
    /**
     * 写 24 位有符号整数
     */
    writeInt24(value) {
        this.writeUint24(value < 0 ? (value + 0x1000000) : value);
    }
    /**
     * 写 32 位有符号整数
     */
    writeInt32(value) {
        this.data.setInt32(this.pos + this.byteStart, value, this.littleEndian);
        this.pos += 4;
    }
    /**
     * 写 64 位有符号整数
     */
    writeInt64(value) {
        this.data.setBigInt64(this.pos + this.byteStart, value, this.littleEndian);
        this.pos += 8;
    }
    /**
     * 写单精度浮点数
     *
     * @returns
     */
    writeFloat(value) {
        this.data.setFloat32(this.pos + this.byteStart, value, this.littleEndian);
        this.pos += 4;
    }
    /**
     * 写双精度浮点数
     */
    writeDouble(value) {
        this.data.setFloat64(this.pos + this.byteStart, value, this.littleEndian);
        this.pos += 8;
    }
    /**
     * 获取当前写指针
     *
     * @returns
     */
    getPos() {
        return this.pos;
    }
    /**
     * seek 写指针
     *
     * @param pos
     */
    seek(pos) {
        if (pos > this.size) {
            pos = this.size;
        }
        this.pos = Math.max(0, pos);
    }
    /**
     * 跳过指定字节长度
     *
     * @param length
     */
    skip(length) {
        this.seek(this.pos + length);
    }
    /**
     * 返回指定字节长度
     *
     * @param length
     */
    back(length) {
        this.seek(this.pos - length);
    }
    /**
     * 获取剩余可写节数
     *
     * @returns
     */
    remainingSize() {
        return this.size - this.pos;
    }
    /**
     * 写指定长度的二进制 buffer 数据
     *
     * @param length
     * @returns
     */
    writeBuffer(buffer) {
        let length = buffer.length;
        if (this.remainingSize() < length) {
            length = this.remainingSize();
            warn(`the remaining buffer size is smaller then the wrote buffer, hope set ${buffer.length}, but set ${length}`, cheap__fileName__0, 202);
        }
        this.buffer.set(buffer, this.pos);
        this.pos += buffer.length;
    }
    /**
     * 写一个字符串
     */
    writeString(str) {
        const buffer = encode(str);
        this.writeBuffer(buffer);
        return buffer.length;
    }
    /**
     * 获取已写的数据
     *
     * @returns
     */
    getWroteBuffer() {
        return this.buffer.subarray(0, this.pos);
    }
    /**
     * 重新装载数据
     *
     * @param data
     * @param bigEndian
     */
    resetBuffer(data, bigEndian = true) {
        this.buffer = data;
        this.data = data instanceof Uint8Array ? new DataView(data.buffer) : data.view;
        this.byteStart = data instanceof Uint8Array ? data.byteOffset : 0;
        this.pos = 0;
        this.size = data.byteLength;
        this.littleEndian = !bigEndian;
    }
}

let command = {};
program
    .version('1.0.0')
    .description('cheap wasm optimize tool')
    .option('-i, --input <wasm file>', 'input wasm file path')
    .option('-o, --output <wasm file>', 'output wasm file path')
    .option('-b, --bss', 'enable bss optimize')
    .action((options) => {
    command = options;
    if (command.i && command.o) {
        optimize();
    }
});
program.parse(process.argv);
function createReader() {
    const fid = fs.openSync(command.i, 'r');
    const stats = fs.statSync(command.i);
    let readPos = 0;
    const readFileLength = stats.size;
    const ioReader = new IOReaderSync();
    ioReader.onFlush = (buffer) => {
        if (readPos >= readFileLength) {
            return -1048576 /* IOError.END */;
        }
        const len = Math.min(buffer.length, readFileLength - readPos);
        fs.readSync(fid, buffer, 0, len, readPos);
        readPos += len;
        return len;
    };
    ioReader.onSeek = (pos) => {
        readPos = Number(pos);
        return 0;
    };
    ioReader.onSize = () => {
        return BigInt(stats.size);
    };
    // @ts-ignore
    ioReader.fid = fid;
    return ioReader;
}
function analyze() {
    const options = {
        dataSize: 0,
        dataAlign: 4,
        tableSize: 0,
        tableAlign: 0,
        dataPrefixSize: 0,
        data: null
    };
    const ioReader = createReader();
    try {
        ioReader.readUint32();
        ioReader.readUint32();
        while (true) {
            const sectionId = ioReader.readUint8();
            const size = wasm.readUleb128(ioReader);
            const now = ioReader.getPos();
            if (sectionId === 11 /* wasm.SectionId.Data */) {
                const now = ioReader.getPos();
                const count = wasm.readUleb128(ioReader);
                if (count === 1) {
                    wasm.readUleb128(ioReader);
                    while (true) {
                        const byte = ioReader.readUint8();
                        if (byte === 0x0b) {
                            break;
                        }
                    }
                    options.dataPrefixSize = Number(ioReader.getPos() - now);
                    options.dataSize = wasm.readUleb128(ioReader);
                    options.data = ioReader.readBuffer(options.dataSize);
                }
            }
            else if (sectionId === 2 /* wasm.SectionId.Import */) {
                let count = wasm.readUleb128(ioReader);
                let counter = 0;
                while (count--) {
                    const moduleLen = wasm.readUleb128(ioReader);
                    ioReader.readBuffer(moduleLen);
                    const fieldLen = wasm.readUleb128(ioReader);
                    ioReader.readBuffer(fieldLen);
                    const externalKind = ioReader.readUint8();
                    switch (externalKind) {
                        case 0 /* wasm.ExternalKind.Function */: {
                            wasm.readUleb128(ioReader);
                            break;
                        }
                        case 3 /* wasm.ExternalKind.Global */: {
                            wasm.readSleb128(ioReader);
                            wasm.readUleb128(ioReader);
                            break;
                        }
                        case 2 /* wasm.ExternalKind.Memory */: {
                            let flags = wasm.readUleb128(ioReader);
                            wasm.readUleb128(ioReader);
                            if (flags & 0x01) {
                                wasm.readUleb128(ioReader);
                            }
                            counter++;
                            break;
                        }
                        case 1 /* wasm.ExternalKind.Table */: {
                            wasm.readSleb128(ioReader);
                            const flags = wasm.readUleb128(ioReader);
                            const initial = wasm.readUleb128(ioReader);
                            options.tableSize = initial;
                            if (flags & 0x01) {
                                wasm.readUleb128(ioReader);
                            }
                            counter++;
                            break;
                        }
                    }
                    if (counter === 2) {
                        break;
                    }
                }
            }
            else if (sectionId === 0 /* wasm.SectionId.Custom */) {
                const nameLen = wasm.readUleb128(ioReader);
                const name = ioReader.readString(nameLen);
                if (name === 'dylink.0') {
                    wasm.readUleb128(ioReader);
                    options.dataAlign = wasm.readUleb128(ioReader);
                    wasm.readUleb128(ioReader);
                    options.tableAlign = wasm.readUleb128(ioReader);
                }
            }
            const remainingLength = size - Number(ioReader.getPos() - now);
            if (remainingLength) {
                ioReader.skip(remainingLength);
            }
        }
    }
    catch (e) {
        if (ioReader.error === -1048576 /* IOError.END */) {
            return options;
        }
        else {
            throw e;
        }
    }
}
function analyzeBss(data) {
    if (!data) {
        return {
            data: null,
            bssSize: 0
        };
    }
    let i = data.length - 1;
    for (; i >= 0; i--) {
        if (data[i] !== 0) {
            break;
        }
    }
    if (i === 0) {
        return {
            data: data.subarray(0, 1),
            bssSize: data.length - 1
        };
    }
    return {
        data: data.subarray(0, i + 1),
        bssSize: data.length - i - 1
    };
}
function uleb128Len(value) {
    let len = 0;
    do {
        value >>= 7;
        len++;
    } while (value !== 0);
    return len;
}
function optimize() {
    const options = analyze();
    const bss = analyzeBss(options.data);
    const ioReader = createReader();
    const ioWriter = new IOWriterSync();
    const buffers = [];
    ioWriter.onFlush = (buffer) => {
        buffers.push(buffer.slice());
        return 0;
    };
    ioWriter.writeUint32(ioReader.readUint32());
    ioWriter.writeUint32(ioReader.readUint32());
    if (options.dataSize || options.tableSize) {
        let bufferWriter = new BufferWriter(new Uint8Array(30));
        wasm.writeUleb128(bufferWriter, options.dataSize);
        wasm.writeUleb128(bufferWriter, options.dataAlign);
        wasm.writeUleb128(bufferWriter, options.tableSize);
        wasm.writeUleb128(bufferWriter, options.tableAlign);
        const content = bufferWriter.getWroteBuffer();
        bufferWriter = new BufferWriter(new Uint8Array(30));
        wasm.writeUleb128(bufferWriter, 8);
        bufferWriter.writeString('dylink.0');
        bufferWriter.writeUint8(1 /* wasm.DYlinkType.MEMORY */);
        wasm.writeUleb128(bufferWriter, content.length);
        bufferWriter.writeBuffer(content);
        ioWriter.writeUint8(0 /* wasm.SectionId.Custom */);
        wasm.writeUleb128(ioWriter, bufferWriter.getWroteBuffer().length);
        ioWriter.writeBuffer(bufferWriter.getWroteBuffer());
    }
    try {
        while (true) {
            const sectionId = ioReader.readUint8();
            const size = wasm.readUleb128(ioReader);
            const now = ioReader.getPos();
            if (sectionId === 11 /* wasm.SectionId.Data */ && options.dataSize && command.bss) {
                ioWriter.writeUint8(sectionId);
                wasm.writeUleb128(ioWriter, options.dataPrefixSize + uleb128Len(bss.data.length) + bss.data.length);
                wasm.writeUleb128(ioWriter, wasm.readUleb128(ioReader));
                wasm.writeUleb128(ioWriter, wasm.readUleb128(ioReader));
                while (true) {
                    const byte = ioReader.readUint8();
                    ioWriter.writeUint8(byte);
                    if (byte === 0x0b) {
                        break;
                    }
                }
                const dataSize = wasm.readUleb128(ioReader);
                ioReader.skip(dataSize);
                wasm.writeUleb128(ioWriter, bss.data.length);
                ioWriter.writeBuffer(bss.data);
            }
            else if (sectionId === 0 /* wasm.SectionId.Custom */ && options.dataSize && command.bss) {
                const nameLen = wasm.readUleb128(ioReader);
                const name = ioReader.readString(nameLen);
                if (name === 'dylink.0') {
                    ioReader.skip(size - Number(ioReader.getPos() - now));
                    continue;
                }
                ioWriter.writeUint8(sectionId);
                wasm.writeUleb128(ioWriter, size);
                wasm.writeUleb128(ioWriter, nameLen);
                ioWriter.writeString(name);
            }
            else {
                ioWriter.writeUint8(sectionId);
                wasm.writeUleb128(ioWriter, size);
            }
            const remainingLength = size - Number(ioReader.getPos() - now);
            if (remainingLength) {
                ioReader.pipe(ioWriter, size - Number(ioReader.getPos() - now));
            }
        }
    }
    catch (e) {
        if (ioReader.error === -1048576 /* IOError.END */) {
            ioWriter.flush();
            // @ts-ignore
            fs.closeSync(ioReader.fid);
            fs.writeFileSync(command.o, Buffer.concat(buffers));
        }
        else {
            throw e;
        }
    }
}
//# sourceMappingURL=wasm-opt.mjs.map
