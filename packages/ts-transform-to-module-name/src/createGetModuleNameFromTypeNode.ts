import { GetModuleNameFromTypeNode } from "./AdditionalTransformFactory";
import { ImportsInfo } from "./getImportsInfo";
import { getTypeNameOrModuleName } from "./getTypeNameOrModuleName";
import { getModuleName } from "./getModuleName";
import { TTypeScript } from "./ts";

export interface StartLength {
  start: number;
  length: number;
}

export type RaiseUnsupportedTypeNodeDiagnostic = (startLength: StartLength, member: string) => void;

function createGetModuleNameFromTypeNode(
  ts: TTypeScript,
  importsInfo: ImportsInfo,
  raiseUnsupportedTypeNodeDiagnostic: RaiseUnsupportedTypeNodeDiagnostic,
): GetModuleNameFromTypeNode {
  return (typeNode, member) => {
    const typeNameOrModuleName = getTypeNameOrModuleName(ts, typeNode);

    if (!typeNameOrModuleName.supported) {
      raiseUnsupportedTypeNodeDiagnostic(typeNameOrModuleName, member);
    } else {
      const moduleName = getModuleName(typeNameOrModuleName, importsInfo);
      if (moduleName !== undefined) {
        return moduleName;
      } else {
        raiseUnsupportedTypeNodeDiagnostic(typeNameOrModuleName, member);
      }
    }
  };
}

export default createGetModuleNameFromTypeNode;
