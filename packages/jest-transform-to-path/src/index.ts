import {
  AdditionalTransformFactory,
  transformToPathFactory,
} from "transform-to-path";
import { getJestCallExpressionInfo, JestCallExpressionInfo } from "./jest-ast";
import { CallExpression, Diagnostic } from "typescript";
import { TTypeScript } from "./ts";

const updateJestMethodCallWithPath = (
  ts: TTypeScript,
  node: CallExpression,
  moduleName: string,
) => {
  return ts.factory.updateCallExpression(
    node,
    node.expression,
    node.typeArguments,
    [ts.factory.createStringLiteral(moduleName), ...node.arguments.slice(1)],
  );
};

// todo
export const jestMissingTypeArgumentDiagnosticCode = 1001;

const jestTransformFactory: AdditionalTransformFactory = (
  sourceFile,
  context,
  ts,
  getModuleNameFromTypeArgument,
  isTransformToPathCallExpression,
  raiseDiagnostic,
) => {
  const warnForMissingTypeArgument = (
    jestCallExpressionInfo: JestCallExpressionInfo,
  ) => {
    // could look at the moduleName argument to see if is empty string
    raiseDiagnostic({
      /* 
                note that a Suggestion category will fail
                typescript.js
                Debug.fail("Should never get an Info diagnostic on the command line.")
              */
      category: ts.DiagnosticCategory.Warning, // todo use options for category,
      code: jestMissingTypeArgumentDiagnosticCode,
      file: sourceFile,
      start: jestCallExpressionInfo.start,
      length: jestCallExpressionInfo.length,
      messageText: `jest.${jestCallExpressionInfo.methodName} is not providing a type argument for transformation to moduleName argument`,
    });
  };

  return (node) => {
    if (!ts.isCallExpression(node)) {
      return node;
    }

    const jestCallExpressionInfo = getJestCallExpressionInfo(ts, node);
    if (jestCallExpressionInfo === undefined) {
      return node;
    }

    const firstArgumentIsTransformToPath = isTransformToPathCallExpression(
      jestCallExpressionInfo.firstArgument,
    );

    if (jestCallExpressionInfo.typeArgument === undefined) {
      if (!firstArgumentIsTransformToPath) {
        warnForMissingTypeArgument(jestCallExpressionInfo);
      }
      return node;
    }

    // do not transform if first argument is transformToPath
    if (firstArgumentIsTransformToPath) {
      return node;
    }

    const moduleName = getModuleNameFromTypeArgument(
      jestCallExpressionInfo.typeArgument,
      `jest.${jestCallExpressionInfo.methodName}`,
    );

    if (moduleName) {
      node = updateJestMethodCallWithPath(ts, node, moduleName);
    }

    return node;
  };
};

export const createJestFactory = () => {
  return (
    ts: TTypeScript,
    raiseDiagnostic: (diagnostic: Diagnostic) => void,
  ) => {
    return transformToPathFactory(ts, raiseDiagnostic, jestTransformFactory);
  };
};
