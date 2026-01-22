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
export type GetModuleNameFromTypeArgument = (
  typeArgument: TypeNode,
  member: string,
) => string | undefined;
export type IsTransformToModuleNameCallExpression = (expression: Expression) => boolean;
export type AdditionalTransform = (node: Node) => Node | undefined;

export type AdditionalTransformFactory = (
  sourceFile: SourceFile,
  context: TransformationContext,
  ts: TTypeScript,
  getModuleNameFromTypeArgument: GetModuleNameFromTypeArgument,
  isTransformToModuleNameCallExpression: IsTransformToModuleNameCallExpression,
  raiseDiagnostic: RaiseDiagnostic,
) => AdditionalTransform;
