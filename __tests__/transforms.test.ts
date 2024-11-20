import {
  TsJestTransformer,
  TsJestTransformerOptions,
  TsJestTransformOptions,
} from "ts-jest";
import * as fs from "fs";
import * as path from "path";
import * as childProcess from "child_process"
import {PluginConfig} from "ts-patch"
import {packageName} from "../src/package-name"
import * as os from "os"

describe("transformer", () => {
  
  const getCodeWithoutSourceMapping = (
    fileName: string,
    tsJestTypedPathsOptions?: Record<string, unknown>
  ) => {
    const tsJestTransformerOptions: TsJestTransformerOptions = {
      astTransformers: {
        before: [
          {
            path: "<rootDir>/dist/index.js",
            options: tsJestTypedPathsOptions,
          },
        ],
      },
    };
    const tsJestTransformer = new TsJestTransformer(tsJestTransformerOptions);
    const codePath = path.resolve(__dirname,"transform-files", fileName);
    const codeToTransform = fs.readFileSync(codePath, "utf-8");

    const tsJestTransformOptions: TsJestTransformOptions = {
      cacheFS: new Map(),
      config: {},
    } as TsJestTransformOptions;
    const result = tsJestTransformer.process(
      codeToTransform,
      codePath, // todo - will want to use tsCompiler.configSet.isTestFile
      tsJestTransformOptions
    );
    const code = result.code;
    const sourceMappingIndex = code.indexOf("//# sourceMappingURL=");
    //remove source mapping
    return code.slice(0, sourceMappingIndex);
  };

  interface Test {
    name: string;
    transformedFileName: string;
    options?: Record<string, unknown>;
  }

  const tests: Test[] = [
    {
      name: "using transformToModuleName",
      transformedFileName: "transformToModuleName",
    },
  {
      name: "using transformToModuleName renamed",
      transformedFileName: "transformToModuleName-renamed",
    },
    {
      name: "using jest method type argument",
      transformedFileName: "jest-transform",
    },
    {
      name: "should ignore jest named methods if not from jest",
      transformedFileName: "not-jest-transform",
    }
  ];

  it.each(tests)(
    "should work - $name",
    ({ transformedFileName, options }) => {
      const transformedCode = getCodeWithoutSourceMapping(
        `${transformedFileName}.ts`,
        options
      );
      const normalCode = getCodeWithoutSourceMapping(`${transformedFileName}-normal.ts`, options);
      expect(normalCode).toEqual(transformedCode);
    }   
  );

  it("should error when using unsupported type argument - transformToModuleName", () => {
    expect(() => getCodeWithoutSourceMapping("transformToModuleName-error.ts"))
      .toThrow("Unsupported usage of type argument for transformToModuleName");
  });

  it("should error when using unsupported type argument - jest", () => {
    expect(() => getCodeWithoutSourceMapping("jest-error.ts"))
      .toThrow("Unsupported usage of type argument for jest.mock");
  });

  describe("ts-patch", () => {
    const generateTsPatchTsConfig = () => {
      const tsPatchPlugin:PluginConfig = {
        import:"tsPatchFactory",
        transform:packageName
      }
      
      const tsPatchTsConfig = {
        compilerOptions:{
          "outDir": "./tspatchout", 
          plugins:[
            tsPatchPlugin
          ]
        },
        "include":["__tests__/transform-files/jest-transform.ts"]
      }
      const tsPatchTsConfigPath = path.join(os.tmpdir(),"tsconfig.tspatch.json");
      fs.writeFileSync(tsPatchTsConfigPath, JSON.stringify(tsPatchTsConfig));
      return tsPatchTsConfigPath;
    }
    it("should work", () => {
      // generate a tsconfig for ts-path
      const path = generateTsPatchTsConfig();
      

      childProcess.execSync(`npm run tspatch ${path}`);
    });
  })
});
