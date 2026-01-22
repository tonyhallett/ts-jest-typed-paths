import { CallExpression, ImportDeclaration, Node } from "typescript";
import { transformToPath } from "./transformToPath";
import { TTypeScript } from "./ts";

export const getTransformToPathFunctionName = (ts: TTypeScript, statement: ImportDeclaration) => {
  if (statement.importClause) {
    const namedBindings = statement.importClause.namedBindings;
    if (namedBindings) {
      if (ts.isNamedImports(namedBindings)) {
        const importSpecifier = namedBindings.elements.find((element) => {
          const compare = element.propertyName ?? element.name;
          return compare.text === transformToPath.name;
        });
        if (importSpecifier) {
          return importSpecifier.name.text;
        }
      }
    } else {
      return statement.importClause.name?.escapedText.toString();
    }
  }
};

const getTransformToPathTypeArgument = (
  ts: TTypeScript,
  node: CallExpression,
  transformToPathName: string,
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

export const tryGetTransformToPathTypeArgument = (
  ts: TTypeScript,
  node: Node,
  transformToPathName: string | undefined,
) => {
  if (transformToPathName === undefined) {
    return undefined;
  }

  if (ts.isCallExpression(node)) {
    return getTransformToPathTypeArgument(ts, node, transformToPathName);
  }
  return undefined;
};
