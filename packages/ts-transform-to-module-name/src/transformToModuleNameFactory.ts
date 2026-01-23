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
import { tryGetTransformToPathTypeArgument } from "./transformToModuleName-ast";
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

export const transformToModuleNameFactory = (
  ts: TTypeScript,
  raiseDiagnostic: RaiseDiagnostic,
  additionalTransformFactory?: AdditionalTransformFactory,
  moduleNameIfExportsTransformToModuleName?: string,
) => {
  const transform = (
    sourceFile: SourceFile,
    context: TransformationContext,
    importsInfo: ImportsInfo,
  ): SourceFile => {
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
          tryGetTransformToPathTypeArgument(
            ts,
            expression,
            importsInfo.transformToModuleNameName,
          ) !== undefined,
        raiseDiagnostic,
      );
    }

    function createVisitor(ctx: TransformationContext) {
      const visitor: Visitor = (node) => {
        const replaced = tryReplaceTransformToPathWithModuleName(
          ts,
          node,
          importsInfo.transformToModuleNameName,
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

    const isSourceFile = (node: ts.Node): node is ts.SourceFile => {
      return ts.isSourceFile(node);
    };

    return ts.visitNode(sourceFile, createVisitor(context), isSourceFile)!;
  };

  const transformerFactory: TransformerFactory<SourceFile> = (context) => {
    return (sourceFile) => {
      const importsInfo = getImportsInfo(ts, sourceFile, moduleNameIfExportsTransformToModuleName);
      if (
        importsInfo.transformToModuleNameName !== undefined ||
        additionalTransformFactory !== undefined
      ) {
        return transform(sourceFile, context, importsInfo);
      }
      return sourceFile;
    };
  };

  return transformerFactory;
};
