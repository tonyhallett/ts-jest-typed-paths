import type { CallExpression } from "typescript";
import type { TTypeScript } from "./ts";

const updateJestMethodCallWithModuleName = (
  ts: TTypeScript,
  node: CallExpression,
  moduleName: string,
) => {
  return ts.factory.updateCallExpression(node, node.expression, node.typeArguments, [
    ts.factory.createStringLiteral(moduleName),
    ...node.arguments.slice(1),
  ]);
};

export default updateJestMethodCallWithModuleName;
