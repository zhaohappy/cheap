
import ts from 'typescript'
import statement from '../statement'

export default function (node: ts.FunctionDeclaration, visitor: ts.Visitor): ts.Node | ts.Node[] {

  if (node.name) {
    statement.addFunc(node.name.escapedText as string, node)
  }

  statement.pushStack()

  let newNode = ts.visitEachChild(node, visitor, statement.context)

  statement.popStack()

  return newNode
}
