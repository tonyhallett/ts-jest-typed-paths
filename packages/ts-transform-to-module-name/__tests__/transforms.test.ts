import { ts } from "@ts-morph/bootstrap";
import { transformToModuleNameFactory } from "ts-transform-to-module-name";
import { TransformerFn, transformStringAsync } from "./ts-morph-transform";

type BuiltTs = (typeof transformToModuleNameFactory)["arguments"][0];

const packageName = "ts-transform-to-module-name";

describe("transform replaces transformToModuleName with relative path of the generic parameter type import", () => {
  const raiseDiagnostic = jest.fn();
  const exportingModuleName = "./some-module";
  const typeExportingModuleName = "./type-export-module";
  const getTransformToModuleNameImport = (alias: string) => {
    const aliasPart = alias ? ` as ${alias}` : "";

    return `import { transformToModuleName ${aliasPart} } from "${packageName}";`;
  };
  beforeEach(() => {
    raiseDiagnostic.mockReset();
  });

  it("should error when using unsupported type argument - transformToModuleName", async () => {
    const code = createCodeToTransform("boolean");
    await transformTest(code);
    expect(raiseDiagnostic).toHaveBeenCalledTimes(1);
    const unsupportedTypeArgumentDiagnosticCode = 10000;
    const expectedDiagnostic: Partial<ts.Diagnostic> = {
      code: unsupportedTypeArgumentDiagnosticCode,
      messageText: "Unsupported usage of type argument for transformToModuleName",
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

  it("should work with import { ExportedType } - transformToModuleName<ExportedType>", () => {
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

  it("should work with import * as Ns - transformToModuleName<typeof Ns>", () => {
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

  it("should work with aliased transformToModuleName import", () => {
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
    transformToModuleNameAlias: string = "",
  ): string {
    const transformToModuleNameName = transformToModuleNameAlias || "transformToModuleName";
    return `${getTransformToModuleNameImport(transformToModuleNameAlias)}
            ${additionalImports}
            const noop = (str:string)=>str;
            noop(${transformToModuleNameName}<${typeArgument}>());
        `;
  }
  async function expectsTransformTest(
    codeToTransform: string,
    moduleNameIfExportsTransformToModuleName?: string,
  ) {
    const result = await transformTest(codeToTransform, moduleNameIfExportsTransformToModuleName);

    expect(raiseDiagnostic).not.toHaveBeenCalled();
    expect(result).toContain(`noop("${exportingModuleName}");`);
  }

  async function transformTest(
    codeToTransform: string,
    moduleNameIfExportsTransformToModuleName?: string,
  ) {
    const transformer: TransformerFn = () => {
      return transformToModuleNameFactory(
        ts as unknown as BuiltTs,
        raiseDiagnostic,
        undefined,
        moduleNameIfExportsTransformToModuleName,
      ) as unknown as ts.TransformerFactory<ts.SourceFile>;
    };

    return transformStringAsync(codeToTransform, {
      transforms: [transformer],
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
          content: `export function transformToModuleName<T>():string{ throw new Error("Marker fn"); }`,
        },
        {
          name: "additionalFactory",
          content: `export default function transformToModuleName<T>():string{ throw new Error("Marker fn"); }`,
        },
      ],
    });
  }
});
