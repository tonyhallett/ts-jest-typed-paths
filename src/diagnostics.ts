import { SourceFile } from "typescript";
import { TTypeScript } from "ts-jest";

export const unsupportedTypeArgumentDiagnosticCode = 10000;
export const getUnsupportedTypeArgumentDiagnostic = (
  ts: TTypeScript,
  sourceFile: SourceFile,
  start: number,
  length: number,
  member: string
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
