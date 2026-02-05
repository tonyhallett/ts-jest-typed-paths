import { TsJestTransformer, TsJestTransformerOptions, TsJestTransformOptions } from "ts-jest";
import extendedExpect from "./extendedExpect";
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
  });

  afterEach(() => {
    tempDependentProject.cleanUp();
  });

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
            "Unsupported usage of type argument for mock",
            [10000],
          );
        });

        it("should error with warning when jest method without type argument or transformToModuleName ", () => {
          tsErrorTest(
            `jest.mock("");`,
            "jest method mock is not providing a type argument for transformation to moduleName argument",
            [1001],
          );
        });
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
