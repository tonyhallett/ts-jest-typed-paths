import { TsJestTransformer, TsJestTransformerOptions, TsJestTransformOptions } from "ts-jest";
import * as fs from "fs";
import * as path from "path";
import { unsupportedTypeArgumentDiagnosticCode } from "../../transform-to-path/src/diagnostics";
import { jestMissingTypeArgumentDiagnosticCode } from "../../jest-typed-module-name/src/index";
import extendedExpect from "./extendedExpect";
import { packageName } from "../../transform-to-path/src/package-name";
import { createTempDependentProject, TempDependentProject } from "test-utils";

describe("transformer", () => {
  let tempDependentProject: TempDependentProject;
  beforeEach(() => {
    tempDependentProject = createTempDependentProject({
      devDependencies: {
        typescript: "^5.6.3",
        "@types/jest": "^29.5.14",
      },
    });
    addMockTransformToPathDependency();
  });

  afterEach(() => {
    tempDependentProject.cleanUp();
  });

  function addMockTransformToPathDependency() {
    const nodeModulesPath = path.join(tempDependentProject.testDirectory, "node_modules");
    const transformToPathPackagePath = path.join(nodeModulesPath, packageName);
    fs.mkdirSync(transformToPathPackagePath, { recursive: true });
    const transformToPathPackageJson = {
      name: "transform-to-path",
      version: "1.0.0",
      main: "./dist/index.js",
      types: "./dist/index.d.ts",
    };
    fs.writeFileSync(
      path.join(transformToPathPackagePath, "package.json"),
      JSON.stringify(transformToPathPackageJson, null, 2),
    );
    const distPath = path.join(transformToPathPackagePath, "dist");
    fs.mkdirSync(distPath, { recursive: true });
    const indexDtsContent = `export declare function transformToPath<T>(): string;`;
    fs.writeFileSync(path.join(distPath, "index.d.ts"), indexDtsContent);
  }

  describe("ts-jest", () => {
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
    });`;
          transformPlaceholderTest(code);
        });
      });

      describe("errors", () => {
        it("should error for unsupported type argument", () => {
          tsErrorTest(
            `jest.mock<boolean>("");`,
            "Unsupported usage of type argument for jest.mock",
            [unsupportedTypeArgumentDiagnosticCode],
          );
        });

        it("should error with warning when jest method without type argument or transformToPath ", () => {
          tsErrorTest(
            `jest.mock("");`,
            "jest.mock is not providing a type argument for transformation to moduleName argument",
            [jestMissingTypeArgumentDiagnosticCode],
          );
        });
      });

      // see ts-jest-integration-test for using the export default transformToPath from ts-jest-typed-module-name
      it("should transform non generic jest methods when using transformToPath from transform-to-path", () => {
        const toTransformCode = `
          import {transformToPath} from "${packageName}";
          //@ts-ignore
          jest.dontMock(transformToPath${typeofImportGenericParameter}());`;

        const toTransformPath = tempDependentProject.createFile(toTransformCode, "toTransform.ts");

        const transformed = transformWithoutSourceMapping(toTransformCode, toTransformPath);

        expect(transformed).toContain(`jest.dontMock("./exporting")`);
      });
    });

    const typeofImportGenericParameter = `<typeof import("./exporting")>`;

    function transformJestMethodTest(mockMethodName: string, prefix = "") {
      const toTransformCode = `${getJestPlaceholderMethodPrefix(mockMethodName, prefix)});`;
      transformPlaceholderTest(toTransformCode);
    }

    function getJestPlaceholderMethodPrefix(mockMethodName: string, prefix = "") {
      return `${prefix}jest.${mockMethodName}${typeofImportGenericParameter}("placeholder"`;
    }

    function transformTestExpected(toTransformCode: string, expectedTransformedCode: string) {
      const toTransformPath = tempDependentProject.createFile(toTransformCode, "toTransform.ts");

      const expectedPath = tempDependentProject.createFile(
        expectedTransformedCode,
        "expectedTransformed.ts",
      );
      const transformed = transformWithoutSourceMapping(toTransformCode, toTransformPath);
      const expected = transformWithoutSourceMapping(expectedTransformedCode, expectedPath);
      expect(transformed).toEqual(expected);
    }

    function tsErrorTest(code: string, errorMessage: string, diagnosticCodes: number[]) {
      // https://github.com/kulshekhar/ts-jest/blob/main/src/utils/ts-error.ts
      extendedExpect(() => doTransform(code)).toThrowTsError(errorMessage, diagnosticCodes);
    }

    function doTransform(code: string) {
      const toTransformPath = tempDependentProject.createFile(code, "toTransform.ts");
      return transformWithoutSourceMapping(code, toTransformPath);
    }

    function transformWithoutSourceMapping(code: string, filePath: string) {
      const tsJestTransformer = createCleanTsJestTransformer();
      const tsJestTransformOptions = {
        cacheFS: new Map(),
        config: {},
      } as TsJestTransformOptions;

      const result = tsJestTransformer.process(code, filePath, tsJestTransformOptions);
      return removeSourceMapping(result.code);

      function removeSourceMapping(code: string) {
        const sourceMappingIndex = code.indexOf("//# sourceMappingURL=");
        return code.slice(0, sourceMappingIndex);
      }

      function createCleanTsJestTransformer() {
        const tsJestTransformerOptions: TsJestTransformerOptions = {
          astTransformers: {
            before: [
              {
                path: "<rootDir>/dist/transformer.js",
              },
            ],
          },
        };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (TsJestTransformer as any)._cachedConfigSets = [];
        return new TsJestTransformer(tsJestTransformerOptions);
      }
    }

    function transformPlaceholderTest(toTransformCode: string) {
      transformTestExpected(toTransformCode, replaceWithImportPath(toTransformCode));
    }

    function replaceWithImportPath(code: string) {
      return replacePlaceholderWithFilePath(code, "./exporting");
    }

    function replacePlaceholderWithFilePath(code: string, filePath: string) {
      return code.replace("placeholder", filePath);
    }
  });
});
