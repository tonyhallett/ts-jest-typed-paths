import { TypeNode } from "typescript";
import { TTypeScript } from "./ts";

function tryGetImportTypeNodeModuleName(ts: TTypeScript, type: TypeNode) {
  if (
    ts.isImportTypeNode(type) &&
    ts.isLiteralTypeNode(type.argument) &&
    ts.isStringLiteral(type.argument.literal)
  ) {
    return type.argument.literal.text;
  }
}

export default tryGetImportTypeNodeModuleName;
