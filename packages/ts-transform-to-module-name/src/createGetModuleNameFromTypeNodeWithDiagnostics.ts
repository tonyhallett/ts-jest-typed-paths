import { GetModuleNameFromTypeNode, RaiseDiagnostic } from "./AdditionalTransformFactory";
import createRaiseUnsupportedTypeNodeDiagnostic from "./createRaiseUnsupportedTypeNodeDiagnostic";
import { ImportsInfo } from "./getImportsInfo";
import createGetModuleNameFromTypeNode from "./createGetModuleNameFromTypeNode";
import { SourceFileTs } from "./common-types";

function createGetModuleNameFromTypeNodeWithDiagnostics(
  sourceFileTs: SourceFileTs,
  raiseDiagnostic: RaiseDiagnostic,
  importsInfo: ImportsInfo,
): GetModuleNameFromTypeNode {
  const raiseUnsupportedTypeNodeDiagnostic = createRaiseUnsupportedTypeNodeDiagnostic(
    sourceFileTs,
    raiseDiagnostic,
  );
  return createGetModuleNameFromTypeNode(
    sourceFileTs,
    importsInfo,
    raiseUnsupportedTypeNodeDiagnostic,
  );
}

export default createGetModuleNameFromTypeNodeWithDiagnostics;
