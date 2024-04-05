import ts from 'typescript'
import statement from '../statement'

export default function reportError(file: ts.SourceFile, node: ts.Node, message: string, code: number = 9000) {
  const format = ts.formatDiagnostic(
    {
      file: file,
      start: node.pos > -1 ? node.getStart() : 0,
      length: node.pos > -1 ? (node.end - node.getStart()) : 0,
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
    const start = file.getLineAndCharacterOfPosition(node.getStart())
    const end = file.getLineAndCharacterOfPosition(node.getEnd())
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
