
import ts from 'typescript'
import statement, { StageStatus } from '../statement'

export default function (node: ts.ParameterDeclaration, visitor: ts.Visitor): ts.Node | ts.Node[] {

  statement.pushStage(StageStatus.Parameter)

  const newNode = ts.visitEachChild(node, visitor, statement.context)

  statement.popStage()

  return newNode
}
