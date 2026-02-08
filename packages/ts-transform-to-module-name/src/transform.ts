import { SourceFile } from "typescript";
import {
  Transform,
  AdditionalTransformFactory,
  RaiseDiagnostic,
  SourceFileContext,
} from "./AdditionalTransformFactory";
import { ImportsInfo } from "./getImportsInfo";
import { isTransformToModuleNameCallExpression } from "./transformToModuleName-ast";
import createModuleNameFromTypeNodeWithDiagnostics from "./createModuleNameFromTypeNodeWithDiagnostics";
import visit from "./visit";

const transform = (
  context: SourceFileContext,
  raiseDiagnostic: RaiseDiagnostic,
  additionalTransformFactory: AdditionalTransformFactory | undefined,
  importsInfo: ImportsInfo,
): SourceFile => {
  const moduleNameFromTypeNode = createModuleNameFromTypeNodeWithDiagnostics(
    context,
    raiseDiagnostic,
    importsInfo,
  );

  let additionalTransform: Transform | undefined = undefined;
  if (additionalTransformFactory) {
    additionalTransform = additionalTransformFactory(
      context,
      moduleNameFromTypeNode,
      (expression) =>
        isTransformToModuleNameCallExpression(
          context.ts,
          expression,
          importsInfo.transformToModuleNameName,
        ),
      raiseDiagnostic,
    );
  }

  if (additionalTransform === undefined && importsInfo.transformToModuleNameName === undefined) {
    return context.sourceFile;
  }

  return visit(
    context,
    importsInfo.transformToModuleNameName,
    moduleNameFromTypeNode,
    additionalTransform ?? ((node) => node),
  );
};

export default transform;
