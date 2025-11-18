
import ts from 'typescript'
import { array } from '@libmedia/common'
import statement, { BlockType } from '../statement'
import * as nodeUtils from '../util/nodeutil'

export default function (node: ts.Block, visitor: ts.Visitor): ts.Node {

  let type = BlockType.UNKNOWN

  if (node.parent) {
    if (ts.isFunctionDeclaration(node.parent)
      || ts.isFunctionExpression(node.parent)
      || ts.isArrowFunction(node.parent)
      || ts.isMethodDeclaration(node.parent)
    ) {
      type = BlockType.FUNCTION
    }
    else if (ts.isIfStatement(node.parent)) {
      type = BlockType.IF
    }
    else if (ts.isForStatement(node.parent) || ts.isForOfStatement(node.parent) || ts.isWhileStatement(node.parent)) {
      type = BlockType.LOOP
    }
  }

  statement.pushStack(type)

  if (statement.cheapCompilerOptions.defined.ENABLE_SYNCHRONIZE_API
    && node.parent
    && (ts.isFunctionDeclaration(node.parent)
      || ts.isFunctionExpression(node.parent)
      || ts.isArrowFunction(node.parent)
      || ts.isMethodDeclaration(node.parent)
    )
    && nodeUtils.isSynchronizeFunction(node.parent)
  ) {
    statement.getCurrentStack().synchronize = true
  }

  let nodes = ts.visitEachChild(node, visitor, statement.context)

  const stack = statement.getCurrentStack()

  const updatedStatements = []
  array.each(stack.topDeclaration, (item) => {
    updatedStatements.push(statement.context.factory.createVariableStatement(
      undefined,
      statement.context.factory.createVariableDeclarationList([
        statement.context.factory.createVariableDeclaration(item.formatName, undefined, undefined, item.initializer)
      ])
    ))
  })

  if (updatedStatements.length) {
    nodes = statement.context.factory.createBlock(
      [...updatedStatements, ...nodes.statements],
      true
    )
  }

  statement.popStack()

  return nodes
}
