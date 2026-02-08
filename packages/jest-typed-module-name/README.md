# jest-typed module name

Extends ts-transform-to-module-name, enabling :

For jest functions with a generic parameter and moduleName parameter will transform that parameter based on the generic parameter type.
For jest methods with moduleName parameter and no generic parameter the marker function, transformToModuleName, should be used

**This library provides the logic for the packages below that are probably what you require.**

[ts-jest-typed-module-name](../ts-jest-typed-module-name/README.md)
[ts-patch-jest-typed-module-name](../ts-patch-jest-typed-module-name/README.md)

The `moduleNameExportingTransformToModuleName` is if your package re-exports `transformToModuleName` from jest-typed-module-name as does ts-jest-typed-module-name and ts-patch-jest-typed-module-name.

```ts
export const createJestTransformerFactory = (
  ts: TTypeScript,
  raiseDiagnostic: RaiseDiagnostic,
  moduleNameExportingTransformToModuleName?: string,
) => TransformerFactory<SourceFile>;

function transformToModuleName<T>(): string;
```
