import { resolve, dirname } from 'path'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const json = JSON.parse(readFileSync(resolve(__dirname, '../package.json'), 'utf8'))

if (json.dependencies) {
  const keys = Object.keys(json.dependencies)
  for (let i = 0; i < keys.length; i++) {
    if (/^workspace:\*$/.test(json.dependencies[keys[i]])) {
      console.error(`dependencies ${keys[i]} not set real version`)
      process.exit(1)
    }
  }
}
process.exit(0)
