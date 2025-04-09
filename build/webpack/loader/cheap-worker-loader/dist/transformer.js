"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = _default;
var _typescript = _interopRequireDefault(require("typescript"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function _default(program, options) {
  return context => {
    return file => {
      const visitor = node => {
        return _typescript.default.visitEachChild(node, visitor, context);
      };
      return file;
    };
  };
}
//# sourceMappingURL=transformer.js.map