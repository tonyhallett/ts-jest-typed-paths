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

## How it works

1. **It reads** the import declarations, import equals declarations and type alias declarations.
   From each it collects the module name and any names that could be referenced ( by a TypeReferenceNode ) as well as the name of the transformToModuleName marker function.

   [tests - getImportsInfo](./__tests__/unit.test.ts)

2. It then initializes the additionalTransformFactory if provided.

3. It then visits each node, looking to transform transformToModuleName and if not transformed allows the additional transform to transform.

The additionalTransformFactory is provided two functions

isTransformToModuleNameCallExpression allows for determining if the node can be ignored.

**getModuleNameFromTypeNode** looks at the generic type, and collects the type name or module name
based upon the ast type of the generic type.

[tests - getTypeNameOrModuleName](./__tests__/unit.test.ts)

Type references and type queries will provide the type name to be looked up from what was collected in 1.

Type reference :
`<X>`

Type queries:
`<typeof ...>`

Type imports provide the module name directly.
`typeof import('../mod')`
