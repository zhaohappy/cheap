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
            }
            else {
                command.reject(error);
            }
            task.shift();
            if (task.length) {
                next();
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

        const distPath = `${this.query.tmpPath ? `${this.query.tmpPath}/` : ''}`;

        if (distPath && !fs.existsSync(distPath)) {
            fs.mkdirSync(distPath, { recursive: true });
        }

        const inputPath = `${distPath}${input}`;
        const outputPath = `${distPath}${output}`;

        const cmd = `${this.query.wat2wasm} ${inputPath} --enable-all -o ${outputPath}`;

        if (!/^\S*\(module/.test(source)) {
            source = `
                (module
                    (import "env" "memory" (memory 1 65536 shared))
                    ${source}
                )
            `;
        }

        runTask(cmd, source, inputPath, outputPath).then((text) => {
            callback(null, text);
        }).catch((error) => {
            let message = error.message.split('\n');
            if (message.length > 1) {
                message.shift();
                message = message.join('\n');
                message = message.replace(/.wat:(\d)+:(\d)+/g, (str) => {
                    return str.replace(/(\d)+/, (str) => {
                        return (+str - 3)+ '';
                    });
                });
                message = message.replaceAll(inputPath, this.resourcePath);
                callback(new Error(message));
            }
            else {
                callback(error);
            }
        });
    }
    catch (error) {
        callback(error);
    }
};