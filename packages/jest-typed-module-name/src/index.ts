import type { TTypeScript } from "./ts";
import type { CallExpression, Node, TypeNode, TransformerFactory } from "typescript";
import {
  type AdditionalTransformFactory,
  type RaiseDiagnostic,
  transformToModuleName,
  transformToModuleNameFactory,
} from "ts-transform-to-module-name";
import getJestCallExpressionInfo, {
  type JestCallExpressionInfo,
} from "./getJestCallExpressionInfo";
import updateJestMethodCallWithModuleName from "./updateJestMethodCallWithModuleName";

// todo
const jestMissingTypeArgumentDiagnosticCode = 1001;

interface JestTransformNodeInfo {
  typeNode: TypeNode;
  methodName: string;
  callExpression: CallExpression;
}

// todo createJestTransformerFactory could have a predicate to determine if the transform is necessary.

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

/**
 * A factory for creating a {@link TransformerFactory | `TransformerFactory<SourceFile>`} ( e.g for use with ts.transform, ts.transpileModule, ts.Program.emit, ts-patch) ( e.g for use with ts.transform, ts.transpileModule, ts.Program.emit, ts-patch, ts-jest) that transforms jest 'moduleName' parameters to module name obtained from the type argument.
 * Also replaces calls to marker {@link transformToModuleName} to the module name of the type argument of transformToModuleName. Use transformToModuleName for jest 'moduleName' methods that do not have a type argument or for other transformations to module name from type argument outside of jest.
 *
 * @param ts Specific typescript namespace to be used
 * @param raiseDiagnostic Host provided function to raise diagnostics, used for unsupported type nodes in transformToModuleName type argument and for jest specifics too.
 * @param moduleNameExportingTransformToModuleName If another module exports a named transformToModuleName or has a default export of transformToModuleName shape, the name of that module.
 */

export const createJestTransformerFactory = (
  ts: TTypeScript,
  raiseDiagnostic: RaiseDiagnostic,
  moduleNameExportingTransformToModuleName?: string,
) => {
  return transformToModuleNameFactory(
    ts,
    raiseDiagnostic,
    jestTransformFactory,
    moduleNameExportingTransformToModuleName,
  );
};

export { transformToModuleName };
