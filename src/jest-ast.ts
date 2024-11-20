import { TTypeScript } from "ts-jest";
import { CallExpression, PropertyAccessExpression, TypeNode } from "typescript";

const jestPropertyIdentifiers = [
  "doMock",
  "mock",
  "unstable_mockModule",
  "setMock",
  "createMockFromModule",
  "requireActual",
  "requireMock",
  "genMockFromModule",
];

const isRootJestPropertyAccessExpression = (
  ts: TTypeScript,
  propertyAccessExpression: PropertyAccessExpression
) => {
  if (ts.isIdentifier(propertyAccessExpression.expression)) {
    return propertyAccessExpression.expression.text === "jest";
  }
};

const hasJestRootPropertyAccessExpression = (
  ts: TTypeScript,
  propertyAccessExpression: PropertyAccessExpression
) => {
  if (!ts.isIdentifier(propertyAccessExpression.name)) {
    return false;
  }
  if (isRootJestPropertyAccessExpression(ts, propertyAccessExpression)) {
    return true;
  }
  if (
    ts.isCallExpression(propertyAccessExpression.expression) &&
    ts.isPropertyAccessExpression(
      propertyAccessExpression.expression.expression
    )
  ) {
    return hasJestRootPropertyAccessExpression(
      ts,
      propertyAccessExpression.expression.expression
    );
  }
};

interface JestCallExpressionInfo {
  typeArgument: TypeNode;
  methodName: string;
}

export const getJestCallExpressionInfo = (
  ts: TTypeScript,
  callExpression: CallExpression
): JestCallExpressionInfo | undefined => {
  if (callExpression.typeArguments?.length !== 1) {
    return;
  }
  const typeArgument = callExpression.typeArguments[0];
  const expression = callExpression.expression;
  let methodName: string | undefined;
  if (ts.isPropertyAccessExpression(expression)) {
    if (
      !(
        ts.isIdentifier(expression.name) &&
        jestPropertyIdentifiers.includes(expression.name.text)
      )
    ) {
      return undefined;
    }
    methodName = expression.name.text;
    if (hasJestRootPropertyAccessExpression(ts, expression)) {
      return { typeArgument, methodName };
    }
  }
};
