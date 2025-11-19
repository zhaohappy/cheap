import ts from 'typescript'

export interface TransformerOptions {
  /**
   * 临时文件创建目录
   */
  tmpPath?: string
  /**
   * 项目根目录
   */
  projectPath?: string
  /**
   * 如果 cheap 使用的源码依赖，传 cheap 根路径
   */
  cheapSourcePath?: string
  /**
   * 指定 cheap 包名
   */
  cheapPacketName?: string
  /**
   * 输出的模块类型
   */
  module?: 'module' | 'commonjs'
  /**
   * 排除文件
   */
  exclude?: RegExp | RegExp[]
  /**
   * 宏定义
   */
  defined?: Record<string, any>
  /**
   * 自定义 report error
   * 
   * @param error 
   * @returns 
   */
  importPath?: (p: string) => void
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
  /**
   * wat2wasm 路径
   */
  wat2wasm?: string
}

export declare function before(program: ts.Program): ts.TransformerFactory<ts.SourceFile>
export declare function before(program: ts.Program, getProgram: () => ts.Program): ts.TransformerFactory<ts.SourceFile>
export declare function before(program: ts.Program, options: TransformerOptions): ts.TransformerFactory<ts.SourceFile>
export declare function before(program: ts.Program, options: TransformerOptions, getProgram: () => ts.Program): ts.TransformerFactory<ts.SourceFile>

export declare function after(program: ts.Program): ts.TransformerFactory<ts.SourceFile>
export declare function after(program: ts.Program, getProgram: () => ts.Program): ts.TransformerFactory<ts.SourceFile>
export declare function after(program: ts.Program, options: TransformerOptions): ts.TransformerFactory<ts.SourceFile>
export declare function after(program: ts.Program, options: TransformerOptions, getProgram: () => ts.Program): ts.TransformerFactory<ts.SourceFile>

export declare function afterDeclarations(program: ts.Program): ts.TransformerFactory<ts.SourceFile>
export declare function afterDeclarations(program: ts.Program, getProgram: () => ts.Program): ts.TransformerFactory<ts.SourceFile>
export declare function afterDeclarations(program: ts.Program, options: TransformerOptions): ts.TransformerFactory<ts.SourceFile>
export declare function afterDeclarations(program: ts.Program, options: TransformerOptions, getProgram: () => ts.Program): ts.TransformerFactory<ts.SourceFile>
