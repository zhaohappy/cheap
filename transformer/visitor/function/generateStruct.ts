import type ts from 'typescript'
import * as is from 'common/util/is'
import type { Struct} from '../../struct'
import { StructType } from '../../struct'
import statement from '../../statement'
import * as constant from '../../constant'
import relativePath from '../../function/relativePath'
import { KeyMetaKey } from '../../../typedef'

export default function generateStruct(struct: Struct) {

  const definedMetaProperty = statement.addIdentifierImport(constant.definedMetaProperty, constant.definedMetaPropertyPath, true)
  const symbolStruct = statement.addSymbolImport(constant.symbolStruct)
  const symbolStructMaxBaseTypeByteLength = statement.addSymbolImport(constant.symbolStructMaxBaseTypeByteLength)
  const symbolStructLength = statement.addSymbolImport(constant.symbolStructLength)
  const symbolStructKeysMeta = statement.addSymbolImport(constant.symbolStructKeysMeta)

  const list: ts.Statement[] = []

  // const map = new Map()
  list.push(statement.context.factory.createVariableStatement(
    undefined,
    statement.context.factory.createVariableDeclarationList([
      statement.context.factory.createVariableDeclaration(
        statement.context.factory.createIdentifier('map'),
        undefined,
        undefined,
        statement.context.factory.createNewExpression(
          statement.context.factory.createIdentifier('Map'),
          undefined,
          []
        )
      )
    ])
  ))

  const meta = struct.meta
  meta.forEach((data, key) => {
    let type: ts.PropertyAssignment | ts.GetAccessorDeclaration
    if (is.func(data.getTypeMeta)) {
      if (data.typeIdentifier) {
        const targetSource = data.getTypeMeta()?.symbol.deref().valueDeclaration.getSourceFile()
        if (targetSource && targetSource.fileName !== statement.currentFile.fileName) {
          type = statement.context.factory.createPropertyAssignment(
            statement.context.factory.createNumericLiteral(KeyMetaKey.Type),
            statement.addIdentifierImport(
              data.typeIdentifier,
              relativePath(statement.currentFile.fileName, targetSource.fileName),
              !statement.typeChecker.getSymbolAtLocation(targetSource).exports?.has(data.typeIdentifier as ts.__String)
            )
          )
        }
        else {
          if (statement.hasStruct(data.typeIdentifier)) {
            type = statement.context.factory.createPropertyAssignment(
              statement.context.factory.createNumericLiteral(KeyMetaKey.Type),
              statement.context.factory.createIdentifier(data.typeIdentifier)
            )
          }
          else {
            type = statement.context.factory.createGetAccessorDeclaration(
              undefined,
              statement.context.factory.createNumericLiteral(KeyMetaKey.Type),
              [],
              undefined,
              statement.context.factory.createBlock(
                [statement.context.factory.createReturnStatement(statement.context.factory.createIdentifier(data.typeIdentifier))],
                false
              )
            )
          }
        }
      }
      else {
        const inlineStruct = data.getTypeMeta()
        if (inlineStruct && inlineStruct.structType === StructType.INLINE_OBJECT) {
          const body = generateStruct(inlineStruct)
          body.push(statement.context.factory.createReturnStatement(statement.context.factory.createIdentifier(constant.prototype)))
          type = statement.context.factory.createPropertyAssignment(
            statement.context.factory.createNumericLiteral(KeyMetaKey.Type),
            statement.context.factory.createCallExpression(
              statement.context.factory.createParenthesizedExpression(statement.context.factory.createFunctionExpression(
                undefined,
                undefined,
                undefined,
                undefined,
                [
                  statement.context.factory.createParameterDeclaration(
                    undefined,
                    undefined,
                    statement.context.factory.createIdentifier(constant.prototype)
                  )
                ],
                undefined,
                // @ts-ignore
                statement.context.factory.createBlock(body, true)
              )),
              undefined,
              [
                statement.context.factory.createObjectLiteralExpression()
              ]
            )
          )
        }
        else {
          return true
        }
      }
    }
    else {
      type = statement.context.factory.createPropertyAssignment(
        statement.context.factory.createNumericLiteral(KeyMetaKey.Type),
        statement.context.factory.createNumericLiteral(data[KeyMetaKey.Type] as number)
      )
    }

    list.push(statement.context.factory.createExpressionStatement(statement.context.factory.createCallExpression(
      statement.context.factory.createPropertyAccessExpression(
        statement.context.factory.createIdentifier('map'),
        statement.context.factory.createIdentifier('set')
      ),
      undefined,
      [
        statement.context.factory.createStringLiteral(key),
        statement.context.factory.createObjectLiteralExpression([
          type,
          statement.context.factory.createPropertyAssignment(
            statement.context.factory.createNumericLiteral(KeyMetaKey.Pointer),
            statement.context.factory.createNumericLiteral(data[KeyMetaKey.Pointer])
          ),
          statement.context.factory.createPropertyAssignment(
            statement.context.factory.createNumericLiteral(KeyMetaKey.PointerLevel),
            statement.context.factory.createNumericLiteral(data[KeyMetaKey.PointerLevel])
          ),
          statement.context.factory.createPropertyAssignment(
            statement.context.factory.createNumericLiteral(KeyMetaKey.Array),
            statement.context.factory.createNumericLiteral(data[KeyMetaKey.Array])
          ),
          statement.context.factory.createPropertyAssignment(
            statement.context.factory.createNumericLiteral(KeyMetaKey.ArrayLength),
            statement.context.factory.createNumericLiteral(data[KeyMetaKey.ArrayLength])
          ),
          statement.context.factory.createPropertyAssignment(
            statement.context.factory.createNumericLiteral(KeyMetaKey.BitField),
            statement.context.factory.createNumericLiteral(data[KeyMetaKey.BitField])
          ),
          statement.context.factory.createPropertyAssignment(
            statement.context.factory.createNumericLiteral(KeyMetaKey.BitFieldLength),
            statement.context.factory.createNumericLiteral(data[KeyMetaKey.BitFieldLength])
          ),
          statement.context.factory.createPropertyAssignment(
            statement.context.factory.createNumericLiteral(KeyMetaKey.BaseAddressOffset),
            statement.context.factory.createNumericLiteral(data[KeyMetaKey.BaseAddressOffset])
          ),
          statement.context.factory.createPropertyAssignment(
            statement.context.factory.createNumericLiteral(KeyMetaKey.BaseBitOffset),
            statement.context.factory.createNumericLiteral(data[KeyMetaKey.BaseBitOffset])
          )
        ])
      ]
    )))
  })

  // definedMetaProperty(proto, symbolStruct, true)
  list.push(statement.context.factory.createExpressionStatement(statement.context.factory.createCallExpression(
    definedMetaProperty,
    undefined,
    [
      statement.context.factory.createIdentifier(constant.prototype),
      symbolStruct,
      statement.context.factory.createTrue()
    ]
  )))

  // definedMetaProperty(proto, symbolStructMaxBaseTypeByteLength, 0)
  list.push(statement.context.factory.createExpressionStatement(statement.context.factory.createCallExpression(
    definedMetaProperty,
    undefined,
    [
      statement.context.factory.createIdentifier(constant.prototype),
      symbolStructMaxBaseTypeByteLength,
      statement.context.factory.createNumericLiteral(struct.maxBaseTypeByteLength)
    ]
  )))

  // definedMetaProperty(proto, symbolStructLength, 0)
  list.push(statement.context.factory.createExpressionStatement(statement.context.factory.createCallExpression(
    definedMetaProperty,
    undefined,
    [
      statement.context.factory.createIdentifier(constant.prototype),
      symbolStructLength,
      statement.context.factory.createNumericLiteral(struct.length)
    ]
  )))

  // definedMetaProperty(proto, symbolStructKeysMeta, map)
  list.push(statement.context.factory.createExpressionStatement(statement.context.factory.createCallExpression(
    definedMetaProperty,
    undefined,
    [
      statement.context.factory.createIdentifier(constant.prototype),
      symbolStructKeysMeta,
      statement.context.factory.createIdentifier('map')
    ]
  )))

  return list
}
