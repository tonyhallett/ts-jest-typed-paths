import { ModuleNameFromTypeNode, RaiseDiagnostic } from "./AdditionalTransformFactory";
import createRaiseUnsupportedTypeNodeDiagnostic from "./createRaiseUnsupportedTypeNodeDiagnostic";
import { ImportsInfo } from "./getImportsInfo";
import createModuleNameFromTypeNode from "./createModuleNameFromTypeNode";
import { SourceFileTs } from "./common-types";

function createModuleNameFromTypeNodeWithDiagnostics(
  sourceFileTs: SourceFileTs,
  raiseDiagnostic: RaiseDiagnostic,
  importsInfo: ImportsInfo,
): ModuleNameFromTypeNode {
  const raiseUnsupportedTypeNodeDiagnostic = createRaiseUnsupportedTypeNodeDiagnostic(
    sourceFileTs,
    raiseDiagnostic,
  );
  return createModuleNameFromTypeNode(
    sourceFileTs,
    importsInfo,
    raiseUnsupportedTypeNodeDiagnostic,
  );
}

export default createModuleNameFromTypeNodeWithDiagnostics;
