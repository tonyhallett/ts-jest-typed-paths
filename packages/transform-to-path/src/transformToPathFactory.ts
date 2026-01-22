import ts, { SourceFile, TransformationContext, Visitor, TransformerFactory } from "typescript";
import {
  AdditionalTransform,
  AdditionalTransformFactory,
  GetModuleNameFromTypeArgument,
  RaiseDiagnostic,
} from "./AdditionalTransformFactory";
import { getUnsupportedTypeArgumentDiagnostic } from "./diagnostics";
import { ImportsInfo, getImportsInfo } from "./getImportsInfo";
import { getTypeNameOrModuleName } from "./getTypeNameOrModuleName";
import { tryGetTransformToPathTypeArgument } from "./transformToPath-ast";
import { TTypeScript } from "./ts";

const tryReplaceTransformToPathWithModuleName = (
  ts: TTypeScript,
  node: ts.Node,
  transformToPathName: string | undefined,
  getModuleNameFromTypeArgument: GetModuleNameFromTypeArgument,
): ts.StringLiteral | undefined => {
  const transformToPathTypeArgument = tryGetTransformToPathTypeArgument(
    ts,
    node,
    transformToPathName,
  );
  if (transformToPathTypeArgument) {
    const moduleName = getModuleNameFromTypeArgument(
      transformToPathTypeArgument,
      transformToPathName!,
    );

    if (moduleName) {
      return ts.factory.createStringLiteral(moduleName);
    }
  }

  return undefined;
};

export const transformToPathFactory = (
  ts: TTypeScript,
  raiseDiagnostic: RaiseDiagnostic,
  additionalTransformFactory?: AdditionalTransformFactory,
  moduleNameIfExportsTransformToPath?: string,
) => {
  const transform = (
    sourceFile: SourceFile,
    context: TransformationContext,
    importsInfo: ImportsInfo,
  ) => {
    const getModuleNameFromTypeArgument: GetModuleNameFromTypeArgument = (typeArgument, member) => {
      const typeNameOrModuleName = getTypeNameOrModuleName(ts, typeArgument);

      const doRaiseDiagnostic = (startLength: { start: number; length: number }) => {
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
            member,
          ),
        );
      };

      if (!typeNameOrModuleName.supported) {
        doRaiseDiagnostic(typeNameOrModuleName);
      } else {
        let moduleName: string | undefined;
        if (typeNameOrModuleName.isTypeName) {
          moduleName = importsInfo.getModuleName(typeNameOrModuleName.typeNameOrModuleName);
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
        getModuleNameFromTypeArgument,
        (expression) =>
          tryGetTransformToPathTypeArgument(ts, expression, importsInfo.transformToPathName) !==
          undefined,
        raiseDiagnostic,
      );
    }

    function createVisitor(ctx: TransformationContext) {
      const visitor: Visitor = (node) => {
        const replaced = tryReplaceTransformToPathWithModuleName(
          ts,
          node,
          importsInfo.transformToPathName,
          getModuleNameFromTypeArgument,
        );
        if (replaced) {
          return replaced;
        }

        const additionalTransformedNode = additionalTransform(node);
        if (additionalTransformedNode === undefined) {
          return undefined;
        } else {
          node = additionalTransformedNode;
        }

        return ts.visitEachChild(node, visitor, ctx);
      };

      return visitor;
    }

    return ts.visitNode(sourceFile, createVisitor(context), (node) => ts.isSourceFile(node))!;
  };

  const transformerFactory: TransformerFactory<SourceFile> = (context) => {
    return (sourceFile) => {
      const importsInfo = getImportsInfo(ts, sourceFile, moduleNameIfExportsTransformToPath);
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
