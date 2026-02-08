import ts from "typescript";
import { ModuleNameFromTypeNode } from "./AdditionalTransformFactory";
import { tryGetTransformToModuleNameTypeNode } from "./transformToModuleName-ast";
import { TTypeScript } from "./ts";

const tryTransformToModuleName = (
  ts: TTypeScript,
  node: ts.Node,
  transformToModuleNameName: string | undefined,
  moduleNameFromTypeNode: ModuleNameFromTypeNode,
): ts.StringLiteral | undefined => {
  const transformToModuleNameTypeNode = tryGetTransformToModuleNameTypeNode(
    ts,
    node,
    transformToModuleNameName,
  );
  if (transformToModuleNameTypeNode) {
    const moduleName = moduleNameFromTypeNode(
      transformToModuleNameTypeNode,
      transformToModuleNameName!,
    );

    if (moduleName) {
      return ts.factory.createStringLiteral(moduleName);
    }
  }

  return undefined;
};

export default tryTransformToModuleName;
