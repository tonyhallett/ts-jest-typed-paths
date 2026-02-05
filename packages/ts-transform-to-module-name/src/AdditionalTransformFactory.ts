import {
  Diagnostic,
  Expression,
  SourceFile,
  TransformationContext,
  TypeNode,
  Node,
} from "typescript";
import { TTypeScript } from "./ts";

export type RaiseDiagnostic = (diagnostic: Diagnostic) => void;
// member parameter is only used for diagnostics
export type GetModuleNameFromTypeNode = (typeNode: TypeNode, member: string) => string | undefined;
export type IsTransformToModuleNameCallExpression = (expression: Expression) => boolean;
export type AdditionalTransform = (node: Node) => Node | undefined;
export interface SourceFileContext {
  ts: TTypeScript;
  sourceFile: SourceFile;
  transformationContext: TransformationContext;
}
export type AdditionalTransformFactory = (
  sourceFileContext: SourceFileContext,
  getModuleNameFromTypeNode: GetModuleNameFromTypeNode,
  isTransformToModuleNameCallExpression: IsTransformToModuleNameCallExpression,
  raiseDiagnostic: RaiseDiagnostic,
) => AdditionalTransform;
