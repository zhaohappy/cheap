import { dirname as pathDirname } from 'path'
import { fileURLToPath } from 'url'

export default function getDirname(meta: string) {
  if (typeof __dirname !== 'undefined') {
    // CJS 环境
    return __dirname
  }
  return pathDirname(fileURLToPath(meta))
}
