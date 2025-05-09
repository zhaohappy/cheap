"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = runAsChild;
var _utils = require("./utils");
function runAsChild(loaderContext, workerContext, options, callback) {
  workerContext.compiler.runAsChild((error, entries, compilation) => {
    if (error) {
      return callback(error);
    }
    if (entries[0]) {
      // eslint-disable-next-line no-param-reassign, prefer-destructuring
      const workerFilename = entries[0].files[0];
      let workerSource = compilation.assets[workerFilename].source();
      if (options.inline === "no-fallback") {
        // eslint-disable-next-line no-underscore-dangle, no-param-reassign
        delete loaderContext._compilation.assets[workerFilename];

        // TODO improve it, we should store generated source maps files for file in `assetInfo`
        // eslint-disable-next-line no-underscore-dangle
        if (loaderContext._compilation.assets[`${workerFilename}.map`]) {
          // eslint-disable-next-line no-underscore-dangle, no-param-reassign
          delete loaderContext._compilation.assets[`${workerFilename}.map`];
        }

        // Remove `/* sourceMappingURL=url */` comment
        workerSource = workerSource.replace(_utils.sourceMappingURLRegex, "");

        // Remove `//# sourceURL=webpack-internal` comment
        workerSource = workerSource.replace(_utils.sourceURLWebpackRegex, "");
      }
      const workerCode = (0, _utils.workerGenerator)(loaderContext, workerFilename, workerSource, options);
      return callback(null, workerCode);
    }
    return callback(new Error(`Failed to compile web worker "${workerContext.request}" request`));
  });
}
//# sourceMappingURL=supportWebpack4.js.map