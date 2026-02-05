import { TypeNode } from "typescript";
import { TTypeScript } from "./ts";
import getTypeAliasModuleName from "./getTypeAliasModuleName";

interface TypeNameOrModuleNameBase {
  start: number;
  length: number;
  supported: boolean;
}

interface UnsupportedTypeNameOrModuleNameBase extends TypeNameOrModuleNameBase {
  supported: false;
}

export interface TypeNameOrModuleName extends TypeNameOrModuleNameBase {
  typeNameOrModuleName: string;
  isTypeName: boolean;
  supported: true;
}

// the generic in transformToModuleName<T> or jest.mock<T>
export function getTypeNameOrModuleName(
  ts: TTypeScript,
  typeNode: TypeNode,
): TypeNameOrModuleName | UnsupportedTypeNameOrModuleNameBase {
  const start = typeNode.getStart();
  const length = typeNode.getEnd() - start;

  // <T>
  if (ts.isTypeReferenceNode(typeNode)) {
    /*
      interface TypeReferenceNode extends NodeWithTypeArguments {
          readonly kind: SyntaxKind.TypeReference;
          readonly typeName: EntityName;
      }
      type EntityName = Identifier | QualifiedName;
      interface QualifiedName extends Node, FlowContainer {
        readonly kind: SyntaxKind.QualifiedName;
        readonly left: EntityName;
        readonly right: Identifier;
      }
    */
    return {
      typeNameOrModuleName: typeNode.typeName.getText(),
      isTypeName: true,
      start,
      length,
      supported: true,
    };
  }
  // <typeof ...>
  if (ts.isTypeQueryNode(typeNode)) {
    return {
      typeNameOrModuleName: typeNode.exprName.getText(),
      isTypeName: true,
      start,
      length,
      supported: true,
    };
  }
  const moduleName = getTypeAliasModuleName(ts, typeNode);
  if (moduleName !== undefined) {
    return {
      typeNameOrModuleName: moduleName,
      isTypeName: false,
      start,
      length,
      supported: true,
    };
  }

  // if specify <{a:number}> is TypeLiteral

  return {
    start,
    length,
    supported: false,
  };
}
