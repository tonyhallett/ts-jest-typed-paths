import { TsCompilerInstance } from "ts-jest";
import {
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
  getTransformToModuleNameTypeArgument,
  isTransformToModuleNameImport,
} from "./transformToModuleName-ast";

export const name = "jest-typed-paths";
export const version = 1;

export const factory = (
  tsCompiler: TsCompilerInstance,
  opts?: Record<string, unknown>
) => {
  const configSet = tsCompiler.configSet;
  const ts = configSet.compilerModule;

  const transform = (
    sourceFile: SourceFile,
    context: TransformationContext,
    importsInfo: ImportsInfo
  ) => {
    function createVisitor(ctx: TransformationContext) {
      const visitor: Visitor = (node) => {
        if (ts.isCallExpression(node)) {
          const getModuleName = (
            transformToModuleNameTypeArgument: TypeNode,
            methodName: string
          ) => {
            const typeNameOrModuleName = getTypeNameOrModuleName(
              ts,
              transformToModuleNameTypeArgument
            );

            const raiseDiagnostic = (transformToModuleNameTypeInfo: {
              start: number;
              length: number;
            }) => {
              configSet.raiseDiagnostics(
                [
                  {
                    file: sourceFile,
                    category: ts.DiagnosticCategory.Error,
                    code: 0, // todo
                    messageText: `Unsupported usage of type argument for ${methodName}`,
                    start: transformToModuleNameTypeInfo.start,
                    length: transformToModuleNameTypeInfo.length,
                  },
                ],
                sourceFile.fileName
              );
            };

            if (!typeNameOrModuleName.supported) {
              raiseDiagnostic(typeNameOrModuleName);
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
                // todo - different diagnostic
                raiseDiagnostic(typeNameOrModuleName);
              }
            }
          };
          const transformToModuleNameTypeArgument =
            getTransformToModuleNameTypeArgument(
              ts,
              node,
              importsInfo.transformToModuleNameName!
            );

          if (transformToModuleNameTypeArgument) {
            const moduleName = getModuleName(
              transformToModuleNameTypeArgument,
              "transformToModuleName"
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
        return isTransformToModuleNameImport(ts, node)
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
    //tsCompiler.configSet.isTestFile

    return (sourceFile) => {
      const importsInfo = getImportsInfo(ts, sourceFile);
      const transformFromJestTypeArguments = true;
      if (
        importsInfo.transformToModuleNameName !== undefined ||
        transformFromJestTypeArguments
      ) {
        return transform(sourceFile, context, importsInfo);
      }
      return sourceFile;
    };
  };
  return transformerFactory;
};

export function transformToModuleName<T>(): string {
  throw new Error("");
}
