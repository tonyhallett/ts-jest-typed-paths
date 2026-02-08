import { ModuleNameFromTypeNode } from "./AdditionalTransformFactory";
import type { ImportsInfo } from "./getImportsInfo";
import { getTypeNameOrModuleName } from "./getTypeNameOrModuleName";
import { getModuleName } from "./getModuleName";
import { SourceFileTs } from "./common-types";

export interface StartLength {
  start: number;
  length: number;
}

export type RaiseUnsupportedTypeNodeDiagnostic = (startLength: StartLength, member: string) => void;

function createModuleNameFromTypeNode(
  sourceFileTs: SourceFileTs,
  importsInfo: ImportsInfo,
  raiseUnsupportedTypeNodeDiagnostic: RaiseUnsupportedTypeNodeDiagnostic,
): ModuleNameFromTypeNode {
  return (typeNode, member) => {
    const typeNameOrModuleName = getTypeNameOrModuleName(sourceFileTs, typeNode);
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

export default createModuleNameFromTypeNode;
