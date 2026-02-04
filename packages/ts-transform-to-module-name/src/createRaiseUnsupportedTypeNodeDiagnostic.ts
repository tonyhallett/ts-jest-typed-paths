import { SourceFile } from "typescript";
import { TTypeScript } from "./ts";
import { RaiseDiagnostic } from "./AdditionalTransformFactory";

const unsupportedTypeArgumentDiagnosticCode = 10000;
const getUnsupportedTypeArgumentDiagnostic = (
  ts: TTypeScript,
  sourceFile: SourceFile,
  start: number,
  length: number,
  member: string,
) => {
  return {
    file: sourceFile,
    category: ts.DiagnosticCategory.Error,
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
  sourceFile: SourceFile,
  ts: TTypeScript,
  raiseDiagnostic: RaiseDiagnostic,
): RaiseUnsupportedTypeNodeDiagnostic {
  return (startLength, member) => {
    raiseDiagnostic(
      getUnsupportedTypeArgumentDiagnostic(
        ts,
        sourceFile,
        startLength.start,
        startLength.length,
        member,
      ),
    );
  };
}
export default createRaiseUnsupportedTypeNodeDiagnostic;
