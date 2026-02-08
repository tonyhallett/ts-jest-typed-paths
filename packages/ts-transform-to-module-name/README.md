# ts-transform-to-module-name

A factory for creating a typescript transformer factory and a marker function to be transformed, replaced by a string literal that is the module name obtained from the marker function generic argument.

**This library provides the logic for the packages below that are probably what you require.**

[ts-jest-typed-module-name](../ts-jest-typed-module-name/README.md)
[ts-patch-jest-typed-module-name](../ts-patch-jest-typed-module-name/README.md)

```ts
/**
 * This function is a marker function.  Invoke in code with a generic type that is imported. The transfomer will remove the call expression and replace with the imported module name.
 */
export default function transformToModuleName<T>(): string {
  throw new Error(
    "transformToModuleName should only be used as a marker function and should have been removed by the transformer",
  );
}
```

```ts
/**
 * A factory for creating a {@link TransformerFactory | `TransformerFactory<SourceFile>`} ( e.g for use with ts.transform, ts.transpileModule, ts.Program.emit ts-patch)
 * that transforms calls to a marker, either the provided {@link transformToModuleName} or provided by the param {@link moduleNameExportingTransformToModuleName},
 * to the module name of the type argument of transformToModuleName.
 *
 * @param ts Host provided specific typescript namespace to be used
 * @param raiseDiagnostic Host provided function to raise diagnostics, used for unsupported type nodes in transformToModuleName type argument and other diagnostics from the additionalTransformFactory.
 * @param additionalTransformFactory {@link AdditionalTransformFactory} An optional factory to create an additional transform for the source file nodes. The additional transform will be applied on non transformToModuleName nodes. If the additional transform factory returns undefined and no transformToModuleName import then the source file is not visited.
 * @param moduleNameExportingTransformToModuleName If another module exports a named transformToModuleName or has a default export of transformToModuleName shape, the name of that module.
 */
const transformToModuleNameFactory = (
  ts: TTypeScript,
  raiseDiagnostic: RaiseDiagnostic,
  additionalTransformFactory?: AdditionalTransformFactory,
  moduleNameExportingTransformToModuleName?: string,
): TransformerFactory<SourceFile>

```

```ts
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
```

## How it works

1. **It reads** the import declarations, import equals declarations and type alias declarations.
   From each it collects the module name and any names that could be referenced ( by a TypeReferenceNode ) as well as the name of the transformToModuleName marker function.

   [tests - getImportsInfo](./__tests__/unit.test.ts)

2. It then initializes the additionalTransformFactory if provided.

3. It then visits each node, looking to transform transformToModuleName and if not transformed allows the additional transform to transform.

The additionalTransformFactory is provided two functions

isTransformToModuleNameCallExpression allows for determining if the node can be ignored.

**moduleNameFromTypeNode** looks at the generic type, and collects the type name or module name
based upon the ast type of the generic type.

[tests - getTypeNameOrModuleName](./__tests__/unit.test.ts)

Type references and type queries will provide the type name to be looked up from what was collected in 1.

Type reference :
`<X>`

Type queries:
`<typeof ...>`

Type imports provide the module name directly.
`typeof import('../mod')`
