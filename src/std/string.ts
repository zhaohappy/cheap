import { mapUint8Array, memcpyFromUint8Array } from './memory'
import { CTypeEnum } from '../typedef'
import { CTypeEnumRead } from '../ctypeEnumRead'

/**
 * 获取字符串长度，不包括字符串末尾的空字符（\0）
 * 
 * @param pointer 
 */
export function strlen(pointer: pointer<char>) {
  let len = 0
  while (CTypeEnumRead[CTypeEnum.char](pointer++)) {
    len++
  }
  return len
}

/**
 * 将一个字符串复制到另一个字符串
 * 
 * @param destination 
 * @param source 
 */
export function strcpy(destination: pointer<char>, source: pointer<char>) {
  const len = strlen(source) + 1
  memcpyFromUint8Array(destination, len, mapUint8Array(source, len))
}

/**
 * 将一个字符串追加到另一个字符串的末尾
 * 
 * @param destination 
 * @param source 
 */
export function strcat(destination: pointer<char>, source: pointer<char>) {
  const len = strlen(source) + 1
  const len1 = strlen(destination)
  memcpyFromUint8Array(destination + len1, len, mapUint8Array(source, len))
}

/**
 * 比较两个字符串的大小
 */
export function strcmp(str1: pointer<char>, str2: pointer<char>) {
  const len1 = strlen(str1)
  const len2 = strlen(str2)

  const len = Math.min(len1, len2)

  for (let i = 0; i < len; i++) {
    const char1 = CTypeEnumRead[CTypeEnum.char](str1 + i)
    const char2 = CTypeEnumRead[CTypeEnum.char](str2 + i)

    if (char1 > char2) {
      return 1
    }
    else if (char1 < char2) {
      return -1
    }
  }

  if (len1 > len2) {
    return 1
  }
  else if (len1 < len2) {
    return -1
  }
  else {
    return 0
  }
}
