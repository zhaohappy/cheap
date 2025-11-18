
import ts from 'typescript'
import path from 'path'
import fs from 'fs'
import { array, object } from '@libmedia/common'
import parseImports from './function/parseImports'
import type { DeclarationData, ImportData, RequireData, TransformerOptions } from './type'
import { pushImport, pushRequire } from './function/pushImport'
import * as constant from './constant'
import addImportStatements from './visitor/function/addImportStatements'
import relativePath from './function/relativePath'
import { minimatch } from 'minimatch'
import getFilePath from './function/getFilePath'
import reportError from './function/reportError'

interface PackageJsonResult {
  path: string;
  content: any;
}

const packageJsonCache = new Map<string, PackageJsonResult | null>()

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
    structPaths: Record<string, string>
  }
  program: ts.Program
  context: ts.TransformationContext
  typeChecker: ts.TypeChecker
  visitor: ts.Visitor

  currentFile: ts.SourceFile
  currentFilePath: string
  imports: Map<string, {
    map: Map<string, string>
    specifier: string
  }>
  memoryImports: ImportData[]
  symbolImports: ImportData[]
  stdImports: ImportData[]
  identifierImports: ImportData[]
  requires: RequireData[]

  stacks: BlockStack[]

  identifierIndex: number

  packageModule?: string
  moduleType: ts.ModuleKind
  esModuleInterop: boolean

  isCheapSource: boolean

  start(file: ts.SourceFile) {
    this.currentFile = file
    this.identifierIndex = 0
    this.memoryImports = []
    this.symbolImports = []
    this.stdImports = []
    this.identifierImports = []
    this.requires = []
    this.isCheapSource = false

    this.stacks = []

    this.pushStack()

    this.imports = parseImports(file, this.program, this.typeChecker, this.getCurrentStack().locals)
    this.currentFilePath = path.relative(this.options.projectPath, file.fileName)
    if (this.options.cheapSourcePath) {
      const relative = path.relative(this.options.cheapSourcePath, file.fileName)
      this.isCheapSource = !!relative && !relative.startsWith('..') && !path.isAbsolute(relative)
    }
    if (this.moduleType === ts.ModuleKind.Node16
      || this.moduleType === ts.ModuleKind.Node18
      || this.moduleType === ts.ModuleKind.Node20
      || this.moduleType === ts.ModuleKind.NodeNext
    ) {
      const jsonInfo = this.findNearestPackageJson(this.currentFile.fileName)
      if (jsonInfo?.content.type) {
        this.packageModule = jsonInfo.content.type
      }
    }
  }

  isOutputCJS() {
    return this.moduleType === ts.ModuleKind.CommonJS
      || this.moduleType === ts.ModuleKind.UMD
      || this.moduleType === ts.ModuleKind.AMD
      || this.options.module === 'commonjs'
      || (this.moduleType === ts.ModuleKind.Node16
        || this.moduleType === ts.ModuleKind.Node18
        || this.moduleType === ts.ModuleKind.Node20
        || this.moduleType === ts.ModuleKind.NodeNext
      )
        && this.packageModule === 'commonjs'
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

    addImportStatements(this.memoryImports, constant.RootPath, updatedStatements)
    addImportStatements(this.symbolImports, constant.InternalPath, updatedStatements)

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

  relativePath(file: string) {
    if (file.indexOf(constant.PACKET_NAME) === 0) {
      file = file.replace(constant.PACKET_NAME + '/', '')
    }
    return relativePath(this.currentFile.fileName, path.resolve(this.options.cheapSourcePath, file))
  }

  modulePath2relativePath(name: string, modulePath: string, defaultExport: boolean) {
    if (modulePath === constant.InternalPath) {
      if (name === constant.ctypeEnumRead) {
        modulePath = this.relativePath(constant.ctypeEnumReadPath)
        defaultExport = false
      }
      else if (name === constant.ctypeEnumWrite) {
        modulePath = this.relativePath(constant.ctypeEnumWritePath)
        defaultExport = false
      }
      else if (name === constant.Allocator) {
        modulePath = this.relativePath(constant.AllocatorPath)
        defaultExport = false
      }
      else if (name === constant.makeSharedPtr) {
        modulePath = this.relativePath(constant.makeSharedPtrPath)
        defaultExport = false
      }
      else if (name === constant.definedMetaProperty) {
        modulePath = this.relativePath(constant.definedMetaPropertyPath)
        defaultExport = true
      }
    }
    else if (modulePath === constant.RootPath) {
      if (name === constant.make) {
        modulePath = this.relativePath(constant.makePath)
        defaultExport = true
      }
      else if (name === constant.unmake) {
        modulePath = this.relativePath(constant.unmakePath)
        defaultExport = true
      }
      else if (name === constant.sizeof) {
        modulePath = this.relativePath(constant.sizeofPath)
        defaultExport = true
      }
      else if (name === constant.structAccess) {
        modulePath = this.relativePath(constant.structAccessPath)
        defaultExport = true
      }
    }
    return {
      modulePath,
      defaultExport
    }
  }

  addMemoryImport(name: string) {
    if (name === constant.ctypeEnumRead) {
      return this.addIdentifierImport(name, constant.InternalPath, false)
    }
    else if (name === constant.ctypeEnumWrite) {
      return this.addIdentifierImport(name, constant.InternalPath, false)
    }

    if (this.isOutputCJS()) {
      let { formatName } = pushRequire(
        this.requires,
        formatIdentifier('identifier', this.identifierIndex++),
        this.isCheapSource
          ? this.relativePath(constant.memoryPath)
          : constant.RootPath,
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
        this.isCheapSource
          ? this.relativePath(constant.memoryPath)
          : constant.RootPath,
        this.options.formatIdentifier === false ? name : formatIdentifier(name, this.identifierIndex++), false
      )
      return this.context.factory.createIdentifier(formatName)
    }
  }

  addSymbolImport(name: string) {
    if (this.isOutputCJS()) {
      let { formatName } = pushRequire(
        this.requires,
        formatIdentifier('identifier', this.identifierIndex++),
        this.isCheapSource
          ? this.relativePath(constant.symbolPath)
          : constant.InternalPath,
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
        this.isCheapSource
          ? this.relativePath(constant.symbolPath)
          : constant.InternalPath,
        this.options.formatIdentifier === false ? name : formatIdentifier(name, this.identifierIndex++),
        false
      )
      return this.context.factory.createIdentifier(formatName)
    }
  }

  addIdentifierImport(name: string, modulePath: string, defaultExport: boolean, esModule: boolean = true) {

    if (this.isCheapSource) {
      const result = this.modulePath2relativePath(name, modulePath, defaultExport)
      modulePath = result.modulePath
      defaultExport = result.defaultExport
    }

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

  resolveSourceSymbol(symbol: ts.Symbol): ts.Symbol {
    let current = symbol
    while (current.flags & ts.SymbolFlags.Alias) {
      current = this.typeChecker.getAliasedSymbol(current)
    }
    return current
  }

  getAliasedNameFromModule(module: string, symbol: ts.Symbol, name: string) {
    const fileName = getFilePath(this.program, this.currentFile.fileName, module)
    if (fileName) {
      const sf = this.program.getSourceFile(fileName)
      if (sf) {
        const ss = this.typeChecker.getSymbolAtLocation(sf)
        if (ss?.exports) {
          if (ss.exports.has(name as ts.__String)) {
            if (this.resolveSourceSymbol(ss.exports.get(name as ts.__String)) === symbol) {
              return name
            }
          }
          if (ss.exports.has('default' as ts.__String)) {
            if (this.resolveSourceSymbol(ss.exports.get('default' as ts.__String)) === symbol) {
              return 'default'
            }
          }
          for (let en of ss.exports) {
            if (this.resolveSourceSymbol(en[1]) === symbol) {
              return en[0] as string
            }
          }
        }
      }
    }
  }

  addStructImport(symbol: ts.Symbol, target: ts.SourceFile) {
    if (!this.isOutputCJS()) {
      let local = this.lookupLocalSymbol(symbol)
      if (local) {
        return this.context.factory.createIdentifier(local)
      }
    }
    let pathString = relativePath(this.currentFile.fileName, target.fileName)
    let name: string = symbol.escapedName as string
    object.each(this.cheapCompilerOptions.structPaths, (value, key) => {
      if (minimatch(target.fileName, key) && !minimatch(this.currentFile.fileName, key)) {
        let importName = this.getAliasedNameFromModule(value, symbol, name)
        if (importName) {
          pathString = value
          name = importName
        }
        else {
          reportError(
            statement.currentFile,
            this.currentFile,
            `not found struct ${name} from module ${value}`
          )
        }
        return false
      }
    })
    if (/[\\/]node_modules[\\/]/.test(target.fileName)) {
      const match = target.fileName.match(/[\\/]node_modules[\\/](?:@[^\\/]+[\\/][^\\/]+|[^\\/]+)/)
      if (match) {
        let packageName = match[0].replace(/.*node_modules[\\/]/, '')
        let importName = this.getAliasedNameFromModule(packageName, symbol, name)
        if (importName) {
          pathString = packageName
          name = importName
        }
      }
    }
    return this.addIdentifierImport(
      name,
      pathString,
      name === 'default'
    )
  }

  isIdentifier(name: ts.Identifier | ts.PropertyAccessExpression, identifier: string, path: string, importPath: string) {
    if (this.isCheapSource) {
      const result = this.modulePath2relativePath(identifier, importPath, false)
      importPath = result.modulePath
    }
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
          && item.path === importPath
      })
      || isIdentifier(name.escapedText as string, 'identifier') && this.requires.some((item) => {
        return item.defaultName === identifier
          && item.path === importPath
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
              && item.path === importPath
          })
        }
      }
      else if (name.name.escapedText === 'default'
        && ts.isIdentifier(name.expression)
        && isIdentifier(name.expression.escapedText as string, 'identifier')
      ) {
        return this.requires.some((item) => {
          return item.defaultName === identifier
          && item.path === importPath
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

  lookupLocalSymbol(symbol: ts.Symbol) {
    for (let i = this.stacks.length - 1; i >= 0; i--) {
      const stack = this.stacks[i]
      let s: string
      for (let entry of stack.locals) {
        if (this.resolveSourceSymbol(entry[1]) === symbol) {
          return entry[0]
        }
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

  findNearestPackageJson(filePath: string): PackageJsonResult | null {
    const absPath = path.resolve(filePath)

    // 检查缓存
    if (packageJsonCache.has(absPath)) {
      return packageJsonCache.get(absPath)!
    }

    let dir = path.dirname(absPath)

    while (true) {
      const pkgPath = path.join(dir, 'package.json')
      if (packageJsonCache.get(pkgPath)) {
        return packageJsonCache.get(pkgPath)
      }
      if (!packageJsonCache.has(pkgPath) && fs.existsSync(pkgPath)) {
        try {
          const content = JSON.parse(fs.readFileSync(pkgPath, 'utf8'))
          const result = { path: pkgPath, content }
          packageJsonCache.set(pkgPath, result)
          return result
        }
        catch (e) {
          // 忽略解析错误，继续往上查找
          packageJsonCache.set(pkgPath, null)
        }
      }
      const parent = path.dirname(dir)
      if (parent === dir) {
        break
      }
      dir = parent
    }
    // 找不到
    packageJsonCache.set(absPath, null)
    return null
  }
}

const statement = new Statement()

export default statement

