import { transform, TransformFileOptions } from "ts-transformer-testing-library";
import { createProject, ts } from "@ts-morph/bootstrap";
import { transformToPathFactory } from "../src/transformToPathFactory";
import { packageName } from "../src/package-name";
import { unsupportedTypeArgumentDiagnosticCode } from "../src/diagnostics";

describe("transform replaces transformToPath with relative path of the generic parameter type import", () => {
  const raiseDiagnostic = jest.fn();
  const exportingModuleName = "./some-module";
  const typeExportingModuleName = "./type-export-module";
  const getTransformToPathImport = (alias: string) => {
    const aliasPart = alias ? ` as ${alias}` : "";

    return `import { transformToPath ${aliasPart} } from "${packageName}";`;
  };
  beforeEach(() => {
    raiseDiagnostic.mockReset();
  });

  it("should error when using unsupported type argument - transformToPath", async () => {
    const code = createCodeToTransform("boolean");
    await transformTest(code);
    expect(raiseDiagnostic).toHaveBeenCalledTimes(1);
    const expectedDiagnostic: Partial<ts.Diagnostic> = {
      code: unsupportedTypeArgumentDiagnosticCode,
      messageText: "Unsupported usage of type argument for transformToPath",
      category: ts.DiagnosticCategory.Error,
    };
    expect(raiseDiagnostic).toHaveBeenCalledWith(expect.objectContaining(expectedDiagnostic));
  });

  it("should work with typeof import as the generic parameter", async () => {
    const codeToTransform = createCodeToTransform(`typeof import("${exportingModuleName}")`);
    expectsTransformTest(codeToTransform);
  });

  it(`should work with <import("../imported/exporting").ExportedType>`, () => {
    const codeToTransform = createCodeToTransform(`import("${exportingModuleName}").ExportedType`);
    expectsTransformTest(codeToTransform);
  });

  it("should work with import { ExportedType } - transformToPath<ExportedType>", () => {
    const codeToTransform = createCodeToTransform(
      "ExportedType",
      `import { ExportedType } from "${exportingModuleName}";`,
    );
    expectsTransformTest(codeToTransform);
  });

  it("should work with default exports ", () => {
    const codeToTransform = createCodeToTransform(
      "DefaultExport",
      `import DefaultExport from "${exportingModuleName}";`,
    );
    expectsTransformTest(codeToTransform);
  });

  it("should work with import * as Ns - transformToPath<typeof Ns>", () => {
    const codeToTransform = createCodeToTransform(
      "typeof Ns",
      `import * as Ns from "${exportingModuleName}";`,
    );
    expectsTransformTest(codeToTransform);
  });

  it("should work with type alias to import", () => {
    const codeToTransform = createCodeToTransform(
      "Alias",
      `type Alias =import("${exportingModuleName}").ExportedType;`,
    );
    expectsTransformTest(codeToTransform);
  });

  it("should work with aliased transformToPath import", () => {
    const codeToTransform = createCodeToTransform(
      "ExportedType",
      `import { ExportedType } from "${exportingModuleName}";`,
      "tp",
    );
    expectsTransformTest(codeToTransform);
  });

  it("should work with type imports", async () => {
    const codeToTransform = createCodeToTransform(
      "IFace",
      `import type {IFace} from "${typeExportingModuleName}";`,
    );
    const transformed = await transformTest(codeToTransform);
    expect(raiseDiagnostic).not.toHaveBeenCalled();
    expect(transformed).toContain(`noop("${typeExportingModuleName}");`);
  });

  it("should work with additional transform factory", async () => {
    const codeToTransform = `import tp from "additionalFactory"
        const noop = (str:string)=>str;
            noop(tp<typeof import("${exportingModuleName}")>());
        `;
    expectsTransformTest(codeToTransform, "additionalFactory");
  });

  function createCodeToTransform(
    typeArgument: string,
    additionalImports: string = "",
    transformToPathAlias: string = "",
  ): string {
    const transformToPathName = transformToPathAlias || "transformToPath";
    return `${getTransformToPathImport(transformToPathAlias)}
            ${additionalImports}
            const noop = (str:string)=>str;
            noop(${transformToPathName}<${typeArgument}>());
        `;
  }
  async function expectsTransformTest(
    codeToTransform: string,
    moduleNameIfExportsTransformToPath?: string,
  ) {
    const result = await transformTest(codeToTransform, moduleNameIfExportsTransformToPath);

    expect(raiseDiagnostic).not.toHaveBeenCalled();
    expect(result).toContain(`noop("${exportingModuleName}");`);
  }

  async function transformTest(
    codeToTransform: string,
    moduleNameIfExportsTransformToPath?: string,
  ) {
    /*
            we create own ts-morph project ("@ts-morph/bootstrap": "^0.28.1",)
            as ts-transformer-testing-library is using version ^0.4.0 of ts-morph, that typescript version 
            is incompatible with the transform factory being tested.
            With the latest ts-morph there is still differences in the ts namespace hence ts as any.
            The project created also is different from the one created by ts-transformer-testing-library, 
            another cast.
        */

    const transformer: TransformFileOptions["transforms"][0] = () => {
      return transformToPathFactory(
        ts as unknown as (typeof transformToPathFactory)["arguments"][0],
        raiseDiagnostic,
        undefined,
        moduleNameIfExportsTransformToPath,
      );
    };
    const project = await createProject({ useInMemoryFileSystem: true });
    return transform(codeToTransform, {
      transforms: [transformer],
      project: project as unknown as (typeof transform)["arguments"][1]["project"],
      sources: [
        {
          path: `${exportingModuleName}.ts`,
          contents: `interface Thing{}
export const thing: Thing = {};
export class AClass {}
export type ExportedType = {};
export default class ExportDefault {};`,
        },
        {
          path: `${typeExportingModuleName}.ts`,
          contents: `interface IFace {}
export type { IFace };`,
        },
      ],
      mocks: [
        {
          name: packageName,
          content: `export function transformToPath<T>():string{ throw new Error("Marker fn"); }`,
        },
        {
          name: "additionalFactory",
          content: `export default function transformToPath<T>():string{ throw new Error("Marker fn"); }`,
        },
      ],
    });
  }
});
