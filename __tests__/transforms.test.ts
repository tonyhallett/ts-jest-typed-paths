import {
  TsJestTransformer,
  TsJestTransformerOptions,
  TsJestTransformOptions,
} from "ts-jest";
import * as fs from "fs";
import * as path from "path";

describe("transformer", () => {
  const getCodeWithoutSourceMapping = (
    fileName: string,
    tsJestTypedPathsOptions?: Record<string, unknown>
  ) => {
    const tsJestTransformerOptions: TsJestTransformerOptions = {
      astTransformers: {
        before: [
          {
            path: "<rootDir>/index.ts",
            options: tsJestTypedPathsOptions,
          },
        ],
      },
    };
    const tsJestTransformer = new TsJestTransformer(tsJestTransformerOptions);
    const jestMockPath = path.resolve(__dirname, fileName);
    const jestMockSource = fs.readFileSync(jestMockPath, "utf-8");

    const tsJestTransformOptions: TsJestTransformOptions = {
      cacheFS: new Map(),
      config: {},
    } as TsJestTransformOptions;
    const result = tsJestTransformer.process(
      jestMockSource,
      jestMockPath, // todo - will want to use tsCompiler.configSet.isTestFile
      tsJestTransformOptions
    );
    const code = result.code;
    const sourceMappingIndex = code.indexOf("//# sourceMappingURL=");
    //remove soource mapping
    return code.slice(0, sourceMappingIndex);
  };

  interface Test {
    name: string;
    normalFileName: string;
    transformedFileName: string;
    options?: Record<string, unknown>;
  }

  const tests: Test[] = [
    {
      name: "using transformToModuleName",
      normalFileName: "jestmock.ts",
      transformedFileName: "jestmock-transform.ts",
    },
  ];

  it.each(tests)(
    "should work - $name",
    ({ normalFileName, transformedFileName, options }) => {
      const normalCode = getCodeWithoutSourceMapping(normalFileName, options);
      const transformedCode = getCodeWithoutSourceMapping(
        transformedFileName,
        options
      );

      expect(normalCode).toEqual(transformedCode);
      console.log(normalCode);
    }
  );
});
