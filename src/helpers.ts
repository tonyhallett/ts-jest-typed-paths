import { TTypeScript } from "ts-jest";
import { TypeNode } from "typescript";

const replaceQuotes = (input: string) =>
  input.replace("'", "").replace('"', "");

export function getTypeAliasModuleName(ts: TTypeScript, type: TypeNode) {
  if (
    ts.isImportTypeNode(type) &&
    ts.isLiteralTypeNode(type.argument) &&
    ts.isStringLiteral(type.argument.literal)
  ) {
    return replaceQuotes(type.argument.literal.text);
  }
}
