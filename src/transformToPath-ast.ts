import { TTypeScript } from "ts-jest";
import { CallExpression, ImportDeclaration, Node } from "typescript";
import { packageName } from "./package-name";
import { transformToPath } from "./transformToPath";

const transformToPathFunctionName = transformToPath.name;

export const getTransformToPathFunctionName = (
  ts: TTypeScript,
  statement: ImportDeclaration,
) => {
  const namedBindings = statement.importClause?.namedBindings;
  if (namedBindings && ts.isNamedImports(namedBindings)) {
    const importSpecifier = namedBindings.elements.find((element) => {
      const compare = element.propertyName ?? element.name;
      return compare.text === transformToPathFunctionName;
    });
    if (importSpecifier) {
      return importSpecifier.name.text;
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
