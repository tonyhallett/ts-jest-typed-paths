# Monorepo for typescript ast tranformation based on generic parameter type to the module name that exports it.

## Base package [transform-to-path](./packages/transform-to-path/README.md)

Provides marker generic function `transformToPath` that will be transformed and injection point `transformToPathFactory` ( as used by jest-typed-module-name).

## With jest specifics

For jest functions with a generic parameter and moduleName parameter will transform that parameter based on the generic parameter type.

See the readme for usage
[jest-typed-module-name](./packages/jest-typed-module-name/README.md)

Transformer specific packages using functionality of jest-typed-module-name

[ts-jest-typed-module-name](./packages/ts-jest-typed-module-name/README.md)

[ts-patch-jest-typed-module-name](./packages/ts-patch-jest-typed-module-name/README.md)
