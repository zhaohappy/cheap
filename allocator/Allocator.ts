
export default interface Allocator {

  addUpdateHandle(handle: (buffer: ArrayBuffer) => void): void
  removeUpdateHandle(handle: (buffer: ArrayBuffer) => void): void

  /**
   * 分配一个长度是 size 的一段内存
   * 
   * @param size 
   */
  malloc(size: size): pointer<void>

  /**
   * 分配一块指定数量的内存，并将其初始化为零
   * 
   * @param num 要分配的元素数量
   * @param size 每个元素的大小（以字节为单位）
   */
  calloc(num: size, size: size): pointer<void>

  /**
   * 重新调整已分配内存块的大小
   * 
   * @param address 已分配内存块的指针
   * @param size 调整的内存块的新大小（以字节为单位）
   */
  realloc(address: pointer<void>, size: size): pointer<void>

  /**
   * 堆上分配一块对齐的内存块
   * 
   * @param alignment 内存对齐的要求
   * @param size 分配的内存块的大小（以字节为单位）
   */
  alignedAlloc(alignment: size, size: size): pointer<void>

  /**
   * 释放指定地址的内存
   * 
   * @param address 
   */
  free(address: pointer<void>): void

  /**
   * 判断给定地址是否已经被分配
   * 
   * @param pointer 
   */
  isAlloc(pointer: pointer<void>): boolean

  /**
   * 给出指定地址分配的内存大小
   * 
   * @param address 
   */
  sizeof(address: int32): size

  getBuffer(): ArrayBuffer
}
