import {
  type Diagnostic,
  type Expression,
  type SourceFile,
  type TransformationContext,
  type TypeNode,
  type Node,
} from "typescript";
import { TTypeScript } from "./ts";
/* eslint-disable @typescript-eslint/no-unused-vars -- used for jsdoc */
import { type TransformerFactory } from "typescript";
import type transformToModuleNameFactory from "./transformToModuleNameFactory";
/* eslint-enable @typescript-eslint/no-unused-vars -- used for jsdoc */

export type RaiseDiagnostic = (diagnostic: Diagnostic) => void;

/** @param member - for diagnostic if the type node is not supported */
export type ModuleNameFromTypeNode = (typeNode: TypeNode, member: string) => string | undefined;

export type IsTransformToModuleNameCallExpression = (expression: Expression) => boolean;

/**
 *  Transform node, leave as is or remove
 *  @returns Return undefined to remove node. */
export type Transform = (node: Node) => Node | undefined;

/**
 * Passed to the {@link AdditionalTransformFactory} to determine if the sourceFile property requires transformation.
 * If the factory transforms then the specific typescript should be used.
 * @member ts - the TypeScript module, used for type checking and creating nodes
 * @member sourceFile - the source file being transformed
 * @member transformationContext - the typescript transformation context passed to the {@link TransformerFactory}
 */
export interface SourceFileContext {
  ts: TTypeScript;
  sourceFile: SourceFile;
  transformationContext: TransformationContext;
}

/**
 * Argument of {@link transformToModuleNameFactory}, to participate in the visiting of the source file and node transformation using the helpers
 * @param sourceFileContext {@link SourceFileContext}
 * @param moduleNameFromTypeNode pass a TypeNode to get the module name for own transformation.
 * @param isTransformToModuleNameCallExpression pass an Expression to check if it is a call expression of transformToModuleName.
 * @returns Return undefined to indicate no additional transform required for SourceFile from context when no transformToModuleName import is present */
export type AdditionalTransformFactory = (
  sourceFileContext: SourceFileContext,
  moduleNameFromTypeNode: ModuleNameFromTypeNode,
  isTransformToModuleNameCallExpression: IsTransformToModuleNameCallExpression,
  raiseDiagnostic: RaiseDiagnostic,
) => Transform | undefined;
