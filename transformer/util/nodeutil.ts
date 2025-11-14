import ts from 'typescript'
import * as constant from '../constant'
import statement from '../statement'
import * as typeUtils from './typeutil'
import { AtomicCall, BuiltinBigInt, BuiltinFloat, BuiltinType, BuiltinUint } from '../defined'
import { atomicsPath } from '../constant'
import { is, array } from '@libmedia/common'

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
    if (typeUtils.isPointerType(type, root)) {
      return true
    }
    root = root.parent
  }

  if (!root) {
    return false
  }

  const type = statement.typeChecker.getTypeAtLocation(root)
  if (typeUtils.isPointerType(type, root)) {
    return true
  }

  return false
}

export function isExpressionSmartPointer(node: ts.PropertyAccessExpression | ts.Identifier) {
  let root = getPropertyAccessExpressionRootNode(node)

  while (root && root !== node) {
    const type = statement.typeChecker.getTypeAtLocation(root)
    if (typeUtils.isSmartPointerType(type)) {
      return true
    }
    root = root.parent
  }

  if (!root) {
    return false
  }

  const type = statement.typeChecker.getTypeAtLocation(root)
  if (typeUtils.isSmartPointerType(type)) {
    return true
  }

  return false
}

export function getSizeExpressionType(node: ts.Node) {
  if (ts.isBinaryExpression(node)) {
    const type = statement.typeChecker.getTypeAtLocation(node.right)
    if (typeUtils.isSizeType(type)) {
      return type
    }
    return getSizeExpressionType(node.left)
  }
  return statement.typeChecker.getTypeAtLocation(node)
}

export function getPointerExpressionType(node: ts.Node) {
  if (ts.isBinaryExpression(node)) {
    const type = statement.typeChecker.getTypeAtLocation(node.right)
    if (typeUtils.isPointerType(type, node.right)) {
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
  if (typeUtils.isPointerType(type, node)) {
    return true
  }
  // 检查二元操作符 (pointer 参与的运算结果为 pointer)
  type = getPointerExpressionType(node)
  if (typeUtils.isPointerType(type, node)) {
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

export function isSmartPointerNode(node: ts.Node) {
  // 检查表达式类型
  let type = statement.typeChecker.getTypeAtLocation(node)
  if (typeUtils.isSmartPointerType(type)) {
    return true
  }
  if (ts.isPropertyAccessExpression(node)) {
    return isExpressionSmartPointer(node)
  }
  else if (ts.isElementAccessExpression(node) && ts.isPropertyAccessExpression(node.expression)) {
    return isExpressionSmartPointer(node.expression)
  }
  else if (ts.isElementAccessExpression(node)) {
    return isSmartPointerNode(node.expression)
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
    return typeUtils.isPointerType(type, node.expression.expression) && node.expression.name.escapedText === constant.indexOf
  }
  return false
}

export function isPointerElementAccess(node: ts.Node) {
  return ts.isElementAccessExpression(node) && isPointerNode(node.expression)
}

export function isSmartPointerElementAccess(node: ts.Node) {
  return ts.isElementAccessExpression(node) && isSmartPointerNode(node.expression)
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

export function getBinaryBuiltinTypeName(node: ts.Expression | ts.Identifier) {
  if (!node) {
    return ''
  }
  const type = statement.typeChecker.getTypeAtLocation(node)

  if (typeUtils.isSizeType(type)) {
    return statement.cheapCompilerOptions.defined.WASM_64 ? 'uint64' : 'uint32'
  }
  else if (type.aliasSymbol && array.has(BuiltinType, type.aliasSymbol.escapedName as string)) {
    return type.aliasSymbol.escapedName as string
  }
  else if (typeUtils.isPointerType(type, node)) {
    return statement.cheapCompilerOptions.defined.WASM_64 ? 'uint64' : 'uint32'
  }

  if (node.kind === ts.SyntaxKind.TrueKeyword || node.kind === ts.SyntaxKind.FalseKeyword) {
    return 'bool'
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

  if (type.flags & ts.TypeFlags.Enum || type.flags & ts.TypeFlags.EnumLiteral) {
    return 'int32'
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

export function isAtomicCallExpression(node: ts.CallExpression) {
  const callName = ts.isPropertyAccessExpression(node.expression)
    ? node.expression.name.escapedText
    : (ts.isIdentifier(node.expression)
      ? node.expression.escapedText
      : ''
    )

  if (!array.has(AtomicCall, callName as string)) {
    return false
  }

  const symbol = statement.typeChecker.getSymbolAtLocation(node.expression)
  const file = symbol.valueDeclaration.getSourceFile()
  const atomicPathReg = new RegExp(`${atomicsPath}\\.ts$`)
  return atomicPathReg.test(file.fileName)
}

export function checkConditionCompile(node: ts.Node) {
  if (ts.isParenthesizedExpression(node)) {
    return ts.visitNode(node.expression, checkConditionCompile)
  }
  else if (ts.isPrefixUnaryExpression(node)) {
    return ts.visitNode(node.operand, checkConditionCompile)
  }
  else if (ts.isBinaryExpression(node)) {
    const left = ts.visitNode(node.left, checkConditionCompile)
    if (!left) {
      return false
    }
    return ts.visitNode(node.right, checkConditionCompile)
  }
  if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && (node.expression.escapedText as string) === constant.defined
    || node.kind === ts.SyntaxKind.TrueKeyword
    || node.kind === ts.SyntaxKind.FalseKeyword
  ) {
    return true
  }
  else {
    return false
  }
}

export function hasDefined(node: ts.Node) {
  if (ts.isParenthesizedExpression(node)) {
    return ts.visitNode(node.expression, hasDefined)
  }
  else if (ts.isPrefixUnaryExpression(node)) {
    return ts.visitNode(node.operand, hasDefined)
  }
  else if (ts.isBinaryExpression(node)) {
    return ts.visitNode(node.left, hasDefined) || ts.visitNode(node.right, hasDefined)
  }
  if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && (node.expression.escapedText as string) === constant.defined) {
    return true
  }
  else {
    return false
  }
}

export function createBitInt(value: number) {
  if (statement.cheapCompilerOptions.defined.BIGINT_LITERAL) {
    return statement.context.factory.createBigIntLiteral(value + 'n')
  }
  return statement.context.factory.createCallExpression(
    statement.context.factory.createIdentifier('BigInt'),
    undefined,
    [
      statement.context.factory.createNumericLiteral(value)
    ]
  )
}

export function createPointerOperand(value: number | ts.Expression) {
  if (is.number(value)) {
    if (statement.cheapCompilerOptions.defined.WASM_64) {
      return createBitInt(value)
    }
    return statement.context.factory.createNumericLiteral(value)
  }
  else if (ts.isNumericLiteral(value)) {
    if (statement.cheapCompilerOptions.defined.WASM_64) {
      return createBitInt(+value.text)
    }
    return value
  }
  else if (isBigIntNode(value)) {
    const num = getBigIntValue(value as ts.CallExpression)
    if (statement.cheapCompilerOptions.defined.WASM_64) {
      return createBitInt(Number(num))
    }
    return statement.context.factory.createNumericLiteral(Number(num))
  }
  else {
    const typeName = getBinaryBuiltinTypeName(value)
    if (statement.cheapCompilerOptions.defined.WASM_64
      && (!typeName || !array.has(BuiltinBigInt, typeName) && typeName !== constant.typeSize)
    ) {
      return statement.context.factory.createCallExpression(
        statement.context.factory.createIdentifier('BigInt'),
        undefined,
        [
          value
        ]
      )
    }
    return value
  }
}

export function isBigIntNode(node: ts.Node) {
  return ts.isBigIntLiteral(node)
    || ts.isCallExpression(node)
      && ts.isIdentifier(node.expression)
      && node.expression.escapedText === 'BigInt'
      && node.arguments.length === 1
      && ts.isNumericLiteral(node.arguments[0])
}

export function getBigIntValue(node: ts.BigIntLiteral | ts.CallExpression) {
  if (ts.isBigIntLiteral(node)) {
    return BigInt(node.text.substring(0, node.text.length - 1))
  }
  else {
    return BigInt((node.arguments[0] as ts.NumericLiteral).text)
  }
}

export function getTypeAtLocation(node: ts.Node) {
  if (node.pos >= 0) {
    return statement.typeChecker.getTypeAtLocation(node)
  }
  if (ts.isParenthesizedExpression(node)) {
    return getTypeAtLocation(node.expression)
  }
  return statement.typeChecker.getTypeAtLocation(node)
}

export function isNullPointerNode(node: ts.Node) {
  return ts.isIdentifier(node) && node.escapedText === constant.typeNullptr
}
