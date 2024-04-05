import ts from 'typescript';
export default function (program, options) {
  return (context) => {
    return (file) => {
      const visitor = (node) => {
        return ts.visitEachChild(node, visitor, context);
      };
      return file;
    };
  };
}
