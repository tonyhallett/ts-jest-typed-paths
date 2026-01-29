# Monorepo for typescript ast tranformation based on generic parameter type to the module name that exports it.

## Base package [ts-transform-to-module-name](./packages/ts-transform-to-module-name/README.md)

Provides marker generic function `transformToModuleName` that will be transformed and extension point `transformToModuleNameFactory` ( as used by jest-typed-module-name).

## With jest specifics

For jest functions with a generic parameter and moduleName parameter will transform that parameter based on the generic parameter type.

See the readme for usage
[jest-typed-module-name](./packages/jest-typed-module-name/README.md)

Transformer specific packages using functionality of jest-typed-module-name

[ts-jest-typed-module-name](./packages/ts-jest-typed-module-name/README.md)

[ts-patch-jest-typed-module-name](./packages/ts-patch-jest-typed-module-name/README.md)

## Contributor

From the workspace root

`npm run build-all` will install build version of typescript and build all packages.

`npm run test` ( will install build version of typescript and build all packages ) run jest tests

`npm run test-all` runs all tests, including testing that transformer works with different versions of typescript ( ensures that typescript peerDependency is correct)
