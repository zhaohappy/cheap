import ts from 'typescript'
import path from 'path'
import getFilePath from './getFilePath'

export default function parseImports(file: ts.SourceFile, program: ts.Program, typeChecker: ts.TypeChecker, locals: Map<string, ts.Symbol>) {
  const map: Map<string, {
    map: Map<string, string>
    specifier: string
  }> = new Map()

  file.statements.forEach((node) => {
    if (ts.isImportDeclaration(node)) {
      const ext = path.extname((node.moduleSpecifier as ts.StringLiteral).text)
      if (!ext || ext === '.ts') {
        const specifier = (node.moduleSpecifier as ts.StringLiteral).text.split('!').pop()
        const filePath = getFilePath(program, file.fileName, specifier)
        if (filePath) {
          const m = map.get(filePath) || {
            map: new Map(),
            specifier
          }
          if (node.importClause && ts.isImportClause(node.importClause)) {
            if (node.importClause.isTypeOnly
              || node.importClause.phaseModifier === ts.SyntaxKind.TypeKeyword
            ) {
              return
            }
            if (node.importClause.name && ts.isIdentifier(node.importClause.name)) {
              m.map.set('default', node.importClause.name.escapedText as string)
              locals.set(node.importClause.name.escapedText as string, typeChecker.getSymbolAtLocation(node.importClause.name))
            }
            if (node.importClause.namedBindings) {
              if (ts.isNamedImports(node.importClause.namedBindings)) {
                node.importClause.namedBindings.elements.forEach((element) => {
                  if (element.isTypeOnly) {
                    return
                  }
                  if (element.propertyName && ts.isIdentifier(element.propertyName)) {
                    m.map.set(element.propertyName.escapedText as string, element.name.escapedText as string)
                    locals.set(element.propertyName.escapedText as string, typeChecker.getSymbolAtLocation(element.propertyName))
                  }
                  else {
                    m.map.set(element.name.escapedText as string, element.name.escapedText as string)
                    locals.set(element.name.escapedText as string, typeChecker.getSymbolAtLocation(element.name))
                  }
                })
              }
              else if (ts.isNamespaceImport(node.importClause.namedBindings)) {
                m.map.set('all', node.importClause.namedBindings.name.escapedText as string)
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
