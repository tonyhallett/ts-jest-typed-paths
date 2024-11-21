import { TTypeScript } from "ts-jest";
import { TypeNode } from "typescript";
import { getTypeAliasModuleName } from "./helpers";

interface TypeNameOrModuleNameBase {
  start: number;
  length: number;
  supported: boolean;
}

interface UnsupportedTypeNameOrModuleNameBase extends TypeNameOrModuleNameBase {
  supported: false;
}

interface TypeNameOrModuleName extends TypeNameOrModuleNameBase {
  typeNameOrModuleName: string;
  isTypeName: boolean;
  supported: true;
}

// the generic in transformToPath<T> or jest.mock<T>
export function getTypeNameOrModuleName(
  ts: TTypeScript,
  typeArgument: TypeNode
): TypeNameOrModuleName | UnsupportedTypeNameOrModuleNameBase {
  const start = typeArgument.getStart();
  const length = typeArgument.getEnd() - start;
  if (ts.isTypeReferenceNode(typeArgument)) {
    return {
      typeNameOrModuleName: typeArgument.typeName.getText(),
      isTypeName: true,
      start,
      length,
      supported: true,
    };
  }
  if (ts.isTypeQueryNode(typeArgument)) {
    return {
      typeNameOrModuleName: typeArgument.exprName.getText(),
      isTypeName: true,
      start,
      length,
      supported: true,
    };
  }
  const moduleName = getTypeAliasModuleName(ts, typeArgument);
  if (moduleName !== undefined) {
    return {
      typeNameOrModuleName: moduleName,
      isTypeName: false,
      start,
      length,
      supported: true,
    };
  }
  return {
    start,
    length,
    supported: false,
  };
}
