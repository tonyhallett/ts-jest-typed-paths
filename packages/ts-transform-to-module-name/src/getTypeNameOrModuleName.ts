import { SourceFile, TypeNode } from "typescript";
import { TTypeScript } from "./ts";
import tryGetImportTypeNodeModuleName from "./tryGetImportTypeNodeModuleName";

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
  sourceFile: SourceFile,
): TypeNameOrModuleName | UnsupportedTypeNameOrModuleNameBase {
  const start = typeNode.getStart(sourceFile);
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
    const identifier = ts.isIdentifier(typeNode.typeName)
      ? typeNode.typeName
      : typeNode.typeName.left;

    return {
      typeNameOrModuleName: identifier.getText(sourceFile),
      isTypeName: true,
      start,
      length,
      supported: true,
    };
  }
  // <typeof ...>
  if (ts.isTypeQueryNode(typeNode)) {
    return {
      typeNameOrModuleName: typeNode.exprName.getText(sourceFile),
      isTypeName: true,
      start,
      length,
      supported: true,
    };
  }
  const moduleName = tryGetImportTypeNodeModuleName(ts, typeNode);
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
