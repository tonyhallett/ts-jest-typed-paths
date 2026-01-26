import { type JestConfigWithTsJest, createDefaultPreset } from "ts-jest";

const defaultPreset = createDefaultPreset();

const jestConfig: JestConfigWithTsJest = {
  ...defaultPreset,
  testRegex: "/__tests__/.*test\\.[jt]sx?$",
};

export default jestConfig;
