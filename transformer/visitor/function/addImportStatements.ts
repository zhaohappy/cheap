import { ImportData } from '../../type'
import statement from '../../statement'

export default function addImportStatements(imports: ImportData[], path: string, updatedStatements: any[]) {
  if (imports.length) {
    const importElements = []

    imports.forEach((item) => {
      importElements.push(statement.context.factory.createImportSpecifier(
        false,
        statement.context.factory.createIdentifier(item.name),
        statement.context.factory.createIdentifier(item.formatName)
      ))
    })

    const importDeclaration = statement.context.factory.createImportDeclaration(
      undefined,
      statement.context.factory.createImportClause(
        false,
        undefined,
        statement.context.factory.createNamedImports(importElements)
      ),
      statement.context.factory.createStringLiteral(path)
    )

    updatedStatements.push(importDeclaration)
  }
}
