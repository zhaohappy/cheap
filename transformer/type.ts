import * as ts from 'typescript'


export interface ImportData {
  name: string
  path: string
  default: boolean
  formatName: string
}

export interface DeclarationData {
  name: string
  formatName: string
  initializer?: ts.Expression
}

export interface TransformerOptions {
  projectPath?: string
  formatIdentifier?: boolean
  exclude?: RegExp
  defined?: Record<string, any>
  reportError?: (error: {
    file: string,
    loc: {
      start: {
        line: number
        column: number
      }
      end: {
        line: number
        column: number
      }
    }
    code: number,
    message: string
  }) => void
}
