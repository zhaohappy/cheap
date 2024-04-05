import { ImportData } from '../type'

export default function pushImport(
  keys: ImportData[],
  name: string,
  path: string,
  formatName: string,
  defaultExport: boolean
) {
  for (let i = 0; i < keys.length; i++) {
    if (keys[i].name === name && keys[i].path === path) {
      return keys[i]
    }
  }

  const item = {
    name,
    path,
    default: defaultExport,
    formatName
  }

  keys.push(item)

  return item
}
