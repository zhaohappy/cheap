import path from 'path'

export default function relativePath(a: string, b: string) {
  let p = path.relative(path.dirname(a), b)

  // 去掉 d.ts .ts .js 后缀
  p = p.replace(/(\.d)?\.[t|j]s$/, '')

  if (path.isAbsolute(p)) {
    return p
  }
  else if (/\.\.\//.test(p)) {
    return p
  }
  return './' + p
}
