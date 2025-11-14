module.exports = function(source) {
  let callback = this.async();

  const options = this.getOptions
    ? this.getOptions()
    : require('loader-utils-webpack-v4').getOptions(this);

  source += `
    import __cheap_runThread__ from '@libmedia/cheap/runThread'
    __cheap_runThread__(${options.type === 'module' ? '__webpack_exports__' : options.point})
  `;

  callback(null, source);
};