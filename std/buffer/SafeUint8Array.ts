/*
 * libmedia SafeUint8Array
 *
 * 版权所有 (C) 2024 赵高兴
 * Copyright (C) 2024 Gaoxing Zhao
 *
 * 此文件是 libmedia 的一部分
 * This file is part of libmedia.
 * 
 * libmedia 是自由软件；您可以根据 GNU Lesser General Public License（GNU LGPL）3.1
 * 或任何其更新的版本条款重新分发或修改它
 * libmedia is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Lesser General Public
 * License as published by the Free Software Foundation; either
 * version 3.1 of the License, or (at your option) any later version.
 * 
 * libmedia 希望能够为您提供帮助，但不提供任何明示或暗示的担保，包括但不限于适销性或特定用途的保证
 * 您应自行承担使用 libmedia 的风险，并且需要遵守 GNU Lesser General Public License 中的条款和条件。
 * libmedia is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Lesser General Public License for more details.
 *
 */

import { Uint8ArrayInterface } from 'common/io/interface'
import { getHeap, Memory } from '../../heap'
import ArrayLikeInterface from 'common/interface/ArrayLike'

export class SafeBufferView {
  private pointer: pointer<void>

  private len: size

  private view: DataView

  constructor(pointer: pointer<uint8>, len: size) {
    this.pointer = pointer
    this.len = len

    if (defined(WASM_64)) {
      assert(typeof pointer === 'bigint')
    }
  }

  get byteLength() {
    return reinterpret_cast<double>(this.len) as number
  }

  get buffer() {
    return getHeap
  }

  get byteOffset() {
    return defined(WASM_64) ? Number(this.pointer) : this.pointer
  }

  private getView() {
    if (!this.view || this.view.buffer !== Memory.buffer) {
      this.view = new DataView(getHeap(), defined(WASM_64) ? Number(this.pointer) : this.pointer, reinterpret_cast<double>(this.len))
    }
    return this.view
  }

  public getFloat32(byteOffset: number, littleEndian?: boolean): number {
    return this.getView().getFloat32(byteOffset, littleEndian)
  }

  public getFloat64(byteOffset: number, littleEndian?: boolean): number {
    return this.getView().getFloat64(byteOffset, littleEndian)
  }

  public getInt8(byteOffset: number): number {
    return this.getView().getInt8(byteOffset)
  }

  public getInt16(byteOffset: number, littleEndian?: boolean): number {
    return this.getView().getInt16(byteOffset, littleEndian)
  }

  public getInt32(byteOffset: number, littleEndian?: boolean): number {
    return this.getView().getInt32(byteOffset, littleEndian)
  }

  public getUint8(byteOffset: number): number {
    return this.getView().getUint8(byteOffset)
  }

  public getUint16(byteOffset: number, littleEndian?: boolean): number {
    return this.getView().getUint16(byteOffset, littleEndian)
  }

  public getUint32(byteOffset: number, littleEndian?: boolean): number {
    return this.getView().getUint32(byteOffset, littleEndian)
  }

  public setFloat32(byteOffset: number, value: number, littleEndian?: boolean): void {
    this.getView().setFloat32(byteOffset, value, littleEndian)
  }

  public setFloat64(byteOffset: number, value: number, littleEndian?: boolean): void {
    this.getView().setFloat64(byteOffset, value, littleEndian)
  }

  public setInt8(byteOffset: number, value: number): void {
    this.getView().setInt8(byteOffset, value)
  }

  public setInt16(byteOffset: number, value: number, littleEndian?: boolean): void {
    this.getView().setInt16(byteOffset, value, littleEndian)
  }

  public setInt32(byteOffset: number, value: number, littleEndian?: boolean): void {
    this.getView().setInt32(byteOffset, value, littleEndian)
  }

  public setUint8(byteOffset: number, value: number): void {
    this.getView().setUint8(byteOffset, value)
  }

  public setUint16(byteOffset: number, value: number, littleEndian?: boolean): void {
    this.getView().setUint16(byteOffset, value, littleEndian)
  }

  public setUint32(byteOffset: number, value: number, littleEndian?: boolean): void {
    this.getView().setUint32(byteOffset, value, littleEndian)
  }

  public getBigInt64(byteOffset: number, littleEndian?: boolean): bigint {
    return this.getView().getBigInt64(byteOffset, littleEndian)
  }
  public getBigUint64(byteOffset: number, littleEndian?: boolean): bigint {
    return this.getView().getBigUint64(byteOffset, littleEndian)
  }
  public setBigInt64(byteOffset: number, value: bigint, littleEndian?: boolean) {
    this.getView().setBigInt64(byteOffset, value, littleEndian)
  }
  public setBigUint64(byteOffset: number, value: bigint, littleEndian?: boolean) {
    this.getView().setBigUint64(byteOffset, value, littleEndian)
  }
}

export default class SafeUint8Array extends ArrayLikeInterface implements Uint8ArrayInterface {

  private pointer: pointer<uint8>

  private len: size

  constructor(pointer: pointer<uint8>, len: size) {
    super()
    this.pointer = pointer
    this.len = len

    if (defined(WASM_64)) {
      assert(typeof pointer === 'bigint')
    }

    return this.proxy as SafeUint8Array
  }

  protected getIndexValue(index: uint32): uint8 {
    return accessof(reinterpret_cast<pointer<uint8>>(this.pointer + index))
  }
  protected setIndexValue(index: uint32, value: uint8): void {
    accessof(reinterpret_cast<pointer<uint8>>(this.pointer + index)) <- value
  }

  public set(array: ArrayLike<number>, offset: uint32 = 0) {
    assert(offset + array.length <= reinterpret_cast<int32>(this.len))
    new Uint8Array(getHeap(), defined(WASM_64) ? Number(this.pointer) : this.pointer, reinterpret_cast<double>(this.len)).set(array, offset)
  }

  public subarray(begin: uint32 = 0, end?: uint32, safe?: boolean) {
    if (safe) {
      return new SafeUint8Array(reinterpret_cast<pointer<uint8>>(this.pointer + begin), (end ? end : reinterpret_cast<double>(this.len)) - begin) as any as Uint8Array
    }
    return new Uint8Array(getHeap(), defined(WASM_64) ? Number(this.pointer + begin) : (this.pointer + begin), (end ?? reinterpret_cast<double>(this.len)) - begin)
  }

  public slice(start: uint32 = 0, end?: uint32) {
    return new Uint8Array(getHeap(), defined(WASM_64) ? Number(this.pointer + start) : (this.pointer + start), (end ?? reinterpret_cast<double>(this.len)) - start).slice()
  }

  get length() {
    return reinterpret_cast<double>(this.len) as number
  }

  get byteLength() {
    return reinterpret_cast<double>(this.len) as number
  }

  get buffer() {
    return getHeap()
  }

  get byteOffset() {
    return defined(WASM_64) ? Number(this.pointer) : this.pointer
  }

  get view() {
    return new SafeBufferView(this.pointer, this.len) as any as DataView
  }

  [n: int32]: uint8
}
