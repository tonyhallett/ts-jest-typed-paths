import { RaiseDiagnostic } from "./AdditionalTransformFactory";
import { SourceFileTs } from "./common-types";

const unsupportedTypeArgumentDiagnosticCode = 10000;
const getUnsupportedTypeArgumentDiagnostic = (
  sourceFileTs: SourceFileTs,
  start: number,
  length: number,
  member: string,
) => {
  return {
    file: sourceFileTs.sourceFile,
    category: sourceFileTs.ts.DiagnosticCategory.Error,
    code: unsupportedTypeArgumentDiagnosticCode,
    messageText: `Unsupported usage of type argument for ${member}`,
    start,
    length,
  };
};

export interface StartLength {
  start: number;
  length: number;
}

export type RaiseUnsupportedTypeNodeDiagnostic = (startLength: StartLength, member: string) => void;

function createRaiseUnsupportedTypeNodeDiagnostic(
  sourceFileTs: SourceFileTs,
  raiseDiagnostic: RaiseDiagnostic,
): RaiseUnsupportedTypeNodeDiagnostic {
  return (startLength, member) => {
    raiseDiagnostic(
      getUnsupportedTypeArgumentDiagnostic(
        sourceFileTs,
        startLength.start,
        startLength.length,
        member,
      ),
    );
  };
}
export default createRaiseUnsupportedTypeNodeDiagnostic;
