import ts from 'typescript'
import * as is from 'common/util/is'
import * as object from 'common/util/object'
import * as array from 'common/util/array'
import statement from './statement'
import blockVisitor from './visitor/blockVisitor'
import identifierVisitor from './visitor/identifierVisitor'
import decoratorVisitor, { asyncVisitor } from './visitor/decoratorVisitor'
import classDeclarationVisitor from './visitor/classDeclarationVisitor'
import ifStatementVisitor from './visitor/ifStatementVisitor'
import parameterVisitor from './visitor/parameterVisitor'
import variableDeclarationVisitor from './visitor/variableDeclarationVisitor'
import functionDeclarationVisitor from './visitor/functionDeclarationVisitor'
import { TransformerOptions } from './type'
import expressionStatementVisitor from './visitor/expressionStatementVisitor'
import bigIntLiteralVisitor from './visitor/bigIntLiteralVisitor'
import expressionVisitor from './visitor/expressionVisitor'
import * as constant from './constant'
import { getStructFileIdentifiers } from './struct'

const DefaultDefined = {
  ENV_NODE: false,
  ENABLE_THREADS: true,
  ENABLE_THREADS_SPLIT: false,
  DEBUG: false,
  BIGINT_LITERAL: true,
  CHEAP_HEAP_INITIAL: 256,
  ENABLE_SYNCHRONIZE_API: false,
  ENABLE_LOG_PATH: true,
  ENV_WEBPACK: false
}

export function before(program: ts.Program, options: TransformerOptions = {}): ts.TransformerFactory<ts.SourceFile> {

  if (!options.projectPath) {
    options.projectPath = program.getCurrentDirectory()
  }

  const configFileName = ts.findConfigFile(options.projectPath, ts.sys.fileExists, 'tsconfig.json')
  const configFile = configFileName && ts.readConfigFile(configFileName, ts.sys.readFile)

  let compilerOptions = {
    defined: null
  }

  const defined = object.extend({}, DefaultDefined)
  if (configFile?.config?.cheap) {
    object.extend(defined, configFile.config.cheap.defined || {})
    compilerOptions = object.extend(compilerOptions, configFile.config['cheap'] || {})
  }

  if (options.defined) {
    object.extend(defined, options.defined)
  }
  compilerOptions.defined = defined


  statement.options = options
  statement.cheapCompilerOptions = compilerOptions
  statement.program = program
  statement.typeChecker = program.getTypeChecker()
  statement.compilerOptions = program.getCompilerOptions()

  const excludes = is.array(options.exclude)
    ? options.exclude
    : (options.exclude
      ? [options.exclude]
      : []
    )

  constant.setPacketName(options.cheapPacketName ?? '@libmedia/cheap')

  return (context: ts.TransformationContext) => {

    statement.context = context

    const options = context.getCompilerOptions()
    statement.moduleType = options.module
    statement.esModuleInterop = options.esModuleInterop

    const createNumericLiteral = context.factory.createNumericLiteral

    // @ts-ignore
    context.factory.createNumericLiteral = (value: string | number, numericLiteralFlags?: ts.TokenFlags) => {
      if (is.number(value) && value < 0) {
        return statement.context.factory.createPrefixUnaryExpression(
          ts.SyntaxKind.MinusToken,
          statement.context.factory.createNumericLiteral(Math.abs(value))
        )
      }
      return createNumericLiteral(value, numericLiteralFlags)
    }

    return (file: ts.SourceFile) => {

      if (excludes.some((exclude) => {
        return exclude.test(file.fileName)
      })) {
        return file
      }

      statement.start(file)

      statement.visitor = (node: ts.Node): ts.Node | ts.Node[] => {
        if (ts.isBlock(node)) {
          return blockVisitor(node, statement.visitor)
        }
        else if (ts.isIdentifier(node)) {
          return identifierVisitor(node, statement.visitor)
        }
        else if (ts.isDecorator(node)) {
          return decoratorVisitor(node, statement.visitor)
        }
        else if (node.kind === ts.SyntaxKind.AsyncKeyword) {
          return asyncVisitor(node as ts.AsyncKeyword, statement.visitor)
        }
        else if (ts.isClassDeclaration(node) && node.name && ts.isIdentifier(node.name)) {
          return classDeclarationVisitor(node, statement.visitor)
        }
        else if (ts.isIfStatement(node)) {
          return ifStatementVisitor(node, statement.visitor)
        }
        else if (ts.isParameter(node)) {
          return parameterVisitor(node, statement.visitor)
        }
        else if (ts.isVariableDeclaration(node)) {
          return variableDeclarationVisitor(node, statement.visitor)
        }
        else if (ts.isFunctionDeclaration(node)) {
          return functionDeclarationVisitor(node, statement.visitor)
        }
        else if (ts.isExpressionStatement(node)) {
          return expressionStatementVisitor(node, statement.visitor)
        }
        else if (ts.isBigIntLiteral(node)) {
          return bigIntLiteralVisitor(node, statement.visitor)
        }
        else if (ts.isExpression(node)) {
          return expressionVisitor(node, statement.visitor)
        }
        return ts.visitEachChild(node, statement.visitor, context)
      }

      return statement.end(ts.visitEachChild(file, statement.visitor, statement.context))
    }
  }
}

export function after(program: ts.Program, options: TransformerOptions = {}): ts.TransformerFactory<ts.SourceFile> {

  const excludes = is.array(options.exclude)
    ? options.exclude
    : (options.exclude
      ? [options.exclude]
      : []
    )

  return (context: ts.TransformationContext) => {

    return (file: ts.SourceFile) => {

      if (excludes.some((exclude) => {
        return exclude.test(file.fileName)
      })) {
        return file
      }

      const visitor = (node: ts.Node): ts.Node | ts.Node[] => {

        return ts.visitEachChild(node, visitor, context)
      }
      return ts.visitEachChild(file, visitor, context)
    }
  }
}

export function afterDeclarations(program: ts.Program, options: TransformerOptions = {}): ts.TransformerFactory<ts.SourceFile> {

  const excludes = is.array(options.exclude)
    ? options.exclude
    : (options.exclude
      ? [options.exclude]
      : []
    )

  return (context: ts.TransformationContext) => {

    return (file: ts.SourceFile) => {

      if (excludes.some((exclude) => {
        return exclude.test(file.fileName)
      })) {
        return file
      }

      const structFileIdentifiers = getStructFileIdentifiers(file.fileName)

      const visitor = (node: ts.Node): ts.Node | ts.Node[] => {
        if (ts.isClassDeclaration(node) && node.name && ts.isIdentifier(node.name)) {
          let name = node.name.escapedText as string
          if (node.modifiers && node.modifiers.some((modifier) => {
            return modifier.kind === ts.SyntaxKind.DefaultKeyword
          })) {
            name = 'default'
          }
          if (structFileIdentifiers && array.has(structFileIdentifiers, name)) {
            const modifiers = node.modifiers ? [...node.modifiers] : []
            modifiers.unshift(context.factory.createDecorator(context.factory.createIdentifier(constant.typeStruct)))
            return context.factory.createClassDeclaration(
              modifiers,
              node.name,
              node.typeParameters,
              node.heritageClauses,
              node.members
            )
          }
        }
        return ts.visitEachChild(node, visitor, context)
      }
      return ts.visitEachChild(file, visitor, context)
    }
  }
}
