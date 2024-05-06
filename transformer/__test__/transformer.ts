import ts from 'typescript'
import transformerFactory from '../index'
import * as path from 'path'
import * as fs from 'fs'
import compare from './compare'
import os from 'os'

export const projectPath = __dirname
export const distPath = path.join(__dirname, './__test__cache')
const cheapdef = path.join(__dirname, '../../cheapdef.ts')

if (!fs.existsSync(distPath)) {
  fs.mkdirSync(distPath, { recursive: true })
}

// TypeScript 编译选项
const compilerOptions: ts.CompilerOptions = {
  target: ts.ScriptTarget.ESNext,
  module: ts.ModuleKind.CommonJS,
  outDir: distPath
}

// 创建 TypeScript 编译器实例
const compilerHost = ts.createCompilerHost(compilerOptions)
const printer = ts.createPrinter()

function generateAST(source: string) {
  const sourceFile = ts.createSourceFile('temp.ts', source, ts.ScriptTarget.Latest)
  return sourceFile
}

function transform2AST(source: string, options: {
  input: string
  output?: string
  defined?: Record<string, any>
}) {
  fs.writeFileSync(options.input, source)
  const program = ts.createProgram([cheapdef, options.input], compilerOptions, compilerHost)

  let wat2wasmPath = path.resolve(__dirname, '../../build/asm/ubuntu') + '/wat2wasm'
  if (os.platform() === 'win32') {
    wat2wasmPath = path.resolve(__dirname, '../../build/asm/win') + '/wat2wasm.exe'
  }
  else if (os.platform() === 'darwin') {
    wat2wasmPath = path.resolve(__dirname, '../../build/asm/macos') + '/wat2wasm'
  }

  const transformer = transformerFactory(program, {
    projectPath: projectPath,
    formatIdentifier: false,
    defined: options.defined,
    tmpPath: distPath,
    wat2wasm: wat2wasmPath
  })
  const transformed = ts.transform(program.getSourceFile(options.input), [transformer], compilerOptions)

  if (options.output) {
    fs.writeFileSync(options.output, printer.printFile(transformed.transformed[0]))
  }

  return transformed.transformed[0]
}

export function check(source: string, target: string, options: {
  input: string
  output?: string
  defined?: Record<string, any>
}) {
  expect(compare(generateAST(target), transform2AST(source, options))).toBe(true)
}
