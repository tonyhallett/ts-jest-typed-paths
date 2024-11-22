import {
  TsJestTransformer,
  TsJestTransformerOptions,
  TsJestTransformOptions,
} from "ts-jest";
import * as fs from "fs";
import * as path from "path";
import * as childProcess from "child_process"
import {PluginConfig} from "ts-patch"
import * as os from "os"
import {unsupportedTypeArgumentDiagnosticCode} from "../src/diagnostics"

describe("transformer", () => {
  describe("ts-jest", () => {
    const getCodeToTransform = (fileName: string) => {
      const codePath = path.resolve(__dirname,"transform-files", fileName);
      return { codeToTransform: fs.readFileSync(codePath, "utf-8"), codePath};;
    }
    const createCleanTsJestTransformer = (
      withTransformer = true,
      tsJestTypedPathsOptions?: Record<string, unknown>
    ) => {
      const tsJestTransformerOptions: TsJestTransformerOptions = {};
      
      if(withTransformer){
        tsJestTransformerOptions.astTransformers = {
          before: [
            {
              path: "<rootDir>/dist/index.js",
              options: tsJestTypedPathsOptions,
            },
          ],
        }
      }
      (TsJestTransformer as any)._cachedConfigSets = [];
      return new TsJestTransformer(tsJestTransformerOptions);
    }

    const getTsJestTransformOptions = () => ({
      cacheFS: new Map(),
      config: {},
    } as TsJestTransformOptions);

    const transformCode = (
      fileName: string,
      withTransformer = true,
      tsJestTypedPathsOptions?: Record<string, unknown>
    ) => {
      const tsJestTransformer = createCleanTsJestTransformer(withTransformer, tsJestTypedPathsOptions);

      const {codeToTransform, codePath} = getCodeToTransform(fileName);

      const result = tsJestTransformer.process(
        codeToTransform,
        codePath,
        getTsJestTransformOptions()
      );
      return result.code;
    }

    const removeSourceMapping = (code:string) => {
      const sourceMappingIndex = code.indexOf("//# sourceMappingURL=");
      return code.slice(0, sourceMappingIndex);
    }
    
    const getCodeWithoutSourceMapping = (
      fileName: string,
      withTransformer = true,
      tsJestTypedPathsOptions?: Record<string, unknown>
    ) => {
      const code = transformCode(fileName, withTransformer, tsJestTypedPathsOptions);
      return removeSourceMapping(code);
    };

    interface Test {
      name: string;
      transformedFileName: string;
      options?: Record<string, unknown>;
    }

    const tests: Test[] = [
      {
        name: "using transformToPath",
        transformedFileName: "transformToPath",
      },
    {
        name: "using transformToPath renamed",
        transformedFileName: "transformToPath-renamed",
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
          true,
          options
        );
        const normalCode = getCodeWithoutSourceMapping(`${transformedFileName}-normal.ts`,false);
        expect(normalCode).toEqual(transformedCode);
      }   
    );

    it("should error when using unsupported type argument - transformToPath", () => {
      expect(() => getCodeWithoutSourceMapping("transformToPath-error.ts"))
        .toThrow("Unsupported usage of type argument for transformToPath");
    });

    it("should error when using unsupported type argument - jest", () => {
      expect(() => getCodeWithoutSourceMapping("jest-error.ts"))
        .toThrow("Unsupported usage of type argument for jest.mock");
    });

    it("should error with warning when jest method without type argument or transformToPath ", () => {
      // because is currently a warning...
      expect(() => getCodeWithoutSourceMapping("jest-no-type-arguments.ts"))
        .toThrow("jest.mock is not providing a type argument for transformation to moduleName argument");
    })
  });

  describe("ts-patch", () => {
    let outPath:string;
    let tsPatchTsConfigPath:string;
    const generateTsPatchTsConfig = (fileName:string) => {
      /*
        cannot use the module name as ts-patch will use the tsconfig.json file directory as a resolve base directory ( given that I use the --project flag)
        in the patched ts.createProgram
        https://github.com/nonara/ts-patch/blob/78e972731369eea8afedacc2f7334244c8168356/projects/patch/src/ts/create-program.ts#L93
        creates
        https://github.com/nonara/ts-patch/blob/78e972731369eea8afedacc2f7334244c8168356/projects/patch/src/plugin/plugin-creator.ts#L178
        uses 
        https://github.com/nonara/ts-patch/blob/78e972731369eea8afedacc2f7334244c8168356/projects/patch/src/plugin/plugin.ts#L74
        https://nodejs.org/api/modules.html#requireresolverequest-options
      */

      /*
        to see the patch code. 
        Can specify process.env.TSP_CACHE_DIR, 
        or process.env.CACHE_DIR/ts-patch 
        or looks up for a package.json then puts in node_modules/.cache/ts-patch 
        or fallsback to ostmp/ts-patch
        https://github.com/nonara/ts-patch/blob/78e972731369eea8afedacc2f7334244c8168356/projects/core/src/system/cache.ts#L36
      */
      const pathToTransformer = path.resolve(__dirname,"../dist/index.js");
      const tsPatchPlugin:PluginConfig = {
        import:"tsPatchFactory",
        //transform:packageName - todo - not working
        transform:pathToTransformer
      }
      
      // include is resolved relative to the directory containing the tsconfig.json file.
      const transformFilesTsPatch = `transform-files/${fileName}`;
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
      const {tsPatchTsConfigPath, transpiledPath} = generateTsPatchTsConfig("tspatch");

      const command = `npm run tspatch -- --project ${tsPatchTsConfigPath}`;
      childProcess.spawnSync(command, {shell:true, stdio:"inherit"});

      const transpiled = fs.readFileSync(transpiledPath, "utf-8");
      expect(transpiled).toContain('aFn("../imported/exporting");');
    });

    it("should have diagnostic", () => {
      const {tsPatchTsConfigPath} = generateTsPatchTsConfig("tspatch-diagnostic");

      const command = `npm run tspatch -- --project ${tsPatchTsConfigPath}`;
      
      const buffer = childProcess.spawnSync(command, {shell:true});
      const out = buffer.stdout.toString();

      // ts-patch patches itself so can addDiagnostic wich would otherwise be unavailable
      // https://github.com/nonara/ts-patch/blob/78e972731369eea8afedacc2f7334244c8168356/projects/patch/src/shared.ts#L25
      // https://github.com/nonara/ts-patch/blob/78e972731369eea8afedacc2f7334244c8168356/projects/core/src/patch/transformers/patch-emitter.ts#L54
      expect(out).toContain(`(4,21): error TS${unsupportedTypeArgumentDiagnosticCode}: Unsupported usage of type argument for transformToPath`);
    });

    afterEach(() => {
      fs.rmSync(tsPatchTsConfigPath);
      fs.rmSync(outPath, {recursive:true});
    })
  })

});
