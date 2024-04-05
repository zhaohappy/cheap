
import ts from 'typescript'
import path from 'path-browserify'
import * as array from 'common/util/array'
import parseImports from './function/parseImports'
import { DeclarationData, ImportData, TransformerOptions } from './type'
import pushImport from './function/pushImport'
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

  type: BlockType  = BlockType.UNKNOWN

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

  stacks: BlockStack[]

  identifierIndex: number

  start(file: ts.SourceFile) {
    this.currentFile = file
    this.identifierIndex = 0
    this.memoryImports = []
    this.symbolImports = []
    this.stdImports = []
    this.identifierImports = []

    this.stacks = []

    this.pushStack()

    this.imports = parseImports(file, this.program, this.typeChecker, this.getCurrentStack().locals)
    this.currentFilePath = path.relative(this.options.projectPath, file.fileName)
  }

  end(newFile: ts.SourceFile) {
    const stack = this.getCurrentStack()

    const updatedStatements = []

    array.each(stack.topDeclaration, (item) => {
      updatedStatements.push(this.context.factory.createVariableStatement(
        undefined,
        this.context.factory.createVariableDeclarationList([
          this.context.factory.createVariableDeclaration(item.formatName, undefined, undefined, item.initializer)
        ])
      ))
    })

    addImportStatements(this.memoryImports, constant.memoryPath, updatedStatements)
    addImportStatements(this.symbolImports, constant.symbolPath, updatedStatements)

    if (this.identifierImports.length) {
      this.identifierImports.forEach((item) => {
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
          this.context.factory.createStringLiteral(item.path)
        )
        updatedStatements.push(importDeclaration)
      })
    }

    if (updatedStatements.length) {
      newFile = this.context.factory.updateSourceFile(newFile, [...updatedStatements, ...newFile.statements])
    }

    this.popStack()

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

    let { formatName } = pushImport(
      this.memoryImports,
      name,
      constant.memoryPath,
      this.options.formatIdentifier === false ? name : formatIdentifier(name, this.identifierIndex++), false
    )
    let key = this.context.factory.createIdentifier(formatName)
    return key
  }

  addSymbolImport(name: string) {
    let { formatName } = pushImport(
      this.symbolImports,
      name,
      constant.symbolPath,
      this.options.formatIdentifier === false ? name : formatIdentifier(name, this.identifierIndex++),
      false
    )
    let key = this.context.factory.createIdentifier(formatName)
    return key
  }

  addIdentifierImport(name: string, modulePath: string, defaultExport: boolean) {
    let { formatName } = pushImport(
      this.identifierImports,
      name,
      modulePath,
      this.options.formatIdentifier === false ? name : formatIdentifier(name, this.identifierIndex++),
      defaultExport
    )
    let key = this.context.factory.createIdentifier(formatName)
    return key
  }

  isIdentifier(name: string, identifier: string) {
    return isIdentifier(name, identifier)
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

