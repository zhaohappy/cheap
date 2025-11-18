import statement from '../statement'

export default function getImportIdentifier(map: Map<string, string>, name: string, defaultExport: boolean = false) {
  if (!map) {
    return
  }
  if (map.has('all')) {
    return statement.context.factory.createPropertyAccessExpression(
      statement.context.factory.createIdentifier(map.get('all')),
      statement.context.factory.createIdentifier(name)
    )
  }
  else if (defaultExport && map.has('default')) {
    return statement.context.factory.createIdentifier(map.get('default'))
  }
  else if (map.has(name)) {
    return statement.context.factory.createIdentifier(map.get(name))
  }
}
