import ts from 'typescript'

// TypeScript 编译选项
const compilerOptions: ts.CompilerOptions = {
  target: ts.ScriptTarget.ESNext,
  module: ts.ModuleKind.CommonJS,
}

let list: ts.Node[] = []

function transformer(context: ts.TransformationContext) {
  return (node: ts.Node) => {
    function visitor(node: ts.Node) {
      list.push(node)
      return ts.visitEachChild(node, visitor, context)
    }
    return ts.visitNode(node, visitor)
  }
}


function each(node: ts.Node) {
  list = []
  ts.transform(node, [transformer], compilerOptions)
  return list
}

function compareNode(node1: ts.Node, node2: ts.Node) {
  if (node1.kind !== node2.kind) {
    return false
  }
  if (ts.isIdentifier(node1) && ts.isIdentifier(node2) && node1.escapedText !== node2.escapedText) {
    return false
  }
  if (ts.isNumericLiteral(node1) && ts.isNumericLiteral(node2) && +node1.text !== +node2.text) {
    return false
  }
  if (ts.isStringLiteral(node1) && ts.isStringLiteral(node2) && node1.text !== node2.text) {
    return false
  }
  return true
}

export default function compare(node1: ts.Node, node2: ts.Node) {
  const list1: ts.Node[] = each(node1)
  const list2: ts.Node[] = each(node2)

  if (list1.length === list2.length) {
    if (list1.length) {
      for (let i = 0; i < list1.length; i++) {
        if (!compareNode(list1[i], list2[i])) {
          return false
        }
      }
    }
    return true
  }

  return false
}
