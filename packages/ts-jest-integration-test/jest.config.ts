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
        astTransformers: {
          before: ["ts-jest-typed-module-name/transformer"],
        },
      },
    ],
  },
};

export default jestConfig;
