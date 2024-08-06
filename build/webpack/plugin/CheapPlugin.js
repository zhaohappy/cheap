
const path = require('path');
const os = require('os');
const webpack = require('webpack');
const transformer = require('../../transformer').default;

function formatKey(error) {
  return `${error.loc.start.line}-${error.loc.start.column}-${error.loc.end.line}-${error.loc.end.column}`
}

function getAllModuleDeps(compilation, module, getModule) {
  const deps = [];
  const list = [];
  const cache = new Map();
  const handle = new Map();

  function addDeps(list) {
    if (list && list.length) {
      for (let i = 0; i < list.length; i++) {
        if (list[i].request) {
          if (!handle.has(list[i].request)) {
            deps.push(list[i]);
          }
          handle.set(list[i].request, true);
        }
      }
    }
  }
  addDeps(module.dependencies);

  while (deps.length) {
    const dep = deps.shift();
    const m = compilation.moduleGraph.getModule(dep);
    if (m) {
      if (!cache.has(m.resource)) {
        if (getModule) {
          list.push(m);
        }
        else {
          list.push(m.resource);
        }
        cache.set(m.resource, true);
      }
      if (m.dependencies && m.dependencies.length) {
        addDeps(m.dependencies);
      }
    }
  }
  return list;
}

function inArray(array, callback) {
  if (!array) {
    return false;
  }
  for (let i = 0; i < array.length ; i++) {
    if (callback(array[i]) === true) {
      return true;
    }
  }
  return false;
}

class CheapPlugin {

  constructor(options) {
    this.errors = [];
    this.cache = new Map();
    this.options = options;
  }

  apply(compiler) {

    const me = this;

    compiler.hooks.afterCompile.tapAsync('CheapPlugin', (compilation, callback) => {
      compilation.errors.push(...this.errors);
      callback();
    });

    compiler.hooks.beforeRun.tap('CheapPlugin', (compiler) => {
      if (!compiler.options.resolveLoader) {
        compiler.options.resolveLoader = {};
      }
      if (compiler.options.resolveLoader.alias) {
        compiler.options.resolveLoader.alias = {};
      }
      if (!compiler.options.resolveLoader.modules) {
        compiler.options.resolveLoader.modules = [
          'node_modules'
        ];
      }
      compiler.options.resolveLoader.modules.push(path.resolve(__dirname, '../loader'));
      compiler.options.resolveLoader.alias = {
        'asm-with-simd': path.resolve(__dirname, '../../asm/simd-loader.js'),
        'asm-with-pthread': path.resolve(__dirname, '../../asm/pthread-loader.js'),
      };

      if (!compiler.options.module.rules) {
        compiler.options.module.rules = [];
      }

      let wat2wasmPath = path.resolve(__dirname, '../../asm/ubuntu') + '/wat2wasm';
      if (os.platform() === 'win32') {
        wat2wasmPath = path.resolve(__dirname, '../../asm/win') + '/wat2wasm.exe';
      }
      else if (os.platform() === 'darwin') {
        wat2wasmPath = path.resolve(__dirname, '../../asm/macos') + '/wat2wasm';
      }

      compiler.options.module.rules.forEach((item) => {
        if (item.use) {
          item.use.forEach((loader) => {
            if (loader && loader.loader === 'ts-loader') {
              if (!loader.options) {
                loader.options = {};
              }
              let old = loader.options.getCustomTransformers;
              if (!old) {
                old = function () {
                };
              }

              loader.options.getCustomTransformers = function (program) {
                const result = old(program) || {};
                const trans = transformer(program, {
                  projectPath: me.options.projectPath,
                  exclude: me.options.exclude || '__test__',
                  reportError: (message) => {
                    me.reportError(message);
                  },
                  defined: {
                    ENV_NODE: me.options.env === 'node'
                  },
                  tmpPath: compiler.options.output.path,
                  wat2wasm: wat2wasmPath
                });

                if (!result.before) {
                  result.before = [
                    trans
                  ];
                }
                else {
                  result.before.push(trans);
                }
                return result;
              };
            }
          });
        }
      });

      compiler.options.module.rules.push({
        test: /\.asm$/,
        use: [
          {
            loader: path.resolve(__dirname, '../../asm/process-loader.js'),
            options: {
              tmpPath: compiler.options.output.path,
              wat2wasm: wat2wasmPath
            }
          }
        ]
      });

      if (compiler.options.plugins) {
        let definePlugin;
        compiler.options.plugins.forEach((plugin) => {
          if (plugin instanceof webpack.DefinePlugin) {
            definePlugin = plugin;
          }
        });
        if (definePlugin) {
          definePlugin.definitions['__LIBRARY_EXPORT_NAME__'] = `'${compiler.options.output.library.name || me.options.name}'`;
        }
        else {
          const plugin = new webpack.DefinePlugin({
            __LIBRARY_EXPORT_NAME__: `'${compiler.options.output.library.name || me.options.name}'`
          });
          compiler.options.plugins.push(plugin);
          plugin.apply(compiler);
        }
      }
      else {
        const plugin = new webpack.DefinePlugin({
          __LIBRARY_EXPORT_NAME__: `'${compiler.options.output.library.name || me.options.name}'`
        });
        compiler.options.plugins.push(plugin);
        plugin.apply(compiler);
      }

      if (me.options.env === 'node') {
        if (!compiler.options.externals) {
          compiler.options.externals = {
            'worker_threads': 'worker_threads',
            fs: 'fs'
          };
        }
        else {
          compiler.options.externals['worker_threads'] = 'worker_threads';
          compiler.options.externals['fs'] = 'fs';
        }
      }
    });

    compiler.hooks.thisCompilation.tap('CheapPlugin', (compilation) => {
      compilation.hooks.afterOptimizeTree.tap('CheapPlugin', (chunks, modules) => {
        const handleModules = [];
        const threadFiles = me.options.threadFiles || [];
        if (!threadFiles.length) {
          return;
        }

        modules.forEach((module) => {
          if (inArray(threadFiles, (item) => { return module.resource === item.file })) {
            handleModules.push(module);
          }
        });

        const handleModulesDeps = new Map();
        handleModules.forEach((module) => {
          handleModulesDeps.set(module.resource, getAllModuleDeps(compilation, module));
        });

        chunks.forEach((chunk) => {
          if (chunk.isOnlyInitial() === false) {
            let needHandle = false;
            let handleModule = '';
            compilation.chunkGraph.getChunkModules(chunk).forEach((module) => {
              const issuer = compilation.moduleGraph.getIssuer(module);
              if (issuer && inArray(handleModules, (item) => item.resource === issuer.resource)) {
                needHandle = true;
                handleModule = issuer.resource;
              }
            });
            if (needHandle) {

              const needAddModules = [];
              const needAddModulesCache = new Map();
              const currentDeps = handleModulesDeps.get(handleModule);
              
              let includeDeps = threadFiles.find(item => item.file === handleModule);
              if (includeDeps) {
                includeDeps = includeDeps.include;
              }
              else {
                includeDeps = [];
              }

              compilation.chunkGraph.getChunkModules(chunk).forEach((module) => {
                const deps = getAllModuleDeps(compilation, module, true);
                while (deps.length) {
                  const m = deps.shift();
                  if (m) {
                    if (!inArray(currentDeps, (item) => item === m.resource) || inArray(includeDeps, (item) => item === m.resource)) {
                      if (!needAddModulesCache.has(m)) {
                        needAddModules.push(m);
                        needAddModulesCache.set(m, true);
                      }
                    }
                  }
                }
              });
              compilation.chunkGraph.attachModules(chunk, needAddModules);
            }
          }
        });
      });
    });
  }

  reportError(error) {

    const key = formatKey(error);

    if (this.cache.has(key)) {
      return;
    }

    const e = new Error();
    e.message = error.message;
    e.file = error.file;
    e.loc = error.loc;

    this.errors.push(e);

    this.cache.set(key, true);
  }
}

module.exports = CheapPlugin;