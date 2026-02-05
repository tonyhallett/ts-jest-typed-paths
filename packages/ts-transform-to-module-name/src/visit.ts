import { Visitor } from "typescript";
import {
  AdditionalTransform,
  GetModuleNameFromTypeNode,
  SourceFileContext,
} from "./AdditionalTransformFactory";
import tryTransformToModuleName from "./tryTransformToModuleName";

function visit(
  context: SourceFileContext,
  transformToModuleNameName: string | undefined,
  getModuleNameFromTypeNode: GetModuleNameFromTypeNode,
  additionalTransform: AdditionalTransform,
) {
  const { ts, sourceFile, transformationContext } = context;
  const visitor: Visitor = (node) => {
    const replaced = tryTransformToModuleName(
      ts,
      node,
      transformToModuleNameName,
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

    return ts.visitEachChild(node, visitor, transformationContext);
  };
  return ts.visitEachChild(sourceFile, visitor, transformationContext);
}

export default visit;
