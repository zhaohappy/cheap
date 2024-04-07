import ts from 'typescript'
import * as constant from '../constant'
import statement from '../statement'
import * as typeUtils from './typeutil'
import * as array from 'common/util/array'
import { BuiltinBigInt, BuiltinFloat, BuiltinType, BuiltinUint, Type2CTypeEnum } from '../defined'
import { CTypeEnum2Bytes } from 'cheap/typedef'

export function getEqualsBinaryExpressionRight(node: ts.BinaryExpression) {
  if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.EqualsToken) {
    return getEqualsBinaryExpressionRight(node.right as ts.BinaryExpression)
  }
  return node
}


export function isExpressionPointer(node: ts.PropertyAccessExpression | ts.Identifier) {
  let root = getPropertyAccessExpressionRootNode(node)

  while (root && root !== node) {
    const type = statement.typeChecker.getTypeAtLocation(root)
    if (typeUtils.isPointerType(type)) {
      return true
    }
    root = root.parent
  }

  if (!root) {
    return false
  }

  const type = statement.typeChecker.getTypeAtLocation(root)
  if (typeUtils.isPointerType(type)) {
    return true
  }

  return false
}

export function getPointerExpressionType(node: ts.Node) {
  if (ts.isBinaryExpression(node)) {
    const type = statement.typeChecker.getTypeAtLocation(node.right)
    if (typeUtils.isPointerType(type)) {
      return type
    }
    return getPointerExpressionType(node.left)
  }
  return statement.typeChecker.getTypeAtLocation(node)
}

export function isPointerNode(node: ts.Node) {

  if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.EqualsToken) {
    return isPointerNode(node.left) || isPointerNode(node.right)
  }

  // 检查表达式类型
  let type = statement.typeChecker.getTypeAtLocation(node)
  if (typeUtils.isPointerType(type)) {
    return true
  }
  // 检查二元操作符 (pointer 参与的运算结果为 pointer)
  type = getPointerExpressionType(node)
  if (typeUtils.isPointerType(type)) {
    return true
  }

  // 检查属性访问中是否有 pointer
  if (ts.isPropertyAccessExpression(node)) {
    return isExpressionPointer(node)
  }
  // xx.xx[]
  else if (ts.isElementAccessExpression(node) && ts.isPropertyAccessExpression(node.expression)) {
    return isExpressionPointer(node.expression)
  }
  // xx[][]
  else if (ts.isElementAccessExpression(node)) {
    return isPointerNode(node.expression)
  }
  return false
}

export function isJSDocTypeAlias(node: ts.Node) {
  return node.kind === ts.SyntaxKind.JSDocTypedefTag || node.kind === ts.SyntaxKind.JSDocCallbackTag || node.kind === ts.SyntaxKind.JSDocEnumTag
}

export function getContainerNode(node: ts.Node) {
  if (isJSDocTypeAlias(node)) {
    node = node.parent.parent
  }
  while (true) {
    node = node.parent
    if (!node) {
      return void 0
    }
    switch (node.kind) {
      case ts.SyntaxKind.SourceFile:
      case ts.SyntaxKind.MethodDeclaration:
      case ts.SyntaxKind.MethodSignature:
      case ts.SyntaxKind.FunctionDeclaration:
      case ts.SyntaxKind.FunctionExpression:
      case ts.SyntaxKind.GetAccessor:
      case ts.SyntaxKind.SetAccessor:
      case ts.SyntaxKind.ClassDeclaration:
      case ts.SyntaxKind.InterfaceDeclaration:
      case ts.SyntaxKind.EnumDeclaration:
      case ts.SyntaxKind.ModuleDeclaration:
        return node
    }
  }
}

export function isParseTreeNode(node: ts.Node) {
  return (node.flags & ts.NodeFlags.Synthesized) === 0
}
export function getParseTreeNode(node: ts.Node, nodeTest?: (node: ts.Node) => boolean) {
  if (node == null || isParseTreeNode(node)) {
    return node
  }
  node = ts.getOriginalNode(node)
  while (node) {
    if (isParseTreeNode(node)) {
      return !nodeTest || nodeTest(node) ? node : undefined
    }
    node = ts.getOriginalNode(node)
  }
}

export function isPointerIndexOfCall(node: ts.CallExpression) {
  if (ts.isPropertyAccessExpression(node.expression)) {
    const type = statement.typeChecker.getTypeAtLocation(node.expression.expression)
    return typeUtils.isPointerType(type) && node.expression.name.escapedText === constant.indexOf
  }
  return false
}

export function isPointerElementAccess(node: ts.Node) {
  return ts.isElementAccessExpression(node) && isPointerNode(node.expression)
}

export function getPropertyAccessExpressionRootNode(node: ts.Node) {
  if (ts.isPropertyAccessExpression(node)
   || ts.isCallExpression(node)
   || ts.isElementAccessExpression(node)
  ) {
    return getPropertyAccessExpressionRootNode(node.expression)
  }
  return node
}

export function getParameterDefaultValue(symbol: ts.Symbol, index: number) {
  const declarations = symbol.declarations
  if (declarations?.length) {
    for (let i = 0; i < declarations.length; i++) {
      const declaration = declarations[i]
      if ((ts.isFunctionDeclaration(declaration)
          || ts.isMethodDeclaration(declaration)
      )
        && declaration.parameters
        && declaration.parameters[index]?.initializer
      ) {
        return declaration.parameters[index].initializer
      }
    }
  }
}

export function checkBool(node: ts.Node, visitor: ts.Visitor) {
  function compute(node: ts.Node) {
    if (ts.isParenthesizedExpression(node)) {
      return ts.visitNode(node.expression, compute)
    }
    else if (ts.isPrefixUnaryExpression(node)) {
      if (node.operator === ts.SyntaxKind.ExclamationToken) {
        return !ts.visitNode(node.operand, compute)
      }
      return true
    }
    else if (ts.isBinaryExpression(node)) {
      const left = ts.visitNode(node.left, compute)
      const right = ts.visitNode(node.right, compute)

      if (node.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken) {
        return left && right
      }
      else if (node.operatorToken.kind === ts.SyntaxKind.BarBarToken) {
        return left || right
      }
      return true
    }
    else {
      const newNode = ts.visitNode(node, visitor)
      if (newNode.kind === ts.SyntaxKind.TrueKeyword) {
        return true
      }
      else if (newNode.kind === ts.SyntaxKind.FalseKeyword) {
        return false
      }
      else if (ts.isNumericLiteral(newNode)) {
        return (+newNode.text) !== 0
      }
      else if (ts.isStringLiteral(newNode)) {
        return newNode.text !== ''
      }
      return true
    }
  }
  return ts.visitNode(node, compute)
}

export function createPlusExpress(tree: ts.Node, right: ts.Node) {
  // 合并 a + 2 + 3
  if (ts.isBinaryExpression(tree)
    && tree.operatorToken.kind === ts.SyntaxKind.PlusToken
    && (ts.isNumericLiteral(tree.right) || ts.isNumericLiteral(tree.left))
    && ts.isNumericLiteral(right)
  ) {
    if (ts.isNumericLiteral(tree.right)) {
      return statement.context.factory.createBinaryExpression(
        tree.left,
        ts.SyntaxKind.PlusToken,
        statement.context.factory.createNumericLiteral((+tree.right.text) + (+right.text))
      )
    }
    else if (ts.isNumericLiteral(tree.left)) {
      return statement.context.factory.createBinaryExpression(
        statement.context.factory.createNumericLiteral((+tree.left.text) + (+right.text)),
        ts.SyntaxKind.PlusToken,
        tree.right
      )
    }
  }
  return statement.context.factory.createBinaryExpression(
    tree as ts.Expression,
    ts.SyntaxKind.PlusToken,
    right as ts.Expression
  )
}

export function getBinaryBuiltinTypeName(node: ts.Expression | ts.Identifier) {
  if (!node) {
    return ''
  }
  const type = statement.typeChecker.getTypeAtLocation(node)
  if (type.aliasSymbol && array.has(BuiltinType, type.aliasSymbol.escapedName as string)) {
    return type.aliasSymbol.escapedName as string
  }

  if (ts.isBinaryExpression(node)) {
    const leftType = getBinaryBuiltinTypeName(node.left)
    const rightType = getBinaryBuiltinTypeName(node.right)
    if (array.has(BuiltinFloat, leftType)) {
      return leftType
    }
    if (array.has(BuiltinFloat, rightType)) {
      return rightType
    }
    if (array.has(BuiltinBigInt, leftType)) {
      if (node.operatorToken.kind === ts.SyntaxKind.MinusToken) {
        return 'int64'
      }
      return leftType
    }
    if (array.has(BuiltinBigInt, rightType)) {
      if (node.operatorToken.kind === ts.SyntaxKind.MinusToken) {
        return 'int64'
      }
      return rightType
    }

    if (node.operatorToken.kind === ts.SyntaxKind.MinusToken) {
      return 'int32'
    }
    return 'uint32'
  }

  if (type.flags & ts.TypeFlags.BigInt || type.flags & ts.TypeFlags.BigIntLiteral) {
    if (type.flags & ts.TypeFlags.BigIntLiteral) {
      if (node.parent && ts.isPrefixUnaryExpression(node.parent) && node.parent.operator === ts.SyntaxKind.MinusToken) {
        return 'int64'
      }
    }
    if (type.flags & ts.TypeFlags.BigInt) {
      if (ts.isCallExpression(node) && node.arguments[0]) {
        const type = getBinaryBuiltinTypeName(node.arguments[0])
        if (!array.has(BuiltinUint, type)) {
          return 'int64'
        }
      }
    }
    return 'uint64'
  }

  if (type.flags & ts.TypeFlags.Number || type.flags & ts.TypeFlags.NumberLiteral) {

    if (type.flags & ts.TypeFlags.NumberLiteral) {
      // @ts-ignore
      if ((type.value + '').indexOf('.') > -1) {
        return 'double'
      }
      if (node.parent && ts.isPrefixUnaryExpression(node.parent) && node.parent.operator === ts.SyntaxKind.MinusToken) {
        return 'int32'
      }

      if (type.flags & ts.TypeFlags.Number) {
        if (ts.isCallExpression(node) && node.arguments[0]) {
          const type = getBinaryBuiltinTypeName(node.arguments[0])
          if (!array.has(BuiltinUint, type)) {
            return 'int32'
          }
        }
      }
      return 'uint32'
    }
    return 'double'
  }
  if (type.isUnion()) {
    for (let i = 0; i < type.types.length; i++) {
      if (type.types[i].aliasSymbol && array.has(BuiltinType, type.types[i].aliasSymbol.escapedName as string)) {
        return type.types[i].aliasSymbol.escapedName as string
      }
    }
  }
  return ''
}

export function getParentMethodDeclaration(node: ts.ClassDeclaration | ts.InterfaceDeclaration, method: string): ts.MethodDeclaration {
  if (node.members?.length) {
    for (let i = 0; i < node.members.length; i++) {
      if (ts.isMethodDeclaration(node.members[i])
        && ts.isIdentifier(node.members[i].name)
        && (node.members[i].name as ts.Identifier).escapedText === method
      ) {
        return node.members[i] as ts.MethodDeclaration
      }
    }
  }
  if (node.heritageClauses) {
    for (let i = 0; i < node.heritageClauses.length; i++) {
      const types = node.heritageClauses[i].types
      for (let j = 0; j < types.length; j++) {
        if (ts.isExpressionWithTypeArguments(types[j])) {
          const type = statement.typeChecker.getTypeAtLocation(types[j].expression)
          if (type?.symbol
            && type.symbol.valueDeclaration
            && (ts.isClassDeclaration(type.symbol.valueDeclaration)
              || ts.isInterfaceDeclaration(type.symbol.valueDeclaration)
            )
          ) {
            const declaration = getParentMethodDeclaration(type.symbol.valueDeclaration, method)
            if (declaration) {
              return declaration
            }
          }
        }
      }
    }
  }
}

export function isSynchronizeFunction(node: ts.FunctionDeclaration | ts.FunctionExpression | ts.ArrowFunction | ts.MethodDeclaration) {
  if (!node) {
    return false
  }
  if (node.modifiers) {
    for (let i = 0; i < node.modifiers.length; i++) {
      const modifier = node.modifiers[i]
      if (ts.isDecorator(modifier)
        && ts.isIdentifier(modifier.expression)
        && modifier.expression.escapedText === constant.cdeasync
      ) {
        return true
      }
    }
  }
  if (node.name && ts.isIdentifier(node.name) && ts.isClassDeclaration(node.parent) && node.parent.heritageClauses) {
    for (let i = 0; i < node.parent.heritageClauses.length; i++) {
      for (let i = 0; i < node.parent.heritageClauses.length; i++) {
        const types = node.parent.heritageClauses[i].types
        for (let j = 0; j < types.length; j++) {
          if (ts.isExpressionWithTypeArguments(types[j])) {
            const type = statement.typeChecker.getTypeAtLocation(types[j].expression)
            if (type?.symbol
              && type.symbol.valueDeclaration
              && (ts.isClassDeclaration(type.symbol.valueDeclaration)
                || ts.isInterfaceDeclaration(type.symbol.valueDeclaration)
              )
            ) {
              const declaration = getParentMethodDeclaration(type.symbol.valueDeclaration, node.name.escapedText as string)
              if (declaration) {
                return isSynchronizeFunction(declaration)
              }
            }
          }
        }
      }
    }
  }
  return false
}
