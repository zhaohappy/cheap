import { DeclarationData } from '../type'

export default function pushDeclaration(keys: DeclarationData[], name: string, formatName: string) {
  for (let i = 0; i < keys.length; i++) {
    if (keys[i].name === name) {
      return keys[i]
    }
  }

  const item = {
    name,
    formatName
  }

  keys.push(item)

  return item
}
