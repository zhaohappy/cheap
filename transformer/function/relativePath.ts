import path from 'path'

export default function relativePath(a: string, b: string) {
  const p = path.relative(path.dirname(a), b)
  if (/\.\.\//.test(p)) {
    return p
  }
  return './' + p
}
