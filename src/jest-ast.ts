import { TTypeScript } from "ts-jest";
import {
  CallExpression,
  Expression,
  PropertyAccessExpression,
  TypeNode,
} from "typescript";

/*
  jest types from either
  https://github.com/jestjs/jest/blob/main/packages/jest-environment/src/index.ts
  https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/jest/index.d.ts
*/
const jestPropertyIdentifiers = [
  "doMock",
  "mock",
  "unstable_mockModule",
  "setMock", // generic in definitely typed
  "createMockFromModule",
  "requireActual",
  "requireMock",
  // https://jestjs.io/docs/upgrading-to-jest30#jestgenmockfrommodule-removed
  // deprecated - use createMockFromModule
  "genMockFromModule",
];

const isRootJestPropertyAccessExpression = (
  ts: TTypeScript,
  propertyAccessExpression: PropertyAccessExpression,
) => {
  if (ts.isIdentifier(propertyAccessExpression.expression)) {
    return propertyAccessExpression.expression.text === "jest";
  }
};

const hasJestRootPropertyAccessExpression = (
  ts: TTypeScript,
  propertyAccessExpression: PropertyAccessExpression,
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
      propertyAccessExpression.expression.expression,
    )
  ) {
    return hasJestRootPropertyAccessExpression(
      ts,
      propertyAccessExpression.expression.expression,
    );
  }
};

export interface JestCallExpressionInfo {
  typeArgument: TypeNode | undefined;
  methodName: string;
  firstArgument: Expression;
  start: number;
  length: number;
}

export const getJestCallExpressionInfo = (
  ts: TTypeScript,
  callExpression: CallExpression,
): JestCallExpressionInfo | undefined => {
  const callArguments = callExpression.arguments;
  const numTypeArguments = callExpression.typeArguments
    ? callExpression.typeArguments.length
    : 0;
  if (numTypeArguments > 1 || callArguments.length === 0) {
    return;
  }
  const expression = callExpression.expression;
  if (ts.isPropertyAccessExpression(expression)) {
    if (
      !(
        ts.isIdentifier(expression.name) &&
        jestPropertyIdentifiers.includes(expression.name.text)
      )
    ) {
      return undefined;
    }
    const methodName = expression.name.text;
    if (hasJestRootPropertyAccessExpression(ts, expression)) {
      const end = callExpression.end;
      const start = expression.name.getStart();
      return {
        typeArgument: callExpression.typeArguments?.[0],
        methodName,
        firstArgument: callArguments[0],
        start,
        length: end - start,
      };
    }
  }
};
