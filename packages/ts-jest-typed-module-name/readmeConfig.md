## Adding the transfomer to ts-jest

[ts-jest astTransformers](https://kulshekhar.github.io/ts-jest/docs/getting-started/options/astTransformers)

**example**

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
