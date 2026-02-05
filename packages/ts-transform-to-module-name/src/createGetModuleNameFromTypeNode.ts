import { GetModuleNameFromTypeNode } from "./AdditionalTransformFactory";
import type { ImportsInfo } from "./getImportsInfo";
import { getTypeNameOrModuleName } from "./getTypeNameOrModuleName";
import { getModuleName } from "./getModuleName";
import { TTypeScript } from "./ts";
import { SourceFile } from "typescript";

export interface StartLength {
  start: number;
  length: number;
}

export type RaiseUnsupportedTypeNodeDiagnostic = (startLength: StartLength, member: string) => void;

function createGetModuleNameFromTypeNode(
  ts: TTypeScript,
  importsInfo: ImportsInfo,
  raiseUnsupportedTypeNodeDiagnostic: RaiseUnsupportedTypeNodeDiagnostic,
  sourceFile: SourceFile,
): GetModuleNameFromTypeNode {
  return (typeNode, member) => {
    const typeNameOrModuleName = getTypeNameOrModuleName(ts, typeNode, sourceFile);
    const startLength = { start: typeNameOrModuleName.start, length: typeNameOrModuleName.length };
    if (!typeNameOrModuleName.supported) {
      raiseUnsupportedTypeNodeDiagnostic(startLength, member);
    } else {
      const moduleName = getModuleName(typeNameOrModuleName, importsInfo);
      if (moduleName !== undefined) {
        return moduleName;
      } else {
        raiseUnsupportedTypeNodeDiagnostic(startLength, member);
      }
    }
  };
}

export default createGetModuleNameFromTypeNode;
