const fs = require('fs');
const path = require('path');

const distPath = path.join(__dirname, './__test__cache');

function removeDir(dir) {
  let files = fs.readdirSync(dir);
  for (let i = 0; i < files.length; i++) {
    let newPath = path.join(dir, files[i]);
    let stat = fs.statSync(newPath);
    if (stat.isDirectory()) {
      removeDir(newPath);
    }
    else {
      fs.unlinkSync(newPath);
    }
  }
  fs.rmdirSync(dir);
}

module.exports = function () {
  if (fs.existsSync(distPath)) {
    removeDir(distPath);
  }
};