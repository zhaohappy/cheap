import ts from 'typescript'

export default function getFilePath(program: ts.Program, current: string, target: string) {
  const path = ts.resolveModuleName(
    target,
    current,
    program.getCompilerOptions(),
    ts.sys
  )
  return path.resolvedModule?.resolvedFileName
}
