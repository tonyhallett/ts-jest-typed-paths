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
import {jestMissingTypeArgumentDiagnosticCode} from "../src/jestFactory"
import { mkdtempSync } from "fs";
import pkg from "../package.json";
import { spawnSync } from "child_process";
import { toThrowTsErrorMatcher } from "./toThrowTsErrorMatcher";

const expectExtendMap = {
  "toThrowTsError": toThrowTsErrorMatcher,
} satisfies jest.ExpectExtendMap;
expect.extend(expectExtendMap);
const extendedExpect = expect as jest.ExtendedExpect<typeof expectExtendMap>;

describe("transformer", () => {
  describe("ts-jest", () => {
      let testDirectory:string;
      beforeEach(() => {
        testDirectory = mkdtempSync(path.join(os.tmpdir(), "typedpathstest-"));
        createPackageJson();
        createExportingFile();
        installTarball();
      });

      function createPackageJson(){
          const packageJsonContent: Record<string, any> = {
            name: "tmp-proj",
            version: "1.0.0",
          };
          createFile( JSON.stringify(packageJsonContent, null, 2), "package.json",);
      }

      function createExportingFile(){

        const code = `
interface Thing{}
export const thing: Thing = {};
export class AClass {}
export type ExportedType = {};
export default class ExportDefault {};
`
        createFile(code, "exporting.ts");
      }

      function createFile(contents:string, fileName:string){
        const filePath = path.join(testDirectory,fileName);
        fs.writeFileSync(filePath, contents);
        return filePath;
      }

      function installTarball() {
          const tarball = path.join(__dirname,"..", `${pkg.name}-${pkg.version}.tgz`);
          // Install the packed tarball into the temp project
          const npmCmd = process.platform === "win32" ? "npm.cmd" : "npm";
          const install = spawnSync(npmCmd, ["i", tarball], {
            cwd: testDirectory,
            encoding: "utf8",
            shell: process.platform === "win32",
          });
          if (install.error) {
            throw install.error;
          }
          expect(install.status).toBe(0);
      }

      afterEach(() => {
        fs.rmSync(testDirectory, {recursive:true});
      });

      describe("transformToPath", () => {
        it("should error when using unsupported type argument - transformToPath", () => {
          const code = `import { transformToPath } from "ts-jest-typed-paths";
          jest.mock(transformToPath<boolean>());`;
          tsErrorTest(code, "Unsupported usage of type argument for transformToPath",[unsupportedTypeArgumentDiagnosticCode]);
        });

        it("should work with import { ExportedType } - transformToPath<ExportedType>", () => {
          transformToPathTest("ExportedType", `import { ExportedType } from "./exporting";`);
        })

        it("should work with default exports ", () => {
          transformToPathTest("DefaultExport", `import DefaultExport from "./exporting";`);
        })

        it("should work with import * as Ns - transformToPath<typeof Ns>", () => {
          transformToPathTest("typeof Ns", `import * as Ns from "./exporting";`);
        })

        it("should work with type alias to import", () => {
          transformToPathTest("Alias",`type Alias = import("./exporting").ExportedType;`);
        })

        it(`should work with <import("../imported/exporting").ExportedType>`, () => {
          transformToPathTest(`import("./exporting").ExportedType`);
        })

        function transformToPathTest(typeParam:string, importLine = ""){
          const createCode = (toTransform:boolean) => {
            const noOpArgument = toTransform ? `transformToPath<${typeParam}>()` : `"./exporting"`;
            return `import {transformToPath} from "ts-jest-typed-paths";
            ${importLine}

            const noop = (_:string) => {};
            const path = noop(${noOpArgument});
            `;

          }

          transformTestExpected(createCode(true),createCode(false));
        }
      })

      describe("jest transform", () => {
        // todo test that this applied to chaining
        it("should not transform non jest mock methods", () => {
          const code = `
          const notJest = {
              mock<T>(arg1:string, arg2: T){}
          }
          notJest.mock<string>('module', 'module');
          `;
          expect(doTransform(code)).toContain("notJest.mock('module', 'module')");
        });
        
        describe("should transform jest methods", () => {
          /*
            from jest-ast.ts

            const jestPropertyIdentifiers = [
              "doMock",
              "mock",
              "unstable_mockModule",
              "setMock",
              "createMockFromModule",
              "requireActual", 
              "requireMock",
              "genMockFromModule",
            ];
          */

          it("should transform jest.mock from type argument import", () => {
            transformJestMethodTest("mock");
          });

          it("should transform jest.requireActual from type argument import", () => {
            transformJestMethodTest("requireActual", "const actual = ");
          });

          it("should transform jest.requireMock from type argument import", () => {
            transformJestMethodTest("requireMock", "const mock = ");
          });

          it("should transform jest.doMock from type argument import", () => {
            transformJestMethodTest("doMock");
          });

          it("should transform jest.genMockFromModule from type argument import", () => {
            transformJestMethodTest("genMockFromModule", "const genMocked = ");
          });
          
          it("should transform jest.createMockFromModule from type argument import", () => {
            transformJestMethodTest("createMockFromModule", "const createMocked = ");
          });

          it("should transform jest.unstable_mockModule from type argument import", () => {
            const toTransformCode = `//@ts-ignore
    ${getJestPlaceholderMethodPrefix("unstable_mockModule")}, () => {
        return {
            thing:{},
            AClass: class {},
        };
    })`;
            transformPlaceholderTest(toTransformCode);
          });

        it("should transform jest call chain methods from type argument import", () => {
          const code = `jest.mock${typeofImportGenericParameter}("placeholder").mock${typeofImportGenericParameter}("placeholder")`;
          transformPlaceholderTest(code);
        });

        it("should transform nested jest methods from type argument import", () => {
            const code = `
    describe("transformer", () => {
        it("should work", () => {
            jest.doMock${typeofImportGenericParameter}("placeholder");
            const moreCode = "";
        });
    });`
            transformPlaceholderTest(code);
        });
        });

        describe("errors", () => {
          it("should error for unsupported type argument", () => {
            tsErrorTest(`jest.mock<boolean>("");`, "Unsupported usage of type argument for jest.mock",[unsupportedTypeArgumentDiagnosticCode]);
          })

          it("should error with warning when jest method without type argument or transformToPath ", () => {
            tsErrorTest(`jest.mock("");`, "jest.mock is not providing a type argument for transformation to moduleName argument", [jestMissingTypeArgumentDiagnosticCode]);
          })
        });

        it("should transform non generic jest methods when using transformToPath", () => {
          const code = `
          import {transformToPath} from "ts-jest-typed-paths";
          //@ts-ignore
          jest.dontMock(transformToPath${typeofImportGenericParameter}());`;

          const expected = `
          import {transformToPath} from "ts-jest-typed-paths";
          //@ts-ignore
          jest.dontMock("./exporting");`;

          transformTestExpected(code, expected);
        }); 

        it("should transform non generic jest methods when using transformToPath alias", () => {
          const code = `
          import {transformToPath as t} from "ts-jest-typed-paths";
          //@ts-ignore
          jest.dontMock(t${typeofImportGenericParameter}());`;

          const expected = `
          import {transformToPath} from "ts-jest-typed-paths";
          //@ts-ignore
          jest.dontMock("./exporting");`;

          transformTestExpected(code, expected);
        }); 
      });

      const typeofImportGenericParameter = `<typeof import("./exporting")>`

      function transformJestMethodTest(mockMethodName:string, prefix = ""){
        const toTransformCode = `${getJestPlaceholderMethodPrefix(mockMethodName, prefix)});`;
        transformPlaceholderTest(toTransformCode);
      }

      function getJestPlaceholderMethodPrefix(mockMethodName:string, prefix = ""){
        return `${prefix}jest.${mockMethodName}${typeofImportGenericParameter}("placeholder"`;
      }

      function transformTestExpected(toTransformCode:string, expectedTransformedCode:string){
        const toTransformPath = createFile(toTransformCode, "toTransform.ts");

        const expectedPath = createFile(expectedTransformedCode, "expectedTransformed.ts");
        
        expect(transformWithoutSourceMapping(toTransformCode, toTransformPath)).toEqual(
          transformWithoutSourceMapping(expectedTransformedCode, expectedPath)
        );
      }



      function errorTest(code:string, errorMessage:string){
        expect(() => doTransform(code)).toThrow(errorMessage);
      }

      function tsErrorTest(code:string, errorMessage:string, diagnosticCodes:number[]){
        // https://github.com/kulshekhar/ts-jest/blob/main/src/utils/ts-error.ts
        extendedExpect(() => doTransform(code)).toThrowTsError(errorMessage, diagnosticCodes);
      }

      function doTransform(code:string){
        const toTransformPath = createFile(code, "toTransform.ts");
        return transformWithoutSourceMapping(code, toTransformPath);
      }

      function transformWithoutSourceMapping(code:string, filePath:string){
          const tsJestTransformer = createCleanTsJestTransformer();
          const tsJestTransformOptions = {
            cacheFS: new Map(),
            config: {},
          } as TsJestTransformOptions;

          const result = tsJestTransformer.process(code, filePath, tsJestTransformOptions);
          return removeSourceMapping(result.code);

          function removeSourceMapping(code:string){
            const sourceMappingIndex = code.indexOf("//# sourceMappingURL=");
            return code.slice(0, sourceMappingIndex);
          }

          function createCleanTsJestTransformer(){
            const tsJestTransformerOptions: TsJestTransformerOptions = {
              astTransformers:{
                before: [
                  {
                    path: "<rootDir>/dist/index.js",
                  },
                ],
              }
            };
          
            (TsJestTransformer as any)._cachedConfigSets = [];
            return new TsJestTransformer(tsJestTransformerOptions);
          }
      }

      function transformPlaceholderTest(toTransformCode:string){
        transformTestExpected(toTransformCode, replaceWithImportPath(toTransformCode));
      }

      function replaceWithImportPath(code:string){
        return replacePlaceholderWithFilePath(code, "./exporting");
      }

      function replacePlaceholderWithFilePath(code:string, filePath:string){
        return code.replace("placeholder", filePath);
      }
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
