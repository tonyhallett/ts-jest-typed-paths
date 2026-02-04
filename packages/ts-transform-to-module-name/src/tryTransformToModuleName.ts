import ts from "typescript";
import { GetModuleNameFromTypeNode } from "./AdditionalTransformFactory";
import { tryGetTransformToModuleNameTypeNode } from "./transformToModuleName-ast";
import { TTypeScript } from "./ts";

const tryTransformToModuleName = (
  ts: TTypeScript,
  node: ts.Node,
  transformToModuleNameName: string | undefined,
  getModuleNameFromTypeNode: GetModuleNameFromTypeNode,
): ts.StringLiteral | undefined => {
  const transformToModuleNameTypeNode = tryGetTransformToModuleNameTypeNode(
    ts,
    node,
    transformToModuleNameName,
  );
  if (transformToModuleNameTypeNode) {
    const moduleName = getModuleNameFromTypeNode(
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
