import type { ImportData, RequireData } from '../type'

export function pushImport(
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

  return item as ImportData
}

export function pushRequire(
  keys: RequireData[],
  formatName: string,
  path: string,
  defaultExport: boolean,
  esModule: boolean
) {
  for (let i = 0; i < keys.length; i++) {
    if (keys[i].path === path && keys[i].default === defaultExport) {
      return keys[i]
    }
  }

  const item = {
    formatName,
    path,
    default: defaultExport,
    esModule
  }

  keys.push(item)

  return item as RequireData
}
