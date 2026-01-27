## Configuring ts-patch

[ts-patch configuration](https://github.com/nonara/ts-patch?tab=readme-ov-file#configuration)

[ts-patch-integration-test tsconfig.json](../ts-patch-integration-test/tsconfig.json)

tsconfig.json

```json
    {
        compilerOptions: {
            plugins: [{
                transform: "ts-patch-jest-typed-module-name/transformer",
            }],
            //.....
        },
        //...
    };
```
