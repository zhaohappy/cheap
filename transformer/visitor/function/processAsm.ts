
import { execSync } from 'child_process'
import statement from '../../statement'
import ts from 'typescript'
import reportError from '../../function/reportError'
import * as array from 'common/util/array'
import * as errorType from '../../error'
import * as fs from 'fs'

const input = '__cheap__transformer_tmp.wat'
const output = '__cheap__transformer_tmp.wasm'


export default function processAsm(template: ts.TemplateExpression | ts.NoSubstitutionTemplateLiteral, node: ts.TaggedTemplateExpression) {

  let text = ''
  let startPos = node.template.getStart()

  if (ts.isNoSubstitutionTemplateLiteral(template)) {
    text = template.text
  }
  else {
    if (template.head) {
      text += template.head.text
    }

    for (let i = 0; i < template.templateSpans.length; i++) {
      const span = template.templateSpans[i]
      if (ts.isStringLiteral(span.expression)
        || ts.isNumericLiteral(span.expression)
      ) {
        text += span.expression.text
        text += span.literal.text
      }
      else {
        reportError(statement.currentFile, span.expression, `expression ${span.expression.getText()} not support in asm`)
        return statement.context.factory.createStringLiteral('compile asm error')
      }
    }
  }

  const distPath = `${statement.options.tmpPath ? `${statement.options.tmpPath}/` : ''}`

  if (distPath && !ts.sys.directoryExists(distPath)) {
    ts.sys.createDirectory(distPath)
  }

  const inputPath = `${distPath}${input}`
  const outputPath = `${distPath}${output}`

  const cmd = `${statement.options.wat2wasm} ${inputPath} --enable-simd --enable-threads -o ${outputPath}`

  const source = `
    (module
      (import "env" "memory" (memory 1 65536 shared))
      ${text}
    )
  `

  ts.sys.writeFile(inputPath, source)

  try {
    execSync(cmd, {
      stdio: 'pipe'
    })
    const buffer = fs.readFileSync(outputPath)
    return statement.context.factory.createStringLiteral(buffer.toString('base64'))
  }
  catch (error) {
    let messages: string[] = error.message.split('\n')
    messages.shift()

    let errorMessage = ''
    let line = 0

    function getPos(line: number) {
      let pos = 0

      while (line && pos < text.length) {
        if (text[pos++] === '\n') {
          line--
        }
      }

      while (pos < text.length) {
        if (!/\s/.test(text[pos])) {
          break
        }
        pos++
      }

      const start = startPos + pos

      while (pos < text.length) {
        if (text[pos] === '\n') {
          break
        }
        pos++
      }
      const end = startPos + pos

      return {
        start, end
      }
    }

    array.each(messages, (message) => {
      const match = message.match(/__cheap__transformer_tmp.wat:(\d+)/)
      if (match) {
        if (errorMessage) {
          const { start, end } = getPos(line)
          reportError(statement.currentFile, node, errorMessage, errorType.SYNTAX_ERROR, start, end)
        }
        errorMessage = `${message.split('error: ').pop()}`
        line = +match[1] - 3
      }
      else if (message) {
        errorMessage += `\n${message}`
      }
    })

    if (errorMessage) {
      const { start, end } = getPos(line)
      reportError(statement.currentFile, node, errorMessage, errorType.SYNTAX_ERROR, start, end)
    }

    return statement.context.factory.createStringLiteral('compile asm error')
  }
}
