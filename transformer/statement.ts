
import ts from 'typescript'
import path from 'path'
import * as array from 'common/util/array'
import parseImports from './function/parseImports'
import type { DeclarationData, ImportData, RequireData, TransformerOptions } from './type'
import { pushImport, pushRequire } from './function/pushImport'
import * as constant from './constant'
import addImportStatements from './visitor/function/addImportStatements'

function formatIdentifier(identifier: string, index: number) {
  return `cheap__${identifier}__${index}`
}

function isIdentifier(name: string, identifier: string) {
  return name === identifier || name.indexOf(`cheap__${identifier}__`) === 0
}

export enum StageStatus {
  NONE,
  CALL,
  EqualLeft,
  EqualRight,
  SingleArrowRight,
  PointerPlusMinusIgnore,
  AddressOf,
  Parameter,
  VariableDeclaration
}

export enum BlockType {
  UNKNOWN,
  FUNCTION,
  IF,
  LOOP
}

interface StageBase {}

export interface CallStage extends StageBase {
  name: string
}

class Stage<T> {
  stage: StageStatus
  data: T
}

type StageMap<T> = T extends StageStatus.CALL ? CallStage : StageBase

class BlockStack {

  type: BlockType = BlockType.UNKNOWN

  topDeclaration: DeclarationData[] = []
  definedStruct: string[] = []

  stages: Stage<StageBase>[] = []

  locals: Map<string, ts.Symbol> = new Map()
  funcs: Map<string, ts.Node> = new Map()

  synchronize: boolean = false

  constructor(type: BlockType = BlockType.UNKNOWN) {
    this.type = type
  }

  pushStage(stage: StageStatus, data: StageBase) {
    const s = new Stage()
    s.stage = stage
    s.data = data
    this.stages.push(s)
  }

  popStage() {
    this.stages.pop()
  }

  lookupStage<T extends StageStatus>(stage: T) {
    for (let i = this.stages.length - 1; i >= 0; i--) {
      if (this.stages[i].stage === stage) {
        return this.stages[i] as any as StageMap<T>
      }
    }
  }

  getCurrentStage() {
    return this.stages[this.stages.length - 1]
  }

  hasStruct(name: string) {
    return array.has(this.definedStruct, name)
  }

  getDeclaration(name: string) {
    return this.topDeclaration.find((item) => {
      return item.name === name
    })
  }
}

class Statement {
  options: TransformerOptions
  compilerOptions: ts.CompilerOptions
  cheapCompilerOptions: {
    defined: Record<string, any>
  }
  program: ts.Program
  context: ts.TransformationContext
  typeChecker: ts.TypeChecker
  visitor: ts.Visitor

  currentFile: ts.SourceFile
  currentFilePath: string
  imports: Map<string, Map<string, string>>
  memoryImports: ImportData[]
  symbolImports: ImportData[]
  stdImports: ImportData[]
  identifierImports: ImportData[]
  requires: RequireData[]

  stacks: BlockStack[]

  identifierIndex: number

  moduleType: ts.ModuleKind
  esModuleInterop: boolean

  start(file: ts.SourceFile) {
    this.currentFile = file
    this.identifierIndex = 0
    this.memoryImports = []
    this.symbolImports = []
    this.stdImports = []
    this.identifierImports = []
    this.requires = []

    this.stacks = []

    this.pushStack()

    this.imports = parseImports(file, this.program, this.typeChecker, this.getCurrentStack().locals)
    this.currentFilePath = path.relative(this.options.projectPath, file.fileName)
  }

  isOutputCJS() {
    return this.moduleType === ts.ModuleKind.CommonJS
  }

  end(newFile: ts.SourceFile) {
    const stack = this.getCurrentStack()

    const updatedStatements = []

    array.each(stack.topDeclaration, (item) => {
      updatedStatements.push(this.context.factory.createVariableStatement(
        undefined,
        this.context.factory.createVariableDeclarationList(
          [
            this.context.factory.createVariableDeclaration(item.formatName, undefined, undefined, item.initializer)
          ],
          ts.NodeFlags.Const
        )
      ))
    })

    addImportStatements(this.memoryImports, constant.memoryPath, updatedStatements)
    addImportStatements(this.symbolImports, constant.symbolPath, updatedStatements)

    const cheapReg = new RegExp(`^\\S*/node_modules/${constant.PACKET_NAME}/dist/((esm|cjs)/)?`)

    if (this.identifierImports.length) {
      this.identifierImports.forEach((item) => {
        let p = item.path.replace(/(\.d)?\.[t|j]s$/, '')
        p = p.replace(cheapReg, constant.PACKET_NAME + '/')
        if (this.options.importPath) {
          p = this.options.importPath(p)
        }
        const importDeclaration = this.context.factory.createImportDeclaration(
          undefined,
          this.context.factory.createImportClause(
            false,
            item.default
              ? this.context.factory.createIdentifier(item.formatName)
              : undefined,
            item.default
              ? undefined
              : this.context.factory.createNamedImports([
                this.context.factory.createImportSpecifier(
                  false,
                  this.context.factory.createIdentifier(item.name),
                  this.context.factory.createIdentifier(item.formatName)
                )
              ])
          ),
          this.context.factory.createStringLiteral(p)
        )
        updatedStatements.push(importDeclaration)
      })
    }

    if (this.requires.length) {
      this.requires.forEach((item) => {
        let p = item.path.replace(/(\.d)?\.[t|j]s$/, '')
        p = p.replace(cheapReg, constant.PACKET_NAME + '/')
        if (this.options.importPath) {
          p = this.options.importPath(p)
        }

        const requireValue = this.context.factory.createCallExpression(
          this.context.factory.createIdentifier('require'),
          undefined,
          [
            this.context.factory.createStringLiteral(p)
          ]
        )

        const requireDeclaration = this.context.factory.createVariableStatement(
          undefined,
          this.context.factory.createVariableDeclarationList(
            [
              this.context.factory.createVariableDeclaration(
                this.context.factory.createIdentifier(item.formatName),
                undefined,
                undefined,
                this.esModuleInterop && !item.esModule
                  ? this.context.factory.createCallExpression(
                    this.context.factory.createIdentifier(item.default ? constant.importDefault : constant.importStar),
                    undefined,
                    [
                      requireValue
                    ]
                  )
                  : requireValue
              )
            ],
            ts.NodeFlags.Const
          )
        )
        updatedStatements.push(requireDeclaration)
      })
    }

    if (updatedStatements.length) {
      newFile = this.context.factory.updateSourceFile(newFile, [...updatedStatements, ...newFile.statements])
    }

    this.popStack()

    this.program = null
    this.typeChecker = null
    this.context = null
    this.currentFile = null
    this.visitor = null

    this.memoryImports = []
    this.symbolImports = []
    this.stdImports = []
    this.identifierImports = []
    this.requires = []
    this.stacks = []

    return newFile
  }

  pushStack(type?: BlockType) {
    this.stacks.push(new BlockStack(type))
  }

  popStack() {
    this.stacks.pop()
  }

  getCurrentStack() {
    return this.stacks[this.stacks.length - 1]
  }

  pushStage(status: StageStatus, data: StageBase = {}) {
    this.getCurrentStack()?.pushStage(status, data)
  }

  popStage() {
    this.getCurrentStack()?.popStage()
  }

  getCurrentStage() {
    return this.getCurrentStack()?.getCurrentStage()
  }

  lookupStage<T extends StageStatus>(stage: T) {
    for (let i = this.stacks.length - 1; i >= 0; i--) {
      const stack = this.stacks[i]
      const s = stack.lookupStage(stage)
      if (s) {
        return s
      }
    }
  }

  hasStruct(name: string) {
    for (let i = this.stacks.length - 1; i >= 0; i--) {
      const stack = this.stacks[i]
      const s = stack.hasStruct(name)
      if (s) {
        return s
      }
    }
    return false
  }

  addStruct(name: string) {
    this.getCurrentStack().definedStruct.push(name)
  }

  getDeclaration(name: string) {
    return this.getCurrentStack()?.getDeclaration(name)
  }

  addDeclaration(name: string, initializer?: ts.Expression) {
    const stack = this.getCurrentStack()
    for (let i = 0; i < stack.topDeclaration.length; i++) {
      if (stack.topDeclaration[i].name === name) {
        return stack.topDeclaration[i]
      }
    }
    const item = {
      name,
      formatName: formatIdentifier(name, this.identifierIndex++),
      initializer
    }
    stack.topDeclaration.push(item)
    return item
  }

  addModuleDeclaration(name: string, initializer?: ts.Expression) {
    const stack = this.stacks[0]
    for (let i = 0; i < stack.topDeclaration.length; i++) {
      if (stack.topDeclaration[i].name === name) {
        return stack.topDeclaration[i]
      }
    }
    const item = {
      name,
      formatName: formatIdentifier(name, this.identifierIndex++),
      initializer
    }
    stack.topDeclaration.push(item)
    return item
  }

  addMemoryImport(name: string) {
    if (name === constant.ctypeEnumRead) {
      return this.addIdentifierImport(name, constant.ctypeEnumReadPath, false)
    }
    else if (name === constant.ctypeEnumWrite) {
      return this.addIdentifierImport(name, constant.ctypeEnumWritePath, false)
    }

    if (this.isOutputCJS()) {
      let { formatName } = pushRequire(
        this.requires,
        formatIdentifier('memory', this.identifierIndex++),
        constant.memoryPath,
        false,
        true
      )
      return this.context.factory.createPropertyAccessExpression(
        this.context.factory.createIdentifier(formatName),
        this.context.factory.createIdentifier(name)
      )
    }
    else {
      let { formatName } = pushImport(
        this.memoryImports,
        name,
        constant.memoryPath,
        this.options.formatIdentifier === false ? name : formatIdentifier(name, this.identifierIndex++), false
      )
      return this.context.factory.createIdentifier(formatName)
    }
  }

  addSymbolImport(name: string) {
    if (this.isOutputCJS()) {
      let { formatName } = pushRequire(
        this.requires,
        formatIdentifier('symbol', this.identifierIndex++),
        constant.symbolPath,
        false,
        true
      )
      return this.context.factory.createPropertyAccessExpression(
        this.context.factory.createIdentifier(formatName),
        this.context.factory.createIdentifier(name)
      )
    }
    else {
      let { formatName } = pushImport(
        this.symbolImports,
        name,
        constant.symbolPath,
        this.options.formatIdentifier === false ? name : formatIdentifier(name, this.identifierIndex++),
        false
      )
      return this.context.factory.createIdentifier(formatName)
    }
  }

  addIdentifierImport(name: string, modulePath: string, defaultExport: boolean, esModule: boolean = true) {
    if (this.isOutputCJS()) {
      let item = pushRequire(
        this.requires,
        formatIdentifier('identifier', this.identifierIndex++),
        modulePath,
        defaultExport,
        true
      )
      if (defaultExport) {
        item.defaultName = name
      }
      if (defaultExport && !esModule) {
        return this.context.factory.createIdentifier(item.formatName)
      }
      else {
        return this.context.factory.createPropertyAccessExpression(
          this.context.factory.createIdentifier(item.formatName),
          this.context.factory.createIdentifier(defaultExport ? 'default' : name)
        )
      }
    }
    else {
      let { formatName } = pushImport(
        this.identifierImports,
        name,
        modulePath,
        this.options.formatIdentifier === false ? name : formatIdentifier(name, this.identifierIndex++),
        defaultExport
      )
      return this.context.factory.createIdentifier(formatName)
    }
  }

  isIdentifier(name: ts.Identifier | ts.PropertyAccessExpression, identifier: string, path: string) {
    if (ts.isIdentifier(name)) {
      if (name.escapedText === identifier) {
        const symbol = this.typeChecker.getSymbolAtLocation(name)
        if (symbol) {
          const targetSource = symbol.valueDeclaration?.getSourceFile()
          if (targetSource && targetSource.fileName.indexOf(path) >= 0) {
            return true
          }
        }
      }
      return isIdentifier(name.escapedText as string, identifier) && this.identifierImports.some((item) => {
        return item.formatName === name.escapedText
          && item.name === identifier
          && item.path === path
      })
      || isIdentifier(name.escapedText as string, 'identifier') && this.requires.some((item) => {
        return item.defaultName === identifier
          && item.path === path
      })
    }
    else {
      if (name.name.escapedText === identifier) {
        const symbol = this.typeChecker.getSymbolAtLocation(name)
        if (symbol) {
          const targetSource = symbol.valueDeclaration?.getSourceFile()
          if (targetSource && targetSource.fileName.indexOf(path) >= 0) {
            return true
          }
        }
        else if (ts.isIdentifier(name.expression)
          && isIdentifier(name.expression.escapedText as string, 'identifier')
        ) {
          return this.requires.some((item) => {
            return item.formatName === (name.expression as ts.Identifier).escapedText
              && item.path === path
          })
        }
      }
      else if (name.name.escapedText === 'default'
        && ts.isIdentifier(name.expression)
        && isIdentifier(name.expression.escapedText as string, 'identifier')
      ) {
        return this.requires.some((item) => {
          return item.defaultName === identifier
          && item.path === path
        })
      }
    }
    return false
  }

  addLocal(name: string, symbol: ts.Symbol) {
    this.getCurrentStack()?.locals.set(name, symbol)
  }

  addFunc(name: string, node: ts.Node) {
    this.getCurrentStack()?.funcs.set(name, node)
  }

  lookupLocal(name: string) {
    for (let i = this.stacks.length - 1; i >= 0; i--) {
      const stack = this.stacks[i]
      const s = stack.locals.get(name)
      if (s) {
        return s
      }
    }
  }

  lookupFunc(name: string) {
    for (let i = this.stacks.length - 1; i >= 0; i--) {
      const stack = this.stacks[i]
      const s = stack.funcs.get(name)
      if (s) {
        return s
      }
    }
  }

  lookupSynchronized() {
    for (let i = this.stacks.length - 1; i >= 0; i--) {
      const stack = this.stacks[i]
      if (stack.type === BlockType.FUNCTION) {
        return stack.synchronize
      }
    }
    return false
  }
}

const statement = new Statement()

export default statement

