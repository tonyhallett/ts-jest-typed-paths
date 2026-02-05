import type { TTypeScript } from "./ts";
import type { CallExpression, Diagnostic, Node, TypeNode } from "typescript";
import {
  type AdditionalTransformFactory,
  transformToModuleNameFactory,
  transformToModuleName,
} from "ts-transform-to-module-name";
import getJestCallExpressionInfo, {
  type JestCallExpressionInfo,
} from "./getJestCallExpressionInfo";
import updateJestMethodCallWithModuleName from "./updateJestMethodCallWithModuleName";

// todo
export const jestMissingTypeArgumentDiagnosticCode = 1001;

interface JestTransformNodeInfo {
  typeNode: TypeNode;
  methodName: string;
  callExpression: CallExpression;
}

const jestTransformFactory: AdditionalTransformFactory = (
  sourceFileContext,
  getModuleNameFromTypeArgument,
  isTransformToModuleNameCallExpression,
  raiseDiagnostic,
) => {
  const { ts, sourceFile } = sourceFileContext;

  const shouldTransform = (node: Node): JestTransformNodeInfo | undefined => {
    if (!ts.isCallExpression(node)) {
      return undefined;
    }

    const jestCallExpressionInfo = getJestCallExpressionInfo(ts, node);
    if (jestCallExpressionInfo === undefined) {
      return undefined;
    }
    const firstArgumentIsTransformToModuleName = isTransformToModuleNameCallExpression(
      jestCallExpressionInfo.firstArgument,
    );

    if (jestCallExpressionInfo.typeArgument === undefined) {
      if (!firstArgumentIsTransformToModuleName) {
        warnForMissingTypeArgument(jestCallExpressionInfo);
      }
      return undefined;
    }

    // do not transform if first argument is transformToModuleName
    if (firstArgumentIsTransformToModuleName) {
      return undefined;
    }

    return {
      typeNode: jestCallExpressionInfo.typeArgument,
      methodName: jestCallExpressionInfo.methodName,
      callExpression: node,
    };

    function warnForMissingTypeArgument(jestCallExpressionInfo: JestCallExpressionInfo) {
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
        messageText: `jest method ${jestCallExpressionInfo.methodName} is not providing a type argument for transformation to moduleName argument`,
      });
    }
  };

  return (node) => {
    const jestTransformNodeInfo = shouldTransform(node);
    if (jestTransformNodeInfo === undefined) {
      return node;
    }

    const moduleName = getModuleNameFromTypeArgument(
      jestTransformNodeInfo.typeNode,
      jestTransformNodeInfo.methodName,
    );

    if (moduleName) {
      node = updateJestMethodCallWithModuleName(
        ts,
        jestTransformNodeInfo.callExpression,
        moduleName,
      );
    }

    return node;
  };
};

export const createJestFactory = (moduleNameIfExportsTransformToModuleName?: string) => {
  return (ts: TTypeScript, raiseDiagnostic: (diagnostic: Diagnostic) => void) => {
    return transformToModuleNameFactory(
      ts,
      raiseDiagnostic,
      jestTransformFactory,
      moduleNameIfExportsTransformToModuleName,
    );
  };
};

export { transformToModuleName };
