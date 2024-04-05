const { exec } = require('child_process');
const fs = require('fs');

const input = '__cheap__tmp.wat';
const output = '__cheap__tmp.wasm';

function enableSimd(loaders) {
    if (loaders.length > 1) {
        for (let i = 0; i < loaders.length; i++) {
            if (/simd-loader.js$/.test(loaders[i].path)) {
                return true;
            }
        }
    }
    return false;
}

function enablePthread(loaders) {
    if (loaders.length > 1) {
        for (let i = 0; i < loaders.length; i++) {
            if (/pthread-loader.js$/.test(loaders[i].path)) {
                return true;
            }
        }
    }
    return false;
}

const task = [];

function next() {
    if (task.length) {
        const command = task[0];
        fs.writeFileSync(command.input, command.source);
        exec(command.cmd, (error, stdout, stderr) => {
            if (!error) {
                const buffer = fs.readFileSync(command.output);
                command.resolve(`module.exports = "${buffer.toString('base64')}";`);
                task.shift();
                if (task.length) {
                    next();
                }
            }
            else {
                command.reject(error);
            }
        });
    }
}

async function runTask(cmd, source, input, output) {
    return new Promise((resolve, reject) => {
        task.push({
            cmd,
            source,
            input,
            output,
            reject,
            resolve
        });

        if (task.length === 1) {
            next();
        }
    });
}

module.exports = function(source) {
    let callback = this.async();
    try {
        const inputPath = `${this.query.tmpPath ? `${this.query.tmpPath}/` : ''}${input}`;
        const outputPath = `${this.query.tmpPath ? `${this.query.tmpPath}/` : ''}${output}`;

        const pthreadEnable = enablePthread(this.loaders);
        const cmd = `${this.query.wat2wasm} ${inputPath} ${enableSimd(this.loaders) ? '--enable-simd' : ''} ${pthreadEnable ? '--enable-threads' : ''} -o ${outputPath}`;

        if (!/^\S*\(module/.test(source)) {
            source = `
                (module
                    (import "env" "memory" (memory 1 32768${pthreadEnable ? ' shared' : ''}))
                    ${source}
                )
            `;
        }

        runTask(cmd, source, inputPath, outputPath).then((text) => {
            callback(null, text);
        }).catch((error) => {
            callback(error, error.toString());
        });
    }
    catch (error) {
        callback(error, error.toString());
    }
};