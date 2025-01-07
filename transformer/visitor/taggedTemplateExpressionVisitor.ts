
import ts from 'typescript'
import statement from '../statement'
import * as constant from '../constant'
import processAsm from './function/processAsm'

export default function (node: ts.TaggedTemplateExpression, visitor: ts.Visitor): ts.Node {
  if (ts.isIdentifier(node.tag) && (node.tag.escapedText === constant.tagAsm || node.tag.escapedText === constant.tagAsm64)) {
    const template = ts.visitNode(node.template, visitor) as ts.TemplateExpression
    return processAsm(template, node, node.tag.escapedText === constant.tagAsm64)
  }
  return ts.visitEachChild(node, visitor, statement.context)
}
