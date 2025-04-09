"use strict";

module.exports = function (source) {
  let callback = this.async();
  const options = this.getOptions ? this.getOptions() : require('loader-utils-webpack-v4').getOptions(this);
  if (options.type === 'class') {
    source += `
      import __cheap_initClass__ from 'cheap/thread/initClass'
      function __cheap_run__(params: any) {
        params.unshift(null)
        return new (Function.prototype.bind.apply(${options.point}, params))()
      }
      __cheap_initClass__(__cheap_run__)
    `;
  } else if (options.type === 'function') {
    source += `
      import __cheap_initFunction__ from 'cheap/thread/initFunction'
      function __cheap_run__(params: any) {
        return ${options.point}.apply(self, params)
      }
      __cheap_initFunction__(__cheap_run__)
  `;
  } else if (options.type === 'module') {
    source += `
      import __cheap_initModule__ from 'cheap/thread/initModule'
      __cheap_initModule__(__webpack_exports__)
  `;
  }
  callback(null, source);
};
//# sourceMappingURL=loader.js.map