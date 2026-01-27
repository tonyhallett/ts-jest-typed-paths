# ts-jest-typed-module-name

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

## example

[ts-jest-integration-test](../ts-jest-integration-test/__tests__/test.test.ts)

```ts
import toTest from "../src/to-test";
import dependency from "../src/dependency";
import ttmn from "ts-jest-typed-module-name";

jest.mock<typeof dependency>("");

describe("transformer", () => {
  it("should transform jest.mock", () => {
    toTest();
    expect(dependency).toHaveBeenCalled();
  });

  it("should transformToModuleName", () => {
    expect(ttmn<typeof dependency>()).toBe("../src/dependency");
  });
});
```

** transformed to **

```ts
import toTest from "../src/to-test";
import dependency from "../src/dependency";
import ttmn from "ts-jest-typed-module-name";

jest.mock<typeof dependency>("../src/dependency");

describe("transformer", () => {
  it("should transform jest.mock", () => {
    toTest();
    expect(dependency).toHaveBeenCalled();
  });

  it("should transformToModuleName", () => {
    expect("../src/dependency").toBe("../src/dependency");
  });
});
```

## Adding the transfomer to ts-jest

[ts-jest astTransformers](https://kulshekhar.github.io/ts-jest/docs/getting-started/options/astTransformers)

** example **

[ts-jest-integration-test jest.config.ts](../ts-jest-integration-test/jest.config.ts)

```ts
import { type JestConfigWithTsJest, createDefaultPreset } from "ts-jest";

const defaultPreset = createDefaultPreset();

const jestConfig: JestConfigWithTsJest = {
  ...defaultPreset,
  testRegex: "/__tests__/.*test\\.[jt]sx?$",
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        tsconfig: {
          esModuleInterop: true,
        },
        // **************************************************************************
        astTransformers: {
          before: ["ts-jest-typed-module-name/transformer"],
        },
      },
    ],
  },
};

export default jestConfig;
```
