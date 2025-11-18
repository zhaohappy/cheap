import { defineConfig } from 'rollup'
import resolve from '@rollup/plugin-node-resolve'
import typescript from '@rollup/plugin-typescript'
import ts from 'typescript'

let input = ''
let output = ''
let name = ''

if (process.env.transformer) {
  input = 'src/transformer/index.ts'
  output = 'build'
  name = 'transformer'
}
else if (process.env.wasm_opt) {
  input = 'src/webassembly/wasm-opt.ts'
  output = 'build'
  name = 'wasm-opt'
}

function deDefined() {
  return (context) => {
    return (sourceFile) => {
      function visitor(node) {
        if (ts.isCallExpression(node)
          && ts.isIdentifier(node.expression)
          && node.expression.escapedText === 'defined'
        ) {
          return context.factory.createNumericLiteral(0)
        }
        return ts.visitEachChild(node, visitor, context)
      }
      return ts.visitNode(sourceFile, visitor)
    }
  }
}

export default defineConfig({
  input,
  external: ['typescript', 'path', 'commander', 'child_process', 'fs', 'os', 'url', '@libmedia/common'],
  output: [
    {
      dir: output,
      format: 'cjs',
      exports: 'auto',
      sourcemap: true,
      entryFileNames: name + '.cjs'
    },
    {
      dir: output,
      format: 'es',
      sourcemap: true,
      entryFileNames: name + '.mjs'
    }
  ],
  plugins: [
    resolve(),
    typescript({
      tsconfig: './tsconfig.build.json',
      noCheck: true,
      transformers: {
        before: [
          {
            type: 'program',
            factory: (program) => {
              return deDefined()
            }
          }
        ]
      }
    })
  ],
  treeshake: true
})
