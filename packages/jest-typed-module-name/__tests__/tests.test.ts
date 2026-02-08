import ts from "typescript";
import { createJestTransformerFactory } from "jest-typed-module-name";
import { transformerFactoryExpectedTransform } from "test-utils";

describe("jest-typed-module-name", () => {
  const raiseDiagnostic = jest.fn();
  let transformerFactory: ts.TransformerFactory<ts.SourceFile>;
  beforeEach(() => {
    raiseDiagnostic.mockClear();
    transformerFactory = createJestTransformerFactory(ts, raiseDiagnostic, "implementation");
  });

  // from jestPropertyIdentifiers.ts

  it("should transform jest.mock with type argument to module name", () => {
    const source = `jest.mock<typeof import('./myModule')>('');`;
    const expectedTransformed = `jest.mock<typeof import('./myModule')>("./myModule");`;
    transformerFactoryExpectedTransform(source, expectedTransformed, transformerFactory);
  });

  it("should transform jest.setMock with type argument to module name", () => {
    const source = `jest.setMock<typeof import('./myModule')>('', {});`;
    const expectedTransformed = `jest.setMock<typeof import('./myModule')>("./myModule", {});`;
    transformerFactoryExpectedTransform(source, expectedTransformed, transformerFactory);
  });

  it("should transform jest.doMock with type argument to module name", () => {
    const source = `jest.doMock<typeof import('./myModule')>('');`;
    const expectedTransformed = `jest.doMock<typeof import('./myModule')>("./myModule");`;
    transformerFactoryExpectedTransform(source, expectedTransformed, transformerFactory);
  });

  it("should transform jest.requireActual with type argument to module name", () => {
    const source = `const actual = jest.requireActual<typeof import('./myModule')>('');`;
    const expectedTransformed = `const actual = jest.requireActual<typeof import('./myModule')>("./myModule");`;
    transformerFactoryExpectedTransform(source, expectedTransformed, transformerFactory);
  });

  it("should transform jest.requireMock with type argument to module name", () => {
    const source = `const mock = jest.requireMock<typeof import('./myModule')>('');`;
    const expectedTransformed = `const mock = jest.requireMock<typeof import('./myModule')>("./myModule");`;
    transformerFactoryExpectedTransform(source, expectedTransformed, transformerFactory);
  });

  it("should transform createMockFromModule with type argument to module name", () => {
    const source = `const mockFromModule = jest.createMockFromModule<typeof import('./myModule')>('');`;
    const expectedTransformed = `const mockFromModule = jest.createMockFromModule<typeof import('./myModule')>("./myModule");`;
    transformerFactoryExpectedTransform(source, expectedTransformed, transformerFactory);
  });

  it("should transform ( deprecated ) genMockFromModule with type argument to module name", () => {
    const source = `const mockFromModule = jest.genMockFromModule<typeof import('./myModule')>('');`;
    const expectedTransformed = `const mockFromModule = jest.genMockFromModule<typeof import('./myModule')>("./myModule");`;
    transformerFactoryExpectedTransform(source, expectedTransformed, transformerFactory);
  });

  it("shouuld transform unstable_mockModule with type argument to module name", () => {
    const source = `
        jest.unstable_mockModule<typeof import('./myModule')>('', () => ({
    default: () => 'default implementation',
    namedFn: () => 'namedFn implementation',
  }));
    `;
    const expectedTransformed = `
        jest.unstable_mockModule<typeof import('./myModule')>("./myModule", () => ({
    default: () => 'default implementation',
    namedFn: () => 'namedFn implementation',
  }));
    `;
    transformerFactoryExpectedTransform(source, expectedTransformed, transformerFactory);
  });

  it("should work with chaining", () => {
    const source = `jest.mock<typeof import('./myModule')>('').mock<typeof import('./myModule')>('')`;
    const expectedTransformed = `jest.mock<typeof import('./myModule')>("./myModule").mock<typeof import('./myModule')>("./myModule")`;
    transformerFactoryExpectedTransform(source, expectedTransformed, transformerFactory);
  });

  it("should error with warning when jest method without type argument or transformToModuleName ", () => {
    const source = `jest.mock('');`;
    const sourceFile = transformerFactoryExpectedTransform(
      source,
      source,
      transformerFactory,
    ).sourceFile;
    expect(raiseDiagnostic).toHaveBeenCalledWith(
      expect.objectContaining({
        category: ts.DiagnosticCategory.Warning,
        code: 1001,
        file: sourceFile,
        start: 5,
        length: 8,
        messageText:
          "jest method mock is not providing a type argument for transformation to moduleName argument",
      } satisfies Partial<ts.Diagnostic>),
    );
  });

  it("should not error with warning when no type argument but transformToModuleName is provided", () => {
    const source = `
    import ttmn from "implementation";
    // no generic when using jest.globals
    jest.setMock(ttmn<typeof import('./myModule')>());`;
    const expectedTransformed = `
    import ttmn from "implementation";
    // no generic when using jest.globals
    jest.setMock("./myModule");
    `;
    transformerFactoryExpectedTransform(source, expectedTransformed, transformerFactory);
    expect(raiseDiagnostic).not.toHaveBeenCalled();
  });

  it("should not transform methods with jest method names if not called on jest", () => {
    const source = `notJest.mock<typeof import('./myModule')>('notjest').mock<typeof import('./myModule')>('notjest');`;
    transformerFactoryExpectedTransform(source, source, transformerFactory);
  });

  it("should only transform jest methods with specific names", () => {
    const source = `jest.unknown<typeof import('./myModule')>('');`;
    transformerFactoryExpectedTransform(source, source, transformerFactory);
    expect(raiseDiagnostic).not.toHaveBeenCalled();
  });
});
