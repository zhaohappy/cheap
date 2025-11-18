import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const distPath = path.join(path.dirname(fileURLToPath(import.meta.url)), './__test__cache')

function removeDir(dir) {
  let files = fs.readdirSync(dir)
  for (let i = 0; i < files.length; i++) {
    let newPath = path.join(dir, files[i])
    let stat = fs.statSync(newPath)
    if (stat.isDirectory()) {
      removeDir(newPath)
    }
    else {
      fs.unlinkSync(newPath)
    }
  }
  fs.rmdirSync(dir)
}

export default function () {
  if (fs.existsSync(distPath)) {
    removeDir(distPath)
  }
}
