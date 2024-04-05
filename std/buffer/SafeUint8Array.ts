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
import { getHeapU8, getView } from '../../heap'
import ArrayLikeInterface from 'common/interface/ArrayLike'

export class SafeBufferView {
  private pointer: pointer<uint8>

  private len: size

  constructor(pointer: pointer<uint8>, len: size) {
    this.pointer = pointer
    this.len = len
  }

  get byteLength() {
    return this.len
  }

  get buffer() {
    return getHeapU8().buffer
  }

  get byteOffset() {
    return this.pointer
  }

  public getFloat32(byteOffset: number, littleEndian?: boolean): number {
    return getView().getFloat32(this.pointer + byteOffset, littleEndian)
  }

  public getFloat64(byteOffset: number, littleEndian?: boolean): number {
    return getView().getFloat64(this.pointer + byteOffset, littleEndian)
  }

  public getInt8(byteOffset: number): number {
    return getView().getInt8(this.pointer + byteOffset)
  }

  public getInt16(byteOffset: number, littleEndian?: boolean): number {
    return getView().getInt16(this.pointer + byteOffset, littleEndian)
  }

  public getInt32(byteOffset: number, littleEndian?: boolean): number {
    return getView().getInt32(this.pointer + byteOffset, littleEndian)
  }

  public getUint8(byteOffset: number): number {
    return getView().getUint8(this.pointer + byteOffset)
  }

  public getUint16(byteOffset: number, littleEndian?: boolean): number {
    return getView().getUint16(this.pointer + byteOffset, littleEndian)
  }

  public getUint32(byteOffset: number, littleEndian?: boolean): number {
    return getView().getUint32(this.pointer + byteOffset, littleEndian)
  }

  public setFloat32(byteOffset: number, value: number, littleEndian?: boolean): void {
    getView().setFloat32(this.pointer + byteOffset, value, littleEndian)
  }

  public setFloat64(byteOffset: number, value: number, littleEndian?: boolean): void {
    getView().setFloat64(this.pointer + byteOffset, value, littleEndian)
  }

  public setInt8(byteOffset: number, value: number): void {
    getView().setInt8(this.pointer + byteOffset, value)
  }

  public setInt16(byteOffset: number, value: number, littleEndian?: boolean): void {
    getView().setInt16(this.pointer + byteOffset, value, littleEndian)
  }

  public setInt32(byteOffset: number, value: number, littleEndian?: boolean): void {
    getView().setInt32(this.pointer + byteOffset, value, littleEndian)
  }

  public setUint8(byteOffset: number, value: number): void {
    getView().setUint8(this.pointer + byteOffset, value)
  }

  public setUint16(byteOffset: number, value: number, littleEndian?: boolean): void {
    getView().setUint16(this.pointer + byteOffset, value, littleEndian)
  }

  public setUint32(byteOffset: number, value: number, littleEndian?: boolean): void {
    getView().setUint32(this.pointer + byteOffset, value, littleEndian)
  }

  public getBigInt64(byteOffset: number, littleEndian?: boolean): bigint {
    return getView().getBigInt64(this.pointer + byteOffset, littleEndian)
  }
  public getBigUint64(byteOffset: number, littleEndian?: boolean): bigint {
    return getView().getBigUint64(this.pointer + byteOffset, littleEndian)
  }
  public setBigInt64(byteOffset: number, value: bigint, littleEndian?: boolean) {
    getView().setBigInt64(this.pointer + byteOffset, value, littleEndian)
  }
  public setBigUint64(byteOffset: number, value: bigint, littleEndian?: boolean) {
    getView().setBigUint64(this.pointer + byteOffset, value, littleEndian)
  }
}

export default class SafeUint8Array extends ArrayLikeInterface implements Uint8ArrayInterface {

  private pointer: pointer<uint8>

  private len: size

  constructor(pointer: pointer<uint8>, len: size) {
    super()
    this.pointer = pointer
    this.len = len

    return this.proxy as SafeUint8Array
  }

  protected getIndexValue(index: uint32): uint8 {
    return accessof(reinterpret_cast<pointer<uint8>>(this.pointer + index))
  }
  protected setIndexValue(index: uint32, value: uint8): void {
    accessof(reinterpret_cast<pointer<uint8>>(this.pointer + index)) <- value
  }

  public set(array: ArrayLike<number>, offset: number = 0) {
    assert(offset + array.length <= this.len)
    getHeapU8().set(array, this.pointer + offset)
  }

  public subarray(begin: number = 0, end?: number, safe?: boolean) {
    if (safe) {
      return new SafeUint8Array(reinterpret_cast<pointer<uint8>>(this.pointer + begin), (end ? end : this.len) - begin) as any as Uint8Array
    }
    return getHeapU8().subarray(this.pointer + begin, this.pointer + (end ?? this.len))
  }

  public slice(start: number = 0, end?: number) {
    return getHeapU8().slice(this.pointer + start, this.pointer + (end ?? this.len))
  }

  get length() {
    return this.len
  }

  get byteLength() {
    return this.len
  }

  get buffer() {
    return getHeapU8().buffer
  }

  get byteOffset() {
    return this.pointer
  }

  get view() {
    return new SafeBufferView(this.pointer, this.len) as any as DataView
  }

  [n: int32]: uint8
}
