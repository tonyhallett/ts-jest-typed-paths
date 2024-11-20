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
    let outPath:string;
    let tsPatchTsConfigPath:string;
    const generateTsPatchTsConfig = () => {
      const pathToTransformer = path.resolve(__dirname,"../dist/index.js");
      const tsPatchPlugin:PluginConfig = {
        import:"tsPatchFactory",
        //transform:packageName - todo - not working
        transform:pathToTransformer
      }
      
      // include is resolved relative to the directory containing the tsconfig.json file.
      const transformFilesTsPatch = "transform-files/tspatch";
      const includeFullPath = path.resolve(__dirname,`../__tests__/${transformFilesTsPatch}.ts`);
      const tsPatchTsConfig = {
        compilerOptions:{
          "outDir": "./tspatchout", 
          plugins:[
            tsPatchPlugin
          ],
          esModuleInterop: true
        },
        "include":[includeFullPath]
      }
      tsPatchTsConfigPath = path.join(os.tmpdir(),"tsconfig.tspatch.json");
      outPath = path.join(os.tmpdir(),"tspatchout");
      const transpiledPath = path.join(outPath,`${transformFilesTsPatch}.js`);
      fs.writeFileSync(tsPatchTsConfigPath, JSON.stringify(tsPatchTsConfig));
      return {
        tsPatchTsConfigPath,
        transpiledPath,
      }
    }
    it("should work", () => {
      const {tsPatchTsConfigPath, transpiledPath} = generateTsPatchTsConfig();

      const command = `npm run tspatch -- --project ${tsPatchTsConfigPath}`;
      childProcess.spawnSync(command, {shell:true, stdio:"inherit"});

      const transpiled = fs.readFileSync(transpiledPath, "utf-8");
      expect(transpiled).toContain('aFn("../imported/exporting");');
    });

    afterEach(() => {
      fs.rmSync(tsPatchTsConfigPath);
      fs.rmSync(outPath, {recursive:true});
    })
  })
});
