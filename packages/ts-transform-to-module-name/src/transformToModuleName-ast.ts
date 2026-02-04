import { CallExpression, ImportDeclaration, Node, TypeNode } from "typescript";
import { transformToModuleName } from "./transformToModuleName";
import { TTypeScript } from "./ts";

export const getTransformToModuleNameName = (ts: TTypeScript, statement: ImportDeclaration) => {
  if (statement.importClause) {
    const namedBindings = statement.importClause.namedBindings;
    if (namedBindings) {
      if (ts.isNamedImports(namedBindings)) {
        const namedImports = namedBindings;
        const importSpecifier = namedImports.elements.find((element) => {
          const compare = element.propertyName ?? element.name;
          return compare.text === transformToModuleName.name;
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

type TransformToModuleNameTypeNode = TypeNode | undefined;

const getTransformToModuleNameTypeNode = (
  ts: TTypeScript,
  node: CallExpression,
  transformToModuleNameName: string,
): TransformToModuleNameTypeNode => {
  if (
    node.arguments.length === 0 &&
    ts.isIdentifier(node.expression) &&
    node.expression.text === transformToModuleNameName &&
    node.typeArguments?.length === 1
  ) {
    return node.typeArguments[0];
  }
};

export const isTransformToModuleNameCallExpression = (
  ts: TTypeScript,
  node: Node,
  transformToModuleNameName: string | undefined,
) => {
  return tryGetTransformToModuleNameTypeNode(ts, node, transformToModuleNameName) !== undefined;
};

export const tryGetTransformToModuleNameTypeNode = (
  ts: TTypeScript,
  node: Node,
  transformToModuleNameName: string | undefined,
): TransformToModuleNameTypeNode => {
  if (transformToModuleNameName === undefined) {
    return undefined;
  }

  if (ts.isCallExpression(node)) {
    return getTransformToModuleNameTypeNode(ts, node, transformToModuleNameName);
  }
  return undefined;
};
