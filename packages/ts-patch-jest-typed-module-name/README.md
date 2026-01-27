# ts-patch-jest-typed-module-name

No more magic relative paths that have to be updated when file paths change.

## jest tranformable mock methods via generic parameter

The following methods have or may have a generic parameter dependending upon where your jest types come from :

[jest](https://github.com/jestjs/jest/blob/main/packages/jest-environment/src/index.ts)

[definitely-typed](https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/jest/index.d.ts)

| Method name          | Supported    | Notes                                    |
| -------------------- | ------------ | ---------------------------------------- |
| doMock               | Both         |                                          |
| mock                 | Both         |                                          |
| setMock              | Not jest     | recommended to use `jest.mock()` instead |
| unstable_mockModule  | Both         |                                          |
| createMockFromModule | Both         |                                          |
| genMockFromModule    | old versions | deprecated - use createMockFromModule    |
| requireActual        | Both         |                                          |
| requireMock          | Both         |                                          |

## jest "moduleName" methods without generic parameter

For these methods, the default export from ts-jest-typed-module-name can be used to provide an imported type from which the moduleName parameter value will be replaced.

deepUnmock

dontMock

unmock

unstable_unmockModule

## Example Usage

[ts-patch-integration-test](../ts-patch-integration-test/src/test.test.ts)

```ts
import toTest from "./to-test";
import dependency from "./dependency";
import ttmn from "ts-patch-jest-typed-module-name";
jest.mock<typeof dependency>("");

describe("transformer", () => {
  it("should transform jest.mock", () => {
    toTest();
    expect(dependency).toHaveBeenCalled();
  });

  it("should transformToModuleName", () => {
    expect(ttmn<typeof dependency>()).toBe("./dependency");
  });
});
```

## Transformed Code

```ts
import toTest from "./to-test";
import dependency from "./dependency";
import ttmn from "ts-patch-jest-typed-module-name";
jest.mock("./dependency");
describe("transformer", () => {
  it("should transform jest.mock", () => {
    toTest();
    expect(dependency).toHaveBeenCalled();
  });
  it("should transformToModuleName", () => {
    expect(ttmn()).toBe("./dependency");
  });
});
```

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
