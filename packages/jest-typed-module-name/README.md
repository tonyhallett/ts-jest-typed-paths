# jest-typed module name

Extends ts-transform-to-module-name, enabling :

For jest functions with a generic parameter and moduleName parameter will transform that parameter based on the generic parameter type.
For jest methods with moduleName parameter and no generic parameter the marker function, transformToModuleName, should be used

** This library provides the logic for the packages below that are probably what you require. **

[ts-jest-typed-module-name](../ts-jest-typed-module-name/README.md)
[ts-patch-jest-typed-module-name](../ts-patch-jest-typed-module-name/README.md)

```ts
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

createJestFactory: (moduleNameIfExportsTransformToModuleName?: string) =>
  (ts: typeof ts, raiseDiagnostic: (diagnostic: Diagnostic) => void) =>
    TransformerFactory<SourceFile>;

function transformToModuleName<T>(): string;
```
