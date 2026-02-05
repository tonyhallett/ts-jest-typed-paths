import {
  CallExpression,
  Expression,
  Identifier,
  PropertyAccessExpression,
  TypeNode,
} from "typescript";
import { TTypeScript } from "./ts";

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
): boolean | undefined => {
  if (!ts.isIdentifier(propertyAccessExpression.name)) {
    return false;
  }
  if (isRootJestPropertyAccessExpression(ts, propertyAccessExpression)) {
    return true;
  }
  if (
    ts.isCallExpression(propertyAccessExpression.expression) &&
    ts.isPropertyAccessExpression(propertyAccessExpression.expression.expression)
  ) {
    return hasJestRootPropertyAccessExpression(ts, propertyAccessExpression.expression.expression);
  }
};

export interface JestCallExpressionInfo {
  typeArgument: TypeNode | undefined;
  methodName: string;
  firstArgument: Expression;
  start: number;
  length: number;
}

function hasRequiredShape(callExpression: CallExpression) {
  const callArguments = callExpression.arguments;
  const numTypeArguments = callExpression.typeArguments ? callExpression.typeArguments.length : 0;
  if (numTypeArguments > 1 || callArguments.length === 0) {
    return false;
  }
  return true;
}

interface JestPropertyInfo {
  methodName: Identifier;
  expression: PropertyAccessExpression;
}

function getPotentialJestPropertyInfo(
  ts: TTypeScript,
  expression: Expression,
): JestPropertyInfo | undefined {
  if (
    ts.isPropertyAccessExpression(expression) &&
    ts.isIdentifier(expression.name) &&
    jestPropertyIdentifiers.includes(expression.name.text)
  ) {
    return {
      methodName: expression.name,
      expression,
    };
  }
  return undefined;
}

const createJestCallExpressionInfo = (callExpression: CallExpression, methodName: Identifier) => {
  const end = callExpression.end;
  const start = methodName.getStart();
  return {
    firstArgument: callExpression.arguments[0],
    typeArgument: callExpression.typeArguments?.[0],
    methodName: methodName.text,
    start,
    length: end - start,
  };
};

const getJestCallExpressionInfo = (
  ts: TTypeScript,
  callExpression: CallExpression,
): JestCallExpressionInfo | undefined => {
  if (!hasRequiredShape(callExpression)) {
    return undefined;
  }

  const jestPropertyInfo = getPotentialJestPropertyInfo(ts, callExpression.expression);
  if (!jestPropertyInfo) {
    return undefined;
  }

  if (hasJestRootPropertyAccessExpression(ts, jestPropertyInfo.expression)) {
    return createJestCallExpressionInfo(callExpression, jestPropertyInfo.methodName);
  }
};

export default getJestCallExpressionInfo;
