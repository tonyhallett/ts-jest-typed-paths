import { TTypeScript } from "ts-jest";
import { CallExpression, Node } from "typescript";
import { packageName } from "./package-name";
export const getTransformToPathTypeArgument = (
  ts: TTypeScript,
  node: CallExpression,
  transformToPathName: string
) => {
  if (
    node.arguments.length === 0 &&
    ts.isIdentifier(node.expression) &&
    node.expression.text === transformToPathName &&
    node.typeArguments?.length === 1
  ) {
    return node.typeArguments[0];
  }
};

export const isTransformToPathImport = (ts: TTypeScript, node: Node) => {
  if (ts.isImportDeclaration(node)) {
    const moduleSpecifier = node.moduleSpecifier;
    if (ts.isStringLiteral(moduleSpecifier)) {
      const moduleName = moduleSpecifier.text;
      if (moduleName === packageName) {
        return true;
      }
    }
  }
};
