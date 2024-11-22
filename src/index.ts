import { TsCompilerInstance, TTypeScript } from "ts-jest";
import { ProgramPattern } from "ts-patch";
import {
  Diagnostic,
  Expression,
  Node,
  SourceFile,
  TransformationContext,
  TransformerFactory,
  TypeNode,
  Visitor,
} from "typescript";
import { getImportsInfo, ImportsInfo } from "./getImportsInfo";
import { getJestCallExpressionInfo } from "./jest-ast";
import { getTypeNameOrModuleName } from "./getTypeNameOrModuleName";
import {
  getTransformToPathTypeArgument,
  isTransformToPathImport,
} from "./transformToPath-ast";
import { getUnsupportedTypeArgumentDiagnostic } from "./diagnostics";

type RaiseDiagnostic = (diagnostic: Diagnostic) => void;
type GetModuleName = (
  typeArgument: TypeNode,
  member: string
) => string | undefined;
type IsTransformToPathCallExpression = (expression: Expression) => boolean;
type AdditionalTransform = (node: Node) => Node | undefined;
type AdditionalTransformFactory = (
  sourceFile: SourceFile,
  context: TransformationContext,
  ts: TTypeScript,
  getModuleName: GetModuleName,
  isTransformToPathCallExpression: IsTransformToPathCallExpression,
  raiseDiagnostic: RaiseDiagnostic
) => AdditionalTransform;

const baseFactory = (
  ts: TTypeScript,
  raiseDiagnostic: RaiseDiagnostic,
  additionalTransformFactory?: AdditionalTransformFactory
) => {
  const transform = (
    sourceFile: SourceFile,
    context: TransformationContext,
    importsInfo: ImportsInfo
  ) => {
    const getModuleName = (typeArgument: TypeNode, member: string) => {
      const typeNameOrModuleName = getTypeNameOrModuleName(ts, typeArgument);

      const doRaiseDiagnostic = (startLength: {
        start: number;
        length: number;
      }) => {
        /* 
          for built in diagonstics see typescript.js
          var Diagnostics = { 
          
        */
        raiseDiagnostic(
          getUnsupportedTypeArgumentDiagnostic(
            ts,
            sourceFile,
            startLength.start,
            startLength.length,
            member
          )
        );
      };

      if (!typeNameOrModuleName.supported) {
        doRaiseDiagnostic(typeNameOrModuleName);
      } else {
        let moduleName: string | undefined;
        if (typeNameOrModuleName.isTypeName) {
          moduleName = importsInfo.getModuleName(
            typeNameOrModuleName.typeNameOrModuleName
          );
        } else {
          moduleName = typeNameOrModuleName.typeNameOrModuleName;
        }
        if (moduleName !== undefined) {
          return moduleName;
        } else {
          doRaiseDiagnostic(typeNameOrModuleName);
        }
      }
    };
    let additionalTransform: AdditionalTransform = (node) => node;
    if (additionalTransformFactory) {
      additionalTransform = additionalTransformFactory(
        sourceFile,
        context,
        ts,
        getModuleName,
        (expression) =>
          ts.isCallExpression(expression) &&
          getTransformToPathTypeArgument(
            ts,
            expression,
            importsInfo.transformToPathName!
          ) !== undefined,
        raiseDiagnostic
      );
    }
    function createVisitor(ctx: TransformationContext) {
      const visitor: Visitor = (node) => {
        if (ts.isCallExpression(node)) {
          const transformToPathTypeArgument = getTransformToPathTypeArgument(
            ts,
            node,
            importsInfo.transformToPathName!
          );

          if (transformToPathTypeArgument) {
            const moduleName = getModuleName(
              transformToPathTypeArgument,
              transformToPath.name
            );
            if (moduleName) {
              return ts.factory.createStringLiteral(moduleName);
            }
          }
        }
        const additionalTransformedNode = additionalTransform(node);
        if (additionalTransformedNode === undefined) {
          return undefined;
        } else {
          node = additionalTransformedNode;
        }
        return isTransformToPathImport(ts, node)
          ? undefined
          : ts.visitEachChild(node, visitor, ctx);
      };
      return visitor;
    }

    return ts.visitNode(sourceFile, createVisitor(context), (node) =>
      ts.isSourceFile(node)
    )!;
  };

  const transformerFactory: TransformerFactory<SourceFile> = (context) => {
    return (sourceFile) => {
      const importsInfo = getImportsInfo(ts, sourceFile);
      if (
        importsInfo.transformToPathName !== undefined ||
        additionalTransformFactory !== undefined
      ) {
        return transform(sourceFile, context, importsInfo);
      }
      return sourceFile;
    };
  };
  return transformerFactory;
};

const factoryCreator = (
  additionalTransformFactory?: AdditionalTransformFactory
) => {
  return (
    ts: TTypeScript,
    raiseDiagnostic: (diagnostic: Diagnostic) => void
  ) => {
    return baseFactory(ts, raiseDiagnostic, additionalTransformFactory);
  };
};

const transformToPathFactory = factoryCreator();
const jestTransformFactory: AdditionalTransformFactory = (
  sourceFile,
  context,
  ts,
  getModuleName,
  isTransformToPathCallExpression,
  raiseDiagnostic
) => {
  return (node) => {
    if (ts.isCallExpression(node)) {
      const jestCallExpressionInfo = getJestCallExpressionInfo(ts, node);
      if (jestCallExpressionInfo) {
        const firstArgumentIsTransformToPath = isTransformToPathCallExpression(
          jestCallExpressionInfo.firstArgument
        );
        if (jestCallExpressionInfo.typeArgument === undefined) {
          if (!firstArgumentIsTransformToPath) {
            // could look at the moduleName argument to see if is empty string
            raiseDiagnostic({
              /* 
                note that a Suggestion category will fail
                typescript.js
                Debug.fail("Should never get an Info diagnostic on the command line.")
              */
              category: ts.DiagnosticCategory.Warning, // todo use options for category,
              code: 1001, // todo
              file: sourceFile,
              start: jestCallExpressionInfo.start,
              length: jestCallExpressionInfo.length,
              messageText: `jest.${jestCallExpressionInfo.methodName} is not providing a type argument for transformation to moduleName argument`,
            });
          }
        } else {
          // do not transform if first argument is transformToPath
          if (!firstArgumentIsTransformToPath) {
            const moduleName = getModuleName(
              jestCallExpressionInfo.typeArgument,
              `jest.${jestCallExpressionInfo.methodName}`
            );
            if (moduleName) {
              node = ts.factory.updateCallExpression(
                node,
                node.expression,
                node.typeArguments,
                [
                  ts.factory.createStringLiteral(moduleName),
                  ...node.arguments.slice(1),
                ]
              );
            }
          }
        }
      }
    }
    return node;
  };
};
const jestFactory = factoryCreator(jestTransformFactory);

export const name = "jest-typed-paths";
export const version = 4;

// ts -jest
export const factory = (
  tsCompiler: TsCompilerInstance,
  opts?: Record<string, unknown>
) => {
  const configSet = tsCompiler.configSet;
  const ts = configSet.compilerModule;

  return jestFactory(ts, (diagnostic) =>
    configSet.raiseDiagnostics([diagnostic])
  );
};

// ts-patch
export const tsPatchFactory: ProgramPattern = (program, config, extras) => {
  return jestFactory(extras.ts, (diag) => extras.addDiagnostic(diag));
};
export function transformToPath<T>(): string {
  throw new Error("");
}
