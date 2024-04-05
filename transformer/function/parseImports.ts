import ts from 'typescript'
import path from 'path-browserify'
import getFilePath from './getFilePath'

export default function parseImports(file: ts.SourceFile, program: ts.Program, typeChecker: ts.TypeChecker, locals: Map<string, ts.Symbol>) {
  const map: Map<string, Map<string, string>> = new Map()

  file.statements.forEach((node) => {
    if (ts.isImportDeclaration(node)) {
      const ext = path.extname((node.moduleSpecifier as ts.StringLiteral).text)
      if (!ext || ext === '.ts') {
        const filePath = getFilePath(program, file.fileName, (node.moduleSpecifier as ts.StringLiteral).text.split('!').pop())
        if (filePath) {
          const m = map.get(filePath) || new Map()
          if (node.importClause && ts.isImportClause(node.importClause)) {
            if (node.importClause.name && ts.isIdentifier(node.importClause.name)) {
              m.set('default', node.importClause.name.escapedText as string)
            }
            if (node.importClause.namedBindings) {
              if (ts.isNamedImports(node.importClause.namedBindings)) {
                node.importClause.namedBindings.elements.forEach((element) => {
                  if (element.propertyName && ts.isIdentifier(element.propertyName)) {
                    m.set(element.propertyName.escapedText as string, element.name.escapedText as string)
                    locals.set(element.propertyName.escapedText as string, typeChecker.getSymbolAtLocation(element.propertyName))
                  }
                  else {
                    m.set(element.name.escapedText as string, element.name.escapedText as string)
                    locals.set(element.name.escapedText as string, typeChecker.getSymbolAtLocation(element.name))
                  }
                })
              }
              else if (ts.isNamespaceImport(node.importClause.namedBindings)) {
                m.set('all', node.importClause.namedBindings.name.escapedText as string)
              }
            }
          }
          map.set(filePath, m)
        }
      }
    }
  })

  return map
}
