import ts from 'typescript'
import * as object from 'common/util/object'
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

const DefaultDefined = {
  ENABLE_THREADS: true,
  ENABLE_THREADS_SPLIT: false,
  DEBUG: false,
  BIGINT_LITERAL: true,
  CHEAP_HEAP_INITIAL: 256,
  ENABLE_SYNCHRONIZE_API: false
}

export default function (program: ts.Program, options: TransformerOptions = {}): ts.TransformerFactory<ts.SourceFile> {

  if (!options.projectPath) {
    options.projectPath = program.getCurrentDirectory()
  }

  const configFileName = ts.findConfigFile(options.projectPath, ts.sys.fileExists, 'tsconfig.json')
  const configFile = configFileName && ts.readConfigFile(configFileName, ts.sys.readFile)

  let compilerOptions = {
    defined: {

    }
  }

  if (configFile?.config) {
    compilerOptions = object.extend(compilerOptions, configFile.config['cheap'] || {})
  }

  if (options.defined) {
    compilerOptions.defined = object.extend(DefaultDefined, options.defined)
  }

  statement.options = options
  statement.cheapCompilerOptions = compilerOptions
  statement.program = program
  statement.typeChecker = program.getTypeChecker()
  statement.compilerOptions = program.getCompilerOptions()

  return (context: ts.TransformationContext) => {

    statement.context = context

    return (file: ts.SourceFile) => {

      if (options.exclude && options.exclude.test(file.fileName)) {
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
