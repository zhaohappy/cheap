module.exports = function(source) {
    let callback = this.async();
    callback(null, source);
};