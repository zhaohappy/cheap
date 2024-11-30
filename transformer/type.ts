import * as ts from 'typescript'


export interface ImportData {
  name: string
  path: string
  default: boolean
  formatName: string
}

export interface RequireData {
  formatName: string
  path: string
  default: boolean
  defaultName?: string
  esModule?: boolean
}

export interface DeclarationData {
  name: string
  formatName: string
  initializer?: ts.Expression
}

export interface TransformerOptions {
  tmpPath?: string
  projectPath?: string
  formatIdentifier?: boolean
  exclude?: RegExp | RegExp[]
  defined?: Record<string, any>
  cheapPacketName?: string
  importPath?: (path: string) => string
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
  }) => void,
  wat2wasm?: string
}
