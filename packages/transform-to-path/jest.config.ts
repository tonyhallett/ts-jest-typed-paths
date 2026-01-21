import { type JestConfigWithTsJest, createDefaultPreset } from "ts-jest";

const defaultPreset = createDefaultPreset();

const jestConfig: JestConfigWithTsJest = {
  // [...]
  // Replace `ts-jest` with the preset you want to use
  // from the above list
  ...defaultPreset,
  testRegex: "/__tests__/.*test\\.[jt]sx?$",
};

export default jestConfig;
