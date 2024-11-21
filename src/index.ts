import { TsCompilerInstance, TTypeScript } from "ts-jest";
import { ProgramPattern } from "ts-patch";
import {
  Diagnostic,
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

export const name = "jest-typed-paths";
export const version = 2;

// ts -jest
export const factory = (
  tsCompiler: TsCompilerInstance,
  opts?: Record<string, unknown>
) => {
  const configSet = tsCompiler.configSet;
  const ts = configSet.compilerModule;

  return baseFactory(
    ts,
    (diagnostic) => configSet.raiseDiagnostics([diagnostic]),
    opts ?? {}
  );
};

const baseFactory = (
  ts: TTypeScript,
  raiseDiagnostic: (diagnostic: Diagnostic) => void,
  config: Record<string, unknown>
) => {
  const transform = (
    sourceFile: SourceFile,
    context: TransformationContext,
    importsInfo: ImportsInfo
  ) => {
    function createVisitor(ctx: TransformationContext) {
      const visitor: Visitor = (node) => {
        if (ts.isCallExpression(node)) {
          const getModuleName = (
            typeArgument: TypeNode,
            methodName: string
          ) => {
            const typeNameOrModuleName = getTypeNameOrModuleName(
              ts,
              typeArgument
            );

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
                  methodName
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
          } else {
            const jestCallExpressionInfo = getJestCallExpressionInfo(ts, node);
            if (jestCallExpressionInfo) {
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
      const transformFromJestTypeArguments = true;
      if (
        importsInfo.transformToPathName !== undefined ||
        transformFromJestTypeArguments
      ) {
        return transform(sourceFile, context, importsInfo);
      }
      return sourceFile;
    };
  };
  return transformerFactory;
};

// ts-patch
export const tsPatchFactory: ProgramPattern = (program, config, extras) => {
  return baseFactory(extras.ts, (diag) => extras.addDiagnostic(diag), config);
};
export function transformToPath<T>(): string {
  throw new Error("");
}
