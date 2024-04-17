import ts from 'typescript'
import statement from '../statement'

export default function reportError(
  file: ts.SourceFile,
  node: ts.Node,
  message: string,
  code: number = 9000,
  startPos: number = 0,
  endPos: number = 0
) {

  if (!startPos && node.pos > -1) {
    startPos = node.getStart()
  }
  if (!endPos && node.end > -1) {
    endPos = node.getEnd()
  }

  const format = ts.formatDiagnostic(
    {
      file: file,
      start: startPos,
      length: endPos - startPos,
      category: ts.DiagnosticCategory.Error,
      code,
      messageText: message
    },
    {
      getCurrentDirectory: ts.sys.getCurrentDirectory,
      getCanonicalFileName: function (fileName: string): string {
        return fileName
      },
      getNewLine: function (): string {
        return ts.sys.newLine
      }
    }
  )
  if (statement.options.reportError) {
    const start = file.getLineAndCharacterOfPosition(startPos)
    const end = file.getLineAndCharacterOfPosition(endPos)
    statement.options.reportError({
      file: file.fileName,
      loc: {
        start: {
          line: start.line + 1,
          column: start.character + 1
        },
        end: {
          line: end.line + 1,
          column: end.character + 1
        }
      },
      code,
      message: format
    })
  }
  else {
    console.error(format)
  }
}
