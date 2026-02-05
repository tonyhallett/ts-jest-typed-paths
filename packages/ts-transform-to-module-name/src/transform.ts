import { SourceFile } from "typescript";
import {
  AdditionalTransform,
  AdditionalTransformFactory,
  RaiseDiagnostic,
  SourceFileContext,
} from "./AdditionalTransformFactory";
import { ImportsInfo } from "./getImportsInfo";
import { isTransformToModuleNameCallExpression } from "./transformToModuleName-ast";
import createGetModuleNameFromTypeNodeWithDiagnostics from "./createGetModuleNameFromTypeNodeWithDiagnostics";
import visit from "./visit";

const transform = (
  context: SourceFileContext,
  raiseDiagnostic: RaiseDiagnostic,
  additionalTransformFactory: AdditionalTransformFactory | undefined,
  importsInfo: ImportsInfo,
): SourceFile => {
  const getModuleNameFromTypeNode = createGetModuleNameFromTypeNodeWithDiagnostics(
    context,
    raiseDiagnostic,
    importsInfo,
  );

  let additionalTransform: AdditionalTransform = (node) => node;
  if (additionalTransformFactory) {
    additionalTransform = additionalTransformFactory(
      context,
      getModuleNameFromTypeNode,
      (expression) =>
        isTransformToModuleNameCallExpression(
          context.ts,
          expression,
          importsInfo.transformToModuleNameName,
        ),
      raiseDiagnostic,
    );
  }

  return visit(
    context,
    importsInfo.transformToModuleNameName,
    getModuleNameFromTypeNode,
    additionalTransform,
  );
};

export default transform;
