import type { TTypeScript } from "./ts";
import { SourceFile, TransformationContext, Visitor, TransformerFactory } from "typescript";
import {
  AdditionalTransform,
  AdditionalTransformFactory,
  RaiseDiagnostic,
} from "./AdditionalTransformFactory";
import createRaiseUnsupportedTypeNodeDiagnostic from "./createRaiseUnsupportedTypeNodeDiagnostic";
import getImportsInfo, { type ImportsInfo } from "./getImportsInfo";
import { isTransformToModuleNameCallExpression } from "./transformToModuleName-ast";
import tryTransformToModuleName from "./tryTransformToModuleName";
import createGetModuleNameFromTypeNode from "./createGetModuleNameFromTypeNode";

export const transformToModuleNameFactory = (
  ts: TTypeScript,
  raiseDiagnostic: RaiseDiagnostic,
  additionalTransformFactory?: AdditionalTransformFactory,
  moduleNameIfExportsTransformToModuleName?: string,
): TransformerFactory<SourceFile> => {
  const transform = (
    sourceFile: SourceFile,
    context: TransformationContext,
    importsInfo: ImportsInfo,
  ): SourceFile => {
    const raiseUnsupportedTypeNodeDiagnostic = createRaiseUnsupportedTypeNodeDiagnostic(
      sourceFile,
      ts,
      raiseDiagnostic,
    );
    const getModuleNameFromTypeNode = createGetModuleNameFromTypeNode(
      ts,
      importsInfo,
      raiseUnsupportedTypeNodeDiagnostic,
      sourceFile,
    );

    let additionalTransform: AdditionalTransform = (node) => node;
    if (additionalTransformFactory) {
      additionalTransform = additionalTransformFactory(
        sourceFile,
        context,
        ts,
        getModuleNameFromTypeNode,
        (expression) =>
          isTransformToModuleNameCallExpression(
            ts,
            expression,
            importsInfo.transformToModuleNameName,
          ),
        raiseDiagnostic,
      );
    }

    const visitor: Visitor = (node) => {
      const replaced = tryTransformToModuleName(
        ts,
        node,
        importsInfo.transformToModuleNameName,
        getModuleNameFromTypeNode,
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

      return ts.visitEachChild(node, visitor, context);
    };
    return ts.visitEachChild(sourceFile, visitor, context);
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
