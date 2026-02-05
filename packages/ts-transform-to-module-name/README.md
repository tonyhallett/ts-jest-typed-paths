# ts-transform-to-module-name

** This library provides the logic for the packages below that are probably what you require. **

[ts-jest-typed-module-name](../ts-jest-typed-module-name/README.md)
[ts-patch-jest-typed-module-name](../ts-patch-jest-typed-module-name/README.md)

It exports a marker function

```ts
export function transformToModuleName<T>(): string {
  throw new Error("");
}
```

If it ( and the TransformerFactory from transformToModuleNameFactory) is used, or if is re-exported with name transformToModuleName or as a default export and moduleNameIfExportsTransformToModuleName is supplied then it will be be replaced by the module name from the generic parameter.

As it is intended for use by other packages there are the parameters additionalTransformFactory and moduleNameIfExportsTransformToModuleName.

```ts
const transformToModuleNameFactory = (
  ts: TTypeScript,
  raiseDiagnostic: RaiseDiagnostic,
  additionalTransformFactory?: AdditionalTransformFactory,
  moduleNameIfExportsTransformToModuleName?: string,
): TransformerFactory<SourceFile>

```

The getModuleNameFromTypeNode is the logic used to provide the module name string. This is what is used to transform `transformToModuleName<T>()`. The member argument will be used for diagnostics if transformation cannot be performed.
To determine if a node is `transformToModuleName<T>()` invoke isTransformToModuleNameCallExpression.

```ts
export type RaiseDiagnostic = (diagnostic: Diagnostic) => void;
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
```
